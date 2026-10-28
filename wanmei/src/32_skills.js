/* ================= 宝术 / skills ================= */
const SK = {};
function aimAt(e, tgt, range) { if (tgt && tgt.alive && edist(e, tgt) < range * 1.4) { faceTo(e, tgt.x, tgt.z); return tgt; } if (e === W.P[W.me] && INP.aimW && W.t - INP.aimW[2] < 1.5) faceTo(e, INP.aimW[0], INP.aimW[1]); return null; }
function IS_TOUCH_AIM() { return false; }
function rankOf(id) { return PARTY.skills[id] || 1; }
/* ---- 小不点 ---- */
SK.fist = { name: '拳脚', icon: '👊', cd: 0.36, mp: 0, range: 2.4, basic: true, desc: () => '纯肉身的力量。三段连击：左拳、右拳、旋身一脚（第三下把敌人踢飞）。',
  cast(e, tgt) { aimAt(e, tgt, 3.5); const c = e.combo = ((e.comboT > 0 ? e.combo : -1) + 1) % 3; e.comboT = 0.9; const kind = c === 2 ? 'kick' : 'punch';
    act(e.A, kind, c === 2 ? 0.42 : 0.3, { side: c === 1 ? 1 : -1 }); e.lunge = c === 2 ? 5 : 3.5; e.lungeT = 0.1;
    setTimeout(() => { if (!e.alive) return; const n = meleeArc(e, 2.3 + (e.reachK || 0), 1.9, c === 2 ? 1.35 : 0.9, { kb: c === 2 ? 7 : 1.5, up: c === 2 ? 4 : 0, sk: 'fist' }); sfx(n ? 'punch' : 'whoosh'); }, c === 2 ? 170 : 110); } };
SK.shenli = { name: '神力·掷石', icon: '🪨', cd: 7, mp: 10, range: 16, unlock: 'sk_shenli', desc: r => `纯肉身神力，从地上掀起一块千斤巨石砸出去，落点 ${2.5 + r * 0.3} 米内的敌人受到 ${Math.round((1.6 + r * 0.35) * 100)}% 伤害并被震倒。`,
  cast(e, tgt, r) { const t = aimAt(e, tgt, 16); act(e.A, 'throw', 0.6); sfx('lift');
    const rock = rockMesh(0.55 + r * 0.05); rock.position.set(e.x, e.y + e.h * 1.15, e.z); rock.zoff = 0.05; R3.scene.add(rock); e.A.pose = 'lift'; const holdT = setInterval(() => { if (rock.parent) rock.position.set(e.x, e.y + e.h * 1.15, e.z); }, 16);
    setTimeout(() => { clearInterval(holdT); e.A.pose = null; rock.removeFromParent(); if (!e.alive) return; const [fx0, fz0] = fwd(e); const dist0 = t ? Math.min(16, edist(e, t)) : 11, T = 0.55, vy = (BAL.grav * 0.5 * T);
      shoot({ owner: e, x: e.x + fx0 * 0.5, y: e.y + e.h * 1.2, z: e.z + fz0 * 0.5, vx: fx0 * dist0 / T, vz: fz0 * dist0 / T, vy: vy * 0.9 + (t ? (t.y - e.y) / T : 0), grav: BAL.grav * 0.9, r: 0.7, vis: 'rock', mesh: rock, face: false, spin: 8, mul: 1.6 + r * 0.35, kb: 9, life: 3,
        onGround: p => { aoeAt(e, p.x, p.z, 2.5 + r * 0.3, 1.6 + r * 0.35, { kb: 8, up: 5 }); dust(p.x, terrH(p.x, p.z), p.z, 20); ringFX(p.x, terrH(p.x, p.z), p.z, 0xd8c8a0, 0.5, 3.5, 0.45); shake(0.25); sfx('boom'); },
        onHit: (p, t2) => { hurt(e, t2, 1.6 + r * 0.35, { kb: 9, up: 5 }); p.life = 0; aoeAt(e, p.x, p.z, 2.5, 1.0, { kb: 6 }); dust(p.x, p.y, p.z, 14); sfx('boom'); shake(0.2); } }); }, 320); } };
