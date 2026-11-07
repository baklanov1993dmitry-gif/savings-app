/* ===== Движение средств: журнал переводов «откуда → куда» ===== */
const FLN = { RUB: 1000, KZT: 5000, USD: 20 };
/** собрать переводы из позиций листа «движение средств»: пометки в клетках + пропажа суммы в одном месте и появление в другом */
function flowsFrom(positions) {
  const all = positions.flatMap(p => p.history.map(h => h.d)).sort(), first = all[0], ev = [];
  for (const p of positions) {
    const h = [...p.history].sort((a, b) => a.d < b.d ? -1 : 1); let prev = 0;
    for (const pt of h) {
      const dl = pt.amt - prev, thr = FLN[p.cur] || 1000;
      if (Math.abs(dl) >= thr && (prev === 0 || Math.abs(dl) > 0.02 * prev) && !(pt.d === first && prev === 0)) ev.push({ d: pt.d, p, dl, cur: p.cur, note: (p.notes || []).filter(n => n.d === pt.d).map(n => n.t).join('; ') });
      prev = pt.amt;
    }
  }
  const outs = ev.filter(e => e.dl < 0).sort((a, b) => a.d < b.d ? -1 : 1), ins = ev.filter(e => e.dl > 0), used = new Set(), res = [];
  const mk = (d, from, to, amt, cur, note) => ({ id: uid(), d, from, to, amt: Math.round(amt), cur, note, applied: true });
  for (const o of outs) {
    let best = null, bs = 1e18;
    for (const i of ins) {
      if (used.has(i) || i.cur !== o.cur || i.p === o.p) continue;
      const dd = Math.abs(dnum(i.d) - dnum(o.d)); if (dd > 7) continue;
      const r = Math.abs(i.dl) / Math.abs(o.dl); if (r < 0.9 || r > 1.1) continue;
      const sc = dd * 1e6 + Math.abs(1 - r) * 1e5; if (sc < bs) { bs = sc; best = i; }
    }
    if (best) { used.add(best); res.push(mk(o.d, o.p.where, best.p.where, Math.abs(o.dl), o.cur, [o.note, best.note].filter(Boolean).join('; '))); }
    else res.push(mk(o.d, o.p.where, '', Math.abs(o.dl), o.cur, o.note));
  }
  for (const i of ins) if (!used.has(i)) res.push(mk(i.d, '', i.p.where, i.dl, i.cur, i.note));
  /* пометки в клетках: «переложил с МТС», «перевел все на ВТБ» → подставить место, если пара не нашлась */
  const names = [...new Set(positions.map(p => p.where))], byTok = t => { const k = t.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').slice(0, 4); return k.length >= 3 ? names.find(n => n.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').startsWith(k)) || '' : ''; };
  for (const f of res) {
    if (!f.note) continue;
    if (!f.from) { const m = f.note.match(/(?:перелож\w*|перевел\w*|переведен\w*)\s+(?:все\s+|деньги\s+)?(?:с|со|от)\s+([А-Яа-яЁёA-Za-z0-9-]+)/i); if (m) f.from = byTok(m[1]); }
    if (!f.to) { const m = f.note.match(/(?:перелож\w*|перевел\w*|переведен\w*)\s+(?:все\s+|деньги\s+)?на\s+([А-Яа-яЁёA-Za-z0-9-]+)/i); if (m) f.to = byTok(m[1]); }
  }
  const seen = new Set();
  return res.filter(f => { const k = flKey(f); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.d < b.d ? 1 : -1);
}
const flKey = f => [f.d, f.from, f.to, f.amt, f.cur].join('|');
const flPlaces = () => [...new Set(S.data.positions.filter(p => !p.excl).map(p => p.where).concat((S.data.flows || []).flatMap(f => [f.from, f.to])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
function flFiltered() {
  const q = S.fl.q.toLowerCase();
  return (S.data.flows || []).filter(f => (!S.fl.cur || f.cur === S.fl.cur) && (!S.fl.p || f.from === S.fl.p || f.to === S.fl.p) && (!q || (f.from + ' ' + f.to + ' ' + (f.note || '')).toLowerCase().includes(q))).sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
}
function flList() {
  const L = flFiltered(); if (!L.length) return '<div class="card empty"><p>Переводов пока нет. Нажми «+ Перевод» или импортируй лист «движение средств».</p></div>';
  let h = '', mon = '';
  for (const f of L) {
    const m = f.d.slice(0, 7); if (m !== mon) { mon = m; const [y, mm] = m.split('-'); h += `<div class="flmon">${['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][+mm - 1]} ${y}</div>`; }
    h += `<div class="item fl" data-a="fedit" data-id="${f.id}" style="--cc:var(--cc-${f.cur})"><div class="fld">${fmtDate(f.d)}</div>
    <div class="grow flw"><span class="${f.from ? '' : 'mut'}">${esc(f.from || 'вне учёта')}</span><span class="fla">→</span><span class="${f.to ? '' : 'mut'}">${esc(f.to || 'вне учёта')}</span>${f.note ? `<div class="sm mut flnote">${esc(f.note)}</div>` : ''}</div>
    <div class="fls money">${fmt(f.amt, f.cur)}</div>${f.applied ? '' : `<button class="btn sm" data-a="fapply" data-id="${f.id}" title="Изменить суммы в позициях">Применить</button>`}</div>`;
  }
  return h;
}
function viewFlows() {
  const L = flFiltered(), by = {}; L.forEach(f => by[f.cur] = (by[f.cur] || 0) + f.amt);
  const pl = flPlaces();
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn pri" data-a="fnew">+ Перевод</button>
    ${['', 'RUB', 'KZT', 'USD'].map(c => `<button class="chip ${S.fl.cur === c ? 'on' : ''}" data-a="flc" data-id="${c}" ${c ? `style="--cc:var(--cc-${c})"` : ''}>${c ? SYM[c] : 'Все'}</button>`).join('')}
    <select class="inp" data-i="flp" style="max-width:220px"><option value="">Все места</option>${pl.map(x => `<option ${S.fl.p === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
    <input class="inp grow" data-i="flq" placeholder="Поиск по местам и заметкам" value="${esc(S.fl.q)}" style="min-width:140px"></div>
  <div class="row flsum" id="flsum">${Object.keys(by).map(c => `<span class="tag" style="--cc:var(--cc-${c})">${SYM[c]} <b class="money">${fmt(by[c], c)}</b></span>`).join('')}<span class="mut sm">${L.length} перев.</span></div>
  <div id="fllist">${flList()}</div>`;
}
function flEdit(f) {
  const isNew = !f, d = f || { id: uid(), d: todayISO(), from: '', to: '', amt: '', cur: 'RUB', note: '', applied: false };
  const pl = flPlaces();
  modal(`<div class="row" style="margin-bottom:8px"><h3 class="grow">${isNew ? 'Новый перевод' : 'Перевод'}</h3></div><div class="col">
  <label class="f">Дата<input class="inp" type="date" id="fd" value="${d.d}"></label>
  <label class="f">Откуда<input class="inp" id="ff" list="flpl" value="${esc(d.from)}" placeholder="место или пусто (вне учёта)"></label>
  <label class="f">Куда<input class="inp" id="ft" list="flpl" value="${esc(d.to)}" placeholder="место или пусто (вне учёта)"></label>
  <datalist id="flpl">${pl.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
  <div class="row"><label class="f grow">Сумма<input class="inp" id="fa" inputmode="decimal" value="${d.amt}"></label><label class="f">Валюта<select class="inp" id="fc">${['RUB', 'KZT', 'USD'].map(c => `<option value="${c}" ${d.cur === c ? 'selected' : ''}>${SYM[c]} ${c}</option>`).join('')}</select></label></div>
  <label class="f">Комментарий<input class="inp" id="fn" value="${esc(d.note || '')}"></label>
  ${d.applied ? '' : '<label class="row"><input type="checkbox" id="fap" checked> Применить к позициям (изменить суммы «откуда» и «куда» на эту дату)</label>'}
  <div class="row" style="justify-content:flex-end;gap:8px;margin-top:6px">${isNew ? '' : '<button class="btn bad" data-x="del" style="margin-right:auto">Удалить</button>'}<button class="btn" data-x="c">Отмена</button><button class="btn pri" data-x="ok">Сохранить</button></div></div>`, ov => {
    ov.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'c') return closeModal();
      if (b.dataset.x === 'del') { const old = f; S.data.flows = S.data.flows.filter(z => z.id !== f.id); await persist(); closeModal(); render(); undoToast('Перевод удалён', async () => { S.data.flows.push(old); await persist(); render(); }); return; }
      const amt = num($('#fa', ov).value); if (!amt || amt <= 0) return toast('Укажи сумму');
      const nf = { ...d, d: $('#fd', ov).value || todayISO(), from: $('#ff', ov).value.trim(), to: $('#ft', ov).value.trim(), amt, cur: $('#fc', ov).value, note: $('#fn', ov).value.trim() };
      if (!nf.from && !nf.to) return toast('Укажи хотя бы одно место');
      S.data.flows = S.data.flows || []; if (isNew) S.data.flows.push(nf); else Object.assign(S.data.flows.find(z => z.id === d.id), nf);
      const ap = $('#fap', ov); if (ap && ap.checked) flApply(nf);
      await persist(); closeModal(); render();
    });
  });
}
/** поменять суммы в позициях «откуда» (минус) и «куда» (плюс) на дату перевода */
function flApply(f) {
  const done = [], miss = [];
  const go = (name, sign) => {
    if (!name) return; const p = S.data.positions.find(q => !q.archived && !q.excl && q.cur === f.cur && q.where.toLowerCase() === name.toLowerCase());
    if (!p) { miss.push(name); return; }
    const a = Math.max(0, lastAmt(p, f.d) + sign * f.amt); p.history = p.history.filter(h => h.d !== f.d); p.history.push({ d: f.d, amt: a }); p.history.sort((x, y) => x.d < y.d ? -1 : 1); done.push(name);
  };
  go(f.from, -1); go(f.to, 1); f.applied = true;
  toast(done.length ? 'Суммы обновлены: ' + done.join(', ') + (miss.length ? '. Не нашёл: ' + miss.join(', ') : '') : 'Не нашёл позиции в этой валюте — суммы не менялись', 4200);
}
