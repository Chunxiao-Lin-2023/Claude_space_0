// node test/coop.js — 双人同屏：加入、镜像、请求接手（对方同意）、选项高亮、小剧场、鬼屋员工、小游戏、夜晚任务、断开
// 需要：node test/serve.js out 8771 &  和  node test/peerserver.js &（NODE_PATH 里要有 express、peer、peerjs）
const { chromium } = require('playwright'); const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [], ok = [], bad = []; const chk = (n, v) => (v ? ok : bad).push(n);
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } }); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ }));
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load|ERR_|favicon/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await pg.addInitScript(() => { if (window === window.top && !sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8771/test.html?peerhost=127.0.0.1&peerport=9000'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); return pg; };
  const H = await mk('host'), G = await mk('guest'); const w = ms => new Promise(r => setTimeout(r, ms)); const SHOT = process.env.SHOT; const shot = async (pg, n) => { if (SHOT) await pg.screenshot({ path: SHOT + '/' + n + '.png' }); };
  const frameOf = async pg => { for (let i = 0; i < 60; i++) { const f = pg.frames().find(x => x !== pg.mainFrame()); if (f) { try { if (await f.evaluate(() => !!window.__kn)) return f; } catch (e) { } } await w(100); } return null; };
  // 房主在标题页直接开房间，队友加入后在等待画面；房主开新档，队友自动跟上
  await H.evaluate(() => __dbg.netHost()); await H.waitForFunction(() => __dbg.NETROLE === 'host' && __dbg.NET.code, null, { timeout: 15000 });
  const code = await H.evaluate(() => __dbg.NET.code); chk('host opens a room from the title (' + code + ')', /^[A-Z0-9]{4}$/.test(code) && await H.evaluate(() => !__dbg.C && document.querySelector('#title').classList.contains('on')));
  await G.evaluate(c => __dbg.netJoin(c), code); await G.waitForFunction(() => !!document.querySelector('#tlobby'), null, { timeout: 15000 }).catch(() => 0);
  chk('guest waits in the lobby', await G.evaluate(() => !!document.querySelector('#tlobby') && !__dbg.C && /已加入房间/.test(document.querySelector('#tcoopst').textContent)));
  await H.waitForFunction(() => /队友已加入/.test((document.querySelector('#tcoopst') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => 0);
  chk('host title shows the guest joined', await H.evaluate(() => /队友已加入/.test((document.querySelector('#tcoopst') || {}).textContent || '')));
  await shot(G, '0_guest_lobby');
  await H.evaluate(async () => { const D = __dbg; D.nosave = true; D.slotNew(1); for (let i = 0; i < 80 && !(D.DLG.cur && D.DLG.cur.text); i++) { await new Promise(r => setTimeout(r, 150)); if (document.querySelector('#card.on')) cardTap(); if (document.querySelector('#cine.on')) cineTap(); } });
  await H.waitForFunction(() => __dbg.DLG.cur && __dbg.STATE.scene, null, { timeout: 8000 });
  await G.waitForFunction(() => !!__dbg.C && !!__dbg.DLG.cur, null, { timeout: 8000 }).catch(() => 0);
  chk('guest follows the host into the save', await G.evaluate(() => !!__dbg.C && !document.querySelector('#title').classList.contains('on')) && await G.evaluate(() => __dbg.C.day) === await H.evaluate(() => __dbg.C.day));
  await w(400); const t0 = await H.evaluate(() => __dbg.DLG.cur.text); chk('guest sees the same dialogue line', await G.evaluate(() => __dbg.DLG.cur && __dbg.DLG.cur.text) === t0);
  await shot(G, '0_guest_joined');
  chk('guest has the 🔗 chip, host in control', await G.evaluate(() => !!document.querySelector('#coopchip') && /房主在操作/.test(document.querySelector('#coopchip').textContent)));
  chk('guest stage mirrored', await G.evaluate(() => typeof STG !== 'undefined') && JSON.stringify(await H.evaluate(() => (STG.sc || []).length)) === JSON.stringify(await G.evaluate(() => (STG.sc || []).length)));
  // 没有操作权：点对话不动
  await G.click('#dlg'); await w(500); chk('guest blocked without control', await H.evaluate(() => __dbg.DLG.cur.text) === t0);
  // 请求接手 → 房主同意
  await G.evaluate(() => __dbg.coopCtrl()); await H.waitForFunction(() => __dbg.NET.req === 'guest', null, { timeout: 4000 }).catch(() => 0);
  chk('host sees the request prompt', await H.evaluate(() => !!document.querySelector('#coopreq')));
  await H.click('#coopreq .btn.pri'); await G.waitForFunction(() => __dbg.NET.ctrl === 'guest', null, { timeout: 4000 }).catch(() => 0);
  chk('control handed to guest after consent', await H.evaluate(() => __dbg.NET.ctrl === 'guest') && await G.evaluate(() => __dbg.myControl()));
  // 队友点对话往下走
  for (let i = 0; i < 4; i++) { await G.click('#dlg'); await w(350); }
  chk('guest advances the host dialogue', await H.evaluate(() => !__dbg.DLG.cur || __dbg.DLG.cur.text) !== t0);
  // 让开场剧情跑完，做一个选择
  await H.evaluate(async () => { const D = __dbg; D.STATE.run++; D.STATE.scene = null; D.DLG.cur = null; D.DLG.res = null; D.refresh(); await new Promise(r => setTimeout(r, 300)); window.__ch = null; D.runScene(async () => { window.__ch = await choose([['走左边', ''], ['走右边', '']], '往哪走？'); }); });
  await G.waitForFunction(() => __dbg.DLG.cur && __dbg.DLG.cur.choices, null, { timeout: 4000 }).catch(() => 0);
  const gch = await G.$$('#dlg .dch button'); chk('guest sees the choices', gch.length === 2);
  if (gch[1]) await gch[1].click();
  await H.waitForFunction(() => !!document.querySelector('.picked') && !!document.querySelector('.taptag'), null, { timeout: 1500 }).catch(() => 0);
  await shot(H, '1_host_sees_guest_pick'); await shot(G, '1_guest_pick');
  chk('host sees the guest pick highlighted with a tag', await H.evaluate(() => !!document.querySelector('.picked') && /队友点了/.test((document.querySelector('.taptag') || {}).textContent || '')));
  chk('pick waits before it runs', await H.evaluate(() => window.__ch === null));
  await H.waitForFunction(() => window.__ch === 1, null, { timeout: 3000 }).catch(() => 0); chk('guest pick applied on host', await H.evaluate(() => window.__ch === 1));
  // 交回给房主；房主选，队友那边亮
  await G.evaluate(() => __dbg.coopCtrl()); await H.waitForFunction(() => __dbg.NET.ctrl === 'host', null, { timeout: 3000 }).catch(() => 0); chk('guest gives control back', await H.evaluate(() => __dbg.NET.ctrl === 'host'));
  await H.evaluate(() => { window.__ch = null; __dbg.runScene(async () => { window.__ch = await choose([['开门', ''], ['不开', '']], '门外有人敲门。'); }); }); await H.waitForSelector('#dlg .dch button'); await w(300);
  await (await H.$$('#dlg .dch button'))[0].click();
  await G.waitForFunction(() => !!document.querySelector('.picked') && /房主点了/.test((document.querySelector('.taptag') || {}).textContent || ''), null, { timeout: 1500 }).catch(() => 0);
  chk('guest sees the host pick highlighted', await G.evaluate(() => /房主点了/.test((document.querySelector('.taptag') || {}).textContent || '')));
  await H.waitForFunction(() => window.__ch === 0, null, { timeout: 3000 }).catch(() => 0);
  await H.evaluate(() => { __dbg.STATE.run++; __dbg.STATE.scene = null; __dbg.DLG.cur = null; __dbg.refresh(); });
  // 白天接待：队友操作员工
  await H.evaluate(async () => { const D = __dbg; gainPet('xiaoxiao'); D.auto = false; D.instant = false; D.C.tick = 0; D.C.seen.tuth = 1; D.go('hh_door', true, true); window.__hs = null; Promise.resolve(D.receive('mh')).then(r => window.__hs = r || 1); });
  await H.waitForFunction(() => __dbg.HS && __dbg.HS.phase === 'setup' && !!document.querySelector('#hsset .hs-sb'), null, { timeout: 8000 }).catch(() => 0);
  await H.evaluate(() => { const H = __dbg.HS; if (!H) return; if (!Object.values(H.lay.staff || {}).some(Boolean) && H.M.staff[0]) hsSetPick(H.M.staff[0].i, 'xiaoxiao', 1); __dbg.hsOpen(); });
  await G.waitForFunction(() => __dbg.HS && __dbg.HS.phase === 'live', null, { timeout: 6000 }).catch(() => 0);
  chk('guest sees the house open', await G.evaluate(() => !!__dbg.HS && __dbg.HS.phase === 'live' && document.body.classList.contains('m-hs')));
  await w(800); await shot(G, '2_guest_house'); await shot(H, '2_host_house');
  chk('one staff assigned to the guest', await H.evaluate(() => __dbg.HS.staff.some(s => s.p2)) && await G.evaluate(() => /你是/.test((document.querySelector('#p2who') || {}).textContent || '')));
  const p0 = await H.evaluate(() => { const s = __dbg.HS.staff.find(q => q.p2); return [s.tx, s.ty]; });
  await G.evaluate(([x, y]) => __dbg.coopHsSend({ a: 'go', x: x + 3, y }), p0); await G.evaluate(([x, y]) => __dbg.coopHsSend({ a: 'go', x, y: y + 3 }), p0); await w(1600);
  const p1 = await H.evaluate(() => { const s = __dbg.HS.staff.find(q => q.p2); return [s.tx, s.ty]; });
  chk('guest moves the staff (' + p0 + ' → ' + p1 + ')', p1[0] !== p0[0] || p1[1] !== p0[1]);
  { const dk = await H.evaluate(() => { const H = __dbg.HS, M = H.M, st = H.staff.find(q => q.p2), ks = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']; st.path = null; st.want = null; let best = 0, bn = -1; for (let d = 0; d < 4; d++) { let n = 0; while (n < 5 && !hmSolid(M, M.hs, st.tx + HD[d][0] * (n + 1), st.ty + HD[d][1] * (n + 1))) n++; if (n > bn) { bn = n; best = d; } } return [ks[best], bn, st.tx, st.ty]; });
    await G.keyboard.down(dk[0]); await w(900); await G.keyboard.up(dk[0]); await w(500); const q = await H.evaluate(() => { const st = __dbg.HS.staff.find(q => q.p2); return [st.tx, st.ty, st.kd]; });
    chk('guest arrow keys move the staff (' + dk + ' → ' + q + ')', Math.abs(q[0] - dk[2]) + Math.abs(q[1] - dk[3]) >= Math.min(2, dk[1]) && q[2] == null); }
  await H.evaluate(() => { const H = __dbg.HS, st = H.staff.find(q => q.p2), v = hActive(H)[0] || H.vis[0]; if (v) { v.x = st.x + 1; v.y = st.y; v.tx = Math.round(v.x); v.ty = Math.round(v.y); v.mv = null; if (v.st !== 'in') v.st = 'in'; } st.cd = 0; window.__sc0 = H.staff.find(q => q.p2).cd; });
  await G.evaluate(() => __dbg.guestScare()); await H.waitForFunction(() => { const st = __dbg.HS.staff.find(q => q.p2); return st && (st.want || st.pop > 0 || st.cd > 0); }, null, { timeout: 3000 }).catch(() => 0);
  chk('guest 吓！ reaches the host staff', await H.evaluate(() => { const st = __dbg.HS.staff.find(q => q.p2); return !!st && (!!st.want || st.pop > 0 || st.cd > 0); }));
  chk('host still drives 陈歌 while guest has staff', await H.evaluate(() => { const h = __dbg.HS.hero, x0 = h.tx; hGo(__dbg.HS, h.tx + 2, h.ty); return true; }));
  await H.evaluate(() => { const H = __dbg.HS; H.vis.forEach(v => { v.st = 'gone'; v.u.hp = 0; }); }); await H.waitForFunction(() => __dbg.HS && __dbg.HS.done, null, { timeout: 8000 }).catch(() => 0);
  await H.waitForFunction(() => !!document.querySelector('.hs-end'), null, { timeout: 6000 }).catch(() => 0); await H.evaluate(() => hsClose()); await H.waitForFunction(() => window.__hs !== null, null, { timeout: 4000 }).catch(() => 0);
  await G.waitForFunction(() => !__dbg.STATE.house, null, { timeout: 4000 }).catch(() => 0); chk('house closes on both', await G.evaluate(() => !__dbg.STATE.house));
  // 小游戏：队友看得到
  await H.evaluate(() => { window.__mg = null; __dbg.mini = null; miniGame('makeup').then(r => window.__mg = r); }); await G.waitForFunction(() => !!__dbg.STATE.mini && __dbg.MG && __dbg.MG.id === 'makeup', null, { timeout: 4000 }).catch(() => 0);
  chk('guest sees the minigame', await G.evaluate(() => !!__dbg.STATE.mini && document.body.classList.contains('m-dlg')));
  await H.evaluate(() => miniTap('skip')); await G.waitForFunction(() => !__dbg.STATE.mini, null, { timeout: 4000 }).catch(() => 0); chk('minigame closes on guest', await G.evaluate(() => !__dbg.STATE.mini));
  await H.waitForFunction(() => window.__mg !== null, null, { timeout: 4000 }).catch(() => 0); await H.evaluate(() => { __dbg.STATE.run++; __dbg.STATE.scene = null; __dbg.DLG.cur = null; __dbg.refresh(); });
  // 夜晚任务：两边都开，队友请求接手，选项亮一下
  await H.evaluate(() => { __dbg.nightReal = true; window.__nr = null; night('attic').then(r => window.__nr = r); });
  const hf = await frameOf(H), gf = await frameOf(G); chk('both open the night iframe', !!hf && !!gf);
  if (hf && gf) {
    await gf.waitForFunction(() => __kn.W && __kn.W.ch.id === 'attic', null, { timeout: 8000 }).catch(() => 0); chk('guest night mirrors the chapter', await gf.evaluate(() => !!(__kn.W && __kn.W.ch.id === 'attic')));
    for (let i = 0; i < 6; i++) { await hf.evaluate(() => __kn.doAct('adv')); await w(250); }
    await gf.evaluate(() => ctrlButton()); await hf.waitForFunction(() => __kn.W.req === 'g', null, { timeout: 4000 }).catch(() => 0); chk('night: host sees guest request', await hf.evaluate(() => __kn.W.req === 'g'));
    await hf.evaluate(() => ctrlAnswer(true)); await gf.waitForFunction(() => __kn.W.ctrl === 'g', null, { timeout: 4000 }).catch(() => 0); chk('night: guest in control after consent', await gf.evaluate(() => __kn.W.ctrl === 'g' && iControl()));
    await hf.evaluate(() => { window.__a = null; runScript(async S => { window.__a = await S.ask('测试：选一个', ['甲', '乙']); }); }); await gf.waitForFunction(() => __kn.W.dlg && __kn.W.dlg.choices, null, { timeout: 4000 }).catch(() => 0); await w(500);
    const chs = await gf.$$('#dlg .ch'); if (chs[1]) await chs[1].click();
    await hf.waitForFunction(() => __kn.W.dlg && __kn.W.dlg.pk === 'g', null, { timeout: 2000 }).catch(() => 0); chk('night: guest pick marked on host', await hf.evaluate(() => !!(__kn.W.dlg && __kn.W.dlg.pk === 'g' && __kn.W.dlg.sel === 1)));
    await shot(G, '3_guest_night_pick'); await shot(H, '3_host_night_pick');
    await gf.waitForFunction(() => /你选了/.test((document.querySelector('#dlg .watch') || {}).textContent || ''), null, { timeout: 2000 }).catch(() => 0);
    chk('night: guest sees "你选了"', await gf.evaluate(() => /你选了/.test(document.querySelector('#dlg .watch').textContent)));
    await hf.waitForFunction(() => window.__a === 1, null, { timeout: 3000 }).catch(() => 0); chk('night: pick resolved after the pause', await hf.evaluate(() => window.__a === 1));
    await hf.evaluate(() => __kn.finish('end'));
    await G.waitForFunction(() => !document.querySelector('#nightov'), null, { timeout: 4000 }).catch(() => 0); chk('night closes on both', await G.evaluate(() => !document.querySelector('#nightov')) && await H.evaluate(() => !document.querySelector('#nightov')));
  }
  // 房主回标题 → 队友回等待画面；房主再读档 → 队友跟上
  await H.evaluate(() => __dbg.toTitle()); await G.waitForFunction(() => !!document.querySelector('#tlobby'), null, { timeout: 4000 }).catch(() => 0);
  chk('host back to title → guest back to lobby', await G.evaluate(() => !__dbg.C && !!document.querySelector('#tlobby') && __dbg.NETROLE === 'guest'));
  await H.evaluate(() => __dbg.slotNew(2)); await G.waitForFunction(() => !!__dbg.C, null, { timeout: 6000 }).catch(() => 0);
  chk('host picks another save → guest follows', await G.evaluate(() => !!__dbg.C && !document.querySelector('#title').classList.contains('on')));
  for (let i = 0; i < 30; i++) { const d = await H.evaluate(() => { if (document.querySelector('#card.on')) { cardTap(); return 0; } if (document.querySelector('#cine.on')) { cineTap(); return 0; } return 1; }); if (d) break; await w(150); }
  // 快捷发言、断开
  await G.evaluate(() => __dbg.coopQuick(3)); await H.waitForFunction(() => !!document.querySelector('.coopsay'), null, { timeout: 2000 }).catch(() => 0); chk('quick chat shows on host', await H.evaluate(() => /队友：/.test((document.querySelector('.coopsay') || {}).textContent || '')));
  await G.evaluate(() => __dbg.netLeave()); await H.waitForFunction(() => __dbg.NET.conns.size === 0, null, { timeout: 5000 }).catch(() => 0);
  chk('guest leaves → host continues solo', await H.evaluate(() => __dbg.NET.conns.size === 0 && __dbg.NET.ctrl === 'host' && !!__dbg.C) && await G.evaluate(() => !__dbg.C && document.querySelector('#title').classList.contains('on')));
  chk('guest never wrote a save', await G.evaluate(() => !Object.keys(localStorage).some(k => /^kbw\.s\d/.test(k) && localStorage.getItem(k).length > 50)));
  console.log('coop', ok.length + '/' + (ok.length + bad.length), bad.length ? 'FAIL: ' + bad.join(' | ') : 'OK'); console.log('errors', errs.slice(0, 8));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
