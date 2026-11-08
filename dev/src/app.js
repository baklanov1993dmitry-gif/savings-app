/* ===== состояние ===== */
const mem = {};
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; S.memOnly = true; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
};
const S = { mm: 'cards', nk: '', nnew: 'dec', fl: { cur: '', p: '', q: '', t: '', dis: false }, data: null, session: null, tab: 'home', filter: 'Все', q: '', range: '12', dmode: 'type', memOnly: false, recoveryFlow: false, fc: true, hday: null, fresh: true, rc: false, idleAt: 0 };
const $app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const num = s => { const v = Number(String(s).replace(/\s/g, '').replace(',', '.')); return isNaN(v) ? null : v; };

const ICO = {
  swap: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
  grid: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-9M22 20H2"/>',
  lock: '<path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="4.5" y="11" width="15" height="10" rx="2.5"/><path d="M12 15v3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 10h18M8 2.5v4M16 2.5v4"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  down: '<path d="M12 4v12M6 12l6 6 6-6"/>', up: '<path d="M12 20V8M6 12l6-6 6 6"/>', xls: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8l8 8M16 8l-8 8"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICO[n]}</svg>`;
const typeColor = t => { const i = TYPES.indexOf(t); return `var(--c${(i < 0 ? (t.length % 7) : i) + 1})`; };

/* ===== модель ===== */
const newData = demo => ({ v: 1, positions: demo ? makeDemo().positions : [], notes: demo ? makeDemo().notes : [], flows: [], settings: { rates: { KZT: 0.16, USD: 82 }, autolock: 3, hide: false, offers: demo ? makeOffers() : [], goal: demo ? { name: 'Накопить к концу года', amount: 4500000, date: todayISO().slice(0, 4) + '-12-31' } : null } });
const spreadOf = c => (S.data.settings.spread && S.data.settings.spread[c]) || 0;
const rateOf = (c, d) => c === 'RUB' ? 1 : Math.max(0, (d ? FX.at(c, d) : (S.data.settings.rates[c] || 0)) - spreadOf(c));
const act = () => S.data.positions.filter(p => !p.archived && !p.excl);
const rubOf = (p, d) => lastAmt(p, d) * rateOf(p.cur, d);
function totals() {
  const by = { RUB: 0, KZT: 0, USD: 0 }; let rub = 0;
  for (const p of act()) { const a = lastAmt(p); by[p.cur] = (by[p.cur] || 0) + a; rub += a * rateOf(p.cur); }
  return { by, rub };
}
const inTot = () => S.data.positions.filter(p => !p.excl);
const totalAt = d => inTot().reduce((s, p) => s + rubOf(p, d), 0);
function series() {
  const all = [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].sort();
  let ds = all; if (S.range !== 'all') { const cut = addDays(todayISO(), -Number(S.range) * 30); ds = all.filter(d => d >= cut); if (ds.length < 2) ds = all; }
  return ds.map(t => ({ t, v: totalAt(t) }));
}
function events() {
  const ev = [];
  for (const p of act()) { if (p.close) ev.push({ d: p.close, k: 'close', p }); if (p.reopen) ev.push({ d: p.reopen, k: 'reopen', p }); }
  return ev.map(e => ({ ...e, n: daysTo(e.d) })).filter(e => e.k === 'close' || e.n >= -30).sort((a, b) => a.d < b.d ? -1 : 1);
}
let saveChain = Promise.resolve();
function persist() {
  saveChain = saveChain.then(async () => { try { if (!S.session) return; Sync.stamp(S.data); const b = await S.session.save(S.data); LS.set('sv_vault', JSON.stringify(b)); Sync.queue(); } catch (e) { toast('Не удалось сохранить: ' + e.message); } });
  return saveChain;
}

/* ===== мелочи UI ===== */
function toast(t, ms = 2600) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), ms); }
const money = (n, c) => `<span class="money">${fmt(n, c)}</span>`;
function modal(html, onMount, id = 'ov') {
  closeModal(id, true); const ov = document.createElement('div'); ov.className = 'ov'; ov.id = id;
  ov.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`; document.body.appendChild(ov);
  ov.addEventListener('mousedown', e => { if (e.target === ov && !ov.dataset.sticky) closeModal(id); });
  bindSheetDrag(ov); if (onMount) onMount(ov); return ov;
}
function ask(text, okLabel = 'Да', danger = false) {
  return new Promise(res => {
    const ov = modal(`<h3>${esc(text)}</h3><div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-x="0">Отмена</button><button class="btn ${danger ? 'bad' : 'pri'}" data-x="1">${okLabel}</button></div>`, ov => {
    ov.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) { e.stopPropagation(); closeModal('ov2'); res(b.dataset.x === '1'); } });
    }, 'ov2');
  });
}

/* ===== экраны входа ===== */
function gate(inner) { $app.className = ''; $app.innerHTML = `<div class="gate"><div class="box"><div class="lockbadge">${ic('lock')}</div>${inner}</div></div>`; }
function meterHTML(sc) { const cols = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--ok)', 'var(--ok)']; return [0, 1, 2, 3].map(i => `<i style="background:${sc > i ? cols[sc] : 'var(--line)'}"></i>`).join(''); }

function renderSetup() {
  gate(`<h1>Мои накопления</h1><p class="mut sm">Данные шифруются на этом устройстве. Придумай мастер-пароль — его нигде не хранят, и восстановить его без ключа нельзя.</p>
  <form id="f" class="col" autocomplete="off">
    <label class="f">Мастер-пароль (лучше фраза из 4–5 слов)<input class="inp" id="p1" type="password" autocomplete="new-password"></label>
    <div class="meter" id="mt">${meterHTML(0)}</div><div class="sm mut" id="mh">минимум 10 символов</div>
    <label class="f">Повтори пароль<input class="inp" id="p2" type="password" autocomplete="new-password"></label>
    <label class="row sm"><input type="checkbox" id="demo"> Заполнить вымышленными демо-данными (потом очистишь)</label>
    <div class="err" id="er"></div><button class="btn pri" id="go">Создать защищённое хранилище</button></form>`);
  const p1 = $('#p1'); p1.focus();
  p1.addEventListener('input', () => { const s = Vault.strength(p1.value); $('#mt').innerHTML = meterHTML(p1.value ? s.score : 0); $('#mh').textContent = p1.value ? `${['слабый', 'так себе', 'нормальный', 'хороший', 'отличный'][s.score]} · ~${s.bits} бит` : 'минимум 10 символов'; });
  $('#f').addEventListener('submit', async e => {
    e.preventDefault(); const a = p1.value, b = $('#p2').value, er = $('#er');
    if (a.length < 10) return er.textContent = 'Слишком короткий: нужно минимум 10 символов';
    if (Vault.strength(a).score < 2) return er.textContent = 'Пароль слабоват — добавь слов или символов';
    if (a !== b) return er.textContent = 'Пароли не совпадают';
    $('#go').disabled = true; $('#go').textContent = 'Шифрую…'; await new Promise(r => setTimeout(r, 30));
    const data = newData($('#demo').checked);
    const r = await Vault.create(a, data); S.session = r.session; S.data = data; LS.set('sv_vault', JSON.stringify(r.blob));
    renderRecovery(r.recovery, () => startApp());
  });
}
function renderRecovery(code, done) {
  gate(`<h1>Ключ восстановления</h1><p class="mut sm">Если забудешь мастер-пароль — только этот ключ вернёт доступ. Запиши на бумагу и убери в сейф. В приложении он больше не покажется.</p>
  <div class="reccode">${code}</div>
  <div class="row" style="margin:12px 0"><button class="btn grow" id="cp">Скопировать</button><button class="btn grow" id="pr">Распечатать</button></div>
  <label class="row sm" style="margin-bottom:12px"><input type="checkbox" id="ok"> Я сохранил ключ в надёжном месте</label>
  <button class="btn pri" id="go" style="width:100%" disabled>Продолжить</button>`);
  $('#ok').onchange = e => $('#go').disabled = !e.target.checked;
  $('#cp').onclick = () => { navigator.clipboard?.writeText(code).then(() => toast('Скопировано'), () => toast('Выдели и скопируй вручную')); };
  $('#pr').onclick = () => { const w = window.open('', '_blank'); if (w) { w.document.write(`<pre style="font:700 28px monospace;margin:60px">Ключ восстановления «Мои накопления»\n\n${code}\n\nХранить в сейфе. Не фотографировать.</pre>`); w.print(); } };
  $('#go').onclick = done;
}
function openConnect() {
  modal(`<h3>Подключить хранилище</h3><p class="sm mut">Скачаю зашифрованный файл из репозитория. Дальше войдёшь тем же мастер-паролем.</p><form id="cf" class="col"><input class="inp" id="cr" placeholder="владелец/репозиторий" autocapitalize="off"><input class="inp" id="ct" type="password" placeholder="Токен GitHub" autocomplete="off"><div class="err" id="er"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-x="c">Отмена</button><button class="btn pri" id="cg">Подключить</button></div></form>`, ov => {
    ov.addEventListener('click', e => { if (e.target.closest('[data-x=c]')) closeModal(); });
    $('#cf', ov).addEventListener('submit', async e => {
      e.preventDefault(); const repo = $('#cr', ov).value.trim().replace(/^https?:\/\/github\.com\//, ''), token = $('#ct', ov).value.trim(), er = $('#er', ov);
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) return er.textContent = 'Нужны репозиторий и токен';
      $('#cg', ov).disabled = true; er.textContent = '';
      try { const r = await Sync.fetchVault({ repo, token, path: 'vault.json' }); LS.set('sv_vault', JSON.stringify(r.blob)); LS.del('sv_sha'); LS.del('sv_fails'); closeModal('ov', true); renderUnlock(); toast('Хранилище скачано — введи пароль'); }
      catch (x) { er.textContent = x.message; $('#cg', ov).disabled = false; }
    });
  });
}
const failDelay = () => { const n = +LS.get('sv_fails') || 0; return n < 3 ? 0 : Math.min(300, 2 ** (n - 2)); };
function renderUnlock(recMode = false) {
  gate(`<h1>Хранилище закрыто</h1><p class="mut sm">${recMode ? 'Введи ключ восстановления (25 символов)' : 'Введи мастер-пароль'}</p>
  <form id="f" class="col"><input class="inp" id="pw" type="${recMode ? 'text' : 'password'}" placeholder="${recMode ? 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' : 'Мастер-пароль'}" autocomplete="${recMode ? 'off' : 'current-password'}" autocapitalize="off">
  <div class="err" id="er"></div><button class="btn pri" id="go">Открыть</button>${!recMode && Bio.ok() && Bio.has() ? '<button type="button" class="btn" id="bio">Войти по отпечатку</button>' : ''}</form>
  <div class="row" style="justify-content:space-between;margin-top:14px"><a href="#" class="sm mut" id="alt">${recMode ? '← по паролю' : 'Забыл пароль?'}</a><a href="#" class="sm mut" id="rs">Сбросить всё</a></div><div style="margin-top:10px"><a href="#" class="sm mut" id="conn">Подключить хранилище с другого устройства</a></div>`);
  $('#pw').focus();
  if ($('#bio')) $('#bio').onclick = async () => { try { const r = await Bio.unlock(); S.session = r.session; S.data = r.data; LS.del('sv_fails'); startApp(); } catch (x) { $('#er').textContent = 'Отпечаток не сработал — введи пароль'; } };
  $('#conn').onclick = e => { e.preventDefault(); openConnect(); };
  $('#alt').onclick = e => { e.preventDefault(); renderUnlock(!recMode); };
  $('#rs').onclick = async e => { e.preventDefault(); if (await ask('Стереть зашифрованное хранилище с этого устройства? Без файла-копии данные пропадут навсегда.', 'Стереть', true)) { LS.del('sv_vault'); LS.del('sv_fails'); renderSetup(); } };
  $('#f').addEventListener('submit', async e => {
    e.preventDefault(); const er = $('#er'), val = $('#pw').value; if (!val) return;
    const wait = Math.ceil(((+LS.get('sv_failt') || 0) + failDelay() * 1000 - Date.now()) / 1000);
    if (wait > 0) return er.textContent = `Слишком много попыток. Подожди ${wait} с`;
    $('#go').disabled = true; $('#go').textContent = 'Проверяю…'; await new Promise(r => setTimeout(r, 30));
    try {
      const blob = JSON.parse(LS.get('sv_vault'));
      const r = recMode ? await Vault.unlockRecovery(blob, val) : await Vault.unlock(blob, val);
      S.session = r.session; S.data = r.data; LS.del('sv_fails'); S.recoveryFlow = recMode; startApp();
    } catch (x) {
      LS.set('sv_fails', String((+LS.get('sv_fails') || 0) + 1)); LS.set('sv_failt', String(Date.now()));
      $('#go').disabled = false; $('#go').textContent = 'Открыть'; $('#er').textContent = x.message === 'BAD_SECRET' ? (recMode ? 'Ключ не подошёл' : 'Неверный пароль') : 'Ошибка: ' + x.message;
    }
  });
}

/* ===== автоблокировка ===== */
let idleT = null, hiddenAt = 0;
function bumpIdle() { clearTimeout(idleT); if (!S.data) return; const m = S.data.settings.autolock; S.idleAt = Date.now() + m * 60000; if (m > 0) idleT = setTimeout(lock, m * 60000); }
function lock() { clearTimeout(idleT); S.data = null; S.session = null; document.querySelectorAll('.ov').forEach(o => o.remove()); document.querySelectorAll('.toast').forEach(t => t.remove()); renderUnlock(); }
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, bumpIdle, { passive: true }));
document.addEventListener('visibilitychange', () => {
  if (!S.data) return; if (document.hidden) hiddenAt = Date.now();
  else { const m = S.data.settings.autolock; if (m > 0 && Date.now() - hiddenAt > m * 60000) lock(); }
});

/* ===== каркас ===== */
const TABS = [['home', 'Обзор', 'home'], ['money', 'Деньги', 'grid'], ['flow', 'Движение', 'swap'], ['dates', 'Даты', 'cal'], ['notes', 'Заметки', 'note'], ['an', 'Выводы', 'chart'], ['set', 'Настройки', 'gear']];
const TITLES = { home: 'Обзор', money: 'Деньги', flow: 'Движение средств', dates: 'Ближайшие даты', notes: 'Заметки', an: 'Выводы', set: 'Настройки' };
function startApp() {
  migrate(S.data); if (S.data.settings.fx && S.data.settings.fx.mig && !S.data.settings.fx.migUser) S.data.settings.fx.mig = false; S.fresh = true; S.tab = 'home'; bumpIdle(); render(); Sync.init(); FX.fetch().finally(() => FX.auto());
  if (S.recoveryFlow) { S.recoveryFlow = false; openChangePw(true); }
}
function render() {
  const d = S.data; if (!d) return;
  animNow = S.fresh || S.rc; const full = S.fresh;
  $app.className = d.settings.hide ? 'hide' : '';
  const urgent = events().filter(e => e.k === 'close' && e.n <= 7).length;
  if (S.tab === 'board' || S.tab === 'pos') { S.mm = S.tab === 'board' ? 'table' : 'cards'; S.tab = 'money'; }
  const view = { home: viewHome, money: viewMoney, flow: viewFlows, dates: viewDates, notes: viewNotes, an: viewConclusions, set: viewSet }[S.tab]();
  $app.innerHTML = `<div class="shell"><aside class="side"><div class="brand">${ic('lock')} Накопления</div>
    ${TABS.map(([k, t, i]) => `<button class="nv ${S.tab === k ? 'on' : ''}" data-a="tab" data-id="${k}">${ic(i)}${t}${k === 'dates' && urgent ? `<span class="tag bad" style="margin-left:auto">${urgent}</span>` : ''}</button>`).join('')}
    <div class="grow"></div><button class="nv" data-a="palette">${ic('search')}Поиск <kbd style="margin-left:auto">Ctrl K</kbd></button></aside>
    <main class="main ${full ? 'fresh' : ''} ${S.tab === 'money' && S.mm === 'table' ? 'wide' : ''}">${S.memOnly ? '<div class="banner">Хранилище браузера недоступно — данные живут только до закрытия вкладки. Сделай экспорт копии в Настройках.</div>' : ''}
    <div class="top"><h1>${TITLES[S.tab]}</h1><span class="tag" title="версия приложения">v4.17 · 08.11</span>
      <button class="ic" data-a="palette" title="Поиск и команды (Ctrl+K)">${ic('search')}</button>
      <button class="ic" data-a="hide" title="Скрыть суммы">${ic(d.settings.hide ? 'eyeoff' : 'eye')}</button>
      <button class="ic" data-a="lock" title="Заблокировать">${ic('lock')}</button></div>
    ${view}</main>
    <nav class="nav">${TABS.map(([k, t, i]) => `<button class="${S.tab === k ? 'on' : ''}" data-a="tab" data-id="${k}">${ic(i)}${t}</button>`).join('')}</nav></div>`;
  bindCharts(); if (full) countUp($app);
  S.fresh = false; S.rc = false; animNow = false;
}

/* ===== Обзор ===== */
function viewHome() {
  const d = S.data;
  if (!d.positions.length) return `<div class="card empty"><h2>Пока пусто</h2><p>Добавь первое место, импортируй свой Excel или загрузи демо-данные.</p><div class="row wrap" style="justify-content:center"><button class="btn pri" data-a="newPos">${ic('plus')}Добавить место</button><button class="btn" data-a="xlsx">${ic('xls')}Импорт из Excel</button><button class="btn" data-a="demo">Демо-данные</button></div></div>`;
  const T = todayISO(), t = totals(), now = t.rub, prev = totalAt(addDays(T, -30)), dl = prev > 0 ? (now - prev) / prev * 100 : null;
  const ds = [...new Set(d.positions.flatMap(p => p.history.map(h => h.d)))].sort(), dLast = ds[ds.length - 1] || T, dPrev = ds[ds.length - 2];
  const dS = dPrev ? now - totalAt(dPrev) : null, yAgo = totalAt(addDays(dLast, -365)), dY = yAgo > 0 ? now - yAgo : null;
  const sgn = v => (v >= 0 ? '+' : '−') + short(Math.abs(v));
  const hs = series().slice(-26), hv = hs.map(x => x.v);
  const area = (() => { if (hv.length < 2) return ''; const W = 600, H = 96, mn = Math.min(...hv) * 0.985, mx = Math.max(...hv), X = k => k / (hv.length - 1) * W, Y = v => H - 6 - (v - mn) / ((mx - mn) || 1) * (H - 16);
    const pth = hv.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''), lx = X(hv.length - 1), ly = Y(hv[hv.length - 1]);
    return `<svg class="h-area" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="hag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".5"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs><path d="${pth}L${W} ${H}L0 ${H}Z" fill="url(#hag)"/><path d="${pth}" fill="none" stroke="var(--acc)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><span class="h-dot" style="left:${lx / W * 100}%;top:${ly / H * 100}%"></span>`; })();
  const CN = { RUB: ['₽', 'Рубли'], KZT: ['₸', 'Тенге'], USD: ['$', 'Доллары'] };
  const kpi = ['RUB', 'KZT', 'USD'].filter(c => t.by[c]).map(c => {
    const a = t.by[c], p0 = curAt(c, addDays(T, -30)), dd = p0 > 0 ? (a - p0) / p0 * 100 : null, sh = now ? a * rateOf(c) / now * 100 : 0;
    return `<div class="ctile ct-${c}"><div class="row"><span class="ct-n grow">${CN[c][0]} ${CN[c][1]}</span><span class="ct-s">${sh.toFixed(0)}%</span></div><b class="ct-v money">${c === 'USD' ? nf.format(Math.round(a)) + ' $' : short(a) + ' ' + CN[c][0]}</b><div class="sm ct-m">${c !== 'RUB' ? '≈ <span class="money">' + short(a * rateOf(c)) + ' ₽</span> · ' : ''}${dd == null ? '' : `<span class="${dd >= 0 ? 'up' : 'dn'}">${dd >= 0 ? '▲' : '▼'}${Math.abs(dd).toFixed(1).replace('.', ',')}%</span> за 30 дн`}</div>${spark(curSeries(c), 'var(--cc-' + c + ')')}</div>`;
  }).join('');
  const k = FX.keys(), rt = `$ ${nf2.format(rateOf('USD'))} ₽${spreadOf('USD') ? ' (−' + spreadOf('USD') + ')' : ''} · ₽ ${nf2.format(1 / (S.data.settings.rates.KZT || 1))} ₸${k.key ? ' · ключевая ' + String(k.key).replace('.', ',') + '%' : ''}${k.base ? ' · НБ РК ' + String(k.base).replace('.', ',') + '%' : ''}`;
  const ev = events().filter(e => !(e.k === 'reopen' && e.n < 0)).slice(0, 4);
  return `<div class="card hero2"><div class="h-top"><div class="h-l"><div class="eyebrow">Капитал на ${fmtDate(dLast > T ? dLast : T)}</div><div class="gnum money">${moneyC(now, 'RUB')}</div>
    <div class="row wrap sm" style="gap:6px 12px">${dS != null ? `<span class="${dS >= 0 ? 'up' : 'dn'}"><b>${dS >= 0 ? '▲' : '▼'} <span class="money">${short(Math.abs(dS))}</span></b> с ${fmtDate(dPrev)}</span>` : ''}${dY != null ? `<span class="mut"><span class="money">${sgn(dY)}</span> за год (${dY >= 0 ? '+' : ''}${(dY / yAgo * 100).toFixed(0)}%)</span>` : ''}</div>
    <div class="sm mut" style="margin-top:4px">${rt}</div></div><div class="h-chart">${area}</div></div>
    <div class="ctiles">${kpi}</div></div>
  <div style="margin-top:14px">${insightCards()}</div>
  <div class="grid g2" style="margin-top:0">
    <div class="card"><div class="row wrap" style="margin-bottom:8px"><h3 class="grow">Динамика капитала</h3><button class="chip ${S.fc ? 'on' : ''}" data-a="fc">Прогноз</button><div class="seg">${[['6', '6м'], ['12', '12м'], ['all', 'Всё']].map(([k, l]) => `<button class="${S.range === k ? 'on' : ''}" data-a="range" data-id="${k}">${l}</button>`).join('')}</div></div>
      <div style="position:relative" id="cw">${lineChart(series())}</div>${S.fc ? '<div class="sm mut" style="margin-top:6px">Прогноз: простые проценты по ставке до даты закрытия, без новых пополнений.</div>' : ''}</div>
    <div class="card"><div class="row" style="margin-bottom:12px"><h3 class="grow">Структура</h3><div class="seg">${[['type', 'Тип'], ['cur', 'Валюта'], ['place', 'Место']].map(([k, l]) => `<button class="${S.dmode === k ? 'on' : ''}" data-a="dmode" data-id="${k}">${l}</button>`).join('')}</div></div>${donut()}</div></div>
  <div class="grid g2" style="margin-top:14px">${goalCard()}<div class="card"><h3 style="margin-bottom:8px">Прирост по годам</h3>${yearBars()}</div></div>
  <div class="card" style="margin-top:14px"><div class="row" style="margin-bottom:10px"><h3 class="grow">Календарь закрытий</h3><span class="mut sm">полгода вперёд</span></div>${heatmap()}</div>
  <div class="sect"><h2>Ближайшие даты</h2><button class="btn sm" data-a="tab" data-id="dates">Все</button></div>
  ${ev.length ? ev.map(evItem).join('') : '<div class="card empty">Дат пока нет — укажи «забрать до» в карточке места</div>'}`;
}

/* ===== Места ===== */
function viewMoney() {
  const by = {}; let T = 0;
  const tt = totals(); T = tt.rub; Object.assign(by, tt.by);
  const parts = ['RUB', 'KZT', 'USD'].filter(c => by[c] > 0).map(c => c === 'RUB' ? `${short(by[c])} ₽` : `${short(by[c])} ${SYM[c]} (≈ ${short(by[c] * rateOf(c))} ₽)`).join(' · ') + (S.data.positions.some(p => p.excl && !p.archived) ? ' · без мест «не в итогах»' : '');
  return `<div class="card" style="margin-bottom:12px"><div class="sm mut">Всего денег</div><div class="big money" style="font-size:26px;font-weight:700">${fmt(T, 'RUB')}</div><div class="sm mut">${parts || 'пока пусто'}</div></div>
  <p class="mut sm" style="margin:0 0 10px">Где лежат деньги и под какой процент. ${S.mm === 'table' ? 'Таблица показывает, как менялись суммы по датам.' : 'Нажми на место, чтобы открыть его карточку.'}</p>
  <div class="chips" style="margin-bottom:12px">${[['cards', 'Карточки'], ['table', 'Таблица по датам']].map(([k, t]) => `<button class="chip ${S.mm === k ? 'on' : ''}" data-a="mm" data-id="${k}">${t}</button>`).join('')}</div>
  ${S.mm === 'table' ? viewBoard() : viewPos()}`;
}
function viewPos() {
  const types = ['Все', ...new Set(S.data.positions.filter(p => !p.archived).map(p => p.type)), 'Архив'];
  return `<div class="row" style="margin-bottom:10px"><div class="grow" style="position:relative"><input class="inp" data-i="q" placeholder="Поиск по названию, условиям…" value="${esc(S.q)}" style="padding-left:38px"><span style="position:absolute;left:12px;top:11px;color:var(--mut)">${ic('search')}</span></div><button class="btn pri" data-a="newPos">${ic('plus')}<span class="sm">Добавить</span></button></div>
  <div class="chips" style="margin-bottom:12px">${types.map(t => `<button class="chip ${S.filter === t ? 'on' : ''}" data-a="filter" data-id="${esc(t)}">${esc(t)}</button>`).join('')}</div><div id="plist">${plist()}</div>`;
}
function plist() {
  const q = S.q.toLowerCase(); let L = S.data.positions.filter(p => S.filter === 'Архив' ? p.archived : (!p.archived && (S.filter === 'Все' || p.type === S.filter)));
  if (q) L = L.filter(p => (p.where + ' ' + p.type + ' ' + p.cond + ' ' + p.comment).toLowerCase().includes(q));
  L.sort((a, b) => rubOf(b) - rubOf(a)); if (!L.length) return '<div class="empty">Ничего не найдено</div>';
  return L.map((p, i) => {
    const n = p.close ? daysTo(p.close) : null, a = lastAmt(p), over = p.limit && a > p.limit, po = payoutOf(p);
    return `<div class="item" data-a="editPos" data-id="${p.id}" style="--i:${Math.min(i, 10)}"><div class="dot" style="background:${typeColor(p.type)}">${esc((p.where || '?')[0].toUpperCase())}</div>
    <div class="grow" style="min-width:0"><div class="t" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.where)}</div>
    <div class="sm mut">${esc(p.type)}${p.rate !== '' ? ` · ${p.rate}%` : ''}${p.close ? ` · до ${fmtDate(p.close)}` : ''}${po ? ` · к выплате ≈ ${money(po.total, p.cur)}` : ''}</div></div>
    ${over ? '<span class="tag warn">выше лимита</span>' : ''}
    ${n != null && n <= 30 && !p.archived ? `<span class="tag ${n <= 7 ? 'bad' : 'warn'}">${n < 0 ? 'просрочено' : n === 0 ? 'сегодня' : n + ' дн'}</span>` : ''}
    <div class="amt">${money(a, p.cur)}${p.cur !== 'RUB' ? `<div class="sm mut">≈ ${money(a * rateOf(p.cur), 'RUB')}</div>` : ''}</div></div>`;
  }).join('');
}

const nOrE = v => v === '' || v == null ? '' : (num(v) ?? '');
const posCond = f => ({ cap: f.get('cap') || '', rateOver: nOrE(f.get('rateOver')), promoTo: f.get('promoTo') || '', rateAfter: nOrE(f.get('rateAfter')), prolong: !!f.get('prolong') });
function posCalcText(f, hist) {
  const q = { rate: nOrE(f.get('rate')), limit: nOrE(f.get('limit')), open: f.get('open'), close: f.get('close'), ...posCond(f) }, cur = f.get('cur');
  const a = f.get('amt') === '' ? (hist.length ? lastAmt({ history: hist }) : 0) : num(f.get('amt')); const T = todayISO();
  if (!q.rate || !q.cap || !(a > 0)) return '<span class="mut">Укажи сумму, ставку и способ начисления — покажу расчёт.</span>';
  const to = q.close && q.close > T ? q.close : addDays(T, 365), g = grow(q, T, a, to), m = grow(q, T, a, addDays(T, 30));
  const inc = g.bal - a + g.acc + g.paid, mi = m.bal - a + m.acc + m.paid;
  return `За 30 дней ≈ <b class="money">+${fmt(mi, cur)}</b> · ${q.close && q.close > T ? 'к ' + fmtDate(q.close) : 'за год'} ≈ <b class="money">+${fmt(inc, cur)}</b>` + (g.paid ? ` (из них на другой счёт ${fmt(g.paid, cur)})` : '') + ` · на счёте будет ≈ <b class="money">${fmt(g.bal + g.acc, cur)}</b>` + `<div class="mut" style="margin-top:2px">Эффективная доходность ≈ ${(inc / a * 365 / Math.max(1, dnum(to) - dnum(T)) * 100).toFixed(2).replace('.', ',')}% годовых</div>`;
}
function openPlace(id) {
  const p = S.data.positions.find(z => z.id === id); if (!p) return;
  const a = lastAmt(p), po = payoutOf(p), n = p.close ? daysTo(p.close) : null, cp = typeof CAPS !== 'undefined' && CAPS.find(c => c[0] === (p.cap || ''));
  const hs = [...p.history].sort((x, y) => x.d < y.d ? -1 : 1).slice(-24), mx = Math.max(...hs.map(h => h.amt), 1);
  const spark = hs.length > 1 ? `<div class="pspark">${hs.map(h => `<i title="${fmtDate(h.d)}: ${esc(fmt(h.amt, p.cur))}" style="height:${Math.max(6, h.amt / mx * 100)}%"></i>`).join('')}</div><div class="sm mut" style="display:flex;justify-content:space-between"><span>${fmtDate(hs[0].d)}</span><span>${fmtDate(hs[hs.length - 1].d)}</span></div>` : '<div class="sm mut">Пока одна точка. Добавь ещё суммы в «Изменить», и тут появится динамика.</div>';
  const kv = (k, v) => v ? `<div class="pkv"><span>${k}</span><span>${v}</span></div>` : '';
  const cond = [kv('Ставка', p.rate !== '' && p.rate != null ? p.rate + '%' : ''), kv('Проценты', cp && p.cap ? esc(cp[1]) : ''), kv('Открыто', p.open ? fmtDate(p.open) : ''), kv('Забрать до', p.close ? fmtDate(p.close) + (n != null ? ` (через ${n} дн.)` : '') : ''), kv('К выплате', po ? '≈ ' + money(po.total, p.cur) : ''), kv('Снова можно с', p.reopen ? fmtDate(p.reopen) : '')].join('') + (p.cond ? `<div class="sm mut" style="white-space:pre-wrap;margin-top:6px">${esc(p.cond)}</div>` : '');
  const fl = (S.data.flows || []).filter(f => f.from === p.where || f.to === p.where).sort((x, y) => x.d < y.d ? 1 : -1);
  const flh = fl.length ? fl.slice(0, 6).map(f => { const t = flType(f), out = f.from === p.where; return `<div class="pkv"><span>${fmtDate(f.d)} · ${FLT[t]}${t === 'move' ? (out ? ' → ' + esc(f.to) : ' из ' + esc(f.from)) : ''}</span><span class="${out ? 'mi' : 'pl'}">${out ? '−' : '+'}${esc(fmt(f.amt, f.cur))}</span></div>`; }).join('') + (fl.length > 6 ? `<div class="sm mut">и ещё ${fl.length - 6}. Все в «Движении».</div>` : '') : '<div class="sm mut">Движений по этому месту нет.</div>';
  const nts = S.data.notes.filter(z => z.where === p.where).sort((x, y) => x.d < y.d ? 1 : -1);
  const nth = nts.length ? nts.map(z => `<div class="pkv" style="display:block"><span class="ntk nk-${z.kind || 'x'}" style="cursor:default">${NK[z.kind || '']}</span> <span class="sm mut">${fmtDate(z.d)}</span><div style="white-space:pre-wrap;margin-top:2px">${esc(z.text)}</div></div>`).join('') : '<div class="sm mut">Заметок нет.</div>';
  const html = `<div class="row" style="margin-bottom:8px"><div class="dot" style="background:${typeColor(p.type)}">${esc((p.where || '?')[0].toUpperCase())}</div><div class="grow"><h3 style="margin:0">${esc(p.where)}</h3><div class="sm mut">${esc(p.type)}${p.archived ? ' · в архиве' : ''}${p.excl ? ' · не в итогах' : ''}</div></div><button class="ic" data-x="close">${ic('x')}</button></div>
  <div class="card" style="margin-bottom:10px"><div class="big money" style="font-size:26px;font-weight:700">${money(a, p.cur)}</div>${p.cur !== 'RUB' ? `<div class="sm mut">≈ ${esc(fmt(rubOf(p), 'RUB'))}</div>` : ''}</div>
  <div class="pbox"><div class="pt">Динамика суммы</div>${spark}</div>
  <div class="pbox"><div class="pt">Условия</div>${cond || '<div class="sm mut">Условия не заполнены.</div>'}</div>
  <div class="pbox"><div class="pt">Движение (${fl.length})</div>${flh}</div>
  <div class="pbox"><div class="pt">Заметки (${nts.length})</div>${nth}<div class="row" style="margin-top:8px"><input class="inp grow" id="pnt" placeholder="Новая заметка к этому месту"><button class="btn sm" data-x="pnadd">${ic('plus')}</button></div></div>
  <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn pri" data-x="pedit">Изменить</button></div>`;
  modal(html, ov => ov.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
    if (x === 'close') closeModal();
    else if (x === 'pedit') { closeModal(); openPos(p.id); }
    else if (x === 'pnadd') { const t = $('#pnt', ov).value.trim(); if (!t) return toast('Напиши текст заметки'); S.data.notes.push({ id: uid(), d: todayISO(), text: t, kind: '', where: p.where }); await persist(); closeModal(); openPlace(p.id); }
  }));
}
function openPos(id) {
  const isNew = !id; const p = isNew ? { id: uid(), type: 'Банковский вклад', where: '', cur: 'RUB', rate: '', cap: 'end', rateOver: '', promoTo: '', rateAfter: '', prolong: false, cond: '', open: '', close: '', reopen: '', comment: '', limit: '', history: [], archived: false } : S.data.positions.find(x => x.id === id);
  const draft = { ...p, history: p.history.map(h => ({ ...h })) }, po = isNew ? null : payoutOf(p);
  const html = `<div class="row" style="margin-bottom:12px"><h3 class="grow">${isNew ? 'Новое место' : 'Место'}</h3><button class="ic" data-x="close">${ic('x')}</button></div>
  <form id="pf" class="col" autocomplete="off">
    <div class="grid g2" style="gap:10px"><label class="f">Тип<input class="inp" name="type" list="tl" value="${esc(draft.type)}"><datalist id="tl">${TYPES.map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>
    <label class="f">Где лежит<input class="inp" name="where" value="${esc(draft.where)}" required></label></div>
    <label class="f">Банк / группа (для панели; пусто — угадаю по названию)<input class="inp" name="bank" list="bl" value="${esc(draft.bank || '')}" placeholder="${esc(bankOf(draft))}"><datalist id="bl">${[...new Set(S.data.positions.map(bankOf))].map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>
    <div class="grid g3" style="gap:10px"><label class="f">Валюта<select class="inp" name="cur">${['RUB', 'KZT', 'USD'].map(c => `<option ${draft.cur === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="f">Текущая сумма<input class="inp" name="amt" inputmode="decimal" value="${draft.history.length ? lastAmt(draft) : ''}"></label>
    <label class="f">Ставка, %<input class="inp" name="rate" inputmode="decimal" value="${draft.rate}"></label></div>
    <div class="card col" style="gap:10px;padding:12px;background:var(--bg2, transparent)"><b class="sm">Условия начисления — по ним приложение считает суммы само</b>
    <label class="f">Как начисляются проценты<select class="inp" name="cap">${CAPS.map(([k, l]) => `<option value="${k}" ${(draft.cap || '') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="grid g2" style="gap:10px"><label class="f">Ставка действует до суммы<input class="inp" name="limit" inputmode="decimal" value="${draft.limit}" placeholder="например 1000000"></label><label class="f">Ставка на сумму свыше, %<input class="inp" name="rateOver" inputmode="decimal" value="${draft.rateOver ?? ''}" placeholder="например 10"></label></div>
    <div class="grid g2" style="gap:10px"><label class="f">Повышенная ставка до<input class="inp" type="date" name="promoTo" value="${draft.promoTo || ''}"></label><label class="f">Ставка после этой даты, %<input class="inp" name="rateAfter" inputmode="decimal" value="${draft.rateAfter ?? ''}"></label></div>
    <label class="row sm" style="gap:8px"><input type="checkbox" name="prolong" ${draft.prolong ? 'checked' : ''}> Автопролонгация на тот же срок (иначе после «забрать до» % не идут)</label>
    <div class="sm" id="pcalc"></div></div>
    <label class="f">Условия<textarea class="inp" name="cond">${esc(draft.cond)}</textarea></label>
    <div class="grid g3" style="gap:10px"><label class="f">Открыто<input class="inp" type="date" name="open" value="${draft.open}"></label>
    <label class="f">Забрать до<input class="inp" type="date" name="close" value="${draft.close}"></label>
    <label class="f">Снова можно с<input class="inp" type="date" name="reopen" value="${draft.reopen}"></label></div>
    <label class="row sm" style="gap:8px"><input type="checkbox" name="excl" ${draft.excl ? 'checked' : ''}> Не учитывать в итогах (как Реголит в твоей таблице)</label>
    <label class="f">Комментарий<textarea class="inp" name="comment">${esc(draft.comment)}</textarea></label>
    <div><div class="row" style="margin-bottom:4px"><b class="grow sm">История сумм</b></div><div id="hl"></div>
    <div class="row" style="margin-top:8px"><input class="inp" type="date" id="hd" value="${todayISO()}"><input class="inp" id="ha" inputmode="decimal" placeholder="сумма"><button type="button" class="btn sm" data-x="addh">${ic('plus')}</button></div></div>
    <div class="row wrap" style="margin-top:6px;justify-content:space-between"><div class="row wrap">${isNew ? '' : (draft.archived ? `<button type="button" class="btn sm" data-x="restore">Вернуть из архива</button>${holdBtn('удалить навсегда', 'del', 'bad sm', 1300)}` : holdBtn('в архив', 'arch', 'sm', 800))}</div>
    <button class="btn pri" type="submit">Сохранить</button></div></form>`;
  modal(html, ov => {
    const hl = $('#hl', ov);
    const pf = $('#pf', ov), drawC = () => { $('#pcalc', ov).innerHTML = posCalcText(new FormData(pf), draft.history); }; pf.addEventListener('input', drawC); pf.addEventListener('change', drawC); drawC();
    const drawH = () => { const hs = [...draft.history].sort((a, b) => a.d < b.d ? 1 : -1); hl.innerHTML = hs.length ? hs.slice(0, 40).map(h => `<div class="hist"><span class="grow">${fmtDate(h.d)}</span><b class="money">${fmt(h.amt, draft.cur)}</b><button type="button" class="ic" data-x="dh" data-d="${h.d}">${ic('x')}</button></div>`).join('') : '<div class="mut sm">Записей нет</div>'; };
    drawH();
    ov.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
      if (x === 'close') closeModal();
      else if (x === 'dh') { draft.history = draft.history.filter(h => h.d !== b.dataset.d); drawH(); }
      else if (x === 'addh') { const d = $('#hd', ov).value, a = num($('#ha', ov).value); if (!d || a == null) return; draft.history = draft.history.filter(h => h.d !== d); draft.history.push({ d, amt: a }); $('#ha', ov).value = ''; drawH(); }
      else if (x === 'restore') { const q = S.data.positions.find(z => z.id === p.id); q.archived = false; await persist(); closeModal(); render(); }
    });
    ov.addEventListener('holddone', async e => {
      const act = e.detail.act, q = S.data.positions.find(z => z.id === p.id); if (!q) return; const snap = JSON.stringify(q);
      if (act === 'arch') { q.history = q.history.filter(h => h.d !== todayISO()); q.history.push({ d: todayISO(), amt: 0 }); q.archived = true; await persist(); closeModal(); render(); undoToast('Место в архиве', async () => { const i = S.data.positions.findIndex(z => z.id === p.id); S.data.positions[i] = JSON.parse(snap); await persist(); render(); }); }
      else if (act === 'del') { S.data.positions = S.data.positions.filter(z => z.id !== p.id); await persist(); closeModal(); render(); undoToast('Место удалено', async () => { S.data.positions.push(JSON.parse(snap)); await persist(); render(); }); }
    });
    $('#pf', ov).addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target);
      Object.assign(draft, { type: f.get('type').trim() || 'Прочее', where: f.get('where').trim(), bank: (f.get('bank') || '').trim(), cur: f.get('cur'), cond: f.get('cond'), open: f.get('open'), close: f.get('close'), reopen: f.get('reopen'), comment: f.get('comment'), rate: f.get('rate') === '' ? '' : (num(f.get('rate')) ?? ''), limit: f.get('limit') === '' ? '' : (num(f.get('limit')) ?? ''), ...posCond(f), excl: !!f.get('excl') });
      const a = f.get('amt') === '' ? null : num(f.get('amt')); if (a != null && a !== lastAmt(draft)) { draft.history = draft.history.filter(h => h.d !== todayISO()); draft.history.push({ d: todayISO(), amt: a }); }
      draft.history.sort((x, y) => x.d < y.d ? -1 : 1);
      if (isNew) S.data.positions.push(draft); else Object.assign(S.data.positions.find(z => z.id === p.id), draft);
      await persist(); closeModal(); render();
    });
  });
}

