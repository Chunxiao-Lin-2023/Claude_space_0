/* 猜猜我是谁 — classic face-guessing deduction with 24 procedurally drawn tea-house regulars. */
const D = BX.draw, C = BX.C;
const HAIRC = {黑: '#1f1a17', 棕: '#6b3e1e', 金: '#d9a63a', 红: '#b5421f', 白: '#e8e4dc'};
const CLOTH = {红: '#b23a2b', 蓝: '#2f5d8a', 绿: '#3f7f6b', 黄: '#d9a12b'};
const SKIN = ['#f3d2b0', '#e8b98f', '#c98f63'];
/* hand-tuned cast: [name, 男?, 发色, 发型(短/长/光), 帽, 镜, 须, 耳环, 腮红, 衣, 笑, 肤色] */
const CAST = [
  ['阿福', 1, '黑', '短', 1, 0, 0, 0, 0, '蓝', 1, 0], ['小翠', 0, '黑', '长', 0, 0, 0, 1, 1, '红', 1, 0],
  ['老周', 1, '白', '光', 0, 1, 1, 0, 0, '黄', 0, 1], ['春桃', 0, '红', '长', 0, 1, 0, 0, 1, '绿', 0, 0],
  ['大牛', 1, '棕', '短', 0, 0, 1, 0, 1, '红', 1, 2], ['秋月', 0, '金', '短', 1, 0, 0, 1, 0, '蓝', 0, 1],
  ['掌柜', 1, '黑', '短', 1, 1, 1, 0, 0, '绿', 0, 0], ['婉儿', 0, '棕', '长', 1, 0, 0, 0, 1, '黄', 1, 1],
  ['石头', 1, '红', '短', 0, 0, 0, 1, 0, '绿', 1, 1], ['玉兰', 0, '白', '长', 0, 1, 0, 1, 0, '蓝', 1, 2],
  ['铁柱', 1, '棕', '光', 1, 0, 0, 0, 0, '蓝', 0, 2], ['小梅', 0, '黑', '短', 0, 0, 0, 0, 1, '黄', 0, 2],
  ['长庚', 1, '金', '长', 0, 1, 0, 0, 0, '红', 0, 0], ['杏儿', 0, '金', '长', 0, 0, 0, 1, 1, '绿', 1, 0],
  ['老马', 1, '白', '短', 1, 0, 1, 1, 0, '红', 1, 1], ['青黛', 0, '黑', '长', 1, 1, 0, 0, 0, '红', 0, 1],
  ['文远', 1, '黑', '长', 0, 1, 1, 0, 0, '蓝', 1, 2], ['阿秀', 0, '棕', '短', 0, 1, 0, 1, 0, '红', 1, 2],
  ['胖墩', 1, '棕', '短', 0, 0, 0, 0, 1, '黄', 1, 0], ['红绡', 0, '红', '短', 1, 0, 0, 0, 0, '黄', 1, 2],
  ['子墨', 1, '金', '短', 0, 0, 1, 1, 0, '绿', 0, 2], ['素素', 0, '白', '短', 0, 0, 0, 0, 1, '绿', 0, 1],
  ['阿虎', 1, '红', '光', 0, 0, 1, 0, 1, '蓝', 0, 0], ['莲心', 0, '棕', '长', 1, 0, 0, 1, 0, '蓝', 0, 0],
].map(([name, male, hc, hs, hat, gl, beard, ear, blush, cloth, smile, skin], i) => ({i, name, male, hc, hs, hat, gl, beard, ear, blush, cloth, smile, skin}));
const QS = [
  ['male', '是男性吗？', c => c.male], ['female', '是女性吗？', c => !c.male],
  ['h黑', '是黑头发吗？', c => c.hc === '黑' && c.hs !== '光'], ['h棕', '是棕头发吗？', c => c.hc === '棕' && c.hs !== '光'], ['h金', '是金头发吗？', c => c.hc === '金' && c.hs !== '光'],
  ['h红', '是红头发吗？', c => c.hc === '红' && c.hs !== '光'], ['h白', '是白头发吗？', c => c.hc === '白' && c.hs !== '光'],
  ['long', '是长头发吗？', c => c.hs === '长'], ['short', '是短头发吗？', c => c.hs === '短'], ['bald', '是光头吗？', c => c.hs === '光'],
  ['hat', '戴帽子吗？', c => c.hat], ['gl', '戴眼镜吗？', c => c.gl], ['beard', '有胡子吗？', c => c.beard], ['ear', '戴耳环吗？', c => c.ear],
  ['blush', '脸上有腮红吗？', c => c.blush], ['smile', '在笑吗？', c => c.smile],
  ['c红', '穿红衣服吗？', c => c.cloth === '红'], ['c蓝', '穿蓝衣服吗？', c => c.cloth === '蓝'], ['c绿', '穿绿衣服吗？', c => c.cloth === '绿'], ['c黄', '穿黄衣服吗？', c => c.cloth === '黄'],
];
const QMAP = Object.fromEntries(QS.map(q => [q[0], q]));
const QGROUPS = [['性别', ['male', 'female']], ['头发', ['h黑', 'h棕', 'h金', 'h红', 'h白', 'long', 'short', 'bald']], ['装扮', ['hat', 'gl', 'beard', 'ear', 'blush', 'smile']], ['衣服', ['c红', 'c蓝', 'c绿', 'c黄']]];
const QSHORT = {male: '男性', female: '女性', h黑: '黑发', h棕: '棕发', h金: '金发', h红: '红发', h白: '白发', long: '长发', short: '短发', bald: '光头', hat: '帽子', gl: '眼镜', beard: '胡子', ear: '耳环', blush: '腮红', smile: '笑', c红: '红衣', c蓝: '蓝衣', c绿: '绿衣', c黄: '黄衣'};

