// node test/balance.js [label] — auto-battle win rate / rounds / hp left vs the main story bosses at their suggested level, no items
const { chromium } = require('playwright');
const SC = [
  ['风狈', 7, [['fengbei', 7]], ['qly', 'sn'], null, 0, []],
  ['祭灵', 11, [['jiling', 11]], ['qly', 'sn'], 'maoqiu', 40, []],
  ['虎穴', 12, [['tiger', 12], ['tiger', 11]], ['qly', 'sn'], 'maoqiu', 50, []],
  ['九头狮', 14, [['lion', 14]], ['qly', 'sn', 'lei', 'gw'], 'maoqiu', 60, ['a_huo']],
  ['雨族截杀', 15, [['yuzu', 14], ['bigwolf', 14], ['bigwolf', 14]], ['qly', 'sn', 'lei', 'gw'], 'maoqiu', 65, []],
  ['雨族高手', 15, [['yuchief', 15]], ['qly', 'sn', 'lei', 'gw'], 'dahong', 30, []],
  ['白虎', 16, [['whitetiger', 16]], ['qly', 'sn', 'lei', 'gw', 'dsh', 'jian'], 'dahong', 40, []],
  ['金鹏', 17, [['jinpeng', 17]], ['qly', 'sn', 'lei', 'gw', 'dsh', 'jian'], 'dahong', 45, ['a_yunxi']],
  ['蒲魔树', 18, [['pumo', 18]], ['qly', 'sn', 'lei', 'gw', 'dsh', 'jian', 'ta'], 'dahong', 50, []],
  ['野外·大荒深处', 8, [['bear', 8], ['leopard', 8]], ['qly', 'sn'], 'maoqiu', 30, []],
  ['野外·狮岭', 15, [['yuzu', 15], ['bigwolf', 15]], ['qly', 'sn', 'lei', 'gw'], 'dahong', 30, []],
];
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { localStorage.clear(); }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始'); await pg.waitForTimeout(300);
  const out = await pg.evaluate(async SC => { __dbg.auto = true; __dbg.instant = true; __dbg.dlgPick(-1); await new Promise(r => setTimeout(r, 400)); const c = __dbg.C; c.auto = true; const res = [];
    const gfAt = lv => ['yingxia', 'xixue', 'guwen', 'yaoding', ...(lv >= 10 ? ['jijing'] : []), ...(lv >= 16 ? ['taiyi'] : [])];
    for (const [name, lv, mobs, sk, pet, aff, allies] of SC) { let w = 0, rounds = 0, hp = 0; const N = 30;
      for (let i = 0; i < N; i++) { c.lv = lv; c.sk = sk.slice(); c.bar = sk.slice(0, typeof barSlots === 'function' ? barSlots(lv) : 4); c.gf = gfAt(lv); c.dt = ['li', 'ti', 'ling', 'shou', 'su', 'feng', 'li', 'ti', 'ling'].slice(0, Math.max(0, lv - 9)); c.bag = {}; c.prof = {}; c.eq = []; c.relics = {};
        c.pets = pet ? { [pet]: { aff } } : {}; c.pet = pet; fullHeal();
        const r = await new Promise(res => __dbg.startBattle({ mobs, allies, title: name, noLose: true, story: 1, flee: false }).then(res)); const B = __dbg.STATE.battle; if (r.win) { w++; hp += r.hp / charStats().hpMax; } rounds += (r.rounds || 0); }
      res.push([name, lv, Math.round(w / N * 100) + '%', w ? Math.round(hp / w * 100) + '%' : '-']); }
    return res; }, SC);
  console.log((process.argv[2] || '') + '\n' + out.map(r => r.join('\t')).join('\n'), errs); await b.close(); })();
