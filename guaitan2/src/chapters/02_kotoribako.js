/* ================= 第二夜 · 子取箱 ================= */
(() => {
  /* ---------- 颜色 ---------- */
  const DUSK = 'rgba(255,150,80,.14)';
  const MOON = 'rgba(150,175,220,.10)';
  const WARM = 'rgba(255,185,110,.20)';
  const WA = '#7a4e2a', WB = '#b8865a', WC = '#3e2614', WD = '#d4a46c';   // 寄木的四种木色

  /* ---------- 合成音效（S.tone，双方都听得到） ---------- */
  /* 暮蝉：卡那卡那卡那……一串往下掉的高音 */
  function higurashi(S, vol = .014) { for (let i = 0; i < 11; i++) S.tone('triangle', 4300 - i * 70, 3950 - i * 70, .085, vol * (1 - i / 14), i * .105, 6500); }
  /* 木片滑动：一声干涩的「咔哒」 */
  function click(S) { S.tone('triangle', 520, 360, .05, .06, 0, 1800); S.tone('square', 190, 150, .04, .035, .05, 900); }
  /* 推不动：木头顶住木头 */
  function stuck(S) { S.tone('square', 118, 104, .07, .05, 0, 600); }
  /* 箱子里面在敲：低、闷，很耐心 */
  function knock(S, n = 1, vol = .08) { for (let i = 0; i < n; i++) { S.tone('sine', 96, 58, .16, vol, i * .5); S.tone('triangle', 190, 90, .07, vol * .5, i * .5, 500); } }
  /* 箱子的嗡声：很低，几乎听不见 */
  function hum(S, vol = .05) { S.tone('sine', 55, 52, 1.4, vol, 0, 300); S.tone('sine', 82.5, 80, 1.2, vol * .5, .2, 300); }
  /* 拝殿的铃 */
  function suzu(S) { [2100, 2650, 3150, 2400, 2900].forEach((f, i) => S.tone('sine', f, f * .985, .55, .028, i * .055)); }
  /* 拍手 / 鞠躬 */
  function clap(S, d = 0) { S.tone('square', 1300, 380, .035, .09, d, 3200); S.tone('triangle', 320, 120, .05, .06, d, 1200); }
  function bow(S, d = 0) { S.tone('sine', 220, 196, .3, .03, d, 900); }
  /* 光脚踩在石板上：啪嗒，啪嗒 */
  function barefoot(S, n = 6) { for (let i = 0; i < n; i++) S.tone('triangle', 210, 90, .06, Math.max(.006, .06 - i * .008), i * .45, 700); }

  /* ---------- 机关：开的顺序（封的时候倒着来，往反方向推） ---------- */
  const MOVES = [
    { k: '右↓', u: '右↑', t: '右板往下' }, { k: '顶→', u: '顶←', t: '顶盖往右' }, { k: '左↑', u: '左↓', t: '左板往上' },
    { k: '前←', u: '前→', t: '前板往左' }, { k: '顶→', u: '顶←', t: '顶盖往右' }, { k: '后↓', u: '后↑', t: '后板往下' }, { k: '顶→', u: '顶←', t: '顶盖往右' }];
  const KEYS = ['顶←', '顶→', '左↑', '左↓', '右↑', '右↓', '前←', '前→', '后↑', '后↓', '栓'];
  const KNAME = { '顶←': '顶盖往左', '顶→': '顶盖往右', '左↑': '左板往上', '左↓': '左板往下', '右↑': '右板往上', '右↓': '右板往下', '前←': '前板往左', '前→': '前板往右', '后↑': '后板往上', '后↓': '后板往下', '栓': '插木栓' };
  function topN(st) { return MOVES.slice(0, st).filter(m => m.k === '顶→').length; }
  function boxText(s) {
    const st = s.st;
    return ['顶盖：' + ['合着', '往右错开一指', '往右滑开一截（黑缝）', '完全滑开'][topN(st)] + '　底面：' + (s.peg ? '木栓插着' : '木栓孔空着'),
      '左板：' + (st >= 3 ? '往上抬起' : '合着') + '　右板：' + (st >= 1 ? '往下错开' : '合着'),
      '前板：' + (st >= 4 ? '往左挪开' : '合着') + '　后板：' + (st >= 6 ? '往下沉了' : '合着')].join('\n');
  }
  function answerFrom(st) { const a = []; for (let i = st - 1; i >= 0; i--) a.push(MOVES[i].u); a.push('栓'); return a; }

  /* ---------- 夜里：抱着箱子穿过院子 ---------- */
  const NT = { t: 0, spd: 2.8, near: 0, warned: false, saved: false, frz: 0, ft: 0, wt: 0 };
  const SHO0 = 2.8, SHOMAX = 3.3; window.__NT = NT;
  let TRIES = 0, DEATHS = 0, VTRIES = 0;
  const KT = { t: 3 };   // 主机本地：第几次走这段、死过几次（不进检查点，重来时用来给提示）
  const HOUSE = [1, 6, 7, 10];   // 主屋在院子地图上的范围 x0,y0,x1,y1
  function houseDist(x, y) { return Math.max(0, HOUSE[0] - x, x - HOUSE[2]) + Math.max(0, HOUSE[1] - y, y - HOUSE[3]); }
  const caughtSho = async S => {
    DEATHS++;
    await S.scare('face', { face: 'sho', sfx: 'sting' });
    await S.die('小翔的手，碰到了箱角。\n他「啊」地轻轻叫了一声，站住不动了。\n你听见怀里的箱子，「咯」地响了一下——像是在笑。\n\n（小翔走得比你慢，可越拖越快。别停下，别迎着他走；从参道往东绕，去本殿。）', '他碰到了箱子');
  };
  const nearDie = async S => {
    DEATHS++;
    S.fx('red'); S.sfx('thud');
    await S.die('主屋里「咚」的一声，有人倒在了榻榻米上。\n奶奶在喊澪的名字，一声比一声急。\n\n（抱着箱子，离主屋至少隔开两格。从参道和东边绕过去。）', '离主屋太近了');
  };
  async function startNight(S) {
    const again = TRIES++ > 0;
    S.stop('sho_y'); S.hide('sho_y');
    Object.assign(NT, { t: 0, spd: SHO0, near: 0, warned: false, saved: false, frz: 0, ft: 0, wt: 0 });
    for (const id of ['hwin1', 'hwin2']) { const w = S.ent(id); w.lit = true; w.off = false; }
    S.norun(true); S.speed(.85); S.amb('night'); S.dark(.9);
    if (!again) await S.narr('院子里一丝风也没有。石灯笼里的火苗，直直地立着，一动不动。');
    S.place('sho_y', 4, 11, 0); S.focus(4, 11); S.sfx('open');
    await S.narr('主屋的玄关门，「哗啦」一声，自己开了。');
    S.bubble('sho_y', '…', 1200);
    await S.say('小翔', '……箱子……给我看看嘛……', { style: 'whisper' });
    if (!again) {
      barefoot(S, 4);
      await S.narr('是小翔。光着脚，穿着睡衣，眼睛闭着。\n他朝你这边，一步，一步，走过来。');
      await S.say('主屋里，奶奶', '小翔？！小翔呢——', { style: 'whisper' });
      await S.think('不能让他碰到箱子。也不能离主屋太近，澪还在里面。\n……绕开他，去本殿。');
      await S.narr('（要是有同伴：一个人抱着箱子走，另一个人在画面上点一下，就能给对方标出小翔在哪儿。）');
    }
    S.focus(null);
    if (DEATHS) S.toast('别停下，别迎着他走；离主屋两格以外，从东边绕');
    S.goal('绕开小翔，把箱子送进本殿（往东绕；离主屋远一点）');
    S.chase('sho_y', { spd: NT.spd, catch: caughtSho }); S.ent('sho_y').chase.wait = .9;
  }
  function nightTick(S, dt) {
    if (S.f.phase !== 'night' || !S.has('hako') || S.busy || W.ended) return;
    const g = S.ent('sho_y'); if (!g || g.hidden || !g.chase) return;
    const gd = Math.abs(g.px - W.pl.px) / TS + Math.abs(g.py - W.pl.py) / TS;
    /* 第一次被他追到身边：奶奶在窗里喊他的名字，他停住一下（警告）；第二次就碰到了 */
    if (NT.frz > 0) { NT.frz -= dt; if (NT.frz <= 0) S.freeze('sho_y', false); }
    else if (!NT.saved && gd <= 1.7) {
      NT.saved = true; NT.frz = 1.3; S.freeze('sho_y', true);
      S.run(async S => {
        S.bubble('sho_y', '?', 1300);
        await S.say('主屋的窗户里，奶奶', '小翔——！！', { style: 'big' });
        S.toast('他停住了——快走开！');
      });
      return;
    }
    NT.t += dt;
    if (NT.t > 4) { NT.t = 0; NT.spd = Math.min(SHOMAX, NT.spd + .12); g.chase.spd = NT.spd; knock(S, 1, .05); S.bubble('sho_y', '…', 700); }
    /* 光脚的脚步声：越近越响 */
    if ((g.fr || g.mv) && (NT.ft -= dt) <= 0) { NT.ft = .42; const v = Math.max(.004, .07 - gd * .006); S.tone('triangle', 210, 90, .06, v, 0, 500 + Math.max(0, 900 - gd * 80)); }
    /* 主屋警戒：三格内窗户闪，两格内澪难受（先警告，再出事） */
    const hd = houseDist(S.pl.x, S.pl.y);
    if (hd <= 3) { if ((NT.wt -= dt) <= 0) { NT.wt = hd <= 2 ? .12 : .3; for (const id of ['hwin1', 'hwin2']) { const w = S.ent(id); w.lit = !w.lit; w.off = !w.lit; } } }
    else if (NT.wt !== 0) { NT.wt = 0; for (const id of ['hwin1', 'hwin2']) { const w = S.ent(id); w.lit = true; w.off = false; } }
    if (hd <= 2) {
      NT.near += dt;
      if (!NT.warned && NT.near > .5) {
        NT.warned = true; NT.near = 0;
        S.run(async S => {
          S.sfx('cry'); S.shake(300, 1);
          await S.narr('主屋的窗户里，传来澪压得很低的咳嗽声。一声，又一声。\n……离主屋太近了！');
          S.toast('离主屋远一点（两格以外）');
        });
      } else if (NT.warned && NT.near > .6) { NT.near = 0; S.stop('sho_y'); S.run(nearDie); }
    } else NT.near = Math.max(0, NT.near - dt * .5);
  }

  /* ---------- 目标 ---------- */
  function stepGoal(S) {
    const f = S.f;
    if (f.phase !== 'prep') return;
    const h = S.ent('hako');
    if (!(h.s.st === 0 && h.s.peg)) {
      const need = [];
      if (!f.readLedger) need.push('找《箱守帐》（旧仓）');
      if (!f.askedMio) need.push('问澪是怎么推的（走廊东头她的房间）');
      if (f.askedMio && !S.has('peg') && !h.s.peg) need.push('找木栓（旧仓稻草堆）');
      return S.goal(need.length ? '封箱前：' + need.join('、') : '回旧仓封箱：一人看「笺」里的《箱守帐》念顺序，一人推木片');
    }
    const miss = [];
    if (!S.has('key')) miss.push('本殿钥匙（走廊柱子）');
    if (!S.has('salt')) miss.push('盐（厨房）');
    if (!S.has('sake')) miss.push('神酒（拝殿）');
    if (miss.length) return S.goal('箱子封好了。备齐：' + miss.join('、'));
    S.goal('东西齐了。回旧仓，把箱子抱起来');
  }

  defChapter({
    id: 'kotoribako', n: 2, title: '子取箱', sub: '旧仓最里面的桐木箱子里，装着一只精巧的机关箱。女人和孩子，不能靠近它。', origin: '日本网络怪谈（2ch）', color: '#4a3220',
    amb: 'night', floor: 'darkwood', wall: 'wood', dark: .6, plr: 3.2,
    endings: { dawn: '天亮了', ret: '送还（隐藏）', opened: '箱开了', door: '门外的人' },
    /* 选章卡片：注连绳下，一只顶盖错开的寄木箱，黑缝里有一只眼睛 */
    thumb(g, w, h) {
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      for (let x = 0; x < w; x += 4) R(x, 5 + Math.round(Math.sin(x / 9) * 2), 4, 3, x % 8 ? '#c8b070' : '#9a8040');
      for (const sx of [30, 78, 126]) { R(sx, 9, 4, 4, '#f4f0e6'); R(sx + 2, 13, 4, 4, '#f4f0e6'); R(sx, 17, 4, 4, '#f4f0e6'); R(sx + 2, 21, 4, 3, '#e0dacc'); }
      R(46, 32, 68, 34, WC); R(48, 34, 64, 30, WA);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { const x = 50 + i * 7, y = 36 + j * 7, c = (i + j) % 2 ? WB : WD; R(x, y, 5, 2, c); R(x + 1, y + 2, 3, 2, (i + j) % 2 ? WC : WB); R(x + 2, y + 4, 1, 1, c); }
      R(46, 25, 20, 8, '#030202');
      R(64, 23, 54, 10, WB); R(64, 23, 54, 2, WD); R(64, 31, 54, 2, WC); for (let i = 0; i < 6; i++) R(68 + i * 8, 26, 4, 3, i % 2 ? WC : WA);
      R(49, 27, 12, 4, '#e8e0d0'); R(54, 27, 3, 4, '#140808'); R(49, 30, 12, 1, '#8a2020');
      R(100, 40, 8, 22, '#ece6d6'); R(101, 47, 6, 5, '#b02020'); R(100, 62, 3, 3, '#ece6d6'); R(105, 62, 3, 4, '#ece6d6');
    },
    /* 惊吓大头像（32×32） */
    faces: {
      /* 箱子：顶盖往右滑开，黑缝里有一只眼睛，越睁越大 */
      hako(R, a) {
        const K = '#020101';
        R(0, 0, 32, 32, '#0a0606');
        R(0, 13, 32, 19, WC); R(1, 14, 30, 17, WA);
        for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { const x = 2 + i * 4, y = 15 + j * 4, c = (i + j) % 2 ? WB : WD; R(x, y, 3, 1, c); R(x + 1, y + 1, 1, 1, c); R(x, y + 2, 3, 1, (i + j) % 2 ? WC : WA); }
        const s = 6 + Math.round(a * 4);
        R(0, 5, 32, 8, WC); R(0, 6, s + 1, 6, K);
        R(1 + s, 4, 31, 8, WB); R(1 + s, 4, 31, 1, WD); R(1 + s, 11, 31, 1, WC);
        for (let i = 0; i < 5; i++) R(3 + s + i * 5, 6, 3, 3, i % 2 ? WC : WA);
        const eh = 1 + Math.round(a * 3), ey = 9 - (eh >> 1);
        R(1, ey, s - 1, eh, '#e6ded0'); R((s >> 1), ey, 2, eh, '#100606'); if (eh > 2) R(1, ey + eh - 1, s - 1, 1, '#8a1c1c');
        R(22, 14, 4, 12, '#ece6d6'); R(22, 17, 4, 3, '#a81c1c'); R(23, 26, 2, 3, '#ece6d6');
        R(1 + s, 12, 1, 2 + Math.round(a * 5), K); R(3, 12, 1, 1 + Math.round(a * 3), K);
      },
      /* 梦游的小翔：闭着眼——然后睁开，只有眼白 */
      sho(R, a) {
        const SK = '#e6d2c4', SK2 = '#bca898', H = '#1a1418', PJ = '#8ab0d0', PJ2 = '#5a80a8';
        R(0, 0, 32, 32, '#05060a');
        R(3, 26, 26, 6, PJ); for (let x = 4; x < 28; x += 4) R(x, 26, 2, 6, PJ2); R(12, 25, 8, 3, SK2);
        R(8, 6, 16, 19, SK); R(7, 9, 18, 13, SK); R(9, 24, 14, 2, SK2);
        R(7, 3, 18, 6, H); R(6, 6, 4, 8, H); R(22, 6, 4, 8, H); R(9, 8, 14, 3, H); for (const x of [10, 14, 18]) R(x, 11, 2, 1, H);
        R(9, 13, 6, 1, SK2); R(17, 13, 6, 1, SK2);
        if (a < .45) { R(10, 15, 4, 1, '#3a2a2a'); R(18, 15, 4, 1, '#3a2a2a'); }
        else { R(10, 14, 4, 3, '#f4f4ee'); R(18, 14, 4, 3, '#f4f4ee'); R(10, 17, 4, 1, '#9a8a90'); R(18, 17, 4, 1, '#9a8a90'); }
        R(10, 18, 4, 1, '#c8b0b8'); R(18, 18, 4, 1, '#c8b0b8');
        R(15, 21, 2, 1 + Math.round(a * 2), '#3a1a1a');
      },
      /* 门外的澪：长发、闭着眼——然后睁开，黑的 */
      mio(R, a) {
        const SK = '#dcd4d8', SK2 = '#a8a0aa', H = '#0c0a0e', HL = '#2a2632';
        R(0, 0, 32, 32, '#04040a');
        R(3, 4, 26, 28, H); R(2, 26, 8, 6, '#5a6e8a'); R(22, 26, 8, 6, '#5a6e8a');
        R(9, 7, 14, 18, SK); R(8, 10, 16, 12, SK); R(10, 25, 12, 2, SK2); R(12, 27, 8, 5, SK);
        R(8, 5, 16, 4, H); R(8, 8, 3, 10, H); R(21, 8, 3, 10, H); R(13, 7, 2, 10, H); R(14, 17, 1, 3, HL);
        for (const x of [5, 26]) R(x, 8, 1, 20, HL);
        if (a < .55) { R(10, 15, 3, 1, '#4a3a44'); R(18, 15, 4, 1, '#4a3a44'); }
        else { R(10, 14, 3, 2, '#000'); R(18, 14, 4, 2, '#000'); R(11, 14, 1, 1, '#ddd'); R(19, 14, 1, 1, '#ddd'); }
        R(15, 21, 3, 1 + Math.round(a), '#5a3a44');
      }
    },
    people: {
      me: { skin: '#f0c8a0', hair: '#1e1a18', hs: 'short', top: '#e6e2d6', top2: '#c8c4b8', bottom: '#3a4a6a', shoes: '#2a2a2a' },
      mio: { skin: '#f2d0b4', hair: '#141016', hs: 'long', top: '#5a6e8a', bottom: '#2a2a34', apron: '#d8d2c0', blush: '#e8b0a0' },
      sho: { skin: '#f2cfae', hair: '#1a1416', hs: 'short', top: '#e0a838', bottom: '#3a4a6a', child: true },
      /* 梦游：条纹睡衣、光脚、闭着眼 */
      shop: { key: 'kt-shop', skin: '#e6d2c4', hair: '#1a1416', hs: 'short', top: '#8ab0d0', bottom: '#8ab0d0', shoes: '#e6d2c4', child: true, eye: '#b89a8c',
        extra(g, d, fr, G, R) { for (let y = G.tT + 1; y <= G.lB; y += 3) R(4, y, 8, 1, '#5a80a8'); } },
      baba: { skin: '#e8c8a8', hair: '#cfc8c0', hs: 'bun', top: '#5a4a5a', bottom: '#4a3a44', skirt: true, apron: '#8a7a6a' },
      chichi: { skin: '#e8c2a0', hair: '#3a3434', hs: 'short', top: '#2a2a30', top2: '#e8e8e8', bottom: '#2a2a30', shoes: '#1a1a1a' }
    },
    items: {
      peg: { name: '木栓', desc: '一根比牙签粗一点的小木栓，两头磨得发亮。是从箱子底下拔出来的。' },
      key: { name: '本殿的钥匙', desc: '一把老式的铜钥匙，挂着一块写着「本殿」的小木牌。' },
      salt: { name: '粗盐', desc: '厨房罐子里的粗盐，用和纸包了一大包。叔叔说，唐柜里先铺一层。' },
      sake: { name: '神酒', desc: '拝殿三方上供着的一对白瓷酒瓶，瓶口插着折好的白纸。' },
      hako: { name: '子取箱（封好的）', desc: '用白布包着。很轻。可是抱得越久，越觉得它在一点一点地变沉。' }
    },
    notes: {
      ledger: { title: '《箱守帐》', text: '（线装旧帐，纸页又黄又脆。凡受托之箱，记其等级、受托之年、当返之年。）\n\n明治十年受托　「二子」　大正十四年　已返\n明治十二年受托　「一子」　昭和三年　已返\n明治二十年受托　「（墨涂掉了）」　平成十七年　当返\n\n（最后一页，朱笔：）\n此箱开之序（封时逆行，反向推回）：\n一、右板□□　二、□□往右　三、（水渍晕开，看不清）\n四、前板往左　五、顶盖往右　六、后板往下\n七、顶盖往右——至此箱开。切勿至此。\n\n女人、孩童，不可近。' },
      fuda: { title: '桐木外箱上的字', text: '（桐木外箱的盖子内侧，墨迹已经褪成了茶色。）\n\n「明治二十年　自某村某家　受托\n　女子供　不可近\n　御影神社　宫司　神代某　谨封」\n\n盖子外面原本贴着一张封条，盖着朱砂印。封条从中间裂开了，断口还很新。\n箱底垫着一层发黑的盐粒，摸上去潮乎乎的。' },
      memo: { title: '曾祖父的手记', text: '（佛龛抽屉里的黑布面小册子。昭和二十二年记。）\n\n父亲临终前，把箱子的来历告诉了我。\n明治初年，隐岐闹了乱子。有个男人逃到这边，被一个世世代代受人欺压的村子藏了起来。为了报恩，他教村里人做一种箱子。\n箱子不害男人，只害女人和孩子——是要叫仇家断了根。\n做箱要付「代价」，付得越多越凶：一子、二子……七子，最凶的叫「八开」。代价是什么，父亲说了，我不写。\n箱子太凶，连做箱的村子也受不住，后来分给几户人家和神社轮流守着，用盐和祝词慢慢地净。过了百来年，力气就尽了，到那时拆开、烧掉，叫作「返」。\n守箱的人，别好奇。' },
      rules: { title: '电话旁的便笺（你记的）', text: '神代叔叔在电话里说的：\n\n一、封箱：开的时候最后动的那块，封的时候最先推回去，往它错开的反方向推。全推回去，再插木栓。\n　　开的顺序 → 旧仓《箱守帐》最后一页。澪记得前两步。\n二、送进本殿：唐柜里【先铺盐】，再放箱子，盖上；供神酒；向祭坛行礼。\n　　钥匙＝走廊柱子　盐＝厨房　神酒＝拝殿的三方\n三、拿着箱子时，女人和孩子一步都不能靠近。离主屋远一点。\n四、关上本殿的门，守到天亮。\n　　外面不管谁叫，都别开门。箱子不管怎么响，都别打开。\n\n（叔叔坐头班车回来。天亮就到。）' }
    },
    legend: '「コトリバコ」（子取箱，也写作「子取り箱」）出自 2005 年 6 月日本匿名论坛 2ch 灵异版的一篇长帖。发帖人说，朋友家整理旧仓库时翻出一个精巧的木制机关箱；他们找来另一位家里经营神社的朋友，那位朋友一看见箱子就脸色煞白、当场呕吐，一边给父亲打电话，一边叫人把家里的女人和孩子带出去，随后抱着箱子，嘴里念叨着「没事，没事」把它带走了。帖子的后半，是这位朋友转述的箱子来历。\n\n按帖子的说法：幕末到明治初年，隐岐发生骚乱（1868 年的「隐岐骚动」是真实的历史事件），一个从隐岐逃来的男人被岛根某个长期受欺压的村子收留，作为报答，教村民做这种诅咒之箱。箱子只伤女人和孩子，用意是让仇家断绝血脉；按制作时付出的「代价」分级，读作イッポウ、ニホウ……チッポウ，也就是「一子」到「七子」，最凶的叫「ハッカイ（八开）」。原帖对制法写得相当具体，本游戏不作复述。据说箱子太凶，连造箱的村子也承受不住，最后交给几户人家和神社轮流保管、慢慢净化；诅咒会随岁月减弱，力量耗尽后再拆解处理。\n\n这篇帖子后来又有续篇，被大量转载，成了日本网络怪谈（「洒落怖」）的代表作之一，衍生出漫画、小说和各种改编。它没有任何文献或实物佐证，等级的写法、箱子的数目、保管的年限，各种转述也不尽相同。由于原帖把造箱者写成受歧视的村落，牵涉到真实的歧视历史，转述时常被刻意淡化，讨论时也一直有争议。\n\n（本章中的御影神社、神代一家（澪、小翔、澄江奶奶与宫司）、藤村彻、《箱守帐》、箱子的开封顺序与木栓、盐与神酒的安放法、守夜的禁忌、「平成十七年当返」以及几种结局，均为游戏虚构。「二拜、二拍手、一拜」是日本神社常见的参拜礼法，各社也有不同的规矩。）',
    start: { map: 'kura', x: 6, y: 8, dir: 3 },
    resume: {
      kura: async S => { S.goal('去主屋接电话（箱子留在仓里）'); },
      prep: async S => { stepGoal(S); },
      night: async S => {
        S.stop('sho_y'); S.hide('sho_y'); S.norun(true); S.speed(.85); S.amb('night');
        S.goal('抱着箱子出仓库，绕开主屋，送进本殿');
        if (DEATHS) await S.think('……再来一次。\n别停下，别迎着他走。离主屋隔开两格，从参道往东绕。');
      },
      vigil: async S => { await vigil(S); }
    },
    async intro(S) {
      TRIES = 0; DEATHS = 0; VTRIES = 0;
      await S.card('第二夜　子取箱', '2005年7月　岛根县　某海边小镇', '神代家世世代代守着镇上的御影神社。\n夏祭前三天，发小澪把你叫去帮忙，\n打扫神社后面那座几十年没人进过的旧仓。\n\n傍晚。暮蝉在林子里叫个不停。');
    },
    sprites: {
      /* 机关箱（摆在作业台上）：e.st = 已经推了几步，e.peg = 木栓 */
      kbox(g, e, t, R) {
        const st = e.st || 0, top = topN(st), L = st >= 3 ? -2 : 0, Rr = st >= 1 ? 2 : 0;
        R(1, 15, 14, 1, 'rgba(0,0,0,.4)');
        R(2, 6, 12, 9, WA);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const c = (i + j) % 2 ? WB : WD; R(3 + i * 3, 7 + j * 4, 2, 1, c); R(3 + i * 3, 8 + j * 4, 1, 1, (i + j) % 2 ? WC : WB); }
        R(1, 6 + L, 1, 9, WC); R(1, 6 + L, 1, 1, WD); R(14, 6 + Rr, 1, 9, WC); R(14, 6 + Rr, 1, 1, WD);
        if (st >= 4) R(3, 14, 4, 1, '#0a0606');
        if (top > 0) R(2, 3, top * 3, 3, '#050303');
        R(2 + top * 3, 2, 12, 4, WB); R(2 + top * 3, 2, 12, 1, WD); R(2 + top * 3, 5, 12, 1, WC); R(4 + top * 3, 3, 2, 1, WC); R(9 + top * 3, 3, 2, 1, WC);
        if (e.cloth) { R(1, 1, 14, 14, '#e8e4da'); R(1, 1, 14, 1, '#f6f4ee'); R(7, 1, 2, 14, '#d0ccc0'); }
      },
      workbench(g, e, t, R) { R(2, 10, 2, 5, '#3a2818'); R(28, 10, 2, 5, '#3a2818'); box(R, 0, 3, 32, 8, '#6a4a2c'); R(1, 4, 30, 2, '#7d5a38'); R(20, 5, 6, 3, '#e8e2d0'); R(21, 6, 4, 1, '#888'); },
      kiribako(g, e, t, R) {   // 架子上打开的桐木外箱，裂开的封条
        box(R, 0, -6, 16, 21, '#5a4030'); R(1, 2, 14, 1, '#3a2818');
        box(R, 2, -3, 12, 5, '#d8c8a8'); R(3, -3, 10, 1, '#e8dcc0'); R(3, -2, 10, 3, '#1a120c');
        R(9, -4, 3, 6, '#ece6d6'); R(10, -2, 1, 2, '#b02020'); R(12, -5, 3, 4, '#ece6d6');
        box(R, 2, 5, 12, 7, '#d8c8a8'); R(3, 7, 10, 1, '#c8b898');
      },
      nagamochi(g, e, t, R) { box(R, 0, 0, 32, 15, '#3a2418'); R(1, 1, 30, 2, '#4e3222'); R(0, 6, 32, 1, '#1e120a'); for (const x of [3, 27]) R(x, 3, 2, 10, '#5a5048'); R(14, 6, 4, 4, '#8a7a5a'); },
      straw(g, e, t, R) { R(1, 6, 14, 9, '#a88a48'); for (let i = 0; i < 7; i++) R(1 + i * 2, 4 + (i % 3), 1, 11, i % 2 ? '#c8a860' : '#8a7038'); R(3, 9, 10, 1, '#6a5028'); if (!e.taken) R(11, 13, 2, 1, '#d8b888'); },
      ofuda(g, e, t, R) { R(5, 0, 6, 13, '#ece6d6'); R(5, 0, 6, 1, '#b02020'); R(7, 3, 2, 6, '#222'); R(6, 10, 4, 2, '#b02020'); },
      hondoor(g, e, t, R) {   // 本殿的双开门（w2）
        if (e.open) { R(2, -2, 28, 16, '#080504'); return; }
        R(1, -3, 30, 17, '#4a2a18'); R(2, -2, 13, 15, '#7a4a2a'); R(17, -2, 13, 15, '#7a4a2a');
        for (const x of [4, 19]) { R(x, 0, 9, 1, '#5a3420'); R(x, 6, 9, 1, '#5a3420'); }
        R(14, 4, 4, 3, '#c9a35a'); R(15, 5, 2, 1, '#6a5020'); R(0, -4, 32, 1, '#c9a35a');
      },
      saisen(g, e, t, R) {   // 賽銭箱 + 头顶垂下来的铃绳（w2）
        R(13, -22, 6, 3, '#c9a35a'); R(14, -19, 4, 2, '#a88030');
        for (let y = -17; y < 4; y += 2) { R(15, y, 2, 1, '#c03028'); R(15, y + 1, 2, 1, '#f0ece0'); }
        box(R, 2, 4, 28, 11, '#5a3a22'); for (let i = 0; i < 6; i++) R(4 + i * 4, 5, 2, 4, '#2a1a10'); R(4, 11, 24, 1, '#c9a35a');
      },
      chozuya(g, e, t, R) {   // 手水舍（w2）
        R(2, -14, 2, 28, '#5a3a22'); R(28, -14, 2, 28, '#5a3a22'); R(-2, -18, 36, 5, '#3a2a20'); R(0, -14, 32, 1, '#5a4434');
        box(R, 4, 5, 24, 9, '#7a7a76'); R(6, 6, 20, 4, '#2a4a5a'); R(8, 7, 6, 1, '#6a9aaa'); R(12, 3, 1, 3, '#8a6a3a'); R(11, 2, 4, 2, '#a07a40');
      },
      komainu(g, e, t, R) { R(2, 11, 12, 4, '#6a6a66'); R(4, 4, 8, 8, '#8a8a84'); R(3, 1, 7, 6, '#9a9a94'); R(4, 3, 2, 1, '#333'); R(8, 3, 1, 1, '#333'); R(10, 6, 3, 5, '#7a7a74'); R(3, 0, 2, 2, '#7a7a74'); },
      shimenawa(g, e, t, R) { R(-2, 2, 20, 3, '#c8b070'); R(-2, 4, 20, 1, '#9a8040'); for (const x of [1, 7, 13]) { R(x, 5, 3, 3, '#f4f0e6'); R(x + 1, 8, 3, 3, '#f4f0e6'); } },
      butsudan(g, e, t, R) { box(R, 1, -6, 14, 21, '#1a1012'); R(3, -4, 10, 10, '#3a2418'); R(6, -2, 4, 6, '#c9a35a'); R(4, 8, 8, 2, '#c9a35a'); R(7, 11, 2, 3, '#2a1a1a'); R(8, 6 + Math.sin(t * 2), 1, 2, 'rgba(220,220,220,.45)'); },
      kurophone(g, e, t, R) { R(2, 7, 12, 2, '#5a4030'); R(4, 2, 8, 5, '#141414'); R(3, 1, 10, 2, '#0a0a0a'); R(6, 4, 4, 2, '#e8e2d0'); if (e.lift) R(12, -2, 3, 3, '#0a0a0a'); },
      keyhook(g, e, t, R) { R(3, 1, 10, 9, '#6a5038'); R(4, 2, 8, 7, '#7d6044'); R(7, 3, 2, 1, '#c9a35a'); if (!e.taken) { R(7, 4, 2, 4, '#c9a35a'); R(6, 7, 4, 2, '#e8dcc0'); } },
      saltshelf(g, e, t, R) { R(0, 7, 16, 2, '#6a5038'); R(2, 1, 4, 6, '#e8e4dc'); R(2, 1, 4, 1, '#8a6a4a'); if (!e.taken) { R(8, 2, 5, 5, '#d8d0c0'); R(8, 2, 5, 1, '#5a4a3a'); } R(13, 4, 2, 3, '#7a2a1a'); },
      sleeper(g, e, t, R) { const c = '#c86a5a'; R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0'); R(1, 9, 14, 22, c); R(1, 9, 14, 2, shade(c, .2)); if (!e.empty) { R(5, 3, 6, 5, '#f2cfae'); R(5, 3, 6, 2, '#1a1416'); R(6, 6, 1, 1, '#5a4040'); R(9, 6, 1, 1, '#5a4040'); R(3, 11, 10, 6, shade(c, .1)); } },
      karabitsu(g, e, t, R) {   // 唐柜（w2）
        R(3, 11, 3, 4, '#1a0e08'); R(26, 11, 3, 4, '#1a0e08');
        box(R, 1, 0, 30, 12, '#2a1410'); R(2, 1, 28, 2, '#4a2418');
        if (!e.closed) { R(3, 3, 26, 6, '#120a08'); if (e.salt) { R(4, 6, 24, 3, '#e8e4dc'); } if (e.box) R(12, 4, 8, 4, '#e8e4da'); }
        else { R(1, -2, 30, 3, '#3a1c14'); R(14, -2, 4, 14, '#e8e2d0'); R(1, 5, 30, 1, '#c9a35a'); }
      },
      sanbo(g, e, t, R) { R(3, 9, 10, 6, '#c8b088'); R(6, 11, 4, 3, '#2a1a10'); box(R, 1, 6, 14, 3, '#d8c098'); if (e.sake) { R(4, -1, 3, 7, '#f0ece4'); R(9, -1, 3, 7, '#f0ece4'); R(4, -2, 3, 1, '#e8e2d0'); R(9, -2, 3, 1, '#e8e2d0'); } },
      gohei(g, e, t, R) { R(7, -6, 2, 20, '#d8c898'); R(5, 12, 6, 3, '#6a4a2a'); for (let i = 0; i < 4; i++) { R(3 + (i % 2) * 2, -4 + i * 3, 4, 3, '#f6f2e8'); R(9 - (i % 2) * 2, -4 + i * 3, 4, 3, '#f6f2e8'); } },
      misu(g, e, t, R) { R(0, -2, 32, 15, '#a89060'); for (let y = -1; y < 13; y += 2) R(0, y, 32, 1, '#8a7448'); R(0, -2, 32, 2, '#7a2a1a'); R(14, 2, 4, 4, '#c9a35a'); R(15, 3, 2, 2, '#e8e0c0'); },
      kagura(g, e, t, R) { R(0, 2, 16, 12, '#2a1810'); R(1, 3, 14, 1, '#c9a35a'); R(3, 6, 10, 6, '#3a2418'); R(6, 7, 4, 4, '#8a2a20'); }
    },
    maps: {
      /* ---------------- 旧仓 ---------------- */
      kura: {
        amb: 'night', dark: .6, plr: 3, wall: 'wood', floor: 'darkwood', darkC: '#0a0604',
        rows: [
          '##############',
          '##############',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '######W#######'],
        ents: [
          { id: 'kwin', x: 3, y: 1, spr: 'window', light: { r: 2.6, col: DUSK, dy: 10 }, on: S => S.narr(S.f.phase === 'night' ? '铁栏外面黑透了。主屋的窗户还亮着一盏灯。' : '装着铁栏的小窗。外面的天是橘红色的，暮蝉的叫声一阵一阵涌进来。') },
          { x: 8, y: 1, spr: 'lantern', light: { r: 4.4, col: WARM, flick: true }, on: S => S.narr('挂在梁上的旧提灯，澪接了根电线，换上了灯泡。\n灯光黄黄的，照不进墙角。') },
          { x: 10, y: 1, spr: 'ofuda', on: S => S.narr('柱子上贴着一张神札，纸已经发脆了。\n朱砂写的字，你一个也不认识。底下一行小字：「女人孩童，勿入此仓」。') },
          { x: 1, y: 2, spr: 'shelf', on: S => S.narr('架子上堆着祭典用的东西：卷起来的纸灯笼、褪色的幡、一捆一捆的麻绳。') },
          { x: 2, y: 2, spr: 'shelf', on: S => S.narr('一排落满灰的木盒，标签上写着「御神輿　金具」「太鼓　皮」。') },
          { x: 4, y: 2, w: 2, spr: 'nagamochi', on: S => S.narr('一口黑漆长持，铁搭扣锈住了。\n盖子上用白漆写着「昭和三十年　夏祭」。') },
          { x: 7, y: 2, spr: 'crate', on: S => S.narr('装提灯的木箱。澪说今年的提灯要全部换新。') },
          { id: 'kiri', x: 10, y: 2, spr: 'kiribako', async on(S) {
            if (S.f.phase === 'dusk') return S.say('澪', '那个就是装它的桐木箱子！在最里面，压在一堆东西底下。');
            if (S.once('kiriFirst')) await S.narr('架子最上面，一只打开的桐木外箱。\n封条从中间裂开了，断口还很新。');
            await S.note('fuda'); S.f.readFuda = true;
          } },
          { id: 'ledger', x: 11, y: 2, spr: 'cabinet', col: '#4a3020', async on(S) {
            if (S.f.phase === 'dusk') return S.narr('一只旧柜子，抽屉里放着神社的帐本。');
            if (S.once('ledgerFirst')) await S.narr('柜子的抽屉里，压着一本线装的旧帐。\n封面上两个墨字：《箱守帐》。');
            await S.note('ledger');
            if (!S.f.readLedger) { S.f.readLedger = true; stepGoal(S); }
          } },
          { x: 12, y: 2, spr: 'bookshelf', on: S => S.narr('一格一格的旧帐本，最早的一本写着「明治」。\n你没有再往里翻。') },
          { x: 1, y: 5, spr: 'box', on: S => S.narr('纸箱里是澪下午打扫出来的旧东西：一只缺口的茶碗、几枚生锈的铜钱。') },
          { x: 12, y: 4, spr: 'rope', on: S => S.narr('一盘旧注连绳，稻草已经发黑了。') },
          { id: 'bench', x: 6, y: 5, w: 2, spr: 'workbench', on: S => S.narr('作业台。台面上摊着一块白布、一支手电筒，还有澪的手机。') },
          { id: 'hako', x: 6, y: 5, spr: 'kbox', z: 1, oy: -6, ox: 8, solid: false, s: { st: 3, peg: false }, on: S => hakoOn(S) },
          { id: 'mio', x: 8, y: 5, spr: '@mio', dir: 1, async on(S) {
            if (S.f.phase === 'dusk') return boxScene(S);
            await S.say('澪', '……');
          } },
          { id: 'straw', x: 2, y: 7, spr: 'straw', async on(S) {
            const st = S.ent('straw');
            if (!st.s.taken) {
              st.s.taken = true; S.give('peg');
              await S.narr(S.f.knowPeg ? '你蹲下来，在稻草堆底下一点一点地摸。\n指尖碰到一根小小的、光滑的东西——木栓。' : '扎注连绳剩下的稻草堆。\n底下滚着一根小木栓，两头磨得发亮。……是从什么东西上掉下来的？');
              return stepGoal(S);
            }
            await S.narr('一堆打捆的稻草，是扎注连绳剩下的。有股太阳晒过的味道。');
          } },
          { x: 11, y: 7, spr: 'barrel', on: S => S.narr('一只空酒樽，桶箍上缠着褪色的红白绳。') },
          { x: 10, y: 8, spr: 'basket', on: S => S.narr('竹篓里是澪的扫除工具：鸡毛掸子、抹布、一副胶皮手套。\n手套是干的。她是光着手碰那只箱子的。') },
          { x: 6, y: 9, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.phase === 'dusk') { await S.say('澪', '哎，别走嘛！先来看看这个——'); return S.pos(6, 8, 3); }
            await S.go('yard', 3, 18, 0);
          } },
          { id: 'sho_k', x: 6, y: 8, spr: '@sho', dir: 3, hidden: true, on: S => S.say('小翔', '……') },
          { id: 'baba_k', x: 5, y: 8, spr: '@baba', dir: 3, hidden: true, on: S => S.say('澄江奶奶', '……') }
        ],
        async enter(S, first) {
          if (!first) {
            if (S.f.phase === 'prep' && S.once('kuraPrep')) await S.narr('旧仓里只剩你一个人。\n作业台上那只箱子，在灯底下一动不动。');
            return;
          }
          S.f.phase = 'dusk'; S.dark(.55, 'yard');
          higurashi(S);
          await S.narr('仓门一推开，一股霉味和樟脑味扑出来。\n暮蝉的叫声被关在了外面。');
          S.bubble('mio', '!', 900);
          await S.say('澪', ['彻！你可算来了。', '快来看这个——最里面那个桐木箱子里装着的。']);
          S.goal('看看澪在作业台上摆弄的东西');
        },
        /* 没封好的箱子隔一会儿就嗡一声，错开得越多越响；封好后安静 */
        tick(S, dt) {
          const h = S.ent('hako'); if (!h || h.hidden || S.busy) return;
          const st = h.s.st; if (st === 0 && h.s.peg) return;
          KT.t -= dt; if (KT.t > 0) return;
          KT.t = 7 - st * .6;
          const d = Math.abs(S.pl.x - 6) + Math.abs(S.pl.y - 5);
          if (d <= 7) hum(S, .02 + st * .006 + Math.max(0, 5 - d) * .006);
        }
      },
      /* ---------------- 御影神社 · 境内 ---------------- */
      yard: {
        amb: 'night', dark: .82, plr: 3, wall: 'wood', floor: 'dirt', darkC: '#05060c',
        wallC: { face: '#5a3a24', trim: '#2a1a10' },
        tileOpts: { treeC: '#1e3a24' },
        rows: [
          'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
          'PPPPPPPPPPf######fPPPPPPPPPPPP',
          'PPPPPPPPPPf######fPPPPPPPPPPPP',
          'PPPPPPPPPPf######fPPPPPPPPPPPP',
          'PPPPPPPPPPfkkkkkkfdddddddddPPP',
          'PPPPPPPPddffffffkfdddddddddPPP',
          'P#######dddddddddddddddTdddPPP',
          'P#######dd########dddddddddPPP',
          'P#######dd########dddddddddPPP',
          'P#######dd########dddddddddPPP',
          'P#######ddkkkkkkkkddd#####dPPP',
          'Pdddddddddkkkkkkkkddd#####dPPP',
          'Pddddddddddddkkdddddd#####dPPP',
          'PddddddTdddddkkddddddddddTdPPP',
          'PddddddddddddkkddddddddddddPPP',
          'P#####dddddddkkdddddddTddddPPP',
          'P#####dddddddkkddddddddddddPPP',
          'P#####dddddddkkddddddddddddPPP',
          'PddddddddddddkkddddTdddddTdPPP',
          'PdddddddTddddkkddddddddddddPPP',
          'PPPPPPPPPPPddkkddPPPPPPPPPPPPP',
          'PPPPPPPPPPPPPkkPPPPPPPPPPPPPPP'],
        ents: [
          /* 本殿 */
          { id: 'hondoor', x: 13, y: 3, w: 2, spr: 'hondoor', on: S => honDoor(S) },
          { x: 11, y: 3, spr: 'invisible', light: { r: 2, col: WARM } },
          /* 拝殿 */
          { id: 'saisen', x: 13, y: 10, w: 2, spr: 'saisen', async on(S) {
            suzu(S);
            await S.narr('你拉了拉铃绳。铃声在空荡荡的境内回荡，好一会儿才散。\n賽銭箱的格子缝里，黑漆漆的。');
          } },
          { id: 'haidoor', x: 16, y: 9, spr: 'sliding', async on(S) {
            if (S.f.phase !== 'prep') return S.narr('拝殿的格子门。里面的三方上，供着一对白瓷酒瓶。');
            if (S.has('sake') || S.f.rite >= 1) return S.narr('三方上空了。酒瓶在你包里。');
            S.give('sake');
            await S.narr('你拉开格子门，对着里面鞠了一躬，从三方上捧下那对白瓷酒瓶。\n「……打扰了。借用一下。」');
            stepGoal(S);
          } },
          { x: 11, y: 9, spr: 'sliding', on: S => S.narr('拝殿正面的格子门。门里挂着一面圆镜，映着你身后的夜色。') },
          { id: 'sign', x: 11, y: 11, spr: 'sign', async on(S) {
            S.f.readSign = true;
            await S.narr('拝殿前立着一块木牌：「参拜方法」\n一、在手水舍净手、漱口。\n二、摇铃，投香油钱。\n三、二拜、二拍手、一拜。\n（鞠躬两次，拍手两次，再鞠躬一次。）');
          } },
          { x: 11, y: 13, spr: 'komainu', on: S => S.narr('石头狛犬，张着嘴。「阿」。\n底座上刻着「明治二十一年　奉纳」。') },
          { x: 16, y: 13, spr: 'komainu', on: S => S.narr('另一只狛犬，闭着嘴。「吽」。\n它的头，朝着旧仓那边，微微偏了一点。') },
          { id: 'chozu', x: 9, y: 14, w: 2, spr: 'chozuya', async on(S) {
            S.tone('sine', 1500, 600, .12, .03); S.tone('sine', 1200, 500, .1, .025, .18);
            await S.narr('手水舍的石盆里，水是从山上引下来的，冰凉。\n你舀了一勺，洗了左手、右手，又漱了口。');
          } },
          ...[[12, 15], [15, 15], [12, 18], [15, 18]].map(([x, y]) => ({ x, y, spr: 'stonelantern', light: { r: 2.6, col: WARM, flick: true }, on: S => S.narr('石灯笼。火是澪傍晚点上的，玻璃罩上停着一只飞蛾。') })),
          { x: 13, y: 19, w: 2, spr: 'torii', solid: false, z: 1 },
          { x: 13, y: 21, w: 2, spr: 'invisible', async touch(S) { await S.narr('石阶一直往下，通到镇子里。\n……今晚，哪儿也不能去。'); S.pos(13, 20, 3); } },
          { id: 'kagura', x: 23, y: 12, spr: 'kagura', on: S => S.narr('神乐殿。夏祭那晚，澪要在这里跳巫女舞。\n舞台上已经铺好了新的白布。') },
          { x: 23, y: 6, spr: 'shimenawa', z: 1, solid: false, on: S => S.narr('御神木。树干上系着注连绳，白色的纸垂在黑暗里轻轻晃。\n树皮上有一道很旧的裂口，像被什么从里面撑开过。') },
          /* 主屋 */
          { id: 'housedoor', x: 4, y: 10, spr: 'door', col: '#5a4030', async on(S) {
            if (S.has('hako')) { S.sfx('locked'); return S.narr('不能把箱子带进屋！'); }
            S.sfx('open'); await S.go('house', 10, 10, 3);
          } },
          { id: 'hwin1', x: 2, y: 10, spr: 'window', lit: true, light: { r: 2, col: WARM, dy: 12 }, on: S => S.narr('主屋玄关边的窗户，亮着灯。\n隔着窗帘，能听见里面有人在走廊上走来走去——是奶奶。') },
          { id: 'hwin2', x: 6, y: 10, spr: 'window', lit: true, light: { r: 2, col: WARM, dy: 12 }, on: S => S.narr('主屋的窗户。屋里的灯光黄黄的，照着院子里的一小块地。\n澪和小翔，都在这扇窗后面。') },
          /* 旧仓 */
          { id: 'kuradoor', x: 3, y: 17, spr: 'door', col: '#4a3424', async on(S) {
            if (S.f.phase === 'night' && S.has('hako')) { S.sfx('locked'); await S.narr('不能回仓里——那里是条死路，小翔会跟进来。'); return; }
            S.sfx('open'); await S.go('kura', 6, 8, 3);
          } },
          { x: 1, y: 17, spr: 'ofuda', on: S => S.narr('仓门边也贴着一张神札。风吹日晒，字已经看不清了。') },
          /* 梦游的小翔 */
          { id: 'sho_y', x: 4, y: 11, spr: '@shop', hidden: true, solid: false, light: { r: 1.2, col: 'rgba(160,190,230,.12)', a: .6 } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'night' && S.has('hako')) return startNight(S);
          if (first) {
            S.focus(13, 8);
            await S.narr('御影神社的境内。拝殿后面，隔着一圈石头玉垣，是本殿。\n石灯笼一盏一盏地亮着。');
            S.focus(null);
          }
        },
        tick(S, dt) { nightTick(S, dt); }
      },
      /* ---------------- 神代家 · 主屋 ---------------- */
      house: {
        amb: 'room', dark: .62, plr: 3.2, wall: 'shoji', floor: 'wood', darkC: '#06050a',
        rows: [
          '######################',
          '######################',
          '#ttttt#tttttt#########',
          '#ttttt#tttttt#########',
          '#ttttt#tttttt#########',
          '###w######w###########',
          '#wwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwww#',
          '#########xx#####w#####',
          '#########xx####++++###',
          '#########xx####++++###',
          '#########xx###########'],
        ents: [
          /* 仏間 */
          { id: 'butsu', x: 3, y: 1, spr: 'butsudan', light: { r: 2, col: 'rgba(255,170,90,.14)', flick: true }, async on(S) {
            if (S.once('butsuFirst')) await S.narr('佛龛里供着几块牌位，线香还在烧。\n底下的小抽屉没有锁。里面是一本黑布面的小册子。');
            await S.note('memo'); S.f.readMemo = true;
          } },
          { x: 1, y: 1, spr: 'portrait', on: S => S.narr('一张黑白遗照。穿着狩衣的老人，嘴角绷得很紧。\n——澪的曾祖父。') },
          { x: 5, y: 1, spr: 'scroll', on: S => S.narr('挂轴上写着两个大字：「守护」。') },
          { x: 3, y: 3, spr: 'cushion', solid: false, on: S => S.narr('佛龛前的坐垫，中间压出了一个浅浅的坑。奶奶每天早上在这里坐很久。') },
          /* 茶之间 */
          { x: 8, y: 1, spr: 'poster', col: '#e8e0c8', on: S => S.narr('挂历。最上面印着「平成十七年（2005年）七月」。\n29 号画了一个红圈：「夏祭」。今天那一格写着：「旧仓扫除　澪」。') },
          { x: 10, y: 1, spr: 'window', light: { r: 2.4, col: MOON, dy: 10 }, on: S => S.narr('窗外是院子。从这里看得见旧仓黑乎乎的屋顶。') },
          { x: 12, y: 2, spr: 'tv', on: S => S.narr('电视关着。屏幕里映出茶之间，和你自己模模糊糊的影子。') },
          { x: 9, y: 3, w: 2, spr: 'lowtable', on: S => S.narr('矮桌上摆着没动过的晚饭，盖着纱罩。四副碗筷。') },
          { id: 'futon', x: 11, y: 3, h: 2, spr: 'sleeper', async on(S) {
            await S.narr('小翔睡着了，眉头皱得紧紧的。\n他在说梦话：「……箱子……给我看看嘛……」');
            if (S.f.shoTouched && S.once('shoCold')) await S.narr('他的手搭在肚子上。你碰了碰——指尖还是凉的。');
          } },
          { id: 'baba', x: 14, y: 6, spr: '@baba', dir: 1, on: S => talkBaba(S) },
          /* 走廊 */
          { id: 'keyhook', x: 6, y: 5, spr: 'keyhook', async on(S) {
            const k = S.ent('keyhook');
            if (k.s.taken) return S.narr('柱子上的钥匙钩空了。');
            if (S.f.phase !== 'prep') return S.narr('柱子上挂着一把铜钥匙，小木牌上写着「本殿」。');
            k.s.taken = true; S.give('key');
            await S.narr('你从柱子上取下铜钥匙。小木牌上写着「本殿」，被手摸得发亮。');
            stepGoal(S);
          } },
          { id: 'phone', x: 13, y: 5, spr: 'kurophone', on: S => S.narr(S.f.phase === 'prep' ? '黑色的转盘电话。听筒还是温的。' : '黑色的转盘电话，放在走廊的小架子上。') },
          { x: 15, y: 5, spr: 'wallclock', on: S => S.narr(S.f.phase === 'prep' ? '九点十分。叔叔说他坐头班车回来——头班车是早上五点零几分，从松江开过来要四十分钟。' : '挂钟滴答滴答地走。') },
          { id: 'miodoor', x: 17, y: 5, spr: 'sliding', on: S => talkMio(S) },
          { x: 19, y: 5, spr: 'window', light: { r: 2, col: MOON, dy: 10 }, on: S => S.narr('走廊尽头的窗户。外面黑沉沉的，只有石灯笼一点一点地亮着。') },
          { x: 20, y: 7, spr: 'plant', on: S => S.narr('一盆万年青。叶子上落着一层薄灰。') },
          /* 玄关 */
          { x: 9, y: 9, spr: 'getabako', on: S => S.narr('鞋柜上摆着四双鞋。小翔的运动鞋，鞋带还系着。') },
          ...[[9, 11], [10, 11]].map(([x, y]) => ({ x, y, spr: 'invisible', async touch(S) { await S.go('yard', 4, 11, 0); } })),
          /* 厨房 */
          { id: 'saltshelf', x: 15, y: 8, spr: 'saltshelf', async on(S) {
            const s = S.ent('saltshelf');
            if (s.s.taken) return S.narr('调料架。盐罐空了一大半。');
            if (S.f.phase !== 'prep') return S.narr('调料架上摆着酱油、味醂，还有一大罐粗盐。');
            s.s.taken = true; S.give('salt');
            await S.narr('你把罐子里的粗盐倒出一大包，用和纸包好。\n盐粒沙沙地响。');
            stepGoal(S);
          } },
          { x: 17, y: 8, spr: 'cabinet', col: '#6a5038', on: S => S.narr('碗柜。最上层收着过年才用的漆器。') },
          { x: 18, y: 9, spr: 'fridge', on: S => S.narr('冰箱上贴着小翔画的画：一座神社，四个小人手拉着手。') },
          { x: 15, y: 10, spr: 'sink', on: S => S.narr('水槽里泡着一只锅。水面上漂着一层凉掉的油花。') },
          { x: 18, y: 10, spr: 'stove', on: S => S.narr('灶上的味噌汤早凉了。') }
        ],
        async enter(S, first) {
          if (!first || S.f.phase !== 'call') return;
          await phoneCall(S);
        }
      },
      /* ---------------- 本殿 ---------------- */
      honden: {
        amb: 'none', dark: .82, plr: 2.6, wall: 'wood', floor: 'lightwood', darkC: '#050304',
        tileOpts: { woodC: '#8a6a44' },
        rows: [
          '############',
          '############',
          '#llllllllll#',
          '#llllllllll#',
          '#llllllllll#',
          '#llllllllll#',
          '#llllllllll#',
          '#llllllllll#',
          '#####ll#####'],
        ents: [
          { x: 5, y: 1, w: 2, spr: 'misu' },
          { x: 2, y: 1, spr: 'scroll', on: S => S.narr('墙上贴着一张祝词，开头是「挂けまくも畏き……」。\n后面的字太古旧，你只认得「祓」「清」两个字。') },
          { x: 9, y: 1, spr: 'scroll', on: S => S.narr('另一张纸上写着历代宫司的名字。最后一个是「神代修一」——澪的父亲。') },
          { id: 'altar', x: 5, y: 2, w: 2, spr: 'altar', on: S => altarOn(S) },
          { id: 'cdl1', x: 3, y: 2, spr: 'candle', light: { r: 3, col: WARM, flick: true }, on: S => S.narr('蜡烛。火苗一跳一跳的。') },
          { id: 'cdl2', x: 8, y: 2, spr: 'candle', light: { r: 3, col: WARM, flick: true }, on: S => S.narr('蜡烛。烛泪顺着烛台淌下来，积了厚厚一层。') },
          { x: 4, y: 2, spr: 'gohei', on: S => S.narr('御币。白纸剪成的锯齿，一层一层垂下来。') },
          { x: 7, y: 2, spr: 'gohei', on: S => S.narr('御币。你一走近，纸垂就轻轻地动了一下。') },
          { id: 'kara', x: 5, y: 5, w: 2, spr: 'karabitsu', on: S => karaOn(S) },
          { id: 'sanbo', x: 7, y: 5, spr: 'sanbo', on: S => sanboOn(S) },
          { x: 1, y: 7, spr: 'box', on: S => S.narr('一只装祭具的木箱，盖子上写着「大祓」。') },
          { id: 'chichi', x: 5, y: 7, spr: '@chichi', dir: 3, hidden: true, on: S => S.say('神代叔叔', '……辛苦了。') },
          ...[[5, 8], [6, 8]].map(([x, y]) => ({ x, y, spr: 'invisible', async touch(S) {
            const r = S.f.rite || 0;
            if (r < 2) { await S.narr('箱子还在怀里——先把它安放好。'); return S.pos(x, 7, 3); }
            if (r >= 4) { await S.narr('天亮之前，不能出去。'); return S.pos(x, 7, 3); }
            await S.go('yard', 13, 4, 0);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          S.hide('sho_y');
          await S.narr('门在身后合上。\n外面，小翔光脚的声音停在了台阶下面。');
          await S.wait(500);
          await S.narr('过了一会儿，传来奶奶压得极低的声音，和一串慢慢走远的脚步。\n……她把他抱回去了。');
          S.goal('安放箱子：照便笺上的顺序，用唐柜');
        }
      }
    }
  });

  /* ================= 第一幕：旧仓里的箱子 ================= */
  async function boxScene(S) {
    S.f.phase = 'scene';
    await S.walk('pl', [5, 6], 4.2); S.face('pl', 2); S.face('mio', 1);
    await S.say('澪', ['寄木细工的机关箱，箱根那边做的那种。你看这花纹，一小块一小块拼出来的。', '要按顺序推这些木板才打得开。我已经解开三步了——', '……奇怪，从刚才起，肚子里就一直凉凉的。']);
    hum(S);
    await S.narr('她把箱子往你面前推了推，搓了搓手。\n七月的傍晚，她的指尖是青白的。');
    await S.narr('你低头看那只箱子。木纹一圈一圈的，像一只半睁的眼睛。');
    S.sfx('step'); S.place('sho_k', 6, 8, 3); S.bubble('sho_k', '!', 900);
    await S.say('小翔', '姐姐！奶奶喊你们吃饭——哇！那是什么？宝箱吗？！');
    await S.walk('sho_k', [6, 7], 3.6);
    const r = await S.ask('小翔朝作业台跑过来了。', ['「站住！别过来。」把箱子挡在身后', '「是个机关箱，来看吧。」'], '');
    if (r === 1) {
      S.f.shoTouched = true;
      await S.walk('sho_k', [6, 6], 3.6); S.face('sho_k', 3);
      await S.narr('小翔扑到台边，伸手在箱盖上摸了一下。\n「好凉！」');
      await S.narr('他缩回手，揉了揉肚子，忽然不说话了。');
    } else {
      await S.say('小翔', '……小气鬼。');
      await S.narr('他在原地站住了，鼓着腮帮子，眼睛还盯着那只箱子。');
    }
    S.place('baba_k', 5, 8, 3); S.bubble('baba_k', '!', 1200); S.sfx('sting');
    await S.narr('门口站着奶奶。她手里的饭勺「当」地掉在地上。');
    S.shake(300, 1);
    await S.narr('她的脸一下子没了血色。她扶住门框，弯下腰，捂着嘴干呕了两声。');
    await S.say('澄江奶奶', ['……那个箱子。', '那个箱子，是从哪儿拿出来的？！']);
    await S.say('澪', '最、最里面的桐木箱子里……奶奶？');
    await S.say('澄江奶奶', ['子取箱……是子取箱。', '澪，小翔——出去。马上出去！离它远远的！']);
    await S.walk('sho_k', [6, 9], 4); S.hide('sho_k');
    await S.walk('mio', [6, 9], 3.6); S.hide('mio');
    await S.say('澄江奶奶', ['我也不能进去。……我是女人。', '彻，你是男孩子，它不找你。你就站在那儿，别再推那些木板了。', '我去给澪她爸打电话。他今晚在松江开会。']);
    S.hide('baba_k');
    S.f.phase = 'call';
    S.goal('在旧仓里等着（别碰箱子）');
    await S.wait(900);
    await S.say('院子里，奶奶的声音', '彻——！电话！澪她爸要跟你说！\n箱子别拿出来，就放在仓里！');
    S.goal('去主屋接电话（箱子留在仓里）');
    S.cp('kura');
  }

  /* ================= 第二幕：电话、准备 ================= */
  async function phoneCall(S) {
    S.ent('phone').s.lift = true;
    await S.say('澄江奶奶', '……你来听。我手抖得拿不住。');
    await S.walk('pl', [13, 6], 4.2); S.face('pl', 3);
    await S.say('电话里·神代叔叔', ['彻君？我是澪她爸。奶奶都跟我说了。别慌，听我说。', '那只箱子，是我们神社替人守着的东西。仓里的封条，是我上个月查看时没贴牢——是我的错。', '澪推开了几块？……三块。底下的木栓也拔了？……好。还没开，还来得及。']);
    await S.say('电话里·神代叔叔', ['第一，把它封回去：开的时候最后动的那块，封的时候最先推回去，往它错开的反方向推。全推回去了，再把木栓插上。', '开的顺序，记在仓里《箱守帐》的最后一页。', '第二，封好了送进本殿：唐柜里先铺一层盐，再放箱子，盖上，供神酒，行礼。钥匙挂在走廊柱子上，盐在厨房，神酒在拝殿的三方上。']);
    await S.say('电话里·神代叔叔', ['第三，拿着它的时候离主屋远一点。家里的女人和孩子，谁都不能靠近它——一步都不行。', '放好以后关上本殿的门，守到天亮。外面不管谁叫你，都别开门。箱子不管怎么响，都别打开。', '我坐头班车回去。……彻君，拜托了。']);
    S.ent('phone').s.lift = false; S.sfx('close');
    await S.narr('你在电话旁的便笺上，把他说的话一条一条记了下来。');
    await S.note('rules'); S.f.readRules = true;
    S.face('baba', 1);
    await S.say('澄江奶奶', ['……小翔吓着了，有点发烧，我让他先睡下了。澪在她屋里躺着。', '我嫁过来那年，澪的曾祖父带我进过一次旧仓。他指着那只桐木箱子说：女人这辈子都别碰它。', '他的手记还在佛龛的抽屉里。你要是想知道，就去看吧。']);
    await S.card('夜　九点', '御影神社', '暮蝉早就不叫了。\n林子里，换成了一片细细的虫声。');
    S.dark(.86, 'yard');
    S.place('baba', 8, 3, 2);
    S.f.phase = 'prep';
    stepGoal(S);
    S.cp('prep');
  }
  async function talkBaba(S) {
    const f = S.f;
    if (f.phase === 'call') return S.say('澄江奶奶', '电话……电话在这儿。');
    if (S.once('babaLore')) {
      await S.say('澄江奶奶', ['……公公说，这种箱子分等级。一子、二子……数字越大越凶，最凶的叫「八开」。', '为什么叫这些名字，他不肯说。他只说：别问。', '我守着小翔。你去吧。……要是有不明白的，再来问我。']);
      return;
    }
    const h = S.ent('hako');
    if (!f.readLedger) return S.say('澄江奶奶', '开的顺序……他爸说记在《箱守帐》上。帐本在旧仓那口旧柜子的抽屉里。');
    if (!f.askedMio) return S.say('澄江奶奶', '去问问澪吧。她自己推的，她总记得几步。……隔着门说话，别进去。');
    if (!(h.s.st === 0 && h.s.peg)) return S.say('澄江奶奶', ['封的时候，先动最后动过的那一块。', '看看现在哪几块是错开的、往哪边错开的——往反方向推回去。']);
    if (!(S.has('key') && S.has('salt') && S.has('sake'))) return S.say('澄江奶奶', '钥匙在走廊柱子上，盐在厨房调料架，神酒在拝殿里头。拝殿门口的木牌，你也看一眼——参拜的规矩写在上面。');
    await S.say('澄江奶奶', ['……都备齐了？', '抱着它走的时候，离这屋子远一点。我和澪，都在这儿。']);
  }
  async function talkMio(S) {
    const f = S.f;
    if (f.phase === 'call') return S.narr('澪的房间。纸门关着。');
    if (!f.askedMio) {
      f.askedMio = true; f.knowPeg = true;
      await S.say('澪（隔着纸门）', ['……彻？对不起。都怪我。', '肚子里一直凉凉的，像吞了一块冰。奶奶不让我出去。']);
      await S.say('澪（隔着纸门）', ['你问我怎么推的？……最开始，我从箱子底下拔出来一根小木栓。后来不知道滚哪儿去了，好像是稻草堆那边。', '然后第一下，右边那块往下。第二下，顶盖往右滑。', '第三下……记不清了。手冻得发麻，随便推了推，有一块动了。']);
      await S.say('澪（隔着纸门）', '……要是有人跟你一起，一个人念帐本，一个人推，会稳一点吧。');
      return stepGoal(S);
    }
    const h = S.ent('hako');
    if (h.s.st === 0 && h.s.peg) return S.say('澪（隔着纸门）', ['……肚子里那块冰，好像化了一点。是你把它封上的吗？', '谢谢。……送过去的时候，别从我窗户底下走。']);
    await S.say('澪（隔着纸门）', ['第一下右边往下，第二下顶盖往右……第三下我真的不记得了。', '彻……小心点。']);
  }

  /* ================= 机关 ================= */
  async function hakoOn(S) {
    const f = S.f, h = S.ent('hako');
    if (f.phase === 'dusk') return boxScene(S);
    if (f.phase === 'call') return S.narr('奶奶说过，别再碰它。\n……先去主屋接电话。');
    if (f.phase !== 'prep') return;
    if (h.s.st === 0 && h.s.peg) {
      const miss = ['key', 'salt', 'sake'].filter(k => !S.has(k));
      if (miss.length) { await S.narr('箱子封好了，安安静静地待在作业台上。\n——先把送进本殿要用的东西备齐。'); return stepGoal(S); }
      const r = await S.ask('钥匙、盐、神酒都齐了。', ['用白布包好，抱起箱子', '再等等'], '');
      if (r) return;
      return pickUp(S);
    }
    const r = await S.ask('作业台上的子取箱。三块木板错开着。', ['动手封箱', '仔细看看它', '先放着'], '');
    if (r === 2) return;
    if (r === 1) {
      await S.narr('巴掌大的寄木箱，掂在手里比看上去沉。\n' + boxText(h.s));
      await S.narr('错开的地方，露出一线没晒过太阳的浅色木头。\n箱子里面，好像有一种很低很低的嗡嗡声。');
      return;
    }
    if (!f.readLedger) { await S.think('叔叔说，开的顺序记在《箱守帐》的最后一页。\n……先把帐本找出来。'); return stepGoal(S); }
    return puzzle(S);
  }
  async function hint(S) {
    const w = S.f.wrong || 0, h = S.ent('hako');
    if (w === 2) await S.think('封的顺序和开的反过来：最后动的那块最先推回去，往它错开的反方向推。\n先弄清楚，哪一块是最后动的。');
    else if (w === 3) await S.think('澪说第一下是右板、第二下是顶盖。帐本上第三步被水渍晕开了——\n可现在错开着的，除了这两块，就只剩左板。最后动的，是左板。');
    else if (w >= 4) await S.think('照这个来：' + answerFrom(h.s.st).map(k => KNAME[k]).join(' → ') + '。');
  }
  async function puzzle(S) {
    const f = S.f, h = S.ent('hako');
    S.focus(6, 5);
    S.cp('prep');
    if (S.once('puzzleTip')) await S.narr('（叔叔的话、澪的话、《箱守帐》都在「笺」里。要是有人在旁边，让他翻着念，你来推。）');
    for (; ;) {
      if (h.s.st === 0 && h.s.peg) break;
      const k = await S.keypad('【子取箱】推哪一块、往哪边推？（栓＝插木栓）\n' + boxText(h.s), KEYS, 1);
      if (k == null) { S.focus(null); return; }
      const st = h.s.st;
      if (k === '栓') {
        if (!S.has('peg')) { await S.narr('木栓不在手上。\n——澪说它滚到了稻草堆那边。'); continue; }
        if (st > 0) { stuck(S); await S.narr('木栓插不进去。孔里面被错开的机关挡住了。\n得先把木板全推回去。'); continue; }
        S.take('peg'); h.s.peg = true; click(S); continue;
      }
      if (st > 0 && k === MOVES[st - 1].u) {
        h.s.st--; click(S);
        S.toast('咔哒。' + MOVES[st - 1].t.slice(0, 2) + '滑回去了');
        continue;
      }
      if (st < 7 && k === MOVES[st].k) {
        if (st === 6) {
          hum(S, .08); S.sfx('whisper');
          await S.narr('顶盖只差最后一点，就能整个滑开了。\n黑缝里，有什么东西在等。');
          const c = await S.ask('', ['推开它', '住手！把手拿开'], '');
          if (c === 0) { S.focus(null); return openedEnd(S, '你的手指一用力。顶盖顺着木纹，滑开了。', '封箱的顺序与开箱相反：最后动的那块先推回去。顶盖只差最后一步时，住手。'); }
          continue;
        }
        h.s.st++; click(S); hum(S); S.shake(250, 1);
        f.wrong = (f.wrong || 0) + 1;
        await S.narr('木板顺着你的手滑开了——\n……反了！箱子比刚才开得更大了。');
        await hint(S); continue;
      }
      stuck(S); knock(S, 1, .09);
      f.wrong = (f.wrong || 0) + 1; f.dread = (f.dread || 0) + 1;
      await S.narr('推不动。\n……箱子里面，「咚」地响了一声。');
      if (f.dread >= 3 && h.s.st < 6) {
        f.dread = 0; h.s.st++; click(S);
        if (S.once('dreadFace')) await S.scare('face', { face: 'hako', sfx: 'sting' }); else S.shake(400, 2);
        await S.narr('你的手还没碰到，' + MOVES[st].t.slice(0, 2) + '自己「咔」地滑开了一格。\n它不想被封回去。');
      }
      await hint(S);
    }
    S.focus(null);
    S.sfx('good'); S.tone('sine', 660, 660, .6, .04, .3);
    await S.narr('木栓整根没了进去，和底板严丝合缝。\n箱子里那种若有若无的嗡嗡声，停了。');
    await S.narr('隔着院子，主屋那边一直断断续续的咳嗽声，也轻了下去。');
    stepGoal(S);
    S.cp('prep');
  }
  async function pickUp(S) {
    const h = S.ent('hako');
    await S.card('夜　十二点', '旧仓', '你用作业台上那块白布把箱子包好，抱在怀里。\n箱子很轻。\n可是每走一步，它就沉一分。');
    S.hide('hako'); S.give('hako'); h.s.cloth = true;
    S.f.phase = 'night';
    S.norun(true); S.speed(.85);
    await S.think('跑不起来。箱子在怀里一晃，里面就「咯噔」响一下。\n……慢慢走。');
    S.goal('抱着箱子出仓库，绕开主屋，送进本殿');
    S.cp('night');
  }

  /* ================= 第三幕：本殿 ================= */
  async function honDoor(S) {
    const f = S.f;
    if (f.phase === 'night' && S.has('hako')) {
      S.stop('sho_y');
      S.sfx('open');
      await S.narr('你腾出一只手摸出钥匙，捅了两下才捅进锁孔。\n锁「咔」地开了。');
      return S.go('honden', 5, 7, 3);
    }
    if ((f.rite || 0) >= 2) { S.sfx('open'); return S.go('honden', 5, 7, 3); }
    if (S.has('key')) return S.narr('本殿的门。钥匙在你手里。\n……等箱子封好、抱过来，再开它。');
    S.sfx('locked');
    await S.narr('本殿的门锁着。黄铜的锁头上，刻着神社的纹。');
  }
  async function karaOn(S) {
    const f = S.f, k = S.ent('kara'), r = f.rite || 0;
    if (r >= 2) return S.narr('唐柜的盖子盖得严严实实，红白绳绕了一圈。\n里面一点声音都没有。……暂时。');
    if (r === 0) {
      const c = await S.ask('唐柜。盖子打开着，里面黑洞洞的。先做什么？', ['铺一层盐', '把箱子放进去', '先供神酒'], '');
      if (c !== 0) {
        knock(S, 1, .08); f.kwrong = (f.kwrong || 0) + 1;
        return S.narr(f.kwrong >= 2 ? '便笺上写得清清楚楚：唐柜里「先铺盐」，再放箱子，然后才是神酒。' : '你的手一伸过去，怀里的箱子就「咚」地响了一下。\n……不对。便笺上叔叔说的顺序是什么来着？');
      }
      S.take('salt'); k.s.salt = true; f.rite = 1;
      S.sfx('water');
      await S.narr('你把粗盐沙沙地倒进唐柜，用手抹平。白白的一层。');
      S.goal('把箱子放进唐柜，盖上');
      return;
    }
    const c = await S.ask('盐铺好了。', ['把箱子放进去，盖上盖子', '再等等'], '');
    if (c) return;
    S.take('hako'); k.s.box = true;
    await S.narr('你解开白布，把箱子放在盐上。\n手松开的那一刻，你才发现自己的胳膊一直在抖。');
    k.s.closed = true; f.rite = 2; S.sfx('close');
    S.norun(false); S.speed(1);
    await S.narr('盖上盖子，系好红白绳。');
    S.goal('在唐柜旁的三方上供神酒');
  }
  async function sanboOn(S) {
    const f = S.f, r = f.rite || 0, sb = S.ent('sanbo');
    if (sb.s.sake) return S.narr('三方上供着神酒。白瓷瓶口的纸，叠得整整齐齐。');
    if (r < 2) return S.narr('唐柜旁的三方，空着。……先把箱子安放好。');
    S.take('sake'); sb.s.sake = true; f.rite = 3;
    await S.narr('你把那对白瓷酒瓶，端端正正地摆在三方上。');
    S.goal('向祭坛行礼（参拜的规矩写在拝殿前的木牌上）');
  }
  async function altarOn(S) {
    const f = S.f, r = f.rite || 0;
    if (r < 3) return S.narr('祭坛上摆着供品：米、盐、水。\n祭坛后面垂着御帘，帘子后头隐约是一面圆镜，映着烛火。你不敢掀开看。');
    if (r >= 4) return S.narr('祭坛。烛火已经矮下去一截。');
    const v = await S.keypad('向祭坛行礼。\n（礼＝鞠躬，拍＝拍手。一共五下）', ['礼', '拍'], 5);
    if (v == null) return;
    [...v].forEach((c, i) => c === '拍' ? clap(S, i * .45) : bow(S, i * .45));
    await S.wait(2400);
    if (v !== '礼礼拍拍礼') {
      f.bwrong = (f.bwrong || 0) + 1; knock(S, 2, .08);
      if (f.bwrong <= 2) { S.ent(f.bwrong === 1 ? 'cdl1' : 'cdl2').off = true; S.sfx('match'); S.dark(f.bwrong === 1 ? .88 : .93); }
      if (f.bwrong === 1) return S.narr('一支蜡烛「噗」地灭了。唐柜里，「咚咚」响了两声。\n……不对。拝殿前那块木牌上，写着参拜的规矩。');
      if (f.bwrong === 2) return S.narr('另一支蜡烛也灭了。黑暗里，只剩祭坛上一点反光。\n木牌上写的是：二拜、二拍手、一拜——鞠躬两次，拍手两次，再鞠躬一次。');
      return S.narr('礼、礼、拍、拍、礼。');
    }
    f.rite = 4;
    if (S.ent('cdl1').off || S.ent('cdl2').off) { S.ent('cdl1').off = false; S.ent('cdl2').off = false; S.sfx('match'); S.dark(null); await S.narr('你用火柴把灭掉的蜡烛重新点上。'); }
    await S.narr('最后一次鞠躬，你的额头几乎碰到了地板。\n烛火静静地立着。');
    return vigil(S);
  }

  /* ================= 守夜 ================= */
  async function vigil(S) {
    S.f.phase = 'vigil';
    S.goal('守到天亮。谁叫都别开门；箱子怎么响都别打开');
    S.cp('vigil');
    S.amb('none'); S.dark(.88);
    const again = VTRIES++ > 0;
    if (!again) await S.card('丑时', '本殿', '蜡烛烧下去一截。\n外面的虫声，不知道什么时候停了。');
    else await S.think('……再来一次。\n叔叔说过：谁叫都别开门，箱子怎么响都别打开。');
    knock(S, 3, .09); S.shake(300, 1);
    await S.wait(again ? 800 : 1600);
    if (!again) await S.narr('咚。……咚。……咚。\n声音是从唐柜里传出来的。很轻，很耐心，像有人在用指节敲门。');
    S.sfx('whisper');
    await S.say('唐柜里', ['……彻。', '你不想知道吗？里面是什么。', '澪推了三步，你推回去了。……再推七步，就能看见了。'], { style: 'whisper' });
    await S.think('……那是我自己的声音。');
    const a = await S.ask('唐柜的盖子，好像自己松开了一条缝。', ['掀开盖子，看一眼', '不看。背对着它坐下'], '');
    if (a === 0) {
      await S.narr('你解开红白绳，掀开了盖子。\n箱子躺在盐里。木纹一圈一圈的，像一只闭着的眼睛。');
      await S.narr('你的手指，已经摸到了底下那根木栓。');
      const b = await S.ask('', ['把木栓拔出来', '把盖子盖回去'], '');
      if (b === 0) return openedEnd(S, '木栓「啵」地一声被拔了出来。\n接下来的七步，你的手比你记得还清楚。', '叔叔说过：箱子不管怎么响，都别打开。那个声音，是你自己的。');
      await S.narr('你把盖子按了回去，两只手死死压住。\n过了很久，敲击声停了。');
    } else {
      await S.narr('你背对着唐柜坐下，闭上眼睛，把墙上那张祝词里认得的几个字，念了一遍又一遍。\n过了很久，敲击声停了。');
    }
    await S.wait(700);
    await S.card('寅时', '本殿', '烛火矮得只剩一指高。\n你的眼皮越来越沉。');
    S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.say('门外', ['彻？……是我，澪。', '我好多了，一点都不难受了。爸爸打电话来，让我来替你守。', '外面好黑……开开门嘛。']);
    await S.narr('她的声音很清楚，一点都不咳嗽了。\n……门缝底下，看不见一点提灯的光。');
    await S.think('叔叔说：外面不管谁叫你，都别开门。');
    const d = await S.ask('「彻？开门呀。」', ['开门', '不开。一声也不出'], '');
    if (d === 0) return doorEnd(S);
    await S.narr('你咬着牙，一声也没出。');
    barefoot(S, 7);
    await S.narr('过了很久，门外响起光脚踩在石板上的声音。\n啪嗒，啪嗒……往主屋那边去了。');
    return dawn(S);
  }
  async function dawn(S) {
    const f = S.f;
    await S.card('清晨　五点四十分', '本殿', '林子里，暮蝉开始叫了。\n「卡那卡那卡那……」\n本殿的门缝里，透进来一线白亮的光。');
    S.amb('night'); higurashi(S, .018); S.dark(.55);
    S.sfx('knock');
    await S.say('门外', ['彻君。是我。……天亮了。', '头班车一到站，我就跑上来了。']);
    await S.narr('是神代叔叔。门缝里透进来的，是真的天光。');
    S.sfx('open');
    S.place('chichi', 5, 7, 3); S.pos(4, 4, 0);
    await S.walk('chichi', [5, 6], 2.4); S.face('chichi', 3);
    await S.narr('他连开会的西装都没换，领带歪在一边，只在肩上搭了一条白布。\n他跪在唐柜前，解开绳子，掀开盖子，看了很久。');
    await S.narr('然后他把箱子捧了出来。\n明明是个男人，他的额头上还是一颗一颗地往下掉汗。');
    await S.say('神代叔叔', ['没事。……没事的。', '没事……'], { style: 'whisper' });
    await S.narr('你不知道，他是在说给箱子听，还是在说给自己听。');
    S.face('chichi', 1);
    const lines = ['……封得很好。辛苦你了。', '澪和小翔的烧都退了。奶奶守了他们一整夜。', '后半夜，澪光着脚跑到了本殿的台阶底下，眼睛闭着，叫都叫不醒。……是奶奶把她背回去的。'];
    if (f.shoTouched) lines.push('小翔碰过它？……就那么一下。还好，还好。');
    await S.say('神代叔叔', lines);
    if (f.readLedger && f.readMemo && f.readFuda) {
      const q = await S.ask('', ['（什么也不说）', '「叔叔……帐本上写着，这一只『平成十七年　当返』。」'], '');
      if (q === 1) return retEnd(S);
    }
    if (!f.readMemo) await S.say('神代叔叔', ['这种箱子，过了百来年，力气会慢慢尽了。到那时候，拆开、烧掉——我们叫「返」。', '在那之前，就只能守着。']);
    await S.say('神代叔叔', ['它会回到新的桐木箱子里，贴上新的封条。', '……守箱的人，还得接着守下去。']);
    return S.end({ id: 'dawn', title: '天亮了', text: '神代叔叔在《箱守帐》上添了一行：\n「平成十七年七月　澪误开三步　封箱如初」\n\n那年的夏祭照常办了。澪在神乐殿上跳了巫女舞，小翔在台下举着苹果糖。\n只是，从那以后，澪再也没碰过机关箱。\n\n每年夏天你回镇上，都会绕到旧仓门口站一会儿。\n门上的封条，是新的。' });
  }
  async function retEnd(S) {
    await S.narr('叔叔愣了一下，看着你，很久很久。');
    await S.say('神代叔叔', ['……你看到帐本了。还有曾祖父的手记。', '上个月我把它请出来，就是为这个。一百三十多年了……它的力气，差不多尽了。', '今天，该送它「返」了。']);
    await S.card('那天上午', '本殿后面', '叔叔在本殿后面生了一堆火，念着长长的祝词，\n把箱子一块一块地拆开。\n你站在很远的地方，没有去看拆出来的是什么。');
    higurashi(S, .02);
    return S.end({ id: 'ret', title: '送还', text: '火灭的时候，林子里的暮蝉，忽然一齐叫了起来。\n\n叔叔在《箱守帐》那一行的「当返」底下，用朱笔补了两个字：\n「已返」。\n\n下山的时候，澪跟在你后面，隔着两步远。\n走到鸟居底下，她小声说：「……我们回家吧。」\n\n（隐藏结局：读过《箱守帐》、桐木外箱上的字和曾祖父的手记，并在天亮时问起「当返」。）' });
  }
  async function openedEnd(S, lead, tip) {
    await S.narr(lead);
    await S.scare('face', { face: 'hako', sfx: 'scare', dur: 1.2 });
    S.dark(.97); S.amb('otherworld');
    await S.narr('箱子里很黑。你没有看清里面是什么。\n你也不想看清。');
    return S.end({ bad: true, id: 'opened', title: '箱开了', text: '那年的夏祭没有办。\n\n后来，镇上的人说起神代家，总要压低声音。\n他们说，那家的女人和孩子，一个接一个，搬去了很远的医院。\n说那座旧仓的门，再也没人敢开。\n\n你是男人。它不找你。\n……它只是让你，一直记得。\n\n（' + tip + '）' });
  }
  async function doorEnd(S) {
    S.sfx('open');
    await S.narr('你拉开了门。\n冷风灌进来，蜡烛一下子灭了一根。');
    await S.narr('门外站着的，是澪。\n光着脚，穿着睡衣。眼睛闭着——和小翔一样。');
    await S.scare('face', { face: 'mio', sfx: 'scare' });
    await S.narr('她从你身边走了过去，一步，一步，朝唐柜走过去。\n你伸手去拉她。她的手，冰得像井水。');
    return S.end({ bad: true, id: 'door', title: '门外的人', text: '天亮的时候，神代叔叔在本殿里找到了你们。\n澪蜷在唐柜旁边，怎么叫都叫不醒。\n\n她后来醒了。只是从那以后，一到夏天，她就会光着脚走到旧仓门口，站很久很久。\n像在等谁给她开门。\n\n（叔叔说过：外面不管谁叫你，都别开门。那个时候走过来的，不管是谁，都是被箱子叫来的。）' });
  }
})();
