const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1300,height:1000}});await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});
const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles('real3.xlsx');await p.waitForSelector('[data-k]');await p.click('[data-x=go]');await p.waitForTimeout(500);
console.log('bt rows',await p.evaluate(()=>A().bt&&A().bt.rows.length+' '+A().bt.d));
// spread
await p.evaluate(()=>{S.tab='set';render()});await p.fill('[data-i=spUSD]','3');await p.dispatchEvent('[data-i=spUSD]','change');await p.waitForTimeout(300);
console.log('total with spread 3 =',await p.evaluate(()=>Math.round(totals().rub)),'(ожидаем 5246253 при курсе 85 и тенге .1912; в Excel 5246300)');
await p.evaluate(()=>{S.tab='an';S.asec='banks';S.an='banks';render()});
const segs=await p.$$eval('.seg button',e=>e.map(x=>x.dataset.id+':'+x.innerText));console.log(segs.join(' | '));
await p.click('[data-a=asec][data-id=banks]').catch(e=>console.log('seg click fail'));await p.waitForTimeout(400);
await p.screenshot({path:'/tmp/banks.png',fullPage:true});
await p.evaluate(()=>{S.tab='home';render()});await p.waitForTimeout(500);await p.screenshot({path:'/tmp/home.png'});
console.log(errs);await b.close()})();
