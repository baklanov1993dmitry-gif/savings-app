const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs=[]; const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/savings/savings.html'); const PW='тест-пароль фраза 2026';
  await p.fill('#p1', PW); await p.fill('#p2', PW); await p.uncheck('#demo').catch(()=>{}); await p.click('#go'); await p.waitForSelector('.reccode'); await p.check('#ok'); await p.click('#go'); await p.waitForSelector('.main');
  await p.evaluate(() => { S.tab = 'set'; S.fresh = true; render(); });
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-a=xlsx]')]); await fc.setFiles('real2.xlsx'); await p.waitForSelector('[data-k]');
  console.log(await p.$$eval('[data-k]', e => e.map(x => x.parentElement.innerText.replace(/\n/g,' | ').slice(0,260) + (x.disabled?' [off]':''))));
  
  await p.click('[data-x=go]'); await p.waitForTimeout(600);
  console.log(JSON.stringify(await p.evaluate(() => { const a=A(); return { pos:S.data.positions.length, notes:S.data.notes.length, crypto:a.crypto.rows.length, years:a.years.map(y=>y.y+':'+y.start+'/'+y.end+'/'+y.work), banks:a.banks.length, tot:Math.round(totals().rub), arch:S.data.positions.filter(p=>p.archived).length, byCur:['RUB','KZT','USD'].map(c=>c+':'+Math.round(S.data.positions.filter(p=>!p.archived&&p.cur===c).reduce((s,p)=>s+lastAmt(p),0))).join(' '), types:[...new Set(S.data.positions.map(p=>p.type))], sample:S.data.positions.slice(0,6).map(p=>[p.type,p.where,p.cur,p.rate,p.close,lastAmt(p)].join('|')) }; })));
  console.log(await p.$$eval('[data-k]',e=>0));
  for (const sec of ['home','cmp','tax']) { await p.evaluate(sec => { S.tab='an'; S.asec=sec; S.fresh=true; render(); }, sec); await p.waitForTimeout(700); await p.screenshot({ path: 'shots/v4_'+sec+'.png', fullPage: true }); }
  console.log(JSON.stringify(await p.evaluate(() => { const a=A(); return { home:a.home.rows.length, hn:a.home.notes.length, cmp:[a.cmp.rf,a.cmp.kz,a.cmp.kzt,a.cmp.fxs.length], tax:a.tax.notes.length }; })));
  await p.evaluate(() => { S.asec='home'; render(); }); await p.fill('[data-ap="home.rf"]','15'); await p.press('[data-ap="home.rf"]','Tab'); await p.fill('[data-ap="home.fxNow"]','6.2'); await p.press('[data-ap="home.fxNow"]','Tab'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/v4_home2.png', fullPage: true });
  await p.evaluate(() => { S.asec='tax'; render(); }); await p.fill('[data-ap="tax.salary"]','200000'); await p.waitForTimeout(150); await p.fill('[data-ap="tax.dep"]','400000'); await p.press('[data-ap="tax.dep"]','Tab'); await p.waitForTimeout(300); console.log('TAX', await p.textContent('.kpis'));
  await p.evaluate(() => { S.tab='home'; S.fresh=true; render(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { S.tab='an'; S.asec='years'; S.fresh=true; render(); }); await p.waitForTimeout(800); await p.screenshot({ path: 'shots/v3_real_years.png', fullPage: true });
  console.log('ERR', errs); await b.close();
})();
