/* Раздел «Анализ»: перенос листов «если бы не клал в крипту», «по годам копля», «анализ БАНКОВ» */
const AN_YF = [['start', 'Начало года, ₽ (вручную)'], ['rub', 'Рубли'], ['kzt', 'Тенге'], ['usd', 'Крипта, $'], ['work', 'На работе'], ['deduct', 'Вычет'], ['exp', 'Расходы'], ['pKZ', 'Проценты КЗ'], ['pRF', 'Проценты РФ'], ['fxRub', 'Курс рубля план'], ['usdPlan', 'Крипта план, $'], ['fxUsd', 'Курс доллара план'], ['end', 'Конец года, план ₽'], ['fact', 'Факт на конец года, ₽ (вручную)']];
const anDef = () => ({ crypto: { end: todayISO(), rate: '', rows: [] }, years: [], banks: [], bt: null, home: { rf: '', fxNow: '', rows: [], notes: [] }, cmp: { rf: '', kz: '', kzt: '', fxs: [5.5, 5.2, 5, 4.9, 4.8], notes: [] }, tax: { salary: '', dep: '', key: 21, notes: [] } });
const A = () => { const s = S.data.settings; if (!s.analysis) s.analysis = anDef(); const d = anDef(); for (const k in d) if (!s.analysis[k]) s.analysis[k] = d[k]; return s.analysis; };
const nz = v => (v === '' || v == null || isNaN(+v)) ? 0 : +v;
/* универсальная привязка полей: data-ap="home.rf" или "home.rows.<id>.amt" */
function apSet(path, v) { const a = A(), t = path.split('.'); let o = a; for (let i = 0; i < t.length - 1; i++) { const k = t[i]; o = Array.isArray(o) ? o.find(x => x.id === k) : o[k]; if (!o) return; } o[t[t.length - 1]] = v; }
const apIn = (path, v, ph = '', t = 'text') => `<input class="inp" data-ap="${path}" data-t="${t}" type="${t === 'date' ? 'date' : 'text'}" ${t === 'num' ? 'inputmode="decimal"' : ''} value="${esc(v ?? '')}" placeholder="${esc(ph)}">`;
const parseMY = v => { if (isSerial(v)) return serialISO(v); const m = String(v).trim().match(/^(\d{1,2})[.\/](\d{2,4})$/); if (m) return `${m[2].length === 2 ? '20' + m[2] : m[2]}-${pad(m[1])}-01`; return anyDate(v); };
const textRows = (R, minLen = 25) => R.map(r => r.map(String).filter(x => x.trim().length >= minLen)).flat().map(x => x.replace(/\r/g, '').trim());
const pct = v => { const n = Number(String(v).replace(',', '.')); return isNaN(n) ? null : (n > 0 && n <= 1 ? Math.round(n * 1000) / 10 : n); };

/* ---------- импорт ---------- */
function anRows(ws) { return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true }); }
function importCrypto(ws) {
  const R = anRows(ws), out = { end: '', rate: '', rows: [] };
  for (const r of R.slice(0, 2)) for (const v of r) if (isSerial(v) && !out.end) out.end = serialISO(v);
  for (let i = 1; i < R.length; i++) {
    const r = R[i], d = r.findIndex(isSerial); if (d < 0 || typeof r[d + 1] !== 'number') continue;
    const rt = pct(r[d + 2]); out.rows.push({ id: uid(), d: serialISO(r[d]), amt: r[d + 1], rate: r[d + 2] === '' || rt == null ? '' : rt });
  }
  if (!out.end) out.end = todayISO(); return out.rows.length ? out : null;
}
function importYears(ws) {
  const R = anRows(ws), hi = R.findIndex(r => r.some(v => /начало/i.test(String(v)))); if (hi < 0) return null;
  const H = R[hi].map(v => String(v).toLowerCase()), col = {};
  H.forEach((h, i) => {
    const set = (k, ok) => { if (ok && col[k] == null) col[k] = i; };
    set('start', /начало/.test(h)); set('rub', /рубль$/.test(h) && !/курс/.test(h)); set('kzt', /тенге/.test(h)); set('usd', /крипта/.test(h) && !/план/.test(h));
    set('work', /работе/.test(h)); set('deduct', /вычет/.test(h)); set('exp', /расход/.test(h)); set('pKZ', /проценты\s*кз/.test(h)); set('pRF', /проценты\s*рф/.test(h));
    set('fxRub', /курс\s*рубл/.test(h)); set('usdPlan', /крипта.*план/.test(h)); set('fxUsd', /курс\s*долл/.test(h)); set('end', /конец/.test(h)); set('fact', /^факт/.test(h));
  });
  const yc = R.slice(hi + 1).map(r => r.findIndex(v => typeof v === 'number' && v >= 2000 && v < 2100))[0] ?? 0; const out = [];
  for (let i = hi + 1; i < R.length; i++) {
    const r = R[i], y = r[yc]; if (!(typeof y === 'number' && y >= 2000 && y < 2100)) break;
    const o = { id: uid(), y }; let has = false; for (const k in col) { const v = r[col[k]]; if (typeof v === 'number') { o[k] = v; has = true; } else o[k] = ''; } o.has = has; out.push(o);
  }
  const f = out.filter(o => o.has); f.forEach(o => delete o.has); return f.length ? f : null;
}
function importBanks(ws) {
  const R = anRows(ws), out = [];
  for (let i = 1; i < R.length; i++) {
    if (!/мин\w*\s*остаток/i.test(String(R[i][0]))) continue;
    const h = R[i - 1]; const names = []; h.forEach((v, c) => { if (c >= 3 && String(v).trim()) names.push([c, String(v).trim()]); });
    if (!names.length) continue; const dt = h.find(isSerial); const snap = { id: uid(), d: dt ? serialISO(dt) : '', list: names.map(([, b]) => ({ bank: b, min: '', daily: '', max: '', term: '', lock: '', when: '', note: '' })) };
    for (let j = i; j < R.length && String(R[j][0]).trim(); j++) {
      const l = String(R[j][0]).toLowerCase(), k = /мин/.test(l) ? 'min' : /ежед/.test(l) ? 'daily' : /макс/.test(l) ? 'max' : /срок/.test(l) ? 'term' : /сколько/.test(l) ? 'lock' : /когда/.test(l) ? 'when' : /примеч/.test(l) ? 'note' : null; if (!k) continue;
      names.forEach(([c], n) => { const v = R[j][c]; snap.list[n][k] = (k === 'min' || k === 'daily') && typeof v === 'number' ? pct(v) : String(v ?? '').trim(); });
    }
    if (snap.list.some(b => b.min !== '' || b.daily !== '' || b.max || b.note)) out.push(snap);
  }
  return out.length ? out : null;
}

