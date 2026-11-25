/* ================= (round 40) co-op mech fusion: two mechs become one ================= */
// One player asks (J / the 合体 button), the other agrees within 8 s while both are in mech form and close: the asker's mech is the
// body, the other mech folds onto it as a module (orbiting gun / armour + flying blade / backpack / heavy plating / wings / shoulder cannons).
// Roles: 驾驶 = moves + the body's normal attack; 炮手 = the module's normal attack with their own aim + the combined ultimate.
// K swaps the roles. X (or J again) splits them. Both hulls pool into one; the hull breaking splits them with both mechs knocked out.
const FUS_NAME = { '1-1': '双子疾风', '2-2': '修罗赤刃', '3-3': '蜂王工蜂', '4-4': '不动铁卫', '5-5': '天穹苍隼', '6-6': '攻城重炮',
  '1-2': '疾风斩', '1-3': '蜂群风暴', '1-4': '铁壁游骑', '1-5': '疾隼', '1-6': '速射炮台', '2-3': '刀锋快递', '2-4': '镇魂武士', '2-5': '天刃',
  '2-6': '炮刃', '3-4': '工程堡垒', '3-5': '空投蜂巢', '3-6': '爆破工厂', '4-5': '飞天要塞', '4-6': '移动要塞', '5-6': '空中炮艇' };
