/* интерактив в духе Kokonut: удержание, undo, палитра команд, остров автоблока, свайпы, шторка, FLIP */
const holdBtn = (text, act, cls = '', ms = 800) => `<button type="button" class="btn hold ${cls}" data-hold="${act}" data-ms="${ms}" style="--hold:${ms}ms"><span class="fill"></span><span>Удерживай: ${text}</span></button>`;

function undoToast(text, fn, ms = 6500) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div'); el.className = 'toast u'; el.innerHTML = `<span>${esc(text)}</span><button class="btn sm pri">Отменить</button>`;
  el.querySelector('button').onclick = () => { el.remove(); fn(); }; document.body.appendChild(el); setTimeout(() => el.remove(), ms);
}

/* FLIP: плавная перестановка строк при фильтре/поиске */
const flipSnap = () => { const m = {}; document.querySelectorAll('.item[data-id]').forEach(e => m[e.dataset.id] = e.getBoundingClientRect().top); return m; };
function flipPlay(m) {
  if (RM) return;
  document.querySelectorAll('.item[data-id]').forEach(e => {
    const o = m[e.dataset.id];
    if (o == null) { e.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); return; }
    const dy = o - e.getBoundingClientRect().top; if (Math.abs(dy) > 1) e.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.34,1.3,.64,1)' });
  });
}

function closeModal(id = 'ov', instant = false) {
  const o = document.getElementById(id); if (!o) return;
  if (instant || RM) { o.remove(); return; }
  o.classList.add('out'); o.removeAttribute('id'); setTimeout(() => o.remove(), 190);
}