function importBankTab(ws) {
  const R = anRows(ws), hi = R.findIndex(r => /^банки$/i.test(String(r[0]).trim())); if (hi < 0) return null;
  let d = ''; for (let i = hi - 1; i >= Math.max(0, hi - 3); i--) { const f = R[i].find(isSerial); if (f) { d = serialISO(f); break; } }
  const t = v => String(v ?? '').replace(/\r/g, '').trim(), P = v => typeof v === 'number' ? pct(v) : t(v), rows = [];
  for (let i = hi + 1; i < R.length && t(R[i][0]); i++) { const r = R[i]; rows.push({ id: uid(), bank: t(r[0]), dp: P(r[1]), dm: t(r[2]), dt: t(r[3]), np: P(r[4]), nm: t(r[5]), nt: t(r[6]), ep: P(r[7]), em: t(r[8]), et: t(r[9]), again: t(r[10]), note: t(r[11]) }); }
  return rows.length ? { d, rows } : null;
}

function importHome(ws) {
  const R = anRows(ws), hi = R.findIndex(r => /дата открытия/i.test(String(r[0]))); if (hi < 0) return null; const rows = [], notes = [];
  for (let i = hi + 1; i < R.length; i++) {
    const r = R[i], d = parseMY(r[0]); if (!d || typeof r[1] !== 'number') { if (String(r[0]).trim().length > 25) notes.push(String(r[0]).replace(/\r/g, '').trim()); continue; }
    const fx = Number(String(r[2]).replace(',', '.')); const back = typeof r[4] === 'number' ? r[4] : '';
    rows.push({ id: uid(), d, amt: r[1], fx: isNaN(fx) ? '' : fx, close: parseMY(r[3]) || '', back, note: r.slice(7, 11).map(x => String(x).replace(/\r/g, '').trim()).filter(Boolean).join('\n') });
  }
  for (let i = hi + 1; i < R.length; i++) { const t = String(R[i][0]).trim(); if (t.length > 25 && !notes.includes(t.replace(/\r/g, ''))) notes.push(t.replace(/\r/g, '')); }
  return rows.length ? { rf: '', fxNow: '', rows, notes: [...new Set(notes)] } : null;
}
function importCmp(ws) {
  const R = anRows(ws), hi = R.findIndex(r => /ставка\s*рф/i.test(String(r[0]))), out = { rf: '', kz: '', kzt: '', fxs: [], notes: [] }; if (hi < 0) return null;
  const r = R[hi + 1]; out.rf = pct(r[0]) ?? ''; out.kz = pct(r[1]) ?? ''; out.kzt = typeof r[2] === 'number' ? r[2] : '';
  const fi = R.findIndex(x => /курс рубля/i.test(String(x[0]))); if (fi >= 0) for (let i = fi + 1; i < R.length && typeof R[i][0] === 'number'; i++) out.fxs.push(R[i][0]);
  if (!out.fxs.length) out.fxs = [5.5, 5.2, 5, 4.9, 4.8]; out.notes = textRows(R); return out;
}
function importTax(ws) { const R = anRows(ws), n = textRows(R, 20); return n.length ? { salary: '', dep: '', key: 21, notes: n } : null; }

