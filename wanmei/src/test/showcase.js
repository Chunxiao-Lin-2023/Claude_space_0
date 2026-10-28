// node test/showcase.js [outdir] — style-check screenshots of the 2D build
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/showcase'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  const pg = await b.newPage({ viewport: { width: +(process.env.VW || 1280), height: +(process.env.VH || 720) }, deviceScaleFactor: +(process.env.DPR || 1) });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; });
  const shot = async (name, wait = 2200) => { await pg.waitForTimeout(wait); await pg.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };
  const hud = on => pg.evaluate(on => { document.querySelectorAll('#hud, #party, #mm, #tracker, #chat, #bar, #hotbar, #plates, #tbtns, #menu').forEach(e => e && (e.style.visibility = on ? '' : 'hidden')); }, on);
  // A: night, the willow over the village
  await pg.evaluate(() => { setLight('night', true); const me = W.P[0], pet = W.P[1]; teleport(me, WILLOW.x + 2.5, WILLOW.z + 8, PI); teleport(pet, WILLOW.x + 4, WILLOW.z + 8.6, PI); me.script = pet.script = true; WILLOWOBJ.boost = 0.8; const ch = entByTag('chief'); if (ch) { teleport(ch, WILLOW.x - 3, WILLOW.z + 9, PI); ch.script = true; } CAM.cine = { x0: WILLOW.x, z0: WILLOW.z + 1, k0: 0.72, x1: WILLOW.x, z1: WILLOW.z + 1, k1: 0.72, t: 0, d: 0.1 }; W.cine = true; });
  await hud(false); await shot('A_willow_night', 3500);
  // B: morning drill at the yard
  await pg.evaluate(() => { setLight('day', true); WILLOWOBJ.boost = 0; const me = W.P[0], pet = W.P[1]; const Y = YARD; teleport(me, Y.x - 1, Y.z + 3, PI); me.A.pose = 'train'; teleport(pet, Y.x + 1.2, Y.z + 3.6, PI);
    const kids = ['ermeng', 'pihou', 'dazhuang'].map(t => entByTag(t)).filter(Boolean); kids.forEach((k, i) => { teleport(k, Y.x - 4 + i * 2.6, Y.z + 1, PI); k.script = true; k.A.pose = 'train'; });
    const ch = entByTag('chief'); if (ch) { teleport(ch, Y.x, Y.z - 5.5, 0); ch.script = true; ch.A.pose = null; }
    CAM.cine = { x0: Y.x, z0: Y.z - 0.5, k0: 0.95, x1: Y.x, z1: Y.z - 0.5, k1: 0.95, t: 0, d: 0.1 }; W.cine = true; });
  await shot('B_yard_morning', 3000);
  // C: dialogue with the big portrait
  await pg.evaluate(() => { const me = W.P[0]; me.A.pose = null; const ch = entByTag('chief'); talk([['族长', '小不点，你又偷喝兽奶了？嘴角还白白的呢。', 'happy'], ['小不点', '咿呀，我没有，我在喝水。', 'happy']]); });
  await hud(true); await shot('C_dialog', 2600);
  await pg.evaluate(() => { DLG.typing = 1e9; advanceDlg(); }); await shot('C2_dialog', 2200);
  await pg.evaluate(() => { while (DLG.open) { DLG.typing = 1e9; advanceDlg(); } W.cine = false; CAM.cine = null; for (const e of W.ents) if (e.A) e.A.pose = null; });
  // D: wolf fight with 宝术
  await pg.evaluate(() => { PARTY.flags.sk_shenli = PARTY.flags.sk_yinyue = PARTY.flags.sk_chique = 1; const me = W.P[0], pet = W.P[1]; me.script = pet.script = false; teleport(me, 30, -40, 0); teleport(pet, 28.5, -39, 0); CAM.tx = 30; CAM.tz = -40; for (let i = 0; i < 3; i++) { const w = spawnMob('wolf', 36 + i * 1.6, -41.5 + (i % 2) * 2.2, { lv: 2 }); w.ai.tgt = me; w.ai.cd = 3; } setTarget(W.ents.find(e => e.kind === 'wolf')); });
  await pg.waitForTimeout(1600);
  await pg.evaluate(() => { const me = W.P[0], t = nearestFoe(W.P[0], 15); me.mp = me.mpMax; window._lg = [me.rot, t && t.id, t && edist(me, t)]; castSkill(me, 'yinyue', t); window._lg.push(me.rot); setTimeout(() => window._lg.push(me.rot, PROJ.map(p => p.vis + ':' + p.vx.toFixed(1) + ',' + p.vz.toFixed(1)).join(' ')), 200); castSkill(W.P[1], 'p_orb', t); });
  await pg.waitForFunction(() => PROJ.some(p => p.vis === 'moon' && Math.hypot(p.x - W.P[0].x, p.z - W.P[0].z) > 1.6), null, { timeout: 5000 }).catch(() => {});
  await pg.evaluate(() => { __dbg.speed = 0.0001; }); await shot('D_fight', 400); console.log(JSON.stringify(await pg.evaluate(() => window._lg))); await pg.evaluate(() => { __dbg.speed = 1; });
  await pg.evaluate(() => { const me = W.P[0], t = nearestFoe(W.P[0], 15); INP.chase = t; }); await shot('D2_fight', 1400);
  await pg.evaluate(() => { const me = W.P[0], t = nearestFoe(W.P[0], 15); me.cds.chique = 0; me.mp = me.mpMax; castSkill(me, 'chique', t); }); await shot('D3_fight', 500);
  // E: village at night with warm windows
  await pg.evaluate(() => { for (const e of W.ents) if (e.kind === 'wolf') rmEnt(e); setLight('night', true); const me = W.P[0]; teleport(me, VIL.x + 5, VIL.z + 4, 0); teleport(W.P[1], VIL.x + 6.5, VIL.z + 4.5, 0); CAM.zoomT = 0.75; });
  await hud(false); await shot('E_village_night', 3000);
  await pg.evaluate(() => { setLight('day', true); }); await shot('F_village_day', 1500);
  await pg.evaluate(() => { const me = W.P[0]; teleport(me, VIL.x + 2, VIL.z + 10, 0); teleport(W.P[1], VIL.x + 3.5, VIL.z + 10.5, 0); CAM.zoomT = 0.6; }); await shot('G_village_wide', 2500);
  console.log(errs.slice(0, 20).join('\n') || 'no errors'); await b.close();
})();
