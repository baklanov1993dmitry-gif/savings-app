/* Синхронизация: зашифрованный blob в приватном GitHub-репозитории. Сервер видит только шифротекст.
   Слияние по элементам: у позиции/заметки есть метка u (время правки), удалённое помнится в tomb. */
const Sync = (() => {
  const API = 'https://api.github.com';
  const st = { state: 'off', msg: 'Выключена', t: 0 };
  let fp = {}, busy = false, again = false, timer = null;
  const cfg = () => S.data && S.data.settings.sync;
  const hdr = c => ({ Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' });
  const url = c => `${API}/repos/${c.repo}/contents/${c.path || 'vault.json'}`;
  const b64j = o => btoa(JSON.stringify(o));
  const unb = s => JSON.parse(atob(s.replace(/\s/g, '')));

  async function get(c) {
    const r = await fetch(url(c) + '?t=' + Date.now(), { headers: hdr(c), cache: 'no-store' });
    if (r.status === 404) return null;
    if (r.status === 401 || r.status === 403) throw new Error('Нет доступа (проверь токен)');
    if (!r.ok) throw new Error('GitHub ' + r.status);
    const j = await r.json(); return { sha: j.sha, blob: unb(j.content) };
  }
  async function put(c, blob, sha) {
    const r = await fetch(url(c), { method: 'PUT', headers: { ...hdr(c), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'sync', content: b64j(blob), ...(sha ? { sha } : {}) }) });
    if (r.status === 409 || r.status === 422) throw new Error('CONFLICT');
    if (r.status === 401 || r.status === 403) throw new Error('Нет доступа (проверь токен)');
    if (!r.ok) throw new Error('GitHub ' + r.status);
    return (await r.json()).content.sha;
  }

  const fpOf = x => { const { u, ...r } = x; return JSON.stringify(r); };
  const items = d => { const m = {}; d.positions.forEach(x => m['p:' + x.id] = x); d.notes.forEach(x => m['n:' + x.id] = x); (d.flows || []).forEach(x => m['f:' + x.id] = x); return m; };
  const snap = d => { const m = {}; const it = items(d); for (const k in it) m[k] = fpOf(it[k]); m.s = fpOf(d.settings); return m; };

  /* вызывать перед сохранением: ставит метки времени изменённым, помнит удалённое */
  function stamp(d) {
    const now = Date.now(), it = items(d); d.tomb = d.tomb || {};
    for (const k in it) { if (fp[k] !== fpOf(it[k])) it[k].u = now; delete d.tomb[k]; }
    if (fp.s !== fpOf(d.settings)) d.settings.u = now;
    for (const k in fp) if (k !== 's' && !it[k]) d.tomb[k] = now;
    for (const k in d.tomb) if (now - d.tomb[k] > 90 * 864e5) delete d.tomb[k];
    fp = snap(d);
  }
  function merge(a, b) {
    const out = JSON.parse(JSON.stringify(a)), ta = { ...(a.tomb || {}) };
    for (const k in (b.tomb || {})) ta[k] = Math.max(ta[k] || 0, b.tomb[k]);
    const A = items(a), B = items(b), P = [], N = [], F = [];
    for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const ia = A[k], ib = B[k]; const pick = !ia ? ib : !ib ? ia : ((ib.u || 0) > (ia.u || 0) ? ib : ia);
      if (ta[k] && ta[k] >= (pick.u || 0)) continue;
      (k[0] === 'p' ? P : k[0] === 'f' ? F : N).push(JSON.parse(JSON.stringify(pick)));
    }
    out.positions = P; out.notes = N; out.flows = F; out.tomb = ta;
    if ((b.settings.u || 0) > (a.settings.u || 0)) out.settings = { ...b.settings, autolock: a.settings.autolock };
    return out;
  }

  const set = (state, msg) => { st.state = state; st.msg = msg; if (state === 'ok') st.t = Date.now(); const e = document.getElementById('syncst'); if (e) e.textContent = text(); };
  const text = () => st.state === 'ok' ? 'Синхронизировано ' + new Date(st.t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : st.msg;

  async function run() {
    const c = cfg(); if (!c || !c.token || !S.session) return;
    if (busy) { again = true; return; } busy = true; set('busy', 'Синхронизация…');
    try {
      for (let n = 0; n < 3; n++) {
        const rem = await get(c); let sha = rem && rem.sha;
        if (rem && rem.sha !== LS.get('sv_sha')) {
          let rd; try { rd = await S.session.openBlob(rem.blob); } catch (e) { throw new Error('Репозиторий содержит чужое хранилище'); }
          migrate(rd); const before = JSON.stringify(S.data), m = merge(S.data, rd);
          if (JSON.stringify(m) !== before) { S.data = m; fp = snap(m); }
        }
        stamp(S.data); const b = await S.session.save(S.data); LS.set('sv_vault', JSON.stringify(b));
        try { const { wk, ...pub } = b; sha = await put(c, pub, sha); LS.set('sv_sha', sha); set('ok'); break; }
        catch (e) { if (e.message !== 'CONFLICT' || n === 2) throw e; }
      }
      if (document.getElementById('app') && S.data) { S.rc = false; S.fresh = false; render(); }
    } catch (e) { set('err', (navigator.onLine ? 'Ошибка: ' : 'Нет сети · ') + e.message); }
    busy = false; if (again) { again = false; queue(500); }
  }
  function queue(ms = 2500) { if (!cfg() || !cfg().token) return; clearTimeout(timer); timer = setTimeout(run, ms); }
  function init() { fp = snap(S.data); if (cfg() && cfg().token) { set('busy', 'Синхронизация…'); run(); } else set('off', 'Выключена'); }

  /* подключение: новое хранилище на втором устройстве (до входа) */
  async function fetchVault(c) { const r = await get(c); if (!r) throw new Error('В репозитории пока нет файла хранилища'); return r; }
  addEventListener('online', () => queue(300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(400); });
  return { init, stamp, queue, run, merge, text, fetchVault, st, get cfg() { return cfg(); } };
})();
