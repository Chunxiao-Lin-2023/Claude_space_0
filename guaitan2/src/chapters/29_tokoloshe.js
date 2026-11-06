/* ================= 第二十九夜 · 托克洛希 ================= */
(() => {
  /* 主题：砖、水、孩子的眼睛——以及猜疑。
     核心玩法：垫床脚。每张床四条腿都要踩在砖上；托克洛希会偷砖，喝了水就隐身，只有孩子看得见。
     夜里靠西菲的指向（他坐在床上伸手指、喊方位）和地上的水迹找它，扑住它三回，它就吐出隐身的石子。
     双人：一人盯西菲的喊声和水迹报方位、一人去扑；河边一人翻「笺」对四样线索、一人去放石子。 */

  /* ---------- 跨重来保留（只影响提示） ---------- */
  let DIED = 0, SLEPT = 0, WRONGMAX = 0, LEFT = 240, BLAMED = 0;
  const DRIPT = [];   // 每个水迹实体放下的时间（W.t）
  let DRIPI = 0, SHOUT = 0, PT = 0, HB = 0;

  /* ---------- 床与位置（屋里） ---------- */
  const DOOR = [6, 9], DRINK = [13, 6];
  const BEDS = {
    bed_g: { st: [2, 3], name: '奶奶的床', who: '奶奶', sn: '奶奶的床', at: '奶奶床边' },
    bed_s: { st: [7, 3], name: '西菲的床', who: '西菲', sn: '我的床', at: '我床底下' },
    bed_m: { st: [13, 3], name: '你的床', who: '你', sn: '你的床', at: '你床边' }
  };
  const SPD = { go: 2.7, carry: 2.9, flee: 4.4 }, STEAL = 2.4, DZT = 20;
  const tpos = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  function stepTo(e, tx, ty, spd) {
    const [ex, ey] = tpos(e); if (ex === tx && ey === ty) return true;
    if (e.mv) return false;
    const d = bfsStep(curMap(), ex, ey, tx, ty, e); if (d >= 0) startMove(e, d, spd);
    return false;
  }
  function zone(x, y) {
    if (y <= 4) return x <= 4 ? '在奶奶屋里' : x <= 9 ? '在我屋里' : '在你屋里';
    if (y === 5) return x <= 4 ? '在奶奶屋门口' : x <= 9 ? '在我屋门口' : '在你屋门口';
    if (x >= 10) return '在厨房，水缸那边';
    if (x >= 5) return '在大门那块';
    return '在过道西头';
  }

  /* ---------- 合成音 ---------- */
  const drip = (S, v = .05) => S.tone('sine', 1900, 1100, .06, v, 0, 0);
  const gulp = S => { for (let i = 0; i < 3; i++) S.tone('sine', 230, 130, .12, .1, i * .32, 600); };
  const scrape = S => { S.tone('sawtooth', 190, 120, .28, .05, 0, 900); S.tone('square', 95, 80, .2, .03, .05, 400); };
  const thud = (S, n = 1) => { for (let i = 0; i < n; i++) { S.tone('triangle', 150, 70, .12, .14, i * .18, 900); S.tone('sine', 90, 48, .16, .12, i * .18, 0); } };
  const squeal = S => { S.tone('square', 900, 1700, .14, .045, 0, 2600); S.tone('sawtooth', 1500, 700, .22, .04, .12, 2200); };
  const cough = S => { for (let i = 0; i < 2; i++) S.tone('sawtooth', 320, 110, .13, .06, i * .3, 800); S.tone('sine', 2400, 1600, .05, .05, .7, 0); };
  const bleat = S => { S.tone('sawtooth', 430, 400, .5, .03, 0, 1500); S.tone('sawtooth', 446, 410, .5, .02, .03, 1500); };
  const heart = S => { S.tone('sine', 62, 46, .14, .08, 0, 200); S.tone('sine', 58, 44, .16, .07, .2, 200); };
  const rooster = (S, v = .03) => { S.tone('square', 560, 820, .18, v, 0, 1800); S.tone('square', 820, 900, .3, v, .2, 1800); S.tone('square', 900, 620, .45, v, .52, 1800); };
  const hum = S => { [196, 220, 247, 220, 196, 175, 196].forEach((f, i) => { S.tone('sine', f, f, .7, .07, i * .62, 0); S.tone('triangle', f / 2, f / 2, .7, .04, i * .62, 500); }); };
  const kid = (S, hot) => { S.tone('triangle', hot ? 760 : 620, hot ? 980 : 800, .08, .035, 0, 2600); S.tone('triangle', hot ? 860 : 700, hot ? 1100 : 880, .09, .03, .11, 2600); if (hot) S.tone('triangle', 900, 1200, .1, .03, .24, 2600); };
  const yawn = S => { S.tone('sine', 320, 170, 1.3, .035, 0, 500); S.tone('triangle', 160, 90, 1.3, .02, .1, 300); };
  const splash = S => { S.sfx('splash'); S.tone('sine', 300, 90, .4, .06, 0, 700); };

  /* ---------- 搬砖 ---------- */
  function setCarry(S, n) { S.f.carry = n; S.take('brick1'); S.take('brick2'); if (n === 1) S.give('brick1', true); if (n === 2) S.give('brick2', true); }
  function placeBricks(S, id) {
    const b = S.ent(id), n = Math.min(4 - (b.s.br || 0), S.f.carry || 0);
    if (n <= 0) return 0;
    b.s.br = (b.s.br || 0) + n; setCarry(S, S.f.carry - n); thud(S, n);
    S.toast(`${BEDS[id].name}：${b.s.br}/4 块砖` + (S.f.carry ? `（手里还有 ${S.f.carry} 块）` : ''));
    return n;
  }
  const allFull = S => Object.keys(BEDS).every(k => (S.ent(k).s.br || 0) >= 4);
  function takeBricks(S, pile, what) {
    const p = S.ent(pile), c = S.f.carry || 0;
    if (c >= 2) { S.toast('两只手都占着了——先去垫上'); return false; }
    if (!(p.s.n > 0)) return null;
    const k = Math.min(2 - c, p.s.n); p.s.n -= k; setCarry(S, c + k); S.sfx('item');
    S.toast(`抱起 ${k} 块${what || '砖'}（手里 ${c + k} 块）`); return true;
  }

  /* ---------- 水迹 ---------- */
  const NW = 14;
  function dripAt(S, x, y, dir, keep) {
    const i = DRIPI++ % NW, e = S.ent('w' + i); if (!e) return;
    S.place('w' + i, x, y, dir); e.alpha = 1; DRIPT[i] = keep ? 1e9 : W.t;
  }
  function clearDrips(S) { for (let i = 0; i < NW; i++) { const e = S.ent('w' + i); if (e) { e.hidden = true; e.alpha = 1; } DRIPT[i] = 0; } DRIPI = 0; }

  /* ================= 夜里：扑托克洛希 ================= */
  function huntGoal(S) { return `扑住看不见的它（${S.f.catches || 0}/3）：看水迹、听西菲喊`; }
  function pickBed(S) {
    const T = S.f.tk, a = S.ent('bed_g').s.br, b = S.ent('bed_s').s.br;
    if (a !== b) return a < b ? 'bed_g' : 'bed_s';
    return T.last === 'bed_g' ? 'bed_s' : 'bed_g';
  }
  function huntBegin(S) {
    for (const k in BEDS) S.ent(k).s.br = 4;
    Object.assign(S.ent('bed_g').s, { who: 'gogo' }); Object.assign(S.ent('bed_s').s, { who: 'up', pt: -1 }); S.ent('bed_m').s.who = '';
    S.ent('spare').s.n = 2; setCarry(S, 0);
    for (let i = 0; i < 3; i++) S.hide('db' + i);
    S.hide('gogo_h'); S.hide('sipho_h'); clearDrips(S);
    S.ent('kdrum').covered = false; S.ent('plamp').off = false;
    S.place('tok', DRINK[0], DRINK[1], 1); const e = S.ent('tok'); e.s.vis = 0; e.alpha = 1;
    S.f.tk = { st: 'drink', t: 2.6, bed: null, carry: 0, last: '', lx: DRINK[0], ly: DRINK[1], cd: 0 };
    S.f.tk.bed = pickBed(S);
    Object.assign(S.f, { catches: 0, warn: 0, dz: 0, dzw: 0, lost: 0, hunt: true });
    S.dark(.9); S.plr(2.6); S.amb('night');
    S.pos(12, 3, 0); SHOUT = .4; PT = 0; HB = 0;
    S.goal(huntGoal(S));
  }
  function dropBrick(S, x, y) {
    for (let i = 0; i < 3; i++) { const d = S.ent('db' + i); if (d.hidden) { S.place('db' + i, x, y); return; } }
    S.ent('spare').s.n++;   // 地上已经有三块：这块就当是滚回了砖堆
  }
  const CATCH = [
    '你扑了个正着——手底下是一团又湿又冷的毛！\n它「吱」地尖叫一声，扭身挣脱了。这一下你看清了：比西菲还矮，两只黄眼睛，浑身往下滴水。',
    '又扑住了！它在你手里乱蹬，喉咙里「咕噜咕噜」地响，像含着一口水。\n它又挣脱了——可是跑得慢了，一路滴着水。'
  ];
  async function onCatch(S) {
    const T = S.f.tk, e = S.ent('tok'); S.stop('tok'); e.s.vis = 1;
    squeal(S); S.shake(300, 2); S.bubble('tok', '!', 900);
    const had = T.carry; if (had) { const [x, y] = tpos(e); dropBrick(S, x, y); T.carry = 0; }
    S.f.catches = (S.f.catches || 0) + 1; S.goal(huntGoal(S));
    if (S.f.catches >= 3) return huntWin(S);
    await S.narr(CATCH[S.f.catches - 1] + (had ? '\n\n「咚」——它抱着的那块砖掉在了地上。' : ''));
    if (S.f.catches === 1) S.toast('掉在地上的砖可以捡起来，垫回床脚');
    T.st = 'flee'; [T.lx, T.ly] = tpos(e);
  }
  async function onClimb(S, id) {
    const T = S.f.tk, e = S.ent('tok'); S.stop('tok'); e.s.vis = 1; S.bubble('tok', '!', 900);
    if (!S.f.warn) {
      S.f.warn = 1; squeal(S); S.shake(500, 3); S.sfx('scream');
      await S.say(BEDS[id].who, id === 'bed_g' ? '（一声惊叫）谁！谁在我床上！' : '（尖叫）坦迪姐姐！它爬上来了！');
      await S.narr(`${BEDS[id].name}底下只剩两块砖，床歪下来一头——它差一点就爬上去了。\n${BEDS[id].who}一脚把它蹬了下去。`);
      S.toast('少于三块砖，床就歪了，它够得着——快垫回去！');
      T.st = 'flee'; [T.lx, T.ly] = tpos(e); return;
    }
    DIED++; S.f.hunt = false;
    await S.scare('face', { face: 'tok2', sfx: 'scream' });
    await S.die(id === 'bed_g'
      ? '它爬上去了。\n床歪下来的那一头，正好够得着。\n你听见奶奶喉咙里一声很轻的「呃」，像被谁按住了胸口。\n然后是西菲的哭声——'
      : '它爬上去了。\n西菲的哭声一下子断了。床上只剩一团湿漉漉的被子，一圈水迹，从床脚一直爬到枕头边。', '床太低了');
  }
  async function huntWin(S) {
    const e = S.ent('tok'); S.f.hunt = false; e.s.vis = 1; S.stop('tok');
    cough(S);
    await S.narr('第三回。你把它死死按在地上，它浑身的毛湿得往下淌水。\n它弓起背，「咳、咳」——\n吐出来一颗小小的、圆圆的石子。');
    setCarry(S, 0); S.give('stone'); S.focus(tpos(e)[0], tpos(e)[1]);
    S.ent('bed_g').s.who = 'gogoup'; S.ent('bed_s').s.pt = -1;
    await S.narr('它没有再跑。它缩成一团，在你脚边发抖。\n现在，连你也看得见它了。');
    await S.say('奶奶', ['……老天。', '（奶奶坐在床上，看着地上那个缩成一团的小东西。她没有尖叫，看了很久。）', '它在发抖。']);
    await S.say('西菲', ['它冷。', '它想回家。它一直在说，可是你们听不见。']);
    rooster(S, .02); await S.wait(900);
    await S.say('奶奶', ['天快亮了。德拉米尼妈妈说过，她在河边等你们。', '去吧。带上西菲——它只肯跟着他。']);
    S.focus(null); S.f.act = 'dawn'; clearDrips(S); S.hide('tok');
    S.goal('天亮前，带它和石子去河边');
    await S.go('river', 10, 11, 3);
  }
  async function doze(S, lay) {
    S.f.hunt = false;
    if (!lay) await S.think('……眼皮好沉。就闭一下，一下就好……');
    await S.fade(1, 1200);
    if (!allFull(S)) {
      SLEPT++;
      await S.end({ bad: true, id: 'slept', title: '砖被偷走的那晚', text: '你只是想闭一会儿眼睛。\n\n醒来的时候，天已经亮了。屋里很安静，安静得不对。\n奶奶的床歪在地上，床脚底下的砖，一块也不剩。\n地上一圈干掉的水迹，从水缸，一直绕到她的枕头边。\n\n奶奶没事——她只是像醒不过来似的，睡了一整天。\n可是从那天起，西菲再也不肯晚上闭眼。\n他说，它还在屋里。就站在你的床边。\n它在等你再睡着。' });
      return;
    }
    await S.wait(500); await S.fade(0, 300);
    await S.say('西菲', ['坦迪姐姐！醒醒！你睡着了！', '……还好砖都在。它刚才就站在你床边，在等你。']);
    S.f.dz = 0; S.f.dzw = 0; S.f.hunt = true; S.toast('别站着不动——一犯困就危险');
  }
  /* 屋里每帧（只在主机）：托克洛希的行动、水迹、西菲的指向、困意 */
  function houseTick(S, dt) {
    for (let i = 0; i < NW; i++) {   // 水迹慢慢干掉
      const w = S.ent('w' + i); if (w.hidden || DRIPT[i] > 1e8) continue;
      const a = 1 - (W.t - DRIPT[i]) / 3.4; if (a <= 0) w.hidden = true; else w.alpha = a;
    }
    const T = S.f.tk; if (S.f.act !== 'hunt' || !T || !S.f.hunt || S.busy) return;
    const e = S.ent('tok'), p = W.pl, [ex, ey] = tpos(e);
    /* 困意：站着不动就往上涨，走动会消下去 */
    S.f.dz = Math.max(0, Math.min(1, S.f.dz + (S.moving ? -dt / 8 : dt / DZT)));
    S.plr(2.6 * (1 - .45 * S.f.dz)); S.dark(.9 + .08 * Math.max(0, S.f.dz - .3));
    if (S.f.dz > .5 && S.f.dzw < 1) { S.f.dzw = 1; yawn(S); S.toast('眼皮发沉……走动走动'); }
    if (S.f.dz > .8 && S.f.dzw < 2) { S.f.dzw = 2; yawn(S); S.toast('你打了个哈欠，眼前一阵阵发黑——快动起来！'); }
    if (S.f.dz < .3) S.f.dzw = 0;
    if (S.f.dz >= 1) { S.run(S2 => doze(S2)); return; }
    /* 扑住：走进它所在的格子 */
    const near = Math.abs(e.px - p.px) + Math.abs(e.py - p.py);
    if ((T.st === 'go' || T.st === 'steal' || T.st === 'carry' || T.st === 'drink') && !e.hidden && near < 12) { T.st = 'caught'; S.run(onCatch); return; }
    /* 扑过一回以后它学精了：走着的时候，你一靠近（1.6 格内、你在动），它就往远离你的方向蹿两格；偷砖的时候顾不上躲 */
    T.cd -= dt;
    if ((T.st === 'go' || T.st === 'carry') && (S.f.catches || 0) >= 1 && T.cd <= 0 && !e.mv && near <= 1.6 * TS && S.moving) {
      const m = curMap(); let best = -1, bd = -1;
      for (let d = 0; d < 4; d++) { const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1]; if (!passable(m, nx, ny, e)) continue; const dd = Math.abs(nx - p.x) + Math.abs(ny - p.y); if (dd > bd) { bd = dd; best = d; } }
      if (best >= 0 && bd > Math.abs(ex - p.x) + Math.abs(ey - p.y)) { startMove(e, best, 4.8); T.cd = 1.8; S.tone('sine', 1400, 2200, .08, .03, 0, 0); return; }
    }
    /* 隐身时走过的格子留下水迹 */
    if (!e.hidden && !e.s.vis && (ex !== T.lx || ey !== T.ly)) { dripAt(S, T.lx, T.ly, e.dir); const dd = (Math.abs(e.px - p.px) + Math.abs(e.py - p.py)) / TS; if (dd < 7) drip(S, .045 - dd * .006); T.lx = ex; T.ly = ey; }
    T.t -= dt;
    if (T.st === 'drink') {
      if (T.t <= 0) { T.st = 'go'; T.bed = pickBed(S); }
      else if (SHOUT <= 0) { SHOUT = 2.8; kid(S, 1); gulp(S); S.toast('西菲：「它在水缸里喝水！就在厨房！」'); }
    } else if (T.st === 'out') {
      if (T.t <= 0) {   // 它是水里的东西：有时从大门钻进来，有时直接从水缸里爬出来（两处离得远，守不住两头）
        const far = ([x, y]) => Math.abs(x - p.x) + Math.abs(y - p.y) > 3;   // 不刷在玩家身边
        let drum = Math.random() < .5; if (!far(drum ? DRINK : DOOR)) drum = !drum;
        const at = drum ? DRINK : DOOR;
        if (!far(at)) { T.t = .5; return; }
        S.place('tok', at[0], at[1], drum ? 1 : 3); e.s.vis = 0; [T.lx, T.ly] = at; T.bed = pickBed(S); T.st = 'go'; kid(S, 1); SHOUT = 2.6;
        if (drum) { gulp(S); S.toast('西菲：「它从水缸里爬出来了！」'); } else { S.sfx('open'); S.toast('西菲：「它又进来了！从大门！」'); }
      }
    } else if (T.st === 'go') {
      const st = BEDS[T.bed].st;
      if (stepTo(e, st[0], st[1], SPD.go) && !e.mv) { T.st = 'steal'; T.t = STEAL; scrape(S); kid(S, 1); S.toast(`西菲：「它在${BEDS[T.bed].at}！在拿砖！」`); SHOUT = 2.6; }
    } else if (T.st === 'steal') {
      if (T.t <= 0) {
        const b = S.ent(T.bed); T.last = T.bed;
        if ((b.s.br || 0) <= 2) { T.st = 'climbing'; const id = T.bed; S.run(S2 => onClimb(S2, id)); return; }
        b.s.br--; T.carry = 1; T.st = 'carry'; scrape(S); thud(S);
        kid(S, 1); S.toast(`西菲：「它抱走了一块砖！${BEDS[T.bed].sn}只剩 ${b.s.br} 块了！」`); SHOUT = 2.6;
      }
    } else if (T.st === 'carry' || T.st === 'flee') {
      if (stepTo(e, DOOR[0], DOOR[1], T.st === 'flee' ? SPD.flee : SPD.carry) && !e.mv) {
        e.hidden = true; e.s.vis = 0;
        if (T.st === 'carry' && T.carry) { S.f.lost++; S.toast('西菲：「它把砖拿出去了！」'); }
        T.t = T.st === 'flee' ? 4 : 3; T.carry = 0; T.st = 'out';
      }
    }
    /* 西菲：伸手指着它，隔一会儿喊一声方位 */
    PT -= dt; SHOUT -= dt; HB -= dt;
    const bs = S.ent('bed_s');
    if (PT <= 0) {
      PT = .3;
      if (e.hidden || e.s.vis) bs.s.pt = -1;
      else { const dx = e.px - 6 * TS, dy = e.py - 2.5 * TS; bs.s.pt = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); }
      if (!e.hidden && !e.s.vis && Math.abs(ex - 6) + Math.abs(ey - 3) <= 3) S.bubble('bed_s', '!', 500);
    }
    if (SHOUT <= 0 && !e.hidden && !e.s.vis) { SHOUT = 2.8; kid(S); S.toast(`西菲：「${zone(ex, ey)}！」` + (T.st === 'carry' ? '（它抱着砖）' : '')); }
    /* 离得很近时，你自己的心跳 */
    if (HB <= 0 && !e.hidden && !e.s.vis && Math.abs(e.px - p.px) + Math.abs(e.py - p.py) < 2.6 * TS) { HB = .55; heart(S); }
  }

  /* ================= 河边的六口水 ================= */
  const POOLS = {
    pA: { name: '洗衣石', fail: 'T', d: '洗衣石。几块磨得发亮的大平石头，女人们在这里洗衣服。\n岸上是白沙。旁边一棵刺槐，长得笔直，一点也不弯。\n水边有锯齿叶的水草，石头缝里爬着小螺。' },
    pD: { name: '牛饮水处', fail: 'N', d: '牛饮水处。白沙岸被牛蹄踩得稀烂。\n一棵野枣树弯着腰，枝子垂在水面上。水边也有锯齿叶。\n水里密密麻麻全是蝌蚪。你翻了几块石头，一个螺也没找到。' },
    pB: { name: '白石滩', fail: 'L', d: '白石滩。白沙岸，满滩圆圆的白石头。\n一棵老无花果树弯着腰。岸边只有芦苇，没有锯齿叶。\n石头上趴着小螺。' },
    pE: { name: '回水湾', ok: true, d: '回水湾。河水在这里打了个旋，慢下来，很深。\n白沙岸。一棵老水榕弯着腰，气根一缕一缕垂进水里——像湿透的毛。\n水边有锯齿叶。石头底下有小螺。' },
    pC: { name: '柳树潭', fail: 'S', d: '柳树潭。黑泥岸，一脚踩下去，鞋都拔不出来。\n一棵柳树弯着腰。有锯齿叶，也有小螺。' },
    pF: { name: '小瀑布', fail: 'X', d: '小瀑布。红土岸。没有树，只有芦苇。\n水急，哗哗地响，只看得见几条小鱼。' }
  };
  const FAILHINT = {
    T: '……西菲画里那棵树是弯着腰的。这棵刺槐长得笔直。',
    N: '……石子上粘着小螺壳。这口水里全是蝌蚪，一个螺也没有。',
    L: '……水缸里那片叶子边上有锯齿。这里只有芦苇。',
    S: '……砖上糊的是白沙。这里是一脚下去拔不出来的黑泥。',
    X: '……这里什么都对不上。红土、芦苇、没有树。'
  };
  async function dawnFail(S) {
    LEFT = 0;
    await S.die('太阳出来了。\n你手心里的石子「咔」地裂开一道缝，里面那一点水，干了。\n它尖叫着钻进岸边的草丛，再也找不到了。\n\n今晚，它还会回到屋里来。', '天亮了');
  }
  async function poolOn(S, id) {
    const P = POOLS[id];
    if (S.f.act !== 'final') { await S.narr(P.d); return; }
    await S.narr(P.d);
    const r = await S.ask('把石子放进这口水？', ['放进去', '再想想']);
    if (r !== 0) return;
    S.take('stone'); splash(S);
    if (P.ok) return goodEnd(S, id);
    S.give('stone', true);
    S.f.wrong = (S.f.wrong || 0) + 1; WRONGMAX = Math.max(WRONGMAX, S.f.wrong); const w = WRONGMAX;
    S.timerAdd(-30); squeal(S); S.shake(500, 2.5); S.bubble('tok_r', '!', 1200);
    if (S.f.wrong === 2) await S.scare('face', { face: 'tok' });
    await S.narr('石子沉下去——又「啵」地一声浮了上来，打着转漂回你脚边。\n它在西菲身后尖叫起来，浑身的毛都炸开了。天边又亮了一点。');
    await S.think(FAILHINT[P.fail]);
    if (w === 2) await S.say('德拉米尼妈妈', '四样东西都要对上：白沙、弯腰树、锯齿叶——还有石子上带来的那一样。');
    else if (w === 3) await S.say('德拉米尼妈妈', ['你看看石子上粘着什么。', '有白沙、有弯腰树、有锯齿叶的，只剩两口。牛饮水处的石头底下，没有螺。']);
    else if (w >= 4) await S.say('德拉米尼妈妈', '回水湾。老水榕底下那口回水。');
    S.toast('天亮前的时间少了 30 秒');
  }
  async function goodEnd(S, id) {
    S.clearTimer(); S.f.act = 'end';
    await S.narr('石子沉下去了。水面上冒了一串很小的泡。');
    hum(S);
    await S.say('德拉米尼妈妈', ['（她低低地唱起来，没有词，像风吹过芦苇。）', '……回去吧。这里不是你的地方。没有人会再叫你了。']);
    await S.walk('pl', [13, 7], 3); S.face('pl', 1);
    await S.walk('tok_r', [12, 6], 2.2); S.face('tok_r', 0);
    await S.wait(500);
    await S.say('西菲', '它在看我。');
    S.face('tok_r', 3); await S.walk('tok_r', [12, 5], 1.6);
    splash(S); await S.alpha('tok_r', 0, 1400);
    S.dark(.3); S.plr(5); rooster(S, .03);
    await S.narr('水面合上了。\n太阳从山后面出来，老水榕的影子落在回水湾上。');
    const mz = S.f.defend && S.f.mzKind, mz2 = S.f.defend && !S.f.mzKind;
    await S.end({ id: 'river', title: '第二十九夜　完', text: '西菲说，它在树底下坐着，晒它的毛。\n大人们什么也没看见。\n\n那天以后，村里再没人丢过砖。\n奶奶还是每晚把床垫高。她说，这是她的奶奶教她的。\n' + (mz ? '\n回村的路上，祖鲁老太太站在她家门口，裹着毯子，冲你们点了点头。\n那天上午，好几个人去她家坐了坐。没有人提起树底下那场村会。\n' : mz2 ? '\n回村的路上，祖鲁老太太家的门开着。她坐在门口晒太阳，看见你，抬了抬手。\n' : '') + '\n叫它来的那个人是谁，德拉米尼妈妈到最后也没有说。\n你也没有问。' });
  }

  /* ================= 惊吓大头像 ================= */
  const FACES = {
    /* 托克洛希：湿透成缕的黑绿长毛，毛缝里两只又圆又大的黄眼睛，没有鼻梁，只有两道缝；嘴越咧越宽 */
    tok(R, a) {
      const H = '#1e2416', H2 = '#33402a', H3 = '#4a5a34', SK = '#4a4c38', SK2 = '#36382a', EY = '#e8d850', EY2 = '#fff6b0', K = '#0a0c06', WT = 'rgba(170,215,235,.85)';
      R(0, 0, 32, 32, '#06080a');
      R(4, 2, 24, 30, H); R(2, 7, 28, 25, H); R(7, 0, 18, 4, H);
      for (let i = 0; i < 14; i++) R(2 + i * 2, 20 + (i * 7) % 6, 1, 12, i % 3 ? H2 : H3);   // 一缕一缕垂下来的湿毛
      R(8, 8, 16, 14, SK); R(7, 10, 18, 10, SK); R(9, 20, 14, 3, SK2);
      for (let i = 0; i < 6; i++) R(7 + i * 3, 6 + (i % 2), 2, 7 - (i % 3), H);   // 额前的毛帘
      const ew = a < .2 ? 2 : 5;
      for (const x of [9, 18]) { R(x, 13 - (ew >> 1), 5, ew, EY); R(x + 1, 13 - (ew >> 1), 2, 1, EY2); R(x + 2, 13, 1, Math.max(1, ew - 2), K); }
      R(15, 17, 1, 2, K); R(17, 17, 1, 2, K);
      const mw = 6 + Math.round(a * 8), mh = 1 + Math.round(a * 3);
      R(16 - (mw >> 1), 21, mw, mh, K); for (let i = 0; i < mw; i += 2) R(16 - (mw >> 1) + i, 21, 1, 1, '#d8d4b8');
      for (let i = 0; i < 5; i++) R(5 + i * 5, 24 + ((a * 30 + i * 4) % 8), 1, 2, WT);
      R(6, 3, 2, 4, '#6a7a3a'); R(24, 5, 1, 4, '#6a7a3a'); R(11, 26, 3, 1, '#6a7a3a');
    },
    /* 死亡：贴着脸，嘴张到底，两只湿手按上来 */
    tok2(R, a, t) {
      FACES.tok(R, Math.min(1, .6 + a));
      const SK = '#4a4c38';
      const y = 32 - Math.round(a * 10);
      R(0, y, 7, 10, SK); R(1, y - 3, 1, 4, SK); R(3, y - 4, 1, 5, SK); R(5, y - 3, 1, 4, SK);
      R(25, y, 7, 10, SK); R(26, y - 3, 1, 4, SK); R(28, y - 4, 1, 5, SK); R(30, y - 3, 1, 4, SK);
    }
  };

  /* ================= 人物 ================= */
  const PEOPLE = {
    me: { key: 'tk-me', skin: '#7a4a2c', hair: '#1a1210', hs: 'bun', top: '#d8a030', top2: '#f0e0c0', bottom: '#34466a', shoes: '#e8e0d0',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 1, 6, '#8a6a1e'); R(11, G.tT + 1, 1, 6, '#8a6a1e'); } if (d === 3) R(5, G.tT, 6, 5, '#5a4a6a'); } },   // 背着书包
    gogo: { key: 'tk-gogo', skin: '#5e3a22', hair: '#d8d4cc', hs: 'bun', hat: 'scarf', hatC: '#a82a2a', top: '#3a4a7a', bottom: '#6a3a2a', skirt: true, shoes: '#2a1a10',
      extra(g, d, fr, G, R) { const c = '#c88a2a'; if (d === 0) { R(3, G.tT, 10, 4, c); R(3, G.tT + 1, 10, 1, '#7a2a1a'); R(3, G.tT + 3, 10, 1, '#2a4a2a'); } else if (d === 3) { R(3, G.tT, 10, 7, c); R(3, G.tT + 2, 10, 1, '#7a2a1a'); R(3, G.tT + 5, 10, 1, '#2a4a2a'); } else { R(4, G.tT, 8, 5, c); R(4, G.tT + 2, 8, 1, '#7a2a1a'); } } },
    sipho: { key: 'tk-sip', skin: '#6a4228', hair: '#141010', hs: 'short', child: true, top: '#c83a3a', top2: '#e8d8c8', bottom: '#3a5a8a', shoes: '#2a2a2a',
      extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT + 1, 4, 2, '#f0e0a0'); } } },
    madla: { key: 'tk-madla', skin: '#5a3820', hair: '#141010', hs: 'bun', top: '#b82a24', top2: '#f0ece0', bottom: '#b82a24', robe: true, shoes: '#3a2418',
      extra(g, d, fr, G, R) {   // 白珠子串成的头带、交叉的白珠串
        R(3, G.hT + 1, 10, 1, '#f4f2ea'); R(4, G.hT, 8, 1, '#c82a24');
        if (d === 0) { for (let i = 0; i < 6; i++) { R(4 + i, G.tT + i, 1, 1, '#f4f2ea'); R(11 - i, G.tT + i, 1, 1, '#f4f2ea'); } R(3, G.tT + 8, 10, 1, '#f4f2ea'); R(5, G.hT + 8, 6, 1, '#f4f2ea'); }
        else if (d === 3) { R(4, G.hT - 1, 8, 1, '#f4f2ea'); R(3, G.tT + 8, 10, 1, '#f4f2ea'); }
        else { for (let i = 0; i < 6; i++) R(5 + (i >> 1), G.tT + i, 1, 1, '#f4f2ea'); R(4, G.tT + 8, 8, 1, '#f4f2ea'); }
      } },
    mazulu: { key: 'tk-mz', skin: '#5a3a24', hair: '#bcb8b0', hs: 'bun', hat: 'scarf', hatC: '#3a2a4a', top: '#6a4a2a', bottom: '#4a3a3a', robe: true, shoes: '#2a1a10',
      extra(g, d, fr, G, R) {   // 格子毯子、拐棍
        const c = '#8a5a3a'; R(3, G.tT, 10, 8, c); for (let i = 0; i < 3; i++) { R(3, G.tT + 1 + i * 3, 10, 1, '#3a4a6a'); R(4 + i * 3, G.tT, 1, 8, '#c8a050'); }
        if (d !== 3) R(d === 1 ? 2 : 13, G.tT + 2, 1, 13, '#6a4a2a');
      } },
    sibu: { key: 'tk-sibu', skin: '#5c3a22', hair: '#141010', hs: 'short', hat: 'cap', hatC: '#2a4a2a', top: '#2a4a7a', top2: '#c8c0b0', bottom: '#2a4a7a', shoes: '#3a2a1a' },
    vil1: { key: 'tk-v1', skin: '#6a4226', hair: '#141010', hs: 'bun', hat: 'scarf', hatC: '#2a6a4a', top: '#d8a040', top2: '#f0e0c0', dress: true, shoes: '#3a2a1a' },
    vil2: { key: 'tk-v2', skin: '#5a3a20', hair: '#141010', hs: 'short', top: '#8a6a4a', bottom: '#3a3a3a', shoes: '#2a1a10' },
    vil3: { key: 'tk-v3', skin: '#62402a', hair: '#2a2420', hs: 'bun', hat: 'scarf', hatC: '#c8c0e0', top: '#6a3a6a', skirt: true, bottom: '#2a2a3a', shoes: '#2a1a10' }
  };

  /* ================= 地图里常用的实体 ================= */
  const drips = () => Array.from({ length: NW }, (_, i) => ({ id: 'w' + i, x: 1, y: 6, spr: 'wetp', decal: true, solid: false, hidden: true, light: null }));   // 屋里的水迹不发光：只有走到跟前、在你的光圈里才看得见
  const N = t => S => S.narr(t);

  defChapter({
    id: 'tokoloshe', n: 29, title: '托克洛希', sub: '南非山村，家家户户把床脚垫上砖。河里有个矮小的东西，喝了水就谁也看不见——只有孩子看得见。', origin: '南非民间传说', color: '#6a4424',
    amb: 'night', floor: 'dirt', wall: 'plain', dark: .6, plr: 3.2,
    people: PEOPLE, faces: FACES,
    endings: { river: '回到河里', slept: '砖被偷走的那晚', blame: '指认' },
    items: {
      brick1: { name: '一块砖', desc: '一块红砖，冰凉，一角磕掉了。垫在床腿底下刚好。' },
      brick2: { name: '两块砖', desc: '两块红砖摞在一起，抱在怀里沉甸甸的。一次只能抱这么多。' },
      stone: { name: '它吐出来的石子', desc: '一颗小小的、圆圆的河石，冰凉，湿漉漉的，像刚从水底捞上来。\n石子上粘着一个米粒大的小螺壳。' }
    },
    notes: {
      gogo: { title: '奶奶说的规矩（记在本子上）', text: '奶奶一边说，我一边记。她说这些不是吓小孩的，是她的奶奶告诉她的。\n\n· 人们相信，河里有一种很矮的东西，叫托克洛希（utokoloshe）。浑身是毛，个子只到大人的膝盖。\n· 它够不着高的床。所以家家户户，床的四条腿底下都垫砖。\n· 它喝了水，就谁也看不见了。——大人看不见，孩子看得见。\n· 它不会自己来。人们说，是心里有坏念头的人把它叫来的。\n· 晚上把水缸盖好。地上有水迹，就是它走过。\n\n（最后一句奶奶说得很轻：「别去猜是谁叫的。猜错一个人，比它还害人。」）' },
      drawing: { title: '西菲的画（蜡笔，画在作业本背面）', text: '一条蓝色的河。河边一棵树，弯着腰，树梢都快碰到水了。\n树底下的水里，坐着一个黑乎乎、毛茸茸的小人，两只黄眼睛。\n\n旁边歪歪扭扭地写着：\n「放羊的时候看见的。它坐在弯腰树底下的水里。\n别的大人都看不见。\n它看见我了。」\n\n右下角画的是我们家：三张床，每张床底下四块红砖。\n其中一张床底下，他只画了两块。' },
      madla: { title: '德拉米尼妈妈的话', text: '（她坐在火边说的。我回去以后记下来。）\n\n「它是水里的东西，不是这里的东西。有人把它从水里叫出来，它就回不去了。\n它喝水，吞下河底的一颗小石子，大人就看不见它。孩子的眼睛还干净，看得见。\n\n要送它回去，先得让它把石子吐出来——它偷砖的时候扑住它，一回、两回、三回，它累了，石子就吐出来了。\n然后把石子放回它来的那口水里。它会跟着石子回家。\n它从哪口水里来？看它留下的东西。」\n\n我记下的、它留下的东西：\n· 昨晚那块砖上，糊着一层细细的白沙。\n· 今早水缸里，漂着一片边上带锯齿的水草叶。\n· 西菲说，它坐在一棵「弯腰树」底下的水里。\n\n（她最后说：「叫它来的人，我不说名字。你们也别说。」）' },
      river: { title: '河湾的六口水（我画的草图）', text: '从西往东，岸边一共六口水，村里人都给它们起了名字。\n\n一　洗衣石：白沙岸。一棵刺槐，笔直。有锯齿叶。有小螺。\n二　牛饮水处：白沙岸。一棵野枣树，弯腰。有锯齿叶。只有蝌蚪，没有螺。\n三　白石滩：白沙岸。一棵老无花果，弯腰。只有芦苇。有小螺。\n四　回水湾：白沙岸。一棵老水榕，弯腰。有锯齿叶。有小螺。\n五　柳树潭：黑泥岸。一棵柳树，弯腰。有锯齿叶。有小螺。\n六　小瀑布：红土岸。没有树。只有芦苇。只有小鱼。\n\n（白沙、弯腰树、锯齿叶……好像还差一样东西，才知道是哪一口。）' }
    },
    legend: '托克洛希（Tokoloshe，祖鲁语 utokoloshe，科萨语 utikoloshe）是南部非洲祖鲁、科萨等民族民间信仰里的一种精怪。流传最广的说法是：它个子很矮，大约只到人的膝盖，浑身是毛；和水有关，常被说成住在河里；它喝了水、或者吞下一颗小石子，就能隐身，只有孩子看得见它。人们相信它会在夜里来到熟睡的人身边作祟，让人生病、做噩梦，甚至更糟。\n\n防托克洛希最出名的办法，就是把床垫高——在每条床腿下面垫上砖头，据说它太矮，就够不着床上的人。这个习惯在南部非洲流传很广，城里也有人这样做，有的人只是出于习惯，或者「以防万一」。在很多说法里，托克洛希不会自己出现，而是被心怀恶意的人（祖鲁语 umthakathi，施害的巫者）召来、差去害人；传统治疗师（sangoma、inyanga）则被认为能认出并驱走它。治疗师在当地社会里是受人尊敬的角色，和「施害的巫者」是两回事。各地的版本差别很大：有的说它是水精，有的说它是巫者用法术造出来的，样子、本事和弱点都不一样。\n\n这个传说也有沉重的一面。因为和巫术指控连在一起，「有人叫来了托克洛希」一类的说法，在现实中曾被用来怀疑、指控邻里——被指为巫的，往往是独居的老人，尤其是老年妇女。据报道，1990年代中期，南非北部省（今林波波省）发生过多起针对被指为「巫者」的人的驱逐和暴力事件，政府为此专门成立了调查委员会。直到今天，被说成是巫，仍可能让一个人失去家园甚至生命。托克洛希的形象也常被媒体和流行文化拿来猎奇、取笑，这对相信它的人、对被指控的人都不公平。\n\n本章想写的，是人们相信的那一部分——砖、水、孩子的眼睛——以及猜疑怎样比怪物本身更伤人。\n\n（本章中的坦迪一家、德拉米尼妈妈、祖鲁老太太、西布西索和村里的人、村子和河湾的六口水、「扑住三回它就吐出石子」「把石子放回它来的那口水」这套送走它的办法，以及三种结局，都是游戏虚构；民间说法里并没有统一的「送走」规矩。）',
    start: { map: 'road', x: 3, y: 6, dir: 2 },
    resume: {
      day2: async S => { if (S.f.act === 'day2' && BLAMED) await S.think(BLAMED === 1 ? '……老太太一个人走上土路的背影，我一闭眼就看得见。\n这一次，想清楚再开口。' : '奶奶说过：猜错一个人，比它还害人。'); },
      hunt: async S => {
        if (S.f.act !== 'hunt') return;
        huntBegin(S);
        if (SLEPT && !DIED) await S.think('……这一次，不能停下来。\n困的时候就走动，绕着屋子走，盯着地上的水迹。');
        else if (DIED === 1) await S.think('……再来一次。\n它偷砖的时候会在床边停一会儿——西菲一喊，就往那边扑。\n床底下少了两块，就赶紧把砖垫回去。');
        else if (DIED > 1) await S.think('水迹最新的那一头，就是它。心跳一快，它就在身边。\n掉在地上的砖、门边的砖堆，都可以拿来垫床。');
      },
      river: async S => {
        if (S.f.act !== 'final') return;
        LEFT = Math.max(LEFT, 120);
        S.timer(LEFT, '离天亮', dawnFail, { during: true });
        await S.think('白沙、弯腰树、锯齿叶……还有石子上粘着的那个小螺壳。');
      }
    },
    async intro(S) {
      DIED = 0; SLEPT = 0; WRONGMAX = 0; LEFT = 240; BLAMED = 0;
      S.f.act = 'arrive';
      await S.card('第二十九夜　托克洛希', '1996年7月　南非　夸祖鲁-纳塔尔省　山里的一个村子', '七月是南非的冬天。\n山里的夜冷得发脆，河水却还在响。\n\n你放寒假，从德班坐了一下午的小巴，回奶奶家。\n村里的人说，这几天，好几户人家床脚底下的砖，不见了。');
    },
    /* 选章卡片：垫在四块红砖上的床，床底下的黑影里有两只黄眼睛；一串湿脚印从左边的河水那边过来 */
    thumb(g, w, h) {
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      for (let y = -6; y <= 6; y++) { const w = Math.round(Math.sqrt(36 - y * y)), w2 = Math.round(Math.sqrt(Math.max(0, 30 - (y + 1) * (y + 1)))); R(16 - w, 14 + y, w * 2, 1, '#e8e0c0'); if (w2) R(19 - w2, 14 + y, w2 * 2, 1, shade('#6a4424', -.5)); }   // 月牙
      R(0, 58, 26, 10, '#2a4a5a'); R(2, 60, 8, 1, '#5a8aa0'); R(14, 63, 6, 1, '#5a8aa0');
      for (let i = 0; i < 5; i++) { const x = 26 + i * 12, y = 64 - i * 2; R(x, y, 3, 2, 'rgba(150,200,230,.75)'); R(x + 5, y + 3, 3, 2, 'rgba(150,200,230,.6)'); }
      R(84, 36, 60, 6, '#5a3c26'); R(84, 24, 8, 14, '#5a3c26'); R(86, 26, 6, 10, '#e6e2d6');   // 床头、枕头
      R(92, 30, 52, 8, '#c89a3a'); R(92, 30, 52, 2, '#e0b85a');
      R(86, 42, 3, 8, '#3a2618'); R(140, 42, 3, 8, '#3a2618');
      for (const x of [83, 137]) { R(x, 50, 9, 6, '#a8442a'); R(x, 50, 9, 2, '#c8603a'); R(x, 53, 9, 1, '#6a2a1a'); }
      R(90, 44, 48, 12, '#050403');
      R(104, 47, 4, 3, '#e8d850'); R(114, 47, 4, 3, '#e8d850'); R(105, 48, 1, 1, '#111'); R(115, 48, 1, 1, '#111');
      for (let i = 0; i < 6; i++) R(98 + i * 5, 54, 1, 3, '#2e3a22');
      R(70, 66, 80, 2, 'rgba(0,0,0,.4)');
    },
    sprites: {
      /* 托克洛希：比孩子还矮的一团湿毛，长胳膊，黄眼睛；s.vis=0 时隐身（什么都不画） */
      tok(g, e, t, R) {
        if (!e.s.vis) return;
        const f = e.fr || 0, bob = (f === 1 || f === 3) ? 1 : 0, sw = f === 1 ? -1 : f === 3 ? 1 : 0, d = e.dir;
        const H = '#232a18', H2 = '#3a4628', H3 = '#141a0e', SK = '#4e5040';
        R(2, 14, 12, 2, 'rgba(0,0,0,.35)');
        R(5 + sw, 12, 2, 3, SK); R(9 - sw, 12, 2, 3, SK); R(4 + sw, 15, 3, 1, SK); R(9 - sw, 15, 3, 1, SK);
        R(3, 3 + bob, 10, 10, H); R(2, 6 + bob, 12, 6, H); R(4, 1 + bob, 8, 3, H2);
        for (let i = 0; i < 6; i++) R(2 + i * 2, 11 + bob, 1, 2 + (i % 2), H3);
        R(1, 7 + bob, 2, 6, H2); R(13, 7 + bob, 2, 6, H2); R(0, 13, 2, 1, SK); R(14, 13, 2, 1, SK);
        if (d !== 3) {
          const ox = d === 1 ? -2 : d === 2 ? 2 : 0;
          R(5 + ox, 5 + bob, 6, 4, '#3a3e2a');
          if (d !== 2) { R(5 + ox, 6 + bob, 2, 2, '#e8d850'); R(6 + ox, 7 + bob, 1, 1, '#14140a'); }
          if (d !== 1) { R(9 + ox, 6 + bob, 2, 2, '#e8d850'); R(9 + ox, 7 + bob, 1, 1, '#14140a'); }
          R(6 + ox, 9 + bob, 4, 1, '#0c0c06');
        }
        R(4, 2 + bob, 1, 2, '#6a7a3a'); R(11, 3 + bob, 1, 2, '#6a7a3a');
        const k = (t * 2.5) % 1, k2 = (t * 2.5 + .5) % 1;
        R(3, 12 + k * 4, 1, 1, 'rgba(170,215,235,.85)'); R(12, 11 + k2 * 5, 1, 1, 'rgba(170,215,235,.85)');
      },
      /* 湿脚印：两只小脚，脚趾太长；朝向跟着它走的方向 */
      wetp(g, e, t, R) {
        const c = 'rgba(130,175,205,.7)', h = 'rgba(210,235,250,.6)', d = e.dir;
        if (d === 0 || d === 3) {
          const s = d === 0 ? 1 : -1, y0 = d === 0 ? 4 : 9;
          for (const [x, y] of [[4, y0], [10, y0 + 3 * s]]) { R(x, y, 3, 4, c); R(x, y + (s > 0 ? 4 : -2), 1, 2, c); R(x + 2, y + (s > 0 ? 4 : -2), 1, 2, c); R(x + 1, y + 1, 1, 1, h); }
        } else {
          const s = d === 2 ? 1 : -1, x0 = d === 2 ? 3 : 9;
          for (const [x, y] of [[x0, 4], [x0 + 3 * s, 10]]) { R(x, y, 4, 3, c); R(x + (s > 0 ? 4 : -2), y, 2, 1, c); R(x + (s > 0 ? 4 : -2), y + 2, 2, 1, c); R(x + 1, y + 1, 1, 1, h); }
        }
      },
      /* 床：四条腿，s.br 块砖垫在腿下；少于三块时床歪下来一头。s.who：gogo / gogoup / sipho / up（西菲坐起来，s.pt 指向） */
      kbed(g, e, t, R0) {
        const br = e.s.br ?? 4, low = br <= 2, lift = low ? 0 : 3, c = e.col || '#7a5a8a';
        const legs = [[2, 27], [12, 27], [2, 1], [12, 1]];
        for (let i = 0; i < 4; i++) { const [x, y] = legs[i]; if (i < br) { R0(x - 2, y + 1, 6, 4, '#a8442a'); R0(x - 2, y + 1, 6, 1, '#d0684a'); R0(x - 2, y + 4, 6, 1, '#6a2a1a'); R0(x + 3, y + 1, 1, 4, '#7a3020'); } else R0(x - 1, y + 4, 4, 1, 'rgba(0,0,0,.35)'); }
        const R = (x, y, w, h, col) => R0(x, y - lift + (low && y > 12 ? 3 : 0), w, h, col);
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        for (const [x, y] of legs) R(x, y - 1, 2, 4, '#3a2618');
        bx(1, -4, 14, 6, '#5a3c26');
        R(1, 2, 14, 25, '#5a3c26'); R(2, 3, 12, 4, '#e6e2d6');
        const who = e.s.who;
        if (who === 'up') {
          R(2, 12, 12, 15, c); R(2, 12, 12, 2, shade(c, .2));
          R(4, 3, 8, 9, '#c83a3a'); R(5, -3, 6, 6, '#6a4228'); R(5, -4, 6, 2, '#141010'); R(6, -1, 1, 1, '#f4f0e0'); R(9, -1, 1, 1, '#f4f0e0');
          const p = e.s.pt;
          if (p === 1) R(0, 5, 5, 2, '#6a4228'); else if (p === 2) R(11, 5, 5, 2, '#6a4228'); else if (p === 3) R(12, -4, 2, 8, '#6a4228'); else if (p === 0) R(11, 6, 2, 8, '#6a4228');
        } else if (who === 'gogoup') {
          R(2, 12, 12, 15, c); R(2, 12, 12, 2, shade(c, .2));
          R(4, 3, 8, 9, '#3a4a7a'); R(5, -3, 6, 6, '#5e3a22'); R(4, -5, 8, 3, '#a82a2a'); R(6, -1, 1, 1, '#f4f0e0'); R(9, -1, 1, 1, '#f4f0e0');
        } else {
          if (who === 'gogo') { R(5, 2, 6, 5, '#5e3a22'); R(4, 1, 8, 3, '#a82a2a'); R(6, 5, 1, 1, '#2a1a10'); R(9, 5, 1, 1, '#2a1a10'); }
          if (who === 'sipho') { R(5, 2, 6, 5, '#6a4228'); R(5, 1, 6, 2, '#141010'); R(6, 5, 1, 1, '#1a1010'); R(9, 5, 1, 1, '#1a1010'); }
          R(2, 8, 12, 19, c); R(2, 8, 12, 2, shade(c, .2)); R(2, 25, 12, 2, shade(c, -.25));
          for (let i = 0; i < 3; i++) R(2, 13 + i * 5, 12, 1, shade(c, -.15));
        }
        if (low) { R0(0, 30, 16, 2, 'rgba(0,0,0,.45)'); R0(1, 26, 14, 1, 'rgba(0,0,0,.35)'); if (Math.sin(t * 5) > 0) R0(14, 20, 2, 5, '#e84a2a'); }
      },
      /* 砖堆：s.n 块 */
      bpile(g, e, t, R) {
        const n = e.s.n ?? 6;
        R(0, 13, 16, 3, 'rgba(0,0,0,.3)');
        for (let i = 0; i < n; i++) { const x = 1 + (i % 3) * 5, y = 10 - Math.floor(i / 3) * 3; R(x, y, 5, 3, '#a8442a'); R(x, y, 5, 1, '#c8603a'); R(x + 4, y, 1, 3, '#6a2a1a'); }
        if (!n) { R(3, 12, 3, 1, '#8a3a24'); R(9, 13, 2, 1, '#8a3a24'); }
      },
      /* 掉在地上的一块砖；s.sand 糊着白沙 */
      dbr(g, e, t, R) {
        R(4, 12, 9, 2, 'rgba(0,0,0,.3)'); R(4, 9, 8, 4, '#a8442a'); R(4, 9, 8, 1, '#c8603a'); R(11, 9, 1, 4, '#6a2a1a');
        if (e.s.sand) { for (let i = 0; i < 7; i++) R(4 + (i * 3) % 8, 9 + (i % 3), 1, 1, '#ece6d2'); }
        if (Math.sin(t * 3) > .6) R(6, 9, 1, 1, '#fff');
      },
      /* 铁皮水桶（大汽油桶刷了蓝漆）：covered 盖着；s.leaf 水面漂着一片锯齿叶 */
      drum(g, e, t, R) {
        const c = '#3a5a8a';
        R(1, 14, 14, 2, 'rgba(0,0,0,.35)');
        R(2, -2, 12, 16, shade(c, -.35)); R(3, -1, 10, 15, c); R(3, 3, 10, 1, shade(c, -.25)); R(3, 9, 10, 1, shade(c, -.25)); R(4, 0, 2, 13, shade(c, .2));
        R(5, 6, 3, 2, '#8a5a3a'); R(10, 11, 2, 2, '#8a5a3a');
        if (e.covered) { R(1, -4, 14, 3, '#7a7a74'); R(2, -5, 12, 1, '#9a9a94'); R(7, -6, 2, 1, '#555'); }
        else {
          R(3, -2, 10, 2, '#1a2a3a'); R(4 + (Math.sin(t * 2) > 0 ? 1 : 0), -2, 3, 1, '#6a8aa8');
          if (e.s.leaf) { R(7, -2, 4, 1, '#4a7a2a'); R(7, -3, 1, 1, '#4a7a2a'); R(9, -3, 1, 1, '#4a7a2a'); }
          if (e.s.lid) { R(13, 10, 3, 5, '#7a7a74'); }
        }
      },
      /* 圆屋（rondavel）：3×2，土墙、尖顶茅草；s.band 墙上的彩带；open 门开着 */
      rond(g, e, t, R) {
        const wc = e.col || '#c8a070', wd = shade(wc, -.3);
        R(0, 29, 48, 3, 'rgba(0,0,0,.3)');
        R(4, 6, 40, 25, wc); R(2, 10, 44, 20, wc); R(36, 8, 8, 22, shade(wc, -.12)); R(2, 28, 44, 3, wd);
        if (e.s.band) { R(2, 24, 44, 2, e.s.band); R(2, 26, 44, 1, shade(e.s.band, -.3)); }
        R(20, 13, 9, 18, '#2a1a10'); R(21, 14, 7, 17, e.open ? '#0a0806' : '#6a4426'); if (!e.open) { R(24, 15, 1, 15, '#4a2c16'); R(26, 22, 1, 2, '#c8a050'); }
        if (e.s.win) { R(8, 15, 6, 5, e.lit ? '#d9b860' : '#14100c'); R(8, 15, 6, 1, wd); R(10, 15, 1, 5, wd); }
        for (let y = -26; y < 10; y++) { const w = Math.round(6 + (y + 26) * 1.45), x0 = Math.round(24 - w / 2); R(x0, y, w, 1, y % 3 === 0 ? '#7a5a2c' : (y % 3 === 1 ? '#a8843e' : '#9a7836')); }
        R(-3, 8, 54, 3, '#6a4e24'); for (let x = -2; x < 50; x += 3) R(x, 10, 1, 2 + (x % 2), '#5a4020');
        R(22, -28, 4, 3, '#4a3018');
      },
      /* 杂货铺（spaza）：4×2，铁皮顶、刷了字的墙、带铁栏的窗口；s.night 窗口里点着煤油灯 */
      spaza(g, e, t, R) {
        R(0, 29, 64, 3, 'rgba(0,0,0,.3)');
        R(1, 0, 62, 31, '#d8c8a8'); R(1, 22, 62, 9, '#4a7a5a'); R(1, 21, 62, 1, '#2a5a3a');
        R(-2, -6, 68, 7, '#8a8a84'); for (let x = -2; x < 66; x += 4) R(x, -6, 1, 7, '#6a6a64'); R(-2, 0, 68, 1, '#5a5a54');
        R(4, 3, 30, 7, '#c83a2a'); R(5, 4, 28, 5, '#e8d8b0');
        const GL = { S: ['111', '100', '111', '001', '111'], P: ['111', '101', '111', '100', '100'], A: ['010', '101', '111', '101', '101'], Z: ['111', '001', '010', '100', '111'] };
        [...'SPAZA'].forEach((ch, i) => GL[ch].forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') R(7 + i * 5 + x, 4 + y, 1, 1, '#2a2a2a'); })));
        R(38, 6, 20, 14, '#2a1a10'); R(39, 7, 18, 12, e.s.night ? '#d9b050' : '#3a2a1c');
        if (!e.s.night) { R(44, 10, 6, 6, '#5a3820'); R(44, 9, 6, 2, '#141010'); R(45, 12, 1, 1, '#eee'); R(48, 12, 1, 1, '#eee'); R(43, 16, 8, 3, '#c8c0a0'); }
        for (let x = 40; x < 57; x += 3) R(x, 7, 1, 12, '#3a3a3a');
        R(37, 20, 22, 2, '#6a4a2a');
        R(6, 14, 7, 8, '#8a6a3a'); R(6, 14, 7, 1, '#aa8a5a'); R(15, 16, 6, 6, '#7a5a2a');
      },
      /* 大树（村会的树）：树干一格，宽而平的树冠 */
      btree(g, e, t, R) {
        R(-6, 13, 28, 3, 'rgba(0,0,0,.3)');
        R(6, -10, 5, 26, '#4a3424'); R(5, 10, 7, 6, '#4a3424'); R(7, -10, 1, 24, '#6a4c34');
        R(2, -16, 6, 2, '#4a3424'); R(10, -18, 8, 2, '#4a3424');
        const c = '#2e4a26';
        R(-28, -34, 72, 14, c); R(-22, -40, 60, 8, c); R(-32, -26, 80, 8, shade(c, -.2)); R(-14, -44, 40, 5, shade(c, .12));
        for (let i = 0; i < 14; i++) R(-28 + i * 5, -36 + (i % 3) * 3, 3, 2, shade(c, .2));
      },
      /* 白旗：治疗师的家 */
      wflag(g, e, t, R) {
        R(6, 13, 4, 3, 'rgba(0,0,0,.3)'); R(7, -26, 2, 42, '#8a7a5a');
        const s = Math.round(Math.sin(t * 3) * 1.5);
        R(9, -26, 9, 6, '#f4f2ea'); R(18, -25 + s, 3, 5, '#e8e6de'); R(9, -21, 9, 1, '#d8d6ce');
      },
      /* 火塘：一圈石头、火、可选三脚铁锅（s.pot） */
      pfire(g, e, t, R) {
        for (const [x, y] of [[1, 11], [5, 13], [10, 13], [13, 10], [6, 8]]) R(x, y, 3, 2, '#6a6a64');
        if (!e.off) { for (let i = 0; i < 4; i++) { const h = 4 + Math.round(Math.abs(Math.sin(t * 7 + i * 1.7)) * 4); R(4 + i * 2, 12 - h, 2, h, i % 2 ? '#ff9a3a' : '#ffd060'); } R(5, 11, 6, 2, '#ff6a2a'); }
        else { R(4, 10, 8, 2, '#3a3430'); }
        if (e.s.pot) { R(3, 1, 10, 7, '#1a1a1a'); R(2, 1, 12, 1, '#2a2a2a'); R(3, 8, 1, 3, '#1a1a1a'); R(12, 8, 1, 3, '#1a1a1a'); R(5, 0, 6, 1, '#5a5a50'); }
      },
      goat(g, e, t, R) {
        const c = e.col || '#e8e2d4', b = Math.sin(t * 2 + e.px) > .7 ? 1 : 0;
        R(3, 14, 10, 2, 'rgba(0,0,0,.3)'); R(4, 11, 1, 4, '#3a3028'); R(11, 11, 1, 4, '#3a3028'); R(6, 11, 1, 4, '#3a3028'); R(9, 11, 1, 4, '#3a3028');
        R(3, 6, 10, 6, c); R(3, 6, 10, 1, shade(c, .1)); R(12, 2 + b, 4, 5, c); R(13, 1 + b, 1, 2, '#6a5a4a'); R(15, 1 + b, 1, 2, '#6a5a4a'); R(14, 4 + b, 1, 1, '#1a1a1a'); R(14, 7 + b, 1, 2, c);
        R(2, 6, 1, 2, c); if (e.s.spot) R(5, 7, 4, 3, '#6a4a2a');
      },
      wline(g, e, t, R) {
        R(0, -12, 2, 28, '#5a4a3a'); R(62, -12, 2, 28, '#5a4a3a'); R(0, -10, 64, 1, '#c8c8c0');
        const s = Math.sin(t * 1.5) > .3 ? 1 : 0;
        R(8, -9, 7, 9 + s, '#d8a030'); R(22, -9, 8, 6, '#e8e2d6'); R(36, -9, 6, 10 + s, '#3a5a8a'); R(48, -9, 8, 7, '#c83a3a');
      },
      /* 弯腰树：s.kind = fig / willow / jujube / old（老水榕，气根垂进水里）；向上（水那边）弯 */
      ltree(g, e, t, R) {
        const k = e.s.kind || 'fig', l = e.s.lean || 1;
        R(2, 13, 12, 3, 'rgba(0,0,0,.3)');
        const tc = k === 'willow' ? '#5a4a34' : k === 'old' ? '#6a6050' : '#4a3424';
        for (let i = 0; i < 9; i++) R(6 + l * Math.round(i * i / 9), 12 - i * 3, 4, 4, tc);
        const cx = 8 + l * 9, cy = -16;
        if (k === 'willow') { const c = '#5a7a3a'; R(cx - 10, cy - 6, 20, 6, c); for (let i = 0; i < 8; i++) R(cx - 10 + i * 3, cy, 2, 10 + (i % 3) * 3, shade(c, (i % 2) * .15)); }
        else if (k === 'jujube') { const c = '#3a5228'; R(cx - 8, cy - 6, 16, 8, c); R(cx - 5, cy - 9, 10, 3, c); for (let i = 0; i < 6; i++) R(cx - 8 + i * 3, cy + 2, 1, 2, '#6a5a3a'); }
        else if (k === 'old') { const c = '#24402a'; R(cx - 12, cy - 8, 24, 10, c); R(cx - 9, cy - 12, 18, 4, shade(c, .12)); for (let i = 0; i < 7; i++) R(cx - 10 + i * 3, cy + 2, 1, 8 + (i * 5) % 9, '#4a4434'); }
        else { const c = '#2e4a26'; R(cx - 11, cy - 7, 22, 9, c); R(cx - 7, cy - 11, 14, 4, shade(c, .12)); R(cx - 4, cy - 2, 3, 2, '#7a3a4a'); R(cx + 3, cy - 4, 2, 2, '#7a3a4a'); }
      },
      /* 笔直的刺槐 */
      atree(g, e, t, R) {
        R(2, 13, 12, 3, 'rgba(0,0,0,.3)'); R(7, -18, 3, 34, '#5a4a3a'); R(5, -8, 2, 1, '#5a4a3a'); R(10, -12, 3, 1, '#5a4a3a');
        const c = '#4a6230'; R(-4, -26, 24, 6, c); R(0, -30, 16, 4, shade(c, .15));
        for (let i = 0; i < 6; i++) R(-3 + i * 4, -20, 1, 2, '#e8e0c8');
      },
      /* 锯齿叶的水草 */
      sawleaf(g, e, t, R) {
        const c = '#4a7a2a', s = Math.sin(t * 1.3 + e.px) > .5 ? 1 : 0;
        for (const [x, h] of [[3, 10], [7, 13], [11, 9]]) { R(x + s, 15 - h, 2, h, c); for (let y = 15 - h; y < 15; y += 2) R(x + s - 1, y, 1, 1, shade(c, .2)), R(x + s + 2, y + 1, 1, 1, shade(c, -.2)); }
      },
      rocks(g, e, t, R) { R(1, 6, 8, 5, '#7a7a74'); R(1, 6, 8, 1, '#9a9a94'); R(8, 9, 7, 5, '#6a6a64'); R(8, 9, 7, 1, '#8a8a84'); if (e.s.cloth) R(3, 4, 4, 2, '#c83a3a'); },
      wstones(g, e, t, R) { for (const [x, y] of [[2, 6], [7, 4], [11, 8], [5, 10]]) { R(x, y, 4, 3, '#e8e6dc'); R(x, y, 4, 1, '#fffef6'); } },
      falls(g, e, t, R) { for (let i = 0; i < 6; i++) { const y = ((t * 30 + i * 7) % 16) | 0; R(3 + i * 2, y - 8, 1, 6, 'rgba(230,240,250,.7)'); } R(1, 12, 14, 3, 'rgba(240,248,255,.5)'); },
      /* 水面上一圈慢慢扩开的涟漪：这里可以调查 */
      pring(g, e, t, R) {
        const r = 2 + ((t * 2 + e.px / 30) % 1) * 5, a = (e.s.hot ? .75 : .35) - (r - 2) / (e.s.hot ? 10 : 20);
        const c = `rgba(200,225,240,${a.toFixed(2)})`;
        R(8 - r, 8, r * 2, 1, c); R(8 - r + 1, 7, r * 2 - 2, 1, c); R(8 - r + 1, 9, r * 2 - 2, 1, c);
      },
      /* 煤油灯（放在桌上，z:1） */
      plamp(g, e, t, R) {
        R(6, 5, 4, 4, '#c8c8c0'); R(5, 9, 6, 3, '#8a6a2a'); R(6, 4, 4, 1, '#888');
        if (!e.off) { R(7, 5, 2, 3, Math.sin(t * 9) > 0 ? '#ffd060' : '#ffb040'); R(7, 6, 2, 1, '#fff2c0'); }
      },
      /* 贴在墙上的蜡笔画 */
      pdraw(g, e, t, R) {
        R(3, 1, 10, 10, '#f4f0e0'); R(3, 1, 10, 1, '#d8d4c4');
        R(4, 8, 8, 2, '#3a6ac8'); R(9, 3, 1, 5, '#6a4a2a'); R(8, 2, 3, 2, '#3a8a3a'); R(5, 6, 3, 3, '#2a2a1a'); R(5, 7, 1, 1, '#e8d020'); R(7, 7, 1, 1, '#e8d020');
      },
      /* 铁丝扭成的小汽车（孩子们自己做的玩具） */
      wirecar(g, e, t, R) { const c = '#b8b8b0'; R(3, 9, 10, 1, c); R(3, 6, 1, 4, c); R(12, 6, 1, 4, c); R(5, 5, 6, 1, c); R(5, 5, 1, 4, c); R(10, 5, 1, 4, c); R(7, 0, 1, 6, c); R(6, 0, 3, 1, c); R(3, 10, 2, 2, '#2a2a2a'); R(11, 10, 2, 2, '#2a2a2a'); }
    },
    tiles: {
      stoep: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#8a3a2c'); R(0, 0, 16, 1, '#6a2a1e'); R(0, 0, 1, 16, '#6a2a1e'); if (hash(X, Y, 3) > .5) R(3, 4, 6, 1, '#a85a48'); R(9, 10, 4, 1, '#9a4a38'); } },
      wsand: { solid: false, paint(R, X, Y) { speck(R, '#c8c0a8', ['#dcd6c0', '#b0a890', '#e8e2d0'], X, Y, 18, 4); } },
      rsoil: { solid: false, paint(R, X, Y) { speck(R, '#8a4a2a', ['#9a5a34', '#6a3a20', '#a86a40'], X, Y, 18, 6); } },
      mudb: { solid: false, paint(R, X, Y) { speck(R, '#1e1a14', ['#2a241c', '#14100c', '#3a3226'], X, Y, 18, 9); R(4, 6, 5, 2, '#2e2a22'); } }
    },
    maps: {
      /* ---------------- 村道 ---------------- */
      road: {
        amb: 'wind', dark: .55, plr: 3.2, floor: 'dirt',
        tileOpts: { grassC: '#5a5a2c', treeC: '#2a4224' },
        rows: [
          'TBTTBTTTBTTTTBTTTBTTTBTT',
          'T""""""""""""""""""""""T',
          'T""""""""""""""""""""""T',
          'T""""""""""""""""""""""T',
          'T""""""""""""""""""""""T',
          'T""""""""""""""""""""""T',
          'dddddddddddddddddddddddd',
          'dddddddddddddddddddddddd',
          'T""""""d""""""""d""""""T',
          'T""""""d""""""""d""""""T',
          'T""""""d""""""""d""""""T',
          'T""""""d""""""""d""""""T',
          'T""""""d""""""""d""""""T',
          'TTTTTTTdTTTTTTTTTTTTTTTT'],
        ents: [
          { id: 'taxi', x: 0, y: 7, w: 2, spr: 'car', col: '#e8e4d8', on: N('一辆白色的小巴，车身上刷着「上帝保佑」。司机在抽烟，等着回镇上。') },
          { id: 'mzhut', x: 2, y: 2, w: 3, h: 2, spr: 'rond', col: '#c8a878', s: { win: 1 }, lit: true, async on(S) {
            await S.narr(S.f.blamed ? '门板上有人用泥巴抹了一个叉。' : '祖鲁老太太的圆屋。墙是黄泥抹的，茅草顶补过好几回，颜色深一块浅一块。\n门口晾着一个洗干净的铁皮碗。');
          } },
          { id: 'mazulu', x: 5, y: 3, spr: '@mazulu', dir: 0, async on(S) {
            S.face('mazulu', 'pl');
            if (S.f.act === 'arrive') {
              await S.say('祖鲁老太太', ['（她裹着一条旧毯子，坐在门口的小板凳上，看着你。）', '……是诺姆莎家的孙女吧？长这么高了。', '回去告诉你奶奶，晚上把床垫高。这几天，河里的东西上来了。']);
              await S.think('村里的小孩管她叫「巫婆」。因为她一个人住，因为她老了。');
              return;
            }
            if (!S.f.met) return S.say('祖鲁老太太', '（她看着大树那边围着的人，没有说话。）');
            if (S.f.defend) {
              if (!S.f._mz) { S.f._mz = 1; return S.say('祖鲁老太太', ['我都听见了。', '……谢谢你，孩子。这么多年，你是头一个替我说话的。']); }
              S.f.mzKind = true;
              return S.say('祖鲁老太太', ['我年轻的时候，也见过它一回。在河边，一棵弯腰的老树底下，水打着旋的地方。', '我没跟任何人说过——说了，他们就更认定是我了。', '去吧。天黑以前回家，把床垫高。']);
            }
            return S.say('祖鲁老太太', ['（她没有看你。）', '他们说什么，你都听见了吧。……我老了。老了，就该被怀疑吗？']);
          } },
          { id: 'tree', x: 11, y: 3, spr: 'btree', on: N('村口的大树。冬天也不落叶。\n老人们说，有事就到树底下说——当着大家的面，当着祖先的面。') },
          { id: 'sibu', x: 10, y: 4, spr: '@sibu', dir: 0, hidden: true, async on(S) {
            S.face('sibu', 'pl');
            await S.say('西布西索', S.f.defend ? ['城里回来的，说话就是好听。', '今晚谁家要是再丢砖，你可别后悔。'] : ['今晚谁家再丢砖，就是她。等着瞧。']);
          } },
          { id: 'vil1', x: 12, y: 4, spr: '@vil1', dir: 0, hidden: true, async on(S) {
            S.face('vil1', 'pl');
            await S.say('村里的女人', S.f.defend ? ['……你说得对，没有证据。', '可是我家孩子这几天晚上老哭。我也不知道该怪谁。'] : ['我不是说一定是她。可是……一个人住，一个人去河边。']);
          } },
          { id: 'vil2', x: 9, y: 5, spr: '@vil2', dir: 2, hidden: true, on: N('一个男人抱着胳膊，盯着地面。') },
          { id: 'vil3', x: 13, y: 5, spr: '@vil3', dir: 1, hidden: true, on: N('一个女人搂着两个孩子，往后退了一步。') },
          { id: 'spaza', x: 17, y: 2, w: 4, h: 2, spr: 'spaza', s: { night: 1 }, async on(S) {
            if (S.f.act === 'arrive') return S.say('恩德洛武先生', ['坦迪！从德班回来了？要不要来瓶汽水？', '你听说了吗？姆特瓦家、恩科西家，床底下的砖都少了。有人说是小偷——谁偷砖啊？', '……我店里也少了两块。门是锁着的。']);
            if (S.f.act === 'final' || S.f.act === 'dawn') return S.narr('铺子还没开门。');
            await S.say('恩德洛武先生', ['早上树底下那场村会，你也在吧？西布西索那张嘴……', '（柜台上压着一张旧报纸。北边省里，有几个老人被说是巫，被赶出了村子，房子也烧了。）', '这种事，一开头，谁都觉得是别人家的事。']);
          } },
          { id: 'mhut', x: 18, y: 9, w: 3, h: 2, spr: 'rond', col: '#ece4d4', s: { band: '#b82a24' }, async on(S) {
            await S.narr(S.f.act === 'arrive' ? '治疗师德拉米尼妈妈的圆屋，墙刷得雪白，围着一圈红带。\n门关着。奶奶说过，她去山那边帮人看病了，明天才回来。' : '屋里挂着一串串晒干的草药和树皮，味道很苦。门口摆着一双擦得发亮的鞋。');
          } },
          { id: 'wflag', x: 21, y: 9, spr: 'wflag', on: N('竹竿上挂着一面白旗——这是治疗师的家。\n人们说，白色是祖先的颜色。') },
          { id: 'mfire', x: 18, y: 11, spr: 'pfire', s: { pot: 1 }, off: true, light: null, on: S => S.narr(S.ent('mfire').off ? '火塘是冷的。灰里埋着几块没烧完的木头。' : '火上坐着一只三脚铁锅，草药在里面咕嘟咕嘟地翻滚。') },
          { id: 'madla', x: 17, y: 11, spr: '@madla', dir: 1, hidden: true, async on(S) {
            S.face('madla', 'pl');
            if (S.f.act === 'day2') {
              await S.say('德拉米尼妈妈', ['（她坐在火边，脖子上挂着一圈又一圈白珠子。）\nSawubona，坦迪。孩子看见它了，对吗？', '它是水里的东西。有人把它叫出来，它就回不去了，只好在别人家里偷砖、喝水。\n它吞了河底的一颗石子，大人才看不见它。', '它偷砖的时候扑住它，三回，它就把石子吐出来。\n把石子放回它来的那口水里，它会跟着回家。']);
              const r = await S.ask('你想问——', ['「它是从哪口水里来的？」', '「是谁把它叫来的？」'], '');
              if (r === 1) await S.say('德拉米尼妈妈', ['我不说。我说出一个名字，那个人明天就没有家了。\n你在树底下，已经看见了。', '要紧的不是谁叫的，是让它回去。']);
              await S.say('德拉米尼妈妈', '它从哪口水里来？看它留下的东西。河湾里有好几口水，你去看看。\n天亮以前，我在河边等你们。');
              await S.note('madla');
              S.f.act = 'river'; S.goal('去河边看看那几口水（村道往南的小路）');
              return;
            }
            if (S.f.act === 'river') return S.say('德拉米尼妈妈', '去河边看看吧，看仔细。白沙、树、叶子，都记下来。');
            return S.say('德拉米尼妈妈', ['天黑了，回家去。它今晚会来。', '记住——别睡着。床脚的砖被它偷走的时候，你要是睡着了……']);
          } },
          { x: 0, y: 6, h: 2, touch: N('小巴开走的方向。去镇上的土路，要走一整天。') },
          { x: 23, y: 6, h: 2, async touch(S) {
            if (S.f.act === 'river') { await S.think('得先去河边看看那几口水。'); return S.pos(22, S.pl.y, 1); }
            await S.go('yard', 1, S.pl.y, 2);
          } },
          { x: 7, y: 13, async touch(S) {
            if (S.f.act === 'arrive') { await S.think('天快黑了。奶奶还在家里等着。'); return S.pos(7, 12, 3); }
            if (S.f.act === 'day2') { await S.think('先去找德拉米尼妈妈。她家在村道南边，挂白旗那家。'); return S.pos(7, 12, 3); }
            await S.go('river', 10, 11, 3);
          } }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'arrive' && first) {
            await S.narr('小巴把你放在土路边，扬起一阵红土。\n太阳已经落到山后面，村子里一家一家点起了煤油灯。');
            S.sfx('car'); S.hide('taxi');
            S.goal('回奶奶家（顺着土路往东）');
            return;
          }
          if (a === 'day2' || a === 'river' || a === 'dusk2') {
            S.dark(a === 'dusk2' ? .45 : .12); S.plr(a === 'dusk2' ? 3.4 : 5); S.amb('wind');
            S.ent('spaza').s.night = a === 'dusk2' ? 1 : 0; S.ent('mzhut').lit = a === 'dusk2';
            S.show('madla'); const f = S.ent('mfire'); f.off = false; f.light = { r: 3, col: 'rgba(255,150,60,.2)', flick: true };
          }
          if (a === 'day2' && !S.f.met) await meeting(S);
        }
      },
      /* ---------------- 奶奶家的院子 ---------------- */
      yard: {
        amb: 'night', dark: .6, plr: 3.2, wall: 'plain', floor: 'dirt',
        wallC: { face: '#d8c8a0', trim: '#8a6a3a', top: '#7a7a74' },
        legend: { 'x': 'stoep' },
        tileOpts: { grassC: '#5a5a2c', treeC: '#2a4224' },
        rows: [
          'TTTTTTTTTTTTTTTTTTTTTT',
          'T########""""""""""""T',
          'T########""""""""""""T',
          'Txxxxxxxxx"""""""""""T',
          'T""""""""""""""""""""T',
          'd"""""""""""ffffff"""T',
          'd"""""""""""f....f"""T',
          'd"""""""""""f....f"""T',
          'T"""""""""""ff.fff"""T',
          'T""""""""""""""""""""T',
          'T""""""""""""""""""""T',
          'T""""""""""""""""""""T',
          'T""""""""""""""""""""T',
          'TTTTTTTTTTTTTTTTTTTTTT'],
        ents: [
          { id: 'ywin1', x: 2, y: 2, spr: 'window', lit: true, on: N('奶奶屋的窗户。窗台上摆着一排擦得锃亮的果酱瓶，里面插着干花。') },
          { id: 'hdoor', x: 4, y: 2, spr: 'door', col: '#3a5a6a', async on(S) {
            if (S.f.act === 'arrive') return;
            S.sfx('open'); await S.go('house', 6, 8, 3);
          } },
          { id: 'ywin2', x: 7, y: 2, spr: 'window', lit: true, on: N('你那间屋的窗户。窗帘是奶奶用面粉袋缝的，还印着淡淡的字。') },
          { id: 'khut', x: 10, y: 1, w: 3, h: 2, spr: 'rond', col: '#b88a5a', on: N('灶屋，一间小圆屋。烟从茅草顶里慢慢渗出来，里面熏得黑黑的，挂着玉米棒子。') },
          { id: 'yfire', x: 13, y: 3, spr: 'pfire', s: { pot: 1 }, light: { r: 2.6, col: 'rgba(255,150,60,.2)', flick: true }, on: S => S.narr(S.ent('yfire').off ? '火塘熄了，灰还是温的。' : '三脚铁锅里熬着玉米粥（putu）。奶奶说，城里的面包不顶饿。') },
          { id: 'bpile', x: 7, y: 4, spr: 'bpile', s: { n: 7 }, async on(S) {
            const a = S.f.act;
            if (a === 'bricks') { const r = takeBricks(S, 'bpile'); if (r === null) await S.narr('砖堆空了。'); return; }
            await S.narr(S.ent('bpile').s.n ? '墙根下码着几块红砖，是盖房子剩下的。家里每张床的砖，都从这里拿。' : '砖堆空了，只剩几块碎砖头。');
          } },
          { id: 'ydrum', x: 1, y: 4, spr: 'drum', covered: true, on: S => S.narr(S.f.act === 'night1' || S.f.act === 'brick1' ? '院子里这只水桶的盖子也被推到了一边。水面上一圈一圈的涟漪，还没平。' : '院子里接雨水的大铁桶，盖着铁皮盖子。') },
          { id: 'goat1', x: 14, y: 6, spr: 'goat', on: S => { bleat(S); return S.narr(S.f.act === 'night1' || S.f.act === 'brick1' ? '羊挤在羊圈角落里，眼睛瞪得溜圆，一直盯着圈外的草地。' : '西菲放的羊。它冲你「咩」了一声，又低头去啃一根玉米秆。'); } },
          { id: 'goat2', x: 16, y: 7, spr: 'goat', s: { spot: 1 }, on: S => { bleat(S); return S.narr('花脸的那只。西菲给它起了名字，叫「总统」。'); } },
          { id: 'wline', x: 3, y: 10, w: 4, spr: 'wline', solid: false, on: N('晾衣绳上挂着西菲的校服，冻得硬邦邦的。') },
          { id: 'gogo_y', x: 5, y: 4, spr: '@gogo', dir: 0, on: N('奶奶。') },
          { id: 'sipho_y', x: 6, y: 5, spr: '@sipho', dir: 1, on: N('西菲。') },
          { id: 'kbrick', x: 16, y: 9, spr: 'dbr', s: { sand: 1 }, hidden: true, async on(S) {
            S.hide('kbrick'); setCarry(S, 1); S.sfx('item'); S.f.clueSand = true;
            await S.narr('砖就扔在羊圈外面的草里。\n湿漉漉的，冰凉，上面糊着一层细细的白沙——像河底的那种沙。');
            S.tone('sine', 300, 120, .5, .04, 0, 500);
            await S.think('……远处，河那边，「扑通」一声。');
            S.f.act = 'brick1'; S.goal('把砖垫回西菲的床脚下');
          } },
          ...[[4, 4], [5, 5], [6, 6], [8, 7], [10, 8], [12, 9], [14, 10], [15, 9]].map(([x, y], i) => ({ id: 'yt' + i, x, y, spr: 'wetp', dir: i < 3 ? 0 : 2, decal: true, solid: false, hidden: true, light: { r: .6, a: .5, col: 'rgba(110,165,215,.08)' } })),
          { x: 0, y: 5, h: 3, async touch(S) {
            const a = S.f.act;
            if (a === 'bricks' || a === 'sleep1') { await S.think('奶奶还等着我把床垫好。'); return S.pos(1, S.pl.y, 2); }
            if (a === 'night1' || a === 'brick1') { await S.think('外面太黑了。砖还没找回来。'); return S.pos(1, S.pl.y, 2); }
            if (a === 'dusk2') { await S.think('天快黑了。该回屋了。'); return S.pos(1, S.pl.y, 2); }
            await S.go('road', 22, S.pl.y, 1);
          } }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'arrive') {
            S.f.act = 'bricks';
            await S.say('奶奶', ['坦迪！Sawubona，我的孩子。', '路上冷吧？锅里有玉米粥。']);
            S.face('sipho_y', 'pl');
            await S.say('西菲', ['坦迪姐姐！我跟你说——', '昨天晚上，我看见一个小矮人。毛茸茸的，在厨房水缸边上喝水。', '它喝完就不见了。奶奶看不见它，可是我看得见！']);
            await S.say('奶奶', ['……孩子，小声点。', '今早起来，西菲床底下的砖少了两块。我那张床也被挪过。', '坦迪，你在城里读书，你不信这些，奶奶知道。可是今晚，帮奶奶把床都垫高，好不好？']);
            const r = await S.ask('奶奶看着你，等你回答。', ['「好，我来垫。」', '「奶奶，你真的信这个？」'], '');
            if (r === 1) await S.say('奶奶', ['我信不信不要紧。', '我奶奶信，我妈妈信。我垫了一辈子砖，一辈子都睡得好。']);
            await S.say('奶奶', '规矩我说给你听，你记下来。');
            await S.note('gogo');
            await S.say('奶奶', ['我那张床已经垫好了。西菲的床还缺两块，你的床一块都没有。', '砖在门口墙根底下。一次抱两块，别闪了腰。']);
            S.hide('gogo_y'); S.hide('sipho_y'); S.show('gogo_h'); S.show('sipho_h');
            S.goal('给每张床的四条腿垫上砖（砖在门口）');
            return;
          }
          S.hide('gogo_y'); S.hide('sipho_y');
          if (a === 'night1' || a === 'brick1') {
            S.dark(.86); S.plr(2.8); S.ent('ydrum').covered = false;
            const f = S.ent('yfire'); f.off = true; f.light = null;
            if (a === 'night1' && S.once('ytrail')) {
              for (let i = 0; i < 8; i++) S.show('yt' + i);
              S.show('kbrick'); bleat(S);
              await S.think('院子里也有。一串小小的湿脚印，绕过砖堆，一直通到羊圈那边。\n羊在圈里挤成一团，一声也不叫。');
            }
          } else if (a === 'day2' || a === 'river') {
            S.dark(.1); S.plr(5); S.amb('wind'); for (let i = 0; i < 8; i++) S.hide('yt' + i);
            S.ent('ywin1').lit = false; S.ent('ywin2').lit = false; S.ent('ydrum').covered = true;
          } else if (a === 'dusk2') {
            S.dark(.5); S.plr(3.4); S.amb('night'); S.ent('ywin1').lit = true; S.ent('ywin2').lit = true;
            if (S.once('dusk2y')) await S.think('太阳落山了。屋里亮着煤油灯，奶奶在等你。');
            S.goal('回屋（今晚，它还会来）');
          }
        }
      },
      /* ---------------- 屋里：三间卧室 + 厨房 ---------------- */
      house: {
        amb: 'room', dark: .55, plr: 3, wall: 'plain', floor: 'stoep',
        wallC: { face: '#d8c8a0', trim: '#8a6a3a', top: '#5a4a3a' },
        rows: [
          '################',
          '################',
          '#....#....#....#',
          '#....#....#....#',
          '#....#....#....#',
          '##.####.####.###',
          '#..............#',
          '#..............#',
          '#..............#',
          '######.#########'],
        tick: houseTick,
        ents: [
          { x: 2, y: 1, spr: 'window', lit: false, on: N('奶奶屋的小窗。玻璃裂了一道，用胶布粘着。外面是黑沉沉的山。') },
          { x: 3, y: 1, spr: 'portrait', on: N('一张发黄的黑白照片：一个穿西装、戴礼帽的男人，站得笔直。\n是爷爷。他在金山上的矿里干了二十年，回来那年就走了。') },
          { id: 'bed_g', x: 1, y: 2, h: 2, spr: 'kbed', col: '#8a4a5a', s: { br: 4 }, on: S => bedOn(S, 'bed_g') },
          { id: 'gtable', x: 4, y: 2, spr: 'table', col: '#5a3a24', on: N('床头小桌上，一本翻旧了的祖鲁语《圣经》，一支蜡烛，一副老花镜。\n奶奶每个礼拜天都走一个钟头山路去教堂。') },
          { id: 'gcand', x: 4, y: 2, spr: 'candle', z: 1, oy: -6, light: { r: 2.4, col: 'rgba(255,190,100,.16)', flick: true } },
          { x: 7, y: 1, spr: 'window', on: N('西菲屋的窗户，窗台上排着几颗他从河边捡回来的圆石头。') },
          { x: 8, y: 1, spr: 'pdraw', on: S => S.f.clueTree ? S.note('drawing') : S.narr('墙上贴着西菲的蜡笔画：一条蓝色的河，河边一棵树……他说这张还没画完。') },
          { id: 'bed_s', x: 6, y: 2, h: 2, spr: 'kbed', col: '#3a6a9a', s: { br: 2 }, on: S => bedOn(S, 'bed_s') },
          { x: 9, y: 2, spr: 'box', on: N('西菲的纸箱子：一个瘪了的足球、半截蜡笔、一只用易拉罐剪的风车。') },
          { x: 8, y: 4, spr: 'wirecar', solid: false, on: N('一辆铁丝扭的小汽车，方向盘是一根长铁丝，能推着走。西菲自己扭的。') },
          { x: 13, y: 1, spr: 'window', on: N('你那间屋的窗户。从这里能看见院子里的羊圈，和更远处，河那边的一片黑。') },
          { id: 'bed_m', x: 14, y: 2, h: 2, spr: 'kbed', col: '#c89a3a', s: { br: 0 }, on: S => bedOn(S, 'bed_m') },
          { x: 11, y: 2, spr: 'box', col: '#5a4a6a', on: N('你的书包。里面是寒假作业，和一本从学校图书馆借的《祖鲁民间故事》——还没翻开。') },
          { id: 'stove', x: 11, y: 6, spr: 'stove', on: N('烧煤的铁炉子，炉膛里还剩一点红。奶奶说，冬天全靠它。') },
          { x: 14, y: 8, spr: 'cabinet', on: N('碗柜。搪瓷碗、铁皮杯，一罐「玉米粉」，一罐糖——糖罐用绳子捆着，防西菲。') },
          { id: 'kdrum', x: 14, y: 6, spr: 'drum', covered: true, async on(S) {
            const d = S.ent('kdrum'), a = S.f.act;
            if (a === 'day2' && d.s.leaf) {
              await S.narr('水面上漂着一片叶子。\n不是院子里的叶子——细长，边上一圈小锯齿，像河边水草的叶子。湿得发亮，叶柄上还缠着一根很长的、黑绿色的毛。');
              d.s.leaf = 0; S.f.clueLeaf = true;
              await S.think('它昨晚又来喝过水。');
              S.goal('去找治疗师德拉米尼妈妈（挂白旗那家）');
              return;
            }
            if (a === 'hunt') return S.narr('水缸的盖子被推到了地上。水面还在晃。');
            if (a === 'bricks' || a === 'sleep1') { if (!d.covered) { d.covered = true; S.sfx('close'); return S.narr('你把水缸的盖子盖严了。'); } return S.narr('盛饮用水的大铁桶，刷着蓝漆。奶奶每天早上去河边挑两趟水，倒进这里。盖子盖得严严的。'); }
            await S.narr(d.covered ? '盖得严严的水缸。' : '水缸的盖子开着。水面黑黑的，看不见底。');
          } },
          { id: 'ktable', x: 10, y: 8, spr: 'table', col: '#6a4a30', on: N('厨房的桌子，铺着塑料桌布，印着褪了色的橙子。') },
          { id: 'plamp', x: 10, y: 8, spr: 'plamp', z: 1, oy: -8, light: { r: 3.2, col: 'rgba(255,190,100,.16)', flick: true } },
          { id: 'spare', x: 1, y: 8, spr: 'bpile', s: { n: 0 }, async on(S) {
            if (S.f.act === 'hunt') { const r = takeBricks(S, 'spare', '备用砖'); if (r === null) await S.narr('门边的备用砖用完了。'); return; }
            await S.narr(S.ent('spare').s.n ? '门边的备用砖。' : '门边的墙角，空着。奶奶说，明天让西菲再搬两块进来备着。');
          } },
          { id: 'gogo_h', x: 9, y: 7, spr: '@gogo', dir: 0, hidden: true, async on(S) {
            S.face('gogo_h', 'pl'); const a = S.f.act;
            if (a === 'bricks') {
              const miss = Object.keys(BEDS).filter(k => S.ent(k).s.br < 4).map(k => `${BEDS[k].name}还缺 ${4 - S.ent(k).s.br} 块`);
              return S.say('奶奶', ['砖在门口墙根底下。一次抱两块，别闪了腰。', miss.join('，') + '。']);
            }
            if (a === 'sleep1') return S.say('奶奶', '睡吧，孩子。水缸我也盖好了。');
            if (a === 'day2') return S.say('奶奶', S.f.clueLeaf ? ['去吧。德拉米尼妈妈家在村道南边，挂白旗那家。', '路上要是有人说什么……别跟着说。'] : '出门前，先看看厨房的水缸。今早盖子又开了。');
            if (a === 'river') return S.say('奶奶', '去河边看看吧。别下水。');
            return S.say('奶奶', '……');
          } },
          { id: 'sipho_h', x: 8, y: 3, spr: '@sipho', dir: 0, hidden: true, async on(S) {
            S.face('sipho_h', 'pl'); const a = S.f.act;
            if (a === 'bricks') return S.say('西菲', ['我的床底下少了两块！就是它拿走的！', '我帮你数着：每张床四块，一条腿一块。']);
            if (a === 'sleep1') return S.say('西菲', '坦迪姐姐，你睡觉的时候，别把手垂到床外面。');
            if (a === 'day2' || a === 'river') { await S.say('西菲', '你看我的画了吗？它就坐在那棵弯腰树底下。'); return S.note('drawing'); }
            return S.say('西菲', '……');
          } },
          { id: 'tok', x: 13, y: 6, spr: 'tok', solid: false, hidden: true, s: { vis: 0 } },
          ...[0, 1, 2].map(i => ({ id: 'db' + i, x: 1, y: 7, spr: 'dbr', hidden: true, solid: false, async on(S) {
            const c = S.f.carry || 0; if (c >= 2) return S.toast('两只手都占着了——先去垫上');
            S.hide('db' + i); setCarry(S, c + 1); S.sfx('item'); S.toast(`捡起一块砖（手里 ${c + 1} 块）`);
          } })),
          ...drips(),
          { x: 6, y: 9, async touch(S) {
            const a = S.f.act;
            if (a === 'hunt') { await S.think('不能出去。奶奶和西菲还在屋里。'); return S.pos(6, 8, 3); }
            if (a === 'sleep1') { await S.think('床都垫好了。该睡了。'); return S.pos(6, 8, 3); }
            if (a === 'day2' && !S.f.clueLeaf) { await S.say('奶奶', '坦迪，出门前先看看厨房的水缸。'); return S.pos(6, 8, 3); }
            if (a === 'dawn' || a === 'final') return;
            await S.go('yard', 4, 3, 0);
          } }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'bricks' && first) await S.think('三间小卧室，一个厨房。地是红色的水泥地，奶奶天天打蜡，亮得能照出人影。\n奶奶的床在最左边，西菲的在中间，我的在最右边。');
          if (a === 'night1') S.dark(.9);
          if (a === 'dusk2') await night2(S);
        }
      },
      /* ---------------- 河湾 ---------------- */
      river: {
        amb: 'river', dark: .1, plr: 5, floor: 'grass',
        legend: { 's': 'wsand', 'Q': 'rsoil', 'u': 'mudb' },
        tileOpts: { grassC: '#5a5a2c', treeC: '#2a4224' },
        rows: [
          'KTKKTKKKTKKTKKKTKKTKKK',
          '~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~',
          '~~o~~o~~~o~~o~~~o~~o~~',
          '"ssssss"ssesss"uuueQe"',
          '""""""""""""""""""""""',
          'B""""""""""""""""""""B',
          'B""""""""""""""""""""B',
          'T""""""""""""""""""""T',
          'T""""""""""""""""""""T',
          'TTTTTTTTTTdTTTTTTTTTTT'],
        ents: [
          ...Object.entries({ pA: 2, pD: 5, pB: 9, pE: 12, pC: 16, pF: 19 }).map(([id, x]) => ({ id, x, y: 5, spr: 'pring', solid: true, on: S => poolOn(S, id) })),
          { x: 1, y: 6, spr: 'atree', on: N('刺槐，笔直笔直的，一根枝子也不往水那边弯。树上挂着几只织布鸟的空巢。') },
          { x: 3, y: 5, spr: 'rocks', solid: false, s: { cloth: 1 }, on: N('洗衣石。石头上晾着一块忘了收的红布。') },
          { x: 3, y: 6, spr: 'sawleaf', solid: false, on: N('锯齿叶的水草，叶子边上一圈小齿，摸上去拉手。') },
          { x: 4, y: 6, spr: 'ltree', s: { kind: 'jujube', lean: 1 }, on: N('野枣树，弯着腰，枝子上长着倒钩刺。') },
          { x: 6, y: 6, spr: 'sawleaf', solid: false, on: N('锯齿叶的水草，被牛啃掉了一半。') },
          { x: 5, y: 7, spr: 'footprints', col: 'rgba(70,50,30,.5)', on: N('一串牛蹄印，一直踩进水里。') },
          { x: 8, y: 6, spr: 'ltree', s: { kind: 'fig', lean: 1 }, on: N('老无花果树，弯着腰，果子早被鸟吃光了。') },
          { x: 10, y: 5, spr: 'wstones', solid: false, on: N('满滩白石头，圆滚滚的，在水里白得发亮。') },
          { x: 11, y: 6, spr: 'sawleaf', solid: false, on: N('锯齿叶的水草。和水缸里漂着的那片一模一样。') },
          { x: 13, y: 6, spr: 'ltree', s: { kind: 'old', lean: -1 }, on: N('老水榕，弯着腰，一缕缕气根垂进水里，在水面上轻轻地晃。') },
          { x: 15, y: 6, spr: 'ltree', s: { kind: 'willow', lean: 1 }, on: N('柳树，弯着腰，枝条拖在黑泥里。') },
          { x: 17, y: 6, spr: 'sawleaf', solid: false, on: N('锯齿叶的水草，根上糊满了黑泥。') },
          { x: 19, y: 4, spr: 'falls', solid: false, decal: true },
          { id: 'madla_r', x: 11, y: 8, spr: '@madla', dir: 0, hidden: true, async on(S) {
            S.face('madla_r', 'pl');
            await S.say('德拉米尼妈妈', WRONGMAX >= 3 ? '回水湾。老水榕底下。' : WRONGMAX >= 2 ? '四样东西都要对上：白沙、弯腰树、锯齿叶，还有石子上的。' : '把石子放回它来的那口水。你心里有数了吗？');
          } },
          { id: 'cand_r', x: 12, y: 8, spr: 'candle', hidden: true, light: { r: 2.6, col: 'rgba(255,190,100,.2)', flick: true } },
          { id: 'gogo_r', x: 8, y: 8, spr: '@gogo', dir: 2, hidden: true, async on(S) { S.face('gogo_r', 'pl'); await S.say('奶奶', ['（奶奶把西菲搂在身前，手一直在抖。）', '我活了七十年，头一回看见它。……它那么小。']); } },
          { id: 'sipho_r', x: 9, y: 8, spr: '@sipho', dir: 3, hidden: true, async on(S) {
            S.face('sipho_r', 'pl');
            await S.say('西菲', ['它一直在看那边。', '……它说，那里的石头底下，有好多好多小螺。']);
          } },
          { id: 'tok_r', x: 10, y: 9, spr: 'tok', solid: false, hidden: true, dir: 3, s: { vis: 1 }, light: { r: 1.1, a: .6, col: 'rgba(130,185,225,.1)' }, on: N('它缩在西菲脚边，浑身湿透，一抖一抖的。\n黄眼睛一直望着河。') },
          { x: 10, y: 12, async touch(S) {
            if (S.f.act === 'final') { await S.think('天快亮了。不能回去。'); return S.pos(10, 11, 3); }
            if (S.f.act === 'river') { await S.think('先看看那几口水。'); return S.pos(10, 11, 3); }
            await S.go('road', 7, 12, 3);
          } }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'river') {
            S.dark(.1); S.plr(5);
            if (S.once('riverday')) {
              await S.narr('河水比你记得的要宽。冬天水浅，岸边露出一口一口的水湾，像一串珠子。\n河对岸的山坡上，有个放羊的孩子在吹口哨。');
              await S.think('德拉米尼妈妈说，看它留下的东西。白沙、锯齿叶、弯腰树……\n我把这几口水画下来。');
              await S.note('river');
              S.f.act = 'dusk2';
              S.goal('仔细看看这六口水，然后回家（天快黑了）');
            }
            return;
          }
          if (a === 'dusk2') { S.dark(.4); S.plr(3.4); return; }
          if (a === 'dawn') {
            S.dark(.72); S.plr(3); S.show('madla_r'); S.show('cand_r'); S.show('sipho_r'); S.show('tok_r'); S.show('gogo_r');
            for (const k in POOLS) S.ent(k).s.hot = 1;
            await S.narr('天边刚有一点灰。河水很响。\n德拉米尼妈妈已经在岸边等着了，手里捧着一支蜡烛。西菲牵着奶奶的手跟在后面——它跟在西菲后面，一步一滴水。');
            await S.say('德拉米尼妈妈', ['它跟来了。好。', '（她看着西菲脚边那个缩成一团的小东西，轻轻说了一句祖鲁语。它的耳朵动了动。）', '石子在你手里。它从哪口水里来，就放回哪口水里。', '要在太阳出来以前。太阳一晒，石子就干了，它就再也回不去了。']);
            await S.think('白沙、弯腰树、锯齿叶……还有石子上粘着的那个小螺壳。');
            S.f.act = 'final'; S.f.wrong = 0;
            S.goal('把石子放回它来的那口水（一人对笺，一人去放）');
            S.cp('river');
            S.timer(LEFT, '离天亮', dawnFail, { during: true });
          }
        }
      }
    }
  });

  /* ================= 剧情段落 ================= */
  async function bedOn(S, id) {
    const b = S.ent(id), a = S.f.act, br = b.s.br || 0;
    if (a === 'hunt') {
      if ((S.f.carry || 0) > 0 && br < 4) { placeBricks(S, id); return; }
      if (id === 'bed_m') {
        const r = await S.ask('你太困了。躺一下，就一下……？', ['不行，不能睡', '就躺一下']);
        if (r === 1) return doze(S, true);
        return;
      }
      return S.toast(br >= 4 ? `${BEDS[id].name}：四块砖都在` : `${BEDS[id].name}：只剩 ${br} 块砖` + (br <= 2 ? '——床歪了！' : ''));
    }
    if (a === 'bricks') {
      if ((S.f.carry || 0) > 0 && br < 4) {
        placeBricks(S, id);
        if (allFull(S)) {
          S.f.act = 'sleep1';
          await S.say('奶奶', '（从厨房那边）好孩子。水缸我也盖好了。睡吧。');
          S.goal('去睡觉（你的床在最右边那间屋）');
        }
        return;
      }
      if (br >= 4) return S.narr('四条床腿都稳稳地踩在砖上。床板离地高了一拃。');
      return S.narr(`${BEDS[id].name}：还缺 ${4 - br} 块砖。` + ((S.f.carry || 0) ? '' : '\n砖堆在院子里，门口墙根底下。'));
    }
    if (a === 'sleep1' && id === 'bed_m') {
      const r = await S.ask('躺下睡觉？', ['睡吧', '再等等']);
      if (r === 0) return night1(S);
      return;
    }
    if (a === 'brick1' && id === 'bed_s') {
      if (!(S.f.carry > 0)) return S.narr('西菲的床脚少了一块砖，床往一边歪了一点。砖被它拿到院子里去了。');
      placeBricks(S, id);
      await S.say('西菲', ['……它还会回来吗？', '（他把被子拉到眼睛底下。）我不睡了。我看着。']);
      return morning(S);
    }
    if (a === 'night1' || a === 'brick1') return S.narr(id === 'bed_s' ? '西菲的床脚少了一块砖，床往一边歪了一点。' : '床还稳稳的。');
    if (id === 'bed_m') return S.narr('你的床。被子是奶奶新弹的棉花，一股太阳味。');
    return S.narr(`${BEDS[id].name}。四条腿都垫着红砖。`);
  }

  async function night1(S) {
    S.f.act = 'night1';
    await S.fade(1, 700);
    S.hide('gogo_h'); S.hide('sipho_h');
    S.ent('bed_g').s.who = 'gogo'; S.ent('bed_s').s.who = 'sipho';
    S.ent('plamp').off = true; S.ent('gcand').off = true; S.ent('gcand').light = null;
    S.ent('kdrum').covered = false; S.ent('kdrum').s.lid = 1;
    S.dark(.9); S.plr(2.4); S.amb('night'); S.pos(13, 3, 1);
    await S.wait(500);
    drip(S); await S.wait(400); drip(S); await S.wait(600); drip(S);
    await S.fade(0, 900);
    await S.say('西菲', '（很小声）坦迪姐姐……坦迪姐姐……', { style: 'whisper' });
    await S.think('西菲坐在他的床上，一只手捂着嘴，一只手朝厨房那边指。\n厨房里，「咕咚、咕咚」。');
    S.ent('bed_s').s.who = 'up'; S.ent('bed_s').s.pt = 0;
    S.place('tok', DRINK[0], DRINK[1], 2); const e = S.ent('tok'); e.s.vis = 1; e.alpha = 1;
    S.lights([[13 * TS + 8, 6 * TS + 4, 2.3, .85]]); S.focus(13, 6); gulp(S);
    await S.narr('水缸边上，蹲着一个东西。\n比西菲还矮。浑身是湿透的毛，一缕一缕往下滴水。\n它扒着桶沿，把整个脑袋埋在水缸里，咕咚、咕咚地喝。');
    await S.wait(500); S.face('tok', 0); await S.wait(300);
    await S.scare('face', { face: 'tok' });
    await S.narr('它抬起头。两只黄眼睛，越过整间屋子，看着你。\n然后它又低下头，喝完了最后一口——');
    await S.alpha('tok', 0, 1100); e.hidden = false; e.alpha = 1; e.s.vis = 0;
    await S.say('西菲', '它……它喝完了。你看不见它了，对不对？我还看得见。它往我这边来了！', { style: 'whisper' });
    S.focus(null); S.lights(null);
    const P1 = [[12, 6], [11, 7], [10, 7], [9, 7], [8, 6], [7, 5], [7, 4], [7, 3]];
    for (const [x, y] of P1) { dripAt(S, x, y, 3, true); drip(S, .03); S.ent('bed_s').s.pt = x > 7 ? 2 : 0; await S.wait(300); }
    scrape(S); S.shake(200, 1); S.ent('bed_s').s.br = 3; thud(S);
    await S.say('西菲', '它在拿我床底下的砖！');
    const P2 = [[7, 4], [7, 5], [6, 6], [6, 7], [6, 8], [6, 9]];
    for (const [x, y] of P2) { dripAt(S, x, y, 0, true); drip(S, .03); await S.wait(220); }
    S.sfx('open'); S.ent('bed_s').s.pt = 0;
    await S.say('西菲', '它出去了！它抱着砖往院子里去了！');
    await S.think('地上一串湿脚印，小小的，像小孩光着脚——可是脚趾太长了。');
    S.goal('跟着水迹出去，把砖找回来');
  }

  async function morning(S) {
    await S.fade(1, 800);
    clearDrips(S); S.hide('tok');
    for (let i = 0; i < 8; i++) S.hide('yt' + i);
    await S.card('第二天', '1996年7月　星期六', '天亮了。\n奶奶说，昨晚她什么也没听见。\n可是她一早起来，先蹲下去，数了每张床底下的砖。');
    S.dark(.2, 'house'); S.plr(4.5); S.amb('room');
    S.ent('bed_g').s.who = ''; S.ent('bed_s').s.who = ''; S.ent('bed_s').s.pt = -1;
    S.ent('plamp').off = true; S.ent('gcand').off = true;
    const d = S.ent('kdrum'); d.covered = false; d.s.leaf = 1; d.s.lid = 1;
    S.show('gogo_h'); S.place('gogo_h', 9, 7, 0); S.show('sipho_h'); S.place('sipho_h', 12, 4, 2);
    S.pos(13, 4, 1);
    await S.fade(0, 600);
    await S.say('西菲', ['坦迪姐姐，我给你画了它。', '就是这个样子。我没骗人。']);
    await S.note('drawing'); S.f.clueTree = true;
    S.place('sipho_h', 8, 3, 0);
    await S.say('奶奶', ['（奶奶在厨房那边，声音很累。）', '德拉米尼妈妈今早从山那边回来了。你去一趟吧——你读过书，说得清楚。', '出门前……先看看厨房的水缸。今早盖子又开了。']);
    S.f.act = 'day2';
    S.goal('看看水缸，再去找治疗师德拉米尼妈妈');
    S.cp('day2');
  }

  async function meeting(S) {
    S.f.met = true;
    for (const k of ['sibu', 'vil1', 'vil2', 'vil3']) S.show(k);
    await S.fade(1, 250); S.pos(11, 6, 3); S.focus(11, 5); await S.fade(0, 350);
    await S.narr('大树底下围了一圈人。是村会——男人们站着，女人们抱着胳膊。\n人群中间，西布西索的嗓门最大。');
    S.face('sibu', 'pl'); S.face('vil1', 'pl');
    await S.say('西布西索', ['坦迪！你来得正好。你从城里回来，读过书。', '这几天，姆特瓦家、恩科西家、恩德洛武的铺子，都丢了砖。你家也丢了吧？', '这东西不会自己来。是有人叫来的。']);
    await S.say('村里的女人', '……那个老太太，一个人住，一个人去河边。谁见过她跟人好好说过话？');
    await S.say('西布西索', ['大家心里都有数。', '你说一句。你说一句，今晚我们就去她家，把话问清楚。']);
    S.tone('sine', 70, 60, 1.6, .06, 0, 0);
    S.focus(5, 3);
    let r = await S.ask('人们都在看你。远处，祖鲁老太太坐在她家门口，也在看你。', ['「……是她。」', '「我不知道是谁。」', '「没有证据，别乱说。」']);
    if (r === 0) {
      const c = await S.ask('你真的要说出来吗？说出口的话，收不回来。', ['「是她。」', '「……不，我不知道。」']);
      if (c === 0) return blameEnd(S);
      r = 1;
    }
    S.focus(null);
    if (r === 2) {
      S.f.defend = true;
      await S.say('西布西索', '……城里回来的，就是不一样。哼。');
      await S.narr('有几个人低下了头。抱着孩子的那个女人，悄悄退出了人群。');
    } else {
      await S.say('西布西索', '不知道？那就等着瞧。今晚谁家再丢砖，就是她。');
      await S.think('奶奶说：猜错一个人，比它还害人。\n……我是不是应该说点什么。');
    }
    S.hide('vil2'); S.hide('vil3');
    S.goal('去找治疗师德拉米尼妈妈（挂白旗那家）');
  }

  async function blameEnd(S) {
    S.f.blamed = true; BLAMED++;
    await S.say('西布西索', '好！大家都听见了！');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'blame', title: '指认', text: '那天下午，西布西索带着人去了老太太家。\n没有人动手。可是有人往她的门上抹了泥，有人把她的鸡放了，孩子们朝她的窗户扔石子。\n天黑以前，她裹着那条旧毯子，提着一只塑料袋，一个人走上了去镇上的土路。再也没有回来。\n\n那天夜里，奶奶床脚下的砖，还是少了一块。\n地上还是有水迹，从水缸，一直到床边。\n\n叫它来的人，从来就不是她。' });
  }

  async function night2(S) {
    S.f.act = 'night2';
    await S.card('第二天　夜里', '', '奶奶把三张床又垫了一遍，在门边码了两块备用砖。\n西菲不肯睡，坐在床上，眼睛瞪得圆圆的。\n\n「它今晚还会来。」他说，「它的石子还在肚子里。」');
    S.hide('gogo_h'); S.hide('sipho_h');
    for (const k in BEDS) S.ent(k).s.br = 4;
    Object.assign(S.ent('bed_g').s, { who: 'gogo' }); Object.assign(S.ent('bed_s').s, { who: 'up', pt: 0 });
    S.ent('spare').s.n = 2; S.ent('plamp').off = false;
    S.dark(.9); S.plr(2.6); S.amb('night'); S.pos(12, 3, 0);
    await S.wait(400); drip(S); await S.wait(500); drip(S);
    S.ent('kdrum').covered = false; S.ent('kdrum').s.lid = 1; S.sfx('glass');
    await S.say('西菲', ['来了……它从水缸里爬出来了。它又喝饱了。', '我给你指！我喊它在哪儿，你去扑它！']);
    await S.think('扑住它三回，它就会把石子吐出来。\n床底下的砖一少，就得垫回去——少到两块，床就歪了，它就爬得上去。\n还有……不能睡着。');
    S.f.act = 'hunt';
    S.goal('扑住看不见的它（0/3）：看水迹、听西菲喊');
    S.cp('hunt');
    huntBegin(S);
    S.toast('走进它所在的那一格，就能扑住它');
    if (S.coop) S.toast('双人：一人盯西菲的喊声和水迹报方位，一人去扑');
  }
})();
