const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const p=await(await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/savings/savings.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.uncheck('#demo').catch(()=>{});await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');
await p.evaluate(()=>{S.tab='set';S.fresh=true;render()});
const imp=async(pick)=>{const[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-a=xlsx]')]);await fc.setFiles('real2.xlsx');await p.waitForSelector('[data-k]');
 if(pick==='both'){const ps=await p.$$('[data-pos]');for(const x of ps){if(!(await x.isChecked()))await x.check()}}
 console.log(pick,'checked pos boxes:',await p.$$eval('[data-pos]',e=>e.filter(x=>x.checked).length));await p.click('[data-x=go]');await p.waitForTimeout(500)};
await imp('both');const n1=await p.evaluate(()=>[S.data.positions.length,S.data.notes.length]);console.log('after import',n1);
await imp('def');console.log('after 2nd import (notes must not double)',await p.evaluate(()=>[S.data.positions.length,S.data.notes.length]));
await p.evaluate(()=>{S.tab='set';render()});await p.click('[data-a=clrpos]');await p.click('#ov2 [data-x="1"]');await p.waitForTimeout(500);
console.log('after clear',await p.evaluate(()=>S.data.positions.length));await p.click('.toast.u button');await p.waitForTimeout(400);console.log('after undo',await p.evaluate(()=>S.data.positions.length),'ERR',errs);await b.close()})();
