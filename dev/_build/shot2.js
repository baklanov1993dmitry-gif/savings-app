const { chromium } = require('playwright-core');
(async()=>{const W=+process.argv[2]||1300;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:W,height:W<600?800:1000},deviceScaleFactor:W<600?2:1});await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});
const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles('real3.xlsx');await p.waitForSelector('[data-k]');await p.click('[data-x=go]');await p.waitForTimeout(500);
await p.evaluate(()=>{S.data.settings.spread={USD:3};S.bheat=true;S.tab='board';S.fresh=true;render()});await p.waitForTimeout(600);
await p.screenshot({path:'/tmp/board'+W+'.png'});
await p.evaluate(()=>{S.tab='home';S.fresh=true;render()});await p.waitForTimeout(900);await p.screenshot({path:'/tmp/home'+W+'.png',fullPage:true});
console.log(errs);await b.close()})();
