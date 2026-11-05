/* Vault: мастер-пароль -> PBKDF2 -> KEK; случайный DEK шифрует данные (AES-256-GCM).
   DEK обёрнут дважды: паролем и ключом восстановления. Пароль нигде не хранится. */
(function (g) {
  'use strict';
  const subtle = g.crypto.subtle;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const ITER_PW = 600000, ITER_REC = 100000;
  const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const rnd = n => g.crypto.getRandomValues(new Uint8Array(n));
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }

  async function kek(secret, salt, iter) {
    const base = await subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base,
      { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  }
  async function wrap(dek, k) { const iv = rnd(12); const w = await subtle.wrapKey('raw', dek, k, { name: 'AES-GCM', iv }); return { iv: b64(iv), w: b64(new Uint8Array(w)) }; }
  function unwrap(o, k) { return subtle.unwrapKey('raw', unb64(o.w), k, { name: 'AES-GCM', iv: unb64(o.iv) }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); }
  async function seal(dek, obj) {
    const iv = rnd(12);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, dek, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(new Uint8Array(ct)) };
  }
  async function open(dek, blob) {
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, dek, unb64(blob.ct));
    return JSON.parse(dec.decode(pt));
  }
  function makeRecovery() {
    const r = rnd(32); let s = '';
    for (let i = 0; i < 25; i++) s += B32[r[i] % 32];
    return s.match(/.{5}/g).join('-');
  }
  const normRec = c => String(c).toUpperCase().replace(/[^A-Z2-9]/g, '');

  const Vault = {
    ITER_PW,
    /** Создать хранилище. Возвращает {blob, recovery, session} */
    async create(password, data) {
      const dek = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const saltP = rnd(16), saltR = rnd(16), recovery = makeRecovery();
      const [kp, kr] = await Promise.all([kek(password, saltP, ITER_PW), kek(normRec(recovery), saltR, ITER_REC)]);
      const [wp, wr, body] = await Promise.all([wrap(dek, kp), wrap(dek, kr), seal(dek, data)]);
      const blob = { v: 1, iterP: ITER_PW, iterR: ITER_REC, saltP: b64(saltP), saltR: b64(saltR), wp, wr, ...body };
      return { blob, recovery, session: Vault._session(dek, blob) };
    },
    async unlock(blob, password) {
      const k = await kek(password, unb64(blob.saltP), blob.iterP);
      let dek; try { dek = await unwrap(blob.wp, k); } catch (e) { throw new Error('BAD_SECRET'); }
      return { session: Vault._session(dek, blob), data: await open(dek, blob) };
    },
    async unlockRecovery(blob, code) {
      const k = await kek(normRec(code), unb64(blob.saltR), blob.iterR);
      let dek; try { dek = await unwrap(blob.wr, k); } catch (e) { throw new Error('BAD_SECRET'); }
      return { session: Vault._session(dek, blob), data: await open(dek, blob) };
    },
    /** вход по сырому ключу (результат WebAuthn PRF, 32 байта) */
    async unlockKey(blob, raw) {
      if (!blob.wk) throw new Error('NO_PASSKEY');
      const k = await subtle.importKey('raw', raw, 'AES-GCM', false, ['wrapKey', 'unwrapKey']);
      let dek; try { dek = await unwrap(blob.wk, k); } catch (e) { throw new Error('BAD_SECRET'); }
      return { session: Vault._session(dek, blob), data: await open(dek, blob) };
    },
    _session(dek, blob) {
      const s = {
        blob,
        async save(data) { s.blob = { ...s.blob, ...(await seal(dek, data)), rev: (s.blob.rev || 0) + 1, ts: Date.now() }; return s.blob; },
        /** расшифровать чужой blob (с другого устройства) тем же ключом; если не подходит — BAD_SECRET */
        async openBlob(b) { try { return await open(dek, b); } catch (e) { throw new Error('BAD_SECRET'); } },
        /** привязать/отвязать ключ passkey */
        async setPasskey(raw) { const k = await subtle.importKey('raw', raw, 'AES-GCM', false, ['wrapKey', 'unwrapKey']); s.blob = { ...s.blob, wk: await wrap(dek, k) }; return s.blob; },
        dropPasskey() { const { wk, pk, ...r } = s.blob; s.blob = r; return s.blob; },
        async setPassword(newPw) {
          const salt = rnd(16); const k = await kek(newPw, salt, ITER_PW);
          s.blob = { ...s.blob, iterP: ITER_PW, saltP: b64(salt), wp: await wrap(dek, k) }; return s.blob;
        },
        async newRecovery() {
          const salt = rnd(16), code = makeRecovery(); const k = await kek(normRec(code), salt, ITER_REC);
          s.blob = { ...s.blob, iterR: ITER_REC, saltR: b64(salt), wr: await wrap(dek, k) }; return { code, blob: s.blob };
        },
      };
      return s;
    },
    /** 0..4 + подсказка */
    strength(pw) {
      let pool = 0; if (/[a-zа-яё]/.test(pw)) pool += 28; if (/[A-ZА-ЯЁ]/.test(pw)) pool += 28; if (/\d/.test(pw)) pool += 10; if (/[^\w\sа-яёА-ЯЁ]/.test(pw)) pool += 20; if (/\s/.test(pw)) pool += 5;
      const bits = pw.length * Math.log2(Math.max(pool, 1));
      const score = bits < 40 ? 0 : bits < 55 ? 1 : bits < 70 ? 2 : bits < 90 ? 3 : 4;
      return { score, bits: Math.round(bits) };
    },
  };
  g.Vault = Vault;
})(typeof globalThis !== 'undefined' ? globalThis : window);
