/* ===== Панель v2: даты × места, группировки, режимы, тепловая карта ===== */
const BGR = [['place', 'Места'], ['bank', 'Банки'], ['cur', 'Валюта'], ['type', 'Тип']];
const BMO = [['sum', 'Суммы'], ['rub', '₽ экв.'], ['dlt', 'Δ'], ['shr', 'Доля %']];
const BPER = [[3, '3 мес'], [6, '6 мес'], [12, '12 мес'], [0, 'Все']];
const BCN = { RUB: 'Рубли', KZT: 'Тенге', USD: 'Доллары' };
/* банк: то, что вписал сам; иначе угадываем по названию места (до « · », « - » и т.п.) */
const bankOf = p => (p.bank && p.bank.trim()) || (p.where || '').split(/\s+[·|\-–—\/]\s+/)[0].trim() || p.where;

function boardModel() {
  const per = S.bper === undefined ? 6 : S.bper, grp = S.bgrp || 'bank', hz = S.bzero !== false;
  const all = [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].sort().reverse();
  const cut = per ? addDays(todayISO(), -per * 30) : '';
  let ds = all.filter(d => d >= cut); if (ds.length < 2) ds = all.slice(0, 12);
  const base = S.data.positions.filter(p => !p.excl);
  const vis = base.filter(p => !hz || ds.some(d => lastAmt(p, d) > 0));
  const key = p => grp === 'place' ? p.id : grp === 'bank' ? bankOf(p) : grp === 'type' ? (p.type || 'Прочее') : '';
  const lab = p => grp === 'place' ? p.where : key(p);
  const curs = ['RUB', 'KZT', 'USD'].map(c => {
    const ps = vis.filter(p => p.cur === c), m = new Map();
    if (grp !== 'cur') ps.forEach(p => { const k = key(p); if (!m.has(k)) m.set(k, { k, label: lab(p), c, ps: [] }); m.get(k).ps.push(p); });
    return { c, ps, cols: [...m.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru')) };
  }).filter(x => x.ps.length);
  return { all, ds, grp, curs, base, vis, hz };
}
const bSum = (ps, d) => ps.reduce((s, p) => s + lastAmt(p, d), 0);

function viewBoard() {
  if (!S.data.positions.length) return '<div class="card empty">Пока пусто — импортируй Excel или добавь позиции.</div>';
  const M = boardModel(), { ds, all, grp, curs } = M, mode = S.bmode || 'sum', heat = !!S.bheat, fold = S.bfold || {}, per = S.bper === undefined ? 6 : S.bper;
  const tc = {}, tot = d => tc[d] ?? (tc[d] = curs.reduce((s, x) => s + bSum(x.ps, d) * rateOf(x.c, d), 0));
  const prevOf = d => all[all.indexOf(d) + 1];
  const val = (ps, c, d) => { const r = rateOf(c, d), v = bSum(ps, d);
    if (mode === 'rub') return v * r;
    if (mode === 'dlt') { const q = prevOf(d); return q ? v - bSum(ps, q) : null; }
    if (mode === 'shr') { const t = tot(d); return t ? v * r / t * 100 : null; }
    return v; };
  const fv = v => v == null ? '' : mode === 'dlt' ? (v === 0 ? '' : (v > 0 ? '+' : '') + nf.format(Math.round(v))) : v === 0 ? '<span class="mut">—</span>' : mode === 'shr' ? v.toFixed(1).replace('.', ',') + '%' : nf.format(Math.round(v));
  let maxR = 1; if (heat) curs.forEach(x => (grp === 'cur' ? [{ ps: x.ps }] : x.cols).forEach(g => ds.forEach(d => { maxR = Math.max(maxR, bSum(g.ps, d) * rateOf(x.c, d)); })));
  const cell = (ps, c, d, sub) => { const v = val(ps, c, d); let cls = 'bd-c cc-' + c + (sub ? ' bd-s' : ''), st = '';
    if (heat && !sub && mode !== 'dlt' && v) st = ` style="background:color-mix(in srgb,var(--cc-${c}) ${Math.round(8 + 52 * Math.sqrt(Math.min(1, bSum(ps, d) * rateOf(c, d) / maxR)))}%,transparent)"`;
    if (mode === 'dlt' && v) cls += v > 0 ? ' up' : ' dn';
    let a = '', tt = '';
    if (ps.length === 1 && !sub) { const h = ps[0].history.find(x => x.d === d); if (h && h.est) cls += ' est'; else if (!h && v) cls += ' carry'; if (mode === 'sum') { a = ` data-a="bcell" data-id="${ps[0].id}" data-d="${d}"`; tt = h ? (h.est ? 'расчёт приложения — нажми, чтобы поправить' : 'введено') : 'без изменений с прошлого снимка'; } }
    return `<td class="${cls}"${st}${a}${tt ? ` title="${tt}"` : ''}><span class="money">${fv(v)}</span></td>`; };
  const head1 = curs.map(x => { const f = fold[x.c] || !x.cols.length; return `<th class="bd-cur cc-${x.c}" colspan="${f ? 1 : x.cols.length + 1}" data-a="bfold" data-id="${x.c}" title="свернуть / развернуть">${SYM[x.c]} ${BCN[x.c]} ${x.cols.length ? (fold[x.c] ? '▸' : '▾') : ''}</th>`; }).join('');
  const head2 = curs.map(x => (fold[x.c] || !x.cols.length ? '' : x.cols.map(g => `<th class="bd-h cc-${x.c}"${g.ps.length > 1 || grp === 'type' ? ` data-a="bgroup" data-id="${esc(g.k)}" data-c="${x.c}"` : ` data-a="editPos" data-id="${g.ps[0].id}"`} title="${esc(g.label)}${g.ps.length > 1 ? ' · мест: ' + g.ps.length : ''}">${esc(g.label.length > 13 ? g.label.slice(0, 12) + '…' : g.label)}</th>`).join('')) + `<th class="bd-h bd-s cc-${x.c}">Σ ${SYM[x.c]}</th>`).join('');
  const rows = ds.map(d => { const t = tot(d), q = prevOf(d), dl = q ? t - tot(q) : null, est = S.data.positions.some(p => p.history.some(h => h.d === d && h.est));
    const body = curs.map(x => (fold[x.c] || !x.cols.length ? '' : x.cols.map(g => cell(g.ps, x.c, d, false)).join('')) + cell(x.ps, x.c, d, true)).join('');
    return `<tr><th class="bd-d" data-a="snap" data-id="${d}" title="открыть снимок">${fmtDate(d)}${est ? ' <span class="bd-est">≈</span>' : ''}</th>${body}<td class="bd-c bd-t bd-r2"><span class="money">${nf.format(Math.round(t))}</span></td><td class="bd-c bd-r1">${dl == null ? '' : `<span class="${dl >= 0 ? 'up' : 'dn'}">${dl >= 0 ? '▲' : '▼'} ${short(Math.abs(dl))}</span>`}</td></tr>`; }).join('');
  /* сводные плашки */
  const d0 = ds[0], dN = ds[ds.length - 1]; let best = null;
  curs.forEach(x => x.ps.forEach(p => { const f = lastAmt(p, dN) * rateOf(x.c, dN), l = lastAmt(p, d0) * rateOf(x.c, d0); if (f > 0 && l > 0) { const g = (l - f) / f * 100; if (!best || g > best.g) best = { g, n: p.where }; } }));
  const dper = tot(d0) - tot(dN), nowN = M.base.filter(p => lastAmt(p) > 0).length;
  const seg = (arr, act, cur) => `<div class="seg">${arr.map(([k, l]) => `<button class="${String(cur) === String(k) ? 'on' : ''}" data-a="${act}" data-id="${k}">${l}</button>`).join('')}</div>`;
  return `<div class="bdbar"><div class="row wrap" style="gap:8px"><span class="sm mut">Группировать:</span>${seg(BGR, 'bgrp', grp)}${seg(BMO, 'bmode', mode)}
    <button class="bdpill ${M.hz ? 'on' : ''}" data-a="bzero">${M.hz ? '✓ ' : ''}Скрыть нулевые</button>${seg(BPER, 'bper', per)}</div>
    <div class="row wrap" style="gap:8px"><button class="bdpill ${heat ? 'on' : ''}" data-a="bheat">🔥 Тепловая карта</button><div class="grow"></div><button class="btn sm" data-a="newPos">+ Место</button><button class="btn sm pri" data-a="snap">+ Снимок</button></div>
    <div class="row wrap" style="gap:8px"><span class="bdchip">Итог <b class="money">${nf.format(Math.round(tot(d0)))} ₽</b></span><span class="bdchip">Δ за период <b class="${dper >= 0 ? 'up' : 'dn'} money">${dper >= 0 ? '+' : '−'}${short(Math.abs(dper))}</b></span>${best ? `<span class="bdchip">Лучший рост: <b>${esc(best.n)} ${best.g >= 0 ? '+' : ''}${best.g.toFixed(0)}%</b></span>` : ''}<span class="bdchip">Мест с деньгами: <b>${nowN} из ${M.base.length}</b></span></div></div>
  <div class="card bd-card"><div class="bd-w"><table class="bd"><thead><tr><th class="bd-d" rowspan="2">Дата</th>${head1}<th class="bd-h bd-t bd-r2" rowspan="2">Итог ₽</th><th class="bd-h bd-r1" rowspan="2">Δ</th></tr><tr>${head2}</tr></thead><tbody>${rows}</tbody></table></div></div>
  <div class="sm mut" style="margin-top:10px">${M.hz ? `Нулевые места скрыты (${M.base.length - M.vis.length}) · ` : ''}клик по валюте ▾ — свернуть до одной суммы · клик по ячейке — правка · клик по названию — открыть место или группу · <i class="est">≈</i> — расчёт приложения, бледным — без изменений с прошлого снимка · банк места задаётся в карточке места</div>`;
}

/* группа (банк / тип): переименовать и открыть места */
function boardGroup(k, c) {
  const M = boardModel(), g = M.curs.flatMap(x => x.cols).find(z => z.k === k && z.c === c); if (!g) return;
  const fld = M.grp === 'type' ? 'type' : 'bank', nm = M.grp === 'type' ? 'Тип' : 'Банк';
  modal(`<div class="row" style="margin-bottom:8px"><h3 class="grow">${esc(g.label)}</h3><button class="ic" data-x="c">${ic('x')}</button></div>
  <label class="f">${nm} (для всех мест ниже)<input class="inp" id="bgn" value="${esc(g.label)}"></label>
  <div class="col" style="margin:10px 0;gap:4px">${g.ps.map(p => `<div class="hist"><span class="grow">${esc(p.where)}</span><b class="money">${fmt(lastAmt(p), p.cur)}</b><button class="btn sm" data-x="e" data-id="${p.id}">Открыть</button></div>`).join('')}</div>
  <button class="btn pri" data-x="ok" style="width:100%">Сохранить название</button>`, ov => {
    ov.addEventListener('click', async e => { const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
      if (x === 'c') return closeModal('ov');
      if (x === 'e') { closeModal('ov'); return openPos(b.dataset.id); }
      if (x === 'ok') { const v = $('#bgn', ov).value.trim(); if (!v) return toast('Введи название'); g.ps.forEach(p => { p[fld] = v; }); await persist(); closeModal('ov'); render(); } });
  });
}

function boardCell(id, d) {
  const p = S.data.positions.find(x => x.id === id); if (!p) return; const h = p.history.find(x => x.d === d), est = estAt(p, d);
  modal(`<div class="row" style="margin-bottom:8px"><h3 class="grow">${esc(p.where)} · ${fmtDate(d)}</h3><button class="ic" data-x="c">${ic('x')}</button></div>
  <label class="f">Сумма, ${SYM[p.cur]}<input class="inp" id="bcv" inputmode="decimal" value="${h ? Math.round(h.amt * 100) / 100 : ''}" placeholder="${Math.round(lastAmt(p, d))}"></label>
  <div class="sm mut" style="margin:8px 0">${p.rate && p.cap ? `По условиям (${capName(p.cap).toLowerCase()}, ${p.rate}%) на эту дату ≈ ${fmt(est, p.cur)}` : 'Для расчёта укажи в позиции ставку и способ начисления'}</div>
  <div class="row wrap"><button class="btn pri grow" data-x="ok">Сохранить</button>${h ? '<button class="btn" data-x="del">Убрать запись</button>' : ''}</div>`, ov => {
    $('#bcv', ov).focus();
    ov.addEventListener('click', async e => { const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x; if (x === 'c') return closeModal('ov');
      if (x === 'ok') { const v = num($('#bcv', ov).value); if (v == null) return toast('Введи сумму'); p.history = p.history.filter(z => z.d !== d); p.history.push({ d, amt: v }); p.history.sort((m, q) => m.d < q.d ? -1 : 1); }
      if (x === 'del') p.history = p.history.filter(z => z.d !== d);
      await persist(); closeModal('ov'); render(); });
    $('#bcv', ov).addEventListener('keydown', e => { if (e.key === 'Enter') ov.querySelector('[data-x=ok]').click(); });
  });
}
