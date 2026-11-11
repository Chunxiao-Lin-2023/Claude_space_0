// node test/occlude.js — at phone / tablet / desktop sizes, every line of dialogue (battle bubbles, cinematic bands, the dialogue box,
// rumours) must be whole on screen and on top of whatever is under it, and every button must be reachable. Fails on the first problem list.
const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol'; require('fs').mkdirSync(D, { recursive: true });
const VPS = { phoneP: [393, 852, 1], se: [375, 667, 1], seL: [667, 375, 1], ipadP: [820, 1180, 1], ipadL: [1180, 820, 1], desk: [1280, 800, 0] };
const LONG = '这是一句很长很长的话，用来看看气泡会不会被别的东西挡住，或者跑出屏幕外面去。';
(async () => { const b = await chromium.launch(); const bad = [];
  for (const k in VPS) { const [w, h, t] = VPS[k];
    const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: { width: w, height: h } }); const pg = await ctx.newPage(); pg.on('pageerror', e => bad.push(k + ' error: ' + e.message));
    await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始'); await pg.waitForTimeout(700);
    await pg.evaluate(async () => { __dbg.auto = true; __dbg.dlgPick(-1); for (let i = 0; i < 80 && __dbg.STATE.scene; i++) await new Promise(r => setTimeout(r, 30)); __dbg.auto = false; const C = __dbg.C; C.lv = 15; C.pets.maoqiu = { aff: 60 }; C.pet = 'maoqiu'; C.seen.tut1 = 0; });
    const check = (name) => pg.evaluate(([name, k]) => { const out = []; const vw = innerWidth, vh = innerHeight;
      const R = e => e.getBoundingClientRect(), inside = (a, c, m = 1) => a.left >= c.left - m && a.top >= c.top - m && a.right <= c.right + m && a.bottom <= c.bottom + m;
      const scroller = e => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p; } return null; };
      const onTop = (e, label) => { const r = R(e); if (r.width < 2) return; const sc = scroller(e); if (sc && !inside(r, R(sc))) return; const pts = [[0.5, 0.5], [0.12, 0.2], [0.88, 0.2], [0.12, 0.8], [0.88, 0.8]];
        for (const [fx, fy] of pts) { const x = r.left + r.width * fx, y = r.top + r.height * fy; if (x < 0 || y < 0 || x > vw || y > vh) { out.push(`${k} ${name}: ${label} off screen`); return; } const top = document.elementFromPoint(x, y); if (top && top !== e && !e.contains(top) && !/flash/.test(top.className)) { out.push(`${k} ${name}: ${label} covered by ${top.id ? '#' + top.id : top.className || top.tagName}`); return; } } };
      document.querySelectorAll('#bfx, #bfx *').forEach(e => e.style.pointerEvents = 'auto');
      const bfx = document.getElementById('bfx'), bubbles = [...document.querySelectorAll('#bfx .bubble')];
      for (const e of bubbles.filter(e => !bfx.classList.contains('cining'))) { if (!inside(R(e), R(bfx))) out.push(`${k} ${name}: bubble cut off (${e.textContent.slice(0, 8)})`); onTop(e, 'bubble ' + e.textContent.slice(0, 8)); }
      for (let i = 0; i < bubbles.length; i++) for (let j = i + 1; j < bubbles.length; j++) { const a = R(bubbles[i]), c = R(bubbles[j]); if (a.left < c.right - 3 && a.right > c.left + 3 && a.top < c.bottom - 3 && a.bottom > c.top + 3) out.push(`${k} ${name}: bubbles overlap ${bubbles[i].textContent.slice(0, 6)}@${Math.round(a.left)},${Math.round(a.top)} / ${bubbles[j].textContent.slice(0, 6)}@${Math.round(c.left)},${Math.round(c.top)}`); }
      for (const e of document.querySelectorAll('#bfx .cineband, #bfx .bosscard')) { if (!inside(R(e), { left: 0, top: 0, right: vw, bottom: vh })) out.push(`${k} ${name}: ${e.className} off screen`); onTop(e, e.className); }
      document.querySelectorAll('#bfx, #bfx *').forEach(e => e.style.pointerEvents = '');
      const mode = document.body.className;
      if (/m-talk/.test(mode)) { const d = document.getElementById('dlg'); if (!inside(R(d), { left: 0, top: 0, right: vw, bottom: vh })) out.push(`${k} ${name}: dialogue box off screen`); d.querySelectorAll('.tx, .chb').forEach(e => onTop(e, 'dialogue ' + e.textContent.slice(0, 6))); }
      if (/m-explore/.test(mode)) { const ru = document.getElementById('rumor'); if (ru && getComputedStyle(ru).opacity > 0.5 && ru.textContent) { for (const s of ['#banner .ar', '#banner .nm']) { const o = document.querySelector(s); if (o && o.textContent) { const a = R(ru), c = R(o); if (a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) out.push(`${k} ${name}: rumour overlaps ${s}`); } } onTop(ru, 'rumour'); }
        document.querySelectorAll('#acts .ab, #bq, #bnav button').forEach(e => onTop(e, 'button ' + e.textContent.trim().slice(0, 6))); document.querySelectorAll('#feed .ln').forEach(e => { const r = R(e), L = R(document.querySelector('.ex-l')); if (r.top >= L.top && r.bottom <= L.bottom) onTop(e, 'feed'); }); }
      if (/m-battle/.test(mode)) document.querySelectorAll('#bacts button').forEach(e => onTop(e, 'battle button ' + e.textContent.trim().slice(0, 6)));
      return out; }, [name, k]);
    // explore with rumours
    await pg.evaluate(() => { __dbg.go('sc_street', true, true); UI.nav = null; C.rumorLog = []; for (let i = 0; i < 4; i++) { UI.rumorNext = 0; rumorTick(); } refresh(); }); await pg.waitForTimeout(1200);
    bad.push(...await check('explore')); await pg.screenshot({ path: `${D}/oc_${k}_explore.png` });
    // dialogue with choices
    await pg.evaluate(L => { dlgShow({ who: '石大壮', npc: 'dazhuang', text: L + L }); }, LONG); await pg.waitForTimeout(500); bad.push(...await check('dialogue'));
    await pg.evaluate(() => { dlgPick(-1); dlgChoose([{ t: '选项一，比较长的一个选项文字' }, { t: '选项二' }, { t: '选项三' }], '你要怎么做？'); }); await pg.waitForTimeout(500); bad.push(...await check('choice')); await pg.screenshot({ path: `${D}/oc_${k}_choice.png` });
    await pg.evaluate(() => dlgPick(0)); await pg.waitForTimeout(300);
    // battle: everyone talks at once, tutorial showing
    await pg.evaluate(() => { __dbg.go('dh_road', true, true); __dbg.startBattle({ mobs: [['bandit', 12], ['bandit', 12], ['bandit', 12]], allies: ['a_huo'], title: '古道 · 山贼' }); }); await pg.waitForTimeout(2600);
    await pg.evaluate(L => { const B = __dbg.STATE.battle; const sp = [B.units.find(u => u.side === 1), B.units.find(u => u.kind === 'pc'), B.units.find(u => u.pet || u.kind === 'npc')]; sp.forEach((u, i) => fxSay(u.id, L.slice(0, 12 + i * 10))); }, LONG); // a busy round: a foe, 石昊 and a partner; await pg.waitForTimeout(400);
    bad.push(...await check('battle')); await pg.screenshot({ path: `${D}/oc_${k}_battle.png` });
    await pg.evaluate(L => fxCine({ k: 'cine', cls: 'burst', who: '族长', text: L + L }), LONG); await pg.waitForTimeout(500); bad.push(...await check('cine')); await pg.screenshot({ path: `${D}/oc_${k}_cine.png` });
    await ctx.close(); }
  await b.close(); const uniq = [...new Set(bad)]; console.log(uniq.join('\n') || 'no problems'); process.exit(uniq.length ? 1 : 0); })();
