/* ===== курсы и снимки ===== */
const FX = {
  st() { const s = S.data.settings; s.fx = s.fx || { auto: true, mig: false, upd: '', src: '' }; s.rh = s.rh || {}; return s.fx; },
  /** курс на дату: последний сохранённый снимок курсов <= d, иначе текущий */
  at(c, d) {
    if (c === 'RUB') return 1; const rh = S.data.settings.rh || {};
    if (d && d < todayISO()) {
      let best = ''; for (const k in rh) if (k <= d && k > best && rh[k][c]) best = k;
      const p = FX.pubAt(d), pv = p ? (c === 'USD' ? p.usd : (p.rubKzt ? 1 / p.rubKzt : p.kzt)) : 0;
      if (best && (!p || !pv || best >= p.d)) return rh[best][c]; if (pv) return pv; if (best) return rh[best][c];
    }
    return S.data.settings.rates[c] || 0;
  },
  /** публичные курсы и ставки от робота (rates.json рядом с приложением) */
  pub: null,
  loadPub() { if (FX.pub) return FX.pub; try { FX.pub = JSON.parse(LS.get('sv_pub') || 'null'); } catch (e) { FX.pub = null; } return FX.pub; },
  pubAt(d) { const P = FX.loadPub(); if (!P || !P.hist) return null; let best = null; for (const k in P.hist) if (k <= d && (!best || k > best)) best = k; return best ? { d: best, ...P.hist[best] } : null; },
  async fetch() {
    const f = FX.st(); if (!navigator.onLine) return false; let usd = 0, kzt = 0, src = '';
    try { // 1) робот: тот же сайт, работает и на телефоне
      const r = await fetch('rates.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); if (j && j.today) { FX.pub = j; try { LS.set('sv_pub', JSON.stringify(j)); } catch (e) { } usd = j.today.usd; kzt = j.today.rubKzt ? 1 / j.today.rubKzt : j.today.kzt; src = j.today.rubKzt ? 'ЦБ РФ ($), НБ РК (₸)' : 'ЦБ РФ'; } }
    } catch (e) { }
    if (!(usd > 0 && kzt > 0)) try { // 2) напрямую ЦБ
      const r = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { cache: 'no-store' }); if (r.ok) { const j = await r.json(), u = j.Valute.USD, k = j.Valute.KZT; usd = +u.Value / (u.Nominal || 1); kzt = +k.Value / (k.Nominal || 1); src = 'ЦБ РФ'; }
    } catch (e) { }
    if (!(usd > 0 && kzt > 0)) return false;
    f.upd = todayISO(); f.src = src; f.auto = { USD: +usd.toFixed(4), KZT: +kzt.toFixed(6) };
    if (f.mig) { await persist(); return true; }
    const rt = S.data.settings.rates, ch = Math.abs(rt.USD - usd) > 1e-6 || Math.abs(rt.KZT - kzt) > 1e-6;
    rt.USD = f.auto.USD; rt.KZT = f.auto.KZT;
    if (ch) { await persist(); if (S.tab === 'home' || S.tab === 'set' || S.tab === 'board') render(); }
    return true;
  },
  /** ключевые ставки: ЦБ РФ и НБ РК */
  keys() { const P = FX.loadPub(); return P && P.today ? { key: P.today.key, keyDate: P.today.keyDate, base: P.today.base } : {}; },
  lastSnap() {
    const s = S.data.settings; let m = s.snapAt || '';
    if (!m) for (const p of S.data.positions) for (const h of p.history) if (h.d > m) m = h.d;
    return m;
  },
  /** даты с расчётными (неподтверждёнными) суммами */
  pending() { const ds = new Set(); for (const p of S.data.positions) for (const h of p.history) if (h.est) ds.add(h.d); return [...ds].sort(); },
  /** сам делает снимки раз в 14 дней, догоняя пропущенные: суммы — по условиям вкладов, курсы — на ту дату */
  async auto() {
    const s = S.data.settings, T = todayISO(); if (s.snapOff || !S.data.positions.length) return 0;
    let last = FX.lastSnap(); if (!last) return 0; let n = 0;
    while (addDays(last, 14) <= T && n < 30) {
      const d = addDays(last, 14);
      for (const p of S.data.positions) { if (p.history.some(h => h.d === d)) continue; const a0 = lastAmt(p, d); if (!(a0 > 0) || p.archived && lastAmt(p, d) === 0) continue; p.history.push({ d, amt: Math.round(estAt(p, d) * 100) / 100, est: true }); p.history.sort((x, y) => x.d < y.d ? -1 : 1); }
      s.rh = s.rh || {}; s.rh[d] = d === T ? { KZT: s.rates.KZT, USD: s.rates.USD } : { KZT: FX.at('KZT', d), USD: FX.at('USD', d) };
      s.snapAt = d; last = d; n++;
    }
    if (n) { await persist(); render(); }
    return n;
  },
  due() { return FX.pending().length > 0 || (!S.data.settings.snapOff && S.data.positions.length && !FX.lastSnap()); },
  banner() {
    const pd = FX.pending(); if (!pd.length) return '';
    const d = pd[pd.length - 1];
    return `<div class="card row wrap" style="margin-bottom:14px;align-items:center;border-color:var(--acc)"><div class="grow"><b>Автоснимок на ${fmtDate(d)}</b><div class="sm mut">Суммы посчитаны по условиям вкладов, курсы — автоматически${pd.length > 1 ? ` (неподтверждённых снимков: ${pd.length})` : ''}. Сверь с банками и подтверди — займёт минуту.</div></div><button class="btn pri sm" data-a="snap" data-id="${d}">Проверить</button></div>`;
  },
  open(date) {
    const f = FX.st(), s = S.data.settings, T = date || todayISO(), past = T < todayISO();
    const L = S.data.positions.filter(p => !p.archived || p.history.some(h => h.d === T)).filter(p => lastAmt(p, T) > 0 || !p.archived).sort((a, b) => a.cur === b.cur ? (a.where < b.where ? -1 : 1) : (a.cur < b.cur ? -1 : 1));
    const rK = s.rh && s.rh[T] ? s.rh[T].KZT : (past ? FX.at('KZT', T) : s.rates.KZT), rU = s.rh && s.rh[T] ? s.rh[T].USD : (past ? FX.at('USD', T) : s.rates.USD);
    const rows = L.map(p => { const h = p.history.find(x => x.d === T), prev = basePoint(p, addDays(T, -1)); const v = h ? h.amt : ''; return `<div class="row" style="gap:8px;margin-bottom:6px"><div class="grow" style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.where)}</div><div class="sm mut">${prev ? 'было ' + fmt(prev.amt, p.cur) + ' на ' + fmtDate(prev.d) : 'новая'}${h && h.est ? ' · <span style="color:var(--acc)">≈ расчёт</span>' : ''}</div></div><input class="inp" style="width:140px" inputmode="decimal" data-sp="${p.id}" value="${v === '' ? '' : Math.round(v * 100) / 100}" placeholder="${prev ? prev.amt : ''}"></div>`; }).join('');
    modal(`<div class="row" style="margin-bottom:8px"><h3 class="grow">Снимок на ${fmtDate(T)}</h3><button class="ic" data-x="c">${ic('x')}</button></div>
      <p class="sm mut">Поля со значком «≈» приложение посчитало само. Поправь то, что не совпадает с банком; пустое поле — сумма как в прошлый раз. Курсы подставлены${f.src ? ' (' + f.src + ')' : ''}, можно перебить своими.</p>
      <div class="grid g2" style="gap:10px;margin-bottom:10px"><label class="f">1 ₸ = ... ₽<input class="inp" id="skzt" inputmode="decimal" value="${+(+rK).toFixed(6)}"></label><label class="f">1 $ = ... ₽<input class="inp" id="susd" inputmode="decimal" value="${+(+rU).toFixed(4)}"></label></div>
      <div style="max-height:46vh;overflow:auto;margin-bottom:10px">${rows}</div>
      <label class="row sm" style="gap:8px;margin-bottom:10px"><input type="checkbox" id="smig"> Курсы — мои (не обновлять автоматически)</label>
      <div class="row wrap"><button class="btn pri grow" data-x="go">Подтвердить снимок</button><button class="btn" data-x="later">Позже</button></div>`, ov => {
      $('#smig', ov).checked = !!f.mig;
      ov.addEventListener('click', async e => {
        const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
        if (x === 'c' || x === 'later') closeModal('ov');
        else if (x === 'go') {
          const k = num($('#skzt', ov).value), u = num($('#susd', ov).value); if (!(k > 0 && u > 0)) return toast('Проверь курсы');
          const my = $('#smig', ov).checked; if (!past) { const ch = Math.abs(k - s.rates.KZT) > 1e-9 || Math.abs(u - s.rates.USD) > 1e-9; s.rates.KZT = k; s.rates.USD = u; f.mig = my || (ch && f.mig); f.migUser = f.mig; }
          let n = 0; ov.querySelectorAll('[data-sp]').forEach(i => { const p = S.data.positions.find(z => z.id === i.dataset.sp); if (!p) return; const h = p.history.find(z => z.d === T); const raw = i.value.trim(); const a = raw === '' ? (h ? h.amt : lastAmt(p, T)) : num(raw); if (a == null) return; if (!h || h.amt !== a) n++; p.history = p.history.filter(z => z.d !== T); p.history.push({ d: T, amt: a }); p.history.sort((m, q) => m.d < q.d ? -1 : 1); if (a === 0 && T >= (p.history[p.history.length - 1] || {}).d) p.archived = true; });
          s.rh = s.rh || {}; s.rh[T] = { KZT: k, USD: u }; if (!s.snapAt || T > s.snapAt) s.snapAt = T;
          await persist(); closeModal('ov'); render(); toast(`Снимок на ${fmtDate(T)} подтверждён, исправлено сумм: ${n}`);
        }
      });
    });
  },
};
