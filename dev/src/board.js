/* ===== приборная панель: даты × места (как лист «состояние средств») ===== */
function boardData(limit) {
  const ds = [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].sort().reverse().slice(0, limit);
  const cols = S.data.positions.filter(p => !p.excl && ds.some(d => lastAmt(p, d) > 0));
  const by = c => cols.filter(p => p.cur === c).sort((a, b) => a.where < b.where ? -1 : 1);
  return { ds, R: by('RUB'), K: by('KZT'), U: by('USD') };
}
function viewBoard() {
  if (!S.data.positions.length) return '<div class="card empty">Пока пусто — импортируй Excel или добавь позиции.</div>';
  const lim = S.blim || 30, { ds, R, K, U } = boardData(lim), all = [...new Set(S.data.positions.flatMap(p => p.history.map(h => h.d)))].length;
  const cell = (p, d) => { const h = p.history.find(x => x.d === d), v = h ? h.amt : lastAmt(p, d); if (!(v > 0) && !h) return '<td class="bd-c"></td>';
    return `<td class="bd-c ${h ? (h.est ? 'est' : '') : 'carry'}" data-a="bcell" data-id="${p.id}" data-d="${d}" title="${h ? (h.est ? 'расчёт приложения — нажми, чтобы поправить' : 'введено') : 'без изменений с прошлого снимка'}">${v ? (h && h.est ? '≈ ' : '') + nf.format(Math.round(v)) : ''}</td>`; };
  const sum = (ps, d) => ps.reduce((s, p) => s + lastAmt(p, d), 0);
  const tot = d => sum(R, d) + sum(K, d) * rateOf('KZT', d) + sum(U, d) * rateOf('USD', d);
  const hd = (ps, c, l) => ps.map(p => `<th class="bd-h" title="${esc(p.where)}">${esc(p.where.length > 18 ? p.where.slice(0, 17) + '…' : p.where)}</th>`).join('') + `<th class="bd-h bd-s">${l}</th>` + (c !== 'RUB' ? `<th class="bd-h bd-s">в ₽</th>` : '');
  const rows = ds.map((d, i) => { const t = tot(d), pt = ds[i + 1] ? tot(ds[i + 1]) : null, dl = pt != null ? t - pt : null, est = S.data.positions.some(p => p.history.some(h => h.d === d && h.est));
    const grp = (ps, c) => ps.map(p => cell(p, d)).join('') + `<td class="bd-c bd-s">${nf.format(Math.round(sum(ps, d)))}</td>` + (c !== 'RUB' ? `<td class="bd-c bd-s mut">${nf.format(Math.round(sum(ps, d) * rateOf(c, d)))}</td>` : '');
    return `<tr><th class="bd-d" data-a="snap" data-id="${d}" title="открыть снимок">${fmtDate(d)}${est ? ' <span class="tag" style="font-size:10px">≈</span>' : ''}</th>${R.length ? grp(R, 'RUB') : ''}${K.length ? grp(K, 'KZT') : ''}${U.length ? grp(U, 'USD') : ''}<td class="bd-c bd-t">${nf.format(Math.round(t))}</td><td class="bd-c ${dl == null ? '' : dl >= 0 ? 'up' : 'dn'}">${dl == null ? '' : (dl >= 0 ? '+' : '') + short(dl)}</td><td class="bd-c mut">${+(1 / FX.at('KZT', d === todayISO() ? '' : d) || 0).toFixed(2) || ''}</td><td class="bd-c mut">${+(FX.at('USD', d === todayISO() ? '' : d) || 0).toFixed(2)}</td></tr>`; }).join('');
  return `<div class="row wrap" style="margin-bottom:10px;gap:8px"><div class="sm mut grow">Как твой лист «состояние средств»: строка — снимок, столбец — место. <b>≈</b> — посчитано по условиям вкладов, бледным — без изменений с прошлого раза. Нажми на сумму, чтобы поправить, на дату — открыть снимок.</div><button class="btn sm pri" data-a="snap">${ic('plus')}Снимок сейчас</button></div>
  <div class="card" style="padding:0;overflow:hidden"><div class="bd-w"><table class="bd"><thead><tr><th class="bd-d">Дата</th>${R.length ? hd(R, 'RUB', 'Итого ₽') : ''}${K.length ? hd(K, 'KZT', 'Итого ₸') : ''}${U.length ? hd(U, 'USD', 'Итого $') : ''}<th class="bd-h bd-t">Общий итог ₽</th><th class="bd-h">Δ</th><th class="bd-h">₸ за ₽</th><th class="bd-h">₽ за $</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  ${all > lim ? `<div style="text-align:center;margin-top:10px"><button class="btn sm" data-a="bmore">Показать ещё (всего снимков: ${all})</button></div>` : ''}`;
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
