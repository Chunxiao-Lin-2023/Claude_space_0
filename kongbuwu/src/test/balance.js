// node test/balance.js — 每一场剧情战用自动对峙打 N 次：胜率、平均回合、赢的时候剩多少体力。目标：标准难度 70–95%
const { chromium } = require('playwright');
const FIGHTS = [ // [章, 等级, 名字, opts]
  [1, 2, '高汝雪+鹤山(吓)', { scare: 1, scene: 'mh', mobs: [['gaoru', 1], ['heshan', 0]] }], [2, 4, '纹身男', { mobs: [['tattoo', -1]] }], [2, 5, '王琦', { mobs: [['wangqi', 1]], story: 1 }],
  [2, 6, '寝室团(吓)', { scare: 1, scene: 'ws', mobs: [['med', 0], ['med', 0], ['heshan', 0]] }], [3, 6, '张鹏', { mobs: [['zhangpeng', 1]], story: 1 }, 1], [3, 7, '椅子×3', { mobs: [['chairgirl', 0], ['chairgirl', 0], ['chairgirl', -1]], story: 1 }],
  [3, 8, '镜鬼+张鹏(张雅)', { mobs: [['mirror', 2], ['zhangpeng', 0]], ally: 'zhangya', story: 1 }], [4, 9, '红影', { mobs: [['redshadow', 0]], story: 1 }], [4, 10, '姑姑', { mobs: [['aunt', 1]], story: 1 }],
  [4, 10, '费友亮+朱佳宁(吓)', { scare: 1, scene: 'ws', mobs: [['feiyl', 1], ['zhujn', 0]] }], [4, 11, '两张脸', { mobs: [['twoface', 1]], story: 1 }], [5, 12, '王海龙兄弟(吓)', { scare: 1, scene: 'my', mobs: [['wanghl', 1], ['wangwl', 0]] }],
  [5, 12, '熊青+独臂', { mobs: [['xiong', 1], ['onearm', 0]], story: 1 }], [5, 13, '女护士', { mobs: [['nurse', 1]], story: 1 }], [5, 13, '瘦长×3(糖)', { mobs: [['tallone', 1], ['tallone', 1], ['tallone', 0]], candy: 1, story: 1 }], [5, 14, '老院长(张雅)', { mobs: [['dean', 2]], ally: 'zhangya', story: 1 }],
  [5, 14, '普通游客×3(吓)', { scare: 1, scene: 'my', mobs: [['tough', 1], ['vlog', 1], ['med', 1]] }], [5, 14, '夜探残念×2', { mobs: [['remnant', 0], ['remnant', 1]] }] ];
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const N = +(process.argv[2] || 60), diff = +(process.argv[3] || 1);
  const rows = await pg.evaluate(([FIGHTS, N, diff]) => { const D = __dbg; D.instant = true; D.nosave = true; D.auto = true; D.SET.diff = diff; D.SET.snd = 0; D.SET.mus = 0; const out = [];
    for (const [ch, lv, name, o, early] of FIGHTS) { let win = 0, turns = 0, hp = 0;
      for (let i = 0; i < N; i++) { D.slotNew(1); D.STATE.run++; D.STATE.scene = false; D.jumpToQuiet(ch); const C = D.C; C.lv = lv; for (const k in C.pets) C.pets[k].lv = lv - 1; if (early) { C.sk = C.sk.filter(k => !['jiayi'].includes(k)); } if (ch === 1) { D.learnSkill('friday', 1); D.gainPet('wan', 1); C.pets.wan.lv = lv; } D.fullHeal(); C.bag.candy = o.candy ? 1 : 0;
        const oo = Object.assign({}, o, { mobs: o.mobs.map(m => [m[0], Math.max(1, lv + m[1])]) }); const B = D.battleCreate(oo); D.STATE.battle = B; let n = 0;
        while (!B.result && n++ < 80) { B.phase = 'hero'; let a = D.botAct(B); if (a.t === 'candy') { B.candyUsed = true; C.bag.candy = 0; B.pet = D.petUnit('zhangya'); B.pet.hp = B.pet.mhp; a = D.botAct(B); } B.pick.hero = a; if (B.pet && B.pet.hp > 0) B.pick.pet = D.petPick(B); D.battleResolve(B); }
        D.STATE.battle = null; if (B.result === 'win') { win++; hp += B.hero.hp / B.hero.mhp; } turns += B.turn; }
      out.push([name, 'Lv' + lv, Math.round(win / N * 100) + '%', (turns / N).toFixed(1) + '回合', win ? Math.round(hp / win * 100) + '%体力' : '-']); } return out; }, [FIGHTS, N, diff]);
  for (const r of rows) console.log(r.join('\t')); console.log('errors', errs); await b.close(); })();
