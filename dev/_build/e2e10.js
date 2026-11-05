const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext();await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});
const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles(process.argv[2]||'real3.xlsx');await p.waitForSelector('[data-k]');
console.log((await p.$$eval('[data-k]',e=>e.map(x=>(x.checked?'[x] ':'[ ] ')+x.closest('label,div').innerText.slice(0,110).replace(/\n/g,' ')))).join('\n'));
await p.click('[data-x=go]');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const a=A();const s=series();return {tot:Math.round(totals().rub),by:totals().by,max:Math.round(Math.max(...s.map(x=>x.v))),pos:S.data.positions.length,act:act().length,notes:S.data.notes.length,an:{crypto:a.crypto.rows.length,years:a.years.length,banks:a.banks.length,home:a.home.rows.length,cmp:Object.keys(a.cmp).length,tax:Object.keys(a.tax).length},bank0:a.banks[0]&&JSON.stringify(a.banks[0]).slice(0,400),rates:S.data.settings.rates}});
console.log(JSON.stringify(r,null,1),errs);await b.close()})();
