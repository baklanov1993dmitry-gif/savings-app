const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext();await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});
const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles('real2.xlsx');await p.waitForSelector('[data-k]');
console.log(await p.$$eval('[data-k]',e=>e.map(x=>x.closest('label,div').innerText.slice(0,160).replace(/\n/g,' '))).then(a=>a.filter(t=>/состоян/i.test(t))));
await p.click('[data-x=go]');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const s=series();const mx=Math.max(...s.map(x=>x.v));return {now:Math.round(totals().rub),max:Math.round(mx),first:s.slice(0,3).map(x=>x.t+':'+Math.round(x.v)),n:s.length}}),errs);await b.close()})();