const FUS_MOD = [null, '加特林臂 + 轮滑', '臂刃 + 大袖', '肩上工蜂', '塔盾 + 重甲', '机翼', '双肩炮 + 反应装甲']; // (round 43) what the second mech comes apart into
const fusKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
const fusName = F => FUS_NAME[fusKey(F.kb, F.kp)] || '合体机甲';
const fusOf = p => { const F = W && W.fus; return F && p && (F.a === p.i || F.b === p.i) ? F : null; };
const fusRole = p => { const F = fusOf(p); return F ? (F.d === p.i ? 'd' : 'g') : null; };
const fusMate = p => { const F = fusOf(p); return F ? W.p[F.a === p.i ? F.b : F.a] : null; };
const FUS = { range: 4.5, ask: 8, hpMul: 0.9, sameHp: 1.15, armor: 0.8, dm: 1.2, sameDm: 1.35, spd: 0.9, sameSpd: 0.85, scale: 1.15, sameScale: 1.25, /* (round 43) 1.3 / 1.5 → 1.15 / 1.25: the armour makes it bigger anyway */ bat: 1.0 };
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
  if (!F || W.fus !== F) return; W.fus = null; for (const q of [W.p[F.a], W.p[F.b]]) if (q && q.mfly && q.veh !== 5) { q.land = true; } /* (round 43) a split mid-flight: anything that can't fly comes down */ const A = W.p[F.a], B = W.p[F.b], f = broke ? 0 : clamp(F.hp / F.max, 0, 1);
  for (const [q, k] of [[A, F.kb], [B, F.kp]]) { if (!q) continue; q.mh = q.mh || []; q.mh[k] = Math.round(MECHS[k].hp * f); q.mcd = Math.max(q.mcd || 0, 1); }
  if (B) { const a = (A ? A.aim : 0) + Math.PI / 2; for (const r of [1.6, 1.2, 0.8, 0]) { const x = B.x + Math.cos(a) * r, y = B.y + Math.sin(a) * r; if (r === 0 || (inMap(Math.floor(x), Math.floor(y)) && standable(Math.floor(x), Math.floor(y), B.L, 'p'))) { if (B.i === ME && NETROLE !== 'guest') { B.x = x; B.y = y; } else emit({ k: 'mmove', p: B.i, m: { dash: { t: 0, T: 0.25, dx: x - B.x, dy: y - B.y } } }); break; } } }
  emit({ k: 'unfuse', a: F.a, b: F.b, kb: F.kb, kp: F.kp, why: why || '', br: broke ? 1 : 0, x: r2(A ? A.x : 0), y: r2(A ? A.y : 0), z: r2(A ? A.z : 0) });
  if (broke) for (const q of [A, B]) if (q) mechEject(q, '合体机甲被打散了：两台机甲的装甲都要修');
}
function fuseSwap(p) { const F = fusOf(p); if (!F) return; if (F.v) { emit({ k: 'deny', p: p.i, why: '胶囊合体只有你一个人：移动和本体普攻归你，模块自己找目标，G 放合体技' }); return; } const d = F.d; F.d = F.g; F.g = d; emit({ k: 'fswap', d: F.d, g: F.g }); }
// a hit on either of them lands on the pooled hull
function fuseHurt(p, dmg, src) {
  const F = fusOf(p), M = MECHS[F.kb];
  if (F.kp === 4 && !(F.shOut > W.t) && src && src.x != null) { const D = W.p[F.d] || p, ang = Math.atan2(src.y - D.y, src.x - D.x); if (Math.cos(angDiff(ang, fusFace(D))) > Math.cos(BAL.fShieldArc)) { dmg *= BAL.fShield; if (!(F.sbT > W.t)) { F.sbT = W.t + 0.35; emit({ k: 'sblock', o: F.a, a: r2(ang) }); } } } /* (round 43) the tower shield, held up in front, takes 40% off what comes from ahead */
  if (F.kp === 6) dmg *= BAL.fReact; /* (round 43) 重炮's reactive armour */ F.hp = Math.max(0, F.hp - dmg * M.armor * FUS.armor / BAL.mechTough / MUP[mlvOf(F.kb)].t * (p.ccBrk > 0 ? 1.25 : 1)); emit({ k: 'phurt', p: F.a, d: 0 });
  if (F.hp <= 0) fuseSplit(F, '合体机甲的装甲被打穿了', true);
}
// the gunner's ultimate: both mechs' skills at once, from the body (dash / leap / slam move or centre on it)
/* (round 43) fuseSkill moved to 39b_fuseult.js: one move per pair */
// host, every step: keep the gunner inside the body, run the cooldown, drain both batteries, split when one gives out
function fuseStep(dt) {
  const R = W.fusReq; if (R && W.t - R.t > FUS.ask) W.fusReq = null;
  const F = W.fus; if (!F) { if (W.fuq || W.ftmp || W.fblades || W.fhive || W.ffire) fuseUltStep(null, dt); return; }
  if (F.v) { const D = W.p[F.a]; /* (round 40d) a capsule fusion: one pilot, a timer */
    if (!D || D.gone || D.dead || D.down || !inMech(D)) { fuseSplit(F, '合体解除了'); return; }
    if (!capSolo()) { fuseSplit(F, '队友来了：胶囊合体解除（双人直接按 J 合体）'); return; } /* (round 43) */
    if (F.cd > 0) { F.cd = Math.max(0, F.cd - dt); D.mcd = F.cd; }
    fuseFlyStep(F, dt); fuseUltStep(F, dt); /* (round 43) */ F.left -= dt; if ((D.bat || 0) < 1) { fuseSplit(F, '机甲没电了，合体解除'); return; } if (F.left <= 0) fuseSplit(F, '胶囊能量用完了，合体解除'); return; } const D = W.p[F.d], G = W.p[F.g];
  if (!D || !G || D.gone || G.gone || D.dead || G.dead || D.down || G.down || !inMech(D) || !inMech(G)) { fuseSplit(F, '合体解除了'); return; }
  if (F.cd > 0) { F.cd = Math.max(0, F.cd - dt); G.mcd = D.mcd = F.cd; }
  if ((D.bat || 0) < 1 || (G.bat || 0) < 1) { fuseSplit(F, '机甲没电了，合体解除'); return; }
  fuseFlyStep(F, dt); fuseUltStep(F, dt); /* (round 43) */
  if (G.i === ME && NETROLE !== 'guest') fuseSnap(G); // a guest gunner snaps on its own screen (stepMove)
}
/* (round 43) which way the fused body faces (the driver's aim), its size, and whether p is the partner's half (the co-op gunner, or the capsule module's swing) */
const fusFace = p => { const F = fusOf(p); if (!F) return p.aim; const D = W.p[F.d]; return D ? (D.i === ME || NETROLE !== 'guest' ? D.aim : D.aim) : p.aim; };
const fusModSide = p => { const F = fusOf(p); return !!F && (F.v ? FUS_ALT : fusRole(p) === 'g'); };
const fusBodyS = p => { const F = fusOf(p); return F ? ((MECH_DIM[MECHS[F.kb].style] || {}).s || 1) * (F.same ? FUS.sameScale : FUS.scale) : 1; };
// (round 43) the module 铁卫's tower shield: close (≤ 3.5) it is lifted and slammed down in front; further it is thrown like a boomerang — 10 tiles out and back, hitting what it passes both ways
function shieldAttack(p, M) {
  const F = fusOf(p), D = W.p[F.d] || p; if (F.shOut > W.t) { p.gcd = Math.max(0.05, F.shOut - W.t); return; }
  const T = mechLock(p, M, BAL.sbRange); let a = p.aim; if (T) a = Math.atan2(T.y - D.y, T.x - D.x); else if (p.aimPt && !p.aimPt.auto) a = Math.atan2(p.aimPt.y - D.y, p.aimPt.x - D.x); p.mAim = a; p.mTgt = T ? T.id : -1;
  const d = T ? Math.hypot(T.x - D.x, T.y - D.y) : 0, back = !F.v && Math.abs(angDiff(a, fusFace(D))) > BAL.fBackArc;
  if (!T || d <= BAL.sbNear || back) { emit({ k: 'mpunch', o: p.i, s: 0, c: 0, a: r2(a), fm: FUS_ALT ? 1 : 0, sk: back ? 3 : 1 }); (W.dly = W.dly || []).push({ t: back ? 0.18 : 0.26, sslam: 1, o: p.i, a, back: back ? 1 : 0, dmg: M.dmg * mechMul() }); return; }
  const E = evoLineEnd(D, a, BAL.sbRange), L = Math.max(1.5, Math.hypot(E.x - D.x, E.y - D.y)); F.shOut = W.t + BAL.sbT; p.gcd = BAL.sbT;
  (W.sboom = W.sboom || []).push({ o: p.i, a, L, t: 0, T: BAL.sbT, x0: D.x, y0: D.y, h1: [], h2: [], dmg: M.dmg * BAL.sbMul * mechMul() });
  emit({ k: 'mpunch', o: p.i, s: 0, c: 0, a: r2(a), fm: FUS_ALT ? 1 : 0, sk: 2 }); emit({ k: 'sboom', o: F.a, x: r2(D.x), y: r2(D.y), z: r2(D.z), a: r2(a), L: r2(L), T: BAL.sbT }); noiseAt(D.x, D.y, 6, D.z);
}
// where the thrown shield is at time t: out along the line (easing off at the far end), then back to wherever the body is now
function sboomAt(b, D) { const u = b.t / b.T, ca = Math.cos(b.a), sa = Math.sin(b.a); if (u < 0.5) { const k = Math.sin(u / 0.5 * Math.PI / 2); return { x: b.x0 + ca * b.L * k, y: b.y0 + sa * b.L * k, out: 1 }; }
  const fx = b.x0 + ca * b.L, fy = b.y0 + sa * b.L, k = 1 - Math.cos((u - 0.5) / 0.5 * Math.PI / 2), tx = D ? D.x : b.x0, ty = D ? D.y : b.y0; return { x: lerp(fx, tx, k), y: lerp(fy, ty, k), out: 0 }; }