/* ===== Даты ===== */
function evItem(e) {
  const p = e.p, cls = e.k === 'reopen' ? (e.n <= 0 ? 'ok' : '') : (e.n < 0 || e.n <= 7 ? 'bad' : e.n <= 30 ? 'warn' : '');
  const lab = e.k === 'close' ? (e.n < 0 ? 'Срок вышел — забрать / продлить' : 'Забрать / срок окончания') : (e.n <= 0 ? 'Уже можно открыть снова' : 'Снова можно открыть');
  return `<div class="item" data-a="editPos" data-id="${p.id}"><div class="days ${cls === 'ok' ? '' : cls}" ${cls === 'ok' ? 'style="color:var(--ok)"' : ''}><b>${e.n === 0 ? '0' : Math.abs(e.n)}</b>${e.n < 0 ? 'назад' : e.n === 0 ? 'сегодня' : 'дн'}</div>
  <div class="grow" style="min-width:0"><div class="t">${esc(p.where)}</div><div class="sm mut">${lab} · ${fmtDate(e.d)}</div>${p.cond ? `<div class="sm mut" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.cond)}</div>` : ''}</div>
  <div class="amt">${money(lastAmt(p), p.cur)}</div></div>`;
}
function moveCard() {
  const T = todayISO(), free = {};
  for (const p of act()) if (p.close && p.close <= addDays(T, 30)) { const po = payoutOf(p); free[p.cur] = (free[p.cur] || 0) + (po ? po.total : lastAmt(p)); }
  const cs = Object.keys(free).filter(c => free[c] > 0); if (!cs.length) return '';
  return `<div class="card" style="margin-bottom:14px"><div class="row"><h3 class="grow">Куда переложить освобождающиеся деньги</h3><button class="btn sm" data-a="offers">Ставки банков</button></div>` + cs.map(c => {
    const amt = free[c], os = S.data.settings.offers.filter(o => o.cur === c && o.rate).sort((x, y) => y.rate - x.rate).slice(0, 3);
    return `<div style="margin-top:12px"><div class="sm mut" style="margin-bottom:6px">В ближайшие 30 дней освободится ≈ ${money(amt, c)}</div>${os.length ? os.map(o => {
      const lim = o.max && o.max < amt, eff = Math.min(amt, o.max || amt) * o.rate / 100;
      return `<div class="item" style="cursor:default"><div class="dot" style="background:var(--acc)">%</div><div class="grow"><div class="t">${esc(o.bank || '—')} · ${o.rate}%</div><div class="sm mut">${o.term ? o.term + ' мес · ' : ''}${lim ? `лимит ${fmt(o.max, c)} — войдёт часть` : 'войдёт вся сумма'}</div></div><div class="amt sm">≈ +${money(eff, c)}<div class="mut">в год</div></div></div>`;
    }).join('') : '<div class="sm mut">Нет ставок в этой валюте — добавь в справочнике.</div>'}</div>`;
  }).join('') + '</div>';
}
function viewDates() {
  const ev = events(), mv = moveCard(); if (!ev.length) return mv + '<div class="card empty">Дат пока нет. Укажи «Забрать до» или «Снова можно с» в карточке места.</div>';
  const groups = [['Просрочено', e => e.n < 0 && e.k === 'close'], ['Ближайшие 7 дней', e => e.n >= 0 && e.n <= 7], ['До 30 дней', e => e.n > 7 && e.n <= 30], ['Позже', e => e.n > 30], ['Уже можно (недавно)', e => e.n < 0 && e.k === 'reopen']];
  return mv + groups.map(([t, f]) => { const L = ev.filter(f); return L.length ? `<div class="sect"><h2>${t}</h2><span class="mut sm">${L.length}</span></div>${L.map(evItem).join('')}` : ''; }).join('');
}

