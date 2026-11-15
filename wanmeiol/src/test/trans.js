// node test/trans.js — location transitions (59_trans.js): walk card, journey card across areas, auto-walk card, teleport ring, tap-to-skip, motion off
// needs: node test/serve.js out 8770   ·   SHOT=dir saves walk.png / road.png / tp.png
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始'); await pg.waitForTimeout(400);
  const out = {}; const ok = (k, v) => { out[k] = v; };
  const setup = await pg.evaluate(async () => { const w8 = ms => new Promise(r => setTimeout(r, ms)); const D = __dbg, S = () => D.STATE;
    D.auto = true; D.instant = true; D.dlgPick(-1); for (let i = 0; i < 600 && (S().scene || S().battle || S().dungeon); i++) await w8(20); const c = D.C;
    c.story.q = D.MAIN.findIndex(q => q.id === 'q_end'); Object.assign(c.story.f, { tomb: 1, bei: 1, deep: 1, moved: 1, out: 1, xushen: 1, butian: 1, joined: 1, baiduan: 1, cliff: 1, spring: 1, mount: 1, end: 1, qingfeng: 1, qfIn: 1 }); c.lv = 30;
    D.go('sc_street', true, true); await w8(200); D.instant = false; D.trans = true; D.night = false; SET.fast = false; refresh();
    /* a same-area exit, and a place with an exit into another area */
    const same = Object.values(exitsOf('sc_street')).find(id => PLACES[id].area === 'shicun');
    let cross = null; for (const id in PLACES) { if (!placeOpen(id) || PLACES[id].area === 'xushen') continue; const e = Object.values(exitsOf(id)).find(t => PLACES[t].area !== PLACES[id].area && PLACES[t].area !== 'xushen'); if (e) { cross = [id, e]; break; } }
    let far = null; for (const id in PLACES) { if (!placeOpen(id)) continue; const r = route('sc_street', id); if (r && r.length >= 5 && new Set(r.map(x => PLACES[x].area)).size >= 2) { far = id; break; } }
    return { same, cross, far, btn: [...document.querySelectorAll('#acts .dir')].map(e => e.getAttribute('onclick')) }; });
  ok('exitButtonsUseGoT', setup.btn.length > 0 && setup.btn.every(s => /^goT\(/.test(s)));
  const st = () => pg.evaluate(() => { const e = document.getElementById('ptr'); return { cls: e ? e.className : '', t: e ? e.querySelector('.pt-t').textContent : '', s: e ? e.querySelector('.pt-s').textContent : '', n: e ? e.querySelector('.pt-n').textContent : '', loc: __dbg.C.loc, busy: ptrBusy }; });
  // walk card
  await pg.evaluate(to => { goT(to); }, setup.same); await pg.waitForTimeout(120); let s = await st();
  ok('walkCoverFirst', /\bon\b/.test(s.cls) && s.loc === 'sc_street');
  await pg.waitForTimeout(480); s = await st(); ok('walkNameUnderBlack', s.loc === setup.same && /show/.test(s.cls) && s.t === (await pg.evaluate(id => PLACES[id].name, setup.same)) && /石村/.test(s.s));
  if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT + '/walk.png' });
  await pg.waitForTimeout(900); s = await st(); ok('walkClears', s.cls === '' && !s.busy);
  // tap skips
  const t0 = Date.now(); await pg.evaluate(() => { goT('sc_street'); }); await pg.waitForTimeout(80); await pg.mouse.click(640, 400); await pg.waitForFunction(() => !ptrBusy, null, { timeout: 3000 }); ok('tapSkips', Date.now() - t0 < 700 && (await st()).loc === 'sc_street');
  await pg.waitForTimeout(500);
  // journey card across areas
  await pg.evaluate(([a, b]) => { __dbg.go(a, true, true); goT(b); }, setup.cross); await pg.waitForTimeout(800); s = await st();
  ok('roadCard', /k-road/.test(s.cls) && s.n.length > 4 && s.loc === setup.cross[1] && await pg.evaluate(() => getComputedStyle(document.querySelector('#ptr .pt-hill')).display === 'block'));
  if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT + '/road.png' });
  await pg.waitForFunction(() => !ptrBusy, null, { timeout: 5000 }); await pg.waitForTimeout(400);
  // auto-walk: one card for the whole trip, waypoints tick by, the journey part shows the hills
  const seen = await pg.evaluate(async far => { __dbg.go('sc_street', true, true); await new Promise(r => setTimeout(r, 100)); const e = () => document.getElementById('ptr'); const S = new Set(), K = new Set(); const p = autoWalk(far);
    const iv = setInterval(() => { S.add(e().querySelector('.pt-s').textContent); K.add([...e().classList].find(c => c.startsWith('k-'))); }, 40); const t0 = performance.now(); await p; clearInterval(iv);
    return { pass: [...S].filter(x => x.startsWith('途经')).length, road: K.has('k-road'), loc: __dbg.C.loc, ms: performance.now() - t0, path: route('sc_street', far).length }; }, setup.far);
  await pg.waitForTimeout(450); s = await st();
  ok('autoWalkOneCard', seen.loc === setup.far && seen.pass >= 2 && seen.road && s.cls === '' && seen.ms > 1500);
  // teleport ring
  await pg.evaluate(() => { __dbg.go('sc_street', true, true); ptrGo('bt_court', 'tp'); }); await pg.waitForTimeout(600); s = await st(); ok('teleportRing', /k-tp/.test(s.cls) && s.loc === 'bt_court' && /玉符/.test(s.n));
  if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT + '/tp.png' });
  await pg.waitForFunction(() => !ptrBusy, null, { timeout: 4000 }); await pg.waitForTimeout(400);
  // motion off → instant
  await pg.evaluate(() => { __dbg.go('sc_street', true, true); SET.motion = false; }); await pg.evaluate(to => { goT(to); }, setup.same); s = await st(); ok('motionOffInstant', s.loc === setup.same && s.cls === '');
  ok('noErrors', errs.length === 0);
  let fail = 0; for (const [k, v] of Object.entries(out)) { console.log((v ? 'OK  ' : 'FAIL') + ' ' + k); if (!v) fail++; } if (errs.length) console.log(errs.slice(0, 5));
  console.log(JSON.stringify(setup), JSON.stringify(seen)); await b.close(); process.exit(fail ? 1 : 0); })();
