const { chromium } = require('playwright-core'); const http = require('http'), fs = require('fs');
const PW = 'тест-пароль фраза 2026';
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(fs.readFileSync('/home/claude/savings/savings.html')); }).listen(8765);
let store = null, ver = 0; // мок GitHub
const mock = async route => {
  const rq = route.request(), m = rq.method();
  if (m === 'GET') { if (!store) return route.fulfill({ status: 404, body: '{}' }); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sha: 's' + ver, content: store }) }); }
  if (m === 'PUT') { const j = JSON.parse(rq.postData()); if ((store && j.sha !== 's' + ver) || (!store && j.sha)) return route.fulfill({ status: 409, body: '{}' }); store = j.content; ver++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: { sha: 's' + ver } }) }); }
  route.continue();
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = []; const ok = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1000, height: 800 } }); await c.route('https://api.github.com/**', mock); const p = await c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text())); await p.goto('http://localhost:8765/'); return { c, p }; };
  const A = await mk(), a = A.p;
  await a.fill('#p1', PW); await a.fill('#p2', PW); await a.click('#go'); await a.waitForSelector('.reccode'); await a.check('#ok'); await a.click('#go'); await a.waitForSelector('.main');
  // включаем синхронизацию через UI
  await a.evaluate(() => { S.tab = 'set'; S.fresh = true; render(); });
  await a.fill('#sr', 'me/vault'); await a.fill('#st', 'tok'); await a.click('[data-a=syncon]'); await a.waitForTimeout(1500);
  ok('A: pushed to repo', store != null);
  ok('A: status ok', (await a.textContent('#syncst')).includes('Синхронизировано'));
  await a.evaluate(async () => { S.data.notes.push({ id: 'na', d: '2026-01-01', text: 'from A' }); await persist(); await Sync.run(); });
  // устройство B
  const B = await mk(), p = B.p;
  await p.click('#conn').catch(() => {}); // если нет хранилища — показывается setup
  ok('B: has no vault -> setup screen', await p.$('#p1') != null);
  await p.evaluate(() => { LS.set('sv_vault', '{}'); renderUnlock(); }); await p.click('#conn'); await p.fill('#cr', 'me/vault'); await p.fill('#ct', 'tok'); await p.click('#cg'); await p.waitForSelector('#pw');
  await p.fill('#pw', PW); await p.click('#go'); await p.waitForSelector('.main', {timeout:8000}).catch(async()=>{console.log('ERRS',errs, await p.textContent('#er').catch(()=>''))}); await p.waitForTimeout(1500);
  ok('B: got note from A', await p.evaluate(() => S.data.notes.some(n => n.id === 'na')));
  ok('B: sync cfg came inside data', await p.evaluate(() => !!(S.data.settings.sync && S.data.settings.sync.token)));
  // B: удаляет заметку A и добавляет свою; A параллельно добавляет другую
  await a.evaluate(async () => { S.data.notes.push({ id: 'a2', d: '2026-01-02', text: 'a2' }); await persist(); });
  await p.evaluate(async () => { S.data.notes = S.data.notes.filter(n => n.id !== 'na'); S.data.notes.push({ id: 'b2', d: '2026-01-03', text: 'b2' }); await persist(); });
  await p.evaluate(() => Sync.run()); await a.evaluate(() => Sync.run()); await p.evaluate(() => Sync.run()); await a.waitForTimeout(500);
  const ids = x => x.evaluate(() => S.data.notes.map(n => n.id).sort().join(','));
  const ia = await ids(a), ib = await ids(p); console.log('A:', ia, 'B:', ib);
  ok('merge: both converge', ia === ib); ok('merge: delete propagated, adds kept', !ia.includes('na,') && !ia.split(',').includes('na') && ia.includes('a2') && ia.includes('b2'));
  ok('repo content has no plaintext', !Buffer.from(store, 'base64').toString().includes('from A') && !Buffer.from(store, 'base64').toString().includes('Север'));
  ok('repo blob has no passkey field', !Buffer.from(store, 'base64').toString().includes('"wk"'));
  // чужое хранилище в репо
  // passkey (виртуальный аутентификатор)
  const cdp = await A.c.newCDPSession(a); await cdp.send('WebAuthn.enable');
  let hasAuth = true; try { await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true, hasPrf: true } }); } catch (e) { hasAuth = false; console.log('no virt auth', e.message); }
  if (hasAuth) {
    await a.evaluate(() => { S.tab = 'set'; S.fresh = true; render(); });
    await a.click('[data-a=bioon]'); await a.waitForTimeout(1500);
    ok('passkey enabled', await a.evaluate(() => Bio.has() && !!JSON.parse(LS.get('sv_vault')).wk));
    await a.evaluate(() => lock()); await a.waitForSelector('#bio'); await a.click('#bio'); await a.waitForSelector('.main', { timeout: 8000 }).catch(() => {});
    ok('unlock by passkey', await a.evaluate(() => !!S.data));
    ok('passkey survives sync (still wk locally)', await a.evaluate(async () => { await Sync.run(); return !!JSON.parse(LS.get('sv_vault')).wk; }));
  }
  console.log('ERRORS:', JSON.stringify(errs)); await b.close(); srv.close();
})();
