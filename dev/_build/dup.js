const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1300,height:1000}});await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
const imp=async f=>{await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles(f);await p.waitForSelector('[data-k]');await p.click('[data-x=go]');await p.waitForTimeout(500)};
await imp('real2.xlsx');await imp('real3.xlsx');
await p.evaluate(()=>{S.tab='home';S.fresh=true;render()});await p.waitForTimeout(700);
const w=await p.evaluate(()=>{const w=whyChanged();return {dl:Math.round(w.dl),dups:w.dups.length,mv:w.mv.map(x=>x.p.where+' '+Math.round(x.v))}});console.log(JSON.stringify(w));
const el=await p.$('details');const card=await el.evaluateHandle(e=>e.closest('.card'));await card.screenshot({path:'/tmp/why.png'});console.log(errs);await b.close()})();