function sboomStep(dt) { if (!W.sboom || !W.sboom.length) return;
  for (const b of W.sboom) { b.t += dt; const F = W.fus, D = F ? W.p[F.d] : null, P2 = sboomAt(b, D), hl = P2.out ? b.h1 : b.h2, z0 = D ? D.z : 0;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || hl.includes(z.id) || Math.abs(z.z - z0) > 2.6) continue; if (Math.hypot(z.x - P2.x, z.y - P2.y) > 1.25 + z.r) continue; hl.push(z.id);
      const big = ZT[z.k].boss || ZT[z.k].kaiju, kb = big ? 1 : 6, dx = z.x - P2.x, dy = z.y - P2.y, l = Math.hypot(dx, dy) || 1, sgn = P2.out ? 1 : -1; hurtZombie(z, b.dmg, W.p[b.o], (Math.cos(b.a) * sgn * 0.6 + dx / l * 0.6) * kb, (Math.sin(b.a) * sgn * 0.6 + dy / l * 0.6) * kb); z.stun = Math.max(z.stun || 0, big ? 0.1 : 0.35); emit({ k: 'mhit', o: b.o, h: 1, x: r2(z.x), y: r2(z.y), z: r2(z.z + 0.6), r: 0.6 }); } }
  W.sboom = W.sboom.filter(b => b.t < b.T); }