/* шторка: тянется вниз пальцем, пружинит назад */
function bindSheetDrag(ov) {
  const sh = ov.querySelector('.sheet'), g = ov.querySelector('.grab'); if (!g) return;
  let y0 = 0, dy = 0, t0 = 0, on = false;
  g.addEventListener('pointerdown', e => { on = true; y0 = e.clientY; t0 = performance.now(); dy = 0; g.setPointerCapture(e.pointerId); sh.style.animation = 'none'; });
  g.addEventListener('pointermove', e => { if (!on) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  const end = () => {
    if (!on) return; on = false; const v = dy / Math.max(1, performance.now() - t0);
    if ((dy > 110 || v > .6) && !ov.dataset.sticky) { sh.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(105%)' }], { duration: 190, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).onfinish = () => ov.remove(); }
    else { sh.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 440, easing: 'cubic-bezier(.34,1.56,.64,1)' }); sh.style.transform = ''; }
  };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
}

/* палитра команд (Ctrl+K) */
function openPalette() {
  if (!S.data) return;
  const items = () => [
    ...TABS.map(([k, t, i]) => ({ l: 'Перейти: ' + t, h: 'раздел', i, run: () => { S.tab = k; S.q = ''; S.filter = 'Все'; S.fresh = true; render(); scrollTo(0, 0); } })),
    { l: 'Добавить место', h: 'действие', i: 'plus', run: () => openPos(null) },
    { l: S.data.settings.hide ? 'Показать суммы' : 'Скрыть суммы', h: 'действие', i: 'eye', run: () => { S.data.settings.hide = !S.data.settings.hide; persist(); render(); } },
    { l: 'Заблокировать', h: 'действие', i: 'lock', run: lock },
    { l: 'Цель накопления', h: 'действие', i: 'gear', run: openGoal },
    { l: 'Ставки банков', h: 'справочник', i: 'list', run: openOffers },
    { l: 'Импорт из Excel', h: 'данные', i: 'xls', run: () => actions('xlsx', { dataset: {} }) },
    ...S.data.positions.filter(p => !p.archived).map(p => ({ l: p.where, h: `${esc(p.type)} · <span class="money">${fmt(lastAmt(p), p.cur)}</span>`, i: 'list', hh: 1, run: () => openPos(p.id) })),
  ];
  let sel = 0, list = [];
  modal(`<input class="inp" id="pq" placeholder="Место или команда…" autocomplete="off"><div id="pl" style="margin-top:8px"></div><div class="sm mut" style="padding:8px 4px 0"><kbd>↑↓</kbd> выбрать · <kbd>Enter</kbd> открыть · <kbd>Esc</kbd> закрыть</div>`, ov => {
    ov.classList.add('top'); const q = $('#pq', ov), pl = $('#pl', ov);
    const draw = () => {
      const w = q.value.toLowerCase().split(/\s+/).filter(Boolean); const all = items();
      list = all.filter(x => w.every(t => (x.l + ' ' + x.h.replace(/<[^>]+>/g, '')).toLowerCase().includes(t))).slice(0, 9); sel = Math.min(sel, Math.max(0, list.length - 1));
      pl.innerHTML = list.length ? list.map((x, i) => `<div class="pal-i ${i === sel ? 'on' : ''}" data-n="${i}">${ic(x.i)}<span>${esc(x.l)}</span><small>${x.hh ? x.h : esc(x.h)}</small></div>`).join('') : '<div class="empty">Ничего не найдено</div>';
    };
    const go = i => { const it = list[i]; if (!it) return; closeModal('ovk'); setTimeout(it.run, 30); };
    q.addEventListener('input', () => { sel = 0; draw(); });
    q.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { sel = Math.min(list.length - 1, sel + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { go(sel); e.preventDefault(); }
    });
    pl.addEventListener('click', e => { const r = e.target.closest('[data-n]'); if (r) go(+r.dataset.n); });
    pl.addEventListener('pointermove', e => { const r = e.target.closest('[data-n]'); if (r && +r.dataset.n !== sel) { sel = +r.dataset.n; pl.querySelectorAll('.pal-i').forEach((x, i) => x.classList.toggle('on', i === sel)); } });
    draw(); q.focus();
  }, 'ovk');
}

/* остров автоблокировки */
let isleEl = null;
function tickIsland() {
  if (!S.data) { if (isleEl) { isleEl.remove(); isleEl = null; } return; }
  const m = S.data.settings.autolock, rem = S.idleAt - Date.now();
  if (m > 0 && rem > 0 && rem <= 60000) {
    if (!isleEl) { isleEl = document.createElement('div'); isleEl.className = 'isle'; document.body.appendChild(isleEl); }
    const s = Math.ceil(rem / 1000); isleEl.innerHTML = `${ic('lock')}<span>Блокировка через ${Math.floor(s / 60)}:${pad(s % 60)}</span><b class="sm" style="color:var(--acc)">продлить</b>`;
  } else if (isleEl) { isleEl.remove(); isleEl = null; }
}

function initUI() {
  /* удержание */
  let holdT = null, holdEl = null;
  const stop = () => { clearTimeout(holdT); if (holdEl) holdEl.classList.remove('holding'); holdEl = null; };
  const start = el => {
    if (holdEl) return; holdEl = el; el.classList.add('holding');
    holdT = setTimeout(() => { const e = holdEl; stop(); navigator.vibrate && navigator.vibrate(18); e.dispatchEvent(new CustomEvent('holddone', { bubbles: true, detail: { act: e.dataset.hold } })); }, +el.dataset.ms || 800);
  };
  document.addEventListener('pointerdown', e => { const b = e.target.closest('[data-hold]'); if (b) { e.preventDefault(); start(b); } });
  document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
  document.addEventListener('pointermove', e => { if (holdEl && !holdEl.contains(e.target)) stop(); });
  document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('[data-hold]'); if (b && (e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start(b); } });
  document.addEventListener('keyup', e => { if ((e.key === 'Enter' || e.key === ' ') && holdEl) stop(); });
  /* горячие клавиши */
  document.addEventListener('keydown', e => {
    if (!S.data) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('#ovk')) closeModal('ovk'); else openPalette(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) && !$('.ov')) { e.preventDefault(); openPalette(); }
  });
  /* свайп вкладок на телефоне */
  let sx = 0, sy = 0, ok = false;
  document.addEventListener('touchstart', e => {
    ok = !!S.data && !$('.ov') && !!e.target.closest('.main') && !e.target.closest('.chips,#lc,.heat,input,textarea,select,.seg');
    if (ok) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!ok) return; ok = false; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 45) {
      const i = TABS.findIndex(x => x[0] === S.tab), j = Math.max(0, Math.min(TABS.length - 1, i + (dx < 0 ? 1 : -1)));
      if (j !== i) { S.tab = TABS[j][0]; S.q = ''; S.filter = 'Все'; S.fresh = true; render(); scrollTo(0, 0); }
    }
  }, { passive: true });
  setInterval(tickIsland, 1000);
}
