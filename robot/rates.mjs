// Робот курсов: раз в день собирает публичные курсы и ставки в rates.json (никаких личных данных).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const FILE = 'rates.json';
const db = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : { hist: {} };
const iso = d => d.toISOString().slice(0, 10), dmy = s => s.split('-').reverse().join('.');
const today = iso(new Date());
const get = async (u, o = {}) => { const r = await fetch(u, { ...o, headers: { 'user-agent': 'savings-rates-robot', ...(o.headers || {}) }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.text(); };
const log = (...a) => console.log(...a);

async function cbr(date) { // ₽ за $ и ₽ за 1 ₸
  const u = date === today ? 'https://www.cbr-xml-daily.ru/daily_json.js' : `https://www.cbr-xml-daily.ru/archive/${date.replace(/-/g, '/')}/daily_json.js`;
  const j = JSON.parse(await get(u)), U = j.Valute.USD, K = j.Valute.KZT;
  return { usd: +(U.Value / U.Nominal).toFixed(4), kzt: +(K.Value / K.Nominal).toFixed(6) };
}
async function nbk(date) { // ₸ за 1 ₽ и ₸ за $
  const x = await get('https://nationalbank.kz/rss/get_rates.cfm?fdate=' + dmy(date)), out = {};
  for (const m of x.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const t = (m[1].match(/<title>\s*([A-Z]{3})\s*<\/title>/) || [])[1], v = parseFloat(((m[1].match(/<description>\s*([\d.,]+)\s*<\/description>/) || [])[1] || '').replace(',', '.')), q = parseFloat((m[1].match(/<quant>\s*(\d+)\s*<\/quant>/) || [])[1] || '1');
    if (t === 'RUB' && v) out.rubKzt = +(v / q).toFixed(4); if (t === 'USD' && v) out.usdKzt = +(v / q).toFixed(2);
  }
  return out;
}
async function keyRate() { // ключевая ставка ЦБ РФ
  const from = iso(new Date(Date.now() - 120 * 864e5));
  try {
    const body = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><KeyRateXML xmlns="http://web.cbr.ru/"><fromDate>${from}</fromDate><ToDate>${today}</ToDate></KeyRateXML></soap12:Body></soap12:Envelope>`;
    const x = await get('https://www.cbr.ru/DailyInfoWebServ/DailyInfo.asmx', { method: 'POST', body, headers: { 'content-type': 'application/soap+xml; charset=utf-8' } });
    const rows = [...x.matchAll(/<DT>([\d-]{10})[^<]*<\/DT>\s*<Rate>([\d.]+)<\/Rate>/g)].map(m => [m[1], +m[2]]).sort();
    if (rows.length) return { key: rows[rows.length - 1][1], keyDate: rows[rows.length - 1][0] };
  } catch (e) { log('key soap', e.message); }
  const h = await get('https://www.cbr.ru/hd_base/KeyRate/');
  const m = h.match(/<td>(\d{2}\.\d{2}\.\d{4})<\/td>\s*<td>(\d+,\d+)<\/td>/);
  if (m) return { key: +m[2].replace(',', '.'), keyDate: m[1].split('.').reverse().join('-') };
  throw new Error('key not found');
}
async function baseRate() { // базовая ставка НБ РК (со страницы — может сломаться, тогда держим прошлое значение)
  const h = await get('https://nationalbank.kz/ru/page/bazovaya-stavka-dkp-functions');
  const t = h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const m = t.match(/базов\w* ставк\w*[^%]{0,120}?(\d{1,2}(?:[,.]\d{1,2})?)\s*%/i);
  if (!m) throw new Error('base not found'); const v = +m[1].replace(',', '.'); if (!(v > 1 && v < 40)) throw new Error('base odd ' + v); return { base: v };
}
async function btc() { // цена биткоина в $ (CoinGecko, запасной — Coinbase)
  try { const j = JSON.parse(await get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')); if (j.bitcoin && j.bitcoin.usd > 0) return { btc: Math.round(j.bitcoin.usd) }; } catch (e) { log('btc gecko', e.message); }
  const j = JSON.parse(await get('https://api.coinbase.com/v2/prices/BTC-USD/spot')); const v = +j.data.amount; if (!(v > 0)) throw new Error('btc odd'); return { btc: Math.round(v) };
}
const tryIt = async (n, f) => { try { const r = await f(); log(n, JSON.stringify(r)); return r; } catch (e) { log(n, 'FAIL', e.message); return {}; } };

const now = { ...(await tryIt('cbr', () => cbr(today))), ...(await tryIt('nbk', () => nbk(today))), ...(await tryIt('key', keyRate)), ...(await tryIt('base', baseRate)), ...(await tryIt('btc', btc)) };
const prev = db.today || {};
db.today = { ...prev, ...now }; db.updated = new Date().toISOString();
db.hist[today] = { ...(db.hist[today] || {}), ...Object.fromEntries(Object.entries(db.today).filter(([k]) => k !== 'keyDate')) };

// один раз: заполнить историю раз в неделю с 2024 года (для графиков курсов)
if (!db.backfilled) {
  let d = new Date('2024-01-01T00:00:00Z'); const end = new Date(Date.now() - 864e5); let n = 0;
  while (d < end && n < 200) {
    const s = iso(d); if (!db.hist[s]) { const r = { ...(await tryIt('cbr ' + s, () => cbr(s))), ...(await tryIt('nbk ' + s, () => nbk(s))) }; if (Object.keys(r).length) db.hist[s] = r; n++; }
    d = new Date(d.getTime() + 7 * 864e5);
  }
  db.backfilled = true;
}
// один раз: история биткоина за год (раз в день, кладём раз в неделю)
if (!db.btcFilled) { try { const j = JSON.parse(await get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily'));
  let last = ''; for (const [t, v] of j.prices || []) { const s = iso(new Date(t)); if (last && s < last) continue; last = iso(new Date(new Date(s + 'T00:00:00Z').getTime() + 7 * 864e5)); db.hist[s] = { ...(db.hist[s] || {}), btc: Math.round(v) }; } db.btcFilled = true; } catch (e) { log('btc hist FAIL', e.message); } }
db.hist = Object.fromEntries(Object.entries(db.hist).sort());
writeFileSync(FILE, JSON.stringify(db));
log('ok', JSON.stringify(db.today));
