/* графики, анимации, прогноз (стиль Bklit: переменные темы, пунктир для прогноза, enter-анимации) */
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let animNow = false;                       // проигрывать ли enter-анимации в этом рендере
const ease = t => 1 - Math.pow(1 - t, 3);
const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const moneyC = (n, c, mode) => `<span class="money" data-count="${n}" data-cur="${c}"${mode ? ` data-mode="${mode}"` : ''}>${fmt(n, c)}</span>`;

function countUp(root) {
  if (RM) return;
  root.querySelectorAll('[data-count]').forEach(el => {
    const v = +el.dataset.count, c = el.dataset.cur, sh = el.dataset.mode === 'short'; if (!isFinite(v)) return;
    const t0 = performance.now(), D = 850, put = x => el.textContent = sh ? short(x) : fmt(x, c);
    (function f(t) { const k = Math.min(1, (t - t0) / D); put(v * ease(k)); if (k < 1 && el.isConnected) requestAnimationFrame(f); else put(v); })(t0);
  });
}

/* ---- данные для графиков ---- */
const curAt = (cur, d) => S.data.positions.filter(p => p.cur === cur && !p.excl).reduce((s, p) => s + lastAmt(p, d), 0);
function curSeries(cur) {
  const ps = S.data.positions.filter(p => p.cur === cur && !p.excl), cut = addDays(todayISO(), -180);
  const ds = [...new Set(ps.flatMap(p => p.history.map(h => h.d)))].sort().filter(d => d >= cut);
  return ds.map(d => ps.reduce((s, p) => s + lastAmt(p, d), 0));
}
/** ожидаемая выплата к дате закрытия (по условиям вклада) */
function payoutOf(p) {
  const T = todayISO(); if (p.archived || !p.rate || !p.close || p.close <= T) return null;
  const a = lastAmt(p);
  if (p.cap === 'end' && p.open && p.open < T) { const inc = endIncome(p, p.close); return { total: a + inc, gain: inc }; }
  const g = grow(p.cap ? p : { ...p, cap: 'end' }, T, a, p.close), total = g.bal + g.acc + g.paid; return { total, gain: total - a };
}
function fcFn() {
  const T = todayISO(), ps = act();
  return t => ps.reduce((s, p) => { const a = lastAmt(p); if (t <= T || !p.rate) return s + a * rateOf(p.cur); const g = grow(p, T, a, t); return s + (g.bal + g.acc + g.paid) * rateOf(p.cur); }, 0);
}
function forecast() {
  const T = todayISO(), g = S.data.settings.goal; let end = addDays(T, 120);
  for (const p of act()) if (p.close && p.close > end && p.close <= addDays(T, 420)) end = p.close;
  if (g && g.date > end && g.date <= addDays(T, 800)) end = g.date;
  const val = fcFn(), out = [], step = Math.max(7, Math.round((dnum(end) - dnum(T)) / 26));
  for (let d = T; d < end; d = addDays(d, step)) out.push({ t: d, v: val(d), f: 1 });
  out.push({ t: end, v: val(end), f: 1 }); return out;
}

/* ---- мини-график ---- */
function spark(vals, color = 'var(--acc)') {
  if (vals.length < 2) return '<div class="spark"></div>';
  const W = 100, H = 28, mn = Math.min(...vals), mx = Math.max(...vals), X = i => i / (vals.length - 1) * W, Y = v => H - 3 - (v - mn) / ((mx - mn) || 1) * (H - 8);
  const d = vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}L${W} ${H}L0 ${H}Z" fill="${color}" opacity=".13"/><path d="${d}" pathLength="1" class="${animNow ? 'draw' : ''}" fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