SK.yinyue = { name: '银月', icon: '🌙', cd: 3.5, mp: 12, range: 20, unlock: 'sk_yinyue', desc: r => `青鳞鹰一族的原始宝符。斩出一轮银月，穿透 ${2 + r} 个敌人，造成 ${Math.round((1.7 + r * 0.3) * 100)}% 伤害。${r >= 3 ? '三阶：同时斩出两轮。' : ''}`,
  cast(e, tgt, r) { aimAt(e, tgt, 20); act(e.A, 'cast', 0.45); sfx('moon');
    const fire = (off, delay) => setTimeout(() => { if (!e.alive) return; const a = e.rot + off, m = crescentMesh(0xbfe8ff, 0.7 + r * 0.08); m.scale.setScalar(1); shoot({ owner: e, x: e.x + Math.sin(a) * 0.6, y: e.y + e.h * 0.6, z: e.z + Math.cos(a) * 0.6, vx: Math.sin(a) * 26, vy: 0, vz: Math.cos(a) * 26, r: 0.9 + r * 0.1, vis: 'moon', mesh: m, pierce: 2 + r, mul: 1.7 + r * 0.3, kb: 3, life: 0.8, noGround: true, col: 0xbfe8ff, trail: 0x9ad8ff, sk: 'yinyue' }); }, delay);
    fire(0, 140); if (r >= 3) fire(0.12, 260); } };
SK.chique = { name: '骨文·赤雀', icon: '🐦', cd: 6, mp: 15, range: 22, unlock: 'sk_chique', desc: r => `一指点出一只赤红的小雀儿，自动追向目标，点燃它，${4} 秒内共造成 ${Math.round((1.2 + r * 0.4) * 100 + 100)}% 伤害。`,
  cast(e, tgt, r) { const t = aimAt(e, tgt, 22) || nearestFoe(e, 22); act(e.A, 'cast', 0.4); sfx('fire');
    setTimeout(() => { if (!e.alive) return; const [fx0, fz0] = fwd(e); const m = birdFX(0xff5a2a); shoot({ owner: e, x: e.x + fx0, y: e.y + e.h * 0.8, z: e.z + fz0, vx: fx0 * 14, vy: 3, vz: fz0 * 14, vis: 'bird', homing: t, turn: 5, r: 0.5, mesh: m, pitch: true, life: 2.5, noGround: true, trail: 0xff7a3a,
      onHit: (p, t2) => { hurt(e, t2, 1.0, { col: 0xff6a2a, snd: 'fire' }); addBuff(t2, { id: 'burn', d: 4, dot: e.atk * (0.3 + r * 0.1), src: e, name: '灼烧' }); burst(p.x, p.y, p.z, 0xff7a3a, 20, 5); } }); }, 120); } };
SK.shuangyue = { name: '双月护体', icon: '🌗', cd: 16, mp: 25, range: 0, unlock: 'sk_shuangyue', desc: r => `银月可悬于脑后、绕身旋转。两轮银月护体 ${5 + r} 秒：受到的伤害降低 25%，靠近的敌人被月刃切割。`,
  cast(e, tgt, r) { act(e.A, 'cast2', 0.5); sfx('moon'); addBuff(e, { id: 'twinmoon', d: 5 + r, dr: 0.25, name: '双月', tick: 0.35, onTick: () => aoeAt(e, e.x, e.z, 2.6, 0.35 + r * 0.06, { kb: 2 }) });
    const ms = [crescentMesh(0xcfeaff, 0.5), crescentMesh(0xcfeaff, 0.5)]; ms.forEach((m, i) => { m.zoffBase = i; fx(m, 5 + r, (f, k) => { const a = f.t * 6 + i * PI; m.position.set(e.x + Math.cos(a) * 1.6, e.y + e.h * 0.55, e.z + Math.sin(a) * 1.1); m.zoff = 0; m.rotation.y = -a + PI; if (!e.alive) f.t = f.life; }); }); } };