/* draw portrait of character c into box (x,y,w,h) */
function portrait(g, c, x, y, w, h) {
  g.save(); D.rr(g, x, y, w, h, w * .08); g.clip();
  const bg = ['#e8dcc0', '#dfe6dc', '#e9dbd0', '#dde2ea'][c.i % 4];
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  const cx = x + w / 2, s = w / 100, top = y + h * .5 - 58 * s;
  g.translate(cx, top); g.scale(s, s);
  const hc = HAIRC[c.hc], skin = SKIN[c.skin], cl = CLOTH[c.cloth];
  // back hair (long)
  if (c.hs === '长') { g.fillStyle = hc; g.beginPath(); g.moveTo(-30, 30); g.quadraticCurveTo(-36, 80, -26, 100); g.lineTo(26, 100); g.quadraticCurveTo(36, 80, 30, 30); g.closePath(); g.fill(); }
  // body
  g.fillStyle = cl; g.beginPath(); g.moveTo(-46, 125); g.quadraticCurveTo(-44, 88, -16, 82); g.lineTo(16, 82); g.quadraticCurveTo(44, 88, 46, 125); g.closePath(); g.fill();
  g.strokeStyle = D.shade(cl, -30); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, 84); g.lineTo(4, 104); g.lineTo(8, 125); g.stroke();   // 交领
  g.fillStyle = D.shade(cl, 35); g.beginPath(); g.moveTo(-14, 82); g.lineTo(0, 98); g.lineTo(14, 82); g.closePath(); g.fill();
  g.fillStyle = D.shade(skin, -8); g.fillRect(-8, 68, 16, 16);   // neck
  // ears + earrings
  g.fillStyle = skin; for (const sx of [-1, 1]) { D.circle(g, sx * 27, 46, 6); g.fill(); }
  if (c.ear) for (const sx of [-1, 1]) { g.fillStyle = '#e6b84a'; D.circle(g, sx * 27, 56, 3.6); g.fill(); g.strokeStyle = '#a07820'; g.lineWidth = 1; g.stroke(); }
  // head
  const gr = g.createRadialGradient(-6, 36, 4, 0, 44, 32); gr.addColorStop(0, D.shade(skin, 10)); gr.addColorStop(1, D.shade(skin, -6));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 44, 25, 29, 0, 0, Math.PI * 2); g.fill();
  if (c.blush) { g.fillStyle = 'rgba(230,90,90,.38)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 14, 55, 6, 3.6, 0, 0, Math.PI * 2); g.fill(); } }
  // eyes & brows
  g.fillStyle = '#1f1a17'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 10, 44, 2.6, 3.2, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = c.hs === '光' ? '#3a2a1a' : D.shade(hc, c.hc === '白' ? -30 : -10); g.lineWidth = 2.6; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 5, 37 - (c.male ? 0 : 1)); g.lineTo(sx * 15, 36 + (c.male ? 1 : -1)); g.stroke(); }
  // nose & mouth
  g.strokeStyle = D.shade(skin, -25); g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, 46); g.lineTo(-2, 53); g.lineTo(1, 54); g.stroke();
  if (c.smile) { g.fillStyle = '#9a3226'; g.beginPath(); g.moveTo(-8, 60); g.quadraticCurveTo(0, 69, 8, 60); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(-5, 60, 10, 2.5); }
  else { g.strokeStyle = '#8a3a2a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-6, 62); g.quadraticCurveTo(0, 63.5, 6, 62); g.stroke(); }
  if (!c.male) { g.fillStyle = 'rgba(200,50,50,.35)'; g.beginPath(); g.ellipse(0, 62, 5, 1.6, 0, 0, Math.PI * 2); g.fill(); }
  // beard
  if (c.beard) {
    g.fillStyle = c.hc === '白' ? '#ddd8cc' : c.hs === '光' ? '#3a2a1a' : hc;
    if (c.i % 2) { g.beginPath(); g.moveTo(-18, 58); g.quadraticCurveTo(-16, 82, 0, 84); g.quadraticCurveTo(16, 82, 18, 58); g.quadraticCurveTo(10, 70, 0, 70); g.quadraticCurveTo(-10, 70, -18, 58); g.fill(); }
    else { g.beginPath(); g.moveTo(-13, 59); g.quadraticCurveTo(-6, 54, 0, 57); g.quadraticCurveTo(6, 54, 13, 59); g.quadraticCurveTo(6, 58, 0, 60); g.quadraticCurveTo(-6, 58, -13, 59); g.fill(); g.beginPath(); g.moveTo(-3, 70); g.lineTo(0, 80); g.lineTo(3, 70); g.fill(); }
    if (c.smile && c.i % 2) { g.fillStyle = '#9a3226'; g.beginPath(); g.moveTo(-6, 62); g.quadraticCurveTo(0, 68, 6, 62); g.closePath(); g.fill(); }
  }
  // glasses
  if (c.gl) { g.strokeStyle = '#2b2118'; g.lineWidth = 2; for (const sx of [-1, 1]) { D.circle(g, sx * 10, 44, 7); g.stroke(); } g.beginPath(); g.moveTo(-3, 44); g.lineTo(3, 44); g.moveTo(-17, 43); g.lineTo(-24, 41); g.moveTo(17, 43); g.lineTo(24, 41); g.stroke(); g.fillStyle = 'rgba(200,230,255,.18)'; for (const sx of [-1, 1]) { D.circle(g, sx * 10, 44, 6.5); g.fill(); } }
  // front hair
  g.fillStyle = hc;
  if (c.hs === '短') {
    g.beginPath(); g.moveTo(-26, 42); g.quadraticCurveTo(-30, 10, 0, 12); g.quadraticCurveTo(30, 10, 26, 42);
    if (c.male) { g.quadraticCurveTo(22, 26, 8, 26); g.quadraticCurveTo(-4, 30, -18, 26); g.quadraticCurveTo(-24, 30, -26, 42); }
    else { g.quadraticCurveTo(14, 22, 0, 30); g.quadraticCurveTo(-14, 22, -26, 42); }
    g.fill();
    if (!c.male) { g.beginPath(); g.ellipse(0, 9, 10, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c23a2b'; g.fillRect(-2, 2, 4, 14); }   // 发髻
  } else if (c.hs === '长') {
    g.beginPath(); g.moveTo(-28, 50); g.quadraticCurveTo(-32, 10, 0, 12); g.quadraticCurveTo(32, 10, 28, 50); g.quadraticCurveTo(22, 24, 0, 24); g.quadraticCurveTo(-22, 24, -28, 50); g.fill();
    if (c.male) { g.beginPath(); g.ellipse(0, 10, 9, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c8a052'; g.fillRect(-12, 9, 24, 3); }
  } else { g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-8, 22, 8, 4, -.3, 0, Math.PI * 2); g.fill(); }
  // hat
  if (c.hat) {
    if (c.male) { // 瓜皮帽
      g.fillStyle = '#2b2118'; g.beginPath(); g.moveTo(-27, 26); g.quadraticCurveTo(-26, 2, 0, 2); g.quadraticCurveTo(26, 2, 27, 26); g.closePath(); g.fill();
      g.fillStyle = '#b23a2b'; D.circle(g, 0, 1, 4.5); g.fill(); g.strokeStyle = '#c8a052'; g.lineWidth = 2; g.beginPath(); g.moveTo(-27, 24); g.lineTo(27, 24); g.stroke();
    } else { // 花冠/布巾
      g.fillStyle = '#7a4a9a'; g.beginPath(); g.moveTo(-29, 30); g.quadraticCurveTo(-30, 4, 0, 4); g.quadraticCurveTo(30, 4, 29, 30); g.quadraticCurveTo(0, 20, -29, 30); g.fill();
      g.fillStyle = '#f2a6b6'; for (const fx of [-12, 0, 12]) { D.circle(g, fx, 10, 4); g.fill(); }
    }
  }
  g.restore();
}

BX.register({
  id: 'guesswho', title: '猜猜我是谁', cat: 'deduce', order: 1, sub: '问是或否，揪出神秘茶客',
  desc: '双方各自抽到一位神秘茶客。轮流提一个“是或否”的问题，翻下不符合的面孔，最先猜中对方角色的人获胜——可猜错就直接输了！',
  kind: 'turn', seats: 2, hidden: true, seatNames: ['甲方', '乙方'], firstLabel: '先问',
  rules: `<p>桌上有 <b>24 位茶客</b>，每位都有不同的外貌：性别、发色、发型长短、帽子、眼镜、胡子、耳环、腮红、笑容和衣服颜色。</p>
<p>开局时双方各自<b>秘密抽到一位茶客</b>，对手要猜的就是他。</p>
<p>轮到你时，可以：</p>
<ul><li><b>提问：</b>从问题菜单中选一个“是/否”问题（例如“戴眼镜吗？”），系统会如实回答关于<b>对手角色</b>的答案。然后把不符合的面孔翻下（默认自动翻牌，也可以关掉自己点着翻），点“结束回合”。</li>
<li><b>猜人：</b>直接指认对手的角色。猜对立即获胜，<b>猜错立即判负</b>。</li></ul>
<p>注意：问发色时，光头的茶客算作“没有这种颜色的头发”。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 8, base: '#8a5a30'});
    const cw = w * .2, ch = cw * 1.25;
    [[3, .06, .12, 0], [10, .29, .1, 0], [19, .52, .12, 1], [5, .75, .1, 0], [14, .17, .54, 1], [0, .4, .52, 0], [22, .63, .54, 0]].forEach(([k, px, py, down]) => {
      const x = px * w, y = py * h;
      if (down) { g.fillStyle = '#7a2318'; D.rr(g, x, y + ch * .45, cw, ch * .55, 4); g.fill(); D.text(g, '?', x + cw / 2, y + ch * .73, {size: cw * .4, color: '#e6c57d', font: 'deco', weight: 400}); }
      else { g.fillStyle = '#c23a2b'; D.rr(g, x - 2, y - 2, cw + 4, ch + 4, 5); g.fill(); portrait(g, CAST[k], x, y, cw, ch); }
    });
    g.fillStyle = 'rgba(30,18,8,.75)'; D.rr(g, w * .62, h * .02, w * .36, h * .2, 8); g.fill();
    D.text(g, '是谁？', w * .8, h * .12, {size: h * .12, color: '#f3e2c0', font: 'deco', weight: 400});
  },
  create(ctx) {
    const st = {secret: [ctx.rng.int(24), ctx.rng.int(24)], down: [new Array(24).fill(0), new Array(24).fill(0)], turn: 0, ph: 'ask', qa: [], over: false, res: null, guess: null};
    const cv = ctx.canvas();
    const me = () => ctx.view;
    let auto = ctx.load('auto', true), guessMode = false, pick = -1, panel = null, flipT = new Array(24).fill(0).map(() => [0, 0]);
    let fresh = 0;

    /* ---------- DOM controls ---------- */
    const ui = ctx.ui();
    const bar = document.createElement('div'); bar.className = 'bx-bar'; ui.append(bar);
    const mk = (cls, txt, fn) => { const b = document.createElement('button'); b.className = 'bx-btn ' + cls; b.textContent = txt; b.onclick = fn; return b; };
    const bAsk = mk('red', '提问', () => openPanel());
    const bGuess = mk('', '猜人', () => { guessMode = !guessMode; pick = -1; refresh(); });
    const bEnd = mk('jade', '结束回合', () => { if (ctx.canAct(st.turn) && st.ph === 'flip') ctx.act({end: 1}, st.turn); });
    const bAuto = mk('ghost', '', () => { auto = !auto; ctx.save('auto', auto); refresh(); });
    bar.append(bAsk, bGuess, bEnd, bAuto);
    function openPanel() {
      if (!ctx.canAct(st.turn) || st.ph !== 'ask') return;
      closePanel(); guessMode = false;
      const asked = new Set(st.qa.filter(x => x.by === st.turn).map(x => x.q));
      panel = document.createElement('div'); panel.className = 'bx-panel';
      panel.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,94%);max-height:92%;overflow:auto;padding:12px 14px';
      const ttl = document.createElement('div'); ttl.style.cssText = 'font-family:var(--deco);font-size:20px;letter-spacing:2px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center';
      ttl.innerHTML = '<span>问一个问题</span>'; const x = mk('ghost', '✕', closePanel); x.style.cssText = 'min-height:40px;padding:6px 12px'; ttl.append(x); panel.append(ttl);
      for (const [gname, keys] of QGROUPS) {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0';
        const lb = document.createElement('span'); lb.textContent = gname; lb.style.cssText = 'width:36px;font-size:13px;opacity:.7'; row.append(lb);
        for (const k of keys) {
          const b = mk('ghost', QMAP[k][1].replace('吗？', '？'), () => { closePanel(); if (ctx.canAct(st.turn) && st.ph === 'ask') ctx.act({q: k, auto}, st.turn); });
          b.style.cssText = 'min-height:40px;padding:6px 10px;font-size:14px;font-weight:600' + (asked.has(k) ? ';opacity:.45' : '');
          row.append(b);
        }
        panel.append(row);
      }
      ui.append(panel);
    }
    function closePanel() { if (panel) { panel.remove(); panel = null; } }
    function refresh() {
      const my = ctx.canAct(st.turn) && !st.over;
      bar.style.display = !st.over && ctx.isLocal(st.turn) && !BX.bot ? '' : 'none';
      bAsk.disabled = !(my && st.ph === 'ask');
      bEnd.style.display = st.ph === 'flip' ? '' : 'none'; bEnd.disabled = !my;
      bAsk.style.display = st.ph === 'ask' ? '' : 'none';
      bGuess.disabled = !my; bGuess.textContent = guessMode ? '取消猜人' : '猜人'; bGuess.className = 'bx-btn ' + (guessMode ? 'red' : '');
      bAuto.textContent = '自动翻牌：' + (auto ? '开' : '关');
      status();
    }

    /* ---------- layout ---------- */
    function L() {
      const W = cv.w, H = cv.h - 70, portraitMode = H > W * 1.05;
      const cols = portraitMode ? 4 : 8, rows = portraitMode ? 6 : 3, asp = 1.28, gap = .07;
      const side = portraitMode ? {w: W, h: Math.min(120, H * .17)} : {w: Math.min(240, W * .26), h: H};
      const ax = portraitMode ? 0 : side.w, ay = portraitMode ? side.h : 0, aw = W - ax, ah = H - ay;
      const f = BX.fit(aw, ah, cols + (cols - 1) * gap, rows * asp + (rows - 1) * gap * asp, 8);
      return {portraitMode, cols, rows, cw: f.s, ch: f.s * asp, gx: f.s * gap, gy: f.s * gap * asp, ox: ax + f.x, oy: ay + f.y, side, W, H};
    }
    const rect = (i, l) => ({x: l.ox + (i % l.cols) * (l.cw + l.gx), y: l.oy + Math.floor(i / l.cols) * (l.ch + l.gy), w: l.cw, h: l.ch});
    const faceAt = p => { const l = L(); for (let i = 0; i < 24; i++) { const r = rect(i, l); if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i; } return -1; };
    ctx.on(cv.cv, 'pointerdown', e => {
      closePanel();
      if (!ctx.canAct(st.turn)) return;
      const i = faceAt(cv.pos(e)); if (i < 0) return;
      if (guessMode) {
        if (pick !== i) { pick = i; ctx.sfx('tick'); return; }
        guessMode = false; pick = -1; ctx.act({guess: i}, st.turn); return;
      }
      ctx.act({flip: i}, st.turn);
    });

    const remaining = s => st.down[s].filter(v => !v).length;
    function status() {
      ctx.info(0, '剩 ' + remaining(0)); ctx.info(1, '剩 ' + remaining(1));
      if (st.over) return ctx.status(st.res);
      const my = ctx.isLocal(st.turn) && (ctx.hotseat || st.turn === ctx.me);
      const who = ctx.hotseat ? ctx.name(st.turn) : '你';
      if (!my) return ctx.status('等待 ' + ctx.name(st.turn) + (st.ph === 'ask' ? ' 提问…' : ' 翻牌…'));
      if (guessMode) return ctx.status('点一位茶客（再点一次确认）猜对手的角色');
      ctx.status(st.ph === 'ask' ? who + '提问，或直接猜人' : '翻下不符合的面孔，然后结束回合');
    }
    const lastAns = s => { for (let k = st.qa.length - 1; k >= 0; k--) if (st.qa[k].by === s) return st.qa[k]; return null; };

    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => by === st.turn && (a.q ? st.ph === 'ask' && !!QMAP[a.q] : a.flip != null ? Number.isInteger(a.flip) && a.flip >= 0 && a.flip < 24 : a.guess != null ? Number.isInteger(a.guess) && a.guess >= 0 && a.guess < 24 : a.end ? st.ph === 'flip' : false),
      apply(a, by) {
        const s = st.turn, o = 1 - s;
        if (a.q) {
          const ans = !!QMAP[a.q][2](CAST[st.secret[o]]);
          st.qa.push({by: s, q: a.q, ans}); st.ph = 'flip'; fresh = 1;
          ctx.sfx(ans ? 'bell' : 'buzz');
          if (a.auto) {
            let n = 0;
            for (let i = 0; i < 24; i++) if (!st.down[s][i] && !!QMAP[a.q][2](CAST[i]) !== ans) { st.down[s][i] = 1; n++; if (!ctx.fast && s === me()) { const k = n; ctx.after(250 + k * 45, () => ctx.sfx('flip')); } }
          }
        } else if (a.flip != null) { st.down[s][a.flip] ^= 1; ctx.sfx('flip'); }
        else if (a.end) { st.ph = 'ask'; st.turn = o; }
        else if (a.guess != null) {
          const ok = a.guess === st.secret[o];
          st.guess = {by: s, i: a.guess, ok}; st.over = true;
          st.res = ok ? ctx.name(s) + ' 猜中了：' + CAST[a.guess].name : ctx.name(s) + ' 猜错了！对方是 ' + CAST[st.secret[o]].name;
          ctx.sfx(ok ? 'gong' : 'crash');
          refresh(); closePanel();
          ctx.end({winner: ok ? s : o, html: `${BX.esc(ctx.name(s))} 指认「${CAST[a.guess].name}」——${ok ? '<b style="color:#b23a2b">猜对了！</b>' : '<b>猜错了！</b>'}<br>${BX.esc(ctx.name(0))} 的角色：${CAST[st.secret[0]].name}　${BX.esc(ctx.name(1))} 的角色：${CAST[st.secret[1]].name}`, delay: 1400});
          return;
        }
        void by; refresh();
      },
      aiMove(seat, level) {
        const o = 1 - seat;
        // candidates consistent with my own Q&A (public to me) — never peeks at the secret
        let cand = CAST.filter(c => st.qa.every(x => x.by !== seat || !!QMAP[x.q][2](c) === x.ans)).map(c => c.i);
        if (st.ph === 'flip') return {end: 1};
        const oppCand = CAST.filter(c => st.qa.every(x => x.by !== o || !!QMAP[x.q][2](c) === x.ans)).length;
        if (cand.length === 1) return {guess: cand[0]};
        if (cand.length === 2 && (level === 1 ? Math.random() < .5 : level >= 2 && oppCand <= 1)) return {guess: cand[(Math.random() * 2) | 0]};
        if (level >= 3 && cand.length <= 3 && oppCand <= 1) return {guess: cand[(Math.random() * cand.length) | 0]};
        const asked = new Set(st.qa.filter(x => x.by === seat).map(x => x.q));
        const scored = QS.filter(q => !asked.has(q[0])).map(q => { const y = cand.filter(i => q[2](CAST[i])).length; return [q[0], -Math.max(y, cand.length - y) + Math.random() * .01, y > 0 && y < cand.length]; });
        const useful = scored.filter(x => x[2]);
        if (!useful.length) return {guess: cand[(Math.random() * cand.length) | 0]};
        let q;
        if (level === 1) q = Math.random() < .6 ? useful[(Math.random() * useful.length) | 0][0] : BX.ai.byLevel(useful.map(x => [x[0], x[1]]), 1);
        else if (level === 2) q = BX.ai.byLevel(useful.map(x => [x[0], x[1]]), 2);
        else q = BX.ai.byLevel(useful.map(x => [x[0], x[1]]), 3);
        return {q, auto: true};
      },
      onTurn: refresh,
      onView() { guessMode = false; pick = -1; closePanel(); refresh(); },
      frame(dt) {
        const g = cv.g; cv.clear(); const l = L(), v = me();
        D.wood(g, 0, 0, cv.w, cv.h, {seed: 31, base: '#6e4428', dark: '#2e1a0c', grain: .2});
        // board frame
        const r0 = rect(0, l), r1 = rect(23, l);
        g.fillStyle = 'rgba(178,58,43,.92)'; D.rr(g, r0.x - 8, r0.y - 8, r1.x + r1.w - r0.x + 16, r1.y + r1.h - r0.y + 16, 12); g.fill();
        g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.stroke();
        const sp = BX.test ? 50 : 6;
        for (let i = 0; i < 24; i++) {
          const r = rect(i, l), c = CAST[i];
          const tgt = st.down[v][i] ? 1 : 0; flipT[i][v] += BX.clamp(tgt - flipT[i][v], -dt * sp, dt * sp);
          const t = flipT[i][v];
          // slot
          g.fillStyle = 'rgba(60,15,8,.6)'; D.rr(g, r.x, r.y, r.w, r.h, r.w * .08); g.fill();
          // tile pivots down from top edge
          const sy = Math.cos(t * Math.PI);
          g.save(); g.translate(r.x, r.y + r.h); g.scale(1, Math.max(.02, Math.abs(sy)) * (sy >= 0 ? 1 : -1)); g.translate(-r.x, -(r.y + r.h));
          if (t < .5) {
            g.fillStyle = '#fffaf0'; D.rr(g, r.x, r.y, r.w, r.h, r.w * .08); g.fill();
            portrait(g, c, r.x + r.w * .05, r.y + r.w * .05, r.w * .9, r.h - r.w * .1 - r.h * .16);
            D.text(g, c.name, r.x + r.w / 2, r.y + r.h * .9, {size: Math.min(r.w * .2, 15), color: C.ink, font: 'serif', weight: 700});
          } else {
            g.fillStyle = '#8a2a20'; D.rr(g, r.x, r.y, r.w, r.h, r.w * .08); g.fill();
            D.text(g, '茶', r.x + r.w / 2, r.y + r.h / 2, {size: r.w * .35, color: 'rgba(230,197,125,.5)', font: 'serif', weight: 900});
          }
          g.restore();
          if (guessMode && pick === i) { g.strokeStyle = '#ffd76a'; g.lineWidth = 4; D.rr(g, r.x - 3, r.y - 3, r.w + 6, r.h + 6, r.w * .1); g.stroke(); }
          if (st.guess && st.over && st.guess.i === i && st.guess.by === v) { g.strokeStyle = st.guess.ok ? '#5aa08a' : '#ff5040'; g.lineWidth = 5; D.rr(g, r.x - 3, r.y - 3, r.w + 6, r.h + 6, r.w * .1); g.stroke(); }
        }
        if (guessMode) { g.fillStyle = 'rgba(255,215,106,.12)'; g.fillRect(0, 0, cv.w, cv.h); }
        drawSide(g, l, v);
      },
    };
    function drawSide(g, l, v) {
      const S = l.side, o = 1 - v;
      const sc = CAST[st.secret[v]];
      // secret card
      let cw, x, y;
      if (l.portraitMode) { cw = Math.min(S.h * .62, 70); x = 10; y = 6; } else { cw = Math.min(S.w - 60, 130, l.H * .28); x = (S.w - cw) / 2; y = 30; }
      const chh = cw * 1.28;
      D.text(g, '你的角色', x + cw / 2, y + (l.portraitMode ? 0 : -14), {size: 12, color: '#f3e2c0', base: l.portraitMode ? 'top' : 'middle'});
      const yy = l.portraitMode ? y + 16 : y;
      const ch2 = l.portraitMode ? Math.min(chh, S.h - 22) : chh, cw2 = ch2 / 1.28;
      g.fillStyle = '#e6c57d'; D.rr(g, x - 3, yy - 3, cw2 + 6, ch2 + 6, 8); g.fill();
      g.fillStyle = '#fffaf0'; D.rr(g, x, yy, cw2, ch2, 6); g.fill();
      portrait(g, sc, x + 2, yy + 2, cw2 - 4, ch2 - ch2 * .17);
      D.text(g, sc.name, x + cw2 / 2, yy + ch2 * .91, {size: Math.min(14, cw2 * .2), color: C.red, font: 'serif', weight: 800});
      // Q&A log
      let lx, ly, lw, lh;
      if (l.portraitMode) { lx = x + cw2 + 14; ly = 6; lw = S.w - lx - 8; lh = S.h - 10; } else { lx = 10; ly = yy + ch2 + 18; lw = S.w - 20; lh = l.H - ly - 10; }
      g.fillStyle = 'rgba(20,12,5,.45)'; D.rr(g, lx, ly, lw, lh, 10); g.fill();
      D.text(g, '对方剩 ' + remaining(o) + ' 人 · 你剩 ' + remaining(v) + ' 人', lx + 10, ly + 13, {size: 12, color: '#e6c57d', align: 'left', maxW: lw - 16});
      const lineH = l.portraitMode ? 18 : 22, maxN = Math.max(1, Math.floor((lh - 30) / lineH));
      const items = st.qa.slice(-maxN);
      items.forEach((it, k) => {
        const mine = it.by === v, txt = (mine ? '我问：' : '对方问：') + QSHORT[it.q] + '？';
        const yy2 = ly + 32 + k * lineH;
        D.text(g, txt, lx + 10, yy2, {size: l.portraitMode ? 12 : 13, color: mine ? '#f3e2c0' : 'rgba(243,226,192,.6)', align: 'left', maxW: lw - 50});
        g.fillStyle = it.ans ? '#3f7f6b' : '#b23a2b'; D.rr(g, lx + lw - 38, yy2 - 8, 28, 16, 8); g.fill();
        D.text(g, it.ans ? '是' : '否', lx + lw - 24, yy2, {size: 11, color: '#fff'});
      });
      if (!items.length) D.text(g, '还没有人提问', lx + 10, ly + 34, {size: 12, color: 'rgba(243,226,192,.5)', align: 'left'});
      void fresh;
    }
    refresh();
    return inst;
  },
});
