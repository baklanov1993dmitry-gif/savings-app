const { chromium } = require('playwright-core'); const http=require('http'),fs=require('fs'),path=require('path');
const D='/home/claude/savings/pwa'; const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=path.join(D,q.url==='/'?'index.html':q.url.split('?')[0]);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',T[path.extname(f)]||'text/plain');r.end(fs.readFileSync(f))}).listen(8766);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const c=await b.newContext();const p=await c.newPage();
await p.goto('http://localhost:8766/');await p.waitForSelector('#p1');await p.waitForTimeout(1500);
console.log('sw active',await p.evaluate(async()=>!!(await navigator.serviceWorker.ready).active));
await c.setOffline(true);await p.reload();await p.waitForSelector('#p1',{timeout:5000});console.log('PASS offline reload works');
await b.close();srv.close()})();