function shieldSlamHit(q) { const p = W.p[q.o], F = fusOf(p), D = F ? W.p[F.d] || p : p; if (!D) return; const ca = Math.cos(q.a), sa = Math.sin(q.a), R = q.back ? BAL.sbR * 0.85 : BAL.sbR, off = q.back ? 1.6 : 2.0, cx = D.x + ca * off, cy = D.y + sa * off; let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - D.z) > 2.6) continue; const dx = z.x - cx, dy = z.y - cy, d = Math.hypot(dx, dy); if (d > R + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, q.dmg, p, dx / (d || 1) * (big ? 1 : 5), dy / (d || 1) * (big ? 1 : 5)); z.stun = Math.max(z.stun || 0, big ? 0.1 : 0.8); n++; }
  emit({ k: 'mhit', o: q.o, h: n ? 1 : 0, x: r2(cx), y: r2(cy), z: r2(D.z + 0.15), g: 1, r: R }); emit({ k: 'sslam', o: F ? F.a : q.o, x: r2(cx), y: r2(cy), z: r2(D.z), r: R }); noiseAt(cx, cy, 7, D.z); }
function fuseSnap(G) { const F = fusOf(G), D = F && W.p[F.d]; if (!D || D === G) return; G.x = D.x; G.y = D.y; G.z = D.z; G.L = D.L; G.zv = D.zv; G.vx = D.vx || 0; G.vy = D.vy || 0; }

/* ================= (round 40d) fusion capsules: fuse on your own ================= */
// Found while searching ('c' + mech kind in W.bps). With no partner close by, J in mech form uses the first one: that mech drops out of the
// sky into yours as the module (same pooled hull / ×1.2 damage / names as a co-op fusion) for BAL.capT seconds. You control all of it: fire
// swings the body's attack and the module's together (fuseAI, each on its own cooldown) at what you aim at; G is the combined skill.
const capNext = () => { const b = (W && W.bps || []).find(b => b[0] === 'c'); return b ? +b.slice(1) : 0; };
const capSolo = () => !!(W && W.p && W.p.filter(q => !q.gone).length === 1); /* (round 43) capsules are a solo thing: with two players none drop and the ones you carry stay hidden until you play alone again */
const capN = () => capSolo() ? (W && W.bps || []).filter(b => b[0] === 'c').length : 0;
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
// the module's attack, on its own cooldown, only while you hold fire, at what you aim at (round 40e: no AI — you control it): the driver's
// blow is made with the module's mech for this one call (FUS_ALT); your aim / swing / combo are kept as they were
function fuseAI(p, dt, fire) {
  const F = W.fus; F.vg = (F.vg || 0) - dt; if (!fire || F.vg > 0 || !inMech(p) || p.mtr > 0 || p.ccStg > 0) return;
  const keep = { gcd: p.gcd, mcmb: p.mcmb, mlastT: p.mlastT, mside: p.mside, mAim: p.mAim, mTgt: p.mTgt };
  p.gcd = 0; p.mcmb = F.vc; p.mlastT = F.vl;
  FUS_ALT = true; try { mechPunch(p); } finally { FUS_ALT = false; }
  F.vc = p.mcmb; F.vl = p.mlastT; F.ga = p.mAim != null ? p.mAim : p.aim; F.vg = MECHS[F.kp].rate;
  Object.assign(p, keep);
}

