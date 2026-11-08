/* утилиты, демо-данные, импорт из Excel */
const SYM = { RUB: '₽', KZT: '₸', USD: '$' };
const TYPES = ['Банковский вклад', 'Накопительный счёт', 'Инвестиции', 'Краудлендинг', 'Крипта', 'Наличные', 'Счёт / карта'];
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const dnum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const daysTo = iso => Math.round(dnum(iso) - dnum(todayISO()));
const addDays = (iso, n) => { const t = new Date(dnum(iso) * 864e5 + n * 864e5); return t.toISOString().slice(0, 10); };
const fmtDate = iso => iso ? iso.split('-').reverse().join('.') : '—';
const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const fmt = (n, cur) => (Math.abs(n) < 100 && cur === 'USD' ? nf2.format(n) : nf.format(Math.round(n))) + ' ' + (SYM[cur] || '');
const short = n => { const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',') + ' млн' : a >= 1e3 ? Math.round(n / 1e3) + ' тыс' : String(Math.round(n)); };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function lastAmt(p, upTo) {
  let best = null;
  for (const h of p.history) if ((!upTo || h.d <= upTo) && (!best || h.d >= best.d)) best = h;
  return best ? best.amt : 0;
}

/* ---------- демо (вымышленные данные) ---------- */
function makeDemo() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const T = todayISO();
  const hist = (start, add, noise, months, growth = 0) => {
    const out = []; let v = start; const n = months * 2;
    for (let i = n; i >= 0; i--) {
      const d = addDays(T, -i * 15 + 1); v += add / 2 + v * growth / 2 + (rnd() - .5) * noise;
      out.push({ d, amt: Math.max(0, Math.round(v / 100) * 100) });
    }
    return out;
  };
  const P = (o) => ({ id: uid(), rate: '', cond: '', open: '', close: '', reopen: '', comment: '', limit: '', archived: false, ...o });
  const positions = [
    P({ type: 'Банковский вклад', where: 'Банк Север · вклад 3 мес', cur: 'RUB', rate: 15.5, limit: 1000000, open: addDays(T, -81), close: addDays(T, 9), cond: 'Капитализация ежемесячно. До 1 млн ₽. Досрочно — проценты по ставке до востребования.', history: hist(400000, 22000, 6000, 8, .01) }),
    P({ type: 'Накопительный счёт', where: 'Банк Горизонт · НС', cur: 'RUB', rate: 16, limit: 500000, cond: 'Ставка на ежедневный остаток. Повышенная ставка — только на первый счёт.', reopen: addDays(T, 120), comment: 'Закрывать только после полного месяца — внутри месяца ставка 0.', history: hist(250000, 15000, 5000, 12, .012) }),
    P({ type: 'Банковский вклад', where: 'Банк Степь · депозит', cur: 'KZT', rate: 18, open: addDays(T, -66), close: addDays(T, 24), cond: 'Пополнение до 30 дней, без снятия.', history: hist(1500000, 90000, 40000, 10, .012) }),
    P({ type: 'Банковский вклад', where: 'Банк Алтын · копилка', cur: 'KZT', rate: 17, reopen: addDays(T, 53), cond: 'Повторно открыть можно через 6 мес после закрытия.', history: hist(900000, 60000, 30000, 9, .01) }),
    P({ type: 'Краудлендинг', where: 'Платформа Заём-1', cur: 'RUB', rate: 21, open: addDays(T, -170), close: addDays(T, 3), cond: 'Выплата одним платежом в конце срока.', history: hist(120000, 7000, 3000, 9, .012) }),
    P({ type: 'Краудлендинг', where: 'Платформа Заём-2', cur: 'RUB', rate: 19, close: addDays(T, 47), history: hist(90000, 4000, 2000, 7, .01) }),
    P({ type: 'Инвестиции', where: 'Брокер Инвест', cur: 'RUB', cond: 'ОФЗ + фонд на индекс.', history: hist(300000, 10000, 24000, 14, .005) }),
    P({ type: 'Крипта', where: 'Биржа Альфа', cur: 'USD', history: hist(3200, 120, 400, 14, .006) }),
    P({ type: 'Крипта', where: 'Холодный кошелёк', cur: 'USD', comment: 'Seed-фраза в сейфе, не здесь.', history: hist(1800, 60, 250, 12, .004) }),
    P({ type: 'Наличные', where: 'Заначка', cur: 'USD', history: hist(1500, 0, 0, 3) }),
    P({ type: 'Банковский вклад', where: 'Банк Запад · вклад 6 мес', cur: 'RUB', rate: 14.2, open: addDays(T, -184), close: addDays(T, -2), cond: 'Срок вышел — забрать или продлить.', history: hist(200000, 6000, 3000, 6, .01) }),
  ];
  const notes = [
    { id: uid(), d: addDays(T, -40), text: 'Курс рубля держится крепко, тенге шатается. Не гнаться за доходностью в крипте — сначала подушка.' },
    { id: uid(), d: addDays(T, -21), text: 'Ставки по вкладам пошли вниз. Продлить короткие, повышенные ставки ловить на накопительных.' },
    { id: uid(), d: addDays(T, -6), text: 'Правило: после каждого пополнения спрашиваю у оператора, на какие условия попадает счёт.' },
  ];
  return { positions, notes };
}