/* ---------- расчёты ---------- */
const anDays = (a, b) => Math.max(0, Math.round((dnum(b) - dnum(a))));
function cryptoCalc() {
  const c = A().crypto, def = Number(c.rate) || 0; let inv = 0, bank = 0;
  const rows = c.rows.map(r => { const rt = r.rate === '' || r.rate == null ? def : Number(r.rate), days = c.end && r.d ? anDays(r.d, c.end) : 0, v = (Number(r.amt) || 0) * (1 + rt / 100 * days / 365); inv += Number(r.amt) || 0; bank += v; return { ...r, rt, days, v }; });
  const now = S.data.positions.filter(p => !p.archived && p.type === 'Крипта').reduce((s, p) => s + rubOf(p), 0);
  return { rows, inv, bank, now };
}
function homeCalc() {
  const h = A().home, rf = nz(h.rf), fxN = nz(h.fxNow), T = todayISO(); let sent = 0, nowRub = 0, rfRub = 0;
  const rows = h.rows.map(r => { const kzt = nz(r.amt) * nz(r.fx), closed = !!r.close; const yrs = Math.max(0, (dnum(closed ? r.close : T) - dnum(r.d)) / 365);
    const rfV = nz(r.amt) * (1 + rf / 100 * yrs), nowV = closed ? nz(r.back) : (fxN ? kzt / fxN : null); sent += nz(r.amt); if (nowV != null) nowRub += nowV; rfRub += rfV; return { ...r, kzt, rfV, nowV, closed }; });
  return { rows, sent, nowRub, rfRub };
}
function yearCalc(y) {
  const T = todayISO(), a = `${y.y}-01-01`, b = y.y >= +T.slice(0, 4) ? T : `${y.y + 1}-01-01`;
  const hasHist = S.data.positions.some(p => p.history.some(h => h.d <= a));
  const s0 = hasHist ? totalAt(a) : (y.start !== '' && y.start != null ? +y.start : null), s1 = totalAt(b); return { s0, s1, d: s0 == null ? null : s1 - s0, cur: y.y >= +T.slice(0, 4) };
}