/* ================= (round 43) fusions with 苍隼: flying is part of the combo ================= */
// light (苍隼 with 疾风 / 赤刃 / 工蜂, or two 苍隼): hits by either player fill the wing meter; full → it takes off by itself for 4 s (air
// versions of both attacks), then dives onto the driver's aim point (≤ 8) with that pair's own landing move. heavy (苍隼 with 铁卫 / 重炮):
// it never takes off — the wings make it glide (×1.05) and every 4th 苍隼 blow fans out a whirlwind that pulls zombies together.
const fusFlyKind = F => { if (!F || (F.kb !== 5 && F.kp !== 5)) return 0; const o = F.kb === 5 ? F.kp : F.kb; return o === 4 || o === 6 ? 2 : 1; };
const fusFlyNow = p => { const F = fusOf(p); return !!(F && (F.fly || F.flyL > 0 || F.uFly)); };
const fusSpd = F => F.lockT > W.t ? 0 : F.kp === 1 && !F.same ? 1 : fusFlyKind(F) === 2 ? BAL.fGlide : F.same ? FUS.sameSpd : FUS.spd;
const FUS_WN = [0, 25, 4, 6, 0, 5, 0]; // hits to fill the wing meter, by the mech that lands them
function fuseWingHit(p) { const F = fusOf(p); if (!F || fusFlyKind(F) !== 1 || F.fly || F.dive) return; const k = MECHS.indexOf(mechOf(p)), n = FUS_WN[k]; if (!n) return;
  F.wgT = F.wgT || {}; if (W.t - (F.wgT[p.i] || -9) < 0.08) return; F.wgT[p.i] = W.t; F.wg = Math.min(1, (F.wg || 0) + 1 / n); }
