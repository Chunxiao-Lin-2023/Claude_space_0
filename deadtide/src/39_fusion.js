/* ================= (round 40) co-op mech fusion: two mechs become one ================= */
// One player asks (J / the 合体 button), the other agrees within 8 s while both are in mech form and close: the asker's mech is the
// body, the other mech folds onto it as a module (orbiting gun / armour + flying blade / backpack / heavy plating / wings / shoulder cannons).
// Roles: 驾驶 = moves + the body's normal attack; 炮手 = the module's normal attack with their own aim + the combined ultimate.
// K swaps the roles. X (or J again) splits them. Both hulls pool into one; the hull breaking splits them with both mechs knocked out.
const FUS_NAME = { '1-1': '双子疾风', '2-2': '修罗赤刃', '3-3': '蜂王工蜂', '4-4': '不动铁卫', '5-5': '天穹苍隼', '6-6': '攻城重炮',
  '1-2': '疾风斩', '1-3': '蜂群风暴', '1-4': '铁壁游骑', '1-5': '疾隼', '1-6': '速射炮台', '2-3': '刀锋快递', '2-4': '镇魂武士', '2-5': '天刃',
  '2-6': '炮刃', '3-4': '工程堡垒', '3-5': '空投蜂巢', '3-6': '爆破工厂', '4-5': '飞天要塞', '4-6': '移动要塞', '5-6': '空中炮艇' };
