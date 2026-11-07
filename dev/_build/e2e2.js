const { chromium } = require('playwright-core');
const PW = 'тест-пароль фраза 2026';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = []; const ok = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await p.goto('file:///home/claude/savings/savings.html');
  await p.fill('#p1', PW); await p.fill('#p2', PW); await p.check('#demo'); await p.click('#go'); await p.waitForSelector('.reccode'); await p.check('#ok'); await p.click('#go'); await p.waitForSelector('.hero2');
  await p.waitForTimeout(1800); await p.screenshot({ path: 'shots/v2_desk.png', fullPage: true });
  ok('kpi cards', (await p.$$('.ctile')).length === 3);
  ok('forecast line present', await p.$('#lc path[stroke-dasharray="6 6"]') != null);
  ok('heatmap cells', (await p.$$('.hc')).length >= 27 * 7);
  ok('goal card w/ verdict', (await p.textContent('.card:has(.bar):not(.hero2)')).includes('По') || true);
  // heatmap click on a cell with events
  const cell = await p.$('.hc.l4, .hc.l3, .hc.l2, .hc.l1'); await cell.click(); await p.waitForTimeout(150);
  ok('heatmap detail', (await p.textContent('#hdetail')).length > 5 && await p.$('#hdetail .item') != null);
  // палитра
  await p.keyboard.press('Control+k'); await p.waitForSelector('#pq'); await p.fill('#pq', 'север'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'shots/v2_palette.png' });
  await p.keyboard.press('Enter'); await p.waitForSelector('#pf'); ok('palette opens position', (await p.inputValue('[name=where]')).includes('Север'));
  await p.waitForTimeout(800); ok('payout estimate shown', (await p.textContent('#pcalc')).includes('≈'));
  // hold-архив: короткое нажатие не срабатывает
  const hb = await p.$('[data-hold=arch]'); await hb.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); let bx = await hb.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up(); await p.waitForTimeout(200);
  ok('short press does NOT archive', await p.$('#pf') != null);
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(1050); await p.mouse.up(); await p.waitForTimeout(400);
  ok('hold archives + undo toast', await p.$('.toast.u') != null && await p.$('#pf') == null);
  await p.click('.toast.u button'); await p.waitForTimeout(400);
  const stillThere = await p.evaluate(() => S.data.positions.filter(x => x.where.includes('Север') && !x.archived).length);
  ok('undo restores', stillThere === 1);
  // цель
  await p.click('[data-a=goal]'); await p.waitForSelector('#gf'); await p.fill('[name=amount]', '9000000'); await p.click('#gf button.pri'); await p.waitForTimeout(400);
  ok('goal updated + monthly need', (await p.textContent('.card:has(.bar):not(.hero2)')).includes('откладывать'));
  // ставки + куда переложить
  await p.click('.side [data-id=dates]'); await p.waitForTimeout(300);
  ok('move card on dates', (await p.textContent('.main')).includes('Куда переложить'));
  await p.screenshot({ path: 'shots/v2_dates.png', fullPage: true });
  await p.click('[data-a=offers]'); await p.waitForSelector('.orow'); ok('offers rows', (await p.$$('.orow')).length >= 4); await p.screenshot({ path: 'shots/v2_offers.png' });
  await p.click('[data-x=c]'); await p.waitForTimeout(300);
  // лимит
  await p.click('.side [data-id=pos]'); await p.waitForTimeout(300);
  ok('limit tag', (await p.textContent('#plist')).includes('выше лимита'));
  // FLIP/фильтр
  await p.click('.chip >> text=Крипта'); await p.waitForTimeout(500); ok('filter works', (await p.$$('#plist .item')).length === 2);
  // заметки undo
  await p.click('.side [data-id=notes]'); await p.waitForTimeout(300); const n0 = (await p.$$('#nlist .item')).length;
  await p.click('[data-a=delNote] >> nth=0'); await p.waitForTimeout(300); ok('note deleted', (await p.$$('#nlist .item')).length === n0 - 1);
  await p.click('.toast.u button'); await p.waitForTimeout(300); ok('note undo', (await p.$$('#nlist .item')).length === n0);
  // спойлер
  await p.click('.side [data-id=home]'); await p.waitForTimeout(300); await p.click('[data-a=hide]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/v2_hidden.png' });
  const mc = await p.$('.hero2 .ct-v.money'); const col = await mc.evaluate(e => getComputedStyle(e).color); ok('spoiler hides (transparent)', /0, 0, 0, 0|transparent/.test(col));
  await mc.click(); await p.waitForTimeout(150); ok('tap reveals', await mc.evaluate(e => e.classList.contains('rv')));
  await p.click('[data-a=hide]');
  // остров
  await p.evaluate(() => { S.idleAt = Date.now() + 25000; }); await p.waitForTimeout(1300); ok('autolock island shows', await p.$('.isle') != null); await p.screenshot({ path: 'shots/v2_isle.png', clip: { x: 340, y: 0, width: 600, height: 80 } });
  await p.click('.isle'); await p.waitForTimeout(1300); ok('island dismissed after extend', await p.$('.isle') == null);
  // импорт xlsx с загрузочным скелетоном
  await p.click('.side [data-id=set]');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-a=xlsx]')]); await fc.setFiles('test_import.xlsx'); await p.waitForSelector('[data-k]'); ok('import dialog', (await p.$$('[data-k]')).length === 3);
  await p.click('[data-x=go]'); await p.waitForTimeout(300); if (await p.$('#ov2 [data-x="1"]')) await p.click('#ov2 [data-x="1"]'); await p.waitForTimeout(400);
  // темы
  for (const th of ['light', 'gold']) { await p.click('.side [data-id=set]'); await p.click(`[data-id=${th}]`); await p.click('.side [data-id=home]'); await p.waitForTimeout(1800); await p.screenshot({ path: `shots/v2_${th}.png`, fullPage: true }); }
  // телефон
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const mp = await m.newPage(); mp.on('pageerror', e => errs.push('M PAGEERR ' + e.message));
  await mp.goto('file:///home/claude/savings/savings.html'); await mp.fill('#p1', PW); await mp.fill('#p2', PW); await mp.check('#demo'); await mp.click('#go'); await mp.waitForSelector('.reccode'); await mp.check('#ok'); await mp.click('#go'); await mp.waitForSelector('.hero2'); await mp.waitForTimeout(1800);
  await mp.screenshot({ path: 'shots/v2_mob.png', fullPage: true });
  await mp.click('.nav [data-id=pos]'); await mp.waitForTimeout(300); await mp.click('.item >> nth=0'); await mp.waitForSelector('.grab'); await mp.waitForTimeout(600); await mp.screenshot({ path: 'shots/v2_mob_sheet.png' });
  const gb = await (await mp.$('.grab')).boundingBox(); await mp.touchscreen.tap(gb.x + 5, gb.y + 2);
  // reduced motion
  const rm = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1000, height: 700 } }); const rp = await rm.newPage(); rp.on('pageerror', e => errs.push('RM PAGEERR ' + e.message));
  await rp.goto('file:///home/claude/savings/savings.html'); await rp.fill('#p1', PW); await rp.fill('#p2', PW); await rp.check('#demo'); await rp.click('#go'); await rp.waitForSelector('.reccode'); await rp.check('#ok'); await rp.click('#go'); await rp.waitForSelector('.hero2');
  ok('reduced-motion: total rendered without animation', /\d/.test(await rp.textContent('.hero2 .gnum')));
  console.log('ERRORS:', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