/* ---- основной график: история + прогноз пунктиром ---- */
let CH = null;
function lineChart(hist) {
  const T = todayISO(), now = totals().rub; hist = hist.slice();
  if (hist.length && hist[hist.length - 1].t < T) hist.push({ t: T, v: now });
  if (!hist.length) return '<div class="empty">За выбранный период нет данных — выбери «Всё»</div>';
  const fc = S.fc ? forecast() : [], all = hist.concat(fc.slice(1));
  if (all.length < 2) return '<div class="empty">Мало данных для графика</div>';
  const W = 640, H = 240, pl = 6, pr = 6, pt = 18, pb = 26, t0 = dnum(all[0].t), t1 = dnum(all[all.length - 1].t);
  const vmax = Math.max(...all.map(p => p.v)) * 1.06, vmin = Math.min(...all.map(p => p.v)) * .94;
  const X = t => pl + (dnum(t) - t0) / (t1 - t0 || 1) * (W - pl - pr), Y = v => pt + (1 - (v - vmin) / (vmax - vmin || 1)) * (H - pt - pb);
  const P = pts => pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join('');
  const grid = [0, .5, 1].map(f => { const v = vmin + (vmax - vmin) * f, y = Y(v); return `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${W - pr}" y="${y - 4}" text-anchor="end">${short(v)}</text>`; }).join('');
  const lh = hist[hist.length - 1], area = (pts, id) => `<path d="${P(pts)}L${X(pts[pts.length - 1].t)} ${H - pb}L${X(pts[0].t)} ${H - pb}Z" fill="url(#${id})" class="${animNow ? 'fade' : ''}"/>`;
  CH = { pts: all, X, Y, W, H };
  const fcPart = fc.length > 1 ? `${area([{ t: lh.t, v: lh.v }, ...fc.slice(1)], 'ag2')}<path d="${P([{ t: lh.t, v: lh.v }, ...fc.slice(1)])}" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-dasharray="6 6" opacity=".85" class="${animNow ? 'fade' : ''}"/>
    <line x1="${X(lh.t)}" x2="${X(lh.t)}" y1="${pt}" y2="${H - pb}" stroke="var(--mut)" stroke-dasharray="2 4" opacity=".7"/><text x="${X(lh.t) - 6}" y="${H - pb - 8}" text-anchor="end">сегодня →  дальше прогноз</text>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" id="lc"><defs>
  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient>
  <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".14"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
  ${grid}${hist.length > 1 ? area(hist, 'ag') : ''}${hist.length > 1 ? `<path d="${P(hist)}" pathLength="1" class="${animNow ? 'draw' : ''}" fill="none" stroke="var(--acc)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>` : ''}${fcPart}
  <text x="${pl}" y="${H - 6}">${fmtDate(all[0].t)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end">${fmtDate(all[all.length - 1].t)}</text>
  <line id="cl" y1="${pt}" y2="${H - pb}" stroke="var(--mut)" stroke-dasharray="3 3" style="display:none"/><circle id="cc" r="5" fill="var(--acc)" stroke="var(--card)" stroke-width="2" style="display:none"/></svg><div class="tip" id="tp" style="display:none"></div>`;
}
function bindCharts() {
  const svg = $('#lc'); if (!svg || !CH) return; const tp = $('#tp'), cl = $('#cl'), cc = $('#cc');
  const mv = e => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * CH.W; let best = CH.pts[0], bd = 1e9;
    for (const p of CH.pts) { const dx = Math.abs(CH.X(p.t) - x); if (dx < bd) { bd = dx; best = p; } }
    const px = CH.X(best.t), py = CH.Y(best.v); cl.setAttribute('x1', px); cl.setAttribute('x2', px); cc.setAttribute('cx', px); cc.setAttribute('cy', py);
    cl.style.display = cc.style.display = tp.style.display = '';
    tp.innerHTML = `<b class="money">${fmt(best.v, 'RUB')}</b><br><span class="mut">${fmtDate(best.t)}${best.f ? ' · прогноз' : ''}</span>`; tp.style.left = (px / CH.W * r.width) + 'px'; tp.style.top = (py / CH.H * r.height) + 'px';
  };
  svg.addEventListener('pointermove', mv); svg.addEventListener('pointerdown', mv);
  svg.addEventListener('pointerleave', () => { cl.style.display = cc.style.display = tp.style.display = 'none'; });
}

/* ---- кольцо-структура ---- */
function donut() {
  const g = {}; for (const p of act()) { const v = rubOf(p); if (v <= 0) continue; const k = S.dmode === 'type' ? p.type : S.dmode === 'cur' ? p.cur : p.where; g[k] = (g[k] || 0) + v; }
  let parts = Object.entries(g).sort((a, b) => b[1] - a[1]); if (S.dmode === 'place' && parts.length > 7) { const rest = parts.slice(6).reduce((s, x) => s + x[1], 0); parts = [...parts.slice(0, 6), ['Прочее', rest]]; }
  const tot = parts.reduce((s, x) => s + x[1], 0); if (!tot) return '<div class="empty">Нет данных</div>';
  const col = i => `var(--c${i % 7 + 1})`; let acc = 0;
  const arcs = parts.map(([k, v], i) => { const pc = v / tot * 100, el = `<circle r="54" cx="70" cy="70" fill="none" stroke="${col(i)}" stroke-width="20" pathLength="100" stroke-dasharray="${Math.max(pc - .6, .3)} 100" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)" class="${animNow ? 'arc' : ''}" style="animation-delay:${i * 70}ms"/>`; acc += pc; return el; }).join('');
  return `<div class="donut"><svg viewBox="0 0 140 140" width="150" height="150">${arcs}<text x="70" y="68" text-anchor="middle" style="fill:var(--tx);font-weight:800;font-size:15px" class="money" data-count="${tot}" data-mode="short">${short(tot)}</text><text x="70" y="84" text-anchor="middle" style="font-size:10px;fill:var(--mut)">в рублях</text></svg>
  <div class="legend">${parts.map(([k, v], i) => `<div><i style="background:${col(i)}"></i><span>${esc(k)}</span><span>${Math.round(v / tot * 100)}%</span></div>`).join('')}</div></div>`;
}