function fuseFlyStep(F, dt) {
  const D = W.p[F.d], G = F.v ? null : W.p[F.g]; if (!D) return; const ps = [D, G].filter(Boolean);
  if (fusFlyKind(F) !== 1) return;
  if (F.dive) { F.dive.t += dt; if (F.dive.t >= F.dive.T) { fuseDiveHit(F, F.dive); F.dive = null; } return; }
  if (!F.fly && (F.wg || 0) >= 1 && D.mtr <= 0 && skyTop(D.x, D.y) <= D.L) { F.fly = { t: 0, T: BAL.fFlyT }; F.wg = 0; for (const q of ps) { q.mfly = true; q.alt = 0; q.land = false; q._cz = null; } emit({ k: 'ffly', o: F.a, x: r2(D.x), y: r2(D.y), z: r2(D.z) }); }
  if (!F.fly) return; F.fly.t += dt;
  if ((F.kb === 3 || F.kp === 3) && Math.floor(F.fly.t) !== Math.floor(F.fly.t - dt)) { const L = gAt(Math.floor(D.x), Math.floor(D.y)), gz = surfZ(D.x, D.y, L) + 0.15, t3 = 0.35; emit({ k: 'mrkt', o: D.i, kd: 'parcel', x: r2(D.x), y: r2(D.y), z: r2(D.z + 0.8), e: [r2(D.x + frnd(-0.6, 0.6)), r2(D.y + frnd(-0.6, 0.6)), r2(gz)], t: t3 }); (W.dly = W.dly || []).push({ t: t3, box: 1, x: D.x, y: D.y, zz: gz, R: 1.6, dmg: MECHS[3].dmg * mechMul(), o: D.i }); } /* 工蜂 drops a parcel under itself every second */
  if (F.fly.t < F.fly.T) return;
  const tgt = D.aimPt && !D.aimPt.auto ? D.aimPt : { x: D.x + Math.cos(D.aim) * 6, y: D.y + Math.sin(D.aim) * 6 }, a = Math.atan2(tgt.y - D.y, tgt.x - D.x), dd = Math.min(BAL.fDiveR, Math.hypot(tgt.x - D.x, tgt.y - D.y));
  let ex = D.x + Math.cos(a) * dd, ey = D.y + Math.sin(a) * dd; if (!landOK(ex, ey)) { const t2 = landSpot(ex, ey); if (t2) { ex = t2[0]; ey = t2[1]; } else { ex = D.x; ey = D.y; } }
  const L = skyTop(ex, ey), gz = surfZ(ex, ey, L); F.fly = null; F.dive = { t: 0, T: 0.3, x: ex, y: ey, z: gz, a, k: fusKey(F.kb, F.kp) };
  emit({ k: 'fdive', o: F.a, x0: r2(D.x), y0: r2(D.y), z0: r2(D.z), x: r2(ex), y: r2(ey), z: r2(gz), a: r2(a), kk: F.dive.k });
  for (const q of ps) { q.mfly = false; q.land = false; q.alt = 0; if (q.i === ME && NETROLE !== 'guest' || NETROLE !== 'guest') { q.x = ex; q.y = ey; q.L = L; q.z = gz; q.zv = gz; q.jz = 0; } } emit({ k: 'fland', ps: ps.map(q => q.i), x: r2(ex), y: r2(ey) });
}
// the landing moves: each pair its own
function fuseDiveHit(F, d) { const D = W.p[F.d], o = D, mul = mechMul(), ca = Math.cos(d.a), sa = Math.sin(d.a); let n = 0;
  const area = (x, y, R, dmg, kb, st) => { for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - d.z) > 2.6) continue; const dx = z.x - x, dy = z.y - y, dd = Math.hypot(dx, dy); if (dd > R + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, dmg, o, dx / (dd || 1) * (big ? kb * 0.15 : kb), dy / (dd || 1) * (big ? kb * 0.15 : kb)); z.stun = Math.max(z.stun || 0, big ? 0.1 : st); n++; } };
  const strip = (a2, L2, w, dmg) => { const c2 = Math.cos(a2), s2 = Math.sin(a2); for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - d.z) > 2.6) continue; const rx = z.x - d.x, ry = z.y - d.y, t = rx * c2 + ry * s2, off = Math.abs(rx * s2 - ry * c2); if (t < 0 || t > L2 + z.r || off > w + z.r) continue; hurtZombie(z, dmg, o, c2 * 4, s2 * 4); z.stun = Math.max(z.stun || 0, 0.5); n++; } };
  if (d.k === '2-5') { area(d.x, d.y, 3.2, MECHS[2].dmg * 2.2 * mul, 7, 0.9); strip(d.a + Math.PI / 2, 6, 0.9, MECHS[2].dmg * 0.9 * mul); strip(d.a - Math.PI / 2, 6, 0.9, MECHS[2].dmg * 0.9 * mul); }
  else if (d.k === '1-5') { for (let k = 0; k < 8; k++) (W.dly = W.dly || []).push({ t: k * 0.06, fsweep: 1, x: d.x, y: d.y, z: d.z, o: o.i, R: 4, dmg: MECHS[1].dmg * mul }); area(d.x, d.y, 3, 120 * mul, 6, 0.6); }
  else if (d.k === '3-5') { area(d.x, d.y, 3.5, 140 * mul, 7, 0.8); for (let k = 0; k < 6; k++) { const a2 = k / 6 * Math.PI * 2 + frnd(-0.3, 0.3), r = frnd(1.6, 3.2), x = d.x + Math.cos(a2) * r, y = d.y + Math.sin(a2) * r, t3 = 0.35 + k * 0.05; emit({ k: 'mrkt', o: o.i, kd: 'parcel', x: r2(d.x), y: r2(d.y), z: r2(d.z + 0.6), e: [r2(x), r2(y), r2(d.z + 0.15)], t: r2(t3) }); (W.dly = W.dly || []).push({ t: t3, box: 1, x, y, zz: d.z + 0.15, R: 1.4, dmg: 45 * mul, o: o.i }); } }
  else { area(d.x, d.y, 3, 200 * mul, 8, 0.8); const zs = W.zs.filter(z => z.hp > 0 && !z.hidden && Math.hypot(z.x - d.x, z.y - d.y) < 10).sort((a2, b2) => Math.hypot(a2.x - d.x, a2.y - d.y) - Math.hypot(b2.x - d.x, b2.y - d.y)).slice(0, 6); /* 5-5: six homing missiles */
    zs.forEach((z, k) => { const t4 = 0.4 + k * 0.08; emit({ k: 'mrkt', o: o.i, kd: 'rocket', x: r2(d.x), y: r2(d.y), z: r2(d.z + 2), e: [r2(z.x), r2(z.y), r2(z.z + 0.4)], t: r2(t4) }); (W.dly = W.dly || []).push({ t: t4, x: z.x, y: z.y, L: z.L, R: 2, dmg: 72 * mul, o: o.i, shell: 1, zz: z.z + 0.3 }); }); }
  emit({ k: 'fdhit', o: F.a, x: r2(d.x), y: r2(d.y), z: r2(d.z), a: r2(d.a), kk: d.k, h: n ? 1 : 0 }); noiseAt(d.x, d.y, 10, d.z); }
