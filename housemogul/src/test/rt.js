// Real-time smoke: title backdrop, new game (guide), buy from quick card, watch time pass, sell, construction/demolition visible.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const vp = process.env.VP === 'phone' ? { width: 393, height: 852, hasTouch: true, isMobile: true } : { width: 1366, height: 820 };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const tag = process.env.VP || 'desk', shot = n => p.screenshot({ path: `${OUT}/rt_${tag}_${n}.png` });
  const tap = async sel => { const l = p.locator(sel).first(); vp.hasTouch ? await l.tap() : await l.click(); await p.waitForTimeout(350); };
  const tapAt = async xy => { vp.hasTouch ? await p.touchscreen.tap(xy[0], xy[1]) : await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(400); };
  await p.goto('http://localhost:8765/housemogul/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction(() => window.__ready);
  await p.waitForTimeout(3000); console.log('title backdrop t', await p.evaluate(() => G.t.toFixed(1))); await shot('0title');
  await tap('#newBtn'); await p.waitForTimeout(800);
  const st0 = await p.evaluate(() => ({ t: G.t, step: TUT.step, pause: TUT.pause, ring: RND.ring, coach: $('coachT').textContent }));
  console.log('start', JSON.stringify(st0)); await shot('1start');
  await p.waitForTimeout(1500); console.log('paused during guide? t', await p.evaluate(() => G.t.toFixed(2)));
  // tap the ringed tag
  const xy = await p.evaluate(() => { const r = RND.tagHit.find(h => h.id === RND.ring); return r ? [r.x + r.w / 2, r.y + r.h / 2] : null; });
  console.log('ring tag at', xy); await tapAt(xy);
  console.log('sel', await p.evaluate(() => STATE.sel + ' ring ' + RND.ring + ' coach ' + $('coachT').textContent)); await shot('2card');
  await tap('#qcB'); await p.waitForTimeout(600);
  console.log('after buy', await p.evaluate(() => 'own ' + ownedBy(0).length + ' cash ' + G.pl[0].cash.toFixed(1) + ' step ' + TUT.step + ' pause ' + TUT.pause));
  await shot('3bought');
  // let time run (3x) until a profit shows, then sell from the card
  await p.evaluate(() => { selectProp(-1); setSpeed(3); });
  let sold = false;
  for (let k = 0; k < 40 && !sold; k++) {
    await p.waitForTimeout(1000);
    const s = await p.evaluate(() => { const q = ownedBy(0)[0]; return q ? { id: q.id, ok: canSell(q), prof: q.offer * (1 - sellFee()) - q.paid } : null; });
    if (k === 4) await shot('4running');
    if (s && s.ok && s.prof > 0) {
      await p.evaluate(id => selectProp(id, true), s.id); await p.waitForTimeout(700); await shot('5sellcard');
      await tap('#qcB'); sold = true;
    }
  }
  await p.waitForTimeout(600);
  console.log('sold', sold, await p.evaluate(() => 'sells ' + G.pl[0].st.sells + ' profit ' + G.pl[0].st.profit.toFixed(1) + ' step ' + TUT.step + ' t ' + clock(G.t)));
  await shot('6sold');
  await tap('#coachOk').catch(() => {});
  // run 90 s more at 3x and look for construction / demolition
  await p.evaluate(() => { selectProp(-1); fitCam(); });
  for (let k = 0; k < 30; k++) { await p.waitForTimeout(1000); const b = await p.evaluate(() => G.props.some(p => p.stage)); if (b && k > 4) break; }
  console.log('city', await p.evaluate(() => 'props ' + G.props.length + ' building ' + G.props.filter(p => p.stage === 'build').length + ' demo ' + G.props.filter(p => p.stage === 'demo').length + ' gone ' + G.props.filter(p => p.gone).length + ' listed ' + G.props.filter(p => p.list).length + ' t ' + clock(G.t)));
  const bp = await p.evaluate(() => { const q = G.props.find(p => p.stage); if (!q) return null; focusTile(q.x + q.w / 2, q.y + q.h / 2, 1.5); return q.id; });
  await p.waitForTimeout(900); await shot('7stage');
  // mine button & details & pause
  await tap('#mineBtn'); await p.waitForTimeout(500);
  await p.evaluate(() => setSpeed(0)); const t1 = await p.evaluate(() => G.t); await p.waitForTimeout(800); console.log('pause holds', (await p.evaluate(() => G.t)) === t1);
  const any = await p.evaluate(() => { const q = G.props.find(p => p.list && p.owner === -1 && p.kind !== 'mansion'); selectProp(q.id, true); return q.id; });
  await p.waitForTimeout(700); await tap('#qc [data-q="more"]'); await shot('8detail');
  await p.evaluate(() => { STATE.detail = false; selectProp(G.mansion, true); }); await p.waitForTimeout(800); await shot('9mansion');
  // finish: give cash and buy the mansion
  await p.evaluate(() => { G.pl[0].cash = 99999; setSpeed(1); renderHUD(true); }); await p.waitForTimeout(400);
  await tap('#qcB'); await tap('#cYes'); await p.waitForTimeout(1500);
  console.log('end', await p.evaluate(() => STATE.mode + ' ' + $('eTitle').textContent + ' | ' + $('eSub').textContent)); await shot('10end');
  console.log('errs', errs); await b.close();
})();