/* ---- столбики: прирост по годам ---- */
function yearBars() {
  const T = todayISO(), all = S.data.positions.flatMap(p => p.history.map(h => h.d)).sort(); if (!all.length) return '<div class="empty">Нет данных</div>';
  const y0 = +all[0].slice(0, 4), y1 = +T.slice(0, 4), rows = [];
  for (let y = y0; y <= y1; y++) { const a = y === y0 ? all[0] : `${y - 1}-12-31`, b = y === y1 ? T : `${y}-12-31`, va = totalAt(a), vb = totalAt(b); rows.push({ y, d: vb - va, pc: va > 0 ? (vb - va) / va * 100 : null, partial: y === y1 || y === y0 }); }
  const mx = Math.max(...rows.map(r => Math.abs(r.d)), 1), W = 300, H = 150, base = H - 34, bw = Math.min(54, (W - 20) / rows.length - 14), step = (W - 20) / rows.length;
  const bars = rows.map((r, i) => {
    const h = Math.max(3, Math.abs(r.d) / mx * (base - 26)), x = 10 + i * step + (step - bw) / 2, up = r.d >= 0, y = up ? base - h : base;
    return `<g><title>${r.y}: ${r.d >= 0 ? '+' : ''}${nf.format(Math.round(r.d))} ₽${r.pc != null ? ` (${r.pc.toFixed(1)}%)` : ''}</title><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${Math.min(10, bw / 2)}" fill="${up ? 'var(--acc)' : 'var(--bad)'}" opacity="${r.partial ? .6 : 1}" class="${animNow ? 'grw' : ''}" style="transform-origin:${x + bw / 2}px ${base}px;animation-delay:${i * 90}ms"/>
    <text x="${x + bw / 2}" y="${up ? y - 6 : y + h + 13}" text-anchor="middle" class="money" style="fill:var(--tx);font-weight:700;font-size:11px">${r.d >= 0 ? '+' : '−'}${short(Math.abs(r.d))}</text>
    <text x="${x + bw / 2}" y="${H - 16}" text-anchor="middle">${r.y}</text>${r.pc != null ? `<text x="${x + bw / 2}" y="${H - 3}" text-anchor="middle" style="font-size:10px">${r.pc >= 0 ? '+' : ''}${r.pc.toFixed(0)}%</text>` : ''}</g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><line x1="6" x2="${W - 6}" y1="${base}" y2="${base}" stroke="var(--line)"/>${bars}</svg><div class="sm mut">Прирост капитала за год, включая пополнения. Бледные столбики — неполный год.</div>`;
}

/* ---- календарь закрытий (heatmap) ---- */
function heatmap() {
  const T = todayISO(), dow = (new Date(dnum(T) * 864e5).getUTCDay() + 6) % 7, start = addDays(T, -dow), W = 27;
  const byDay = {}; for (const e of events()) { const o = byDay[e.d] || (byDay[e.d] = { sum: 0, close: 0, reopen: 0 }); if (e.k === 'close') { o.close++; o.sum += rubOf(e.p); } else o.reopen++; }
  const sums = Object.values(byDay).map(o => o.sum).filter(v => v > 0).sort((a, b) => a - b);
  const lvl = v => { if (v <= 0 || !sums.length) return 0; const r = sums.indexOf(v) / Math.max(1, sums.length - 1); return sums.length === 1 ? 4 : r < .25 ? 1 : r < .5 ? 2 : r < .8 ? 3 : 4; };
  let labs = '', cells = '', lastM = -1;
  for (let w = 0; w < W; w++) {
    const dt = new Date(dnum(addDays(start, w * 7)) * 864e5), m = dt.getUTCMonth();
    if (m !== lastM && (w === 0 || dt.getUTCDate() <= 7)) { labs += `<span style="grid-column:${w + 1}">${MON[m]}</span>`; lastM = m; }
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d), o = byDay[date];
      cells += `<i class="hc l${o ? lvl(o.sum) : 0} ${date < T ? 'pst' : ''} ${date === T ? 'td' : ''} ${o && o.reopen ? 'ro' : ''} ${S.hday === date ? 'sel' : ''}" data-a="hday" data-id="${date}" style="--i:${w}" title="${fmtDate(date)}"></i>`;
    }
  }
  return `<div class="hlab">${labs}</div><div class="heat">${cells}</div>
  <div class="row sm mut" style="margin-top:8px;gap:6px"><span>меньше</span>${[0, 1, 2, 3, 4].map(l => `<i class="hc l${l} legend-hc"></i>`).join('')}<span>больше денег на закрытии</span><span class="grow"></span><span class="hdot"></span><span>можно открыть снова</span></div>
  <div id="hdetail" style="margin-top:10px">${heatDetail(S.hday)}</div>`;
}
function heatDetail(date) {
  if (!date) return '<div class="sm mut">Нажми на клетку, чтобы увидеть, что в этот день.</div>';
  const L = events().filter(e => e.d === date);
  return `<div class="sm mut" style="margin-bottom:6px">${fmtDate(date)}</div>` + (L.length ? L.map(evItem).join('') : '<div class="sm mut">В этот день ничего не происходит.</div>');
}