/* ---------- экраны ---------- */
const anIn = (path, v, ph = '', t = 'text', ex = '') => `<input class="inp" data-an="${path}" type="${t}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${t === 'text' ? 'inputmode="decimal"' : ''} ${ex}>`;
function viewAn() {
  const sec = S.asec || 'crypto', a = A();
  const seg = `<div class="seg" style="margin-bottom:14px">${[['crypto', 'А если бы в банк'], ['years', 'По годам'], ['banks', 'Банки'], ['home', 'Переводы в КЗ'], ['cmp', 'РФ или КЗ'], ['tax', 'Налог']].map(([k, l]) => `<button class="${sec === k ? 'on' : ''}" data-a="asec" data-id="${k}">${l}</button>`).join('')}</div>`;
  return seg + ({ crypto: anCrypto, years: anYears, banks: anBanks, home: anHome, cmp: anCmp, tax: anTax }[sec])();
}
function anCrypto() {
  const c = A().crypto, k = cryptoCalc(), diff = k.now - k.bank, th = diff >= 0;
  return `<div class="card col" style="margin-bottom:14px"><h3>А если бы деньги лежали в банке</h3>
  <div class="sm mut">Каждое вложение в крипту считаем так, будто его положили в банк под ставку на тот день и оставили до выбранной даты (простые проценты).</div>
  <div class="grid g2" style="gap:10px"><label class="f">Считать до даты<input class="inp" type="date" data-an="c.end" value="${c.end}"></label><label class="f">Ставка по умолчанию, % годовых<input class="inp" inputmode="decimal" data-an="c.rate" value="${esc(c.rate)}" placeholder="например 18"></label></div>
  <div class="kpis"><div class="kpi"><div class="sm mut">Вложено в крипту</div><b class="money">${fmt(k.inv, 'RUB')}</b></div><div class="kpi"><div class="sm mut">Было бы в банке</div><b class="money">${fmt(k.bank, 'RUB')}</b></div><div class="kpi"><div class="sm mut">Сейчас в крипте (по позициям)</div><b class="money">${fmt(k.now, 'RUB')}</b></div></div>
  ${k.rows.length && !k.now ? `<div class="sm mut">Банк дал бы <span class="money">+${fmt(k.bank - k.inv, 'RUB')}</span> процентов. Чтобы сравнить с крипто-счётом, добавь позицию типа «Крипта» с текущей суммой.</div>` : ''}${k.rows.length && k.now ? `<div class="item" style="cursor:default"><div class="grow"><b>${th ? 'Крипта впереди банка' : 'Банк был бы выгоднее'}</b><div class="sm mut">Разница: <span class="money" style="color:var(--${th ? 'acc' : 'bad, #e5484d'})">${th ? '+' : '−'}${fmt(Math.abs(diff), 'RUB')}</span> · банк дал бы <span class="money">+${fmt(k.bank - k.inv, 'RUB')}</span> процентов</div></div></div>` : ''}</div>
  <div class="card col"><div class="row"><h3 class="grow">Вложения</h3><button class="btn sm" data-a="crow">${ic('plus')}Добавить</button></div>
  ${k.rows.length ? `<div class="tw"><table class="tb"><tr><th>Дата</th><th>Сумма, ₽</th><th>Ставка %</th><th>Дней</th><th>Итого</th><th></th></tr>${k.rows.map(r => `<tr data-rid="${r.id}"><td><input class="inp" type="date" data-an="c.row.d" value="${r.d}"></td><td>${anIn('c.row.amt', r.amt)}</td><td>${anIn('c.row.rate', r.rate, String(c.rate || '—'))}</td><td class="mut">${r.days}</td><td class="money">${fmt(r.v, 'RUB')}</td><td><button class="ic" data-a="cdel" data-id="${r.id}">${ic('x')}</button></td></tr>`).join('')}</table></div>` : '<div class="empty">Добавь вложения или импортируй лист «если бы не клал в крипту»</div>'}</div>`;
}
function anYears() {
  const Y = [...A().years].sort((a, b) => b.y - a.y);
  return `<div class="row" style="margin-bottom:12px"><div class="grow sm mut">Факт считается из истории сумм в позициях (по курсам из настроек). Остальное вводишь сам.</div><button class="btn sm" data-a="yadd">${ic('plus')}Год</button></div>` +
    (Y.length ? `<div class="grid g2">${Y.map(y => { const c = yearCalc(y); if (y.fact !== '' && y.fact != null) { c.s1 = +y.fact; c.d = c.s0 == null ? null : c.s1 - c.s0; } const n = k => y[k] === '' || y[k] == null ? '—' : fmt(+y[k], 'RUB');
      return `<div class="card col" data-a="yedit" data-id="${y.id}" style="cursor:pointer"><div class="row"><h3 class="grow">${y.y}</h3>${c.cur ? '<span class="tag">идёт</span>' : ''}</div>
      <div class="sm">Факт: ${c.s0 == null ? '<span class="mut">нет истории на 1 января</span>' : `<span class="money">${fmt(c.s0, 'RUB')}</span> → <span class="money">${fmt(c.s1, 'RUB')}</span> <b class="money" style="color:var(--${c.d >= 0 ? 'acc' : 'bad, #e5484d'})">${c.d >= 0 ? '+' : '−'}${fmt(Math.abs(c.d), 'RUB')}</b>`}</div>
      <div class="sm mut">План на конец: <span class="money">${n('end')}</span> · начало (вручную): <span class="money">${n('start')}</span></div>
      <div class="sm mut">На работе <span class="money">${n('work')}</span> · вычет <span class="money">${n('deduct')}</span> · расходы <span class="money">${n('exp')}</span></div>
      <div class="sm mut">Проценты: РФ <span class="money">${n('pRF')}</span> · КЗ <span class="money">${n('pKZ')}</span></div></div>`; }).join('')}</div>` : '<div class="empty">Годов пока нет. Добавь год или импортируй лист «по годам копля»</div>');
}
const rateTxt = v => v === '' || v == null ? '—' : typeof v === 'number' ? v + '%' : esc(v);
const BTC = [['bank', 'Банк'], ['dp', 'Вклад, %'], ['dm', 'макс'], ['dt', 'срок'], ['np', 'НС мин, %'], ['nm', 'макс'], ['nt', 'срок'], ['ep', 'НС ежедн, %'], ['em', 'макс'], ['et', 'срок'], ['again', 'Возобновл. ставки'], ['note', 'Прочее']];
function btCard() {
  const b = A().bt; if (!b) return '';
  return `<div class="card" style="margin-top:14px"><div class="row" style="margin-bottom:8px"><h3 class="grow">Сводная таблица ${b.d ? 'на ' + fmtDate(b.d) : ''}</h3><button class="btn sm" data-a="btadd">${ic('plus')}Строка</button></div>
  <div class="tw"><table class="tb"><tr>${BTC.map(([, l]) => `<th>${l}</th>`).join('')}<th></th></tr>${b.rows.map((r, n) => `<tr>${BTC.map(([k]) => `<td>${anIn('bt.cell', r[k], '', 'text', `data-n="${n}" data-k="${k}"`).replace('inputmode="decimal"', '')}</td>`).join('')}<td><button class="ic" data-a="btdel" data-id="${n}">${ic('x')}</button></td></tr>`).join('')}</table></div>
  <div class="sm mut" style="margin-top:8px">Вклад / накопительный счёт на мин. остаток (НС мин) / на ежедневный остаток (НС ежедн): ставка, макс. сумма, срок.</div></div>`;
}