/* ---------- импорт Excel ---------- */
const guessCur = (...s) => { const t = s.join(' ').toLowerCase(); if (/каспи|евраз|форте|береке|\bкз|тенге/.test(t)) return 'KZT'; if (/крипт|bybit|exmo|trust|usdt|btc|долл|\$/.test(t)) return 'USD'; return 'RUB'; };
const isSerial = v => typeof v === 'number' && v > 36526 && v < 73050;
const serialISO = n => new Date((Math.floor(n) - 25569) * 864e5).toISOString().slice(0, 10);
function anyDate(v) {
  if (isSerial(v)) return serialISO(v);
  if (typeof v === 'string') { const m = v.trim().match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${pad(m[2])}-${pad(m[1])}`; } }
  return '';
}
function sheetReader(ws) {
  const ref = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  return { r0: ref.s.r, r1: ref.e.r, c0: ref.s.c, c1: ref.e.c, get: (r, c) => { const x = ws[XLSX.utils.encode_cell({ r, c })]; return x ? x.v : null; } };
}
/** «0.139» или «13,9» в ячейке условий = ставка */
function pureRate(s) { const v = Number(String(s).trim().replace(',', '.')); if (!String(s).trim() || isNaN(v) || v <= 0) return ''; const r = v < 1 ? v * 100 : v; return r <= 60 ? Math.round(r * 100) / 100 : ''; }
function normType(t) {
  t = String(t || '').trim(); if (!t) return 'Банковский вклад'; if (TYPES.includes(t)) return t; const l = t.toLowerCase();
  if (/накоп/.test(l)) return 'Накопительный счёт'; if (/краудл|займ|заём/.test(l)) return 'Краудлендинг'; if (/крипт|bybit|биткоин/.test(l)) return 'Крипта';
  if (/инвест|брокер|акци|офз/.test(l)) return 'Инвестиции'; if (/налич/.test(l)) return 'Наличные'; if (/вклад|депозит/.test(l)) return 'Банковский вклад';
  if (/счет|счёт|карт|каспи|kaspi|сбер|тинь/.test(l)) return 'Счёт / карта'; return t;
}
const sv = v => String(v ?? '').trim();

function importMovement(ws) {
  const S = sheetReader(ws); let hr = -1, tc = -1;
  for (let r = S.r0; r <= Math.min(S.r1, S.r0 + 12) && hr < 0; r++) for (let c = S.c0; c <= S.c1; c++) if (sv(S.get(r, c)).toLowerCase() === 'тип') { hr = r; tc = c; break; }
  if (hr < 0) return null;
  const col = {}; const dcols = [];
  for (let c = S.c0; c <= S.c1; c++) {
    const v = S.get(hr, c);
    if (isSerial(v)) { dcols.push([c, serialISO(v)]); continue; }
    const t = sv(v).toLowerCase();
    if (t === 'где') col.where = c; else if (t === 'условия') col.cond = c; else if (t === 'дата открытия') col.open = c;
    else if (t === 'дата закрытия') col.close = c; else if (t === 'дата изменения') col.chd = c; else if (t === 'сумма изменения') col.cha = c; else if (t.startsWith('комментар')) col.cm = c;
  }
  const out = [], journal = [];
  for (let r = hr + 1; r <= S.r1; r++) {
    const raw = sv(S.get(r, tc)); if (!raw) continue;
    if (/крипт/i.test(raw) && col.chd != null && col.cha != null) { const jd = anyDate(S.get(r, col.chd)), ja = S.get(r, col.cha), ju = col.cm != null ? S.get(r, col.cm + 1) : null, jw = sv(col.where != null ? S.get(r, col.where) : ''); if (jd && typeof ja === 'number' && ja !== 0 && jw) journal.push({ d: jd, where: jw, rub: Math.abs(ja), out: ja < 0, usd: typeof ju === 'number' && ju > 0 ? ju : null, note: sv(col.cm != null ? S.get(r, col.cm) : '') }); }
    const [base, ...rest] = raw.split('_'); const extra = rest.join('_').trim();
    const where = sv(col.where != null ? S.get(r, col.where) : '') || extra || '';
    const history = [], notes = [];
    for (const [c, d] of dcols) { const v = S.get(r, c); { const tv = typeof v === 'number' ? '' : sv(v); if (tv && tv !== '-') notes.push({ d, t: tv }); } if (typeof v === 'number') history.push({ d, amt: v }); else if (history.length && history[history.length - 1].amt !== 0 && sv(v)) history.push({ d, amt: 0 }); /* «переведено», «-» после сумм = деньги ушли */ }
    const cond = sv(col.cond != null ? S.get(r, col.cond) : '');
    const open = col.open != null ? anyDate(S.get(r, col.open)) : '', close = col.close != null ? anyDate(S.get(r, col.close)) : '';
    let comment = sv(col.cm != null ? S.get(r, col.cm) : '');
    if (col.chd != null) { const cd = anyDate(S.get(r, col.chd)), ca = col.cha != null ? S.get(r, col.cha) : null; if (cd || ca != null) comment = (comment ? comment + '\n' : '') + `Изменение ${cd ? fmtDate(cd) : ''}${ca != null ? ': ' + ca : ''}`.trim(); }
    if (!history.length && !where && !cond && !open && !close && !comment) continue;
    const m = cond.match(/(\d{1,2}(?:[.,]\d+)?)\s*%/);
    history.sort((a, b) => a.d < b.d ? -1 : 1);
    /* кандидат «деньги переложены»: в последнем столбце таблицы пусто, а срок вклада уже наступил к дате этого столбца */
    const lastD = dcols.length ? dcols.map(x => x[1]).sort().pop() : '', ha = history.length ? history[history.length - 1] : null;
    const cl = ha && ha.amt !== 0 && ha.d < lastD && close && close <= lastD ? (close > ha.d ? close : addDays(ha.d, 1)) : '';
    out.push({ notes, id: uid(), type: normType(base), where: where || base.trim(), cur: guessCur(raw, where), rate: m ? Number(m[1].replace(',', '.')) : pureRate(cond), cond, open, close, reopen: '', comment, history, archived: history.length > 0 && history[history.length - 1].amt === 0, _cl: cl });
  }
  out.journal = journal;
  return out;
}

function importState(ws) {
  const S = sheetReader(ws); let hr = -1, dc = -1;
  for (let r = S.r0; r <= Math.min(S.r1, S.r0 + 12) && hr < 0; r++) for (let c = S.c0; c <= S.c1; c++) if (sv(S.get(r, c)).toLowerCase().startsWith('дата/место')) { hr = r; dc = c; break; }
  if (hr < 0) return null;
  const places = [], meta = {};
  let inPlaces = true;
  for (let c = dc + 1; c <= S.c1; c++) {
    const t = sv(S.get(hr, c)), l = t.toLowerCase(); if (!t) continue;
    if (/^итого/.test(l) || /^общий итог/.test(l)) inPlaces = false;
    if (inPlaces) places.push([c, t]);
    else if (l.startsWith('итого рубль')) meta.tRub = c; else if (l.startsWith('итого тенге')) meta.tKzt = c; else if (l.startsWith('итого долл')) meta.tUsd = c; else if (l.startsWith('общий итог')) meta.tAll = c;
    else if (/курс рубля/.test(l)) meta.fxK = c; else if (/курс доллара к рубл/.test(l)) meta.fxU = c;
  }
  /* строки со снимками: берём САМУЮ ПОЗДНЮЮ дату — это и есть «сколько сейчас» */
  const rows = []; for (let r = hr + 1; r <= S.r1; r++) { const d = S.get(r, dc); if (isSerial(d)) rows.push([r, serialISO(d)]); }
  if (!rows.length) return null; const lastR = rows.reduce((m, x) => x[1] > m[1] ? x : m, rows[0]);
  const out = [];
  for (const [c, name] of places) {
    const history = [];
    const rs = rows.slice().sort((x, y) => x[1] < y[1] ? -1 : 1);
    for (const [r, d] of rs) { const v = S.get(r, c); if (typeof v === 'number') history.push({ d, amt: v }); else if (history.length && history[history.length - 1].amt !== 0) history.push({ d, amt: 0 }); /* пусто после суммы = деньги ушли */ }
    if (!history.length) continue;
    const nowV = S.get(lastR[0], c); if (typeof nowV !== 'number' && history[history.length - 1].d < lastR[1]) history.push({ d: lastR[1], amt: 0 });
    const type = /инвест|джетленд|реголит/i.test(name) ? 'Инвестиции' : /exmo|trust|bybit/i.test(name) ? 'Крипта' : /заначка/i.test(name) ? 'Наличные' : /кз_/i.test(name) ? 'Банковский вклад' : 'Счёт / карта';
    const cur = /^кз_/i.test(name) ? 'KZT' : /exmo|trust|bybit|реголит/i.test(name) ? 'USD' : 'RUB';
    out.push({ id: uid(), type, where: name.replace(/\s+/g, ' '), cur, rate: '', cond: '', open: '', close: '', reopen: '', comment: '', history, archived: history[history.length - 1].amt === 0 || /реголит/i.test(name), ...(/реголит/i.test(name) ? { excl: true, comment: 'Не входит в итог твоей таблицы — поэтому не учитывается в итогах (галочка в карточке).' } : {}) });
  }
  const num = c => c != null && typeof S.get(lastR[0], c) === 'number' ? S.get(lastR[0], c) : null;
  const fxK = num(meta.fxK), fxU = num(meta.fxU);
  out.meta = { date: lastR[1], rates: { KZT: fxK ? +(1 / fxK).toFixed(6) : null, USD: fxU || null }, sheetTotal: num(meta.tAll) };
  const rhist = {}; for (const [r, dd] of rows) { const k = meta.fxK != null ? S.get(r, meta.fxK) : null, u = meta.fxU != null ? S.get(r, meta.fxU) : null; if (typeof k === 'number' && k > 0 && typeof u === 'number' && u > 0) rhist[dd] = { KZT: +(1 / k).toFixed(6), USD: u }; } out.meta.rh = rhist;
  const hc = re => { for (let c = dc + 1; c <= S.c1; c++) if (re.test(sv(S.get(hr, c)).toLowerCase())) return c; return null; }, cB = hc(/биткоин|btc/), cM = hc(/кв\.?\s*м/);
  if (cB != null) for (const [r, dd] of rows) { const v = S.get(r, cB); if (typeof v === 'number' && v > 0) (rhist[dd] = rhist[dd] || {}).BTC = v; }
  if (cM != null) { out.meta.m2 = {}; for (const [r, dd] of rows) { const v = S.get(r, cM); if (typeof v === 'number' && v > 0) out.meta.m2[dd] = v; } }
  { const g = c => c != null ? S.get(lastR[0], c) : null, tr = g(meta.tRub), tk = g(meta.tKzt), tu = g(meta.tUsd), ta = g(meta.tAll), k = g(meta.fxK), u = g(meta.fxU);
    if ([tr, tk, tu, ta, k, u].every(x => typeof x === 'number') && tu > 0 && k > 0) { const sp = Math.round((tr + tk / k + tu * u - ta) / tu * 2) / 2; if (sp > 0 && sp <= 20) out.meta.spreadUSD = sp; } }
  return out;
}

function importThoughts(ws) {
  const S = sheetReader(ws), out = [];
  for (let r = S.r0; r <= S.r1; r++) for (let c = S.c0; c < S.c1; c++) { const d = S.get(r, c); const t = S.get(r, c + 1); if (isSerial(d) && typeof t === 'string' && t.trim()) { out.push({ id: uid(), d: serialISO(d), text: t.trim() }); break; } }
  return out;
}

/** -> [{key,title,desc,count,positions?,notes?,def}] */
function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'array' }); const found = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]; if (!ws['!ref']) continue; const n = name.toLowerCase();
    if (n.includes('движение')) { const p = importMovement(ws); if (p) found.push({ key: name, title: name, desc: 'места: вклады, краудлендинг, крипта… с историей сумм, условиями и датами', count: p.length, positions: p, def: true }); }
    else if (n.includes('состояние')) { const p = importState(ws); if (p) found.push({ key: name, title: name, desc: 'остатки по местам (карты, счета, биржи). Это те же деньги в другой разбивке — выбирай ОДИН из двух листов', count: p.length, positions: p, def: false }); }
    else if (n.includes('крипт') && n.includes('клал')) { const c = importCrypto(ws); if (c) found.push({ key: name, title: name, desc: 'вложения в крипту → раздел «Анализ»: что было бы в банке', count: c.rows.length, an: { crypto: c }, def: true }); }
    else if (n.includes('отправлял')) { const h = importHome(ws); if (h) found.push({ key: name, title: name, desc: 'переводы в Казахстан → «Анализ → Переводы в КЗ»', count: h.rows.length, an: { home: h }, def: true }); }
    else if (n.includes('сравнение')) { const c = importCmp(ws); if (c) found.push({ key: name, title: name, desc: 'РФ или КЗ: ставки и сценарии курса → «Анализ → РФ или КЗ»', count: c.fxs.length, an: { cmp: c }, def: true }); }
    else if (n.includes('налогов')) { const t = importTax(ws); if (t) found.push({ key: name, title: name, desc: 'заметки про налог с вкладов → «Анализ → Налог» (там же калькулятор)', count: t.notes.length, an: { tax: t }, def: true }); }
    else if (n.includes('по годам')) { const y = importYears(ws); if (y) found.push({ key: name, title: name, desc: 'годы: начало/конец, расходы, проценты → «Анализ → По годам»', count: y.length, an: { years: y }, def: true }); }
    else if (n.includes('банков')) { const b = importBanks(ws), bt = importBankTab(ws); if (b || bt) found.push({ key: name, title: name, desc: 'снимки ставок банков по датам + сводная таблица → «Анализ → Банки»', count: (b ? b.length : 0) + (bt ? bt.rows.length : 0), an: { ...(b ? { banks: b } : {}), ...(bt ? { bt } : {}) }, def: true }); }
    else if (n.includes('мысли')) { const nt = importThoughts(ws); found.push({ key: name, title: name, desc: 'заметки с датами → раздел «Заметки»', count: nt.length, notes: nt, def: true }); }
  }
  /* «состояние средств» = сколько где лежит (главный источник); «движение средств» = справочник условий, подтягиваем по названию места */
  const st = found.find(f => f.key.toLowerCase().includes('состояние')), mv = found.find(f => f.key.toLowerCase().includes('движение'));
  if (st) {
    st.def = true; const meta = st.positions.meta || {}; const rt = { KZT: meta.rates && meta.rates.KZT || 0.16, USD: meta.rates && meta.rates.USD || 82 };
    if (mv) {
      const norm = s => String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/^кз_/, '').replace(/[^a-zа-яё0-9]+/g, ' ').trim();
      let hit = 0; const used = new Set();
      for (const p of st.positions) {
        const k = norm(p.where); if (k.length < 3) continue;
        const ms = mv.positions.filter(m => { const w = norm(m.where); return w && (w.includes(k) || k.includes(w)); }).sort((a, b) => (a.open || '') < (b.open || '') ? -1 : 1);
        const m = ms[ms.length - 1]; if (!m) continue; hit++; used.add(m);
        p.cond = m.cond; p.rate = m.rate; p.open = m.open; p.close = m.close; p.comment = m.comment;
        if (/^Счёт/.test(p.type) && /вклад|депозит/i.test(m.type + ' ' + m.comment)) p.type = 'Банковский вклад';
        if (p.rate) { p.cap = guessCap(p); p.rateOver = ''; p.promoTo = ''; p.rateAfter = ''; }
        const T = todayISO(), live = p.history.length && p.history[p.history.length - 1].amt > 0;
        if (live && p.close && p.close < T && p.open && p.open < p.close) { const term = dnum(p.close) - dnum(p.open); let c = p.close; while (c < T) c = addDays(c, term); p.close = c; p.open = addDays(c, -term); p.prolong = true; p.comment = (p.comment ? p.comment + '\n' : '') + 'Срок из таблицы прошёл, а деньги на месте — считаю, что вклад продлён на тот же срок. Поправь, если не так.'; }
      }
      mv.def = true; { const lastMv = mv.positions.flatMap(q => q.history.map(h => h.d)).sort().pop() || ''; mv.flows = flowsFrom(mv.positions).map(f => (f.src = 'xls', f)).concat(flowsFrom(st.positions).filter(f => f.d > lastMv).map(f => (f.src = 'calc', f)));
        const J = mv.positions.journal || [], al = w => norm(w).replace('эксмо', 'exmo').replace('кошелек ', '').replace('кошелёк ', ''), jp = new Set();
        const jf = J.map(j => { const k = al(j.where), sp = st.positions.find(p => { const n = norm(p.where); return n && (n === k || n.includes(k) || k.includes(n)); }), w = sp ? sp.where : j.where; jp.add(w);
          return { id: uid(), d: j.d, from: j.out ? w : '', to: j.out ? '' : w, amt: j.usd || j.rub, cur: j.usd ? 'USD' : 'RUB', rub: j.rub, note: j.note, applied: true, src: 'xls', jr: 1 }; });
        if (jf.length) mv.flows = mv.flows.filter(f => !jp.has(f.to) && !jp.has(f.from)).concat(jf); } mv.positions = null; mv.count = mv.flows.length; mv.desc = 'журнал переводов → вкладка «Движение»; условия и даты уже подтянуты к местам «состояния» (' + hit + ' совпало). Суммы в места не попадают — задвоения нет';
    }
    const app = st.positions.filter(p => !p.archived).reduce((s, p) => s + p.history[p.history.length - 1].amt * (p.cur === 'KZT' ? rt.KZT : p.cur === 'USD' ? rt.USD : 1), 0);
    st.meta = meta; st.desc = `сколько где лежит на ${meta.date ? fmtDate(meta.date) : 'последнюю дату'}. В приложении: ${Math.round(app).toLocaleString('ru-RU')} ₽` + (meta.sheetTotal ? `, в твоей таблице «общий итог»: ${Math.round(meta.sheetTotal).toLocaleString('ru-RU')} ₽` : '');
  } else if (mv) { mv.def = true; mv.flows = flowsFrom(mv.positions).map(f => (f.src = 'xls', f)); }
  for (const f of found) if (f.positions) f.positions.forEach(p => { if (f.key !== (mv && mv.key)) delete p._cl; });
  return found;
}

function makeOffers() {
  const O = (bank, cur, rate, max, term, note = '') => ({ id: uid(), bank, cur, rate, max, term, note });
  return [O('Банк Север', 'RUB', 15.5, 1000000, 3), O('Банк Восток', 'RUB', 16.2, 300000, 2), O('Банк Горизонт', 'RUB', 14.8, '', 6), O('Банк Степь', 'KZT', 18, 5000000, 3), O('Банк Алтын', 'KZT', 17.2, '', 6)];
}
function migrate(d) {
  d.tomb = d.tomb || {}; d.flows = d.flows || [];
  for (const f of d.flows) if (f.chg === undefined && !f.jr && (!f.src || f.src === 'xls' || f.src === 'calc') && !(f.from && f.to)) f.chg = true;
  const s = d.settings = d.settings || {}; s.rates = s.rates || { KZT: 0.16, USD: 82 }; if (s.autolock == null) s.autolock = 3;
  if (!Array.isArray(s.offers)) s.offers = []; if (!('goal' in s)) s.goal = null;
  for (const p of d.positions) { if (!('limit' in p)) p.limit = ''; if (!('cap' in p)) p.cap = p.rate ? guessCap(p) : ''; for (const k of ['rateOver', 'promoTo', 'rateAfter']) if (!(k in p)) p[k] = ''; if (!('prolong' in p)) p.prolong = false; if (!('excl' in p)) p.excl = /реголит/i.test(p.where) && /не входит в итог/i.test(p.comment || ''); }
  /* убрать демо-банки и демо-цель, если остались от демо-режима */
  const DEMO = ['Банк Север', 'Банк Восток', 'Банк Горизонт', 'Банк Степь', 'Банк Алтын'];
  if (d.positions.some(p => !/^Банк (Север|Горизонт|Степь|Алтын|Запад)|^Платформа Заём|^Брокер Инвест|^Биржа Альфа|^Холодный кошелёк|^Заначка$/.test(p.where))) { s.offers = s.offers.filter(o => !DEMO.includes(o.bank)); if (s.goal && s.goal.amount === 4500000 && s.goal.name === 'Накопить к концу года') s.goal = null; }
  return d;
}
