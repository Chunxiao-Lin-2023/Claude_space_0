/* 哪张地图是什么楼（lib/k_15_bld.js，RULES 39）：居民楼 apt / 学校 sch / 医院 hosp。
   写法：'地图' 或 '地图!'（! = 房间 / 机关多的地方，不自动摆家具）；'地图~' = 保留原来的地面；'地图^' = 保留原来的墙 */
{ const BLD = {
    sch: { muyang: 'tb', pen: 'dorm1 dc room!', wc: 'h1 h2 h3', office: 'offh math!', last: 'cr room!', date: 'dorm', dance: 'c2', shoes: 'off! store!' },
    apt: { trial: 'f1 f2 r208!', wangqi: 'f2 fuan! r208!', live: 'r208!', f3: 'f1 f2 f3! r208!', escape: 'f1 f2 r203!', haiming: 'ap h303p! r303!' },
    hosp: { ward: 'b1', laundry: 'ld!~^', b3: 'c', dean: 'pastw! off!~', door: 'f1', candy: 'f4' } };
  for (const b in BLD) for (const cid in BLD[b]) { const ch = CHAPTERS.find(c => c.id === cid); if (!ch) continue;
    for (const tok of BLD[b][cid].split(' ')) { const id = tok.replace(/[!~^]/g, ''), d = ch.maps[id]; if (!d) continue;
      d.bld = b; if (!tok.includes('^')) d.wall = b; if (tok.includes('!')) d.bldProps = false; if (tok.includes('~')) d.bldKeepFloor = true; } } }
