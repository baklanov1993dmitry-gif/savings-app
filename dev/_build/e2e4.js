const { chromium } = require('playwright-core');
const PW = 'тест-пароль фраза 2026', F = '/root/.claude/uploads/778049b8-8f02-52f2-85e4-66ac53fe1010/fd0a05ac-__________________.xlsx';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = []; const ok = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
  const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await p.goto('file:///home/claude/savings/savings.html');
  await p.fill('#p1', PW); await p.fill('#p2', PW); await p.uncheck('#demo').catch(() => {}); await p.click('#go'); await p.waitForSelector('.reccode'); await p.check('#ok'); await p.click('#go'); await p.waitForSelector('.main');
  await p.evaluate(() => { S.tab = 'set'; S.fresh = true; render(); });
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-a=xlsx]')]); await fc.setFiles(F); await p.waitForSelector('[data-k]');
  console.log(await p.$$eval('[data-k]', els => els.map(e => e.parentElement.innerText.replace(/\n/g, ' | ').slice(0, 110))));
  await p.click('[data-x=go]'); await p.waitForTimeout(500);
  const st = await p.evaluate(() => { const a = A(); return { crypto: a.crypto.rows.length, end: a.crypto.end, years: a.years.length, banks: a.banks.length, bk: a.banks.map(x => x.d + ':' + x.list.map(l => l.bank).join('/')), pos: S.data.positions.length }; });
  console.log(JSON.stringify(st));
  await p.evaluate(() => { const c = A().crypto; c.rate = 18; persist(); S.tab = 'an'; S.asec = 'crypto'; S.fresh = true; render(); }); await p.waitForTimeout(1200); await p.screenshot({ path: 'shots/v3_crypto.png', fullPage: true });
  const k = await p.evaluate(() => { const r = cryptoCalc(); return [Math.round(r.inv), Math.round(r.bank)]; }); console.log('calc', k); ok('bank > invested', k[1] > k[0] && k[0] > 0);
  await p.click('[data-a=asec][data-id=banks]'); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/v3_banks.png', fullPage: true });
  await p.click('[data-a=asec][data-id=years]'); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/v3_years.png', fullPage: true });
  // правка ячейки банка
  await p.click('[data-a=asec][data-id=banks]'); await p.fill('[data-an="b.cell"][data-k=daily]', '25'); await p.press('[data-an="b.cell"][data-k=daily]', 'Tab'); await p.waitForTimeout(300);
  ok('cell edit persisted', await p.evaluate(() => A().banks.some(s => s.list.some(l => l.daily === 25))));
  // мобильный вид
  await p.setViewportSize({ width: 390, height: 800 }); await p.evaluate(() => { S.asec = 'crypto'; render(); }); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/v3_crypto_m.png' });
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
