/* ================= 第五夜 · 兔子人 ================= */
(() => {
  /* ---------- 同伴：跟在身后排成一串 ---------- */
  const MEMBERS = ['kelly', 'brent', 'dee'];
  let TR = { w: null, map: null, last: null, trail: [] };
  function partyEnts(S) {
    const out = [];
    for (const k of (S.f.party || [])) { const e = getEnt(k + '_' + S.map, S.map); if (e) out.push(e); }
    return out;
  }
  function partyReset(S) {
    const m = curMap(), p = W.pl, ents = partyEnts(S);
    TR = { w: W, map: S.map, last: [p.x, p.y], trail: [] };
    if (!ents.length) return;
    const back = DIRS[[3, 2, 1, 0][p.dir]];
    const seen = new Set([p.x + ',' + p.y]), q = [[p.x, p.y]], spots = [];
    // 先找身后，再按距离找空格
    const pref = [p.x + back[0], p.y + back[1]];
    if (passable(m, pref[0], pref[1], null)) { spots.push(pref); seen.add(pref.join(',')); q.push(pref); }
    while (q.length && spots.length < ents.length) {
      const [x, y] = q.shift();
      for (const d of DIRS) {
        const nx = x + d[0], ny = y + d[1], k = nx + ',' + ny;
        if (seen.has(k)) continue; seen.add(k);
        if (Math.abs(nx - p.x) + Math.abs(ny - p.y) > 4 || !passable(m, nx, ny, null)) continue;
        spots.push([nx, ny]); q.push([nx, ny]);
        if (spots.length >= ents.length) break;
      }
    }
    ents.forEach((e, i) => {
      // 空格不够时挤在已找到的空位上，不站到玩家脚下（调查键优先选脚下的非实心物，会抢走调查）
      const s = spots[i] || spots[i % Math.max(1, spots.length)] || [p.x, p.y];
      e.hidden = false; e.solid = false; e.mv = null; e.px = s[0] * TS; e.py = s[1] * TS; e.x = s[0]; e.y = s[1]; e.dir = p.dir; e.chase = null;
      TR.trail[i] = s;
    });
  }
  function partyTick(S) {
    if (!W || W.ended) return;
    const p = W.pl;
    if (TR.w !== W || TR.map !== S.map) { partyReset(S); return; }
    const ents = partyEnts(S); if (!ents.length) { TR.last = [p.x, p.y]; return; }
    const [lx, ly] = TR.last;
    if (lx !== p.x || ly !== p.y) {
      if (Math.abs(lx - p.x) + Math.abs(ly - p.y) === 1) { TR.trail.unshift([lx, ly]); TR.trail.length = Math.min(TR.trail.length, 6); TR.last = [p.x, p.y]; }
      else { partyReset(S); return; }
    }
    ents.forEach((e, i) => {
      const tg = TR.trail[i]; if (!tg || e.mv || e.hidden) return;
      const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
      if (ex === tg[0] && ey === tg[1]) return;
      const dist = Math.abs(ex - tg[0]) + Math.abs(ey - tg[1]);
      if (dist === 1) startMove(e, DIRS.findIndex(d => d[0] === tg[0] - ex && d[1] === tg[1] - ey), RUN_SPD * 1.15);
      else { e.px = tg[0] * TS; e.py = tg[1] * TS; e.x = tg[0]; e.y = tg[1]; }
    });
  }
  function join(S, k) {
    const pa = S.f.party || []; if (!pa.includes(k)) pa.push(k); S.f.party = pa;
    const e = getEnt(k + '_' + S.map, S.map); if (e) { e.solid = false; }
    TR.map = null;   // 下一帧重新排队
  }
  function leave(S, k) { S.f.party = (S.f.party || []).filter(x => x !== k); }
  const inParty = (S, k) => (S.f.party || []).includes(k);
  const plrOn = S => S.plr(S.has('flashlight') ? null : 1.4);

  /* ---------- 双人：关键抉择两人各投一票（单人时等同 ask） ----------
     safe 给了序号时，两人意见不一致就走这个更稳妥的分支，并用 split 那句旁白交代 */
  async function choose(S, q, opts, who, safe, split) {
    if (S.coop) S.toast('两个人各选一个');
    const r = await S.vote(q, opts, who);
    if (r.agree) return r.v;
    if (safe != null) { await S.narr(split || '你们俩的意见不一样……最后，谁也没有往前迈那一步。'); return safe; }
    await S.narr('你们俩的意见不一样。\n……最后，还是攥着手电的那个人拿了主意。');
    return r.v;
  }

  /* ---------- S.tone 合成的关键音效（双方都听得到） ---------- */
  // 镇上教堂的大钟：低沉的嗡声 + 不协和的泛音 + 长长的尾音
  function toll(S, d = 0, f = 174) {
    S.tone('sine', f / 2, f / 2, 5.5, .06, d);
    S.tone('sine', f, f, 4.4, .085, d);
    S.tone('sine', f * 1.19, f * 1.19, 2.8, .04, d);
    S.tone('sine', f * 1.5, f * 1.5, 1.9, .026, d);
    S.tone('sine', f * 2, f * 2, 2.6, .036, d);
    S.tone('sine', f * 2.63, f * 2.63, 1.2, .018, d);
    S.tone('triangle', f * 7, f * 4, .08, .03, d, 2600);
  }
  async function tolls(S, n, gap = 800) { for (let i = 0; i < n; i++) { toll(S); await S.wait(gap); } }
  // 整点之前的报时曲（威斯敏斯特钟声的前两句）：倒计时快到头时的提醒
  function chime(S) {
    [330, 262, 294, 196, 196, 294, 330, 262].forEach((f, i) => {
      const d = i * .5 + (i >= 4 ? .45 : 0);
      S.tone('sine', f, f, 1.5, .05, d); S.tone('sine', f * 2, f * 2, .9, .022, d); S.tone('sine', f * 3.01, f * 3.01, .45, .01, d);
    });
  }
  // 火车过桥：三音汽笛（带一点多普勒下滑）+ 低频轰鸣
  function horn(S, d = 0, dur = 1.4) { for (const f of [277, 330, 415]) S.tone('sawtooth', f, f * .95, dur, .026, d, 1100); }
  // 斧刃拖过水泥地
  function scrape(S, d = 0) { S.tone('sawtooth', 1900, 1250, .7, .016, d, 3200); S.tone('square', 3100, 2500, .5, .006, d + .05, 5200); S.tone('triangle', 150, 90, .3, .05, d, 600); }

  /* ---------- 心跳：追逐者越近跳得越快（只在主机 tick 里发声） ---------- */
  let HB = 0, HUSH = 0;

  /* ---------- 兔子人精灵（真/假） ---------- */
  const PAL_REAL = { suit: '#c9c4b4', shade: '#9a9686', dark: '#6e6a5e', belly: '#b8b2a0', inner: '#8a7e74', eye: '#050405', hand: '#8a8478', shoe: '#3a3630', blade: '#2c2c30', handle: '#3a2a1c', stain: '#6a5e48' };
  const PAL_FAKE = { suit: '#eaa6ba', shade: '#c47e94', dark: '#a0607a', belly: '#f6d6e0', inner: '#ff7aa0', eye: '#2a1a20', hand: '#f0c8a8', shoe: '#c41e2a', blade: '#e4e8f0', handle: '#7a5a34', fake: true };
  function bunnySpr(e, t, R, P) {
    const d = e.dir ?? 0, fr = e.fr || 0, a = fr === 1 ? 1 : 0, b = fr === 3 ? 1 : 0;
    R(1, 14, 14, 2, 'rgba(0,0,0,.4)');
    if (d === 0 || d === 3) {
      R(4, 7, 3, 8 - a, P.suit); R(9, 7, 3, 8 - b, P.shade); R(4, 14 - a, 3, 1, P.shoe); R(9, 14 - b, 3, 1, P.shoe);
      R(3, -6, 10, 14, P.suit); R(10, -6, 3, 14, P.shade); R(3, 7, 10, 1, P.dark);
      if (d === 0) R(6, -3, 4, 7, P.belly);
      R(1, -5 + a, 2, 10, P.suit); R(13, -5 + b, 2, 10, P.shade); R(1, 5 + a, 2, 2, P.hand); R(13, 5 + b, 2, 2, P.hand);
      R(4, -15, 8, 9, P.suit); R(10, -15, 2, 9, P.shade); R(5, -7, 6, 1, P.dark);
      if (P.fake) { R(5, -26, 2, 11, P.suit); R(5, -25, 1, 9, P.inner); R(9, -17, 2, 2, P.suit); R(10, -18, 3, 2, P.suit); R(12, -17, 2, 5, P.shade); R(12, -16, 1, 3, P.inner); }
      else { R(5, -28, 2, 13, P.suit); R(9, -28, 2, 13, P.shade); if (d === 0) { R(5, -27, 1, 10, P.inner); R(9, -27, 1, 10, P.inner); } R(5, -28, 2, 1, P.dark); R(9, -28, 2, 1, P.dark); }
      if (d === 0) {
        R(5, -12, 2, 2, P.eye); R(9, -12, 2, 2, P.eye);
        if (P.fake) { R(7, -9, 2, 1, '#fff'); R(5, -10, 1, 1, '#ff9ab8'); R(10, -10, 1, 1, '#ff9ab8'); }
        else { R(7, -9, 2, 2, P.eye); R(4, 0, 2, 3, P.stain); R(9, 4, 3, 2, P.stain); }
      }
      // 斧头：拖在右手（正面在画面右侧）
      const hx = d === 0 ? 13 : 1;
      R(hx + 1, 5, 1, 9, P.handle); R(hx - 1, 11, 4, 3, P.blade); if (P.fake) R(hx - 1, 11, 4, 1, '#fff');
    } else {
      const H = (x, y, w, h, c) => R(d === 2 ? 16 - x - w : x, y, w, h, c);
      if (fr === 1 || fr === 3) { H(4, 7, 3, 7, P.suit); H(9, 7, 3, 7, P.shade); H(3, 14, 3, 1, P.shoe); H(10, 14, 3, 1, P.shoe); }
      else { H(6, 7, 4, 8, P.suit); H(5, 14, 4, 1, P.shoe); }
      H(4, -6, 8, 14, P.suit); H(9, -6, 3, 14, P.shade); H(4, 7, 8, 1, P.dark);
      H(5, -15, 7, 9, P.suit); H(3, -11, 2, 3, P.suit); H(10, -15, 2, 9, P.shade);
      H(5, -12, 2, 2, P.eye);
      if (P.fake) { H(8, -25, 2, 10, P.suit); H(10, -17, 4, 2, P.shade); H(13, -16, 2, 4, P.shade); }
      else { H(8, -27, 2, 12, P.suit); H(10, -26, 2, 11, P.shade); }
      H(6, -4 + a, 3, 10, P.shade); H(6, 6 + a, 3, 2, P.hand);
      H(7, 7, 1, 7, P.handle); H(4, 11, 4, 3, P.blade); if (P.fake) H(4, 11, 4, 1, '#fff');
      if (P.fake) { H(3, -10, 1, 1, '#ffe8a0'); }
    }
  }

  /* ---------- 共用台词 ---------- */
  const caughtReal = async S => {
    S.clearTimer();   // 午夜倒计时在对话里也走，被抓时先停掉，免得两段剧本抢着跑
    S.sfx('cut'); scrape(S); await S.scare('static', { dur: .4 });
    await S.scare('face', { face: 'bunny', sfx: 'scare', dur: 1 });
    await S.die('你没有听见脚步声。\n你只听见身后很近很近的地方，有什么东西被慢慢举了起来——然后，手电筒掉在了泥里。', '兔子人追上了你');
  };

  defChapter({
    id: 'bunnyman', n: 5, title: '兔子人', sub: '万圣节午夜，铁路桥洞，一个穿白色兔子装、拿着斧头的男人。', origin: '美国弗吉尼亚州都市传说', color: '#5a2c0e',
    amb: 'wind', floor: 'dirt', wall: 'concrete', dark: .84, plr: 3.2,
    thumb(g, w, h) {
      g.fillStyle = '#1a1612'; g.fillRect(0, h * .2, w, h * .62);
      g.fillStyle = '#2c2a26'; g.fillRect(0, h * .2, w, 10); g.fillStyle = '#6a6e74'; g.fillRect(0, h * .2 + 3, w, 2);
      for (let x = 0; x < w; x += 12) { g.fillStyle = '#3a2a1c'; g.fillRect(x, h * .2, 4, 10); }
      g.fillStyle = '#4c4a46'; g.fillRect(w * .28, h * .2 + 10, w * .44, h * .62 - 10);
      g.fillStyle = '#050405'; g.fillRect(w * .34, h * .2 + 18, w * .32, h * .62 - 18);
      g.fillStyle = 'rgba(232,120,30,.9)'; g.fillRect(w * .12, h * .82 - 14, 12, 10); g.fillStyle = '#ffd060'; g.fillRect(w * .12 + 3, h * .82 - 11, 2, 2); g.fillRect(w * .12 + 7, h * .82 - 11, 2, 2); g.fillRect(w * .12 + 3, h * .82 - 7, 6, 1);
      // 洞口里的兔子人：缩小一点，让两只耳朵整个露出来；斧刃上加一道冷光
      const sc = 1.6, ox = w / 2 - 8 * sc, oy = h * .8 - 16 * sc;
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * sc, oy + y * sc, ww * sc, hh * sc); };
      bunnySpr({ dir: 0, fr: 0 }, 0, R, PAL_REAL);
      R(12, 11, 4, 1, '#b8c0cc'); R(15, 12, 1, 2, '#8a9098');
      g.fillStyle = 'rgba(200,210,230,.10)'; g.fillRect(w * .34, h * .2 + 18, w * .32, 6);
    },
    /* 惊吓大头像（32×32）：旧得发灰的兔子头套，两只直挺挺的长耳朵，两个黑洞一样的眼眶，
       缝死的嘴越撕越开，一把不反光的斧头从画面底下慢慢举起来 */
    faces: {
      bunny(R, a, t) {
        const SU = '#c9c4b4', SH = '#9a9686', DK = '#5e5a50', IN = '#8a7e74', ST = '#6a5e48', BK = '#050405', LT = '#dcd8ca';
        R(0, 0, 32, 32, '#030303');
        // 耳朵：左耳笔直，右耳尖上折了一下
        R(8, 0, 4, 12, SU); R(9, 1, 2, 10, IN); R(11, 0, 1, 12, SH);
        R(20, 3, 4, 9, SU); R(21, 4, 2, 7, IN); R(23, 3, 1, 9, SH); R(21, 0, 5, 3, SH); R(24, 1, 2, 1, DK);
        R(8, 11, 4, 1, DK); R(20, 11, 4, 1, DK);
        // 头套：大而方的轮廓，右侧压暗
        R(6, 10, 20, 4, SU); R(4, 14, 24, 12, SU); R(5, 26, 22, 3, SU); R(7, 29, 18, 3, SU);
        R(23, 12, 3, 15, SH); R(25, 14, 3, 12, SH); R(21, 27, 5, 3, SH); R(4, 14, 1, 12, LT);
        // 毛结成一绺一绺的
        for (let i = 0; i < 34; i++) { const x = 5 + ((hash(i, 1, 55) * 22) | 0), y = 11 + ((hash(i, 2, 55) * 19) | 0); R(x, y, 1, 1, i % 3 ? SH : LT); }
        // 头顶的缝线
        for (let y = 11; y < 22; y += 2) R(16, y, 1, 1, DK);
        // 污渍
        R(6, 20, 3, 4, ST); R(7, 24, 2, 3, ST); R(22, 23, 3, 3, ST); R(24, 15, 1, 5, ST); R(24, 20, 1, 2, DK); R(10, 27, 4, 2, ST);
        // 眼眶：两个黑洞（a 过半以后，左边那个洞的最深处，有一点湿亮的东西）
        R(9, 15, 5, 5, BK); R(10, 14, 3, 1, BK); R(10, 20, 3, 1, BK); R(8, 16, 1, 3, DK); R(14, 16, 1, 3, DK);
        R(18, 15, 5, 5, BK); R(19, 14, 3, 1, BK); R(19, 20, 3, 1, BK); R(17, 16, 1, 3, DK); R(23, 16, 1, 3, DK);
        if (a > .5) R(11, 17, 1, 1, Math.sin(t * 20) > -.5 ? '#c8c4b0' : '#3a3a34');
        // 鼻子
        R(15, 21, 3, 1, DK); R(16, 22, 1, 1, DK);
        // 嘴：一道缝死的线，越撕越开，缝线被扯得笔直
        const mh = Math.round(a * 4);
        R(12, 24, 9, 1, DK);
        if (mh > 0) { R(13, 24, 7, mh, BK); for (const x of [14, 16, 18]) R(x, 24, 1, mh, '#b8b2a0'); }
        for (const x of [13, 15, 17, 19]) R(x, 23, 1, 1, DK);
        // 斧头：从画面底下慢慢举起来
        const by = 32 - Math.round(a * 10);
        R(23, by, 8, 5, '#2c2c30'); R(23, by + 4, 8, 1, '#45454a'); R(27, by + 5, 2, 12, '#3a2a1c');
      }
    },
    endings: { home: '第五夜　完', bells: '钟声响完的时候', car: '在车里等的人' },
    people: {
      me: { key: 'bm-me', skin: '#eec6a2', hair: '#4a2e1c', hs: 'short', top: '#8a2c26', top2: '#2a2a2a', bottom: '#3a4a6a', shoes: '#d8d4c8',
        extra(g, d, fr, G, R) { if (d !== 3) { R(4, G.tT + 3, 8, 1, '#5a1a16'); R(4, G.tT + 6, 8, 1, '#5a1a16'); R(7, G.tT, 1, G.tB - G.tT, '#5a1a16'); } } },
      kelly: { key: 'bm-kelly', skin: '#f2cfae', hair: '#c89a48', hs: 'long', top: '#4a6a8e', top2: '#e8e0d0', bottom: '#2a2a36', shoes: '#2a2a2a',
        extra(g, d, fr, G, R) { R(1, G.hT + 1, 14, 1, '#140e18'); R(4, G.hT - 2, 8, 3, '#140e18'); R(6, 0, 5, 1, '#140e18'); R(4, G.hT, 8, 1, '#7a3aa0'); } },
      brent: { key: 'bm-brent', skin: '#e8bc96', hair: '#6a4022', hs: 'short', hat: 'cap', hatC: '#1a2a5a', top: '#8e1c22', top2: '#e8e0d0', bottom: '#33384a', shoes: '#e8e8e8',
        extra(g, d, fr, G, R) { if (d !== 3) { R(3, G.tT + 1, 1, G.tB - G.tT - 1, '#e8e0d0'); R(12, G.tT + 1, 1, G.tB - G.tT - 1, '#e8e0d0'); } } },
      // 换上粉兔子装的布伦特：粉色兜帽，怀里抱着那只只剩一只耳朵的兔头套
      brentS: { key: 'bm-brentS', skin: '#e8bc96', hair: '#6a4022', hs: 'messy', hat: 'hood', hatC: '#eaa6ba', top: '#eaa6ba', top2: '#f6d6e0', bottom: '#eaa6ba', shoes: '#c41e2a',
        extra(g, d, fr, G, R) {
          if (d === 3) return;
          const x = d === 0 ? 4 : 6;
          R(x, G.tT + 2, 8, 6, '#f2b6c8'); R(x + 6, G.tT + 2, 2, 6, '#c47e94'); R(x + 2, G.tT + 6, 4, 2, '#f6d6e0');
          R(x + 1, G.tT - 3, 2, 5, '#f2b6c8'); R(x + 1, G.tT - 2, 1, 3, '#ff7aa0');
          if (d === 0) { R(x + 2, G.tT + 4, 1, 1, '#2a1a20'); R(x + 5, G.tT + 4, 1, 1, '#2a1a20'); R(x + 3, G.tT + 5, 2, 1, '#ffffff'); }
        } },
      dee: { key: 'bm-dee', child: true, skin: '#f2d2b4', hair: '#1e1a1a', hs: 'messy', top: '#16121a', top2: '#a01818', bottom: '#16121a', shoes: '#2a2a2a', mouth: '#ffffff',
        extra(g, d, fr, G, R) { if (d !== 3) { R(2, G.tT - 1, 2, 3, '#a01818'); R(12, G.tT - 1, 2, 3, '#a01818'); } else R(3, G.tT, 10, G.tB - G.tT + 2, '#7a1010'); } },
      deeG: { key: 'bm-deeG', child: true, skin: '#f2d2b4', hair: '#1e1a1a', hs: 'messy', top: '#16121a', top2: '#a01818', bottom: '#16121a', shoes: '#2a2a2a', mouth: '#ffffff',
        extra(g, d, fr, G, R) { if (d !== 3) { R(2, G.tT - 1, 2, 3, '#a01818'); R(12, G.tT - 1, 2, 3, '#a01818'); R(d === 1 ? 4 : 11, G.tT + 2, 1, 6, '#7aff8a'); } else R(3, G.tT, 10, G.tB - G.tT + 2, '#7a1010'); } }
    },
    items: {
      flashlight: { name: '手电筒', desc: '凯莉车后备箱里的大手电，装四节一号电池。开关有点接触不良，得拍两下才亮。' },
      walkie: { name: '对讲机', desc: '布伦特从他哥那儿借来的玩具对讲机，天线上缠着胶布。另一个在布伦特手里。' },
      ear: { name: '粉色兔耳朵', desc: '一只毛绒兔耳朵，夹在塑料发箍上。超市万圣节货架上九块九那种。耳根里面用记号笔写着「B.H.」。' }
    },
    notes: {
      rules: { title: '传单 ·「兔子人桥」万圣节试胆', text: '（布伦特用他爸的打字机打的，在学校走廊里发过一沓。）\n\n★ 兔子人桥 · 万圣节午夜试胆 ★\n\n疯人院、翻掉的押送车、林子里剥了皮的兔子、吊在桥洞底下的逃犯——你肯定听说过。\n另一个逃犯，再也没找到。他穿着兔子装，拿着斧头。\n\n【规矩】\n1. 十二点之前进洞。\n2. 所有人站在洞的正中间。\n3. 等镇上教堂的钟敲完十二下。\n4. 谁先跑，谁请一个月的午饭。\n\n【警告】钟敲完的时候，还站在洞里的人——\n\n（最后这行被红笔划掉了。旁边一行圆圆的字：别吓唬小孩，布伦特。——凯莉）' },
      club: { title: '小迪的会员卡', text: '（一张用麦片盒剪下来的硬纸卡，边上贴着夜光骷髅贴纸。）\n\n★ 枫叶街怪物猎人俱乐部 ★\n会员：诺亚（荣誉会员！！）\n\n俱乐部规矩：\n一、不许告诉大人。\n二、看见怪物先跑，跑完再报告。\n三、进基地要敲暗号。敲错了，不开门！\n\n暗号：　● ●　　● ● ●\n（敲两下，停一下，再敲三下）\n\n（背面用铅笔写着：怪物不知道暗号。所以，敲得不对的，就是怪物。）' },
      archive: { title: '凯莉妈妈的便条', text: '（凯莉的妈妈在县图书馆上班。一页手写的便条，别着几张复印件。）\n\n凯莉：\n你问的「兔子人」，我下班后在馆里查了查。写给你，省得布伦特又拿它吓唬小迪。\n\n· 1904年前后，克利夫顿一带没有什么精神病院。州里的医院名录我一家一家对过了。\n· 「翻了的押送车」，当年的报纸和事故记录里都没有。\n· 那两个逃犯的名字，法院档案里查无此人。\n· 他们「要被转去」的那座监狱，是好几年以后才盖的。\n\n我能找到的最早的「兔子人」，是1970年秋天报纸上的两则报道。就在咱们县，可地方不在那座桥洞。没人受伤，那个人也一直没抓到。\n\n所以，那座桥底下没吊死过谁。至少，纸上没有。\n\n——妈妈\nP.S. 十二点之前回家。把小迪也带回来。' },
      clip: { title: '剪贴簿里的旧剪报（1970年）', text: '（两张发黄的剪报，报头被剪掉了，旁边有人用铅笔标了日期。）\n\n1970年10月19日\n……昨夜，一对年轻男女把车停在县内一条乡间路边。一名身穿白衣、头戴兔耳头套的男子从暗处走出，斥责二人擅闯私人土地，随后将一把短柄斧头掷入车窗。二人驾车离开，均未受伤。斧头留在了车里。\n\n1970年10月30日\n……昨晚，一名新建住宅区的保安看见一名穿兔子装的男子站在一栋未完工房屋的门廊下，用斧头砍门廊的柱子，嘴里嚷着「你们都是擅闯者」。保安走近时，对方逃进了树林。警方称正在调查。\n\n（剪报边上，铅笔写着一行歪歪扭扭的小字：\n他们把树都砍了。盖那么多房子。）' }
    },
    legend: '「兔子人」（Bunny Man）是美国弗吉尼亚州费尔法克斯县最出名的都市传说。真正登过报纸的，只有1970年10月的两件事：一对年轻人深夜把车停在路边，一个穿白衣服、戴长兔耳头套的男人从黑暗里走出来，嚷着他们擅闯私人土地，把一把短柄斧头砸进了车窗；十来天后，一名工地保安看见一个穿兔子装的人站在一栋没完工的新房子门廊下，用斧头一下一下地砍柱子，嘴里同样嚷着「擅闯」。两次都没有人受伤，警方调查了一阵，始终没有找到这个人。据说之后几个星期里又冒出了不少目击报告，但没有一份得到证实。\n\n后来的故事越讲越大，也越讲越老：据说二十世纪初，克利夫顿附近的一所精神病院关门，押送病人的车在科尔切斯特路上翻了，两个病人逃进树林；附近开始出现剥了皮、挂在树上的兔子；其中一个被发现吊死在铁路桥洞下，另一个就成了「兔子人」。有的版本说，他每年万圣节午夜回到桥洞，专找还待在洞里的人，第二天人就挂在桥上；有的版本给两个逃犯安上了名字和年份——每个讲故事的人给的都不太一样。那座二十世纪初修的单车道铁路桥洞因此被叫作「兔子人桥」，经过口耳相传和后来的互联网，成了当地高中生万圣节夜里试胆的去处；据说每到万圣节，县里都会派警察守在桥洞附近。\n\n查无实据的部分：县里的档案工作者专门翻过法院记录和地方史料，没有找到那所「精神病院」、那次翻车和那两个逃犯，也没有桥下吊死人的记录；传说里病人要被转去的那座监狱，是好几年之后才建成的。1970年的两起事件发生在离桥洞好几英里外的新住宅区一带，和这座桥本身并没有关系。那个人是谁、为什么要穿兔子装，至今没有答案；有一种说法是，他是对当时树林被大片推平、盖起新房子心怀不满的本地人——但这同样只是猜测。\n\n（本章的诺亚、凯莉、布伦特、小迪，树林里的老农舍、挂历、写字台上的旧信和剪贴簿，以及午夜桥洞里的那个「兔子人」，均为游戏虚构。游戏借那位不肯卖地的老农，把「对开发不满的本地人」这个猜测写成了故事，并不是史实；剪报的文字是按当年报道的大意改写的。）',
    start: { map: 'road', x: 8, y: 13, dir: 1 },
    resume: {
      woods: async S => { plrOn(S); },
      // 门口那一幕死了：不用离开再踩回触发格，直接重演（旁白压缩）
      e3: async S => { const b = getEnt('bm_woods', 'woods'); if (b) { b.hidden = true; b.alpha = 1; b.chase = null; } S.f.hush = false; plrOn(S); await realEncounter(S, true); },
      chase: async S => { startChase(S); },
      final: async S => { startFinal(S); }
    },
    async intro(S) {
      TR = { w: null, map: null, last: null, trail: [] };
      await S.card('第五夜　兔子人', '1995年10月31日　晚上11:05　美国弗吉尼亚州　费尔法克斯县', '学校里每个人都听说过那座桥洞。\n科尔切斯特路走到头，一条铁路从土堤上过，\n底下是一个只容得下一辆车的水泥洞。\n\n据说万圣节午夜，站在洞里的人，\n会看见一个穿白色兔子装、拿着斧头的男人。\n\n今年，布伦特说，轮到我们了。');
    },
    tick(S, dt) {
      partyTick(S);
      const f = S.f;
      // 门口屏息：躲进灌木丛以后，玩家一迈步就会被听见（S.moving 在客机操作时也准确）
      if (f.hush && !W.busy) {
        HUSH += dt;
        if (HUSH > .15 && S.moving) { f.hush = false; S.clearTimer(); S.after(0, hushCaught); }
        else if (Math.floor(HUSH / 1.1) !== Math.floor((HUSH - dt) / 1.1)) S.sfx('heart');
      }
      // 追逐段 / 午夜桥洞：兔子人越近，心跳越快
      if ((f.phase === 'chase' || f.phase === 'final') && !W.busy && !W.ended) {
        const b = getEnt(f.phase === 'chase' ? 'bm_woods' : 'bm_tunnel', S.map);
        if (b && b.chase && !b.hidden) {
          const d = (Math.abs(b.px - W.pl.px) + Math.abs(b.py - W.pl.py)) / TS;
          HB -= dt; if (d < 7 && HB <= 0) { S.sfx('heart'); HB = .32 + d * .17; }
        }
        // 倒计时快到头：镇上的钟楼先奏一段整点报时曲
        if (f.phase === 'final' && W.timer && W.timer.label && W.timer.left < 8 && !f.chimed) { f.chimed = true; chime(S); S.toast('远处，钟楼开始奏整点报时曲了'); }
      }
    },
    sprites: {
      bunny(g, e, t, R) { bunnySpr(e, t, R, PAL_REAL); },
      fakebun(g, e, t, R) { bunnySpr(e, t, R, PAL_FAKE); },
      pumpkin(g, e, t, R) {
        const f = Math.sin(t * 11 + e.px) > .2 ? '#ffd860' : '#ffb030';
        R(3, 7, 10, 8, '#a04a0c'); R(2, 8, 12, 6, '#d8681a'); R(4, 7, 8, 8, '#e8781e'); R(7, 5, 2, 3, '#3a5a1a');
        if (!e.off) { R(4, 9, 2, 2, f); R(10, 9, 2, 2, f); R(5, 12, 6, 1, f); R(6, 13, 1, 1, f); R(9, 13, 1, 1, f); }
        else { R(4, 9, 2, 2, '#3a1a08'); R(10, 9, 2, 2, '#3a1a08'); R(5, 12, 6, 1, '#3a1a08'); }
      },
      graf(g, e, t, R) {
        const k = e.k || 0, C = ['#d8d8d0', '#c02a2a', '#2a8ad8', '#e8c030', '#e070c0', '#5ac060'];
        const c1 = C[k % 6], c2 = C[(k + 2) % 6];
        if (e.vert) { for (let i = 0; i < 5; i++) R(3 + (hash(k, i, 3) * 9 | 0), 1 + i * 3, 1 + (hash(k, i, 4) * 4 | 0), 1, i % 2 ? c1 : c2); R(6, 2, 1, 10, c1); return; }
        if (k === 0) { R(2, 3, 2, 8, c1); R(4, 3, 3, 1, c1); R(4, 6, 3, 1, c1); R(7, 4, 1, 2, c1); R(4, 10, 3, 1, c1); R(7, 7, 1, 3, c1); R(9, 3, 2, 8, c2); R(11, 10, 3, 1, c2); }
        else if (k === 1) { R(3, 4, 1, 6, c1); R(7, 2, 1, 8, c1); R(3, 4, 5, 1, c1); R(10, 5, 4, 4, c2); R(11, 6, 2, 2, '#1a1a1a'); }
        else if (k === 2) { R(2, 5, 12, 1, c1); R(3, 3, 2, 2, c1); R(6, 2, 1, 3, c2); R(9, 3, 4, 2, c2); R(4, 8, 8, 3, c1); R(5, 9, 6, 1, '#1a1a1a'); }
        else if (k === 3) { R(4, 2, 2, 3, c1); R(9, 2, 2, 3, c1); R(4, 5, 7, 5, c1); R(5, 6, 1, 1, '#c02a2a'); R(9, 6, 1, 1, '#c02a2a'); R(6, 8, 3, 1, '#1a1a1a'); }
        else { R(2, 4, 12, 1, c2); for (let i = 0; i < 4; i++) R(3 + i * 3, 6, 2, 5, c1); R(2, 11, 12, 1, c2); }
      },
      duffel(g, e, t, R) { R(1, 13, 14, 2, 'rgba(0,0,0,.35)'); R(1, 6, 14, 8, '#1e2a4a'); R(2, 6, 12, 2, '#2c3c64'); R(4, 4, 8, 2, '#141c30'); R(6, 6, 6, 1, '#888'); R(8, 7, 3, 2, '#eaa6ba'); R(9, 6, 2, 1, '#f6d6e0'); R(2, 10, 3, 2, '#c02a2a'); },
      pear(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(3, 10 + b, 10, 1, '#2a2a2a'); R(6, 3 + b, 3, 8, '#eaa6ba'); R(7, 4 + b, 1, 6, '#ff7aa0'); R(9, 2 + b, 2, 2, '#eaa6ba'); },
      memorial(g, e, t, R) {
        R(1, 10, 14, 4, '#3a3632'); for (let i = 0; i < 4; i++) { const x = 2 + i * 3, h = 3 + (i % 2) * 2; R(x, 10 - h, 2, h, '#e8e2cc'); const f = Math.sin(t * 14 + i * 2) > 0 ? 1 : 0; if (i !== 2) R(x, 8 - h + f, 2, 2 - f, '#ffcf5a'); }
        R(11, 4, 3, 3, '#c02a40'); R(12, 7, 1, 3, '#3a5a2a'); R(3, 2, 2, 2, '#e8e0f0');
      },
      fhouse(g, e, t, R) {
        const W1 = '#6a645a', Wd = '#3a3630', RF = '#1a1614';
        R(-2, -28, 84, 6, RF); R(2, -32, 76, 4, RF); R(8, -35, 64, 3, RF); R(0, -22, 80, 1, '#2a2622');
        R(0, -21, 80, 37, Wd); R(1, -20, 78, 35, W1);
        for (let y = -18; y < 14; y += 4) R(1, y, 78, 1, '#5a5448');
        const win = (x, y, br) => { R(x, y, 10, 10, '#1a1410'); R(x + 1, y + 1, 8, 8, '#0c1018'); R(x + 5, y + 1, 1, 8, '#1a1410'); R(x + 1, y + 5, 8, 1, '#1a1410'); if (br) { R(x + 2, y + 2, 3, 1, '#2a3040'); R(x + 6, y + 6, 2, 2, '#2a3040'); } };
        win(6, -16, true); win(64, -16); win(6, -1); win(64, -1, true); win(46, -16);
        R(-1, -4, 82, 2, '#2a2622');
        for (const x of [2, 24, 56, 76]) { R(x, -2, 3, 18, '#5a5248'); R(x, -2, 1, 18, '#7a7266'); }
        R(24, 2, 1, 2, '#c8c0a8'); R(26, 6, 1, 2, '#c8c0a8'); R(25, 9, 2, 1, '#c8c0a8');
        R(32, -2, 16, 18, '#120e0c'); R(33, -1, 14, 17, e.open ? '#050404' : '#3a2a1c'); if (!e.open) { R(44, 7, 2, 2, '#8a7a5a'); R(35, 1, 10, 6, '#45321f'); }
        R(28, 14, 24, 2, '#4a4440');
        R(14, -30, 6, 10, '#3a3028'); R(13, -31, 8, 2, '#2a221c');
      },
      bulkhead(g, e, t, R) { R(0, 2, 16, 13, '#2a221a'); if (e.open) { R(1, 3, 14, 11, '#050404'); R(1, 3, 3, 11, '#4a3a2a'); R(12, 3, 3, 11, '#4a3a2a'); return; } R(1, 3, 7, 11, '#5a4632'); R(8, 3, 7, 11, '#4e3c2a'); for (let y = 5; y < 14; y += 3) { R(1, y, 14, 1, '#3a2c1e'); } R(6, 8, 1, 2, '#8a8a8a'); R(9, 8, 1, 2, '#8a8a8a'); },
      stump(g, e, t, R) { R(2, 13, 12, 2, 'rgba(0,0,0,.35)'); R(3, 5, 10, 9, '#5a3a22'); R(3, 4, 10, 3, '#a07a50'); R(5, 5, 6, 1, '#8a6440'); R(7, 4, 2, 2, '#2a1a10'); for (let i = 0; i < 6; i++) R((hash(i, 2, 8) * 16) | 0, 12 + (i % 3), 2, 1, '#e8d8b0'); R(13, 8, 3, 6, '#6a4a2a'); R(-1, 10, 4, 5, '#6a4a2a'); },
      pickup(g, e, t, R) { R(1, 13, 30, 2, 'rgba(0,0,0,.4)'); R(0, 3, 32, 10, '#3a2418'); R(1, 4, 30, 8, '#6a3a22'); R(20, 0, 10, 5, '#5a3020'); R(22, 1, 6, 3, '#12161c'); R(2, 6, 16, 1, '#4a2818'); R(3, 12, 6, 3, '#1a1612'); R(23, 12, 6, 3, '#1a1612'); R(6, 8, 10, 1, '#c8c0a8'); R(8, 9, 1, 2, '#c8c0a8'); R(12, 9, 1, 2, '#c8c0a8'); },
      cline(g, e, t, R) {
        R(1, -12, 2, 27, '#5a4632'); R(29, -12, 2, 27, '#5a4632'); R(2, -11, 28, 1, '#8a8478');
        const sw = Math.round(Math.sin(t * 1.3) * 1.5);
        R(12 + sw, -10, 8, 9, '#d8d2c0'); R(11 + sw, -10, 2, 6, '#d8d2c0'); R(19 + sw, -10, 2, 6, '#d8d2c0'); R(13 + sw, -1, 3, 9, '#cfc8b4'); R(17 + sw, -1, 3, 9, '#c4bca8'); R(15 + sw, -6, 2, 3, '#a8a090');
      },
      hrope(g, e, t, R) { const s = Math.round(Math.sin(t * 1.1) * 1); R(7, -18, 2, 1, '#6a5a3a'); R(8 + s, -17, 1, 16, '#a08a5a'); R(7 + s, -1, 3, 2, '#a08a5a'); R(7 + s, 1, 1, 2, '#8a7448'); R(9 + s, 1, 1, 1, '#8a7448'); },
      plush(g, e, t, R) { R(7, -4, 2, 2, '#888'); R(5, -2, 6, 7, '#d8d0c4'); R(5, -7, 2, 6, '#d8d0c4'); R(9, -7, 2, 6, '#c8c0b4'); R(6, 0, 1, 1, '#1a1a1a'); R(9, 0, 1, 1, '#1a1a1a'); R(5, 5, 6, 4, '#c8c0b4'); R(7, 6, 2, 1, '#8a3a3a'); },
      campfire(g, e, t, R) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; R(7 + Math.cos(a) * 5, 8 + Math.sin(a) * 4, 3, 2, '#5a5652'); } R(5, 7, 6, 3, '#1a1614'); R(6, 8, 4, 1, '#3a2a20'); R(1, 12, 2, 3, '#a8b0b8'); R(13, 3, 3, 2, '#7a8a5a'); R(12, 13, 2, 2, '#b84030'); },
      trapdoor(g, e, t, R) { if (e.open) { R(1, 1, 14, 14, '#050404'); R(4, 2, 1, 13, '#6a4a2a'); R(11, 2, 1, 13, '#6a4a2a'); for (let y = 4; y < 15; y += 3) R(4, y, 8, 1, '#6a4a2a'); if (e.s && e.s.glow) R(5, 10, 6, 4, 'rgba(120,255,140,.35)'); return; } R(1, 1, 14, 14, '#2a1c12'); R(2, 2, 12, 12, '#4a3220'); for (let x = 2; x < 14; x += 4) R(x, 2, 1, 12, '#3a2618'); R(6, 7, 4, 1, '#8a8478'); R(6, 6, 1, 3, '#8a8478'); R(9, 6, 1, 3, '#8a8478'); },
      coldfire(g, e, t, R) { R(-2, -10, 36, 25, '#3a3632'); R(-1, -9, 34, 23, '#5a5248'); R(6, -2, 20, 16, '#0c0a08'); R(8, 11, 16, 3, '#3a3634'); R(10, 9, 4, 2, '#2a2420'); R(17, 10, 5, 1, '#4a4440'); R(-2, -12, 36, 3, '#2a2622'); R(12, -16, 3, 4, '#d8d0b8'); R(19, -15, 2, 3, '#8a6a4a'); },
      cal70(g, e, t, R) { R(4, 1, 8, 11, '#d8d0b8'); R(4, 1, 8, 3, '#7a4a2a'); for (let y = 5; y < 11; y += 2) for (let x = 5; x < 11; x += 2) R(x, y, 1, 1, '#6a645a'); R(9, 8, 2, 2, '#a02020'); },
      jars(g, e, t, R) { R(0, -6, 16, 21, '#3a2a1c'); for (let s = 0; s < 3; s++) { R(1, -5 + s * 7, 14, 1, '#24180e'); for (let j = 0; j < 4; j++) { const c = ['#6a7a3a', '#8a4a2a', '#9a8a3a', '#5a3a4a'][(j + s) % 4]; R(2 + j * 3, -3 + s * 7, 2, 4, c); R(2 + j * 3, -4 + s * 7, 2, 1, '#8a8478'); } } },
      cage(g, e, t, R) { R(1, 4, 14, 10, '#1a1614'); for (let x = 1; x < 16; x += 3) R(x, 4, 1, 10, '#6a6460'); for (let y = 4; y < 15; y += 3) R(1, y, 14, 1, '#6a6460'); R(1, 14, 14, 1, '#3a3632'); },
      ladder(g, e, t, R) { R(3, -14, 2, 29, '#6a4a2a'); R(11, -14, 2, 29, '#6a4a2a'); for (let y = -12; y < 15; y += 4) R(3, y, 10, 1, '#8a6a3a'); },
      arch(g, e, t, R) { R(-2, 6, 52, 3, '#5a5852'); R(-2, 9, 52, 1, '#2a2826'); R(-2, 6, 3, 10, '#5a5852'); R(47, 6, 3, 10, '#5a5852'); }
    },
    tiles: {
      gravel: { solid: false, paint(R, X, Y) { speck(R, '#4a463e', ['#5a564c', '#3a3832', '#666258'], X, Y, 20, 22); } },
      leaves: { solid: false, paint(R, X, Y) { speck(R, '#2a2318', ['#6a3a16', '#8a5218', '#3a2a18', '#9a3e16', '#4a3a1e'], X, Y, 22, 23); } },
      slope: { solid: true, paint(R, X, Y) { speck(R, '#2a2c20', ['#3a3c2c', '#22241a', '#55534a', '#4a4a44'], X, Y, 20, 24); R(0, 0, 16, 1, '#3a3a34'); } },
      track: { solid: true, paint(R, X, Y) { speck(R, '#46443e', ['#5a5852', '#36342e'], X, Y, 16, 25); for (const x of [1, 7, 13]) R(x, 1, 3, 14, '#3a2a1c'); R(0, 4, 16, 2, '#8a8e94'); R(0, 4, 16, 1, '#b4b8bd'); R(0, 10, 16, 2, '#8a8e94'); R(0, 10, 16, 1, '#b4b8bd'); } },
      tunwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a4a4c'); R(0, 0, 16, 1, '#3a3a3c'); R(X % 2 ? 0 : 15, 0, 1, 16, '#3c3c3e'); if (hash(X, Y, 26) < .4) R(3, (hash(X, Y, 27) * 12) | 0, 6, 3, '#3e3e40'); if (hash(X, Y, 28) < .3) R((hash(X, Y, 29) * 12) | 0, 0, 1, 16, '#2e3a2e'); } }
    },
    tileOpts: { grassC: '#262a1a', treeC: '#5a3214' },
    maps: {
      /* ---------------- 科尔切斯特路（桥洞南口） ---------------- */
      road: {
        amb: 'wind', dark: .82, plr: 2.4, wall: 'concrete', floor: 'asphalt',
        legend: { 'v': 'gravel', 'H': 'track' },
        rows: [
          'HHHHHHHHHHHHHHHHHHHHHHHH',
          '##########000###########',
          '##########000###########',
          'PPPPPPT""v:::v""""PPTTPT',
          'TTTPTPP""v:::v""""TTPTPT',
          'PPTTPPP""v:::v""""TTPTPT',
          'TPTPTTT""v:::v""""TTPTTT',
          'TPTPTPP""v:::v""PPTPPPTT',
          'TPTPTPP""v:::v""PTTTTTTT',
          'PTTPPPP""v:::v""PPTPTPPP',
          'PPPvvvvvvv:::v""TPPPPTPP',
          'TPTvvvvvvv:::v""TTPPTPTP',
          'TTPvvvvvvv:::v""PTTTPPTP',
          'PPTvvvvvvv:::v""TTPTPPPP',
          'PTPvvvvvvv:::v""PTPPTPPP',
          'TPPvvvvvvv:::v""PPTPPTTT',
          'PPPTPTP""v:::v""PPPTTPTP',
          'PPPPTTP""v:::v""PTPPTPPP',
          'PTPTPPT""v:::v""PTPTTTPT',
          'TPTPTPT""v:::v""PPPPPTPP'],
        ents: [
          ...[[4, 0], [7, 1], [14, 2], [17, 3], [20, 4]].map(([x, k]) => ({ x, y: 2, spr: 'graf', k, on: S => S.narr([
            '一个歪歪扭扭的「BM」，下面画着一把斧头。喷漆流下来几道，像是在哭。',
            '一只兔子的轮廓，耳朵画得特别长。有人在它旁边写了个箭头：「他在这儿」。',
            '「1904」，四个数字喷得很大。旁边一行小字：「我奶奶说根本没有疯人院」。',
            '一张笑脸。眼睛的位置被人用红漆点了两个点。',
            '密密麻麻的名字和年份，一层压着一层。最新的一行还是湿的：「95届到此一游」。'][k]) })),
          ...[10, 11, 12].map(x => ({ x, y: 1, spr: 'invisible', touch: enterTunnel })),
          { id: 'memo', x: 14, y: 3, spr: 'memorial', light: { r: 1.8, col: 'rgba(255,170,80,.16)', flick: true }, on: S => S.narr('洞口边上摆着一圈烧剩的蜡烛头，一朵塑料玫瑰，还有一张被雨泡烂的扑克牌。\n不知道是悼念谁的。也许谁也不悼念——只是每年来试胆的人，都想给这儿留点东西。') },
          { x: 16, y: 4, spr: 'sign', col: '#7a1a1a', on: S => S.narr('「铁路用地　禁止擅入」\n牌子被人用气枪打了好多个小洞。底下用记号笔添了一行：「兔子人也是」。') },
          { x: 14, y: 8, spr: 'sign', col: '#c8a020', on: S => S.narr('黄色的警告牌：「前方单车道　限高」。\n限高的数字被人刮掉了，改成了「午夜」。') },
          { id: 'kcar', x: 4, y: 12, w: 2, spr: 'car', col: '#4a5e70', light: { r: 3.4, col: 'rgba(255,240,200,.15)', dx: 44, dy: 8 }, on: carOn },
          { id: 'pump', x: 4, y: 12, ox: 4, oy: -9, z: 1, solid: false, spr: 'pumpkin', light: { r: 2.4, col: 'rgba(255,140,40,.22)', flick: true } },
          { id: 'ear_road', x: 5, y: 12, oy: -8, z: 1, solid: false, spr: 'pear', hidden: true },
          { id: 'bag', x: 9, y: 11, spr: 'duffel', on: bagOn },
          { id: 'flyer', x: 8, y: 15, spr: 'paper', on: async S => { if (S.once('flyer')) await S.narr('地上有一张被踩脏的传单。是布伦特在学校里发的那种。'); await S.note('rules'); } },
          { x: 2, y: 14, spr: 'invisible', solid: true, on: S => S.narr('路边的树林黑得像一堵墙。风一吹，满地的落叶沙沙地滚过去，像是有很多只小动物在跑。') },
          // 站着等你的同伴是实心的（凯莉就站在后备箱旁边，非实心时玩家会踩到她身上，调查键先选中她，打不开后备箱）
          { id: 'kelly_road', x: 6, y: 12, spr: '@kelly', dir: 2, on: kellyTalk },
          { id: 'brent_road', x: 10, y: 10, spr: '@brent', dir: 0, on: brentTalk },
          { id: 'dee_road', x: 7, y: 14, spr: '@dee', dir: 3, on: deeTalk },
          { id: 'bm_road', x: 11, y: 2, spr: 'bunny', solid: false, hidden: true, light: { r: 1.2, col: 'rgba(220,220,200,.08)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.face('brent_road', 'pl');
          await S.narr('车灯熄了。四下里一下子安静得吓人，只剩风刮过树梢的声音。\n路的尽头，土堤上横着一条铁路。铁路底下，是一个黑漆漆的水泥洞口。');
          await S.say('布伦特', ['到了，各位。兔子人桥。', '1904年，克利夫顿那边有个疯人院关门，一车疯子要转去新盖的监狱。车就在这条路上翻了，跑了俩。', '警察在这片林子里搜了好几个月，只找到一堆兔子——剥了皮，挂在树上，啃了一半。', '后来，有人在那个桥洞底下找到了其中一个。吊在那儿。另一个……再也没找到。']);
          S.bubble('dee_road', '!', 1000);
          await S.say('布伦特', '从那以后，每年万圣节午夜，都有人在那个洞里看见他。穿着兔子装，拿着斧头。');
          S.face('kelly_road', 'brent_road');
          await S.say('凯莉', '我妈说那全是瞎编的。她在县图书馆上班，查过。');
          await S.say('布伦特', '那你今晚来干嘛？');
          await S.say('凯莉', '开车。顺便看着你，别把小迪吓哭。');
          await S.say('小迪', '我才不会哭！……兔子人，他真的会砍人吗？');
          S.face('dee_road', 'pl');
          const r = await S.ask('小迪抓着你的袖子，吸血鬼斗篷拖到了地上。', ['（揉揉他的脑袋）都是编出来的。', '那得看他今晚心情好不好。'], '诺亚');
          if (r === 0) await S.say('小迪', '……我就知道。我一点都不怕。');
          else { S.bubble('dee_road', '!', 900); await S.say('凯莉', '诺亚！'); await S.say('小迪', '我、我不怕！我是吸血鬼！吸血鬼不怕兔子！'); }
          await S.say('布伦特', '规矩很简单：十二点之前，四个人一起进洞，站在正中间，等教堂敲完十二下。谁先跑，谁请一个月的午饭。');
          await S.say('凯莉', '不行。我答应我妈十二点前到家。最多在洞里待五分钟。');
          await S.say('布伦特', '行行行，五分钟。诺亚，拿着——我哥的对讲机，走散了就按住说话。手电在凯莉车的后备箱里。');
          S.give('walkie');
          S.f.talked = true;
          S.goal('从凯莉车上拿手电筒');
        },
        step(S, x, y) {
          if (y >= 18) return roadBack(S);
        }
      },
      /* ---------------- 铁路桥洞 ---------------- */
      tunnel: {
        amb: 'drone', dark: .93, plr: 2.6, floor: 'asphalt', speed: .6,
        legend: { 'G': 'tunwall' },
        rows: [
          'GG:::GG',
          'GG:::GG',
          'GG:::GG',
          'GGu::GG',
          'GG::uGG',
          'GG:o:GG',
          'GG:uoGG',
          'GGo::GG',
          'GGu:uGG',
          'GG:uuGG',
          'GG:ooGG',
          'GG:::GG',
          'GG:::GG',
          'GGo::GG',
          'GG:::GG',
          'GG:uuGG',
          'GGu::GG',
          'GG:::GG'],
        ents: [
          ...[2, 3, 4].map(x => ({ x, y: 0, spr: 'invisible', touch: tunnelNorth })),
          ...[2, 3, 4].map(x => ({ x, y: 17, spr: 'invisible', touch: tunnelSouth })),
          ...[[1, 3, 0], [5, 5, 1], [1, 8, 2], [5, 11, 3], [1, 14, 4]].map(([x, y, k]) => ({ x, y, spr: 'graf', k, vert: true, on: S => S.narr([
            '「BUNNY MAN 1904」。\n数字的颜色比字母新，像是后来有人专门又描了一遍。',
            '一行字：「他就站在你后面」。\n下面有人补了一句：「骗你的」。再下面，第三种笔迹：「没骗你」。',
            '层层叠叠的名字和年份：「J+K 89」「91届毕业班到此一游」「凯文是个蠢蛋」……\n最底下的一层，旧得已经看不清了。',
            '一张画得很丑的兔子脸，两只眼睛被人用红漆涂得满满的。漆顺着墙往下流了一大截。',
            '「午夜之前离开」\n这一行喷得很大、很工整，跟周围乱七八糟的涂鸦都不一样。'][k]) })),
          { x: 4, y: 12, spr: 'candles', solid: false, light: { r: 1.8, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('泥水边上立着三根短短的蜡烛头，不知道是谁留下的。\n其中一根还在烧。……今晚，在你们之前，已经有人来过了。') },
          { id: 'rope_t', x: 3, y: 8, spr: 'hrope', solid: false, z: 1, hidden: true, on: S => S.narr('一截绳子从洞顶的铁架上垂下来，末端打着一个松垮垮的结。\n它在没有风的洞里，慢慢地转着。') },
          { id: 'kelly_tunnel', x: 3, y: 16, spr: '@kelly', solid: false, hidden: true, on: kellyTalk },
          { id: 'brent_tunnel', x: 3, y: 16, spr: '@brent', solid: false, hidden: true, on: brentTalk },
          { id: 'dee_tunnel', x: 3, y: 16, spr: '@dee', solid: false, hidden: true, on: deeTalk },
          { id: 'bm_tunnel', x: 3, y: 17, spr: 'bunny', solid: false, hidden: true, light: { r: 1.3, col: 'rgba(220,220,200,.08)' } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'tunnel1' && S.once('t1in')) {
            await S.narr('水泥洞里比外面冷得多。脚下积着一层泥水，每走一步都「咕叽」一声，像是有什么东西在吸你的鞋底。\n墙上从地面到洞顶，喷满了一层又一层的涂鸦。');
            await S.say('布伦特', '走快点，往中间走！');
            S.goal('走到桥洞正中间');
          }
          if (S.f.phase === 'final' && S.once('finIn')) {
            S.amb('drone');
            await S.narr('你们一头扎进了桥洞。\n黑暗一下子把身后的林子吞掉了。');
            await S.say('凯莉', '十一点五十九！快——快！');
            S.cp('final');
            startFinal(S);
          }
        },
        step(S, x, y) {
          if (S.f.phase === 'tunnel1' && y <= 9 && !S.f.t1ev) return tunnelEvent(S);
          if (S.f.phase === 'final' && y >= 8 && !S.f.ropeSeen) return (async () => {
            S.f.ropeSeen = true; S.show('rope_t'); S.sfx('whisper');
            await S.narr('头顶上有什么东西擦过你的头发。\n你抬起手电——一截绳子从洞顶垂下来，末端打着一个结，在没有风的洞里慢慢地转。\n刚才进来的时候，它不在这儿。');
            await S.think('别停。别看。往前走。');
          })();
        }
      },
      /* ---------------- 桥洞北边的树林 / 老农场 ---------------- */
      woods: {
        amb: 'wind', dark: .87, plr: 3.2, floor: 'dirt',
        legend: { 'y': 'leaves', 'E': 'slope', 'H': 'track' },
        tileOpts: { grassC: '#262a1a', treeC: '#5a3214', fenceBase: 'grass' },
        rows: [
          'TTPTPTTPTTTTTPTTPPPTPTPTTTTPTPPTPTTT',
          'PTTPPTPPTPPPPTPTTPTPTPPPf""""""""""f',
          'PPPTTPTPTTTPTTTPTTPPPPTTf""""""""""f',
          'TPPPPPPTPPPPTTTPTTTTTTTTf""""""""""f',
          'PPTTTTPTTPTTPTPPPPTTTPPPfddddddddddf',
          'TTTPyTyyyyyyyTyyPPPPTPPPfddddddddddf',
          'TTPPyyyyyyyyyyyyTPPTTTTPf""""""""""f',
          'PTTTyyyyyyyyyyyydddddddddddd"""""""f',
          'PPPTyyyyyyyyyyyydddddddddddd"""""""f',
          'PPTPyyyyyyyyKyyyTPPPTTPTf""""""""""f',
          'TTPTTyyyyyyyyyyTTTPPTPPTf""""""""""f',
          'TTTTTPddTPPPTTTPTTTPPPTPf""""""""""f',
          'TTTTPPddPPTTPTPPTPPPPPTPffffffffffff',
          'TPPPPPddPPPPPTPTTTPTPPPTPPPPPTTTPTPT',
          'TTPPPTddPTPTPPTPPPTTTPTPTPPTPPPPTPPT',
          '~~~~~~oo~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~oo~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          'TTTTyyyyyPTTTTPTPPPTTTTTPPPTTPPPPTTP',
          'PPPTTddddddddddPTPPTTTPPTTPPTTPTTPPP',
          'PPTTPddddddddddTTTPTPPPTPTPTTPTPPTTT',
          'PPTTTyyyyyPPPddTTPPTPTTTTTTTPTPTTPPT',
          'TPTPTTPTTPPTTddyyyyyyyTPTTTPPPPTTPPP',
          'TTTPPTPPPPPTTKyyyyyyyTTPPPTTTPPTTTPP',
          'PPPTPTPTPTTTTyyyyyyyyyPTPPPPTTTTPPPT',
          'PTTPPTPPTTTTTyyyyyyyyyPPTTTPPTTPTTTP',
          'TPTTPPTTPTTPTTyyyyyyyyTPTPTTPPTPPPTT',
          'EEEEEEEEEEEEEEEE000EEEEEEEEEEEEEEEEE',
          'HHHHHHHHHHHHHHHH000HHHHHHHHHHHHHHHHH'],
        ents: [
          ...[16, 17, 18].map(x => ({ x, y: 26, spr: 'invisible', touch: woodsMouth })),
          { x: 16, y: 25, spr: 'arch', solid: false },
          { x: 19, y: 22, spr: 'campfire', on: S => S.narr('一圈熏黑的石头，中间是冷透的灰。旁边扔着几个压扁的啤酒罐，一只破了的南瓜面具。\n每年都有人在这儿生火、喝酒、讲兔子人的故事。今年，你们就是那些人。') },
          { x: 12, y: 21, spr: 'invisible', solid: true, on: S => S.narr('树皮上刻着一个兔子头，两只长耳朵。刻痕已经长成了疤，鼓起来一圈，像是这棵树自己记住了它。') },
          { x: 13, y: 22, spr: 'invisible', solid: true, on: S => S.narr('一块长满青苔的大石头。石头上用粉笔写着：「他从北边来」。\n粉笔字被露水洇开了，像是刚写上去不久。') },
          { id: 'kelly_woods', x: 5, y: 17, spr: '@kelly', dir: 2, on: kellyTalk },   // 找到之前是实心的，join 时才改成非实心跟上来
          { id: 'shoe', x: 6, y: 12, spr: 'shoes', col: '#d8d8d0', on: async S => {
            await S.narr('泥地里扔着一只儿童运动鞋。鞋带上挂着一个塑料小蝙蝠——是小迪的。\n鞋尖朝着北边。');
            if (S.f.kelly && S.once('shoeK')) await S.say('凯莉', '……他连鞋跑掉了都没停下来。小迪，你到底看见什么了。');
          } },
          { x: 12, y: 9, spr: 'invisible', solid: true, on: S => S.narr('一块平平的大石头，上面摆着一圈小石子，围成一个圆。圆的正中间放着一根胡萝卜。\n……是哪个缺德鬼开的玩笑。应该是。') },
          { id: 'rope_w', x: 10, y: 5, spr: 'hrope', solid: false, z: 1, on: S => S.narr('空地边上那棵老橡树最低的一根枝杈上，挂着半截烂掉的绳子。\n布伦特讲的故事里，那个逃犯是吊死在桥洞底下的。不是这儿。\n……可这儿为什么也有一根？') },
          { x: 13, y: 5, spr: 'plush', on: S => S.narr('一只白色的毛绒兔子被一根钉子钉在树干上，钉子穿过它的两只耳朵中间。\n毛绒已经被雨淋得发灰、结块了。它的纽扣眼睛掉了一只。') },
          { id: 'fake_woods', x: 15, y: 6, spr: 'fakebun', dir: 1, solid: false, hidden: true, light: { r: 2.2, col: 'rgba(255,236,170,.2)', dy: -4 } },
          { id: 'ear_woods', x: 15, y: 8, spr: 'pear', solid: false, hidden: true, on: async S => {
            S.hide('ear_woods'); S.give('ear');
            await S.narr('一只粉红色的毛绒兔耳朵，夹在塑料发箍上。超市万圣节货架上九块九那种。\n耳根里面，有人用记号笔写着两个字母：「B.H.」');
            if (S.f.party && S.f.party.includes('kelly')) await S.say('凯莉', 'B.H.——布伦特·霍尔。我就知道！');
          } },
          { id: 'bm_woods', x: 24, y: 7, spr: 'bunny', dir: 1, solid: false, hidden: true, light: { r: 1.3, col: 'rgba(220,220,200,.08)' } },
          { id: 'brent_woods', x: 30, y: 5, spr: '@brentS', solid: false, hidden: true, on: brentTalk },
          { id: 'dee_woods', x: 30, y: 5, spr: '@deeG', solid: false, hidden: true, light: { r: 1.5, col: 'rgba(120,255,140,.16)' }, on: deeTalk },
          // 农场
          { id: 'house', x: 26, y: 2, w: 5, h: 2, spr: 'fhouse', on: houseOn },
          { id: 'blkO', x: 31, y: 3, spr: 'bulkhead', on: S => S.narr(S.f.phase === 'chase' ? '地窖的斜门敞着，黑洞洞的。没时间了。' : '房子侧面，贴着地基有一对斜着的木门——是地窖的门。\n门从里面闩上了。门缝里，透出一点点绿莹莹的光。') },
          { x: 26, y: 6, spr: 'stump', on: S => S.narr('一个劈柴用的木墩。墩面上有一道新砍的口子，很深。\n地上的木屑是白的、湿的——是今天晚上才劈的。\n斧头不在。') },
          { x: 33, y: 6, spr: 'well', on: S => S.narr('一口老井，井口用几块木板钉死了。木板缝里吹上来一股凉气，带着铁锈味。') },
          { x: 32, y: 9, w: 2, spr: 'pickup', on: S => S.narr('一辆没了轮子的旧皮卡，四个角垫在砖头上。\n车门上用白漆写着：「私人土地　擅入者后果自负」。字是很多年前写的，漆都起皮了。') },
          { x: 29, y: 8, w: 2, spr: 'cline', on: S => S.narr('院子里拉着一根晾衣绳。绳子上挂着一件白色的连体工作服，在风里一下、一下地鼓起来，又瘪下去。\n像是里面有人在呼吸。') },
          { x: 25, y: 10, spr: 'sign', col: '#4a3218', on: S => S.narr('一块歪倒的木牌：「此地不卖」。\n下面还钉着一块更新一点的铁皮牌，是开发商的广告：「枫林新苑——您的梦想家园，即将动工」。铁皮牌上，有一道斧头砍出来的豁口。') }
        ],
        async enter(S, first) {
          if (S.f.phase === 'woods' && S.once('woodsIn')) {
            S.plr(.9); S.amb('none');
            await S.narr('你不知道自己跑了多远。\n等你停下来的时候，桥洞已经在身后了。北边的空地上，只有你一个人。');
            await S.narr('手里的手电筒灭着。你拍了两下。又拍了两下。');
            S.sfx('switch'); plrOn(S); S.amb('wind');
            await S.narr('……亮了。');
            S.sfx('tv');
            await S.narr('口袋里的对讲机沙沙地响。你按住通话键：「布伦特？凯莉？小迪？」\n没有人回答。');
            S.sfx('cry');
            await S.narr('……西边，河的那个方向，好像有人在小声喊什么。');
            S.goal('找到走散的朋友——西边河那边好像有人');
            S.cp('woods');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.phase !== 'woods') return;
          if (!f.kelly && y <= 16 && (x === 6 || x === 7)) return (async () => {
            await S.narr('「……诺亚？是你吗？」\n河边的石头后面，有人小声叫你的名字。');
            await S.walk('pl', 'd', 5);
          })();
          if (f.kelly && !f.e2 && y <= 10 && x >= 4 && x <= 15) return fakeEncounter(S);
          if (f.e2 && !f.e3 && !f.hush && x >= 19 && x <= 22 && (y === 7 || y === 8)) return realEncounter(S);
          if (y >= 15 && y <= 16 && S.once('ford')) return S.narr('河水冰得刺骨，一下子灌进了鞋里。\n你踩着水底滑溜溜的石头，一步一步往对岸挪。');
        }
      },
      /* ---------------- 老农舍 ---------------- */
      house: {
        amb: 'room', dark: .86, plr: 3, wall: 'paper', floor: 'darkwood', wallC: { face: '#4a4434' },
        tileOpts: { rugC: '#4a2a22' },
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#..rrrr......#',
          '#..rrrr......#',
          '#..rrrr......#',
          '#............#',
          '#............#',
          '######.#######'],
        ents: [
          { x: 6, y: 9, spr: 'invisible', touch: async S => { S.sfx('locked'); await S.narr(S.f.deeFound ? '前门那边，斧头一下一下地落下来。\n不能走那边！' : '凯莉拽住了你：「小迪还没找到呢。」'); await S.walk('pl', 'u', 5); } },
          { x: 2, y: 1, spr: 'window', light: { r: 2.2, col: 'rgba(160,180,220,.08)', dy: 24 }, on: S => S.narr('窗玻璃碎了一角，用硬纸板糊着。\n外面的院子里，晾衣绳上那件白衣服还在一下一下地鼓。') },
          { x: 5, y: 1, spr: 'cal70', on: S => S.narr('墙上挂着一本旧挂历。翻在1970年10月。\n29号那一格，被人用铅笔画了一个小小的叉。之后的月份，一页也没有撕过。') },
          { x: 8, y: 1, spr: 'portrait', on: S => S.narr('一张老照片：一对老夫妇站在这栋房子门口，身后全是树。\n那时候，门廊的柱子还是白的。') },
          { x: 11, y: 1, spr: 'window', light: { r: 2.2, col: 'rgba(160,180,220,.08)', dy: 24 }, on: S => S.narr('窗外能看见远处一片光秃秃的空地，停着两台推土机。更远的地方，是一排一模一样的新房子的屋顶。') },
          { id: 'ward', x: 1, y: 2, spr: 'wardrobe', col: '#3a2818', on: wardOn },
          { x: 3, y: 2, w: 2, spr: 'coldfire', on: S => S.narr('壁炉里只剩冷灰。壁炉台上摆着一只瓷兔子，耳朵断了一只。\n灰上有一行脚印，是大人的靴子，从壁炉一直走到窗边——又走回来。') },
          { x: 6, y: 2, spr: 'bookshelf', on: S => S.narr('书架上是几十本《农夫年鉴》，按年份排得整整齐齐，从1931年到1970年。\n1971年那一格，空着。') },
          { id: 'desk', x: 8, y: 2, spr: 'desk', on: async S => {
            await S.narr('一张写字台。台面上压着一封没寄出去的信，信纸已经黄得发脆了。');
            await S.narr('「致县规划委员会：\n这是我第四次写信。你们的推土机已经开到我家地界上了。南边那片橡树林，我爷爷那辈就在那儿。你们说那叫『开发』。」');
            await S.narr('「每个周末，都有年轻人开车钻进我的林子里喝酒、放炮、扔瓶子。我跟警长说过，警长说孩子们只是在玩。\n好吧。那我也玩一玩。」\n\n信没有署名。最后那一句，被笔划掉了，又划掉了一遍。');
          } },
          { x: 10, y: 2, spr: 'stove', on: S => S.narr('铸铁炉子上搁着一口锅，锅里结了一层黑壳。\n炉子边上的柴火堆码得整整齐齐，每一根都劈得一样长。') },
          { x: 11, y: 2, spr: 'counter', on: S => S.narr('台面上放着一只空了的咖啡罐，里面插着几把旧刀叉。罐子上的标签是1969年的。') },
          { x: 12, y: 2, spr: 'sink', on: S => S.narr('水龙头拧开，「咳」地吐出一股锈水，然后就没了。') },
          { id: 'scrap', x: 8, y: 5, w: 2, spr: 'table2', col: '#4a3422', on: async S => {
            if (S.once('scrap')) await S.narr('餐桌上摊着一本剪贴簿，翻开的那一页夹着两张发黄的剪报。\n纸上落的灰，被人用手指抹掉了一块——像是不久前，有人在这儿看过。');
            await S.note('clip');
            if (S.f.party && S.f.party.includes('kelly') && S.once('clipK')) await S.say('凯莉', '1970年……我妈说的就是这个。最早的兔子人。');
          } },
          { x: 2, y: 5, spr: 'armchair', col: '#4a3a2a', on: S => S.narr('一把摇椅，坐垫被压出了一个深深的坑。\n你碰了它一下。它前后摇了很久，才停下来。') },
          { id: 'trap', x: 11, y: 7, spr: 'trapdoor', decal: true, solid: false, on: trapOn },
          { id: 'kelly_house', x: 6, y: 7, spr: '@kelly', solid: false, hidden: true, on: kellyTalk },
          { id: 'brent_house', x: 1, y: 3, spr: '@brentS', solid: false, hidden: true, on: brentTalk }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('门没锁。门轴「吱——」地叫了很长一声。\n屋里有一股霉味和冷灰的味道。家具都还在，像是住在这儿的人只是出了趟门，然后再也没回来。');
          S.sfx('knock'); S.ent('ward').ox = 1; await S.wait(120); S.ent('ward').ox = -1; await S.wait(120); S.ent('ward').ox = 0;
          await S.narr('左边墙角那个大衣柜，「咚」地响了一声。');
          await S.say('凯莉', '（小声）……有东西在里面。');
          S.goal('衣柜里有动静');
        }
      },
      /* ---------------- 地窖 ---------------- */
      cellar: {
        amb: 'drone', dark: .9, plr: 2.8, wall: 'stone', floor: 'stone',
        rows: [
          '##########',
          '##########',
          '#kkkkkkkk#',
          '#kkkkkkkk#',
          '#kkkkkkkk#',
          '#kkkkkkkk#',
          '#kkkkkkkk#',
          '##########'],
        ents: [
          { x: 2, y: 2, spr: 'ladder', solid: false, z: -1, on: S => S.narr('梯子顶上，活板门外面，斧头一下一下地落在前门上。\n咚。……咚。……咚。') },
          { x: 4, y: 2, spr: 'jars', on: S => S.narr('一架子的玻璃罐，泡着说不出颜色的东西。标签上写着「桃子 1968」「豆子 1969」。\n最后一罐上写着「1970」。里面是空的。') },
          { x: 5, y: 2, spr: 'jars', on: S => S.narr('罐子上落满了灰。有一个罐子被人拿起来过，灰上留着一圈干净的印子——小小的，是小孩的手。') },
          { id: 'blkI', x: 8, y: 1, spr: 'bulkhead', on: bulkOn },
          { x: 1, y: 5, spr: 'cage', on: S => S.narr('墙角摞着几个生锈的铁笼子，是捉兔子用的那种，笼门上挂着弹簧。\n笼子是空的。最底下那一个，笼门是开着的。') },
          { x: 1, y: 6, spr: 'cage', on: S => S.narr('笼底铺着一层干草。干草里埋着一张小纸片，上面是铅笔写的一个日期：10.31。') },
          { x: 7, y: 5, spr: 'crate', on: S => S.narr('一个木箱子，上面印着「农用炸药　小心轻放」，里面装的却是一捆捆旧报纸。\n最上面那张的标题：「县里批准新建三百户住宅」。') },
          { x: 7, y: 6, spr: 'barrel', on: S => S.narr('一只木桶，装着半桶雨水。水面上映着你的手电光，还有——\n你回头看了一眼。身后什么也没有。') },
          { id: 'dee_cellar', x: 6, y: 4, spr: '@deeG', dir: 1, solid: false, light: { r: 1.8, col: 'rgba(120,255,140,.2)' }, on: deeTalk },
          { id: 'kelly_cellar', x: 3, y: 3, spr: '@kelly', solid: false, hidden: true, on: kellyTalk },
          { id: 'brent_cellar', x: 3, y: 4, spr: '@brentS', solid: false, hidden: true, on: brentTalk }
        ],
        async enter(S, first) {
          if (!first) return;
          S.face('dee_cellar', 'pl');
          await S.narr('地窖里又潮又冷，墙是石头砌的。\n小迪手里攥着一根绿色的荧光棒，那一点点绿光，是这里唯一的亮。');
          await S.say('小迪', ['我跑啊跑……看见这个房子，就钻进来了。我把门从底下插上了。', '后来，它来了。', '它在上面走来走去，走了好久好久。然后它就站在活板门上面。一动不动。我能听见它在喘气。']);
          await S.say('小迪', '后来它学凯莉的声音叫我。「小迪，出来吧。」……可凯莉从来不会那么慢地说话。');
          S.bubble('kelly_cellar', '…', 1200);
          join(S, 'dee'); S.f.dee = true;
          S.sfx('thud'); S.shake(500, 3);
          await S.narr('头顶上，「咔嚓」一声——是木头裂开的声音。');
          await S.say('布伦特', '斜门！那边那个斜门！推开就是后院！');
          await S.say('凯莉', '十一点五十二……出去以后别停，一直往南跑，过河，穿过桥洞，就是车！');
          S.goal('从地窖斜门出去');
        }
      }
    }
  });

  /* ================= 公路 ================= */
  async function carOn(S) {
    if (!S.f.talked) return S.narr('凯莉的旧沃尔沃。');
    if (!S.has('flashlight')) {
      S.sfx('open'); S.give('flashlight'); plrOn(S);
      await S.narr('你掀开后备箱。里面塞着一条毯子、一箱机油、一盒没吃完的万圣节糖果，还有一只大手电筒。\n你拍了两下，它才亮起来。光柱打在土堤上，照亮了半截铁轨。');
      S.goal(S.f.club ? '和大家一起进桥洞' : '小迪好像有话要跟你说');
      return;
    }
    const L = ['凯莉的旧沃尔沃。车顶上那个南瓜灯是小迪刻的，一只眼睛大一只眼睛小。', '后视镜上挂着一个松香味的小树。仪表盘上的钟显示 11:09——比实际快了三分钟，凯莉说这样她就永远不会迟到。', '后座上扔着一件小迪的毛衣，还有一本翻烂了的《鸡皮疙瘩》。'];
    await S.narr(L[(S.f._car = ((S.f._car ?? -1) + 1) % L.length)]);
  }
  async function bagOn(S) {
    S.f.sawBag = true;
    await S.narr('布伦特的运动包，拉链没拉严。\n缝里露出一撮粉红色的毛——像是什么毛绒玩具。或者……一件衣服。');
    if (S.once('bagB')) { S.bubble('brent_road', '!', 900); await S.say('布伦特', '嘿！别乱翻！那是……是我的换洗衣服。'); await S.say('凯莉', '（小声）粉红色的换洗衣服？'); }
  }
  async function kellyTalk(S) {
    const f = S.f, e = S.ent('kelly_' + S.map); if (e) S.face(e.id, 'pl');
    if (S.map === 'woods' && !f.kelly) return kellyFound(S);
    const L = {
      road: ['我妈说，每年万圣节，县里的警察都会来这儿抓试胆的小孩。……所以咱们动作快点。', '布伦特每回讲的都不一样。上礼拜是1904年，上上礼拜是1903年；逃犯有时候两个，有时候三个。', '布伦特那个包，从上车就一直不让人碰。他肯定憋着什么坏。', '小迪非要跟来。我妈说，他要是做噩梦，就让我陪他睡一个月。'],
      tunnel: ['……别回头。我是说，回头也没什么。就是别回头。', '这里面怎么比外面冷这么多。'],
      woods: ['我的脚……没事，能走。别管我，先找小迪。', '你听见了吗？……砍木头的声音。从北边。', '我妈的便条上写着，纸上没有。纸上没有，不代表——算了。'],
      house: ['这房子……像是有人一直住到某一天，然后突然不住了。', '十一点四十了。'],
      cellar: ['出去以后一直往南跑。别停。']
    }[S.map] || ['……'];
    await S.say('凯莉', L[(f._kl = ((f._kl ?? -1) + 1) % L.length)]);
  }
  async function brentTalk(S) {
    const f = S.f, e = S.ent('brent_' + S.map); if (e) S.face(e.id, 'pl');
    const L = f.brentFound
      ? ['对不起，好吗？我就是想吓吓你们。我没想到……会有真的。', '我那身衣服是在超市买的，九块九。它那身……它那身不是衣服。', '要是能出去，我再也不来了。我发誓。']
      : S.map === 'road' ? ['传单上都写着呢，自己看。', '我表哥说的版本更狠：他专找万圣节午夜还待在洞里的人。第二天，人就挂在桥上。', '你怕了？没事，我在前面给你们开路。', '十二点整，教堂会敲钟。在这儿听得特别清楚。'] : ['走啊，到中间去！'];
    await S.say('布伦特', L[(f._bl = ((f._bl ?? -1) + 1) % L.length)]);
  }
  async function deeTalk(S) {
    const f = S.f, e = S.ent('dee_' + S.map); if (e) S.face(e.id, 'pl');
    if (S.map === 'road' && !f.club) {
      await S.say('小迪', ['诺亚诺亚！你看——这是我们俱乐部的会员卡！', '我给你也做了一张。你是荣誉会员！上面有暗号，不许告诉布伦特。']);
      S.sfx('item'); await S.note('club');
      f.club = true;
      await S.say('小迪', '要是兔子人来了，我就躲起来。谁敲门敲得不对，我就不开！');
      S.goal(S.has('flashlight') ? '和大家一起进桥洞' : '从凯莉车上拿手电筒');
      return;
    }
    const L = f.dee
      ? ['我没哭。是荧光棒太亮了，刺眼睛。', '我的鞋跑丢了一只……妈妈会骂我的。', '诺亚，你敲暗号的时候，我就知道是你。']
      : ['我是吸血鬼。吸血鬼不怕兔子。', '如果兔子人来了，我就用牙咬他！', '凯莉说十二点前要回家，不然妈妈会把我们的万圣节糖果都没收。'];
    await S.say('小迪', L[(f._dl = ((f._dl ?? -1) + 1) % L.length)]);
  }
  async function enterTunnel(S) {
    const f = S.f;
    if (f.phase) return;
    if (!f.talked) return;
    if (!S.has('flashlight')) { S.sfx('locked'); await S.narr('洞口里黑得什么也看不见。\n得先拿上手电筒——在凯莉车的后备箱里。'); return S.walk('pl', 'd', 5); }
    if (!f.club) { await S.say('小迪', '诺亚！等等！我还有东西要给你！'); return S.walk('pl', 'd', 5); }
    S.face('brent_road', 'pl');
    await S.say('布伦特', '都到齐了？……走吧。');
    f.phase = 'tunnel1'; f.party = ['kelly', 'brent', 'dee'];
    await S.go('tunnel', 3, 16, 3);
  }
  /* 第三结局：没进洞，回车上等 */
  async function roadBack(S) {
    const f = S.f;
    if (!f.talked || f.phase) return S.walk('pl', 'u', 5);
    await S.narr('往回走？……路那头连一盏灯都没有。\n凯莉的车就停在身后。车里暖和，后座上还有半盒万圣节糖果。');
    const v = await choose(S, '真的要进那个洞吗？', ['……说好了的。回去', '我不去了。回车上等他们'], '诺亚', 0,
      '一个说「回车上等」，一个说「说好了的」。\n你们在路中间僵了半天——最后，还是转身往回走了。');
    if (v === 0) return S.walk('pl', 'u', 5);
    f.phase = 'car';
    S.face('brent_road', 'pl');
    await S.say('布伦特', '诺亚？……行吧。胆小鬼请一个月午饭。');
    await S.say('凯莉', '车钥匙给你。锁好车门，谁敲都别开。我们五分钟就回来。');
    S.bubble('dee_road', '…', 1200);
    await S.say('小迪', '诺亚……你不来，谁保护我啊。');
    await S.fade(1, 900);
    S.sfx('close');
    await S.card('11:41', '凯莉的车里', '你锁上车门，缩在后座上，把小迪的毛衣盖在腿上。\n对讲机一直开着，沙沙地响。\n\n三道手电光，一点一点地被桥洞吞了进去。');
    S.sfx('tv'); await S.wait(600); toll(S); await S.wait(900); S.sfx('knock'); await S.wait(1000); S.sfx('knock'); await S.wait(1000); S.sfx('knock');
    return S.end({ bad: true, id: 'car', title: '在车里等的人', text: '十二点整，镇上的教堂敲响了第一下。\n就在那时候，有人敲了敲车窗。\n咚。……咚。……咚。\n很慢。很有耐心。\n你以为是布伦特回来吓你，把脸埋在毛衣里，没有抬头。\n\n十二点十分，三个人嘻嘻哈哈地从桥洞里跑了出来。布伦特套着一身粉红色的兔子装，笑你是胆小鬼。\n「我们一直在洞里啊，」他说，「谁也没往车这边来过。」\n\n小迪一直没说话。\n凯莉发动车子的时候，你看见车窗外面多了一道划痕。很长，从车门一直拖到后备箱——\n像是什么不反光的金属，被慢慢地拖了过去。' });
  }

  /* ================= 桥洞 ================= */
  async function tunnelSouth(S) {
    const f = S.f;
    if (f.phase === 'final') return goodEnd(S);
    if (f.phase === 'tunnel1') { await S.say('布伦特', '怎么，这就怂了？一个月的午饭哦。'); return S.walk('pl', 'u', 5); }
  }
  async function tunnelNorth(S) {
    if (S.f.phase === 'tunnel1') { await S.say('凯莉', '就在中间等着吧，别乱跑。'); return S.walk('pl', 'd', 5); }
  }
  async function tunnelEvent(S) {
    const f = S.f; f.t1ev = true;
    S.amb('bus'); S.shake(2400, 2); horn(S, 0, 1.1); horn(S, 1.4, 2.2); S.tone('triangle', 55, 46, 3.4, .12, 0, 220);
    await S.narr('头顶上传来一阵越来越响的轰隆声——\n是火车。整座桥洞都在发抖，洞顶的灰簌簌地往下掉，掉进你的领口里。');
    S.amb('drone');
    await S.say('布伦特', '……好了。几点了？');
    await S.say('凯莉', '十一点十二。');
    await S.say('布伦特', '还早呢。我去北口看看，别让别人抢了咱们的位子。');
    leave(S, 'brent');
    await S.walk('brent_tunnel', [3, 1], 5);
    await S.alpha('brent_tunnel', 0, 500);
    await S.say('凯莉', '布伦特！……他又在搞什么鬼。');
    await S.wait(700);
    S.sfx('tv');
    await S.narr('口袋里的对讲机「沙——」地响了一声。\n你按住通话键：「布伦特？」');
    S.sfx('whisper');
    await S.narr('没有回答。\n只有呼吸声。很慢，很重，像是隔着一层厚厚的绒布。');
    await S.say('凯莉', '布伦特，你无不无聊。');
    await S.wait(500);
    S.bubble('dee_tunnel', '!', 1400);
    await S.say('小迪', '诺……诺亚。后面。', { style: 'whisper' });
    S.turn(0);
    const b = S.ent('bm_tunnel'); b.alpha = 0; S.place('bm_tunnel', 3, 17, 3);
    S.focus(3, 15);
    S.sfx('heart'); await S.alpha('bm_tunnel', .92, 1600);
    await S.narr('南口。你们刚刚走进来的地方，站着一个人。\n很高。白色的。头顶上，竖着两只长长的耳朵。');
    S.sfx('heart');
    await S.narr('它的一只手垂在身侧，手里拖着什么东西，尖端抵在地上。');
    S.sfx('cut'); scrape(S); scrape(S, .9);
    await S.narr('「嚓——」\n金属刮过水泥地的声音，在洞里来回地撞。');
    await S.walk('bm_tunnel', 'u', 1.2);
    S.plr(.5); await S.wait(200); S.plr(2.6); await S.wait(150); S.plr(.4);
    S.focus(null);
    await S.scare('flash', { sfx: 'scream', dur: .7 });
    await S.narr('小迪尖叫着往北口跑。凯莉喊着他的名字追了上去——\n手电筒灭了。');
    S.plr(.3);
    await S.narr('黑暗里，你也跑了起来。');
    f.party = []; S.hide('bm_tunnel'); S.hide('kelly_tunnel'); S.hide('dee_tunnel');
    f.phase = 'woods';
    await S.go('woods', 17, 24, 3, { ms: 700 });
  }

  /* ================= 树林 ================= */
  async function kellyFound(S) {
    const f = S.f;
    S.bubble('kelly_woods', '!', 1000);
    await S.say('凯莉', ['诺亚！……你看见小迪了吗？', '我追着他跑，他跑得比兔子还快——脚踩进石头缝里，扭了。']);
    await S.narr('凯莉坐在河边的石头上，一只手按着脚踝。她的女巫帽歪到了一边，帽檐上全是泥。');
    await S.say('凯莉', ['我看见他过河了，往北边去了。', '……桥洞里那个，是布伦特吧？肯定是他。他包里那团粉红色的毛，' + (f.sawBag ? '你也看见了。' : '我上车的时候就看见了。') + '他想扮兔子人吓我们。']);
    const r = await S.ask('她看着你，像是在等你点头。', ['……那个人，比布伦特高。', '肯定是他。等找到他，揍他一顿。'], '诺亚');
    if (r === 0) { await S.say('凯莉', '……'); await S.say('凯莉', '别这么说。求你了。'); }
    else await S.say('凯莉', '算我一份。');
    await S.say('凯莉', '对了，这个给你——我妈复印的东西。本来想拿出来堵布伦特的嘴的。');
    await S.note('archive');
    await S.say('凯莉', '扶我一把。我能走。……十一点二十。我们得在十二点之前把小迪找回来。');
    f.kelly = true; join(S, 'kelly');
    S.goal('小迪往北跑了——过河去找他');
  }
  async function fakeEncounter(S) {
    const f = S.f; f.e2 = true;
    S.show('fake_woods'); S.place('fake_woods', 15, 6, 1); S.focus(13, 7);
    S.sfx('whisper');
    await S.narr('空地的另一头，树影里，亮起了一团光。\n光是从下往上打的，照着一张脸——一张兔子的脸。');
    await S.narr('粉红色的毛绒连体衣。一只耳朵竖着，另一只软塌塌地耷拉在脑袋一边。\n它手里拎着一把斧头，被光一照，亮得像锡纸。');
    S.sfx('step');
    await S.narr('它往前走了一步。脚底下「咔嚓」一声，踩断了一根树枝。');
    S.sfx('giggle');
    await S.narr('……然后，兔子头底下，漏出了一声没憋住的笑。');
    await S.say('凯莉', '（小声）……那身衣服，你不觉得眼熟吗？', { style: 'whisper' });
    const r = await choose(S, '粉红色的兔子在空地那头站着，一手打着手电，一手拎着斧头。', ['走过去看看', '关掉手电，躲到树后面']);
    if (r === 0) {
      await S.walk('pl', [[S.pl.x, 8], [10, 8]], 4);
      S.sfx('giggle');
      await S.narr('你刚走出两步，兔子就怪叫了一声，扭头就跑。\n「哇哦哦哦——兔子人来啦——」\n……那个破锣嗓子，你在学校走廊里听了三年。');
    } else {
      S.plr(1);
      await S.narr('你关掉手电，拉着凯莉缩到一棵橡树后面。\n粉兔子左看看，右看看，挠了挠头，嘟囔了一句：「人呢？」\n……那个破锣嗓子，你在学校走廊里听了三年。');
      plrOn(S);
    }
    S.show('ear_woods');
    await S.walk('fake_woods', [[16, 7], [22, 7]], 4.5);
    await S.alpha('fake_woods', 0, 400);
    S.focus(null);
    await S.narr('它一路蹦蹦跳跳地往东边跑了，跑过的地方，掉下来一样粉红色的东西。');
    await S.say('凯莉', '布伦特！你给我回来！小迪都被你吓丢了！');
    S.goal('那只粉兔子往东跑了——跟上去');
  }
  async function realEncounter(S, retry) {
    const f = S.f;
    S.cp('e3');
    const b = S.ent('bm_woods'); b.alpha = 0; S.place('bm_woods', 24, 7, 1);
    S.focus(22, 7); S.amb('none');
    await S.alpha('bm_woods', .95, retry ? 900 : 1500);
    if (retry) {
      await S.narr('农场的栅栏门口，那只兔子还站在那儿。一动不动。\n旧得发灰的白色。两只耳朵直直地竖着，风吹过来，一根毛都没有晃。');
    } else {
      await S.narr('前面就是农场的栅栏门。\n门口，站着一只兔子。');
      await S.say('凯莉', '（小声）……又是他。布伦特，你有完没完——', { style: 'whisper' });
      await S.narr('它是白色的。旧得发灰，胸口和膝盖上有大片大片说不清颜色的污渍。\n两只耳朵直直地竖着，风吹过来，一根毛都没有晃。');
      await S.narr('你的手电光打在它脸上。它没有眯眼。\n那张脸上，只有两个黑洞。');
      S.sfx('tv');
      await S.narr('口袋里的对讲机响了。沙沙声里，是那个呼吸声。很慢，很重。\n……和它的肩膀起伏的节奏，一模一样。');
      await S.narr('它手里也拎着一把斧头。斧头没有反光。\n风停了。满地的落叶里，它站着的那一片，一片叶子也没有响。');
    }
    const r = await choose(S, '凯莉攥紧了你的胳膊。', ['是布伦特。走过去，揪下它的耳朵', '关掉手电，拉着凯莉蹲下，别出声'], null, 1,
      '你的脚刚往前挪了半步，就被另一只手死死拽了回来。\n一个想过去，一个不让——你们谁也没有再动。');
    if (r === 0) {
      await S.walk('pl', 'r', 3);
      await S.narr('你走过去，伸手去抓那只耳朵。\n它没有躲。');
      await S.narr('你的手指碰到了那只耳朵。\n……是冰的。硬的。不是毛绒。像是缝在一张皮上。');
      S.amb('drone'); scrape(S);
      await S.scare('face', { face: 'bunny', sfx: 'scream', dur: 1.1 });
      return S.die('它慢慢地低下头，看着你。\n你听见斧头从它手里滑下来，斧刃擦过地面的声音——\n很近。非常近。', '那不是布伦特');
    }
    S.sfx('switch'); S.plr(.7);
    await S.narr('你关掉手电，拉着凯莉蹲进路边的灌木丛里。凯莉用手捂住了自己的嘴。\n对讲机——你一把按住了它，塞进怀里。');
    S.sfx('heart');
    await S.narr('它歪了一下头。\n像是在听。');
    // 屏息：把控制交还给玩家，这几秒里一步也不能走（tick 里用 S.moving 判定）
    S.goal('别动。一步也别动——等它走开');
    if (S.coop) S.toast('操作的人，手离开方向键');
    f.hush = true; HUSH = 0;
    S.timer(4.5, null, hushDone);
  }
  async function hushCaught(S) {
    S.f.hush = false;
    S.sfx('step'); S.shake(200, 1);
    await S.narr('你的脚底下，「咔嚓」一声——\n一根枯树枝断了。');
    S.face('bm_woods', 'pl'); S.sfx('heart');
    await S.narr('那张没有眼睛的脸，慢慢地转了过来。');
    S.amb('drone'); scrape(S);
    await S.scare('face', { face: 'bunny', sfx: 'scream', dur: 1.1 });
    return S.die('它没有跑。它只是一步一步地走过来，像是早就知道你在哪儿。\n凯莉捂着嘴的那只手，一直在抖。', '你动了');
  }
  async function hushDone(S) {
    const f = S.f; f.hush = false;
    S.sfx('heart');
    await S.narr('它站了很久。\n然后，它转过身，一步一步地走进了农场的院子。\n没有脚步声。');
    await S.alpha('bm_woods', 0, 1600);
    S.hide('bm_woods'); S.focus(null);
    await S.wait(600);
    S.amb('wind'); plrOn(S);
    await S.narr('等你再打开手电的时候，栅栏门口什么也没有了。\n门柱上，多了一道新鲜的斧痕。木头茬子还是白的。');
    await S.say('凯莉', '那……那不是布伦特。对吧？对吧？');
    S.sfx('tv');
    await S.say('对讲机', ['……诺亚？诺亚你在吗？', '我在农舍里……我躲起来了。外面有个东西……', '那不是我。那不是我！'], { style: 'whisper' });
    f.e3 = true;
    S.goal('布伦特在农舍里——去找他');
    S.cp('farm');
  }
  async function woodsMouth(S) {
    const f = S.f;
    if (f.phase === 'chase') {
      S.stop('bm_woods'); S.hide('bm_woods');
      f.phase = 'final';
      return S.go('tunnel', 3, 1, 0);
    }
    if (f.phase === 'woods') {
      await S.narr('你回头看了一眼桥洞。黑漆漆的洞口里，什么也看不见。\n……你不敢回去。至少现在不敢。先把大家找齐。');
      return S.walk('pl', 'u', 5);
    }
  }

  /* ================= 农舍 ================= */
  async function houseOn(S) {
    const f = S.f;
    if (f.phase === 'chase') return S.narr('前门在你们身后一下一下地响着。别回头。');
    if (!f.e3) return S.narr('一栋两层的老农舍，窗户全黑着。');
    await S.narr('一栋两层的老农舍。门廊的柱子上，全是一道一道的斧痕，有新有旧，像是很多年里一直有人在这儿砍。\n前门虚掩着一条缝。');
    S.sfx('open');
    await S.go('house', 6, 8, 3);
  }
  async function wardOn(S) {
    const f = S.f, w = S.ent('ward');
    if (f.brentFound) return S.narr('衣柜门敞着，里面挂着几件男人的旧外套，都是一个尺码。地上散着布伦特的帽子和运动包。');
    w.open = true; S.sfx('open'); S.shake(300, 2);
    S.place('brent_house', 1, 3, 0);
    await S.say('???', '啊啊啊啊啊——别砍我！别砍我！！', { style: 'big' });
    await S.narr('一个粉红色的东西从衣柜里滚了出来，抱着脑袋缩成一团。');
    await S.say('布伦特', '……诺亚？凯莉？');
    await S.narr('是布伦特。他身上套着一件粉红色的兔子连体衣，兔头套抱在怀里，' + (S.has('ear') ? '头套上只剩一只耳朵。' : '一只耳朵不见了。') + '\n他抖得像一片叶子。');
    await S.say('凯莉', '布伦特·霍尔。你这个——');
    await S.say('布伦特', ['好吧好吧！是我！我承认！', '我本来想吓你们的。这身衣服我早就藏在包里了。我想着，进了洞以后我溜去北口，换上衣服，再从林子里跳出来。']);
    await S.say('布伦特', ['可是桥洞里那个……不是我。', '那时候我刚出北口，还在灌木丛里换衣服，一条腿都没套进去。然后我就听见小迪在尖叫。']);
    await S.say('布伦特', ['我想着，反正都乱了，干脆吓到底。我就穿着这身在林子里乱跑，打着手电照自己的脸。', '……然后我跑到农场门口，看见了它。', '它就站在那儿。跟我一样的耳朵，一样拿着斧头。可是它不是衣服。诺亚，它不是衣服。']);
    const r = await S.ask('布伦特死死地抓着你的袖子。', ['我们也看见了。', '……你确定不是你那些朋友？'], '诺亚');
    if (r === 1) await S.say('布伦特', '我就你们几个朋友！');
    await S.say('布伦特', '我躲进来以后，就一直听见……地板底下有人在哭。我不敢去看。');
    await S.say('凯莉', '……小迪！');
    f.brentFound = true; join(S, 'brent');
    S.goal('地板底下有人在哭——找到活板门');
  }
  async function trapOn(S) {
    const f = S.f, t = S.ent('trap');
    if (f.deeFound) return;
    if (!f.brentFound) {
      await S.narr('地板上有一块方形的活板门。铁环冰凉冰凉的。\n你拽了一下——从下面闩上了。');
      S.sfx('knock'); S.ent('ward').ox = 1; await S.wait(150); S.ent('ward').ox = 0;
      return S.narr('……屋角那个衣柜，又「咚」地响了一声。');
    }
    if (S.once('trapIntro')) {
      await S.narr('你蹲下来，把耳朵贴在活板门上。\n底下，有人在很小声很小声地抽鼻子。');
      await S.say('凯莉', '小迪？小迪，是你吗？是姐姐！');
      await S.say('小迪（门下）', ['走开！', '你骗人！刚才它也学你的声音叫我了！学得一模一样！'], { style: 'whisper' });
      await S.say('凯莉', '……什么？');
      await S.say('小迪（门下）', '你要真是你们，就敲暗号！俱乐部的暗号！敲错了我就不开！', { style: 'whisper' });
      S.goal('敲出俱乐部的暗号（小迪的会员卡在「笺」里）');
      if (S.coop) S.toast('一个人在「笺」里翻出会员卡念暗号，一个人对着活板门敲');
    }
    const v = await S.keypad('敲暗号：咚 = 敲一下，停 = 停一拍（键盘 1 / 2）', ['咚', '停'], 6, { alias: { '1': '咚', '2': '停' } });
    if (v == null) return;
    for (const ch of v) { if (ch === '咚') S.sfx('knock'); await S.wait(ch === '咚' ? 240 : 560); }
    if (v !== '咚咚停咚咚咚') {
      f.knockFail = (f.knockFail || 0) + 1;
      const g = v.split('停').filter(x => x).map(x => x.length).join('');
      const why = !v.includes('停') ? '你一口气敲个不停，跟啄木鸟似的！'
        : g === '32' ? '先敲几下？你敲反了！'
        : (v.match(/停/g) || []).length > 1 ? '你停了好几次！暗号只停一次！'
        : '不对！';
      await S.say('小迪（门下）', [why + '走开！', why + '你是怪物！怪物不知道暗号！'][f.knockFail % 2], { style: 'whisper' });
      if (f.knockFail === 2) await S.say('凯莉', '诺亚，他给你的那张会员卡呢？上面画着暗号。（打开「笺」看看）');
      else if (f.knockFail >= 3) await S.say('凯莉', '我记得卡上画的是两个点、空一格、三个点……「敲两下，停一下，再敲三下」。');
      return;
    }
    await S.wait(500);
    await S.say('小迪（门下）', '……诺亚？', { style: 'whisper' });
    S.sfx('open'); t.open = true; t.s.glow = true;
    await S.narr('门闩「咔哒」一声拉开了。活板门被从底下顶开一条缝——\n一根绿色的荧光棒先探了出来，然后是小迪的脸。满脸鼻涕眼泪，吸血鬼的塑料尖牙还咬在嘴里。');
    await S.say('小迪', '我就知道……我就知道你们会敲对的。');
    await S.say('凯莉', '小迪！……你这个小笨蛋。');
    f.deeFound = true;
    await S.wait(900);
    S.sfx('knock'); await S.wait(1000); S.sfx('knock'); await S.wait(1000); S.sfx('knock');
    await S.narr('屋子前门那边，传来三下敲门声。\n很慢。很有耐心。');
    await S.say('小迪', '（小声）……就是这样。刚才它就是这么敲的。慢慢的，三下。', { style: 'whisper' });
    await S.say('小迪', '它不知道暗号。', { style: 'whisper' });
    await S.wait(900);
    S.sfx('thud'); S.sfx('cut'); S.shake(600, 4);
    await S.narr('咚——！\n前门在门框里猛地一跳。');
    S.sfx('thud'); S.sfx('cut'); S.shake(600, 4);
    await S.narr('是斧头。');
    await S.say('布伦特', '下去！都下去！');
    await S.fade(1, 500);
    await S.go('cellar', 2, 3, 0);
  }
  async function bulkOn(S) {
    if (!S.f.dee) return;
    S.sfx('open'); S.ent('blkI').open = true;
    await S.narr('你用肩膀顶住斜门，使劲一推——门闩崩开了。\n冷风一下子灌了进来。');
    S.ent('blkO').open = true;
    await S.go('woods', 31, 4, 0);
    S.sfx('thud'); S.shake(400, 3);
    await S.narr('你们一个接一个地爬出地窖。\n房子正面，传来一下、一下劈木头的声音。然后，停了。');
    S.focus(28, 4);
    await S.wait(500);
    await S.narr('门廊底下，一个白色的东西慢慢地转过身来。\n它就站在你们和院子门之间。');
    S.focus(24, 7); await S.wait(500);
    await S.say('凯莉', '别往它那边跑！绕过去——先往下，再从院子门出去，往西！');
    S.focus(null);
    S.cp('chase');
    startChase(S);
  }
  function startChase(S) {
    const f = S.f; f.phase = 'chase';
    if (!f.party || !f.party.includes('dee')) f.party = ['kelly', 'brent', 'dee'];
    plrOn(S); S.amb('drone');
    S.ent('blkO').open = true;
    const b = S.ent('bm_woods'); b.alpha = 1; S.place('bm_woods', 28, 4, 2);
    S.chase('bm_woods', { spd: 2.9, wait: 2.6, catch: caughtReal });
    S.goal('跑！过河，穿过树林，回到桥洞！');
  }

  /* ================= 午夜 ================= */
  function startFinal(S) {
    const f = S.f; f.phase = 'final';
    if (!f.party || f.party.length < 3) f.party = ['kelly', 'brent', 'dee'];
    S.ent('brent_tunnel').spr = '@brentS'; S.ent('brent_tunnel').alpha = 1; S.ent('dee_tunnel').spr = '@deeG';
    S.ent('dee_tunnel').light = { r: 1.5, col: 'rgba(120,255,140,.16)' };
    plrOn(S); S.dark(.95);
    const b = S.ent('bm_tunnel'); b.alpha = .95; S.place('bm_tunnel', 3, 0, 0);
    // 实测：洞里泥水让人走得慢（走 2.5 格/秒、跑 4.1 格/秒），走完 16 格约 6.5 秒，跑约 4 秒；
    // 原来 24 秒且对话时暂停，等于没有压力。改为 18 秒、看绳子/读涂鸦时也照走
    S.chase('bm_tunnel', { spd: 2.6, wait: 2.6, catch: caughtReal });
    S.timer(18, '午夜', midnight, { during: true });
    S.goal('钟声响起之前，穿过桥洞！');
  }
  async function midnight(S) {
    S.stop('bm_tunnel');
    S.amb('none');
    toll(S);
    await S.narr('远处，镇上的教堂敲响了第一下。');
    await tolls(S, 4, 900);
    await S.narr('你还站在桥洞里。泥水没过了脚踝。');
    await tolls(S, 4, 900);
    S.plr(.8); S.ent('bm_tunnel').alpha = 1;
    await S.narr('手电筒的光一跳一跳地暗了下去。\n你身后，有什么东西，站住了。');
    await tolls(S, 2, 900);
    await S.narr('你没有回头。');
    toll(S); S.plr(0); S.dark(1);
    await S.wait(1400);
    return S.end({ bad: true, id: 'bells', title: '钟声响完的时候', text: '第十二下钟声，在你们头顶上停了下来。\n\n第二天一早，巡逻的警察在桥洞南口发现了一辆没熄火的旧沃尔沃，车顶上的南瓜灯还亮着。\n洞里的泥水上，漂着一只手电筒和一只粉红色的兔耳朵。一只对讲机泡在水里，还开着，沙沙地响。\n\n后来，桥洞的墙上多了一行新的涂鸦，喷得很大、很工整：\n「午夜之前离开」' });
  }
  async function goodEnd(S) {
    const f = S.f;
    S.clearTimer(); S.stop('bm_tunnel'); S.hide('bm_tunnel');
    f.phase = 'done';
    S.ent('brent_road').spr = '@brentS'; S.ent('dee_road').spr = '@deeG';
    await S.go('road', 11, 3, 0);
    S.amb('wind');
    await S.narr('你们一口气冲出了桥洞南口。\n凯莉的车还停在那里，车顶上的南瓜灯一闪一闪。');
    await S.say('凯莉', '上车！快——');
    toll(S);
    await S.narr('远处，镇上的教堂敲响了第一下。');
    await tolls(S, 5, 800);
    await S.narr('你回过头。');
    S.focus(11, 2);
    const b = S.ent('bm_road'); b.alpha = 0; S.place('bm_road', 11, 1, 0);
    await S.alpha('bm_road', .85, 1600);
    await S.narr('桥洞里，洞口往里两三步的地方，站着一个白色的人影。两只长耳朵一动不动。\n它没有追出来。');
    await tolls(S, 6, 800);
    await S.narr('它只是站在那里，斧头垂在身边，像是在数着什么。\n数到第十二下，钟声停了。');
    await S.alpha('bm_road', 0, 1800);
    S.focus(null);
    await S.narr('洞口里，什么也没有了。');
    await S.say('布伦特', '……我再也不来了。我发誓。');
    await S.say('小迪', '我要告诉俱乐部……不。我谁也不告诉。');
    S.ent('pump').off = true; S.ent('pump').light = null;
    if (S.has('ear')) {
      S.take('ear'); S.show('ear_road');
      await S.narr('车顶上的南瓜灯，不知道什么时候灭了。\n南瓜灯旁边，放着一样东西——一只粉红色的毛绒兔耳朵。');
      await S.narr('你摸了摸口袋。\n……空的。');
      await S.say('凯莉', '别碰它。上车。');
    } else {
      await S.narr('车顶上的南瓜灯，不知道什么时候灭了。\n车门把手上，挂着一撮白色的、发灰的毛。');
      await S.say('凯莉', '别碰它。上车。');
    }
    S.sfx('car');
    await S.fade(1, 1400);
    await S.card('第二天', '1995年11月1日', '凯莉的妈妈什么也没问。\n她只是在早饭桌上放了一张复印件——1970年10月，县里的两份报告。\n\n「纸上找不到的东西，」她说，\n「不代表它发生过。也不代表它没有。」\n\n那天下午，四个人一起去了县图书馆。\n谁也没有提起那只兔耳朵。');
    await S.end({ id: 'home', title: '第五夜　完', text: '后来每年万圣节，县里的警车都会停在科尔切斯特路的桥洞口，\n把车灯开得很亮，把想进洞的高中生一个一个劝回去。\n\n警察说，那是为了大家的安全。\n\n小迪长大以后，也当了警察。\n每年十月三十一号的晚上，他都主动申请去那个桥洞值班。\n十二点整，他会把车窗摇下来，对着洞口，\n敲两下，停一下，再敲三下。' });
  }
})();