function anBanks() {
  const B = [...A().banks].sort((a, b) => (b.d || '') < (a.d || '') ? -1 : 1); if (!B.length) return btCard() +  `<div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn sm" data-a="bsnap">${ic('plus')}Снимок</button></div><div class="empty">Нет данных. Импортируй лист «анализ БАНКОВ» или добавь снимок ставок</div>`;
  const id = S.asnap && B.find(x => x.id === S.asnap) ? S.asnap : B[0].id, i = B.findIndex(x => x.id === id), s = B[i], prev = B[i + 1];
  const rows = [['min', 'На мин. остаток'], ['daily', 'На ежедн. остаток'], ['max', 'Макс. сумма'], ['term', 'Срок счёта'], ['lock', 'Сколько нельзя'], ['when', 'Когда можно'], ['note', 'Примечания']];
  const delta = (b, k) => { if (!prev) return ''; const p = prev.list.find(x => x.bank === b.bank); if (!p || typeof p[k] !== 'number' || typeof b[k] !== 'number' || p[k] === b[k]) return ''; const d = Math.round((b[k] - p[k]) * 10) / 10; return `<div class="sm" style="color:var(--${d > 0 ? 'acc' : 'bad, #e5484d'})">${d > 0 ? '▲ +' : '▼ '}${d}</div>`; };
  return `<div class="row wrap" style="margin-bottom:12px"><div class="grow row wrap">${B.map(x => `<button class="chip ${x.id === id ? 'on' : ''}" data-a="bpick" data-id="${x.id}">${x.d ? fmtDate(x.d) : 'без даты'}</button>`).join('')}</div><button class="btn sm" data-a="bsnap">${ic('plus')}Снимок</button><button class="btn sm" data-a="bdel" data-id="${id}">${ic('x')}</button></div>
  <div class="card"><div class="row" style="margin-bottom:8px"><label class="f grow">Дата снимка<input class="inp" type="date" data-an="b.d" data-sid="${id}" value="${s.d}"></label><button class="btn sm" data-a="bbank" data-id="${id}">${ic('plus')}Банк</button></div>
  <div class="tw"><table class="tb"><tr><th></th>${s.list.map((b, n) => `<th><input class="inp" data-an="b.name" data-sid="${id}" data-n="${n}" value="${esc(b.bank)}"></th>`).join('')}</tr>
  ${rows.map(([k, l]) => `<tr><th class="mut">${l}</th>${s.list.map((b, n) => `<td>${anIn('b.cell', b[k], '', 'text', `data-sid="${id}" data-n="${n}" data-k="${k}"`)}${k === 'min' || k === 'daily' ? delta(b, k) : ''}</td>`).join('')}</tr>`).join('')}</table></div>
  <div class="sm mut" style="margin-top:8px">${prev ? 'Стрелки — изменение ставки к снимку от ' + (prev.d ? fmtDate(prev.d) : 'без даты') + '.' : 'Это самый ранний снимок.'}</div></div>${btCard()}`;
}