SK.moqin = { name: '魔禽', icon: '🦅', cd: 28, mp: 40, range: 22, unlock: 'sk_moqin', desc: r => `两轮银月对撞，炸出一声魔禽长啸，虚影合成一头恐怖的太古魔禽冲出，对前方一条直线上的敌人造成 ${Math.round((4 + r) * 100)}% 伤害。`,
  cast(e, tgt, r) { aimAt(e, tgt, 22); act(e.A, 'cast2', 0.9); sfx('moon'); const a = e.rot; e.castLock = 0.7;
    setTimeout(() => { if (!e.alive) return; sfx('roar2'); shake(0.35); const [fx0, fz0] = [Math.sin(a), Math.cos(a)]; const T = tele({ shape: 'line', x: e.x, z: e.z, ang: a, w: 4.5, len: 22, d: 0.01, col: 0x9ad8ff, team: 0, src: e, mul: 4 + r, kb: 10, up: 6 });
      const m = birdFX(0x9ad8ff, 4); m.position.set(e.x, e.y + 1.5, e.z); m.rotation.y = a; fx(m, 0.7, (f, k) => { m.position.set(e.x + fx0 * k * 24, e.y + 1.5 + Math.sin(k * PI) * 1.5, e.z + fz0 * k * 24); m.scale.setScalar(4 * (1 - k * 0.3)); m.material.opacity = 1 - k; }); burst(e.x, e.y + 1.5, e.z, 0xbfe8ff, 50, 9, 0.6); }, 550); } };