function fuseSweepHit(q) { const o = W.p[q.o]; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - q.z) > 2.6) continue; if (Math.hypot(z.x - q.x, z.y - q.y) > q.R + z.r) continue; hurtZombie(z, q.dmg, o, 0, 0); } }
// 赤刃 in the air: a crescent wave down the line, 8 tiles, ×0.7
function bladeWave(p, a, M) { const F = fusOf(p), D = F ? W.p[F.d] || p : p, ca = Math.cos(a), sa = Math.sin(a), L = BAL.fWaveL, gz = surfZ(D.x, D.y, skyTop(D.x, D.y)); let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const rx = z.x - D.x, ry = z.y - D.y, t = rx * ca + ry * sa, off = Math.abs(rx * sa - ry * ca); if (t < 0 || t > L + z.r || off > 1.0 + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, M.dmg * BAL.fWaveMul * mechMul(), p, ca * (big ? 0.5 : 4), sa * (big ? 0.5 : 4)); z.stun = Math.max(z.stun || 0, 0.35); n++; }
  p.mAim = a; emit({ k: 'mpunch', o: p.i, s: p.mside, c: 0, a: r2(a), fm: FUS_ALT ? 1 : 0, sk: 0 }); emit({ k: 'bwave', o: p.i, x: r2(D.x), y: r2(D.y), z: r2(D.z + 1.2), gz: r2(gz), a: r2(a), L, h: n ? 1 : 0 }); noiseAt(D.x, D.y, 6, D.z); }
// heavy + wings: a whirlwind fanned out to the aim point (≤ 8): it stays 2.5 s and drags everything within 3.5 into its eye, slowed, 10 every 0.5 s
function fuseWhirl(p, T, a) { const F = fusOf(p), D = F ? W.p[F.d] || p : p, tgt = T ? T : p.aimPt && !p.aimPt.auto ? p.aimPt : { x: D.x + Math.cos(a) * 6, y: D.y + Math.sin(a) * 6 }, aa = Math.atan2(tgt.y - D.y, tgt.x - D.x), dd = Math.min(BAL.fWhirlR, Math.hypot(tgt.x - D.x, tgt.y - D.y)), E = evoLineEnd(D, aa, dd);
  (W.whirl = W.whirl || []).push({ x: E.x, y: E.y, z: D.z, t: BAL.fWhirlT, tk: 0, o: p.i }); p.mAim = aa;
  emit({ k: 'mpunch', o: p.i, s: p.mside, c: 0, a: r2(aa), fm: FUS_ALT ? 1 : 0, sk: 0 }); emit({ k: 'whirl', o: F ? F.a : p.i, x0: r2(D.x), y0: r2(D.y), x: r2(E.x), y: r2(E.y), z: r2(D.z), t: BAL.fWhirlT }); noiseAt(E.x, E.y, 6, D.z); }
function whirlStep(dt) { if (!W.whirl || !W.whirl.length) return;
  for (const w of W.whirl) { w.t -= dt; w.tk -= dt; const tick = w.tk <= 0; if (tick) w.tk = 0.5; const o = W.p[w.o], PR = w.pull || BAL.fWhirlPull, dm = w.dmg != null ? w.dmg : BAL.fWhirlDmg, sp = w.big ? 6 : 3.2; /* (round 43) the ultimates use bigger / stronger ones */
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - w.z) > 3) continue; const dx = w.x - z.x, dy = w.y - z.y, d = Math.hypot(dx, dy); if (d > PR + z.r || ZT[z.k].boss || ZT[z.k].kaiju) continue;
      if (d > 0.35) { const k = Math.min(d - 0.3, sp * dt * (1.2 - d / PR)); const nx = z.x + dx / d * k, ny = z.y + dy / d * k; if (inMap(Math.floor(nx), Math.floor(ny)) && standable(Math.floor(nx), Math.floor(ny), z.L, 'z')) { z.x = nx; z.y = ny; } }
      if (w.lift && !z.air && d < 2.2 && !ZT[z.k].fly) z.air = { t: 0, T: 1.0, h: 1.8, vx: 0, vy: 0 };
      z.stun = Math.max(z.stun || 0, 0.12); if (tick && dm) hurtZombie(z, dm, o, 0, 0, true); } }
  W.whirl = W.whirl.filter(w => w.t > 0); }