const notesCard = (path, arr) => arr && arr.length ? `<div class="card col" style="margin-top:14px"><h3>Мои заметки с листа</h3>${arr.map(t => `<div class="sm mut" style="white-space:pre-wrap">${esc(t)}</div>`).join('<hr style="border:0;border-top:1px solid var(--line);width:100%">')}</div>` : '';
function anHome() {
  const h = A().home, k = homeCalc(), open = k.rows.some(r => !r.closed);
  return `<div class="card col" style="margin-bottom:14px"><h3>Отправлял деньги домой (в Казахстан)</h3><div class="sm mut">Каждый перевод: сколько отправил, по какому курсу, что было бы, если бы остался в РФ под ставку. Незакрытые считаются по текущему курсу.</div>
  <div class="grid g2" style="gap:10px"><label class="f">Ставка в РФ для сравнения, %<input class="inp" inputmode="decimal" data-ap="home.rf" data-t="num" value="${esc(h.rf)}" placeholder="например 15"></label><label class="f">Текущий курс: тенге за 1 ₽<input class="inp" inputmode="decimal" data-ap="home.fxNow" data-t="num" value="${esc(h.fxNow)}" placeholder="например 6.2"></label></div>
  <div class="kpis"><div class="kpi"><div class="sm mut">Отправлено</div><b class="money">${fmt(k.sent, 'RUB')}</b></div><div class="kpi"><div class="sm mut">Сейчас это</div><b class="money">${open && !nz(h.fxNow) ? '—' : fmt(k.nowRub, 'RUB')}</b></div><div class="kpi"><div class="sm mut">В РФ было бы</div><b class="money">${nz(h.rf) ? fmt(k.rfRub, 'RUB') : '—'}</b></div></div>
  ${nz(h.rf) && (nz(h.fxNow) || !open) ? (() => { const d = k.nowRub - k.rfRub; return `<div class="item" style="cursor:default"><div class="grow"><b>${d >= 0 ? 'Казахстан выигрывает' : 'В РФ было бы выгоднее'}</b><div class="sm mut">Разница <span class="money" style="color:var(--${d >= 0 ? 'acc' : 'bad, #e5484d'})">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d), 'RUB')}</span></div></div></div>`; })() : '<div class="sm mut">Заполни ставку РФ и текущий курс — появится сравнение.</div>'}</div>
  <div class="card col"><div class="row"><h3 class="grow">Переводы</h3><button class="btn sm" data-a="hadd">${ic('plus')}Добавить</button></div>
  ${k.rows.length ? `<div class="tw"><table class="tb"><tr><th>Дата</th><th>Отправил, ₽</th><th>Курс (₸ за ₽)</th><th>В тенге</th><th>Закрыт</th><th>Вернул, ₽</th><th>Сейчас, ₽</th><th>В РФ было бы</th><th></th></tr>${k.rows.map(r => `<tr><td>${apIn(`home.rows.${r.id}.d`, r.d, '', 'date')}</td><td>${apIn(`home.rows.${r.id}.amt`, r.amt, '', 'num')}</td><td>${apIn(`home.rows.${r.id}.fx`, r.fx, '', 'num')}</td><td class="money mut">${fmt(r.kzt, 'KZT')}</td><td>${apIn(`home.rows.${r.id}.close`, r.close, '', 'date')}</td><td>${apIn(`home.rows.${r.id}.back`, r.back, '', 'num')}</td><td class="money">${r.nowV == null ? '—' : fmt(r.nowV, 'RUB')}</td><td class="money mut">${nz(h.rf) ? fmt(r.rfV, 'RUB') : '—'}</td><td><button class="ic" data-a="hdel" data-id="${r.id}">${ic('x')}</button></td></tr>${r.note ? `<tr><td colspan="9" class="sm mut" style="white-space:pre-wrap">${esc(r.note)}</td></tr>` : ''}`).join('')}</table></div>` : '<div class="empty">Переводов нет. Добавь или импортируй лист «отправлял домой»</div>'}</div>` + notesCard('home', h.notes);
}
function anCmp() {
  const c = A().cmp, rf = nz(c.rf), kz = nz(c.kz), kzt = nz(c.kzt);
  const rows = c.fxs.map((fx, i) => { fx = nz(fx); const now = fx ? kzt / fx : 0, inRF = now * (1 + rf / 100), inKZ = fx ? kzt * (1 + kz / 100) / fx : 0; return { fx, now, inRF, inKZ, d: inKZ - inRF }; });
  return `<div class="card col" style="margin-bottom:14px"><h3>Менять тенге на рубли или оставить в КЗ</h3><div class="sm mut">Через год: либо меняешь тенге на рубли сейчас и кладёшь в РФ, либо оставляешь в КЗ и меняешь потом по курсу из таблицы (курс — тенге за 1 ₽; чем он ниже, тем сильнее рубль).</div>
  <div class="grid g2" style="gap:10px"><label class="f">Ставка РФ, %<input class="inp" inputmode="decimal" data-ap="cmp.rf" data-t="num" value="${esc(c.rf)}"></label><label class="f">Ставка КЗ, %<input class="inp" inputmode="decimal" data-ap="cmp.kz" data-t="num" value="${esc(c.kz)}"></label><label class="f">Сумма сейчас в тенге<input class="inp" inputmode="decimal" data-ap="cmp.kzt" data-t="num" value="${esc(c.kzt)}"></label></div></div>
  <div class="card col"><div class="row"><h3 class="grow">Сценарии курса</h3><button class="btn sm" data-a="cadd">${ic('plus')}Курс</button></div>
  <div class="tw"><table class="tb"><tr><th>Курс на конец года</th><th>Рублей сейчас</th><th>Через год в РФ</th><th>Через год в КЗ</th><th>Итог</th><th></th></tr>${rows.map((r, i) => `<tr><td><input class="inp" inputmode="decimal" data-ap="cmp.fxs.${i}" data-t="num" value="${r.fx}"></td><td class="money mut">${fmt(r.now, 'RUB')}</td><td class="money">${fmt(r.inRF, 'RUB')}</td><td class="money">${fmt(r.inKZ, 'RUB')}</td><td class="money" style="color:var(--${r.d >= 0 ? 'acc' : 'bad, #e5484d'})">${kzt ? (r.d >= 0 ? 'КЗ +' : 'РФ +') + fmt(Math.abs(r.d), 'RUB') : '—'}</td><td><button class="ic" data-a="cdelx" data-id="${i}">${ic('x')}</button></td></tr>`).join('')}</table></div>
  <div class="sm mut">Не учтено: комиссии обмена и рост/падение ставок в течение года.</div></div>` + notesCard('cmp', c.notes);
}
function anTax() {
  const t = A().tax, sal = nz(t.salary) * 12, dep = nz(t.dep), key = nz(t.key) / 100, free = 1e6 * key, taxable = Math.max(0, dep - free), base = sal;
  const low = Math.max(0, Math.min(taxable, 2.4e6 - base)), high = taxable - low, tax = low * .13 + high * .15;
  const est = S.data.positions.filter(p => !p.archived && p.cur === 'RUB' && p.rate).reduce((s, p) => s + lastAmt(p) * Number(p.rate) / 100, 0);
  return `<div class="card col" style="margin-bottom:14px"><h3>Налог с процентов по вкладам (РФ)</h3><div class="sm mut">Не облагается доход до 1 млн × максимальная ключевая ставка года. Остаток — 13%, а та часть, что вместе с зарплатой выходит за 2,4 млн в год, — 15% (прогрессивная шкала). Это оценка, а не налоговая консультация: сверяйся с ФНС.</div>
  <div class="grid g2" style="gap:10px"><label class="f">Зарплата в месяц до налога, ₽<input class="inp" inputmode="decimal" data-ap="tax.salary" data-t="num" value="${esc(t.salary)}"></label><label class="f">Проценты по вкладам за год, ₽<input class="inp" inputmode="decimal" data-ap="tax.dep" data-t="num" value="${esc(t.dep)}" placeholder="оценка по позициям: ${Math.round(est)}"></label><label class="f">Макс. ключевая ставка за год, %<input class="inp" inputmode="decimal" data-ap="tax.key" data-t="num" value="${esc(t.key)}"></label></div>
  <div class="kpis"><div class="kpi"><div class="sm mut">Необлагаемый порог</div><b class="money">${fmt(free, 'RUB')}</b></div><div class="kpi"><div class="sm mut">Облагается</div><b class="money">${fmt(taxable, 'RUB')}</b></div><div class="kpi"><div class="sm mut">Налог к уплате</div><b class="money">${fmt(tax, 'RUB')}</b></div></div>
  <div class="sm mut">Общий доход за год: <span class="money">${fmt(sal + dep, 'RUB')}</span>${sal + dep > 2.4e6 ? ' — выше 2,4 млн, часть процентов облагается по 15%.' : ' — ниже 2,4 млн, ставка 13%.'}</div></div>` + notesCard('tax', t.notes);
}

