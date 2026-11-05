/* ===== умный обзор: почему изменилось, что сделать, риски ===== */
const DEP_T = /вклад|счёт|счет|карта|копилк/i, NOPCT_T = /крипт|инвест|налич|кра?удленд/i;
function snapDates() { return [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].sort(); }
function whyChanged() {
  const ds = snapDates(); if (ds.length < 2) return null; const d2 = ds[ds.length - 1], d1 = ds[ds.length - 2];
  let fx = 0, pct = 0, dl = 0; const mv = [];
  for (const p of inTot()) {
    const a1 = lastAmt(p, d1), a2 = lastAmt(p, d2), r1 = rateOf(p.cur, d1), r2 = rateOf(p.cur, d2);
    dl += a2 * r2 - a1 * r1; fx += a1 * (r2 - r1); if (Math.abs(a2 * r2 - a1 * r1) > 1) mv.push({ p, a1, a2, v: a2 * r2 - a1 * r1 });
    if (p.rate && p.cap && a1 > 0 && !p.archived) pct += incomeOf(p, d1, a1, d2) * r2;
  }
  mv.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const seen = {}, dups = []; for (const p of S.data.positions) { if (p.excl) continue; const k = p.cur + '|' + p.where.toLowerCase().replace(/\s+/g, ' ').trim(); if (seen[k] && (lastAmt(p, d1) > 0 || lastAmt(seen[k], d1) > 0)) dups.push(p.where); else seen[k] = p; }
  return { d1, d2, dl, fx, pct, other: dl - fx - pct, mv: mv.slice(0, 6), dups: [...new Set(dups)] };
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
      L.push({ w: 100 - n, ic: 'cal', t: `<b>${esc(p.where)}</b> — ${n < 0 ? `срок вышел ${-n} дн. назад` : n === 0 ? 'забрать сегодня' : `забрать через ${n} дн. (${fmtDate(p.close)})`}${po ? `, к выплате ≈ ${fmt(po.total, p.cur)}` : ''}.${bo.length ? `<div class="sm mut">Куда переложить по твоей таблице: ${bo.map(x => esc(x.t)).join('; ')}</div>` : ''}`, a: p.id }); } }
    if (p.reopen) { const n = daysTo(p.reopen); if (n >= 0 && n <= 14) L.push({ w: 60, ic: 'cal', t: `<b>${esc(p.where)}</b> — с ${fmtDate(p.reopen)} снова можно открыть с приветственной ставкой.`, a: p.id }); }
    if (p.limit && a > p.limit) L.push({ w: 70, ic: 'x', t: `<b>${esc(p.where)}</b> — сумма выше лимита ставки на ${fmt(a - p.limit, p.cur)}${p.rateOver !== '' && p.rateOver != null ? ` (на излишек всего ${p.rateOver}%)` : ''}.`, a: p.id });
    if (!p.rate && !NOPCT_T.test(p.type) && p.cur !== 'USD') { const rub = a * rateOf(p.cur); if (rub >= 30000) { const bo = bestOffers(p.cur), best = bo[0] ? bo[0].v : keyR; L.push({ w: 50 + Math.min(40, rub / 1e5), ic: 'x', t: `<b>${esc(p.where)}</b> — ${fmt(a, p.cur)} лежат без процентов${best ? `: под ${String(best).replace('.', ',')}% это ≈ +${fmt(a * best / 100 / 12, p.cur)} в месяц` : ''}. Если ставка есть — впиши её в позицию.`, a: p.id }); } }
    else if (p.rate && !p.cap && DEP_T.test(p.type)) L.push({ w: 20, ic: 'gear', t: `<b>${esc(p.where)}</b> — укажи, как начисляются проценты (капитализация / в конце срока), тогда автоснимки будут точными.`, a: p.id });
  }
  return L.sort((x, y) => y.w - x.w);
}
function taxInfo() {
  const T = todayISO(), y = T.slice(0, 4), j1 = y + '-01-01', d31 = y + '-12-31', key = FX.keys().key || A().tax.key || 0; let inc = 0;
  for (const p of S.data.positions) if (p.cur === 'RUB' && p.rate && p.cap) { const a0 = lastAmt(p, j1) || lastAmt(p); const from = lastAmt(p, j1) ? j1 : ((p.history[0] || {}).d || T); inc += incomeOf(p, from > j1 ? from : j1, a0, p.close && p.close < d31 && !p.prolong ? p.close : d31); }
  const free = 1e6 * key / 100; return { inc, free, key, y };
}
function riskInfo() {
  const t = totals(), tot = t.rub || 1, sh = c => (t.by[c] || 0) * rateOf(c) / tot * 100;
  const places = act().map(p => ({ p, v: lastAmt(p) * rateOf(p.cur) })).sort((a, b) => b.v - a.v);
  const crypto = act().filter(p => /крипт/i.test(p.type)).reduce((s, p) => s + lastAmt(p) * rateOf(p.cur), 0) / tot * 100;
  return { cur: [['RUB', sh('RUB')], ['KZT', sh('KZT')], ['USD', sh('USD')]], top: places[0] ? { w: places[0].p.where, s: places[0].v / tot * 100 } : null, crypto };
}
function fxChips() {
  const P = FX.loadPub(), T = todayISO(), r = S.data.settings.rates, ago = FX.pubAt(addDays(T, -14)), k = FX.keys();
  const ch = (now, was) => was ? `<span class="sm ${now >= was ? 'up' : 'dn'}" style="color:var(--${now >= was ? 'acc' : 'bad'})">${now >= was ? '▲' : '▼'}${Math.abs((now / was - 1) * 100).toFixed(1).replace('.', ',')}%</span>` : '';
  const wasK = ago ? (ago.rubKzt ? 1 / ago.rubKzt : ago.kzt) : 0;
  return `<div class="row wrap" style="gap:8px;margin:2px 0 14px">${[`$ <b>${nf2.format(r.USD)} ₽</b> ${ch(r.USD, ago && ago.usd)}`, `₽ <b>${nf2.format(1 / r.KZT)} ₸</b> ${ch(1 / r.KZT, wasK && 1 / wasK)}`, k.key ? `ключевая ЦБ <b>${String(k.key).replace('.', ',')}%</b>` : '', k.base ? `базовая НБ РК <b>${String(k.base).replace('.', ',')}%</b>` : ''].filter(Boolean).map(x => `<span class="chip" style="cursor:default">${x}</span>`).join('')}${P && P.updated ? `<span class="sm mut" style="align-self:center">обновлено ${fmtDate(P.updated.slice(0, 10))}</span>` : ''}</div>`;
}
function insightCards() {
  const w = whyChanged(), todo = todoList(), tx = taxInfo(), rk = riskInfo(), mx = w ? Math.max(Math.abs(w.fx), Math.abs(w.pct), Math.abs(w.other), 1) : 1;
  const bar = (l, v, c) => `<div class="row" style="gap:10px;margin:6px 0"><span class="sm" style="flex:0 0 38%">${l}</span><div class="grow" style="height:8px;background:var(--line);border-radius:4px;position:relative;overflow:hidden"><div style="position:absolute;${v >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(v) / mx * 50}%;top:0;bottom:0;background:${v >= 0 ? c : 'var(--bad)'};border-radius:4px"></div></div><b class="money sm" style="flex:0 0 auto;min-width:84px;text-align:right">${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 'RUB')}</b></div>`;
  const why = w ? `<div class="card"><div class="row" style="margin-bottom:4px"><h3 class="grow">Почему изменилось</h3><span class="sm mut">${fmtDate(w.d1)} → ${fmtDate(w.d2)}</span></div>
    <div class="big" style="font-size:26px;margin:4px 0 8px;color:var(--${w.dl >= 0 ? 'acc' : 'bad'})">${w.dl >= 0 ? '+' : '−'}${fmt(Math.abs(w.dl), 'RUB')}</div>
    ${bar('Проценты по вкладам', w.pct, 'var(--acc)')}${bar('Курсы валют', w.fx, 'var(--c2)')}${bar('Пополнения, снятия, рынок', w.other, 'var(--c3)')}
    ${w.dups.length ? `<div class="sm" style="margin:8px 0;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--bad) 14%,transparent);border:1px solid color-mix(in srgb,var(--bad) 40%,transparent)">⚠ Похоже, позиции задвоены: ${w.dups.slice(0, 5).map(esc).join(', ')}${w.dups.length > 5 ? ' и ещё ' + (w.dups.length - 5) : ''}. Так бывает после нескольких импортов — сделай «Настройки → Очистить все позиции» и импортируй файл один раз.</div>` : ''}
    ${w.mv.length ? `<details style="margin-top:8px"${Math.abs(w.dl) > totals().rub * 0.3 ? ' open' : ''}><summary class="sm" style="cursor:pointer">Какие места дали изменение</summary>${w.mv.map(x => `<div class="row sm" style="gap:8px;margin-top:4px" data-a="editPos" data-id="${x.p.id}"><span class="grow" style="cursor:pointer">${esc(x.p.where)}${x.p.archived ? ' <span class="mut">(архив)</span>' : ''}</span><span class="mut">${fmt(x.a1, x.p.cur)} → ${fmt(x.a2, x.p.cur)}</span><b class="money" style="min-width:90px;text-align:right;color:var(--${x.v >= 0 ? 'acc' : 'bad'})">${x.v >= 0 ? '+' : '−'}${short(Math.abs(x.v))}</b></div>`).join('')}</details>` : ''}
    <div class="sm mut" style="margin-top:6px">Проценты — расчёт по условиям вкладов; курсы — как изменилась стоимость тенге и долларов в рублях; остальное — то, что ты доложил/снял, и колебания крипты и инвестиций.</div></div>` : '';
  const td = `<div class="card"><div class="row" style="margin-bottom:6px"><h3 class="grow">Что сделать</h3>${todo.length ? `<span class="tag">${todo.length}</span>` : ''}</div>${todo.length ? todo.slice(0, S.tdAll ? 50 : 5).map(x => `<div class="item" data-a="editPos" data-id="${x.a}" style="align-items:flex-start;gap:10px;cursor:pointer">${ic(x.ic)}<div class="grow sm">${x.t}</div></div>`).join('') + (todo.length > 5 && !S.tdAll ? `<button class="btn sm" data-a="tdall">Ещё ${todo.length - 5}</button>` : '') : '<div class="sm mut">Всё в порядке: ничего не закрывается в ближайшие 3 недели, деньги работают.</div>'}</div>`;
  const tp = tx.free ? Math.min(100, tx.inc / tx.free * 100) : 0;
  const risk = `<div class="card"><h3 style="margin-bottom:10px">Структура и риски</h3>
    <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin-bottom:6px">${rk.cur.filter(x => x[1] > 0).map(([c, s], i) => `<div title="${c}" style="width:${s}%;background:var(--c${i + 1})"></div>`).join('')}</div>
    <div class="row wrap sm" style="gap:12px;margin-bottom:10px">${rk.cur.filter(x => x[1] > 0).map(([c, s], i) => `<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--c${i + 1});margin-right:4px"></span>${c} ${s.toFixed(0)}%</span>`).join('')}</div>
    ${rk.top && rk.top.s > 30 ? `<div class="sm" style="margin-bottom:6px">⚠ <b>${esc(rk.top.w)}</b> — ${rk.top.s.toFixed(0)}% всех денег в одном месте${/кз_|kz/i.test(rk.top.w) ? '' : ' (страховка АСВ — до 1,4 млн ₽ на банк)'}.</div>` : ''}
    ${rk.cur[1][1] > 40 ? `<div class="sm" style="margin-bottom:6px">${rk.cur[1][1].toFixed(0)}% в тенге: ослабление тенге на 5% ≈ −${fmt(totals().rub * rk.cur[1][1] / 100 * 0.05, 'RUB')}.</div>` : ''}
    ${rk.crypto > 0 ? `<div class="sm mut" style="margin-bottom:6px">Крипта — ${rk.crypto.toFixed(1)}% капитала.</div>` : ''}
    ${tx.free ? `<div style="margin-top:10px"><div class="row sm"><span class="grow">Налог с % по вкладам РФ за ${tx.y} (оценка)</span><b class="money">${fmt(tx.inc, 'RUB')} из ${fmt(tx.free, 'RUB')}</b></div><div style="height:8px;background:var(--line);border-radius:4px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${tp}%;background:var(--${tp >= 100 ? 'bad' : tp > 80 ? 'warn' : 'acc'})"></div></div><div class="sm mut" style="margin-top:4px">Без налога — до 1 млн × ключевая ставка (${String(tx.key).replace('.', ',')}%). ${tx.inc > tx.free ? `С превышения ≈ ${fmt((tx.inc - tx.free) * 0.13, 'RUB')} НДФЛ (13%).` : `Запас ≈ ${fmt(tx.free - tx.inc, 'RUB')}.`} Оценка, не налоговая консультация.</div></div>` : ''}</div>`;
  return fxChips() + `<div class="grid g2" style="margin-bottom:14px">${why || ''}${td}</div><div style="margin-bottom:14px">${risk}</div>`;
}