/* ---- цель ---- */
function goalCard() {
  const g = S.data.settings.goal;
  if (!g) return `<div class="card col"><h3>Цель</h3><div class="sm mut">Поставь цель — приложение покажет, сколько не хватает и сколько откладывать в месяц.</div><button class="btn" data-a="goal">${ic('plus')}Поставить цель</button></div>`;
  const T = todayISO(), now = totals().rub, val = fcFn(), at = val(g.date), pc = Math.min(100, now / g.amount * 100), fpc = Math.min(100, Math.max(at, now) / g.amount * 100);
  const left = daysTo(g.date), months = Math.max(.5, left / 30.4), need = Math.max(0, g.amount - at), perM = need / months;
  const verdict = left < 0 ? `<span class="tag bad">срок прошёл</span>` : need <= 0 ? `<span class="tag ok">по прогнозу хватает</span>` : `<span class="tag warn">нужно откладывать ≈ ${money(perM, 'RUB')} / мес</span>`;
  return `<div class="card col"><div class="row"><h3 class="grow">${esc(g.name || 'Цель')}</h3><button class="ic" data-a="goal">${ic('gear')}</button></div>
  <div class="row" style="align-items:baseline"><b style="font-size:24px" class="money">${fmt(now, 'RUB')}</b><span class="mut">из ${money(g.amount, 'RUB')} · ${Math.round(pc)}%</span></div>
  <div class="bar"><i class="f ${animNow ? 'g' : ''}" style="width:${fpc}%"></i><i class="${animNow ? 'g' : ''}" style="width:${pc}%"></i></div>
  <div class="sm mut">К ${fmtDate(g.date)} (${left < 0 ? 'прошло ' + (-left) : 'через ' + left} дн.) по прогнозу без новых пополнений будет ≈ ${money(at, 'RUB')}</div>${verdict}</div>`;
}
