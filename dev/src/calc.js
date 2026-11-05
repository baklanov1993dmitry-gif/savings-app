/* ===== движок расчёта вкладов и счетов =====
   Условия позиции:
   rate      — ставка, % годовых
   cap       — 'day' ежедневная капитализация | 'month' ежемесячно | 'quarter' ежеквартально |
               'end' без капитализации, % в конце срока | 'pay' % выплачиваются на другой счёт ежемесячно | '' не считать
   limit     — до какой суммы действует ставка; rateOver — ставка на сумму свыше лимита
   promoTo   — до какой даты действует ставка; rateAfter — ставка после этой даты
   open/close — даты; prolong — автопролонгация на тот же срок; после закрытия без пролонгации % не идут */
const CAPS = [['month', 'Капитализация ежемесячно'], ['day', 'Капитализация ежедневно'], ['quarter', 'Капитализация раз в квартал'], ['end', 'Без капитализации — % в конце срока'], ['pay', 'Без капитализации — % выплачиваются ежемесячно на другой счёт'], ['', 'Проценты не считать']];
const capName = c => (CAPS.find(x => x[0] === (c || '')) || CAPS[5])[1];

/** пройти по дням от d0 (сумма a0) до d1. Возвращает {bal, acc, paid}: bal — что покажет банк, acc — начислено, но ещё не зачислено, paid — ушло на другой счёт */
function grow(p, d0, a0, d1) {
  const res = { bal: a0, acc: 0, paid: 0 };
  if (!p.rate || !p.cap || !d0 || !d1 || d1 <= d0 || !(a0 > 0)) return res;
  const n0 = dnum(d0), n1 = dnum(d1), lim = Number(p.limit) || 0, rOver = p.rateOver === '' || p.rateOver == null ? null : Number(p.rateOver);
  const promo = p.promoTo ? dnum(p.promoTo) : null, rAfter = p.rateAfter === '' || p.rateAfter == null ? null : Number(p.rateAfter);
  const anchor = p.open ? dnum(p.open) : n0; let close = p.close ? dnum(p.close) : null; const term = p.open && p.close ? dnum(p.close) - dnum(p.open) : 0;
  const dayOf = n => new Date(n * 864e5).getUTCDate(), aDay = dayOf(anchor);
  const isAnniv = (n, months) => { // n — день зачисления раз в `months` месяцев от даты открытия
    const t = new Date(n * 864e5), a = new Date(anchor * 864e5); const mdiff = (t.getUTCFullYear() - a.getUTCFullYear()) * 12 + t.getUTCMonth() - a.getUTCMonth();
    if (mdiff <= 0 || mdiff % months) return false; const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return t.getUTCDate() === Math.min(aDay, last);
  };
  let { bal, acc, paid } = res;
  for (let n = n0 + 1; n <= n1; n++) {
    if (close != null && n > close) {
      if (p.prolong && term > 0) { close += term; } else break;
    }
    let r = Number(p.rate); if (promo != null && n > promo && rAfter != null) r = rAfter;
    const base = bal; // база — зачисленная сумма (без капитализации % на % не начисляются)
    const inLim = lim && rOver != null ? Math.min(base, lim) : base, over = lim && rOver != null ? Math.max(0, base - lim) : 0;
    acc += (inLim * r + over * rOver) / 100 / 365;
    const credit = p.cap === 'day' || (p.cap === 'month' && isAnniv(n, 1)) || (p.cap === 'quarter' && isAnniv(n, 3));
    if (credit) { bal += acc; acc = 0; }
    else if (p.cap === 'pay' && isAnniv(n, 1)) { paid += acc; acc = 0; }
    if (close != null && n === close) { if (p.cap === 'pay') paid += acc; else bal += acc; acc = 0; }
  }
  return { bal, acc, paid };
}
/** последняя подтверждённая точка истории не позже d */
function basePoint(p, d) { let b = null; for (const h of p.history) if (h.d <= d && (!b || h.d >= b.d) && !h.est) b = h; if (!b) for (const h of p.history) if (h.d <= d && (!b || h.d >= b.d)) b = h; return b; }
/** расчётная сумма позиции на дату (по последней подтверждённой точке) */
function estAt(p, d) { const b = basePoint(p, d); if (!b) return 0; return grow(p, b.d, b.amt, d).bal; }
/** доход позиции за период (зачисленное + начисленное + выплаченное) */
function incomeOf(p, d0, a0, d1) { const g = grow(p, d0, a0, d1); return g.bal - a0 + g.acc + g.paid; }
/** угадать капитализацию по тексту условий (для старых позиций) */
function guessCap(p) {
  const t = ((p.cond || '') + ' ' + (p.comment || '')).toLowerCase();
  if (/без капитал/.test(t)) return /ежемес\w* выплат|выплата ежемес/.test(t) ? 'pay' : 'end';
  if (/ежеднев\w* капитал/.test(t)) return 'day';
  if (/капитал/.test(t)) return 'month';
  if (/в конце срока|одним платежом/.test(t)) return 'end';
  if (/вклад|депозит/i.test(p.type)) return 'end';
  return 'month';
}
