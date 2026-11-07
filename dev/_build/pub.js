const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1300,height:900}});await ctx.route('**cbr-xml-daily.ru/**',r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html');const PW='тест-пароль фраза 2026';await p.fill('#p1',PW);await p.fill('#p2',PW);await p.click('#go');await p.waitForSelector('.reccode');await p.check('#ok');await p.click('#go');await p.waitForSelector('.main');await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>({r:S.data.settings.rates,src:S.data.settings.fx.src,keys:FX.keys(),old:FX.at('USD','2026-10-25')}))));
await p.screenshot({path:'/tmp/pub.png',clip:{x:220,y:300,width:1080,height:80}});console.log(errs);await b.close()})();
