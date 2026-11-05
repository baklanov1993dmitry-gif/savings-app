/* Вход по отпечатку/лицу: passkey (WebAuthn) + расширение PRF даёт 32 секретных байта,
   ими обёрнут ключ данных. Работает только на https (или localhost). */
const Bio = (() => {
  const ok = () => !!(window.isSecureContext && window.PublicKeyCredential && navigator.credentials);
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));
  const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), unb = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const has = () => { try { return !!JSON.parse(LS.get('sv_pk') || 'null'); } catch (e) { return false; } };
  async function prf(id, salt) {
    const a = await navigator.credentials.get({ publicKey: { challenge: rnd(32), rpId: location.hostname, allowCredentials: id ? [{ type: 'public-key', id }] : [], userVerification: 'required', timeout: 60000, extensions: { prf: { eval: { first: salt } } } } });
    const r = a.getClientExtensionResults().prf; if (!r || !r.results || !r.results.first) throw new Error('NO_PRF');
    return { raw: new Uint8Array(r.results.first).slice(0, 32), id: a.rawId };
  }
  /** включить: создать passkey, получить PRF-ключ, привязать к хранилищу. Возвращает blob */
  async function enable() {
    const salt = rnd(32);
    const c = await navigator.credentials.create({ publicKey: { challenge: rnd(32), rp: { name: 'Мои накопления', id: location.hostname }, user: { id: rnd(16), name: 'savings', displayName: 'Мои накопления' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' }, timeout: 60000, extensions: { prf: {} } } });
    const { raw } = await prf(c.rawId, salt);
    const blob = await S.session.setPasskey(raw);
    LS.set('sv_pk', JSON.stringify({ id: b64(c.rawId), salt: b64(salt) })); return blob;
  }
  async function unlock() {
    const pk = JSON.parse(LS.get('sv_pk')), blob = JSON.parse(LS.get('sv_vault'));
    const { raw } = await prf(unb(pk.id), unb(pk.salt)); return Vault.unlockKey(blob, raw);
  }
  function disable() { const b = S.session.dropPasskey(); LS.del('sv_pk'); return b; }
  return { ok, has, enable, unlock, disable };
})();