const FUS_MOD = [null, '悬浮炮台', '浮空大刀 + 红甲', '背包发射器', '重甲 + 塔盾', '机翼', '双肩炮']; // what the second mech turns into
const fusKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
const fusName = F => FUS_NAME[fusKey(F.kb, F.kp)] || '合体机甲';
const fusOf = p => { const F = W && W.fus; return F && p && (F.a === p.i || F.b === p.i) ? F : null; };
const fusRole = p => { const F = fusOf(p); return F ? (F.d === p.i ? 'd' : 'g') : null; };
const fusMate = p => { const F = fusOf(p); return F ? W.p[F.a === p.i ? F.b : F.a] : null; };
const FUS = { range: 4.5, ask: 8, hpMul: 0.9, sameHp: 1.15, armor: 0.8, dm: 1.2, sameDm: 1.35, spd: 0.9, sameSpd: 0.85, scale: 1.3, sameScale: 1.5, bat: 1.0 };
// why p can't fuse with q right now ('' = can)
function fuseDeny(p, q) {
  if (!q) return '附近没有在机甲里的队友（要在 ' + FUS.range + ' 格内）';
  if (!inMech(p) || p.mtr > 0) return '先变成机甲才能合体';
  if (!inMech(q) || q.mtr > 0) return '队友要先变成机甲';
  if (p.evoOn || q.evoOn) return '神兽形态不能合体';
  if (p.mfly || q.mfly) return '先落地再合体';
  if (mhpOf(p) < MECHS[p.veh].hp * 0.15 || mhpOf(q) < MECHS[q.veh].hp * 0.15) return '装甲太破了，修一修再合体';
  if (Math.hypot(p.x - q.x, p.y - q.y) > FUS.range || Math.abs(p.z - q.z) > 1.5) return '离队友太远了（要在 ' + FUS.range + ' 格内）';
  return '';
}
const fuseMateNear = p => { let best = null, bd = 99; for (const q of W.p) { if (q === p || q.gone || q.dead || q.down || !inMech(q)) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } } return best; };
// J / 合体: split if fused; else ask, or agree to the partner's ask
function fuseAct(p) {
  const F = fusOf(p); if (F) { fuseSplit(F, F.v ? '你解除了合体' : (p.name || '队友') + ' 解除了合体'); return; }
  const q = fuseMateNear(p); if (!(q && Math.hypot(q.x - p.x, q.y - p.y) <= FUS.range) && capN()) { fuseCapsule(p); return; } /* (round 40d) no partner close by: use a capsule */
  const why = fuseDeny(p, q); if (why) { emit({ k: 'deny', p: p.i, why }); return; }
  const R = W.fusReq;
  if (R && R.from === q.i && R.to === p.i && W.t - R.t < FUS.ask) { W.fusReq = null; fuseStart(q, p); return; } // they asked first: their mech is the body
  W.fusReq = { from: p.i, to: q.i, t: W.t }; emit({ k: 'fusreq', o: p.i, to: q.i, kb: p.veh, kp: q.veh });
}
function fuseStart(A, B) {
  const kb = A.veh, kp = B.veh, same = kb === kp, mx = (MECHS[kb].hp + MECHS[kp].hp) * FUS.hpMul * (same ? FUS.sameHp : 1);
  const F = W.fus = { a: A.i, b: B.i, kb, kp, d: A.i, g: B.i, same: same ? 1 : 0, max: Math.round(mx), hp: Math.round(Math.min(mx, (mhpOf(A) + mhpOf(B)) * FUS.hpMul * (same ? FUS.sameHp : 1))), cd: 0, t: W.t };
  for (const q of [A, B]) { if (q.ccLat) shakeOff(q, 99); ccClear(q); q.mfly = false; q.invT = Math.max(q.invT || 0, 1.2); }
  const bx = r2(B.x), by = r2(B.y), bz = r2(B.z); /* (round 40c) where the partner leaps from, for the cut-in */
  B.x = A.x; B.y = A.y; B.z = A.z; B.L = A.L; B.zv = A.zv;
  emit({ k: 'fuse', a: A.i, b: B.i, kb, kp, x: r2(A.x), y: r2(A.y), z: r2(A.z), bx, by, bz });
  return F;
}
// split: each mech gets its share of what's left of the pooled hull; broken = both hulls at 0 (they fall back to vehicles)
function fuseSplit(F, why, broke) {
  if (!F || W.fus !== F) return; W.fus = null; const A = W.p[F.a], B = W.p[F.b], f = broke ? 0 : clamp(F.hp / F.max, 0, 1);
  for (const [q, k] of [[A, F.kb], [B, F.kp]]) { if (!q) continue; q.mh = q.mh || []; q.mh[k] = Math.round(MECHS[k].hp * f); q.mcd = Math.max(q.mcd || 0, 1); }
  if (B) { const a = (A ? A.aim : 0) + Math.PI / 2; for (const r of [1.6, 1.2, 0.8, 0]) { const x = B.x + Math.cos(a) * r, y = B.y + Math.sin(a) * r; if (r === 0 || (inMap(Math.floor(x), Math.floor(y)) && standable(Math.floor(x), Math.floor(y), B.L, 'p'))) { if (B.i === ME && NETROLE !== 'guest') { B.x = x; B.y = y; } else emit({ k: 'mmove', p: B.i, m: { dash: { t: 0, T: 0.25, dx: x - B.x, dy: y - B.y } } }); break; } } }
  emit({ k: 'unfuse', a: F.a, b: F.b, kb: F.kb, kp: F.kp, why: why || '', br: broke ? 1 : 0, x: r2(A ? A.x : 0), y: r2(A ? A.y : 0), z: r2(A ? A.z : 0) });
  if (broke) for (const q of [A, B]) if (q) mechEject(q, '合体机甲被打散了：两台机甲的装甲都要修');
}
function fuseSwap(p) { const F = fusOf(p); if (!F) return; if (F.v) { emit({ k: 'deny', p: p.i, why: '胶囊合体只有你一个人：移动和本体普攻归你，模块自己找目标，G 放合体技' }); return; } const d = F.d; F.d = F.g; F.g = d; emit({ k: 'fswap', d: F.d, g: F.g }); }
// a hit on either of them lands on the pooled hull
function fuseHurt(p, dmg) {
  const F = fusOf(p), M = MECHS[F.kb]; F.hp = Math.max(0, F.hp - dmg * M.armor * FUS.armor / BAL.mechTough / MUP[mlvOf(F.kb)].t * (p.ccBrk > 0 ? 1.25 : 1)); emit({ k: 'phurt', p: F.a, d: 0 });
  if (F.hp <= 0) fuseSplit(F, '合体机甲的装甲被打穿了', true);
}
// the gunner's ultimate: both mechs' skills at once, from the body (dash / leap / slam move or centre on it)
function fuseSkill(G, v) {
  const F = fusOf(G), D = W.p[F.d]; if (!D) return;
  if (F.cd > 0) { emit({ k: 'deny', p: G.i, why: '合体技冷却中（' + Math.ceil(F.cd) + ' 秒）' }); return; }
  const tx = v && v.x != null ? v.x : D.x + Math.cos(G.aim) * 8, ty = v && v.y != null ? v.y : D.y + Math.sin(G.aim) * 8, ks = F.same ? [F.kb] : [F.kb, F.kp];
  const order = ks.slice().sort((a, b) => (MECHS[b].skill === 'dash' || MECHS[b].skill === 'leap' ? 1 : 0) - (MECHS[a].skill === 'dash' || MECHS[a].skill === 'leap' ? 1 : 0)); // the move goes last so everything else fires from where you stand
  for (const k of order) {
    const M = MECHS[k];
    if (M.skill === 'fly') { // in a fusion 苍隼 can't take off with a passenger: it fires a rocket barrage instead
      const ang = Math.atan2(ty - D.y, tx - D.x), Dd = clamp(Math.hypot(tx - D.x, ty - D.y), 4, 16), cx0 = D.x + Math.cos(ang) * Dd, cy0 = D.y + Math.sin(ang) * Dd;
      for (let q = 0; q < 6; q++) { const a2 = q / 6 * Math.PI * 2, r = q ? 1.6 : 0, x = cx0 + Math.cos(a2) * r, y = cy0 + Math.sin(a2) * r, c2x = Math.floor(x), c2y = Math.floor(y), L = inMap(c2x, c2y) ? gAt(c2x, c2y) : D.L;
        (W.dly = W.dly || []).push({ t: 0.35 + q * 0.1, x, y, L, R: 2.0, dmg: 95, o: D.i, shell: 1 }); emit({ k: 'cshot', o: D.i, x: r2(D.x), y: r2(D.y), z: r2(D.z + 2.6), e: [r2(x), r2(y), r2(L * FH + 0.1)], t: r2(0.35 + q * 0.1) }); }
      continue; }
    const actor = M.skill === 'volley' ? ((G.shl || 0) >= (D.shl || 0) ? G : D) : D, s0 = [actor.mcd, actor.ccStg], x0 = actor.x, y0 = actor.y;
    actor.mcd = 0; actor.ccStg = 0; if (actor !== D) { actor.x = D.x; actor.y = D.y; }
    mechSkill(actor, { x: tx, y: ty }, M); actor.mcd = s0[0]; actor.ccStg = s0[1]; if (actor !== D) { actor.x = x0; actor.y = y0; }
    if (F.same && M.skill !== 'dash') mechSkill(D, { x: tx + (ty - D.y) * 0.15, y: ty - (tx - D.x) * 0.15 }, M), D.mcd = s0[0]; // same kind: a second, slightly offset copy
  }
  F.cd = Math.max(...ks.map(k => MECHS[k].cd)) * (F.same ? 1.1 : 1); G.mcd = D.mcd = F.cd;
  emit({ k: 'fskill', o: G.i, n: fusName(F), x: r2(D.x), y: r2(D.y), z: r2(D.z) });
}
// host, every step: keep the gunner inside the body, run the cooldown, drain both batteries, split when one gives out
function fuseStep(dt) {
  const R = W.fusReq; if (R && W.t - R.t > FUS.ask) W.fusReq = null;
  const F = W.fus; if (!F) return;
  if (F.v) { const D = W.p[F.a]; /* (round 40d) a capsule fusion: one pilot, a timer */
    if (!D || D.gone || D.dead || D.down || !inMech(D)) { fuseSplit(F, '合体解除了'); return; }
    if (F.cd > 0) { F.cd = Math.max(0, F.cd - dt); D.mcd = F.cd; }
    F.left -= dt; if ((D.bat || 0) < 1) { fuseSplit(F, '机甲没电了，合体解除'); return; } if (F.left <= 0) fuseSplit(F, '胶囊能量用完了，合体解除'); return; } const D = W.p[F.d], G = W.p[F.g];
  if (!D || !G || D.gone || G.gone || D.dead || G.dead || D.down || G.down || !inMech(D) || !inMech(G)) { fuseSplit(F, '合体解除了'); return; }
  if (F.cd > 0) { F.cd = Math.max(0, F.cd - dt); G.mcd = D.mcd = F.cd; }
  if ((D.bat || 0) < 1 || (G.bat || 0) < 1) { fuseSplit(F, '机甲没电了，合体解除'); return; }
  if (G.i === ME && NETROLE !== 'guest') fuseSnap(G); // a guest gunner snaps on its own screen (stepMove)
}
function fuseSnap(G) { const F = fusOf(G), D = F && W.p[F.d]; if (!D || D === G) return; G.x = D.x; G.y = D.y; G.z = D.z; G.L = D.L; G.zv = D.zv; G.vx = D.vx || 0; G.vy = D.vy || 0; }

