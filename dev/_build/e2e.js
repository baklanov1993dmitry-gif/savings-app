const { chromium } = require('playwright-core');
(async () => {
  const exe = require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const b = await chromium.launch({ executablePath: exe || undefined, args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await p.goto('file:///home/claude/savings/savings.html');
  await p.screenshot({ path: 'shots/1_setup.png' });
  await p.fill('#p1', 'тест-пароль фраза 2026'); await p.fill('#p2', 'тест-пароль фраза 2026');
  await p.click('#go'); await p.waitForSelector('.reccode');
  const code = await p.textContent('.reccode'); console.log('recovery', code);
  await p.screenshot({ path: 'shots/2_recovery.png' });
  await p.check('#ok'); await p.click('#go'); await p.waitForSelector('.hero');
  await p.waitForTimeout(300); await p.screenshot({ path: 'shots/3_home.png' });
  await p.screenshot({ path: 'shots/3_home_full.png', fullPage: true });
  // tooltip
  const box = await p.locator('#lc').boundingBox(); await p.mouse.move(box.x + box.width * .6, box.y + 80); await p.waitForTimeout(100);
  await p.screenshot({ path: 'shots/4_tip.png', clip: { x: 0, y: box.y - 40, width: 390, height: box.height + 80 } });
  // positions
  await p.click('.nav [data-id=pos]'); await p.waitForTimeout(100); await p.screenshot({ path: 'shots/5_pos.png' });
  await p.click('.item >> nth=0'); await p.waitForSelector('#pf'); await p.screenshot({ path: 'shots/6_edit.png' });
  await p.click('[data-x=close]');
  await p.click('.nav [data-id=dates]'); await p.waitForTimeout(100); await p.screenshot({ path: 'shots/7_dates.png', fullPage: true });
  await p.click('.nav [data-id=set]'); await p.waitForTimeout(100); await p.screenshot({ path: 'shots/8_set.png', fullPage: true });
  // добавить позицию
  await p.click('.nav [data-id=pos]'); await p.click('[data-a=newPos]'); await p.fill('[name=where]', 'Новая <b>тест</b>'); await p.fill('[name=amt]', '12345,5'); await p.click('#pf button[type=submit]');
  await p.waitForTimeout(200); console.log('xss-safe:', !(await p.content()).includes('<b>тест</b>'), 'item added:', (await p.textContent('#plist')).includes('Новая'));
  // лок + неверный пароль + верный
  await p.click('[data-a=lock]'); await p.waitForSelector('#pw');
  await p.fill('#pw', 'wrong'); await p.click('#go'); await p.waitForFunction(() => document.querySelector('#er').textContent); console.log('wrong ->', await p.textContent('#er'));
  await p.fill('#pw', 'тест-пароль фраза 2026'); await p.click('#go'); await p.waitForSelector('.main'); console.log('unlock ok');
  // persistence: reload -> unlock
  await p.reload(); await p.waitForSelector('#pw'); await p.fill('#pw', 'тест-пароль фраза 2026'); await p.click('#go'); await p.waitForSelector('.hero');
  await p.click('.nav [data-id=pos]'); console.log('persisted:', (await p.textContent('#plist')).includes('Новая'));
  // vault в localStorage не содержит открытого текста
  const raw = await p.evaluate(() => localStorage.getItem('sv_vault')); console.log('plaintext leak:', /Банк|Новая|Север/.test(raw), 'len', raw.length);
  // xlsx import
  await p.click('.nav [data-id=set]');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-a=xlsx]')]);
  await fc.setFiles('test_import.xlsx'); await p.waitForSelector('[data-k]'); await p.screenshot({ path: 'shots/9_import.png' });
  console.log('import rows:', await p.$$eval('.ov .card b', e => e.map(x => x.textContent)), await p.$$eval('.ov .tag', e => e.map(x => x.textContent)));
  await p.click('[data-x=go]'); await p.waitForTimeout(300);
  await p.click('.nav [data-id=pos]'); const txt = await p.textContent('#plist'); console.log('imported has Каспи:', txt.includes('Каспи'), '| Bybit:', txt.includes('Bybit'));
  console.log((await p.$$eval('#plist .item', e => e.slice(0, 40).map(x => x.innerText.replace(/\n+/g, ' | ')))).filter(s => /Каспи|Bybit|Платформа/.test(s)));
  // desktop + light + gold
  await p.setViewportSize({ width: 1280, height: 800 }); await p.click('.side [data-id=home]'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/10_desk.png' });
  await p.click('.side [data-id=set]'); await p.click('[data-id=light]'); await p.click('.side [data-id=home]'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/11_light.png' });
  await p.click('.side [data-id=set]'); await p.click('[data-id=gold]'); await p.click('.side [data-id=home]'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/12_gold.png' });
  // скрытие сумм
  await p.click('[data-a=hide]'); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/13_hidden.png' });
  // recovery входа
  await p.click('[data-a=lock]'); await p.waitForSelector('#alt'); await p.click('#alt'); await p.fill('#pw', code.toLowerCase()); await p.click('#go'); await p.waitForSelector('#n1'); console.log('recovery login -> forced new pw modal');
  await p.fill('#n1', 'новый пароль 2027 ёж'); await p.fill('#n2', 'новый пароль 2027 ёж'); await p.click('#cf button.pri'); await p.waitForTimeout(800);
  console.log('ERRORS:', errs);
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