/* ---- partner: 绒灵 ---- */
SK.p_tackle = { name: '扑撞', icon: '💫', cd: 0.55, mp: 0, range: 2.2, basic: true, desc: () => '圆滚滚地一头撞过去。', cast(e, tgt) { aimAt(e, tgt, 3); act(e.A, e.R.kind === 'bird' ? 'peck' : 'pounce', 0.35); e.lunge = 6; e.lungeT = 0.12; setTimeout(() => { if (e.alive) { const n = meleeArc(e, 1.9, 2, 0.8, { kb: 2 }); sfx(n ? 'bonk' : 'whoosh'); } }, 120); } };
SK.p_orb = { name: '灵光弹', icon: '✨', cd: 2.2, mp: 8, range: 18, desc: () => '吐出一团会追人的灵光。', cast(e, tgt) { const t = aimAt(e, tgt, 18) || nearestFoe(e, 18); act(e.A, 'roar', 0.4); sfx('orb'); const [fx0, fz0] = fwd(e); shoot({ owner: e, x: e.x + fx0 * 0.6, y: e.y + e.h * 0.6, z: e.z + fz0 * 0.6, vx: fx0 * 16, vy: 1, vz: fz0 * 16, homing: t, turn: 6, r: 0.4, vis: 'orb', mesh: orbMesh(0x8ae0ff, 0.3), life: 2, noGround: true, mul: 1.4, trail: 0x8ae0ff, col: 0x8ae0ff }); } };
SK.p_shield = { name: '护主光罩', icon: '🛡️', cd: 12, mp: 20, range: 20, desc: () => '为气血最低的队友罩上一层灵光，吸收相当于其 30% 气血的伤害，持续 8 秒。', cast(e) { const t = W.P.filter(p => p && p.alive).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0] || e; act(e.A, 'roar', 0.5); sfx('shield'); addBuff(t, { id: 'lshield', d: 8, shield: t.hpMax * 0.3, name: '光罩' }); shieldFX(t, 0x8ae0ff, 8); } };
SK.p_sniff = { name: '嗅宝', icon: '👃', cd: 20, mp: 10, range: 0, desc: () => '耸耸鼻子，30 米内的宝物、药草和藏起来的东西会在小地图和视野里亮起来，持续 20 秒。', cast(e) { act(e.A, 'roar', 0.6); sfx('sniff'); W.sniffT = 20; ringFX(e.x, e.y, e.z, 0xffe08a, 1, 30, 1.2, 0.3); STORY.onSniff && STORY.onSniff(e); } };
/* ---- partner: 青鳞鹰 ---- */
SK.q_peck = { name: '啄击', icon: '🪶', cd: 0.42, mp: 0, range: 2.4, basic: true, desc: () => '弯钩黑喙连啄。', cast(e, tgt) { aimAt(e, tgt, 3); act(e.A, rnd() < 0.5 ? 'peck' : 'claw', 0.32); e.lunge = 5; e.lungeT = 0.1; setTimeout(() => { if (e.alive) { const n = meleeArc(e, 2.2 * (e.R.spec.size || 1), 1.8, 0.95, { kb: 1.5 }); sfx(n ? 'peck' : 'whoosh'); } }, 110); } };
SK.q_moon = { name: '青月', icon: '🌙', cd: 3, mp: 10, range: 18, desc: () => '母鹰那一族的青色月亮。吐出一轮青月，穿透敌人。', cast(e, tgt) { aimAt(e, tgt, 18); act(e.A, 'cast', 0.4); sfx('moon'); setTimeout(() => { if (!e.alive) return; const a = e.rot; shoot({ owner: e, x: e.x, y: e.y + e.h * 0.6, z: e.z, vx: Math.sin(a) * 24, vy: 0, vz: Math.cos(a) * 24, r: 0.8, vis: 'qmoon', mesh: crescentMesh(0x5ae8c8, 0.6), pierce: 2, mul: 1.5, kb: 2.5, life: 0.75, noGround: true, col: 0x5ae8c8, trail: 0x5ae8c8 }); }, 120); } };
SK.q_dive = { name: '俯冲', icon: '⚡', cd: 7, mp: 15, range: 14, desc: () => '像击穿云层一样扑向目标，落点周围的敌人被震飞。', cast(e, tgt) { const t = aimAt(e, tgt, 14) || nearestFoe(e, 14); const tx2 = t ? t.x : e.x + Math.sin(e.rot) * 9, tz2 = t ? t.z : e.z + Math.cos(e.rot) * 9; act(e.A, 'dive', 0.5); sfx('whoosh'); e.dash = { x0: e.x, z0: e.z, x1: tx2, z1: tz2, t: 0, d: 0.35, arc: 3, on: () => { aoeAt(e, e.x, e.z, 3, 1.8, { kb: 7, up: 4 }); ringFX(e.x, e.y, e.z, 0x5ae8c8, 0.5, 3.5, 0.4); dust(e.x, e.y, e.z, 14); sfx('boom'); shake(0.15); } }; } };
SK.q_scale = { name: '鳞甲', icon: '💠', cd: 15, mp: 20, range: 0, desc: () => '抖开青色金属鳞片护住队伍：6 秒内两人受到的伤害降低 25%，近身攻击你们的敌人被鳞片割伤。', cast(e) { act(e.A, 'cast', 0.5); sfx('shield'); for (const p of W.P) if (p && p.alive) { addBuff(p, { id: 'scale', d: 6, dr: 0.25, thorns: 0.3, name: '鳞甲' }); shieldFX(p, 0x5ae8c8, 6); } } };
SK.dodge = { name: '翻滚', icon: '💨', cd: BAL.dodgeCD, mp: 0, desc: () => '向移动方向翻滚，翻滚中无敌。', cast(e, tgt, r, dir) { const a = dir ?? e.rot; e.rot = a; e.dash = { x0: e.x, z0: e.z, x1: e.x + Math.sin(a) * 4.5, z1: e.z + Math.cos(a) * 4.5, t: 0, d: BAL.dodgeT }; e.iframe = BAL.dodgeIFrame; if (e.R.kind === 'human') act(e.A, 'roll', BAL.dodgeT + 0.05); else act(e.A, 'hit', 0.2); sfx('whoosh'); } };
const P1_BAR = ['fist', 'shenli', 'yinyue', 'chique', 'shuangyue', 'moqin'];
function partnerBar() { const f = PARTNER_FORMS[PARTY.form]; return f.skills; }
function shieldFX(t, col, d) { const c = rgbOf(hex(col)); fxDraw(d, { layer: 2, draw: (g, f, kk) => { f.zq = t.z + 0.02; if (!t.alive) f.t = f.life; const on = hasBuff(t, 'lshield') || hasBuff(t, 'scale') || kk < 0.05; if (!on) return; const K = k(), [sx, sy] = w2s(t.x, t.z, t.y - groundH(t.x, t.z) + t.h * 0.5), r = Math.max(t.h * 0.7, 0.8) * K * (1 + Math.sin(f.t * 6) * 0.03); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.1, sx, sy, r); gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.05)`); gr.addColorStop(0.8, `rgba(${c[0]},${c[1]},${c[2]},0.16)`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0.5)`); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill(); g.strokeStyle = `rgba(255,255,255,0.35)`; g.lineWidth = 1.5; g.beginPath(); g.arc(sx, sy, r * 0.8, PI * 1.1, PI * 1.45); g.stroke(); g.restore(); } }); }
function nearestFoe(e, range, fromX, fromZ) { let best = null, bd = range * range; for (const t of W.ents) { if (!isFoe(e, t)) continue; const d = d2(t.x, t.z, fromX ?? e.x, fromZ ?? e.z); if (d < bd) { bd = d; best = t; } } return best; }
/* ---------- casting ---------- */
function canCast(e, id) { const S = SK[id]; if (!S || !e.alive || e.stun > 0 || e.castLock > 0 || W.cine) return false; if (S.unlock && !PARTY.flags[S.unlock] && (e.type === 'player')) return false; if ((e.cds[id] || 0) > 0) return false; if (e.mp < S.mp) return false; return true; }
function castSkill(e, id, tgt, dir) {
  if (!canCast(e, id)) { if (e === W.P[W.me] && SK[id] && !SK[id].basic) { if (SK[id].unlock && !PARTY.flags[SK[id].unlock]) toast('尚未领悟'); else if ((e.cds[id] || 0) > 0) { } else if (e.mp < SK[id].mp) toast('符力不足'); } return false; }
  const S = SK[id];
  if (NETROLE === 'guest' && e === W.P[1]) { netSendCtl({ t: 'cast', id, rot: dir ?? e.rot, tgt: tgt ? tgt.id : 0, x: e.x, z: e.z }); }
  e.mp -= S.mp; e.cds[id] = S.cd * (1 - buffVal(e, 'cdr')); e.inCombat = W.t;
  if (NETROLE === 'guest' && e === W.P[1]) { cosmeticCast(e, id); return true; }
  S.cast(e, tgt, rankOf(id), dir); if (STORY.onCast) STORY.onCast(e, id);
  netEv({ k: 'cast', id: e.id, sk: id, rot: e.rot });
  return true;
}
function cosmeticCast(e, id) { const m = { fist: 'punch', p_tackle: 'pounce', q_peck: 'peck', p_orb: 'roar', p_shield: 'roar', p_sniff: 'roar', q_moon: 'cast', q_dive: 'dive', q_scale: 'cast', dodge: 'hit' }; if (id === 'dodge') { SK.dodge.cast(e, null, 1, e.rot); return; } act(e.A, m[id] || 'cast', 0.35); }
function tickBuffs(e, dt) {
  for (let i = e.buffs.length - 1; i >= 0; i--) { const b = e.buffs[i]; b.t -= dt;
    if (b.dot) { b.dk = (b.dk || 0) + dt; if (b.dk >= 0.5) { b.dk = 0; if (NETROLE !== 'guest') hurt(b.src, e, 0, { flat: Math.max(1, Math.round(b.dot * 0.5)), col: 0xff7a3a, snd: 'tick' }); puff(e.x, e.y + e.h * 0.6, e.z, 0xff6a2a, 3, 0.5); } }
    if (b.onTick) { b.tk = (b.tk || 0) + dt; if (b.tk >= b.tick) { b.tk = 0; if (NETROLE !== 'guest') b.onTick(); } }
    if (b.t <= 0 || (b.shield != null && b.shield <= 0)) e.buffs.splice(i, 1); }
}