/* ================= (round 40d) fusion capsules: fuse on your own ================= */
// Found while searching ('c' + mech kind in W.bps). With no partner close by, J in mech form uses the first one: that mech drops out of the
// sky into yours as the module (same pooled hull / ×1.2 damage / names as a co-op fusion) for BAL.capT seconds. You drive and fight with the
// body; the module fights on its own (fuseAI: the nearest zombie it can reach, or what you aim at while you hold fire); G is the combined skill.
const capNext = () => { const b = (W && W.bps || []).find(b => b[0] === 'c'); return b ? +b.slice(1) : 0; };
const capN = () => (W && W.bps || []).filter(b => b[0] === 'c').length;
function fuseCapsule(p) {
  const why = !inMech(p) || p.mtr > 0 ? '先变成机甲才能用合体胶囊' : p.evoOn ? '神兽形态不能合体' : p.mfly ? '先落地再合体' : W.fus ? '现在不能合体' : mhpOf(p) < MECHS[p.veh].hp * 0.15 ? '装甲太破了，修一修再合体' : '';
  if (why) { emit({ k: 'deny', p: p.i, why }); return null; }
  const ix = W.bps.findIndex(b => b[0] === 'c'), kp = +W.bps[ix].slice(1), kb = p.veh, same = kb === kp, m = FUS.hpMul * (same ? FUS.sameHp : 1), mx = (MECHS[kb].hp + MECHS[kp].hp) * m; W.bps.splice(ix, 1);
  const F = W.fus = { a: p.i, b: -1, kb, kp, d: p.i, g: -1, same: same ? 1 : 0, max: Math.round(mx), hp: Math.round(Math.min(mx, (mhpOf(p) + MECHS[kp].hp) * m)), cd: 0, t: W.t, v: 1, left: BAL.capT, vg: 0.9, ga: p.aim };
  if (p.ccLat) shakeOff(p, 99); ccClear(p); p.invT = Math.max(p.invT || 0, 1.2);
  const a = p.aim + 2.2; /* it comes down behind you, from high up */
  emit({ k: 'fuse', a: p.i, b: -1, kb, kp, v: 1, x: r2(p.x), y: r2(p.y), z: r2(p.z), bx: r2(p.x + Math.cos(a) * 3.5), by: r2(p.y + Math.sin(a) * 3.5), bz: r2(p.z + 9) });
  return F;
}
// the module's own attack, on its own cooldown: the driver's blow is made with the module's mech for this one call (FUS_ALT)
function fuseAI(p, dt, fire) {
  const F = W.fus; F.vg = (F.vg || 0) - dt; if (F.vg > 0 || !inMech(p) || p.mtr > 0 || p.ccStg > 0) return;
  const M = MECHS[F.kp], rg = mechRanged(M) ? (M.range || 16) : M.reach + 1.2; let z = null;
  if (!fire) { let bd = rg; for (const q of W.zs) { if (!(q.hp > 0) || q.hidden || q.sleep || q.ck || q.ckF || !zSeen(q) || Math.abs(q.z - p.z) > 3) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd + q.r && (M.atk === 'parcel' || los(p.x, p.y, p.z + 1.6, q.x, q.y, q.z + q.h * 0.5))) { bd = d; z = q; } } if (!z) return; }
  const keep = { gcd: p.gcd, aim: p.aim, aimPt: p.aimPt, mcmb: p.mcmb, mlastT: p.mlastT, mside: p.mside, mAim: p.mAim, mTgt: p.mTgt };
  p.gcd = 0; p.mcmb = F.vc; p.mlastT = F.vl; if (z) { p.aim = Math.atan2(z.y - p.y, z.x - p.x); p.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; }
  FUS_ALT = true; try { mechPunch(p); } finally { FUS_ALT = false; }
  F.vc = p.mcmb; F.vl = p.mlastT; F.ga = p.mAim != null ? p.mAim : p.aim; F.vg = M.rate * (fire ? 1 : 1.2);
  Object.assign(p, keep);
}
