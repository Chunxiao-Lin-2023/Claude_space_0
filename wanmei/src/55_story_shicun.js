/* ================= 石村篇 · 试玩剧情（序章 – 第十六章，压缩改编） ================= */
const SPK = (name, tag, col) => { SPEAKERS[name] = { tag, col }; };
SPK('族长', 'chief', '#f0d8a0'); SPK('石林虎', 'linhu', '#ffb070'); SPK('石飞蛟', 'feijiao', '#c8e090'); SPK('二猛', 'ermeng', '#e8c890'); SPK('皮猴', 'pihou', '#e8c890'); SPK('石大壮', 'dazhuang', '#e8c890');
SPK('教头阿叔', 'coach', '#d8c8a0'); SPK('石守山', 'shoushan', '#d8c8a0'); SPK('狈风', 'beifeng', '#ff9a8a'); SPK('狈山', 'beishan', '#ff9a8a'); SPK('皮猴爹', 'pihoudad', '#d8c8a0'); SPK('村民', null, '#d8c8a0'); SPK('孩子们', null, '#e8c890'); SPK('旁白', null);
SPK('青鳞鹰', 'eagle', '#7ad8c0'); SPK('紫云', 'ziyun', '#e0a0ff'); SPK('狈村人', null, '#ff9a8a'); SPK('阿福叔', 'afu', '#d8c8a0');
/* ---------- custom props (no rig): interactables ---------- */
function mkProp(tag, mesh, x, z, o = {}) { const e = mkEnt(Object.assign({ type: 'prop', tag, x, z, team: 2, r: 0.6, h: 1, noPlate: !o.name, ghost: true, fixed: true }, o)); e.root = mesh; R3.scene.add(mesh); return e; }
function stoneMesh() { return new Obj2D((g, K) => { LW = 1.6; const R = mulberry32(13); rockShape(g, 0, 0, 0.8 * K, 1.5 * K, '#5a8a7a', R, 0.95); g.strokeStyle = 'rgba(200,255,230,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-0.3 * K, -1.2 * K); g.lineTo(0.1 * K, -0.7 * K); g.stroke(); }); }
function propMesh(name, sc = 1) { const P = getProto(name); return new Obj2D((g, K) => { const B = protoBitmap(P, 0), q = K * sc / B.s; g.drawImage(B.cv, -P.w * P.ax * B.s * q, -P.h * P.ay * B.s * q, B.cv.width * q, B.cv.height * q); }); }

function spearPile() { return new Obj2D((g, K) => { const px = UM_C * K; LW = 1.3; for (let i = 0; i < 5; i++) { g.save(); g.translate((i - 2) * 0.12 * K, 0); g.rotate((i - 2) * 0.12); g.scale(px, px); drawWeapon(g, 'spear', 1); g.restore(); } line(g, -0.4 * K, -0.5 * K, 0.4 * K, -0.5 * K, 3, '#4a3020'); }); }
function trapMesh() { return new Obj2D((g, K) => { g.fillStyle = 'rgba(40,30,20,.5)'; g.beginPath(); g.ellipse(0, 0, 0.9 * K, 0.5 * K, 0, 0, TAU); g.fill(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = Math.cos(a) * 0.6 * K, y = Math.sin(a) * 0.32 * K; g.fillStyle = '#9a9aa2'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x, y - 0.4 * K); g.lineTo(x + 3, y); g.closePath(); g.fill(); } }, { layer: 0 }); }

MOBS.stake = { name: '草靶木桩', spec: 'stakeS', hp: 40, atk: 0, def: 0, spd: 0, r: 0.4, range: 0, cd: 99, skills: [], xp: 15, loot: [] };

MOBS.yardox = { name: '青黑大莽牛', spec: 'mangniu', hp: 380, atk: 8, def: 4, spd: 4.6, r: 1.3, range: 2.8, cd: 2.6, skills: ['gore', 'charge'], xp: 120, heavy: true, loot: [] };
/* ---------- the 青鳞鹰 mother (story creature, flies) ---------- */
function eagleEnt(x, z, o = {}) { const e = npc('eagle', 'qingying', x, z, Object.assign({ name: '青鳞鹰', title: '魔禽', team: 2, fly: true, flyH: 14, r: 2.2, noPush: true, ghost: true, script: true }, o)); e.A.fly = true; return e; }
/* ---------- the giant silhouettes of the prologue ---------- */
function giantBird() { const R = buildBird({ key: 'giantbird', size: 9, c1: '#0a0a10', c2: '#1a1420', belly: '#14101a', beak: '#050505', iris: ['#400000', '#ff2010', '#ff8060', '#200000'] }); R.root.layer = 3; R.root.absY = false; R.root.cullR = 60; R3.scene.add(R.root); return R; }
function giantGold() { const R = buildHuman({ key: 'goldgiant', build: 'man', hair: 'bald', hairC: '#c8a030', skin: '#d8b040', skinSh: '#a87820', top: '#c8a030', vest: true, fur: '#e8c050', kilt: '#a88020', legC: '#b89028', pants: true, boot: '#8a6818', face: FACE({ ew: 16, eh: 46, sep: 0.0001, ey: 4, iris: EYES.gold, browW: 0, blush: 0, mouthW: 10, smile: -2 }) }); R.root.scale.setScalar(7); R.root.cullR = 60; R3.scene.add(R.root); return R; }
function camPan(x, z, zoom, d = 1.2) { CAM.cine = { x0: CAM.tx, z0: CAM.tz, k0: CAM.zoom, x1: x, z1: z, k1: zoom, t: 0, d }; W.cine = true; }
/* ---------- village people ---------- */
const BARKS = [
  ['最近深夜总有大家伙路过，山都在抖。', '族长说，大荒深处可能出了了不得的东西。', '有人猜是山宝……'],
  ['柳神那条柳枝夜里会发光，有它在，凶兽不敢进村。', '别吃那最没用的树猪肉！', '小不点又偷喝兽奶了？'],
  ['咱们石村三百多口人，靠的就是一身力气。', '狩猎队今天进山了，祭灵保佑平安回来。', '这苍莽山脉里，没有本事可活不长。'],
  ['小家伙，又去追五色雀啊？', '晚上别出村，山里的东西会吃人。', '族长的炉鼎从来没熄过火。'],
];
function villagers() {
  const spots = [[-8, 40], [10, 48], [-18, 58], [22, 62], [-6, 72], [14, 80], [-26, 48], [30, 46], [-14, 86], [6, 30], [-30, 80], [26, 84], [18, 36], [-22, 34]];
  spots.forEach(([x, z], i) => { const kind = ['man', 'woman', 'old', 'child'][i % 4]; const e = npc('vil' + i, 'villager', x, z, { seed: i + 3, kind, name: kind === 'child' ? pick(['石小虎', '石青', '石蛋', '石娃', '小石头']) : kind === 'old' ? pick(['石老爹', '族老', '石阿婆']) : kind === 'woman' ? pick(['石大婶', '虎婶', '石阿嫂', '石婶']) : pick(['石阿叔', '石壮', '石山', '石林', '石虎']), rot: rr(0, TAU), wanderR: kind === 'old' ? 2 : 7 }); e.bark = BARKS[i % 4]; e.spd = kind === 'child' ? 2.6 : 1.8; if (kind === 'old' && i % 8 === 2) { e.A.pose = 'sit'; e.wanderR = 0; } });
  const dog = npc('dog', 'dog', CHIEF.x + 3, CHIEF.z + 10, { name: '大黄狗', title: '族长家的', wanderR: 6, spd: 3 }); dog.bark = ['汪汪！', '汪？', '（大黄狗警惕地夹紧了尾巴）'];
  dog.interact = { label: '扯尾巴', fn: (p, t) => { bubble(t, '汪汪汪！！', 2); act(t.A, 'bite', 0.4); sfx('bite'); if (p.R && p.R.kind === 'human') { p.A.face = 'happy'; setTimeout(() => p.A.face = 'open', 1500); } t.wanderR = 10; } };
  // elders on the boulders by the yard
  for (let i = 0; i < 3; i++) { const a = PI + 0.5 + i * 0.9; const x = YARD.x + Math.cos(a) * 15, z = YARD.z + Math.sin(a) * 13; const e = npc('elder' + i, 'villager', x, z + 0.8, { seed: 50 + i, kind: 'old', name: ['族老', '石老爹', '石阿公'][i], rot: Math.atan2(YARD.x - x, YARD.z - z), pose: 'cross' }); e.y += 0.5; e.bark = ['老了，吞吐天精也没年轻时管用了。', '想当年，我们也是从这片空地上练出来的。', '苍莽山脉里，人命如草芥啊。']; }
}
function coreNPCs() {
  const chief = npc('chief', 'chief', CHIEF.x - 2, CHIEF.z + 6, { name: '石云峰', title: '石村族长', rot: PI * 0.8 }); chief.bark = ['想知道的话就让自己先强大起来。', '贵在心诚。', '小不点，别又去拉大黄的尾巴。'];
  SPEAKERS['族长'] = { tag: 'chief', col: '#f0d8a0' };
  const lh = npc('linhu', 'linhu', 6, -6, { name: '石林虎', title: '狩猎队头领', rot: PI }); lh.bark = ['小不点，给你留了红浆果。', '山里不太平，别乱跑。'];
  const fj = npc('feijiao', 'feijiao', -6, -4, { name: '石飞蛟', title: '猎手', rot: PI, weapon: ['club', 1.2] }); fj.bark = ['虎哥说今天进山，你在家乖乖的。'];
  npc('ermeng', 'ermeng', YARD.x - 4, YARD.z + 4, { name: '二猛', title: '石猛', rot: 0 }).bark = ['嘿嘿，我掀翻过一头莽牛！', '小不点，你又在吃奶吗？'];
  npc('pihou', 'pihou', YARD.x + 4, YARD.z + 5, { name: '皮猴', title: '石中侯', rot: 0 }).bark = ['我阿爸说我以后要去大部族封侯做王！', '嘘——林虎叔说石林那边有个大鸟窝。'];
  npc('dazhuang', 'dazhuang', YARD.x + 1, YARD.z + 8, { name: '石大壮', title: '孩子头', rot: 0 }).bark = ['我是孩子里最壮的。', '小不点，别逞强。'];
  // evening hunters & the coach start hidden / elsewhere and are moved by scripts
}
ZONES.shicun.populate = function () {
  RNG = mulberry32(99); villagers(); coreNPCs(); RNG = mulberry32(Date.now() & 0xffff);
  // wild animals of the outer forest
  const wolves = [[60, -20], [-50, -30], [90, 10], [-80, 40], [40, -150], [-130, -80], [-90, -130], [-140, -40], [100, -100], [-60, -180]]; wolves.forEach(([x, z], i) => spawnMob(i % 4 === 3 ? 'lynx' : 'wolf', x, z, { lv: i < 4 ? 2 : 4 + (i % 3) }));
  [[130, -150], [150, -190], [115, -185], [165, -150]].forEach(([x, z], i) => spawnMob('snake', x, z, { lv: 4 + (i % 2) }));
  for (let i = 0; i < 4; i++) spawnMob('mangniu', MEADOW.x + rr(-14, 14), MEADOW.z + rr(-14, 14), { lv: 4, wanderR: 14 });
  spawnMob('biao', 250, 60, { lv: 10, wanderR: 10 });
  // 嗅宝 secrets
  W.secrets = [[70, 20, 'herb', 3], [-120, 10, 'milk', 1], [150, -120, 'blood', 1], [-60, -150, 'yaosan', 2], [200, -40, 'blood', 1], [-150, 120, 'milk', 2], [30, 160, 'herb', 4], [-200, -120, 'yaosan', 1]].map(([x, z, id, n], i) => {
    const m = lootMesh();
    const s = { x, z, id, n, got: false }; const e = mkProp('secret' + i, m, x, z, { vis: false, spin: 1.5, interact: { label: '挖出宝物', fn: () => { s.got = true; e.vis = false; e.interact = null; addItem(id, n); sfx('loot'); burst(x, terrH(x, z) + 0.5, z, 0xffe08a, 20, 4); } } }); s.e = e; return s; });
  // berry bushes (pickable)
  [[64, 30], [-56, 20], [40, 128], [-48, 118], [84, -30], [-70, -50], [20, -60], [-30, 140]].forEach(([x, z], i) => { place('berrybush', x, z, 0, 1.1); const e = mkProp('berry' + i, new Obj2D(), x, z, { interact: { label: '摘红浆果', fn: (p, t) => { if (W.t - (t.picked || -99) < 60) { toast('浆果还没长出来'); return; } t.picked = W.t; addItem('berry', ri(1, 2)); sfx('loot'); } } }); });
  W.checkpoint = { x: WILLOW.x + 4, z: WILLOW.z + 12 };
  ZONES.shicun.tick = dt => { for (const s of W.secrets || []) if (!s.got && s.e) s.e.vis = W.sniffT > 0 && W.P[0] && d2(s.x, s.z, W.P[0].x, W.P[0].z) < 40 * 40; };
  rebuildStaticIfNeeded();
};
function rebuildStaticIfNeeded() { buildStatic(); }
/* ---------- side quests ---------- */
Object.assign(SIDEQ, {
  wolves: { title: '山狼成群', giver: 'linhu', text: '在村外山林猎杀山狼', kill: ['wolf'], need: 6, xp: 260, reward: [['meat', 3], ['yaosan', 1]], repeat: 120,
    offer: [['石林虎', '村外山林里的狼越来越多了，夜里总在村边嚎。'], ['石林虎', '你和{pet}去收拾几头，顺便给大伙添点肉。']], wip: [['石林虎', '狼群在村子北面和西面的林子里。']], done: [['石林虎', '好小子！这些狼肉够大伙吃两顿了。'], ['石林虎', '拿着，药散是救命的东西，省着用。']], req: () => STORY.qi >= 3 },
  hides: { title: '大婶的兽皮', giver: 'vil1', text: '收集兽皮', item: 'hide', need: 4, xp: 180, reward: [['milk', 2]],
    offer: [['@vil', '小不点，入冬前要给孩子们缝兽皮衣，还缺几张皮子。'], ['@vil', '帮大婶从山狼、山猫身上弄几张来好不好？']], done: [['@vil', '真能干！大婶给你熬了百兽奶，可别说是“喝水”哦。']], req: () => STORY.qi >= 3 },
  blood: { title: '凶兽真血', giver: 'chief', text: '为五岁洗礼积攒凶兽真血（精英凶兽、嗅宝都可能得到）', item: 'blood', need: 1, xp: 300, reward: [['yaosan', 2]], repeat: 180,
    offer: [['族长', '大族的天才五岁时要封在铜炉里，以圣药、太古真血熬炼肉身，那叫洗礼。'], ['族长', '咱们石村拿不出那么多宝血，只能一滴一滴地攒。'], ['族长', '你若在山里遇到有灵性的猛兽，它们的血精……宁缺毋滥。']], wip: [['族长', '东边深林里有一头凶彪，那是真正的凶兽。小心。']], done: [['族长', '一头猛兽，最后只得这一滴，像血钻一样。'], ['族长', '好，存进玉罐里。']], req: () => STORY.qi >= 5 },
});
SPEAKERS['@vil'] = { tag: 'vil1', col: '#d8c8a0' };
/* ---------- helpers for scripts ---------- */
const P1 = () => W.P[0], P2 = () => W.P[1];
function hidePet(h) { const p = P2(); if (!p) return; p.vis = !h; p.ghost = h; p.fixed = h; p.script = h; if (p.glowL) p.glowL.visible = !h; }
async function lineup(list) { await Promise.all(list.map(([e, x, z, sp]) => e ? walkTo(e, x, z, sp || 3) : null)); }
function crowdAt(x, z, n, r, faceX, faceZ, seed = 0) { const out = []; for (let i = 0; i < n; i++) { const e = entByTag('vil' + ((i + seed) % 14)); if (!e) continue; const a = i / n * PI * 1.4 + PI * 0.3; teleport(e, x + Math.cos(a) * r, z + Math.sin(a) * r); e.wanderR = 0; faceTo(e, faceX, faceZ); out.push(e); } return out; }
function releaseCrowd() { for (let i = 0; i < 14; i++) { const e = entByTag('vil' + i); if (e) { e.wanderR = 6; e.home = { x: e.x, z: e.z }; } } }
async function narr(lines) { await talk(lines.map(l => ['旁白', l])); }
function petName() { return PARTY.pname || '绒灵'; }
STORY.onCast = (e, id) => { if (STORY.castHook) STORY.castHook(e, id); };
/* ================= QUESTS ================= */
QUESTS = [
/* ---------- 序章 ---------- */
{ id: 'prologue', chapter: '序章', chapterSub: '大荒', title: '大荒', noTitle: true, desc: '夜已深，群山万壑间洪荒猛兽横行。', xp: 0,
  steps: [{ t: 'script', text: '……', run: async () => {
    cine(true); setLight('night', true); hidePet(true); const me = P1(); me.vis = false; teleport(me, WILLOW.x + 4, WILLOW.z + 14);
    const wp = WILLOWOBJ.g.position; camShot([wp.x + 70, wp.y + 60, wp.z + 120], [wp.x, wp.y + 5, wp.z + 30], 0.01); await wait(0.3);
    uiChapter('序章', '大荒'); camShot([wp.x + 30, wp.y + 30, wp.z + 70], [wp.x, wp.y + 6, wp.z + 10], 7);
    await narr(['夜已深，漆黑一片，景物不可见。但山中并不宁静，猛兽咆哮，震动山河，万木摇颤。', '群山万壑间，洪荒猛兽横行，太古遗种出没，各种可怕的声音在黑暗中此起彼伏，直欲裂开这天地。', '山中唯一的一团柔光，来自一个村子——石村。村头那半截焦黑的雷击木上，只剩一条柳枝，晶莹如绿玉刻成。']);
    // the giant bird passes like a cloud, eyes like two blood moons
    const B = giantBird(); B.root.position.set(wp.x - 60, terrH(wp.x, wp.z) + 26, wp.z + 2); B.root.rotation.y = HP; B.root.shadow = 9; const A = { t: 0, fly: true }; sfx('eagle');
    camPan(wp.x, wp.z - 2, 0.55, 2.5);
    let shk = 0; await animate(9, (t, dt) => { B.root.position.x = wp.x - 60 + 13.5 * t; poseRig(B, A, dt); if (t > 4.6 && !shk) { shk = 1; shake(0.3); } });
    await narr(['一只庞大到不可思议的巨鸟飞过，像是一片乌云，双眼宛若两轮血月。它看了老柳木片刻，飞向山脉最深处。']);
    B.root.removeFromParent();
    // the golden one-eyed giant walking past the mountains
    const G = giantGold(); G.root.position.set(wp.x + 34, terrH(wp.x, wp.z - 14), wp.z - 14); G.root.rotation.y = -HP; const GA = { t: 0, spd: 1.2 };
    camPan(wp.x, wp.z - 19, 0.5, 2.5);
    let lastStep = 0; await animate(6, (t, dt) => { G.root.position.x = wp.x + 34 - 11 * t; poseRig(G, GA, dt); if (Math.floor(t * 0.9) !== lastStep) { lastStep = Math.floor(t * 0.9); shake(0.15); sfx('boom'); } });
    await narr(['后半夜，一个与群山齐高的人形生物走过，通体金色鳞片，面部很平，只有一只竖眼。它看了老柳木一眼，匆匆离去。']);
    G.root.removeFromParent();
    // a glowing egg falls from the dark and the willow branch catches it (改编：灵卵)
    const egg = eggMesh(); egg.scale.setScalar(0.8); R3.scene.add(egg); egg.position.set(wp.x + 14, wp.y + 22, wp.z + 2);
    camPan(wp.x + 1, wp.z + 2, 0.9, 2);
    await animate(2.6, (t, dt, k) => { egg.position.set(lerp(wp.x + 14, wp.x + 2, k), lerp(wp.y + 22, wp.y + 1.2, k * k), lerp(wp.z + 2, wp.z + 6, k)); emit(egg.position.x, egg.position.y, egg.position.z, rr(-1, 1), rr(0, 2), rr(-1, 1), 0x8affd0, 0.8, 0.6, 0); });
    await narr(['黎明前，一团流光自天外坠落，砸向石村。', '那条柔弱的柳枝垂下，莹莹绿霞缠住了它——那是一枚灵卵，上面爬满了破碎的符文。', '一根散发着莹莹绿霞的柔弱柳条在风中轻轻摇曳……']);
    egg.removeFromParent(); WILLOWOBJ.boost = 0;
    await fade(true, 1.2); setLight('dawn', true); camRelease(); await wait(0.4);
    uiChapter('完美世界', '一个少年从大荒中走出，一切从这里开始'); await wait(2.6);
    me.vis = true; cine(false); await fade(false, 1);
  } }] },
/* ---------- 第一章 ---------- */
{ id: 'q1', chapter: '第一章', chapterSub: '朝气蓬勃', title: '迎霞锻体', desc: '清晨，孩子们在村前空地迎霞锻体。', xp: 160,
  onStart: () => { hidePet(true); const c = npc('coach', 'villager', YARD.x, YARD.z - 7, { seed: 7, kind: 'man', name: '教头阿叔', title: '晨练', rot: 0 }); c.R && 0; for (const k of ['ermeng', 'pihou', 'dazhuang']) { const e = entByTag(k); if (e) { e.A.pose = 'train'; } } for (let i = 0; i < 6; i++) { const kid = npc('tkid' + i, 'villager', YARD.x - 5 + (i % 3) * 5, YARD.z + (i < 3 ? 0 : 3.5), { seed: 30 + i, kind: 'child', name: '石村孩子', rot: PI }); kid.A.pose = 'train'; kid.bark = ['哼！哈！', '嘿！'];} for (const k of ['ermeng', 'pihou', 'dazhuang']) { const e = entByTag(k); e.rot = PI; } },
  steps: [
    { t: 'script', text: '……', run: async () => { const me = P1(); teleport(me, CHIEF.x - 3, CHIEF.z + 9, PI * 0.9); const ch = entByTag('chief'); teleport(ch, CHIEF.x - 1, CHIEF.z + 7.5, 0); faceTo(ch, me.x, me.z); faceTo(me, ch.x, ch.z); camShotOn(me, { ang: 0.8, d: 3.2, t: 0.01 }); cine(true); await wait(0.3);
      await talk([['旁白', '清晨，朝霞灿灿。小不点在族长院里醒来，嘴角还残留着白色的奶渍。'], ['族长', '你这个小家伙，又偷喝兽奶。'], ['小不点', '咿呀……我、我在喝水。', 'happy'], ['族长', '哼。孩子们都去村前空地迎霞锻体了，你也去。'], ['小不点', '好呀！']]); cine(false); } },
    { t: 'goto', x: YARD.x, z: YARD.z - 1, r: 9, text: '去村前空地（往南）' },
    { t: 'talk', npc: 'coach', text: '和教头阿叔说话', say: [['教头阿叔', '一天之计在于晨，每日早起多用功，强筋壮骨，活血炼筋，将来才能在这苍莽山脉中有活命的本钱。'], ['孩子们', '明白！'], ['小不点', '……明白呀。', 'happy'], ['教头阿叔', '（大家都笑了）你这小不点，路都走不稳就来凑热闹。跟着出拳！']] },
    { t: 'cond', text: '跟着口令出拳：普攻（左键 / J）', prog: () => `（${Math.min(8, STORY.trainN || 0)}/8）`, onStart: () => { STORY.trainN = 0; STORY.castHook = (e, id) => { if (e === P1() && id === 'fist' && d2(e.x, e.z, YARD.x, YARD.z) < 400) { STORY.trainN++; hudDirty(); if (STORY.trainN % 3 === 0) bubble(entByTag('coach'), pick(['哼！哈！', '嘿！', '好！']), 1); } }; }, check: () => (STORY.trainN || 0) >= 8, onDone: () => { STORY.castHook = null; } },
    { t: 'script', text: '……', run: async () => { await talk([['教头阿叔', '收心！'], ['教头阿叔', '好了，收功！'], ['小不点', '呼……咿呀，累了。'], ['旁白', '一只五色雀扑棱棱落在不远处，歪着脑袋看他。'], ['小不点', '咿呀！雀儿！', 'surprise']]);
      for (const k of ['ermeng', 'pihou', 'dazhuang']) { const e = entByTag(k); if (e) e.A.pose = null; } for (let i = 0; i < 6; i++) despawn('tkid' + i); const c = entByTag('coach'); if (c) c.wanderR = 3;
      const bird = npc('wuse', 'wuseque', YARD.x + 4, YARD.z - 6, { name: '五色雀', fly: true, flyH: 1.5, noPlate: false, ghost: true }); bird.A.fly = true; STORY.birdPath = [[12, 80], [-8, 62], [6, 42], [-4, 28], [WILLOW.x + 3, WILLOW.z + 7]]; STORY.birdI = 0; } },
    { t: 'cond', text: '追五色雀', go: () => { const b = entByTag('wuse'); return b ? { x: b.x, z: b.z } : null; }, check: () => { const b = entByTag('wuse'), me = P1(); if (!b || !me) return false; if (!b.walk && d2(b.x, b.z, me.x, me.z) < 5 * 5) { const p = STORY.birdPath[STORY.birdI++]; if (!p) return true; sfx('chirp'); walkTo(b, p[0], p[1], 9, { keepScript: true }); if (STORY.birdI === 2) { bubble(me, '咿呀，别跑！', 1.5); } } return false; } },
    { t: 'script', text: '……', run: async () => { const b = entByTag('wuse'); cine(true); const wp = WILLOWOBJ.g.position; camShot([wp.x + 8, wp.y + 4, wp.z + 16], [wp.x + 2, wp.y + 1, wp.z + 6], 1.2);
      if (b) { walkTo(b, wp.x + 1, wp.z - 2, 6); } await wait(1); despawn('wuse');
      STORY.egg = mkProp('egg', eggMesh(), wp.x + 2.4, wp.z + 6.4, { r: 0.6, name: '灵卵', interact: { label: '摸一摸灵卵' } }); STORY.egg.noPlate = false; WILLOWOBJ.boost = 1; sfx('glow');
      await talk([['旁白', '五色雀钻进了柳神的根须间，不见了。树根下，一团柔光一明一暗，像在呼吸。'], ['小不点', '咿呀？这是什么……蛋？', 'surprise']]); cine(false); } },
    { t: 'interact', npc: 'egg', text: '去柳神树下看看那团光', run: async () => {
      cine(true); const me = P1(), wp = WILLOWOBJ.g.position, ex = wp.x + 2.4, ez = wp.z + 6.4; faceTo(me, ex, ez); me.A.pose = 'kneel'; camShot([ex + 2.5, terrH(ex, ez) + 1.6, ez + 3], [ex, terrH(ex, ez) + 0.6, ez], 1.2); await wait(1.2);
      await narr(['小手刚碰到蛋壳，那些破碎的符文就亮了起来。柳枝垂下，轻轻拂过灵卵——']);
      WILLOWOBJ.boost = 3; sfx('evolve'); for (let i = 0; i < 40; i++) setTimeout(() => emit(ex + rr(-0.3, 0.3), terrH(ex, ez) + rr(0.3, 1.2), ez + rr(-0.3, 0.3), rr(-2, 2), rr(1, 4), rr(-2, 2), 0x8affd0, 1, 0.4, 3), i * 30); await wait(1.4);
      burst(ex, terrH(ex, ez) + 0.7, ez, 0xbfffe0, 80, 5, 0.6); shake(0.15); despawn('egg');
      const p = P2(); teleport(p, ex, ez, Math.atan2(me.x - ex, me.z - ez)); hidePet(false); p.script = true; act(p.A, 'roar', 0.6);
      me.A.pose = null; camShot([ex + 1.8, terrH(ex, ez) + 0.9, ez + 2.6], [ex, terrH(ex, ez) + 0.5, ez], 0.8); await wait(0.8); WILLOWOBJ.boost = 0.4;
      await talk([['旁白', '蛋壳碎成了光点。一团圆滚滚、软乎乎的小东西眨了眨大眼睛，额头上一点小小的角芽。'], ['小不点', '咿呀！你是谁呀？', 'surprise'], ['@pet', '（它歪着脑袋看了小不点好一会儿，忽然一头扎进他怀里，蹭个不停）'], ['小不点', '哈哈，好痒！你没有名字吗？那……就叫你「' + petName() + '」好不好？', 'happy'], ['@pet', '咕噜咕噜～']]);
      const ch = entByTag('chief'); teleport(ch, ex + 5, ez + 4); faceTo(ch, ex, ez); await walkTo(ch, ex + 2.5, ez + 2.2, 2.2); faceTo(ch, ex, ez);
      await talk([['族长', '这是……柳神护下的灵物。昨夜大家伙一个接一个地过，原来是为了它。'], ['族长', '它既认了你，你就好生养着。山里的东西都知道它的气息，往后它会跟着你一起长大。'], ['小不点', '嗯！' + petName() + '，以后我们一起变强！', 'happy']]);
      p.script = false; PARTY.flags.hatched = 1; cine(false); banner('神兽伙伴 · ' + petName(), '和小不点共享等级，一起成长。剧情推进到一定阶段会进化为新的种族。'); say('【系统】' + petName() + ' 加入了队伍。双人联机时由第二位玩家操控。', '#9ad8ff');
    } },
  ] },
/* ---------- 第二章 ---------- */
{ id: 'q2', chapter: '第二章', chapterSub: '骨文', title: '骨文', desc: '狩猎队出发后，族长在村头草地给孩子们讲骨文。', xp: 260,
  onStart: () => { const ch = entByTag('chief'); teleport(ch, WILLOW.x + 9, WILLOW.z + 16, PI); for (const [k, dx] of [['ermeng', -2], ['pihou', 0], ['dazhuang', 2]]) { const e = entByTag(k); teleport(e, WILLOW.x + 9 + dx, WILLOW.z + 21, PI); e.A.pose = 'cross'; } STORY.stone = mkProp('qingshi', stoneMesh(), WILLOW.x + 13, WILLOW.z + 19, { r: 1, name: '青石', interact: { label: '抱起青石' } }); STORY.stone.noPlate = false; },
  steps: [
    { t: 'talk', npc: 'chief', text: '去村头草地听族长讲骨文', say: [['族长', '都坐好。骨文，是先民从太古凶兽的宝骨上临摹下来的符文，是我们人族与凶兽抗衡的根本。'], ['二猛', '族长爷爷，那些鸟文龟字像鬼怪符一样复杂，实在难学，用心记它做什么？'], ['族长', '没用？小不点，你来。'], ['小不点', '咿呀咿呀，族长爷爷什么事呀？'], ['族长', '把那块青石抱起来给他们看看。']] },
    { t: 'interact', npc: 'qingshi', text: '抱起比你还高的青石', run: async () => { const me = P1(), st = STORY.stone; cine(true); faceTo(me, st.x, st.z); camShotOn(me, { ang: 1.2, d: 4, t: 0.8 }); await wait(0.5);
      act(me.A, 'lift', 1.2); sfx('lift'); hitSpark(me.x, me.y + 0.5, me.z, 0xffd86a, 16); for (let i = 0; i < 10; i++) setTimeout(() => emit(me.x + rr(-0.3, 0.3), me.y + 0.6, me.z + rr(-0.3, 0.3), 0, 1, 0, 0xffd86a, 0.6, 0.25, 0), i * 50);
      await wait(0.6); st.root.position.y = 0; st.dy = 1.1; st.x = me.x; st.z = me.z + 0.2; me.A.pose = 'carry'; await wait(1.2);
      await talk([['旁白', '小不点掌心浮现出金属质感的符文，嘿呀一声，把那块比他还高的青石抱离了地面。'], ['孩子们', '（双眼放光）'], ['皮猴', '小不点你将吃奶的力气都用出来了吧？'], ['小不点', '咿呀，是的，力气都用光了。', 'happy']]);
      me.A.pose = null; st.dy = 0; st.x = me.x + 1.2; PARTY.flags.sk_shenli = 1; netEv({ k: 'flag', f: 'sk_shenli', v: 1 }); buildHotbar(); banner('领悟 · 神力·掷石', '按 1 掀起巨石砸向敌人（纯肉身的神力）'); cine(false);
      for (let i = 0; i < 3; i++) spawnMob('stake', WILLOW.x + 20 + i * 4, WILLOW.z + 30, { story: true, respawn: false, tag: 'stake', rot: PI }).ai.st = 'none';
      for (const s of entsByTag('stake')) s.script = true; } },
    { t: 'kill', mob: 'stake', n: 3, text: '用掷石（1）或拳脚打倒草靶', go: () => ({ x: WILLOW.x + 24, z: WILLOW.z + 30 }) },
    { t: 'script', text: '……', run: async () => { for (const k of ['ermeng', 'pihou', 'dazhuang']) entByTag(k).A.pose = null;
      await talk([['族长', '看见了吗？这就是骨文。'], ['族长', '外面的世界很大，一域到另一域动辄数以百万里。一夜之间，大部族、巨城都可能被太古遗种毁掉。'], ['族长', '可也有人族天骄，横推八荒……'], ['小不点', '族长爷爷，外面是什么样子的？'], ['族长', '（他摸了摸怀里那块奇异的玉骨）想知道的话，就让自己先强大起来。']]); } },
  ] },
/* ---------- 第三·四章 ---------- */
{ id: 'q3', chapter: '第三章', chapterSub: '祭灵', title: '祭灵与药浴', desc: '狩猎队满载而归。祭祀祭灵之后，就是孩子们最怕的药浴。', xp: 420,
  onStart: () => { setLight('dusk'); netEv({ k: 'light', n: 'dusk' }); const lh = entByTag('linhu'), fj = entByTag('feijiao'); teleport(lh, 22, -70, 0); teleport(fj, 18, -74, 0); for (let i = 0; i < 4; i++) npc('hunter' + i, 'villager', 20 + (i % 2) * 3, -78 - Math.floor(i / 2) * 3, { seed: 60 + i, kind: 'man', name: '石村猎手', rot: 0, weapon: [i % 2 ? 'spear' : 'club', 1] }); },
  steps: [
    { t: 'script', text: '……', run: async () => { const lh = entByTag('linhu'), fj = entByTag('feijiao'), hs = [0, 1, 2, 3].map(i => entByTag('hunter' + i)); cine(true); camShot([10, terrH(10, -10) + 6, -2], [12, terrH(12, -40) + 2, -40], 1.5);
      await Promise.all([walkTo(lh, 4, -8, 3.2), walkTo(fj, 0, -9, 3.2), ...hs.map((h, i) => walkTo(h, -6 + i * 4, -13, 3.2))]);
      await talk([['石林虎', '族长！这回进山，一个人都没伤着！'], ['石飞蛟', '龙角象、独足夔兽、飞蟒、双头火犀……还有一头血脉不纯的貔貅。'], ['石林虎', '夜里有超级巨兽路过，把好多凶兽都踩伤了。山里还有个大脚印，形状像人足，足有近百米长。'], ['族长', '……近百米长？大荒深处，怕是出了了不得的东西。']]); cine(false); } },
    { t: 'goto', x: ALTAR.x, z: ALTAR.z + 6, r: 6, text: '到祭台前参加祭祀', onStart: () => { const ch = entByTag('chief'); teleport(ch, ALTAR.x, ALTAR.z + 3.5, 0); crowdAt(ALTAR.x, ALTAR.z + 8, 10, 6, ALTAR.x, ALTAR.z); } },
    { t: 'script', text: '……', run: async () => { const ch = entByTag('chief'); cine(true); camShot([ALTAR.x + 10, terrH(ALTAR.x, ALTAR.z) + 6, ALTAR.z + 16], [ALTAR.x - 2, terrH(ALTAR.x, ALTAR.z) + 4, ALTAR.z - 2], 2); faceTo(ch, WILLOW.x, WILLOW.z); ch.A.pose = 'pray'; for (let i = 0; i < 14; i++) { const v = entByTag('vil' + i); if (v && d2(v.x, v.z, ALTAR.x, ALTAR.z) < 200) v.A.pose = 'pray'; }
      await talk([['族长', '祭灵，请保佑族人，让孩子们打到肥美的猎物，平安归来。我们将以虔诚的心，世代祭祀与供养你。']]); WILLOWOBJ.boost = 1.4; sfx('glow'); await wait(1.5);
      await talk([['村民', '（一个少年小声嘀咕）祭灵从来都不取用祭品，咱们每次都祭吗……'], ['族长', '祭灵，是我们祭祀与供养的灵，贵在心诚。我们虔诚待它，它才会守护与保佑我们的村子。']]); WILLOWOBJ.boost = 0;
      ch.A.pose = null; for (let i = 0; i < 14; i++) { const v = entByTag('vil' + i); if (v) v.A.pose = null; }
      await talk([['族老', '孩子们——药浴的时候到了！'], ['孩子们', '嗷……不！']]);
      // the kids scatter
      for (const [k, x, z] of [['ermeng', -34, 40], ['pihou', 30, 72], ['dazhuang', -10, 92]]) { const e = entByTag(k); teleport(e, ALTAR.x + rr(-3, 3), ALTAR.z + 7); e.flee = { x, z }; e.caught = false; e.npcAI = kidFlee; e.interact = { label: '抓住' + e.name, fn: (p, t) => catchKid(t) }; }
      releaseCrowd(); cine(false); setLight('day'); netEv({ k: 'light', n: 'day' }); } },
    { t: 'cond', text: '把逃跑的孩子抓回来', prog: () => `（${['ermeng', 'pihou', 'dazhuang'].filter(k => entByTag(k).caught).length}/3）`, go: () => { const e = ['ermeng', 'pihou', 'dazhuang'].map(entByTag).find(e => !e.caught); return e ? { x: e.x, z: e.z } : null; }, check: () => ['ermeng', 'pihou', 'dazhuang'].every(k => entByTag(k).caught) },
    { t: 'script', text: '……', run: async () => { cine(true); const me = P1(); const bx = BATH.x, bz = BATH.z; teleport(me, bx + 2, bz + 8, PI); camShot([bx + 9, terrH(bx, bz) + 6, bz + 12], [bx, terrH(bx, bz) + 1.5, bz], 1.5);
      for (const [k, i] of [['ermeng', 0], ['pihou', 2], ['dazhuang', 5]]) { const a = i / 8 * TAU, e = entByTag(k); teleport(e, bx + Math.cos(a) * 5, bz + Math.sin(a) * 5); e.dy = 0.6; e.A.pose = 'sit'; }
      for (let i = 0; i < 30; i++) setTimeout(() => puff(bx + rr(-6, 6), terrH(bx, bz) + 1.8, bz + rr(-6, 6), 0x9a8a7a, 1, 1.2), i * 60);
      await talk([['旁白', '八口大铜鼎烧开了水，加了药草、尺许长的蜈蚣、拳头大的蜘蛛，水变得像墨汁一样，又倒进凶兽真血、碾碎的飞蟒翼骨……'], ['二猛', '阿爸松手，我不想被煮熟了！'], ['皮猴', '救命啊——'], ['旁白', '只有小不点被单独放进了那口黑鼎。里面只加了一点清水，其余全是凶兽真血和碎骨。']]);
      teleport(me, CHIEF.x - 1, CHIEF.z + 5); me.vis = false; camShot([CHIEF.x + 3, terrH(CHIEF.x, CHIEF.z) + 3.5, CHIEF.z + 10], [CHIEF.x - 1, terrH(CHIEF.x, CHIEF.z) + 1.5, CHIEF.z + 5], 1.2); for (let i = 0; i < 20; i++) setTimeout(() => puff(CHIEF.x - 1 + rr(-0.6, 0.6), terrH(CHIEF.x, CHIEF.z) + 2.4, CHIEF.z + 5 + rr(-0.6, 0.6), 0xa83a2a, 1, 0.8), i * 80);
      await talk([['旁白', '族长把罐中化形的貔貅、双头犀虚影一掌拍散，打入鼎中。'], ['旁白', '咕嘟咕嘟——小不点呛了好几大口。']]);
      me.vis = true; teleport(me, CHIEF.x - 1, CHIEF.z + 7.2, 0); me.A.face = 'closed'; me.A.pose = null; await wait(0.6);
      await talk([['小不点', '……喝饱了。', 'closed'], ['旁白', '他摇摇晃晃，像喝醉了一样，倒在族长怀里睡着了。']]);
      for (const k of ['ermeng', 'pihou', 'dazhuang']) { const e = entByTag(k); e.dy = 0; e.A.pose = null; e.npcAI = null; e.interact = null; teleport(e, YARD.x + rr(-5, 5), YARD.z + rr(2, 8)); }
      await fade(true, 1); me.A.face = 'open'; for (const p of W.P) { p.hpMax = Math.round(p.hpMax * 1.05); p.hp = p.hpMax; } await fade(false, 0.8);
      await talk([['旁白', '第二天，孩子们身上脱落了一层老皮，被逼着举磨盘、扛铜鼎——力气确实长了。']]); cine(false); } },
  ] },
/* ---------- 第五章 ---------- */
{ id: 'q4', chapter: '第五章', chapterSub: '举鼎', title: '演武', desc: '两年后。小不点三岁半，有了名字——石昊。村中空地少年演武。', xp: 560,
  onStart: () => { for (const [k, x, z] of [['ermeng', -5, 4], ['pihou', 5, 4], ['dazhuang', 0, 6]]) teleport(entByTag(k), YARD.x + x, YARD.z + z, PI); const pd = npc('pihoudad', 'villager', YARD.x + 9, YARD.z + 6, { seed: 71, kind: 'man', name: '石守山', title: '皮猴的爹', rot: PI }); crowdAt(YARD.x, YARD.z, 12, 12, YARD.x, YARD.z, 2);
    STORY.roller = mkProp('roller', new Obj2D(), YARD.x - 8, YARD.z + 3, { r: 1, name: '石碾子', interact: { label: '抱起石碾子' } }); STORY.roller.noPlate = false; const ox = spawnMob('yardox', YARD.x + 3, YARD.z - 6, { lv: 3, story: true, respawn: false, tag: 'yardox', team: 2, rot: PI }); ox.script = true; ox.noLeash = true; ox.onHurt = () => { if (ox.hp < ox.hpMax * 0.3 && !STORY.oxDown) { STORY.oxDown = 1; ox.hp = Math.max(ox.hp, 1); ox.invuln = true; } }; ox.wanderR = 2; },
  steps: [
    { t: 'script', text: '……', run: async () => { cine(true); uiChapter('两年后', '小不点三岁半，有了名字——石昊'); await wait(2.5); const me = P1(); teleport(me, YARD.x - 2, YARD.z + 10, PI); camShot([YARD.x + 12, terrH(YARD.x, YARD.z) + 7, YARD.z + 16], [YARD.x, terrH(YARD.x, YARD.z) + 1.5, YARD.z], 2);
      const em = entByTag('ermeng'), ph = entByTag('pihou'), dz = entByTag('dazhuang'), pd = entByTag('pihoudad');
      await talk([['旁白', '村中空地上男女老少围成一圈。大人们互相吹嘘着自家的孩子。'], ['村民', '快看，二猛才八岁半啊，居然将一头莽牛给生生掀翻了！']]);
      act(em.A, 'lift', 1); await wait(0.8); await talk([['村民', '皮猴八九岁了吧，看着干巴巴，居然这么大的力气，把石磨盘扔出去十几米！'], ['皮猴爹', '那是，也不看是谁的种！我给他起名叫石中侯，以后是要走出大山的，到大部族去封侯做王！']]);
      await walkTo(dz, YARD.x, YARD.z - 1.6, 2); act(dz.A, 'lift', 1.6); sfx('lift'); await wait(1.4); await talk([['村民', '大壮九岁，把千斤青铜鼎举过了头顶——天生神力啊！'], ['石大壮', '呼……呼……'], ['教头阿叔', '下一个——小不点，你也来试试？'], ['小不点', '咿呀，我来试试。', 'happy']]); dz.A.act = null; teleport(dz, YARD.x, YARD.z + 6, PI); cine(false); } },
    { t: 'interact', npc: 'roller', text: '抱起石碾子，扔出去', run: async () => { const me = P1(); cine(true); faceTo(me, YARD.x - 8, YARD.z - 30); camShotOn(me, { ang: 1.4, d: 5, t: 0.6 }); act(me.A, 'lift', 0.8); sfx('lift'); await wait(0.6);
      await talk([['小不点', '呀嘿！']]); act(me.A, 'throw', 0.6); sfx('whoosh'); const rk = rockMesh(0.6); R3.scene.add(rk); const x0 = me.x, z0 = me.z; await animate(1.6, (t, dt, k) => { rk.position.set(x0 - 8 * k, terrH(x0, z0) + 1.2 + Math.sin(k * PI) * 16, z0 - 66 * k); rk.spinA = (rk.spinA || 0) + dt * 12; }); dust(rk.position.x, rk.position.y, rk.position.z, 20); sfx('boom'); setTimeout(() => rk.removeFromParent(), 2000);
      await talk([['村民', '六……六七十米？！'], ['旁白', '全场鸦雀无声。']]); const ox = entByTag('yardox'); ox.script = false; ox.team = 1; ox.lastAtk = me; ox.ai.tgt = me; cine(false); } },
    { t: 'cond', text: '抓住莽牛的犄角，把它摔倒（打到三成气血以下）', go: () => { const o = entByTag('yardox'); return o ? { x: o.x, z: o.z } : null; }, check: () => !!STORY.oxDown },
    { t: 'script', text: '……', run: async () => { const me = P1(), ox = entByTag('yardox'); cine(true); ox.script = true; ox.ai.lock = 99; camShotOn(me, { ang: 1.0, d: 5, t: 0.5 }); faceTo(me, ox.x, ox.z); await walkTo(me, ox.x + Math.sin(ox.rot) * 2.6, ox.z + Math.cos(ox.rot) * 2.6, 6); faceTo(me, ox.x, ox.z);
      act(me.A, 'slam', 0.9); await wait(0.5); ox.A.pose = 'dead'; shake(0.3); dust(ox.x, ox.y, ox.z, 24); sfx('boom'); await wait(0.8);
      await talk([['旁白', '小不点抓住犄角，把那头青黑大莽牛摔了个四脚朝天。'], ['二猛', '……'], ['皮猴', '……']]); rmEnt(ox);
      STORY.ding = mkProp('bigding', new Obj2D(), YARD.x, YARD.z - 3, { r: 1.5, name: '千斤青铜鼎', interact: { label: '举起千斤青铜鼎' } }); STORY.ding.noPlate = false; cine(false); } },
    { t: 'interact', npc: 'bigding', text: '举起千斤青铜鼎', run: async () => { const me = P1(); cine(true); teleport(me, YARD.x, YARD.z - 1.4, PI); camShotOn(me, { ang: 0.7, d: 4.5, t: 0.6 });
      await talk([['旁白', '鼎上有飞禽走兽的图案，古意盎然。鼎太高，小不点个子太矮，抱不住。'], ['孩子们', '哈哈，他够不着！']]);
      me.A.pose = 'kneel'; await wait(0.5);
      toast('连按 普攻 / J / 空格，把鼎托起来！', 3); cine(false); W.cine = true; uiCine(true); let pow = 0, t0 = W.t; const hook = () => { pow += 1; sfx('punch'); hitSpark(me.x, me.y + 0.5, me.z, 0xffd86a, 4); };
      const kd = e => { if (['j', ' ', 'f', 'Enter'].includes(e.key.length === 1 ? e.key.toLowerCase() : e.key)) hook(); }; addEventListener('keydown', kd); const pd = () => hook(); document.getElementById('gl').addEventListener('pointerdown', pd);
      await waitUntil(() => { uiProgress('托起千斤青铜鼎', pow / 18); return pow >= 18 || NETROLE === 'host' && W.t - t0 > 12; }, 30);
      removeEventListener('keydown', kd); document.getElementById('gl').removeEventListener('pointerdown', pd); uiProgress(null);
      me.A.pose = null; act(me.A, 'lift', 2.5); sfx('lift'); shake(0.25); const dm = propMesh('ding', 1.6); dm.zoff = 0.1; R3.scene.add(dm); const st = W.t; const fol = () => { dm.position.set(me.x, me.y + me.h * lerp(0.4, 1.15, clamp((W.t - st) / 0.6, 0, 1)), me.z); if (W.t - st < 3.2) requestAnimationFrame(fol); else dm.removeFromParent(); }; fol();
      camShotOn(me, { ang: 0.3, d: 6, h: 1.6, t: 1.2 }); await wait(1.2);
      await talk([['旁白', '他直接蹲下身子，托住鼎底——把千斤青铜鼎举过了头顶。'], ['旁白', '全场石化。'], ['村民', '我还以为……一只太古遗种真犼的崽子跑来了。'], ['石林虎', '纯肉身的力量，没用骨文。'], ['族长', '我在数百万人口的大部族见过天才的孩子……比小不点，还略差些。']]);
      despawn('bigding'); cine(false); } },
    { t: 'script', text: '……', run: async () => { releaseCrowd(); despawn('pihoudad'); await talk([['族长', '大族的天才五岁时要做第一次洗礼。咱们石村拿不出那些圣药……'], ['族长', '只能慢慢攒。林虎，往后猎到有灵性的猛兽，血精都留下。'], ['小不点', '族长爷爷你不要过于劳累，注意休息。'], ['旁白', '（支线「凶兽真血」已开放：可以找族长接取。）']]); } },
  ] },
/* ---------- 第七章 ---------- */
{ id: 'q5', chapter: '第七章', chapterSub: '梧木巢', title: '掏鸟窝', desc: '十几个孩子瞒着大人进了原始山林，要去石林深处的石崖上掏青鳞鹰的蛋。', xp: 620,
  onStart: () => { const dz = entByTag('dazhuang'), em = entByTag('ermeng'), ph = entByTag('pihou'); teleport(dz, 2, 0, PI); teleport(em, -1.5, 1, PI); teleport(ph, 4, 1.5, PI); },
  steps: [
    { t: 'talk', npc: 'dazhuang', text: '村头有几个孩子在嘀嘀咕咕', say: [['石大壮', '嘘——小声点。皮猴偷听到林虎叔说，石林深处的石崖上有一个青鳞鹰的大窝。'], ['皮猴', '雄鹰好些天没露面了，多半死了。雌鹰每天午时出去捕食！'], ['二猛', '咱们去把蛋掏回来！'], ['小不点', '再走下去会很危险的……'], ['小不点', '不过，如果你们要去，我也跟着。'], ['二猛', '哈哈，三岁不断奶的也要去？'], ['小不点', '我早就吃肉了，只是偶尔拿它当水喝！']],
      onDone: () => { for (const k of ['dazhuang', 'ermeng', 'pihou']) { const e = entByTag(k); e.npcAI = kidFollow; e.spd = 6.6; } } },
    { t: 'goto', x: 112, z: -140, r: 10, text: '和孩子们一起穿过山林，去北面的石林', both: false },
    { t: 'script', text: '……', run: async () => { await talk([['旁白', '大树渐稀，巨石多了起来。这是一片很大的石林，寂静无声，地上散落着巨兽的遗骨，雪白而惊人。'], ['石大壮', '都藏好，迎着风闻闻……有蛇虺的腥气。'], ['皮猴', '小心，石缝里有东西！']]);
      for (let i = 0; i < 4; i++) spawnMob(i % 2 ? 'snake' : 'wolf', 128 + rr(-8, 8), -158 + rr(-8, 8), { lv: 4, story: true, respawn: false, tag: 'stoneMob' }).ai.tgt = P1(); } },
    { t: 'kill', mob: 'stoneMob', n: 4, text: '打退石林里的蛇虺和山狼' },
    { t: 'goto', x: NEST.x, z: NEST.z + 22, r: 7, text: '到石林最深处的石崖下' },
    { t: 'script', text: '……', run: async () => { const me = P1(); cine(true); camShot([NEST.x + 14, terrH(NEST.x, NEST.z + 24) + 4, NEST.z + 34], [NEST.x, terrH(NEST.x, NEST.z) + 6, NEST.z], 2);
      await talk([['皮猴', '好大的鸟窝啊！'], ['旁白', '石崖足有三百米高，寸草不生。崖顶是一个以黑梧木筑成的巨巢，直径足有十米，比石村的房屋都巨大。'], ['二猛', '我扔块石头试试，看上面有没有大鸟！'], ['石大壮', '别这么鲁莽！']]);
      act(entByTag('ermeng').A, 'throw', 0.6); await wait(1.2); await talk([['旁白', '没有动静。'], ['小不点', '我先上去。我比你们速度都快，有危险也逃得快。']]);
      STORY.climb = mkProp('climb', new Obj2D(), NEST.x + 1, NEST.z + 17, { r: 1.2, name: '崖壁裂缝', interact: { label: '攀上石崖' } }); STORY.climb.noPlate = false; cine(false); } },
    { t: 'interact', npc: 'climb', text: '顺着崖壁上的缝隙爬上去', run: async () => { const me = P1(), pet = P2(); cine(true); faceTo(me, NEST.x, NEST.z); camShot([NEST.x + 26, terrH(NEST.x, NEST.z) + 2, NEST.z + 26], [NEST.x, terrH(NEST.x, NEST.z) - 10, NEST.z + 14], 1); await fade(true, 0.5);
      teleport(me, NEST.x + 1, NEST.z + 9); me.y = terrH(NEST.x + 1, NEST.z + 9); if (pet && PARTY.flags.hatched) teleport(pet, NEST.x - 1, NEST.z + 9.5); await fade(false, 0.5);
      camShot([NEST.x + 9, terrH(NEST.x, NEST.z) + 5, NEST.z + 14], [NEST.x, terrH(NEST.x, NEST.z) + 0.6, NEST.z], 1.5);
      await talk([['旁白', '崖顶有粘着血丝的大骨头，巢边暗红，是常年进食留下的。巢里铺着柔软的金丝草，三枚水盆大、碧玉般带斑纹的蛋静静地躺着。'], ['@pet', '（' + petName() + '一直趴在小不点头上，这时竖起了耳朵）']]);
      STORY.nest = mkProp('nest', new Obj2D(), NEST.x, NEST.z, { r: 3, name: '梧木巢', interact: { label: '取走鹰蛋' } }); STORY.nest.noPlate = false; STORY.eggs = [0, 1, 2].map(i => { const m = eggMesh(i === 2 ? 0xa8e0c8 : 0x9ad8b8, 0x5ae8a0, 0.4); m.position.set(NEST.x - 1 + i, terrH(NEST.x, NEST.z) + 0.5, NEST.z + (i % 2) * 0.6); R3.scene.add(m); return m; }); cine(false); } },
    { t: 'interact', npc: 'nest', text: '把三枚鹰蛋装进兽皮袋', run: async () => { cine(true); STORY.eggs.forEach(m => m.removeFromParent()); addItem('egg', 3); addItem('scale', 3);
      await talk([['旁白', '蛋壳上有破碎的符文传承——二猛在崖下嚷着要摸，结果先前一个碰过蛋的孩子被电麻了手。'], ['旁白', '小不点还捡了几枚婴儿巴掌大的青鳞，锋利如刀。'], ['小不点', '下去啦！']]); await fade(true, 0.5);
      const me = P1(), pet = P2(); teleport(me, NEST.x + 4, NEST.z + 24); if (pet) teleport(pet, NEST.x + 5, NEST.z + 25); despawn('climb'); despawn('nest'); await fade(false, 0.5);
      await talk([['二猛', '这是我掏过的最大的鸟窝，这么大的蛋生平第一次见到！'], ['孩子们', '哈哈哈——'], ['旁白', '大壮、二猛、皮猴各背一个蛋，孩子们在石林中欢呼着往回跑。']]); cine(false); } },
  ] },
/* ---------- 第八·九章 ---------- */
{ id: 'q6', chapter: '第八章', chapterSub: '青鳞鹰', title: '凶威', desc: '雌鹰回巢，发现蛋没了。', xp: 760,
  steps: [
    { t: 'script', text: '……', run: async () => { const me = P1(); cine(true); const eg = eagleEnt(NEST.x, NEST.z, { flyH: 30 }); sfx('eagle'); shake(0.2); camShot([me.x + 6, me.y + 3, me.z + 8], [NEST.x, terrH(NEST.x, NEST.z) + 25, NEST.z], 1.2); await wait(1.2);
      await talk([['旁白', '一声尖啸撕裂长空。青鳞鹰回来了——体长七八米，翼展十五米，没有羽毛，全身青色金属鳞片，半米长的弯钩黑喙。'], ['孩子们', '我的娘诶，好大一只鸟，快跑呀！'], ['小不点', '往林子密的地方跑！去那个石洞——跟我来！']]);
      for (const k of ['dazhuang', 'ermeng', 'pihou']) { const e = entByTag(k); e.npcAI = kidFollow; } STORY.eagleT = 0; cine(false); } },
    { t: 'goto', x: CAVE.x - 1, z: CAVE.z, r: 4, text: '逃！钻进藤蔓后面的石洞（躲开俯冲）', onStart: () => { STORY.eagleChase = true; }, onDone: () => { STORY.eagleChase = false; } },
    { t: 'script', text: '……', run: async () => { const me = P1(), eg = entByTag('eagle'); cine(true); for (const [k, dz] of [['dazhuang', -1.5], ['ermeng', 0], ['pihou', 1.5]]) { const e = entByTag(k); e.npcAI = null; teleport(e, CAVE.x + 2, CAVE.z + dz); faceTo(e, CAVE.x - 20, CAVE.z); }
      teleport(me, CAVE.x - 1, CAVE.z, -HP); eg.flyH = 4; teleport(eg, CAVE.x - 14, CAVE.z); eg.rot = HP; camShot([CAVE.x + 4, terrH(CAVE.x, CAVE.z) + 2.5, CAVE.z + 2], [CAVE.x - 12, terrH(CAVE.x, CAVE.z) + 3, CAVE.z], 1.2);
      await talk([['旁白', '石洞潮湿幽深，与地下暗河相连。这是小不点以前追一只赤红的雀儿时发现的。'], ['孩子们', '嘿嘿……三岁不断奶，追雀小昊昊！'], ['小不点', '那只雀儿像骨书上的朱雀，我叫它小红！'], ['旁白', '青鳞鹰用爪子扒开洞口的岩石，往里挤——'], ['皮猴', '箭射不进去，只擦出火花！'], ['小不点', '把铁矛给我！射它的眼睛！再把动静闹大，让村里听见！']]);
      STORY.eyeHits = 0; STORY.spears = mkProp('spears', spearPile(), CAVE.x + 1.5, CAVE.z + 2.5, { r: 0.8, name: '铁矛', interact: { label: '拿起一杆铁矛', fn: (p) => { if (p !== P1()) { toast('只有小不点举得动这四五十斤的铁矛'); return; } p.carry = 'spear'; const w = weaponMesh('spear', 1); if (p.spearM) p.spearM.removeFromParent(); p.spearM = attach(p.R, 'R', w, 0, -0.05, 0, HP, 0, 0); toast('按 普攻 / J 把铁矛投向鹰眼'); } } }); STORY.spears.noPlate = false;
      eg.team = 1; eg.invuln = true; eg.boss = true; eg.hp = eg.hpMax = 3; eg.name = '青鳞鹰'; eg.title = '魔禽'; STORY.eagleAtkT = 2; cine(false); } },
    { t: 'cond', text: '拿起铁矛投向青鳞鹰的眼睛', prog: () => `（${STORY.eyeHits || 0}/3）`, go: () => ({ x: CAVE.x + 1.5, z: CAVE.z + 2.5 }), onStart: () => { STORY.castHook = (e, id) => { if (e === P1() && id === 'fist' && e.carry === 'spear') throwSpear(e); }; }, check: () => (STORY.eyeHits || 0) >= 3, onDone: () => { STORY.castHook = null; const p = P1(); p.carry = null; if (p.spearM) { p.spearM.removeFromParent(); p.spearM = null; } despawn('spears'); } },
    { t: 'script', text: '……', run: async () => { const me = P1(), eg = entByTag('eagle'); cine(true); eg.boss = false; eg.team = 2; eg.invuln = false;
      const lh = entByTag('linhu'), fj = entByTag('feijiao'); teleport(lh, CAVE.x - 24, CAVE.z + 14); teleport(fj, CAVE.x - 26, CAVE.z + 10); for (let i = 0; i < 4; i++) { const h = entByTag('hunter' + i) || npc('hunter' + i, 'villager', 0, 0, { seed: 60 + i, kind: 'man', name: '石村猎手', weapon: [i % 2 ? 'spear' : 'club', 1] }); teleport(h, CAVE.x - 28 - i, CAVE.z + 12 + i); }
      camShot([CAVE.x - 8, terrH(CAVE.x - 8, CAVE.z) + 4, CAVE.z + 12], [CAVE.x - 20, terrH(CAVE.x - 20, CAVE.z) + 3, CAVE.z + 6], 1.5);
      walkTo(fj, CAVE.x - 16, CAVE.z + 6, 6); await walkTo(lh, CAVE.x - 14, CAVE.z + 8, 6); faceTo(lh, eg.x, eg.z);
      await talk([['旁白', '村中高台上的人发现了异常，族长大喝：“快去，将两件祖器取来！”'], ['石林虎', '没毛的大鹰过来，朝我这里冲！'], ['族长', '林虎，祭祖器！']]);
      camShotOn(lh, { ang: 0.6, d: 5, t: 0.6 }); act(lh.A, 'cast2', 1.5); await wait(0.5); sfx('roar2'); shake(0.4); pillarFX(lh.x, lh.y, lh.z, 0xffc070, 8, 1.5, 1.2); burst(lh.x, lh.y + 1.4, lh.z, 0xffd090, 60, 7, 0.6);
      const g0 = lh.root.scale.x; for (let i = 0; i < 30; i++) setTimeout(() => { lh.root.scale.setScalar(lerp(g0, 1.32, i / 29)); }, i * 25);
      const arc = new PLight(0xffd090, 30, 12); lh.root.add(arc); arc.position.set(-0.5, 2, 0);
      await talk([['旁白', '石林虎左臂亮起骨文，一块凶兽臂骨按了上去，与手臂融为一体——一股像是万兽之王复活般的气息冲天而起，他从两米拔高到三米，周身缠绕着闪电般的光束。'], ['旁白', '青鳞鹰黑喙上浮现符文，却被这股气息惊退，长啸一声冲上高空。']]);
      eg.flyH = 40; sfx('eagle'); await wait(1.2); arc.removeFromParent(); lh.root.scale.setScalar(g0);
      await fade(true, 0.7); teleport(eg, VIL.x + 40, VIL.z - 50); eg.flyH = 4; teleport(me, YARD.x, YARD.z + 2, PI); for (const k of ['dazhuang', 'ermeng', 'pihou']) teleport(entByTag(k), YARD.x + rr(-4, 4), YARD.z + rr(3, 6)); teleport(lh, YARD.x + 4, YARD.z - 2); teleport(fj, YARD.x - 4, YARD.z - 2); for (let i = 0; i < 4; i++) teleport(entByTag('hunter' + i), -20 + i * 2, 120); await fade(false, 0.7);
      await talk([['村民', '一码归一码，既然没事，就得好好算一算账！毛还没长齐呢，就敢去惹魔禽！'], ['旁白', '大人们抡起蒲扇大手，可着劲地朝这些娃子的屁股上拍。'], ['皮猴', '飞蛟叔你们可真是雄壮与威武！'], ['旁白', '只有小不点没挨打。他躲在族长院里，捧着小瓷碗喝奶。'], ['孩子们', '小不点吃奶喽！'], ['小不点', '你们看错了，我……其实……在喝水。', 'happy']]);
      cine(false); } },
  ] },
/* ---------- 第十·十一章 ---------- */
{ id: 'q7', chapter: '第十章', chapterSub: '返祖', title: '还蛋', desc: '青鳞鹰守在村外巨石上不走。', xp: 700,
  onStart: () => { const ch = entByTag('chief'); teleport(ch, CHIEF.x - 1, CHIEF.z + 8, 0); },
  steps: [
    { t: 'talk', npc: 'chief', text: '去族长院', say: [['族长', '那头青鳞鹰一直守在村外的巨石上，不肯走。'], ['小不点', '咿呀，我们将卵还给它吧。青鳞鹰没有了孩子，也很可怜的。'], ['族长', '……好孩子。']] },
    { t: 'script', text: '……', run: async () => { const me = P1(), ch = entByTag('chief'); cine(true); const wp = WILLOWOBJ.g.position; teleport(me, wp.x + 3, wp.z + 9, PI); camShot([wp.x + 10, wp.y + 4, wp.z + 16], [wp.x + 2, wp.y + 4, wp.z + 4], 1.5);
      const eggs = [0, 1, 2].map(i => { const m = eggMesh(i === 1 ? 0xb0f0d0 : 0x9ad8b8, 0x5ae8a0, 0.4); m.position.set(wp.x + 2 + i * 0.9, terrH(wp.x, wp.z + 8) + 0.1, wp.z + 8); R3.scene.add(m); return m; }); takeItem('egg', 3);
      await talk([['旁白', '孩子们抱着蛋刚出院子，老柳树唯一的那条柳枝垂了下来，轻轻抚过其中一枚蛋——']]); WILLOWOBJ.boost = 2; sfx('glow'); const e1 = eggs[1]; e1.glowc = 0xffb0ff; e1.col = 0xffe0ff; e1.glow = 1.6; for (let i = 0; i < 30; i++) setTimeout(() => emit(e1.position.x, e1.position.y + 0.6, e1.position.z, rr(-1, 1), rr(1, 3), rr(-1, 1), 0xffc0ff, 1, 0.4, 0), i * 40); await wait(1.4);
      await talk([['旁白', '那枚蛋霞光万道，纹络遍布，像神雀浴火飞舞——发生了返祖。'], ['@pet', '（' + petName() + '直勾勾地盯着那些流淌的符文，小鼻子一抽一抽）']]); WILLOWOBJ.boost = 0.3;
      const eg = entByTag('eagle'); teleport(eg, wp.x + 3, wp.z + 30); eg.flyH = 2; eg.rot = PI; camShot([wp.x + 12, wp.y + 5, wp.z + 22], [wp.x + 3, wp.y + 2, wp.z + 18], 1.5);
      eggs.forEach(m => m.position.z += 14); await walkTo(eg, wp.x + 3, wp.z + 25, 4);
      await talk([['旁白', '孩子们把三枚蛋放在村口的草地上。青鳞鹰扑下来护住它们，仔细看了那枚特别的蛋很久。'], ['旁白', '然后，它用翅膀把三枚蛋全都扇进了村里，滚向老柳树。'], ['族长', '你……真要把子嗣留下？'], ['旁白', '青鳞鹰点了点头，看看蛋，又看看老柳树，振翅飞走了。']]); act(eg.A, 'flap', 1); eg.flyH = 50; sfx('eagle'); eggs.forEach(m => m.position.z -= 12); await wait(1.5); despawn('eagle');
      const lh = entByTag('linhu'); teleport(lh, wp.x + 6, wp.z + 14); faceTo(lh, me.x, me.z);
      await talk([['石林虎', '怎么办？事情是你们搞出来的，你们一群小家伙去负责孵蛋！'], ['孩子们', '啊，不要哇，救命！']]);
      await fade(true, 0.8); uiChapter('第十一章', '十几天后'); await wait(2.2); eggs.forEach(m => m.removeFromParent());
      const ex = wp.x + 3, ez = wp.z + 9; const dp = npc('dapeng', 'dapeng', ex - 1.2, ez, { name: '大鹏', title: '青鳞幼鹰', rot: 0 }), xq = npc('xiaoqing', 'xiaoqing', ex, ez + 0.6, { name: '小青', title: '青鳞幼鹰', rot: 0 }), zy = npc('ziyun', 'ziyun', ex + 1.2, ez, { name: '紫云', title: '返祖幼鹰', rot: 0 });
      for (const b of [dp, xq, zy]) { b.wanderR = 3; b.spd = 2; b.bark = ['啾啾！', '啾？', '（用头蹭你的小手臂）']; }
      teleport(me, ex, ez + 3.2, PI); const pet = P2(); teleport(pet, ex + 1.6, ez + 2.6, PI); await fade(false, 0.8); camShot([ex + 3, terrH(ex, ez) + 2.2, ez + 6], [ex, terrH(ex, ez) + 0.6, ez], 1.2);
      await talk([['旁白', '前两枚蛋里钻出两只青鳞小鸟；第三枚碎成齑粉，出来一只紫鳞幼鸟，流光溢霞，像一团火焰在燃烧。'], ['孩子们', '老大叫大鹏，老二叫小青，老三叫紫云！']]);
      // the partner absorbs the broken runes and evolves (改编)
      await talk([['旁白', '三枚蛋壳碎裂时，那些破碎的符文化作光点飘散——' + petName() + '张开小嘴，把它们一口一口全吸了进去。'], ['小不点', '咿呀？' + petName() + '，你在发光！', 'surprise']]);
      camShotOn(pet, { ang: 0.6, d: 3.5, t: 0.8 }); await wait(0.6); evolvePartner('qinglin'); await wait(1.6);
      await talk([['@pet', '（它的绒毛一片片化成了青色的金属鳞片，额前的角芽变成了一排小小的骨刺——它变成了一只青鳞幼鹰！）'], ['族长', '灵物借了青鳞鹰一族的符文……蜕了一次形。这东西，不简单。'], ['小不点', '太好了！你和大鹏、小青、紫云是一家了！', 'happy']]);
      cine(false); } },
  ] },
/* ---------- 第十二章 ---------- */
{ id: 'q8', chapter: '第十二章', chapterSub: '秘骨宝书', title: '秘骨宝书', desc: '三只幼鸟长得飞快，紫云体内的符文称得上秘骨宝书。', xp: 820,
  steps: [
    { t: 'collect', item: 'meat', n: 3, text: '去山林里猎些兽肉回来喂幼鸟', go: () => ({ x: 60, z: -20 }) },
    { t: 'talk', npc: 'ziyun', text: '把兽肉喂给紫云它们', say: [['旁白', '三只幼鸟扑上来抢肉吃。紫云一米多长时就跑出村撕了几头虎狼，跟小不点最亲，还用鳞翅给他捶背。'], ['孩子们', '马屁精！'], ['小不点', '大鹏别闹，一会儿我也要研究你的符文。小青，一会儿我带你去抓蛟鱼吃，现在别打扰我哦。'], ['紫云', '啾啾！']], onDone: () => takeItem('meat', 3) },
    { t: 'script', text: '……', run: async () => { const me = P1(), zy = entByTag('ziyun'); cine(true); faceTo(me, zy.x, zy.z); me.A.pose = 'cross'; camShotOn(me, { ang: 0.9, d: 3.8, t: 1 });
      await talk([['旁白', '太古遗种宝骨上的原始符文是一族的不传之秘，可称之为宝符。紫云返祖，它体内的符文就是秘骨宝书。'], ['旁白', '小不点搂着紫云的脖子，看它体表显化的宝符，看了一遍又一遍——']]);
      for (let i = 0; i < 40; i++) setTimeout(() => emit(zy.x + rr(-0.5, 0.5), zy.y + rr(0.3, 1.2), zy.z + rr(-0.5, 0.5), (me.x - zy.x) * 0.8, 0.4, (me.z - zy.z) * 0.8, 0xd8a0ff, 1.2, 0.3, 0), i * 50);
      await wait(2); me.A.pose = null; act(me.A, 'cast', 0.6); sfx('moon'); const m = crescentMesh(0xbfe8ff, 1.2); m.position.set(me.x, me.y + 0.8, me.z); fx(m, 1, (f, k) => { m.position.x = me.x + Math.sin(me.rot) * k * 14; m.position.z = me.z + Math.cos(me.rot) * k * 14; m.rotation.y = me.rot; });
      await talk([['旁白', '他左手打出一个弯月——一轮明月斩开了五六米高的巨石！'], ['族长', '这是……青鳞鹰一族的宝术！以后不到关键时刻，不要轻易施展。'], ['小不点', '我还觉得银月上面应该有一棵树，还有一座宫殿……'], ['旁白', '他又一指点出，一只赤红的小雀儿飞了出去，点燃了一株大树。']]);
      PARTY.flags.sk_yinyue = 1; PARTY.flags.sk_chique = 1; netEv({ k: 'flag', f: 'sk_yinyue', v: 1 }); netEv({ k: 'flag', f: 'sk_chique', v: 1 }); buildHotbar(); banner('领悟 · 银月 / 骨文·赤雀', '按 2 斩出银月（穿透）；按 3 点出追踪的赤雀'); cine(false); } },
    { t: 'kill', mob: 'wolf', n: 3, text: '到村外试试银月：猎杀山狼', go: () => ({ x: 60, z: -20 }) },
    { t: 'script', text: '……', run: async () => { setLight('dusk'); netEv({ k: 'light', n: 'dusk' }); const me = P1(); cine(true); teleport(me, WILLOW.x + 3, WILLOW.z + 14, 0); const ss = npc('shoushan', 'villager', WILLOW.x + 6, WILLOW.z + 4, { seed: 71, kind: 'man', name: '石守山', title: '皮猴的爹', pose: 'lie' }); const ph = entByTag('pihou'); teleport(ph, WILLOW.x + 7.5, WILLOW.z + 5, -HP); ph.A.pose = 'kneel'; const ch = entByTag('chief'); teleport(ch, WILLOW.x + 4.5, WILLOW.z + 5, HP);
      camShot([WILLOW.x + 10, terrH(WILLOW.x, WILLOW.z) + 4, WILLOW.z + 12], [WILLOW.x + 6, terrH(WILLOW.x, WILLOW.z) + 0.6, WILLOW.z + 4], 1.5);
      await talk([['旁白', '傍晚，狩猎队回来了。皮猴的父亲石守山被数十里外狈村的人射了一箭，一米三长的铁箭射穿了护身钢甲，透背而出。'], ['皮猴', '阿爸！阿爸——'], ['石守山', '哭啥，不就是挨了一箭吗！平常打猎经常被猛兽撕伤，流这点血算什么！']]); cine(false); } },
  ] },
/* ---------- 第十三章 ---------- */
{ id: 'q9', chapter: '第十三章', chapterSub: '怒', title: '狈村越界', desc: '狈村越界抢猎物、挖兽坑、放冷箭。', xp: 900,
  steps: [
    { t: 'collect', item: 'berry', n: 5, text: '摘一篮红浆果送给石守山（村外的浆果丛）', go: () => ({ x: 64, z: 30 }) },
    { t: 'talk', npc: 'shoushan', text: '把红浆果送给石守山', say: [['小不点', '石阿叔，吃浆果，可甜了。'], ['石守山', '……好孩子。阿叔这条命硬着呢。'], ['皮猴', '是狈村一个十四五岁的少年射的！长得白皙俊俏，眼神冷得吓人！'], ['族长', '我们不惹事，但也不怕事。'], ['族长', '狈村的人这些天在咱们的狩猎区挖兽坑、插铁矛，已经有人掉进去了。'], ['族长', '小不点，跟着林虎去西北的狩猎区看看——小心。']], onDone: () => { takeItem('berry', 5); const lh = entByTag('linhu'); teleport(lh, -100, -96); lh.npcAI = null; ['beitrap0', 'beitrap1', 'beitrap2'].forEach((t, i) => { const [x, z] = [[-96, -112], [-118, -96], [-128, -126]][i]; mkProp(t, trapMesh(), x, z, { r: 1.2, name: '兽坑', interact: { label: '填平兽坑', fn: (p, e) => { e.done = true; despawn(t); dust(x, terrH(x, z), z, 16); sfx('boom'); STORY.traps = (STORY.traps || 0) + 1; hudDirty(); } } }).noPlate = false; }); for (let i = 0; i < 4; i++) spawnMob('bhunter', -112 + rr(-12, 12), -112 + rr(-12, 12), { lv: 6, story: true, respawn: false, tag: 'scout' }); } },
    { t: 'cond', text: '在狩猎区填平狈村的兽坑', prog: () => `（${STORY.traps || 0}/3）`, go: () => { const t = ['beitrap0', 'beitrap1', 'beitrap2'].map(entByTag).find(Boolean); return t ? { x: t.x, z: t.z } : null; }, check: () => (STORY.traps || 0) >= 3 },
    { t: 'kill', mob: 'scout', n: 4, text: '赶走狈村的探子', go: () => ({ x: -112, z: -112 }) },
    { t: 'script', text: '……', run: async () => { const me = P1(), lh = entByTag('linhu'); const fj = entByTag('feijiao'); cine(true); teleport(fj, me.x + 12, me.z - 10); faceTo(fj, me.x, me.z); fj.A.face = 'angry'; camShotOn(fj, { ang: 0.5, d: 4, t: 1 }); await walkTo(fj, me.x + 2.5, me.z - 1.5, 5);
      await talk([['旁白', '石飞蛟浑身是血地冲了回来。'], ['石飞蛟', '虎哥！我们去运那些兽尸，半路被狈村截杀了！猎物全被抢走，好几个兄弟脏腑被射穿……'], ['石飞蛟', '阿福叔也伤得很重！'], ['小不点', '阿福叔……！', 'angry'], ['石林虎', '追！']]);
      fj.A.face = 'open'; cine(false); for (const e of [lh, fj]) { e.npcAI = adultFollow; e.spd = 6.8; } } },
  ] },
/* ---------- 第十四·十五·十六章 ---------- */
{ id: 'q10', chapter: '第十四章', chapterSub: '蛮横', title: '小不点显威', desc: '循着毛发、血迹、鳞片追踪狈村的人。', xp: 1400,
  steps: [
    { t: 'goto', x: ARENA.x + 18, z: ARENA.z + 16, r: 8, text: '循着血迹追向山林较深处', onStart: () => { STORY.trail = setInterval(() => { if (!P1()) return; const t = [[-150, -150], [-160, -166], [ARENA.x + 18, ARENA.z + 16]]; for (const [x, z] of t) puff(x + rr(-2, 2), terrH(x, z) + 0.2, z + rr(-2, 2), 0xa0201a, 1, 0.5); }, 300); }, onDone: () => clearInterval(STORY.trail) },
    { t: 'script', text: '……', run: async () => { const me = P1(), pet = P2(), lh = entByTag('linhu'), fj = entByTag('feijiao'); cine(true); for (const e of [lh, fj]) e.npcAI = null;
      teleport(lh, ARENA.x + 14, ARENA.z + 13, -PI * 0.75); teleport(fj, ARENA.x + 16, ARENA.z + 10, -PI * 0.75); teleport(me, ARENA.x + 17, ARENA.z + 14, -PI * 0.75); if (pet) teleport(pet, ARENA.x + 18.5, ARENA.z + 15);
      const bf = spawnMob('beifeng', ARENA.x - 8, ARENA.z - 8, { lv: 9, story: true, respawn: false, tag: 'beifeng', team: 2, rot: PI * 0.25 }); bf.script = true; bf.keep = true; bf.leash = 60;
      const bs = npc('beishan', 'beishan', ARENA.x - 11, ARENA.z - 4, { name: '狈山', title: '狈村狩猎头领', rot: PI * 0.25, team: 2 }); for (let i = 0; i < 6; i++) npc('bh' + i, 'beiHunter', ARENA.x - 14 + (i % 3) * 3, ARENA.z - 12 - Math.floor(i / 3) * 3, { seed: i + 80, name: '狈村人', rot: PI * 0.25, weapon: [i % 2 ? 'spear' : 'bow', 1, i % 2 ? 'R' : 'L', i % 2 ? HP : 0], team: 2 });
      camShot([ARENA.x + 20, terrH(ARENA.x, ARENA.z) + 5, ARENA.z + 20], [ARENA.x - 6, terrH(ARENA.x, ARENA.z) + 2, ARENA.z - 6], 2); await wait(1);
      sfx('bow'); const ar = arrowMesh(); R3.scene.add(ar); await animate(0.35, (t, dt, k) => { ar.position.set(lerp(bf.x, lh.x, k), terrH(lh.x, lh.z) + 2, lerp(bf.z, lh.z, k)); ar.rotation.y = Math.atan2(lh.x - bf.x, lh.z - bf.z); }); ar.removeFromParent(); hitSpark(lh.x, lh.y + 2, lh.z, 0xff6a5a, 10);
      await talk([['旁白', '一支一米三长的铁箭射向石林虎的咽喉，擦破了脖子——箭比箭啸声还快。'], ['旁白', '远处的山地间，一个身材高挑、黑发柔顺、皮肤白皙的少年持弓而立。很俊美，只是眼睛很冷。'], ['旁白', '石林虎与他对射十几箭，两两相撞——神箭惊荒林！'], ['狈山', '不服，就放马过来！']]);
      camShotOn(me, { ang: 0.6, d: 3.5, t: 0.8 }); me.A.face = 'angry'; await walkTo(me, ARENA.x + 8, ARENA.z + 7, 4); faceTo(me, bf.x, bf.z);
      await talk([['小不点', '你们抢我们赖以生存的食物，还要杀阿叔他们！阿福叔人那么好，那么善良，都差点被射死，你们都是大恶人！', 'angry'], ['狈风', '……找死。'], ['旁白', '狈风一弓开四箭，石林虎只拦下了三箭——第四箭直奔小不点咽喉。'], ['旁白', '小不点左手一斩，掌心符号一闪，铁箭断成两截。他跃起，扑向狈风！']]);
      me.A.face = 'open'; bf.script = false; bf.team = 1; bf.bossAI = beifengAI; bf.ai.tgt = me; bf.noLeash = true; W.checkpoint = { x: ARENA.x + 16, z: ARENA.z + 14 };
      W.zone.walls = [{ x: ARENA.x, z: ARENA.z, r: 30, out: true, msg: '狈风的箭封住了退路！' }]; cine(false); } },
    { t: 'boss', tag: 'beifeng', text: '击败狈风' },
    { t: 'script', text: '……', run: async () => { W.zone.walls = []; const me = P1(), bf = entByTag('beifeng'), lh = entByTag('linhu'), fj = entByTag('feijiao'), bs = entByTag('beishan'); cine(true); for (const p of PROJ) p.life = 0;
      chapterCard('第十六章', '服软'); camShotOn(bf, { ang: 1, d: 4.5, h: 0.6, t: 1.2 }); await wait(1);
      await talk([['旁白', '狈风吐血横飞。小不点一脚踏在他胸口，又拎起比自己高出一大截的狈风，跑回来扔在了石林虎面前。']]);
      teleport(bf, lh.x + 1.5, lh.z - 1.5); bf.A.pose = 'down'; teleport(me, lh.x + 2.5, lh.z); faceTo(me, bf.x, bf.z);
      await walkTo(lh, bf.x, bf.z + 0.4, 2); lh.A.pose = 'sit'; lh.dy = 0.25; camShot([lh.x + 4, lh.y + 2.5, lh.z + 4], [lh.x, lh.y + 1, lh.z], 1);
      await talk([['石林虎', '（一屁股坐在狈风身上，把他当成了马扎）'], ['石林虎', '小不点，你太善良了。好几次机会，你都没重创他。'], ['旁白', '狈村人投鼠忌器，不敢放箭。'], ['狈山', '……你们想怎样？'], ['石林虎', '归还猎物，退出这片山林，把你们身上所有的武器都交出来——换他一条命。'], ['旁白', '狈村人心在滴血，成摞的铁箭、龙角大弓、阔剑扔了一地。'], ['孩子们', '（不知什么时候跟来的孩子们在后面喊）我族的小不点才三岁半多一些，你十几岁了，连他都打不过，还有什么可张狂的？'], ['小不点', '……咿呀，我们回家吧。', 'happy']]);
      addItem('arrow', 20); addItem('yaosan', 3); addItem('blood', 2); lh.A.pose = null; lh.dy = 0; despawn('beishan'); for (let i = 0; i < 6; i++) despawn('bh' + i); rmEnt(bf);
      await fade(true, 1); setLight('day', true); netEv({ k: 'light', n: 'day' }); teleport(me, WILLOW.x + 4, WILLOW.z + 14, PI); const pet = P2(); if (pet) teleport(pet, WILLOW.x + 6, WILLOW.z + 15); teleport(lh, 6, -6, PI); teleport(fj, -6, -4, PI); await fade(false, 1);
      await talk([['旁白', '之后石村安宁了下来。只是山脉深处那头恐怖的狻猊，据说多半要老死了……族人们眼热它的真血和骨上的原始宝符。']]);
      cine(false); uiChapter('石村篇 · 试玩结束', '未完待续：狻猊殒落地 · 狈村祭灵 · 洗礼 · 柳神'); banner('感谢游玩试玩版！', '可以继续在苍莽山脉里自由探索：猎杀凶彪、做支线、用嗅宝找宝物。后续章节和地图会陆续开放。', 8); } },
  ] },
];
/* ---------- small AIs used by the scripts ---------- */
function kidFlee(e, dt) { if (e.caught) { e.mvSpd = 0; return; } const me = P1(); if (!me) return; const d = edist(e, me); if (d < 9) { const a = Math.atan2(e.x - me.x, e.z - me.z) + Math.sin(W.t * 2 + e.id) * 0.6; goTowards(e, e.x + Math.sin(a) * 4, e.z + Math.cos(a) * 4, 5.8, dt); if (rnd() < dt * 0.6) bubble(e, pick(['嗷……不！', '我不要被煮！', '抓不到我～', '救命啊！']), 1.2); } else { const f = e.flee; if (dist(e.x, e.z, f.x, f.z) > 2) goTowards(e, f.x, f.z, 3.5, dt); else e.mvSpd = 0; } if (Math.hypot(e.x - VIL.x, e.z - VIL.z) > 56) { const a = Math.atan2(VIL.x - e.x, VIL.z - e.z); moveEnt(e, Math.sin(a) * 4 * dt, Math.cos(a) * 4 * dt, dt); } }
function catchKid(t) { if (t.caught) return; t.caught = true; t.interact = null; bubble(t, pick(['呜呜，被抓到了……', '小不点你叛变了！', '好吧好吧……']), 2); sfx('quest'); t.npcAI = null; t.mvSpd = 0; teleport(t, BATH.x + rr(-3, 3), BATH.z + 7); faceTo(t, BATH.x, BATH.z); hudDirty(); }
function kidFollow(e, dt) { const me = P1(); if (!me) return; const i = ['dazhuang', 'ermeng', 'pihou'].indexOf(e.tag); const a = me.rot + PI + (i - 1) * 0.6, d = 3 + i * 0.6; const tx2 = me.x + Math.sin(a) * d, tz2 = me.z + Math.cos(a) * d; const dd = dist(e.x, e.z, tx2, tz2); if (dd > 40) teleport(e, tx2, tz2); else if (dd > 1.5) goTowards(e, tx2, tz2, Math.min(7.5, 2 + dd), dt); else e.mvSpd = 0; }
function adultFollow(e, dt) { const me = P1(); if (!me) return; const s = e.tag === 'linhu' ? 1 : -1; const tx2 = me.x - Math.sin(me.rot) * 3 + Math.cos(me.rot) * s * 2.5, tz2 = me.z - Math.cos(me.rot) * 3 - Math.sin(me.rot) * s * 2.5; const dd = dist(e.x, e.z, tx2, tz2); if (dd > 40) teleport(e, tx2, tz2); else if (dd > 1.5) goTowards(e, tx2, tz2, Math.min(7.5, 2 + dd), dt); else e.mvSpd = 0; }
/* 青鳞鹰 chasing the kids: periodic dive lines across the hero's path */
function eagleChaseTick(dt) {
  const eg = entByTag('eagle'), me = P1(); if (!eg || !me) return;
  if (STORY.eagleChase) { STORY.eagleT -= dt; const tx2 = me.x - Math.sin(me.rot) * 18, tz2 = me.z - Math.cos(me.rot) * 18; eg.flyH = 12; eg.x = lerp(eg.x, tx2, dt * 0.8); eg.z = lerp(eg.z, tz2, dt * 0.8); faceTo(eg, me.x, me.z);
    if (STORY.eagleT <= 0) { STORY.eagleT = rr(2.6, 3.6); const a = Math.atan2(me.x - eg.x, me.z - eg.z); const sx = me.x - Math.sin(a) * 12, sz = me.z - Math.cos(a) * 12; sfx('eagle'); tele({ shape: 'line', x: sx, z: sz, ang: a, w: 4, len: 26, d: 1.1, team: 1, src: eg, mul: 0.0001, onFire: T => { for (const p of W.P) if (p && p.alive && inTele(T, p)) { hurt(null, p, 0, { flat: Math.round(p.hpMax * 0.12), kb: 8, fx: T.x, fz: T.z }); } for (let i = 0; i < 14; i++) { const k = i / 13; dust(T.x + Math.sin(a) * k * 26, terrH(T.x + Math.sin(a) * k * 26, T.z + Math.cos(a) * k * 26), T.z + Math.cos(a) * k * 26, 3); } shake(0.2); } });
      setTimeout(() => { if (!entByTag('eagle')) return; eg.x = sx; eg.z = sz; eg.flyH = 2; const st = W.t; const f = () => { const k = (W.t - st) / 0.5; eg.x = sx + Math.sin(a) * 26 * k; eg.z = sz + Math.cos(a) * 26 * k; eg.flyH = 2 + k * 10; if (k < 1) requestAnimationFrame(f); }; f(); }, 1050); } }
  else if (STORY.eyeHits != null && STORY.eyeHits < 3 && curQ() && curQ().id === 'q6' && STORY.si === 3) { STORY.eagleAtkT -= dt; eg.flyH = 4 + Math.sin(W.t * 1.5) * 0.6; eg.x = CAVE.x - 12 + Math.sin(W.t * 0.7) * 2; eg.z = CAVE.z + Math.cos(W.t * 0.5) * 3; faceTo(eg, me.x, me.z);
    if (STORY.eagleAtkT <= 0) { STORY.eagleAtkT = rr(3, 4.5); sfx('eagle'); if (rnd() < 0.6) tele({ shape: 'cone', x: CAVE.x - 7, z: CAVE.z, ang: HP, r: 9, arc: 1.0, d: 1.2, team: 1, src: eg, mul: 0.0001, onFire: T => { act(eg.A, 'claw', 0.5); for (const p of W.P) if (p && p.alive && inTele(T, p)) hurt(null, p, 0, { flat: Math.round(p.hpMax * 0.15), kb: 6, fx: T.x, fz: T.z }); hitSpark(CAVE.x - 3, terrH(CAVE.x, CAVE.z) + 2, CAVE.z, 0xd8d0c0, 20); shake(0.25); } });
      else tele({ shape: 'circle', x: me.x, z: me.z, r: 2.5, d: 1.3, team: 1, src: eg, mul: 0.0001, onFire: T => { for (const p of W.P) if (p && p.alive && inTele(T, p)) hurt(null, p, 0, { flat: Math.round(p.hpMax * 0.1), kb: 4, fx: T.x, fz: T.z }); dust(T.x, terrH(T.x, T.z), T.z, 12); } }); } }
}
function throwSpear(e) {
  const eg = entByTag('eagle'); if (!eg) return; e.carry = null; if (e.spearM) { e.spearM.removeFromParent(); e.spearM = null; }
  faceTo(e, eg.x, eg.z); act(e.A, 'throw', 0.5); const sp = weaponMesh('spear', 1); const sx = e.x, sy = e.y + 1.2, sz = e.z, tx2 = eg.x, ty = eg.y + eg.h * 0.7 + 3.5, tz2 = eg.z, L = Math.hypot(tx2 - sx, ty - sy, tz2 - sz);
  setTimeout(() => shoot({ owner: null, team: 0, x: sx, y: sy, z: sz, vx: (tx2 - sx) / L * 32, vy: (ty - sy) / L * 32, vz: (tz2 - sz) / L * 32, r: 1.6, mesh: sp, pitch: true, life: 1.2, noGround: true, onHit: () => { }, onEnd: p => { if (Math.hypot(p.x - eg.x, p.z - eg.z) < 4) { STORY.eyeHits++; hitSpark(eg.x, eg.y + eg.h * 0.7 + 3, eg.z, 0xff4a3a, 30); sfx('eagle'); shake(0.3); act(eg.A, 'hit', 0.6); floatText(eg, ['打掉了一枚眼角的鳞片！', '见血了！鹰发狂了！', '正中眼眶！'][Math.min(2, STORY.eyeHits - 1)], '#ffd24a', 1.1); hudDirty(); } } }), 250);
  sfx('whoosh');
}
/* ---------- 狈风: three phases (bow → blood-iron spear → hidden crossbow & leaping stomp) ---------- */
function beifengAI(e, dt) {
  const ai = e.ai; const t = pickTarget(e) || W.P[0]; if (!t) return; ai.tgt = t; ai.cd -= dt; ai.lock -= dt; e.mvSpd = 0; e.inCombat = W.t;
  const k = e.hp / e.hpMax, ph = k > 0.68 ? 1 : k > 0.36 ? 2 : 3;
  if (ph !== e.phase) { e.phase = ph; if (ph === 2) { bubble(e, '你再快，还能快过我的矛？', 2.5); if (e.weapon) e.weapon.removeFromParent(); e.weapon = attach(e.R, 'R', weaponMesh('redspear', 1), 0, -0.05, 0, HP, 0, 0); e.weaponRef = ['redspear', 1, 'R', HP]; say('狈风换上了血纹铁铸成的暗红长矛！', '#ffb0a0'); } if (ph === 3) { bubble(e, '小崽子，我送你上路！', 2.5); say('狈风背后的弩匣弹开了！', '#ffb0a0'); e.spd = 6.2; } }
  if (ai.lock > 0) return;
  const d = edist(e, t), a = Math.atan2(t.x - e.x, t.z - e.z);
  if (ph === 1) {
    if (d < 7) { const ba = a + PI + Math.sin(W.t) * 0.7; goTowards(e, e.x + Math.sin(ba) * 3, e.z + Math.cos(ba) * 3, e.spd * 1.1, dt); if (ai.cd > 0) return; }
    else if (d > 17) { goTowards(e, t.x, t.z, e.spd, dt); return; }
    else { const sa = a + HP; moveEnt(e, Math.sin(sa) * Math.sin(W.t * 0.8) * 2.5 * dt, Math.cos(sa) * Math.sin(W.t * 0.8) * 2.5 * dt, dt); e.mvSpd = 2.5; faceTo(e, t.x, t.z); }
    if (ai.cd > 0) return; faceTo(e, t.x, t.z); const r = rnd();
    if (r < 0.4) { act(e.A, 'shoot', 0.8); ai.lock = 1.0; ai.cd = 1.2; setTimeout(() => { if (!e.alive) return; for (let i = -1.5; i <= 1.5; i++) fireArrow(e, t, 0.75, { ang: i * 0.13, sp: 28 }); }, 600); bubble(e, '一弓四箭！', 1); }
    else if (r < 0.7) { ai.lock = 2.2; ai.cd = 1.6; for (let i = 0; i < 8; i++) setTimeout(() => { if (!e.alive || !t.alive) return; faceTo(e, t.x, t.z); act(e.A, 'shoot', 0.22); fireArrow(e, t, 0.45, { sp: 34 }); }, 300 + i * 220); }
    else { const T = tele({ shape: 'line', x: e.x, z: e.z, ang: a, w: 1.6, len: 30, d: 1.2, team: 1, src: e, mul: 2.2, kb: 6 }); act(e.A, 'shoot', 1.3); ai.lock = 1.5; ai.cd = 1.5; setTimeout(() => { if (e.alive) { sfx('bow'); hitSpark(e.x + Math.sin(a) * 2, e.y + 1.4, e.z + Math.cos(a) * 2, 0xffffff, 10); } }, 1150); }
    return;
  }
  // phases 2/3: close in with the spear
  if (d > 3.2) { goTowards(e, t.x, t.z, e.spd * (ph === 3 ? 1.15 : 1), dt); if (ph === 3 && ai.cd <= 0 && d > 7 && rnd() < dt * 2) { stompLeap(e, t); } return; }
  if (ai.cd > 0) { faceTo(e, t.x, t.z, dt * 8); return; }
  faceTo(e, t.x, t.z); const r = rnd();
  if (ph === 3 && r < 0.3) { // 背后弩箭 fan
    tele({ shape: 'cone', x: e.x, z: e.z, ang: a, r: 12, arc: 1.3, d: 0.9, team: 1, src: e, mul: 1.4, kb: 3 }); act(e.A, 'hit', 0.4); ai.lock = 1.3; ai.cd = 1.6; bubble(e, '……', 0.8);
    setTimeout(() => { if (!e.alive) return; for (let i = -3; i <= 3; i++) { const aa = a + i * 0.18; shoot({ owner: e, x: e.x, y: e.y + 1.3, z: e.z, vx: Math.sin(aa) * 30, vy: 0, vz: Math.cos(aa) * 30, r: 0.3, mesh: arrowMesh(), vis: 'arrow', pitch: true, mul: 0.01, life: 0.5, noGround: true }); } sfx('bow'); }, 900);
  } else if (ph === 3 && r < 0.5) stompLeap(e, t);
  else if (r < 0.75) { // 三连刺
    ai.lock = 1.6; ai.cd = 1.4; for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.alive) return; faceTo(e, t.x, t.z); const aa = e.rot; tele({ shape: 'line', x: e.x, z: e.z, ang: aa, w: 1.4, len: 4.2, d: 0.35, team: 1, src: e, mul: 0.95, kb: 2.5 }); setTimeout(() => e.alive && act(e.A, 'stab', 0.3), 250); }, i * 480);
  } else { // 横扫鞭腿
    tele({ shape: 'circle', x: e.x, z: e.z, r: 3.4, d: 0.75, team: 1, src: e, mul: 1.3, kb: 7, up: 3 }); setTimeout(() => e.alive && act(e.A, 'kick', 0.4), 550); ai.lock = 1.2; ai.cd = 1.3; }
}
function stompLeap(e, t) { const ai = e.ai; const T = tele({ shape: 'circle', x: t.x, z: t.z, r: 3.6, d: 1.15, team: 1, src: e, mul: 1.9, kb: 8, up: 5, onFire: T2 => { dust(T2.x, terrH(T2.x, T2.z), T2.z, 22); ringFX(T2.x, terrH(T2.x, T2.z), T2.z, 0xd8b080, 1, 4.5, 0.45); shake(0.3); sfx('boom'); } }); act(e.A, 'lift', 0.5); bubble(e, '下去！', 1); ai.lock = 1.8; ai.cd = 2; setTimeout(() => { if (e.alive) e.dash = { x0: e.x, z0: e.z, x1: T.x, z1: T.z, t: 0, d: 0.6, arc: 6.5 }; }, 500); }
ZONES.shicun.tick0 = null;
const _zt = ZONES.shicun;
const _oldPop = _zt.populate;
_zt.populate = function () { _oldPop(); const base = _zt.tick; _zt.tick = dt => { base && base(dt); eagleChaseTick(dt); }; };
STORY.restore = qi => { // re-create persistent state when continuing a save
  const at = QUESTS[qi] ? QUESTS[qi].id : 'end'; const idx = id => QUESTS.findIndex(q => q.id === id);
  if (qi > idx('q1')) PARTY.flags.hatched = 1; else hidePet(true);
  if (qi > idx('q7') || at === 'end') { const ex = WILLOW.x + 3, ez = WILLOW.z + 9; for (const [t, s, n, x] of [['dapeng', 'dapeng', '大鹏', -1.2], ['xiaoqing', 'xiaoqing', '小青', 0], ['ziyun', 'ziyun', '紫云', 1.2]]) { const b = npc(t, s, ex + x, ez, { name: n, title: '青鳞幼鹰' }); b.wanderR = 3; b.spd = 2; b.bark = ['啾啾！', '（用头蹭你的小手臂）']; } }
  if (qi > idx('q8')) { const ss = npc('shoushan', 'villager', WILLOW.x + 6, WILLOW.z + 4, { seed: 71, kind: 'man', name: '石守山', title: '皮猴的爹', pose: qi > idx('q9') ? null : 'lie' }); ss.bark = ['阿叔这条命硬着呢。']; }
  if (!PARTY.flags.hatched) hidePet(true);
};