/* ---------- действия ---------- */
function anSave(rerender) {
  persist(); if (!rerender) return;
  setTimeout(() => { /* перерисовка с сохранением фокуса: следующее поле не теряется при Tab */
    const ae = document.activeElement; let sel = null;
    if (ae && ae.dataset) {
      if (ae.dataset.ap) sel = `[data-ap="${ae.dataset.ap}"]`;
      else if (ae.dataset.an) { sel = `[data-an="${ae.dataset.an}"]` + (ae.dataset.sid ? `[data-sid="${ae.dataset.sid}"]` : '') + (ae.dataset.n ? `[data-n="${ae.dataset.n}"]` : '') + (ae.dataset.k ? `[data-k="${ae.dataset.k}"]` : ''); const r = ae.closest('[data-rid]'); if (r) sel = `[data-rid="${r.dataset.rid}"] ` + sel; }
    }
    S.rc = false; S.fresh = false; render();
    if (sel) { const n = document.querySelector(sel); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } }
  }, 0);
}
function anChange(e) {
  const ap = e.target.closest('[data-ap]');
  if (ap) { const t = ap.dataset.t, v = ap.value; apSet(ap.dataset.ap, t === 'num' ? (v.trim() === '' ? '' : (num(v) ?? '')) : v); anSave(true); return true; }
  const el = e.target.closest('[data-an]'); if (!el) return false; const p = el.dataset.an, v = el.value, a = A();
  if (p === 'c.end') a.crypto.end = v; else if (p === 'c.rate') a.crypto.rate = v === '' ? '' : (num(v) ?? '');
  else if (p.startsWith('c.row.')) { const r = a.crypto.rows.find(x => x.id === el.closest('[data-rid]').dataset.rid); const f = p.slice(6); r[f] = f === 'd' ? v : (v === '' ? '' : (num(v) ?? '')); }
  else if (p === 'bt.cell') { const r = a.bt && a.bt.rows[+el.dataset.n]; if (r) r[el.dataset.k] = v.trim(); }
  else if (p.startsWith('b.')) {
    const s = a.banks.find(x => x.id === el.dataset.sid); if (!s) return true;
    if (p === 'b.d') { s.d = v; } else if (p === 'b.name') s.list[+el.dataset.n].bank = v.trim(); else if (p === 'b.cell') { const k = el.dataset.k, n = num(v); s.list[+el.dataset.n][k] = (k === 'min' || k === 'daily') && v.trim() !== '' && n != null ? n : v.trim(); }
  } else return false;
  anSave(true); return true;
}
async function anAction(a, el) {
  const id = el.dataset.id, A_ = A();
  switch (a) {
    case 'hadd': A_.home.rows.push({ id: uid(), d: todayISO(), amt: '', fx: A_.home.fxNow || '', close: '', back: '', note: '' }); anSave(true); return true;
    case 'hdel': { const r = A_.home.rows.find(x => x.id === id); A_.home.rows = A_.home.rows.filter(x => x.id !== id); anSave(true); undoToast('Перевод удалён', () => { A_.home.rows.push(r); anSave(true); }); return true; }
    case 'cadd': A_.cmp.fxs.push(A_.cmp.fxs.length ? +(A_.cmp.fxs[A_.cmp.fxs.length - 1] - .1).toFixed(2) : 5); anSave(true); return true;
    case 'cdelx': A_.cmp.fxs.splice(+id, 1); anSave(true); return true;
    case 'asec': S.asec = id; S.rc = false; S.fresh = false; render(); return true;
    case 'crow': A_.crypto.rows.push({ id: uid(), d: todayISO(), amt: '', rate: '' }); anSave(true); return true;
    case 'cdel': { const r = A_.crypto.rows.find(x => x.id === id); A_.crypto.rows = A_.crypto.rows.filter(x => x.id !== id); anSave(true); undoToast('Вложение удалено', () => { A_.crypto.rows.push(r); anSave(true); }); return true; }
    case 'yadd': anYearModal(null); return true;
    case 'yedit': anYearModal(id); return true;
    case 'bpick': S.asnap = id; S.rc = false; S.fresh = false; render(); return true;
    case 'bsnap': { const last = [...A_.banks].sort((x, y) => (y.d || '') < (x.d || '') ? -1 : 1)[0]; const n = { id: uid(), d: todayISO(), list: last ? last.list.map(b => ({ ...b })) : [{ bank: 'Банк', min: '', daily: '', max: '', term: '', lock: '', when: '', note: '' }] }; A_.banks.push(n); S.asnap = n.id; anSave(true); return true; }
    case 'btadd': { if (!A_.bt) A_.bt = { d: todayISO(), rows: [] }; A_.bt.rows.push({ id: uid(), bank: 'Банк', dp: '', dm: '', dt: '', np: '', nm: '', nt: '', ep: '', em: '', et: '', again: '', note: '' }); anSave(true); return true; }
    case 'btdel': { const r = A_.bt && A_.bt.rows.splice(+id, 1)[0]; anSave(true); if (r) undoToast('Строка удалена', () => { A_.bt.rows.splice(+id, 0, r); anSave(true); }); return true; }
    case 'bbank': { const s = A_.banks.find(x => x.id === id); s.list.push({ bank: 'Банк', min: '', daily: '', max: '', term: '', lock: '', when: '', note: '' }); anSave(true); return true; }
    case 'bdel': { const s = A_.banks.find(x => x.id === id); A_.banks = A_.banks.filter(x => x.id !== id); S.asnap = null; anSave(true); undoToast('Снимок удалён', () => { A_.banks.push(s); anSave(true); }); return true; }
  }
  return false;
}
function anYearModal(id, isNew) {
  const a = A(); let y = id ? a.years.find(x => x.id === id) : { id: uid(), y: new Date().getFullYear(), start: '', rub: '', kzt: '', usd: '', work: '', deduct: '', exp: '', pKZ: '', pRF: '', fxRub: '', usdPlan: '', fxUsd: '', end: '', fact: '' };
  const fresh = !id;
  modal(`<div class="row" style="margin-bottom:6px"><h3 class="grow">${fresh ? 'Новый год' : 'Год ' + y.y}</h3><button class="ic" data-x="c">${ic('x')}</button></div><form id="yf" class="col"><label class="f">Год<input class="inp" name="y" inputmode="numeric" value="${y.y}"></label><div class="grid g2" style="gap:10px">${AN_YF.map(([k, l]) => `<label class="f">${l}<input class="inp" name="${k}" inputmode="decimal" value="${esc(y[k])}"></label>`).join('')}</div>
  <div class="row" style="justify-content:space-between">${fresh ? '<span></span>' : `<button type="button" class="btn" data-x="del">Удалить</button>`}<button class="btn pri">Сохранить</button></div></form>`, ov => {
    ov.addEventListener('click', async e => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'c') closeModal(); if (b.dataset.x === 'del' && await ask('Удалить год ' + y.y + '?', 'Удалить', true)) { a.years = a.years.filter(x => x.id !== y.id); anSave(true); closeModal(); } });
    $('#yf', ov).addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.target), yy = +f.get('y'); if (!(yy >= 2000 && yy < 2100)) return toast('Год вида 2026');
      const o = { ...y, y: yy }; AN_YF.forEach(([k]) => { const v = f.get(k); o[k] = v === '' ? '' : (num(v) ?? ''); }); if (fresh) a.years.push(o); else Object.assign(y, o); anSave(true); closeModal(); });
  });
}
