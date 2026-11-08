const MW = h => String(h).replace(/[+−-]?\d[\d\s\u00a0\u202f,.]*\s?(?:млн|тыс)?\s?[₽₸$]/g, m => `<span class="money">${m}</span>`);
/* ===== умный обзор: почему изменилось, что сделать, риски ===== */
const DEP_T = /вклад|счёт|счет|карта|копилк/i, NOPCT_T = /крипт|инвест|налич|кра?удленд/i;
function snapDates() { return [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].sort(); }
function whyChanged() {
  const ds = snapDates(); if (ds.length < 2) return null; const d2 = ds[ds.length - 1], d1 = ds[ds.length - 2];
  let fx = 0, pct = 0, un = 0, dl = 0; const mv = [];
  for (const p of inTot()) {
    const a1 = lastAmt(p, d1), a2 = lastAmt(p, d2), r1 = rateOf(p.cur, d1), r2 = rateOf(p.cur, d2);
    dl += a2 * r2 - a1 * r1; fx += a1 * (r2 - r1); if (Math.abs(a2 * r2 - a1 * r1) > 1) mv.push({ p, a1, a2, v: a2 * r2 - a1 * r1, fxp: a1 * (r2 - r1), amtp: (a2 - a1) * r2 });
    if (p.rate && p.cap && (a1 > 0 || p.cap === 'end')) { pct += Math.min(creditedOn(p, d1, a1, d2), Math.max(0, a2 - a1 + creditedOn(p, d1, a1, d2))) * r2; if (!p.archived && a2 > 0) un += (p.cap === 'end' ? (p.close && p.close > d2 ? endIncome(p, d2) : 0) : grow(p, d1, a1, d2).acc) * r2; }
  }
  mv.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const seen = {}, dups = []; for (const p of S.data.positions) { if (p.excl) continue; const k = p.cur + '|' + p.where.toLowerCase().replace(/\s+/g, ' ').trim(); if (seen[k] && (lastAmt(p, d1) > 0 || lastAmt(seen[k], d1) > 0)) dups.push(p.where); else seen[k] = p; }
  return { d1, d2, dl, fx, pct, un, other: dl - fx - pct, mv: mv.slice(0, 6), dups: [...new Set(dups)] };
}
function bestOffers(cur) {
  if (cur !== 'RUB') return []; const out = [], bt = A().bt;
  if (bt) for (const r of bt.rows) for (const [k, l, m, t] of [['dp', 'вклад', 'dm', 'dt'], ['np', 'НС на мин. остаток', 'nm', 'nt'], ['ep', 'НС на ежедн. остаток', 'em', 'et']]) { const v = typeof r[k] === 'number' ? r[k] : num(String(r[k]).replace('%', '')); if (v > 0) out.push({ v, t: `${r.bank} — ${l} ${String(v).replace('.', ',')}%${r[t] ? ', ' + r[t] : ''}${r[m] ? ', ' + r[m] : ''}` }); }
  for (const o of S.data.settings.offers || []) if (o.cur === cur && o.rate) out.push({ v: o.rate, t: `${o.bank} — ${o.rate}%${o.term ? ', ' + o.term + ' мес' : ''}` });
  return out.sort((a, b) => b.v - a.v).slice(0, 2);
}
function todoList() {
  const T = todayISO(), L = [], keyR = FX.keys().key || A().tax.key || 0;
  for (const p of act()) {
    const a = lastAmt(p); if (!(a > 0)) continue;
    if (p.close) { const n = daysTo(p.close); if (n >= -7 && n <= 21) { const po = payoutOf(p), bo = bestOffers(p.cur);
      L.push({ w: 100 - n, sev: 'r', e: '⏰', ic: 'cal', t: `<b>${esc(p.where)}</b> — ${n < 0 ? `срок вышел ${-n} дн. назад` : n === 0 ? 'забрать сегодня' : `забрать через ${n} дн. (${fmtDate(p.close)})`}${po ? `, к выплате ≈ ${fmt(po.total, p.cur)}` : ''}.${bo.length ? `<div class="sm mut">Куда переложить по твоей таблице: ${bo.map(x => esc(x.t)).join('; ')}</div>` : ''}`, a: p.id }); } }
    if (p.reopen) { const n = daysTo(p.reopen); if (n >= 0 && n <= 14) L.push({ w: 60, sev: 'g', e: '🔁', ic: 'cal', t: `<b>${esc(p.where)}</b> — с ${fmtDate(p.reopen)} снова можно открыть с приветственной ставкой.`, a: p.id }); }
    if (p.limit && a > p.limit) L.push({ w: 70, sev: 'a', e: '⚠️', ic: 'x', t: `<b>${esc(p.where)}</b> — сумма выше лимита ставки на ${fmt(a - p.limit, p.cur)}${p.rateOver !== '' && p.rateOver != null ? ` (на излишек всего ${p.rateOver}%)` : ''}.`, a: p.id });
    if (!p.rate && !NOPCT_T.test(p.type) && p.cur !== 'USD') { const rub = a * rateOf(p.cur); if (rub >= 30000) { const bo = bestOffers(p.cur), best = bo[0] ? bo[0].v : keyR; L.push({ w: 50 + Math.min(40, rub / 1e5), sev: 'a', e: '💤', ic: 'x', t: `<b>${esc(p.where)}</b> — ${fmt(a, p.cur)} лежат без процентов${best ? `: под ${String(best).replace('.', ',')}% это ≈ +${fmt(a * best / 100 / 12, p.cur)} в месяц` : ''}. Если ставка есть — впиши её в место.`, a: p.id }); } }
    else if (p.rate && !p.cap && DEP_T.test(p.type)) L.push({ w: 20, sev: 'n', e: '⚙️', ic: 'gear', t: `<b>${esc(p.where)}</b> — укажи, как начисляются проценты (капитализация / в конце срока), тогда автоснимки будут точными.`, a: p.id });
  }
  const pd = FX.pending(); if (pd.length) L.push({ w: 95, sev: 'g', e: '✅', t: `<b>Автоснимок на ${fmtDate(pd[pd.length - 1])} готов</b><div class="sm mut">суммы посчитаны по условиям — сверь с банками, займёт минуту${pd.length > 1 ? ` (снимков: ${pd.length})` : ''}</div>`, snap: pd[pd.length - 1] });
  return L.sort((x, y) => y.w - x.w);
}
/** разложить изменение капитала между двумя датами */
function decomp(d1, d2) {
  let fx = 0, pct = 0, dl = 0;
  for (const p of inTot()) { const a1 = lastAmt(p, d1), a2 = lastAmt(p, d2), r1 = rateOf(p.cur, d1), r2 = rateOf(p.cur, d2); dl += a2 * r2 - a1 * r1; fx += a1 * (r2 - r1); if (p.rate && p.cap && (a1 > 0 || p.cap === 'end')) { const inc = creditedOn(p, d1, a1, d2); pct += Math.min(inc, Math.max(0, a2 - a1 + inc)) * r2; } }
  return { dl, fx, pct, other: dl - fx - pct };
}
/** откуда прирост за 12 месяцев: сумма по соседним снимкам */
function yearGrowth() {
  const ds = snapDates(), T = todayISO(); if (ds.length < 2) return null; const end = ds[ds.length - 1], from = addDays(end, -365);
  let st = ds.filter(d => d <= from).pop() || ds[0]; const pts = ds.filter(d => d >= st);
  const s = { dl: 0, fx: 0, pct: 0, other: 0 }; for (let k = 1; k < pts.length; k++) { const r = decomp(pts[k - 1], pts[k]); for (const x in s) s[x] += r[x]; }
  return { ...s, from: st, to: end, base: totalAt(st) };
}
const TAXKEY = { 2025: 21, 2026: 16 };
function taxInfo() {
  const T = todayISO(), y = T.slice(0, 4), j1 = y + '-01-01', d31 = y + '-12-31', cur = FX.keys().key || A().tax.key || 0, key = Math.max(TAXKEY[y] || 0, cur); let inc = 0; const rows = [], skip = [];
  for (const p of S.data.positions) { if (p.cur !== 'RUB' || p.archived || p.excl) continue; if (!(p.rate && p.cap)) { if (lastAmt(p) > 0 && /вклад|счёт|счет/i.test(p.type || '')) skip.push(p); continue; }
    const v = p.cap === 'end' ? (p.close && p.close >= j1 && p.close <= d31 ? endIncome(p, p.close) : 0) : segIncome(p, j1, p.close && p.close < d31 && !p.prolong ? p.close : d31); inc += v; if (v > 0) rows.push({ p, v }); }
  rows.sort((a, b) => b.v - a.v); const free = 1e6 * key / 100; return { inc, free, key, y, rows, skip };
}
function riskInfo() {
  const t = totals(), tot = t.rub || 1, sh = c => (t.by[c] || 0) * rateOf(c) / tot * 100;
  const bk = {}; act().forEach(p => { const k = bankOf(p) || p.where; bk[k] = (bk[k] || 0) + lastAmt(p) * rateOf(p.cur); }); const places = Object.entries(bk).map(([w, v]) => ({ p: { where: w }, v })).sort((a, b) => b.v - a.v);
  const crypto = act().filter(p => /крипт/i.test(p.type)).reduce((s, p) => s + lastAmt(p) * rateOf(p.cur), 0) / tot * 100;
  return { cur: [['RUB', sh('RUB')], ['KZT', sh('KZT')], ['USD', sh('USD')]], top: places[0] ? { w: places[0].p.where, s: places[0].v / tot * 100 } : null, crypto };
}
function fxChips() {
  const P = FX.loadPub(), T = todayISO(), r = S.data.settings.rates, ago = FX.pubAt(addDays(T, -14)), k = FX.keys();
  const ch = (now, was) => was ? `<span class="sm ${now >= was ? 'up' : 'dn'}" style="color:var(--${now >= was ? 'acc' : 'bad'})">${now >= was ? '▲' : '▼'}${Math.abs((now / was - 1) * 100).toFixed(1).replace('.', ',')}%</span>` : '';
  const wasK = ago ? (ago.rubKzt ? 1 / ago.rubKzt : ago.kzt) : 0;
  return `<div class="row wrap" style="gap:8px;margin:2px 0 14px">${[`$ <b>${nf2.format(r.USD)} ₽</b> ${ch(r.USD, ago && ago.usd)}`, `₽ <b>${nf2.format(1 / r.KZT)} ₸</b> ${ch(1 / r.KZT, wasK && 1 / wasK)}`, k.key ? `ключевая ЦБ <b>${String(k.key).replace('.', ',')}%</b>` : '', k.base ? `базовая НБ РК <b>${String(k.base).replace('.', ',')}%</b>` : ''].filter(Boolean).map(x => `<span class="chip" style="cursor:default">${x}</span>`).join('')}${P && P.updated ? `<span class="sm mut" style="align-self:center">обновлено ${fmtDate(P.updated.slice(0, 10))}</span>` : ''}</div>`;
}
function insightCards(mode) {
  const w = whyChanged(), todo = todoList(), tx = taxInfo(), rk = riskInfo(), mx = w ? Math.max(Math.abs(w.fx), Math.abs(w.pct), Math.abs(w.other), 1) : 1;
  const bar = (l, v, c) => `<div class="row" style="gap:10px;margin:6px 0"><span class="sm" style="flex:0 0 38%">${l}</span><div class="grow" style="height:8px;background:var(--line);border-radius:4px;position:relative;overflow:hidden"><div style="position:absolute;${v >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(v) / mx * 50}%;top:0;bottom:0;background:${v >= 0 ? c : 'var(--bad)'};border-radius:4px"></div></div><b class="money sm" style="flex:0 0 auto;min-width:84px;text-align:right">${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 'RUB')}</b></div>`;
  const why = w ? `<div class="card"><div class="row" style="margin-bottom:4px"><h3 class="grow">Почему изменилось</h3><span class="sm mut">${fmtDate(w.d1)} → ${fmtDate(w.d2)}</span></div>
    <div class="big" style="font-size:26px;margin:4px 0 8px;color:var(--${w.dl >= 0 ? 'acc' : 'bad'})">${w.dl >= 0 ? '+' : '−'}${fmt(Math.abs(w.dl), 'RUB')}</div>
    ${bar('Проценты по вкладам', w.pct, 'var(--acc)')}${bar('Курсы валют', w.fx, 'var(--c2)')}${bar('Пополнения, снятия, рынок', w.other, 'var(--c3)')}
    ${w.un > 1000 ? `<div class="sm mut" style="margin:4px 0">Ещё начислено, но пока не в суммах (вклады «% в конце срока»): +${short(w.un)} ₽</div>` : ''}
    ${w.dups.length ? `<div class="sm" style="margin:8px 0;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--bad) 14%,transparent);border:1px solid color-mix(in srgb,var(--bad) 40%,transparent)">⚠ Похоже, места задвоены: ${w.dups.slice(0, 5).map(esc).join(', ')}${w.dups.length > 5 ? ' и ещё ' + (w.dups.length - 5) : ''}. Так бывает после нескольких импортов — сделай «Настройки → Очистить все места» и импортируй файл один раз.</div>` : ''}
    ${w.mv.length ? `<details style="margin-top:8px"${Math.abs(w.dl) > totals().rub * 0.3 ? ' open' : ''}><summary class="sm" style="cursor:pointer">Какие места дали изменение</summary>${w.mv.map(x => { const sg = v => (v >= 0 ? '+' : '−') + short(Math.abs(v)); return `<div class="row sm" style="gap:8px;margin-top:6px" data-a="editPos" data-id="${x.p.id}"><div class="grow" style="cursor:pointer;min-width:0"><div>${esc(x.p.where)}${x.p.archived ? ' <span class="mut">(архив)</span>' : ''}</div><div class="mut" style="font-size:12px">${fmt(x.a1, x.p.cur)} → ${fmt(x.a2, x.p.cur)}${x.p.cur !== 'RUB' ? ` · сумма ${sg(x.amtp)} · курс ${sg(x.fxp)} ₽` : ''}</div></div><b class="money" style="min-width:90px;text-align:right;color:var(--${x.v >= 0 ? 'acc' : 'bad'})">${x.v >= 0 ? '+' : '−'}${short(Math.abs(x.v))}</b></div>`; }).join('')}</details>` : ''}
    <div class="sm mut" style="margin-top:6px">Проценты — только те, что уже зачислены в суммы по условиям вкладов; курсы — как изменилась стоимость тенге и долларов в рублях; остальное — то, что ты доложил/снял, и колебания крипты и инвестиций.</div></div>` : '';
  const td = `<div class="card"><div class="row" style="margin-bottom:6px"><h3 class="grow">Что сделать</h3>${todo.length ? `<span class="tag">${todo.length}</span>` : ''}</div>${todo.length ? todo.slice(0, S.tdAll ? 50 : 5).map(x => `<div class="item" data-a="editPos" data-id="${x.a}" style="align-items:flex-start;gap:10px;cursor:pointer">${ic(x.ic)}<div class="grow sm">${x.t}</div></div>`).join('') + (todo.length > 5 && !S.tdAll ? `<button class="btn sm" data-a="tdall">Ещё ${todo.length - 5}</button>` : '') : '<div class="sm mut">Всё в порядке: ничего не закрывается в ближайшие 3 недели, деньги работают.</div>'}</div>`;
  const tp = tx.free ? Math.min(100, tx.inc / tx.free * 100) : 0;
  const risk = `<div class="card"><h3 style="margin-bottom:10px">Структура и риски</h3>
    <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin-bottom:6px">${rk.cur.filter(x => x[1] > 0).map(([c, s], i) => `<div title="${c}" style="width:${s}%;background:var(--c${i + 1})"></div>`).join('')}</div>
    <div class="row wrap sm" style="gap:12px;margin-bottom:10px">${rk.cur.filter(x => x[1] > 0).map(([c, s], i) => `<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--c${i + 1});margin-right:4px"></span>${c} ${s.toFixed(0)}%</span>`).join('')}</div>
    ${rk.top && rk.top.s > 30 ? `<div class="sm" style="margin-bottom:6px">⚠ <b>${esc(rk.top.w)}</b> — ${rk.top.s.toFixed(0)}% всех денег в одном банке${/кз_|kz/i.test(rk.top.w) ? '' : ' (страховка АСВ — до 1,4 млн ₽ на банк)'}.</div>` : ''}
    ${rk.cur[1][1] > 40 ? `<div class="sm" style="margin-bottom:6px">${rk.cur[1][1].toFixed(0)}% в тенге: ослабление тенге на 5% ≈ −${fmt(totals().rub * rk.cur[1][1] / 100 * 0.05, 'RUB')}.</div>` : ''}
    ${rk.crypto > 0 ? `<div class="sm mut" style="margin-bottom:6px">Крипта — ${rk.crypto.toFixed(1)}% капитала.</div>` : ''}
    ${tx.free ? `<div style="margin-top:10px"><div class="row sm"><span class="grow">Налог с % по вкладам РФ за ${tx.y} (оценка)</span><b class="money">${fmt(tx.inc, 'RUB')} из ${fmt(tx.free, 'RUB')}</b></div><div style="height:8px;background:var(--line);border-radius:4px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${tp}%;background:var(--${tp >= 100 ? 'bad' : tp > 80 ? 'warn' : 'acc'})"></div></div><div class="sm mut" style="margin-top:4px">Без налога — до 1 млн × ключевая ставка (${String(tx.key).replace('.', ',')}%). ${tx.inc > tx.free ? `С превышения ≈ ${fmt((tx.inc - tx.free) * 0.13, 'RUB')} НДФЛ (13%).` : `Запас ≈ ${fmt(tx.free - tx.inc, 'RUB')}.`} Оценка, не налоговая консультация.</div></div>` : ''}</div>`;
  const yg = yearGrowth(); let ygc = '';
  if (yg) { const parts = [['pct', 'проценты', 'var(--cc-RUB)'], ['fx', 'курсы', 'var(--cc-KZT)'], ['other', 'пополнения и рынок', 'var(--cc-USD)']], pos = parts.filter(([k]) => yg[k] > 0), sp = pos.reduce((s, [k]) => s + yg[k], 0) || 1;
    ygc = `<div class="card"><div class="row" style="margin-bottom:6px"><h3 class="grow">Откуда прирост за год</h3><span class="sm mut">${fmtDate(yg.from)} → ${fmtDate(yg.to)}</span></div>
    <div class="row" style="align-items:baseline;gap:10px;margin-bottom:10px"><b class="money" style="font-size:24px;color:var(--${yg.dl >= 0 ? 'acc' : 'bad'})">${yg.dl >= 0 ? '+' : '−'}${short(Math.abs(yg.dl))} ₽</b>${yg.base > 0 ? `<span class="sm mut">${yg.dl >= 0 ? '+' : ''}${(yg.dl / yg.base * 100).toFixed(0)}% за год</span>` : ''}</div>
    <div class="ygbar">${pos.map(([k, l, c]) => `<div style="flex:${yg[k] / sp};background:${c}" title="${l}"></div>`).join('')}</div>
    <div class="row wrap sm" style="gap:14px;margin-top:8px">${parts.map(([k, l, c]) => `<span><i class="lgd" style="background:${yg[k] >= 0 ? c : 'var(--bad)'}"></i>${l} <b class="money" style="color:${yg[k] >= 0 ? 'var(--tx)' : 'var(--bad)'}">${yg[k] >= 0 ? '+' : '−'}${short(Math.abs(yg[k]))}</b></span>`).join('')}</div></div>`; }
  const td2 = `<div class="card"><div class="row" style="margin-bottom:10px"><h3 class="grow">Что сделать</h3>${todo.length ? `<span class="tag">${todo.length}</span>` : ''}</div><div class="col" style="gap:8px">${todo.length ? todo.slice(0, S.tdAll ? 50 : 6).map(x => `<div class="act act-${x.sev || 'n'}" ${x.snap ? `data-a="snap" data-id="${x.snap}"` : `data-a="editPos" data-id="${x.a}"`}><span class="act-e">${x.e || '•'}</span><div class="grow">${MW(x.t)}</div></div>`).join('') + (todo.length > 6 && !S.tdAll ? `<button class="btn sm" data-a="tdall">Ещё ${todo.length - 6}</button>` : '') : '<div class="act act-g"><span class="act-e">✅</span><div class="grow"><b>Всё в порядке</b><div class="sm mut">ничего не закрывается в ближайшие 3 недели, деньги работают</div></div></div>'}</div></div>`;
  if (mode === 'todo') return td2;
  return `<div class="grid g2 hm-grid" style="margin-bottom:14px">${td2}<div class="col" style="gap:14px">${ygc}${why || ''}</div></div><div style="margin-bottom:14px">${risk}</div>`;
}

/* ===== Выводы: лента карточек «вывод одной фразой + как посчитано» ===== */
function conclusions() {
  const L = [], tot = totals(), T = tot.rub || 0;
  const yg = yearGrowth(), w = whyChanged(), rk = riskInfo(), tx = taxInfo(), todo = todoList();
  const vc = (sev, big, more, det) => L.push({ sev, big, more, det });
  if (w && w.dups.length) vc('w', `Похоже, часть мест записана дважды: ${w.dups.slice(0, 3).map(esc).join(', ')}`, 'Что проверить', `Одинаковые место и валюта встречаются больше одного раза, при этом суммы есть. Если это один счёт, итог завышен. Открой «Места» и убери лишнее.`);
  for (const x of todo.filter(z => z.sev === 'r').slice(0, 2)) vc('w', x.t, 'Что сделать', 'Срок вклада подходит или вышел. Сумма выплаты считается по условиям вклада в карточке места.');
  if (yg) {
    const pct = yg.base > 0 ? yg.dl / yg.base * 100 : null, up = yg.dl >= 0;
    vc(up ? 'g' : 'w', `За год капитал ${up ? 'вырос' : 'упал'} на ${short(Math.abs(yg.dl))} ₽${pct != null ? ` (${up ? '+' : '−'}${Math.abs(pct).toFixed(0)}%)` : ''}${yg.pct > 0 ? `. Проценты дали ${short(yg.pct)} ₽` : ''}`, 'Как посчитано',
      `Период ${fmtDate(yg.from)} → ${fmtDate(yg.to)}. Изменение суммы по каждому снимку разложено на три части: проценты по условиям вкладов (${yg.pct >= 0 ? '+' : '−'}${short(Math.abs(yg.pct))} ₽), курсы валют (${yg.fx >= 0 ? '+' : '−'}${short(Math.abs(yg.fx))} ₽) и остальное: пополнения, снятия, колебания крипты (${yg.other >= 0 ? '+' : '−'}${short(Math.abs(yg.other))} ₽). «Остальное» не доход: сюда попадает то, что ты сам доложил или снял.`);
  }
  if (rk.top && rk.top.s > 30) vc('w', `${rk.top.s.toFixed(0)}% всех денег в одном банке: ${esc(rk.top.w)}`, 'Почему важно', `Доля банка (все его вклады и счета вместе) в общей сумме в рублях. Если с этим банком что-то случится, под удар попадёт именно эта часть.${/кз_|kz/i.test(rk.top.w) ? '' : ' Страховка АСВ покрывает до 1,4 млн ₽ на банк.'}`);
  if (rk.cur[1][1] > 40 && T) vc('w', `${rk.cur[1][1].toFixed(0)}% денег в тенге: ослабление тенге на 5% съест около ${short(T * rk.cur[1][1] / 100 * 0.05)} ₽`, 'Как посчитано', `Доля тенге в капитале, умноженная на 5%. Это пример, а не прогноз.`);
  if (rk.crypto > 5) vc('w', `Крипта — ${rk.crypto.toFixed(0)}% капитала`, 'Почему важно', 'Сумма мест типа «крипта» относительно всего капитала в рублях. Цена крипты скачет сильнее, чем по вкладам.');
  if (tx.free && tx.inc > 0) { const tp = tx.inc / tx.free * 100; vc(tp >= 80 ? 'w' : 'g', tp >= 100 ? `Проценты по вкладам РФ за ${tx.y} выше необлагаемой суммы: будет налог` : `Налог с процентов за ${tx.y}: использовано ${tp.toFixed(0)}% необлагаемой суммы`, 'Как посчитано', `Оценка процентов по рублёвым вкладам за год: ${fmt(tx.inc, 'RUB')}. Необлагаемая сумма — 1 млн ₽ × наибольшая ключевая ставка на 1-е число месяцев года (${String(tx.key).replace('.', ',')}%) = ${fmt(tx.free, 'RUB')}.<br>Из чего сложились проценты: ${tx.rows.slice(0, 12).map(r => esc(r.p.where) + ' ' + short(r.v) + ' ₽').join(' · ') || 'нет мест со ставкой'}.${tx.skip.length ? `<br>Не учтены (нет ставки или типа начисления в карточке): ${tx.skip.slice(0, 8).map(p => esc(p.where)).join(', ')}.` : ''} Считаются только рублёвые места со ставкой; проценты за весь год, включая то, что ещё не начислено.`); }
  if (w && Math.abs(w.dl) > 0) vc('n', `С ${fmtDate(w.d1)} по ${fmtDate(w.d2)} капитал ${w.dl >= 0 ? 'вырос' : 'упал'} на ${short(Math.abs(w.dl))} ₽`, 'Из чего сложилось', `Проценты ${w.pct >= 0 ? '+' : '−'}${short(Math.abs(w.pct))} ₽, курсы ${w.fx >= 0 ? '+' : '−'}${short(Math.abs(w.fx))} ₽, остальное ${w.other >= 0 ? '+' : '−'}${short(Math.abs(w.other))} ₽ (пополнения, снятия, рынок).${w.mv.length ? ' Больше всего изменились: ' + w.mv.slice(0, 3).map(x => esc(x.p.where)).join(', ') + '.' : ''}`);
  return L;
}
function topConclusions(n) {
  const L = conclusions().filter(c => c.more !== 'Что сделать').slice(0, n);
  return L.length ? `<div class="col" style="gap:10px">${L.map(c => `<details class="vc vc-${c.sev}"><summary><div class="vbig">${c.big}</div><span class="vmore">${c.more} ›</span></summary><div class="vd sm">${c.det}</div></details>`).join('')}</div>` : '<div class="card empty"><p>Выводы появятся, когда накопится хотя бы пара снимков.</p></div>';
}
function chartsBlock() {
  return `<div class="grid g2" style="margin-top:14px">
    <div class="card"><div class="row wrap" style="margin-bottom:8px"><h3 class="grow">Динамика капитала</h3><button class="chip ${S.fc ? 'on' : ''}" data-a="fc">Прогноз</button><div class="seg">${[['6', '6м'], ['12', '12м'], ['all', 'Всё']].map(([k, l]) => `<button class="${S.range === k ? 'on' : ''}" data-a="range" data-id="${k}">${l}</button>`).join('')}</div></div>
      <div style="position:relative" id="cw">${lineChart(series())}</div>${S.fc ? '<div class="sm mut" style="margin-top:6px">Прогноз: простые проценты по ставке до даты закрытия, без новых пополнений.</div>' : ''}</div>
    <div class="card"><div class="row" style="margin-bottom:12px"><h3 class="grow">Структура</h3><div class="seg">${[['type', 'Тип'], ['cur', 'Валюта'], ['place', 'Место']].map(([k, l]) => `<button class="${S.dmode === k ? 'on' : ''}" data-a="dmode" data-id="${k}">${l}</button>`).join('')}</div></div>${donut()}</div></div>
  <div class="grid g2" style="margin-top:14px">${goalCard()}<div class="card"><h3 style="margin-bottom:8px">Прирост по годам</h3>${yearBars()}</div></div>
  <div class="card" style="margin-top:14px"><div class="row" style="margin-bottom:10px"><h3 class="grow">Календарь закрытий</h3><span class="mut sm">полгода вперёд</span></div>${heatmap()}</div>`;
}
function viewConclusions() {
  const L = conclusions();
  const feed = L.length ? L.map(c => `<details class="vc vc-${c.sev}"><summary><div class="vbig">${c.big}</div><span class="vmore">${c.more} ›</span></summary><div class="vd sm">${c.det}</div></details>`).join('') : '<div class="card empty"><p>Выводов пока нет: нужно хотя бы два снимка сумм. Добавь места или импортируй Excel.</p></div>';
  return `<p class="mut sm" style="margin:0 0 12px">Главное о твоих деньгах одной фразой. Нажми на карточку, чтобы увидеть, как посчитано.</p><div class="col" style="gap:10px">${feed}</div>${chartsBlock()}
  <button class="fold" data-a="ancalc">${S.ancalc ? 'Скрыть расчёты из Excel' : 'Расчёты из Excel: «А если бы в банк», по годам, банки, налог ›'}</button>${S.ancalc ? viewAn() : ''}`;
}

/* ===== Курсы и недвижимость на Обзоре ===== */
function rateSeries() {
  const P = FX.loadPub(), rh = S.data.settings.rh || {}, m = {};
  const put = (d, k, v) => { if (v > 0) (m[d] = m[d] || {})[k] = v; };
  for (const d in rh) { const r = rh[d]; put(d, 'usd', r.USD); if (r.KZT) put(d, 'rk', 1 / r.KZT); if (r.KZT && r.USD) put(d, 'uk', r.USD / r.KZT); put(d, 'btc', r.BTC); }
  if (P && P.hist) for (const d in P.hist) { const h = P.hist[d]; put(d, 'usd', h.usd); put(d, 'rk', h.rubKzt || (h.kzt ? 1 / h.kzt : 0)); put(d, 'uk', h.usdKzt); put(d, 'btc', h.btc); }
  const T = todayISO(), r = S.data.settings.rates; put(T, 'usd', r.USD); if (r.KZT) put(T, 'rk', 1 / r.KZT); if (P && P.today) { put(T, 'uk', P.today.usdKzt); put(T, 'btc', P.today.btc); }
  if (!(m[T] && m[T].uk) && r.KZT) put(T, 'uk', r.USD / r.KZT);
  return Object.keys(m).sort().map(d => ({ d, ...m[d] }));
}
function rspark(pts, w = 120, h = 30) {
  if (pts.length < 2) return ''; const v = pts.map(x => x[1]), mn = Math.min(...v), mx = Math.max(...v), d0 = dnum(pts[0][0]), d1 = dnum(pts[pts.length - 1][0]) || d0 + 1;
  const xy = pts.map(([d, y]) => `${((dnum(d) - d0) / ((d1 - d0) || 1) * w).toFixed(1)},${(h - 2 - (y - mn) / ((mx - mn) || 1) * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg class="spk" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${xy}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}
function ratesCard() {
  const R = rateSeries(), T = todayISO(), y1 = addDays(T, -365), w2 = addDays(T, -14);
  const at = (k, d) => { let b = null; for (const x of R) if (x[k] && x.d <= d) b = x; return b; };
  const ch = (now, was) => { if (!was || !now) return ''; const p = (now / was - 1) * 100; return `<span class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲' : '▼'}${Math.abs(p).toFixed(1).replace('.', ',')}%</span>`; };
  const row = (k, name, unit, dec) => { const pts = R.filter(x => x[k] && x.d >= y1).map(x => [x.d, x[k]]), last = at(k, T); if (!last) return '';
    const v = last[k], f = n => dec ? nf2.format(n) : nf.format(Math.round(n)), a2 = at(k, w2), ay = at(k, y1), old = last.d < addDays(T, -7);
    return `<div class="rt"><div class="rt-n">${name}</div><div class="rt-v"><b>${f(v)}</b> <span class="sm mut">${unit}</span>${k === 'btc' && S.data.settings.rates.USD ? `<div class="sm mut">≈ ${short(v * S.data.settings.rates.USD)} ₽</div>` : ''}${old ? `<div class="sm mut">на ${fmtDate(last.d)}</div>` : ''}</div><div class="rt-c sm"><div>2 нед ${ch(v, a2 && a2[k])}</div><div>год ${ch(v, ay && ay[k])}</div></div><div class="rt-s">${rspark(pts)}</div></div>`; };
  const k = FX.keys();
  return `<div class="card"><div class="row" style="margin-bottom:8px"><h3 class="grow">Курсы</h3><span class="sm mut">график за год</span></div>
  ${row('usd', '$ в рублях', '₽', 1)}${row('rk', '₽ в тенге', '₸', 1)}${row('uk', '$ в тенге', '₸', 1)}${row('btc', 'Биткоин', '$', 0)}
  ${k.key || k.base ? `<div class="sm mut" style="margin-top:8px">${k.key ? `Ключевая ЦБ РФ <b>${String(k.key).replace('.', ',')}%</b>` : ''}${k.key && k.base ? ' · ' : ''}${k.base ? `базовая НБ РК <b>${String(k.base).replace('.', ',')}%</b>` : ''}</div>` : ''}</div>`;
}
function realtyCard() {
  const m = S.data.settings.m2 || {}, ds = Object.keys(m).sort(); if (!ds.length) return '';
  const last = ds[ds.length - 1], pr = m[last], T = todayISO(), now = totals().rub, sq = now / pr;
  const yd = ds.filter(d => d <= addDays(last, -365)).pop() || ds[0], sqY = totalAt(yd) / m[yd], stale = last < addDays(T, -60);
  const dp = (pr / m[yd] - 1) * 100, dq = sqY ? (sq / sqY - 1) * 100 : 0;
  return `<div class="card"><div class="row" style="margin-bottom:8px"><h3 class="grow">Недвижимость</h3><button class="btn sm" data-a="m2upd">Обновить цену</button></div>
  <div class="row" style="gap:16px;align-items:flex-end;flex-wrap:wrap"><div><div class="sm mut">Твои накопления — это</div><b style="font-size:26px">${nf.format(Math.round(sq))} м²</b><div class="sm mut">новостройки в Новосибирске</div></div>
  <div class="grow" style="min-width:140px;color:var(--acc)">${rspark(ds.map(d => [d, m[d]]), 160, 40)}</div></div>
  <div class="pkv"><span>Цена 1 м²</span><span><b>${nf.format(pr)} ₽</b> <span class="sm mut">на ${fmtDate(last)}</span></span></div>
  <div class="pkv"><span>С ${fmtDate(yd)} цена</span><span class="${dp >= 0 ? 'mi' : 'pl'}">${dp >= 0 ? '+' : '−'}${Math.abs(dp).toFixed(0)}%</span></div>
  ${sqY ? `<div class="pkv"><span>Квадратов тогда / сейчас</span><span>${nf.format(Math.round(sqY))} → <b class="${dq >= 0 ? 'pl' : 'mi'}">${nf.format(Math.round(sq))}</b> (${dq >= 0 ? '+' : '−'}${Math.abs(dq).toFixed(0)}%)</span></div>` : ''}
  <div class="sm mut" style="margin-top:6px">${dq >= 0 ? 'Накопления растут быстрее цен на жильё.' : 'Цены на жильё растут быстрее накоплений.'}${stale ? ' Цена давно не обновлялась — нажми «Обновить цену».' : ''}</div></div>`;
}
