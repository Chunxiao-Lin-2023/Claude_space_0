// node test/pxgal.js [people|beasts|acts] — in-game pixel sprites at 4x
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  const which = process.argv[2] || 'people';
  await pg.evaluate(which => {
    __dbg.skipDraw = true; SPR.budget = 1e9; document.querySelectorAll('body > *').forEach(e => e.style.display = 'none');
    const c = document.createElement('canvas'); c.id = 'gal'; c.width = 1600; c.height = 1000; c.style.cssText = 'position:fixed;left:0;top:0;image-rendering:pixelated;display:block'; document.body.appendChild(c); document.body.style.display = 'block';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#6a9a4a'; g.fillRect(0, 0, 1600, 1000);
    const lo = document.createElement('canvas'); lo.width = 400; lo.height = 250; const lg = lo.getContext('2d'); lg.imageSmoothingEnabled = false;
    let specs = [];
    if (which === 'people') { for (const k of ['xiaobudian', 'chief', 'linhu', 'feijiao', 'ermeng', 'pihou', 'dazhuang', 'beifeng', 'beishan']) specs.push(CHARS[k]()); specs.push(CHARS.beiHunter(2)); for (const [i, kd] of [[1, 'man'], [2, 'woman'], [3, 'old'], [4, 'child']]) specs.push(CHARS.villager(i, kd)); }
    if (which === 'beasts') { for (const k of ['wolf', 'lynx', 'snake', 'mangniu', 'dog', 'dapeng', 'xiaoqing', 'ziyun', 'stakeS']) specs.push(CHARS[k]()); for (const f of Object.values(PARTNER_FORMS)) specs.push(f.spec(12)); }
    let x = 6, y = 4, rowH = 0;
    const put = (R, A, rot) => { SPR.budget = 1e9; R.hpx = R.hpx || specHeight(R.spec) * 20; const [bw, bh] = sprBox(R, A); if (x + bw > 396) { x = 6; y += rowH + 2; rowH = 0; } lg.save(); lg.translate(x + bw / 2, y + bh * (R.kind === 'human' ? 0.84 : 0.8)); drawRigged(lg, R, A, 20, rot, 1); lg.restore(); x += bw * 0.62; rowH = Math.max(rowH, bh * 0.9); };
    if (which === 'acts') { const P = CHARS.xiaobudian(); const R = buildRig(P); for (const [rot, a] of [[0, {}], [HP, {}], [PI, {}], [HP, { walk: 1, ph: 1 }], [HP, { walk: 1, ph: 3 }], [0, { walk: 1, ph: 2.5 }], [HP, { act: { k: 'punch', k01: 0.5 } }], [0, { act: { k: 'cast', k01: 0.5 } }], [0, { act: { k: 'lift', k01: 0.9 } }], [HP, { act: { k: 'kick', k01: 0.5 } }], [0, { pose: 'train', t: 0 }], [0, { mood: 'happy' }], [HP, { pose: 'kneel' }], [HP, { act: { k: 'throw', k01: 0.6 } }], [0, { act: { k: 'hit', k01: 0.5 } }]]) put(R, Object.assign({ t: 0, walk: 0, ph: 0 }, a), rot); }
    else for (const P of specs) { const R = buildRig(P); if (R.kind === 'human') { for (const rot of [0, HP, PI]) put(R, { t: 0, walk: 0, ph: 0 }, rot); } else put(R, { t: 0.3, walk: 0, ph: 0 }, HP); x += 4; }
    g.drawImage(lo, 0, 0, 1600, 1000);
  }, which);
  await pg.screenshot({ path: `/tmp/claude-0/pxgal_${which}.png` }); await b.close(); })();