/* ===== Заметки ===== */
const NK = { dec: 'Решение', idea: 'Идея', cond: 'Условие', '': 'Мысль' };
const NKORD = ['dec', 'idea', 'cond', ''];
function noteFiltered() {
  const q = S.q.toLowerCase(), k = S.nk;
  return [...S.data.notes].filter(n => (!q || (n.text + ' ' + (n.where || '')).toLowerCase().includes(q)) && (k === '' || (k === 'nop' ? !n.where : (n.kind || '') === (k === 'free' ? '' : k)))).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
}
function noteList() {
  const L = noteFiltered(), pl = flPlaces();
  if (!L.length) return '<div class="empty">Заметок нет</div>';
  return L.map(n => { const k = n.kind || ''; return `<div class="item nt ${n.pin ? 'pin' : ''}" style="align-items:flex-start;cursor:default"><div class="grow"><div class="row nth"><button class="ntk nk-${k || 'x'}" data-a="nkind" data-id="${n.id}" title="Нажми, чтобы сменить тип">${NK[k]}</button><span class="sm mut">${fmtDate(n.d)}</span><select class="ntp" data-i="nplace" data-id="${n.id}" title="К какому месту относится"><option value="">без места</option>${pl.concat(n.where && !pl.includes(n.where) ? [n.where] : []).map(x => `<option ${n.where === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div><div style="white-space:pre-wrap;margin-top:4px">${esc(n.text)}</div></div><button class="ic ${n.pin ? 'on' : ''}" data-a="npin" data-id="${n.id}" title="Закрепить">${ic('star')}</button><button class="ic" data-a="delNote" data-id="${n.id}">${ic('x')}</button></div>`; }).join('');
}
function viewNotes() {
  const pl = flPlaces(), cnt = S.data.notes.filter(n => !n.where).length;
  return `<p class="mut sm" style="margin:0 0 10px">Решения, идеи и условия, привязанные к местам. Тип и место можно сменить прямо в записи.</p>
  <div class="card col"><div class="seg" id="ntsel">${NKORD.map(k => `<button type="button" class="${(S.nnew || 'dec') === (k || 'x') ? 'on' : ''}" data-a="nnew" data-id="${k || 'x'}">${NK[k]}</button>`).join('')}</div>
  <textarea class="inp" id="nt" placeholder="Что решил, придумал или важно помнить…"></textarea><div class="row" style="flex-wrap:wrap"><input class="inp" type="date" id="nd" value="${todayISO()}" style="max-width:150px"><select class="inp grow" id="nw" style="min-width:150px"><option value="">без места</option>${pl.map(x => `<option>${esc(x)}</option>`).join('')}</select><div class="grow"></div><button class="btn pri" data-a="addNote">${ic('plus')}Записать</button></div></div>
  <div class="row wrap" style="gap:6px;margin:14px 0 8px">${[['', 'Все'], ['dec', 'Решения'], ['idea', 'Идеи'], ['cond', 'Условия'], ['free', 'Мысли'], ['nop', 'Без места' + (cnt ? ' · ' + cnt : '')]].map(([k, t]) => `<button class="chip ${S.nk === k ? 'on' : ''}" data-a="nflt" data-id="${k}">${t}</button>`).join('')}</div>
  <div class="row" style="margin:0 0 6px"><input class="inp" data-i="q2" placeholder="Поиск по заметкам и местам" value="${esc(S.q)}"></div>
  <div id="nlist">${noteList()}</div>`;
}

/* ===== Настройки ===== */
function viewSet() {
  const s = S.data.settings, th = document.documentElement.dataset.theme || 'dark';
  const sw = [['dark', 'linear-gradient(135deg,#0b0f14,#3fe0a5)'], ['light', 'linear-gradient(135deg,#f3f6f9,#0e9f6e)'], ['gold', 'linear-gradient(135deg,#0f0d0a,#e8b84a)']];
  return `<div class="grid g2">
  <div class="card col"><h3>Внешний вид</h3><div class="row">${sw.map(([k, g]) => `<div class="swatch ${th === k ? 'on' : ''}" style="background:${g}" data-a="theme" data-id="${k}"></div>`).join('')}</div>
    <label class="row"><input type="checkbox" data-i="hidedef" ${s.hide ? 'checked' : ''}> Скрывать суммы (тапни на глаз, чтобы показать)</label></div>
  <div class="card col"><h3>Безопасность</h3>
    <label class="f">Автоблокировка<select class="inp" data-i="autolock">${[[1, '1 минута'], [3, '3 минуты'], [10, '10 минут'], [0, 'никогда']].map(([v, l]) => `<option value="${v}" ${s.autolock === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="row wrap"><button class="btn sm" data-a="chpw">Сменить пароль</button><button class="btn sm" data-a="newrec">Новый ключ восстановления</button><button class="btn sm" data-a="lock">${ic('lock')}Заблокировать</button></div>
    ${Bio.ok() ? (Bio.has() ? `<button class="btn sm" data-a="biooff">Отключить вход по отпечатку</button>` : `<button class="btn sm" data-a="bioon">Включить вход по отпечатку / лицу</button>`) + `<div class="sm mut">Отпечаток открывает только это устройство; мастер-пароль и ключ восстановления остаются главными.</div>` : `<div class="sm mut">Вход по отпечатку заработает, когда приложение открыто по https (установлено как PWA).</div>`}</div>
  <div class="card col"><h3>Курсы к рублю</h3><div class="grid g2" style="gap:10px"><label class="f">1 ₸ = ... ₽<input class="inp" data-i="rKZT" inputmode="decimal" value="${s.rates.KZT}"></label><label class="f">1 $ = ... ₽<input class="inp" data-i="rUSD" inputmode="decimal" value="${s.rates.USD}"></label></div><div class="sm mut">${s.fx && s.fx.mig ? 'Стоят твои курсы — автообновление выключено.' : 'Обновляются сами при открытии (ЦБ РФ' + (s.fx && s.fx.upd ? ', ' + fmtDate(s.fx.upd) : '') + '); офлайн остаются последние.'}</div><label class="f">Запас на курс доллара, ₽ (считать по курсу минус столько — на спред при обмене)<input class="inp" data-i="spUSD" inputmode="decimal" value="${spreadOf('USD')}"></label><label class="row sm" style="gap:8px"><input type="checkbox" data-i="fxmig" ${s.fx && s.fx.mig ? 'checked' : ''}> Мои курсы (не обновлять автоматически)</label><div class="row wrap"><button class="btn sm pri" data-a="snap">Сделать снимок остатков</button><button class="btn sm" data-a="fxnow">Обновить курсы</button></div><label class="row sm" style="gap:8px"><input type="checkbox" data-i="snapoff" ${s.snapOff ? 'checked' : ''}> Не напоминать про снимки</label></div>
  <div class="card col"><h3>Справочники и цель</h3>
    <button class="btn" data-a="offers">${ic('list')}Ставки банков</button><button class="btn" data-a="goal">${ic('gear')}Цель накопления</button><button class="btn" data-a="palette">${ic('search')}Поиск и команды <kbd>Ctrl K</kbd></button>
    <div class="sm mut">Ставки нужны для подсказки «куда переложить», цель — для прогноза «сколько откладывать в месяц».</div></div>
  <div class="card col"><h3>Синхронизация</h3>${s.sync && s.sync.token ? `<div class="sm" id="syncst">${esc(Sync.text())}</div><div class="sm mut">Репозиторий: ${esc(s.sync.repo)}</div><div class="row wrap"><button class="btn sm pri" data-a="syncnow">Синхронизировать</button><button class="btn sm" data-a="syncoff">Отключить</button></div>` : `<label class="f">Приватный репозиторий (владелец/имя)<input class="inp" id="sr" placeholder="dmitry/savings-vault" autocapitalize="off"></label><label class="f">Токен GitHub (только этот репозиторий, Contents: read/write)<input class="inp" id="st" type="password" autocomplete="off"></label><div class="err" id="ser"></div><button class="btn pri" data-a="syncon">Включить</button>`}
    <div class="sm mut">В репозиторий уходит только зашифрованный файл — без твоего пароля это случайные байты. Токен хранится внутри шифрованных данных.</div></div>
  <div class="card col"><h3>Данные</h3>
    <button class="btn" data-a="xlsx">${ic('xls')}Импорт из Excel (.xlsx)</button>
    <button class="btn" data-a="export">${ic('down')}Скачать зашифрованную копию</button>
    <button class="btn" data-a="import">${ic('up')}Загрузить копию</button>
    <button class="btn" data-a="clrpos">Очистить все места</button>
    <button class="btn" data-a="demo">Добавить демо-данные</button>
    <div class="sm mut">Excel читается прямо в браузере и никуда не отправляется. Копия — это зашифрованный файл: без пароля или ключа восстановления это набор случайных байт.</div></div>
  <div class="card col" style="grid-column:1/-1"><h3>Как это защищено <span class="tag">v4.17</span></h3><div class="sm mut">Мастер-пароль → PBKDF2‑SHA256, ${Vault.ITER_PW.toLocaleString('ru-RU')} итераций → ключ, которым открывается случайный ключ данных. Данные шифруются AES‑256‑GCM (с проверкой целостности). Пароль не хранится. В браузере лежит только шифротекст. Лимит попыток и задержка защищают от случайного подбора на устройстве, а от кражи файла защищает сила пароля.</div></div></div>`;
}
function openChangePw(forced) {
  modal(`<h3>${forced ? 'Задай новый мастер-пароль' : 'Смена пароля'}</h3><p class="sm mut">${forced ? 'Ты вошёл по ключу восстановления — старый пароль утерян, поставь новый.' : 'Ключ восстановления остаётся прежним.'}</p><form id="cf" class="col"><input class="inp" id="n1" type="password" placeholder="Новый пароль" autocomplete="new-password"><div class="meter" id="mt">${meterHTML(0)}</div><input class="inp" id="n2" type="password" placeholder="Повтори" autocomplete="new-password"><div class="err" id="er"></div><div class="row" style="justify-content:flex-end">${forced ? '' : '<button type="button" class="btn" data-x="c">Отмена</button>'}<button class="btn pri">Сохранить</button></div></form>`, ov => {
    $('#n1', ov).addEventListener('input', e => $('#mt', ov).innerHTML = meterHTML(e.target.value ? Vault.strength(e.target.value).score : 0));
    ov.addEventListener('click', e => { if (e.target.closest('[data-x=c]')) closeModal(); });
    if (forced) ov.dataset.sticky = 1;
    $('#cf', ov).addEventListener('submit', async e => {
      e.preventDefault(); const a = $('#n1', ov).value, b = $('#n2', ov).value, er = $('#er', ov);
      if (a.length < 10 || Vault.strength(a).score < 2) return er.textContent = 'Минимум 10 символов и не слишком простой';
      if (a !== b) return er.textContent = 'Не совпадают';
      const blob = await S.session.setPassword(a); LS.set('sv_vault', JSON.stringify(blob)); closeModal(); toast('Пароль изменён');
    });
  });
}

/* ===== действия ===== */
async function actions(a, el) {
  const id = el.dataset.id;
  if (await anAction(a, el)) return;
  switch (a) {
    case 'tab': S.tab = id; S.q = ''; S.filter = 'Все'; S.fresh = true; render(); scrollTo(0, 0); break;
    case 'syncon': { const repo = $('#sr').value.trim().replace(/^https?:\/\/github\.com\//, ''), token = $('#st').value.trim(), er = $('#ser'); if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) return er.textContent = 'Нужны репозиторий вида имя/репо и токен'; S.data.settings.sync = { repo, token, path: 'vault.json' }; await persist(); Sync.run(); toast('Синхронизация включена'); render(); break; }
    case 'bioon': try { const b = await Bio.enable(); LS.set('sv_vault', JSON.stringify(b)); toast('Вход по отпечатку включён'); } catch (e) { LS.del('sv_pk'); toast(e.message === 'NO_PRF' ? 'Это устройство не поддерживает такой вход' : 'Не получилось включить'); } render(); break;
    case 'biooff': LS.set('sv_vault', JSON.stringify(Bio.disable())); toast('Вход по отпечатку выключен'); render(); break;
    case 'clrpos': { const n = S.data.positions.length; if (!n) { toast('Мест нет'); break; } if (!await ask(`Удалить все места (${n})? Заметки и анализ останутся. Можно будет отменить.`, 'Удалить', true)) break; const old = S.data.positions; S.data.positions = []; await persist(); render(); undoToast('Места удалены', async () => { S.data.positions = old; await persist(); render(); }, 12000); break; }
    case 'syncnow': Sync.run(); break;
    case 'syncoff': if (await ask('Отключить синхронизацию? Данные на устройстве останутся.', 'Отключить')) { delete S.data.settings.sync; LS.del('sv_sha'); await persist(); render(); } break;
    case 'hide': S.data.settings.hide = !S.data.settings.hide; persist(); render(); break;
    case 'lock': lock(); break;
    case 'range': S.range = id; S.rc = true; render(); break;
    case 'dmode': S.dmode = id; S.rc = true; render(); break;
    case 'fc': S.fc = !S.fc; S.rc = true; render(); break;
    case 'filter': { const sn = flipSnap(); S.filter = id; render(); flipPlay(sn); break; }
    case 'hday': S.hday = id; document.querySelectorAll('.hc.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); $('#hdetail').innerHTML = heatDetail(id); break;
    case 'goal': openGoal(); break;
    case 'snap': FX.open(id || undefined); break;
    case 'bcell': boardCell(id, el.dataset.d); break;
    case 'bjump': { const th = document.getElementById('bdc-' + id), w = th && th.closest('.bd-w'); if (w) w.scrollTo({ left: th.offsetLeft - (w.querySelector('.bd-d') || {}).offsetWidth || 0, behavior: 'smooth' }); break; }
    case 'tdall': S.tdAll = true; render(); break;
    case 'bgrp': S.bgrp = id; render(); break;
    case 'bmode': S.bmode = id; render(); break;
    case 'bper': S.bper = Number(id); render(); break;
    case 'bcols': boardCols(); break;
    case 'bhid': { const bc = S.data.settings.bcol = S.data.settings.bcol || {}, old = JSON.stringify(bc), M = boardModel(); (el.dataset.ids || '').split(',').forEach(i => { const p = M.base.find(q => q.id === i); if (!p) return; if (M.defVis(p)) bc[i] = 0; else delete bc[i]; }); await persist(); render(); undoToast('Столбец скрыт', async () => { S.data.settings.bcol = JSON.parse(old); await persist(); render(); }); break; }
    case 'bzero': S.bzero = S.bzero === false; render(); break;
    case 'bheat': S.bheat = !S.bheat; render(); break;
    case 'bfold': S.bfold = { ...(S.bfold || {}), [id]: !(S.bfold || {})[id] }; render(); break;
    case 'bgroup': boardGroup(id, el.dataset.c); break;
    case 'fxnow': { FX.st().mig = false; const ok = await FX.fetch(); toast(ok ? 'Курсы обновлены' : 'Не удалось — нет сети?'); render(); break; }
    case 'offers': openOffers(); break;
    case 'palette': openPalette(); break;
    case 'newPos': openPos(null); break;
    case 'editPos': openPlace(id); break;
    case 'fnew': flEdit(null); break;
    case 'fedit': flEdit((S.data.flows || []).find(f => f.id === id)); break;
    case 'fapply': { const f = S.data.flows.find(z => z.id === id); if (!f) break; flApply(f); await persist(); render(); break; }
    case 'flc': S.fl.cur = id; render(); break;
    case 'flt': S.fl.t = id; render(); break;
    case 'fdis': S.fl.dis = !S.fl.dis; render(); break;
    case 'mm': S.mm = id; S.q = ''; S.filter = 'Все'; S.fresh = false; render(); break;
    case 'nnew': S.nnew = id; render(); break;
    case 'nflt': S.nk = id; render(); break;
    case 'nkind': { const n = S.data.notes.find(z => z.id === id); if (!n) break; n.kind = NKORD[(NKORD.indexOf(n.kind || '') + 1) % 4]; await persist(); render(); break; }
    case 'npin': { const n = S.data.notes.find(z => z.id === id); if (!n) break; n.pin = !n.pin; await persist(); render(); break; }
    case 'addNote': { const t = $('#nt').value.trim(); if (!t) return toast('Напиши текст заметки'); S.data.notes.push({ id: uid(), d: $('#nd').value || todayISO(), text: t, kind: S.nnew === 'x' ? '' : S.nnew, where: $('#nw').value || '' }); await persist(); render(); break; }
    case 'delNote': { const n0 = S.data.notes.find(n => n.id === id); if (!n0) break; S.data.notes = S.data.notes.filter(n => n.id !== id); await persist(); render(); undoToast('Заметка удалена', async () => { S.data.notes.push(n0); await persist(); render(); }); break; }
    case 'theme': document.documentElement.dataset.theme = id; LS.set('sv_theme', id); render(); break;
    case 'chpw': openChangePw(false); break;
    case 'newrec': { const r = await S.session.newRecovery(); LS.set('sv_vault', JSON.stringify(r.blob)); modal(`<h3>Новый ключ восстановления</h3><p class="sm mut">Старый ключ больше не работает. Запиши этот:</p><div class="reccode">${r.code}</div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn pri" data-x="c">Сохранил</button></div>`, ov => ov.addEventListener('click', e => { if (e.target.closest('[data-x=c]')) closeModal(); })); break; }
    case 'export': { const b = new Blob([LS.get('sv_vault')], { type: 'application/json' }); const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = `nakopleniya-backup-${todayISO()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); toast('Копия скачана (зашифрована)'); break; }
    case 'import': pick('.json', async f => {
      try { const j = JSON.parse(await f.text()); if (!(j.v === 1 && j.wp && j.wr && j.ct)) throw 0; if (!await ask('Заменить текущее хранилище копией из файла? Нужен будет пароль от копии.', 'Заменить', true)) return; LS.set('sv_vault', JSON.stringify(j)); lock(); } catch (e) { toast('Это не файл копии хранилища'); }
    }); break;
    case 'demo': { const d = makeDemo(); S.data.positions.push(...d.positions); S.data.notes.push(...d.notes); await persist(); render(); toast('Демо добавлено'); break; }
    case 'xlsx': pick('.xlsx,.xlsm,.xls', f => doXlsx(f)); break;
  }
}
function pick(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => i.files[0] && cb(i.files[0]); i.click(); }
function openGoal() {
  const g = S.data.settings.goal || { name: 'Цель на конец года', amount: '', date: todayISO().slice(0, 4) + '-12-31' };
  modal(`<div class="row" style="margin-bottom:10px"><h3 class="grow">Цель накопления</h3><button class="ic" data-x="c">${ic('x')}</button></div><form id="gf" class="col"><label class="f">Название<input class="inp" name="name" value="${esc(g.name)}"></label>
  <div class="grid g2" style="gap:10px"><label class="f">Сумма, ₽<input class="inp" name="amount" inputmode="decimal" value="${g.amount}" required></label><label class="f">К дате<input class="inp" type="date" name="date" value="${g.date}" required></label></div>
  <div class="row" style="justify-content:space-between"><button type="button" class="btn sm bad" data-x="clr">Убрать цель</button><button class="btn pri">Сохранить</button></div></form>`, ov => {
    ov.addEventListener('click', async e => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'c') closeModal(); if (b.dataset.x === 'clr') { S.data.settings.goal = null; await persist(); closeModal(); render(); } });
    $('#gf', ov).addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.target), v = num(f.get('amount')); if (!(v > 0)) return; S.data.settings.goal = { name: f.get('name').trim(), amount: v, date: f.get('date') }; await persist(); closeModal(); S.rc = true; render(); });
  });
}
function openOffers() {
  const O = () => S.data.settings.offers;
  const row = o => `<div class="orow" data-oid="${o.id}"><input class="inp" data-of="bank" value="${esc(o.bank)}" placeholder="Банк"><select class="inp" data-of="cur">${['RUB', 'KZT', 'USD'].map(c => `<option ${o.cur === c ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="inp" data-of="rate" inputmode="decimal" value="${o.rate}" placeholder="% год."><input class="inp" data-of="max" inputmode="decimal" value="${o.max}" placeholder="макс. сумма"><input class="inp" data-of="term" inputmode="decimal" value="${o.term}" placeholder="срок, мес"><button class="ic" data-x="od" data-id="${o.id}">${ic('x')}</button></div>`;
  modal(`<div class="row" style="margin-bottom:6px"><h3 class="grow">Ставки банков</h3><button class="ic" data-x="c">${ic('x')}</button></div><p class="sm mut">Справочник для подсказки «куда переложить». Обновляй, когда ставки меняются — правки сохраняются сразу.</p><div id="ol" class="col" style="gap:8px"></div><div style="margin-top:10px"><button class="btn sm" data-x="oa">${ic('plus')}Добавить</button></div>`, ov => {
    const ol = $('#ol', ov), paint = () => { ol.innerHTML = O().length ? O().map(row).join('') : '<div class="empty">Пусто</div>'; }; paint();
    ov.addEventListener('change', e => { const r = e.target.closest('[data-oid]'); if (!r) return; const o = O().find(x => x.id === r.dataset.oid), f = e.target.dataset.of, v = e.target.value; if (!o) return; o[f] = (f === 'rate' || f === 'max' || f === 'term') ? (num(v) ?? '') : v; persist(); });
    ov.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
      if (x === 'c') { closeModal(); render(); }
      else if (x === 'oa') { O().push({ id: uid(), bank: '', cur: 'RUB', rate: '', max: '', term: '', note: '' }); await persist(); paint(); }
      else if (x === 'od') { const o = O().find(z => z.id === b.dataset.id); S.data.settings.offers = O().filter(z => z.id !== b.dataset.id); await persist(); paint(); undoToast('Ставка удалена', async () => { O().push(o); await persist(); paint(); }); }
    });
  });
}
async function doXlsx(f) {
  modal('<h3>Читаю файл…</h3><div class="skl" style="height:14px;margin:14px 0"></div><div class="skl" style="height:14px;width:72%;margin-bottom:10px"></div><div class="skl" style="height:14px;width:48%"></div>', null, 'ovl');
  await new Promise(r => setTimeout(r, 80));
  let found; try { found = parseWorkbook(await f.arrayBuffer()); } catch (e) { closeModal('ovl', true); return toast('Не смог прочитать файл: ' + e.message); }
  closeModal('ovl', true);
  if (!found.length) return toast('Не нашёл знакомых листов («движение средств», «состояние средств», «Мысли»)');
  modal(`<div class="row" style="margin-bottom:8px"><h3 class="grow">Импорт из Excel <span class="tag">v4.17</span></h3><button class="ic" data-x="c">${ic('x')}</button></div><p class="sm mut">Найдено в файле. Отметь, что добавить (всё добавляется к существующему):</p>
  ${found.map((x, i) => `<label class="card row" style="align-items:flex-start;margin-bottom:8px"><input type="checkbox" data-k="${i}" ${x.positions ? 'data-pos="1"' : ''} ${x.def && x.count ? 'checked' : ''} ${x.count ? '' : 'disabled'}><div><b>${esc(x.title)}</b> <span class="tag">${x.count}</span><div class="sm mut">${esc(x.desc)}</div></div></label>`).join('')}
  ${found.some(f => f.positions && f.positions.some(q => q._cl)) ? `<label class="row sm" style="margin-top:6px;align-items:flex-start"><input type="checkbox" id="autocl" checked><span>Закрыть вклады, которые в последнем столбце пустые, а срок уже вышел — деньги переложены в другие строки (иначе посчитаются дважды). Таких: <b>${found.reduce((s, f) => s + (f.positions ? f.positions.filter(q => q._cl).length : 0), 0)}</b></span></label>` : ''}
  <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn pri" data-x="go">Импортировать</button></div>`, ov => {
    ov.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'c') return closeModal();
      if (b.dataset.x === 'go') { const ckd = [...ov.querySelectorAll('[data-k]:checked')].map(c => found[+c.dataset.k]); const hasPos = ckd.some(x => x.positions), oldPos = S.data.positions; if (hasPos && oldPos.length) { if (!await ask(`Сейчас в приложении уже ${oldPos.length} мест (демо или прошлый импорт). Заменить их данными из файла? Иначе суммы задвоятся. Можно будет отменить.`, 'Заменить', true)) return; S.data.positions = []; setTimeout(() => undoToast('Старые места заменены', async () => { S.data.positions = oldPos.concat(S.data.positions.filter(q => !found.some(f => f.positions && f.positions.includes(q)))); await persist(); render(); }, 15000), 300); } let np = 0, nn = 0, na = 0, nclosed = 0, nf_ = 0; ov.querySelectorAll('[data-k]:checked').forEach(c => { const x = found[+c.dataset.k]; if (x.positions) { const ac = $('#autocl', ov) && $('#autocl', ov).checked; x.positions.forEach(q => { if (q._cl && ac) { q.history.push({ d: q._cl, amt: 0 }); q.archived = true; nclosed++; } delete q._cl; }); S.data.positions.push(...x.positions); np += x.positions.length; if (x.meta && x.meta.rates) { if (x.meta.rates.KZT) S.data.settings.rates.KZT = x.meta.rates.KZT; if (x.meta.rates.USD) S.data.settings.rates.USD = x.meta.rates.USD; if (x.meta.date && x.meta.rates.KZT && x.meta.rates.USD) { FX.st(); S.data.settings.rh[x.meta.date] = { KZT: x.meta.rates.KZT, USD: x.meta.rates.USD }; } if (x.meta.rh) { FX.st(); Object.assign(S.data.settings.rh, x.meta.rh); } const ld = x.meta.date; if (ld && (!S.data.settings.snapAt || ld > S.data.settings.snapAt)) S.data.settings.snapAt = ld; } } if (x.flows) { S.data.flows = S.data.flows || []; const hv = new Set(S.data.flows.map(flKey)); const fr = x.flows.filter(f => !hv.has(flKey(f))); S.data.flows.push(...fr); nf_ += fr.length; } if (x.notes) { const have = new Set(S.data.notes.map(n => n.d + '|' + n.text)); const fresh = x.notes.filter(n => !have.has(n.d + '|' + n.text)); S.data.notes.push(...fresh); nn += fresh.length; } if (x.an) { const A_ = A(); if (x.an.crypto) A_.crypto = x.an.crypto; if (x.an.years) A_.years = x.an.years; if (x.an.banks) A_.banks = x.an.banks; for (const k of ['home', 'cmp', 'tax', 'bt']) if (x.an[k]) A_[k] = x.an[k]; na++; } }); await persist(); closeModal(); render(); toast(`Добавлено: мест ${np}, переводов ${nf_}, заметок ${nn}` + (na ? `, листов анализа ${na}` : '') + (nclosed ? `; закрыто как переложенные: ${nclosed}` : '')); }
    });
  });
}

/* ===== события ===== */
document.addEventListener('click', e => {
  const m = e.target.closest('.money');
  if (m && S.data && S.data.settings.hide) { e.stopPropagation(); e.preventDefault(); m.classList.add('rv'); setTimeout(() => m.classList.remove('rv'), 3500); return; }
  const el = e.target.closest('[data-a]'); if (el && S.data) actions(el.dataset.a, el);
}, true);
document.addEventListener('input', e => {
  const i = e.target.dataset.i; if (!i || !S.data) return;
  if (i === 'flp') { S.fl.p = e.target.value; render(); }
  else if (i === 'flq') { S.fl.q = e.target.value; $('#fllist').innerHTML = flList(); }
  else if (i === 'q') { S.q = e.target.value; const sn = flipSnap(); $('#plist').innerHTML = plist(); flipPlay(sn); }
  else if (i === 'q2') { S.q = e.target.value; $('#nlist').innerHTML = noteList(); }
  else if (i === 'nplace') { const n = S.data.notes.find(z => z.id === e.target.dataset.id); if (n) { n.where = e.target.value; persist().then(() => render()); } }
  else if (i === 'spUSD') { const v = num(e.target.value); if (v != null && v >= 0) { const st = S.data.settings; st.spread = { ...(st.spread || {}), USD: v }; persist(); } }
  else if (i === 'rKZT' || i === 'rUSD') { const v = num(e.target.value); if (v > 0) { S.data.settings.rates[i.slice(1)] = v; FX.st().mig = true; FX.st().migUser = true; persist(); } }
});
document.addEventListener('change', e => {
  if (anChange(e)) return;
  const i = e.target.dataset.i; if (!i || !S.data) return;
  if (i === 'autolock') { S.data.settings.autolock = Number(e.target.value); persist(); bumpIdle(); }
  else if (i === 'fxmig') { FX.st().mig = e.target.checked; FX.st().migUser = e.target.checked; persist(); render(); }
  else if (i === 'snapoff') { S.data.settings.snapOff = e.target.checked; persist(); }
  else if (i === 'hidedef') { S.data.settings.hide = e.target.checked; persist(); render(); }
  else if (i === 'rKZT' || i === 'rUSD' || i === 'spUSD') render();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const os = document.querySelectorAll('.ov'), o = os[os.length - 1]; if (o && !o.dataset.sticky) { if (o.id) closeModal(o.id); else o.remove(); } } });

/* ===== старт ===== */
(function boot() {
  initUI(); const th = LS.get('sv_theme'); if (th) document.documentElement.dataset.theme = th;
  if (LS.get('sv_vault')) renderUnlock(); else renderSetup();
})();
