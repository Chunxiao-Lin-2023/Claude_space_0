/* ================= people: rounded low-poly chibi characters =================
   Built from frusta (F) and sphere slices (SPH) so heads, bodies and limbs read round.
   Parts come back already in painter's order for the current facing (no per-part sort). */
const F = (cx, cy, r0, r1, z0, z1, c, n, sy) => ({ t: 'f', cx, cy, r0: Math.max(.004, r0), r1: Math.max(.004, r1), z0, z1, c, n: n || 8, sy: sy || 1 });
// sphere (or flattened ellipsoid) as stacked frusta between latitudes a0..a1 (degrees)
function SPH(cx, cy, cz, r, c, o) {
  o = o || {}; const n = o.n || 10, sl = o.sl || 5, a0 = o.a0 == null ? -90 : o.a0, a1 = o.a1 == null ? 90 : o.a1, sy = o.sy || 1, sz = o.sz || 1, out = [];
  for (let k = 0; k < sl; k++) {
    const p = (a0 + (a1 - a0) * k / sl) * Math.PI / 180, q = (a0 + (a1 - a0) * (k + 1) / sl) * Math.PI / 180;
    out.push(F(cx, cy, r * Math.cos(p), r * Math.cos(q), cz + r * sz * Math.sin(p), cz + r * sz * Math.sin(q), c, n, sy));
  }
  return out;
}
function framePrism(p, tf) {
  if (p.t !== 'f') return partPrism(p, tf);
  const pts = [], pts2 = [];
  for (let i = 0; i < p.n; i++) { const a = (i + .5) / p.n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a) * p.sy; pts.push(tf(p.cx + ca * p.r0, p.cy + sa * p.r0)); pts2.push(tf(p.cx + ca * p.r1, p.cy + sa * p.r1)); }
  return { pts, pts2, z0: p.z0, z1: p.z1, c: p.c, noTop: p.noTop };
}

const SKIN = '#f3cba5', SKIN_D = '#e0a98a';
const PEOPLE = {
  // the hider: a kid in a teal hoodie and shorts
  hide: {
    shoe: '#f4f2ec', sole: '#8b939c', legLow: SKIN, legUp: '#e3c48e', hip: '#e3c48e', body: '#26b0a4', bodyD: '#1d8d84', arm: '#26b0a4', hair: '#6b3f22',
    extra(L, bob) {   // hood, pocket, drawstrings
      L.backLow.push(F(0, -.11, .14, .11, .7 + bob, .86 + bob, '#1d8d84', 8, .55));
      L.bodyFront.push(B(-.09, .115, .09, .145, .5 + bob, .6 + bob, '#1d8d84'), B(-.05, .13, -.035, .155, .62 + bob, .72 + bob, '#f4f2ec'), B(.035, .13, .05, .155, .62 + bob, .72 + bob, '#f4f2ec'));
    },
    hairdo(L, hz) {
      L.cap.push(...SPH(0, -.01, hz, .218, '#6b3f22', { a0: 24, a1: 90, sl: 3, n: 12 }));
      L.backHigh.push(F(0, -.07, .2, .19, hz - .12, hz + .06, '#6b3f22', 12, .78), ...SPH(-.04, -.2, hz + .02, .075, '#6b3f22', { sl: 3, n: 7 }));   // ponytail bun
      L.face.push(B(-.16, .12, -.01, .19, hz + .08, hz + .14, '#6b3f22'), B(-.01, .13, .14, .19, hz + .1, hz + .15, '#6b3f22'));
    },
    hat() { }
  },
  // the seeker: a little detective in a trench coat, deerstalker and magnifier
  seek: {
    shoe: '#5a3a24', sole: '#2a1c12', legLow: '#3a3f4f', legUp: '#3a3f4f', hip: '#b8864f', body: '#c08c52', bodyD: '#8e6236', arm: '#c08c52', hair: '#2e2520',
    extra(L, bob) {
      L.body.unshift(F(0, 0, .215, .175, .28 + bob, .5 + bob, '#c08c52', 12, .82));          // coat skirt
      L.bodyFront.push(Object.assign(F(0, 0, .19, .185, .5 + bob, .545 + bob, '#5a3a22', 12, .8), { noTop: 1 }), B(-.03, .15, .03, .17, .505 + bob, .54 + bob, '#d8b35a'),
        B(-.07, .135, -.045, .155, .62 + bob, .645 + bob, '#5a3a22'), B(.045, .135, .07, .155, .62 + bob, .645 + bob, '#5a3a22'), B(-.07, .13, -.045, .15, .7 + bob, .725 + bob, '#5a3a22'), B(.045, .13, .07, .15, .7 + bob, .725 + bob, '#5a3a22'));
      L.neck.push(F(0, 0, .15, .12, .78 + bob, .86 + bob, '#c8423a', 10, .85));              // scarf
    },
    hairdo(L, hz) {
      L.face.push(B(-.07, .19, -.015, .215, hz - .065, hz - .045, '#3a2a20'), B(.015, .19, .07, .215, hz - .065, hz - .045, '#3a2a20'));   // moustache
    },
    hat(L, hz) {     // deerstalker
      L.cap.push(...SPH(0, 0, hz + .01, .225, '#8a6a46', { a0: 10, a1: 90, sl: 3, n: 12 }), F(0, 0, .02, .02, hz + .23, hz + .26, '#5a4430', 6));
      L.face.unshift(F(0, .17, .1, .06, hz + .03, hz + .07, '#7a5c3c', 8, .9)); L.backHigh.push(B(-.13, -.235, .13, -.165, hz - .1, hz + .07, '#7a5c3c'), F(0, -.17, .1, .06, hz + .03, hz + .07, '#7a5c3c', 8, .9));
      L.cap.push(B(-.215, -.03, -.2, .05, hz - .07, hz + .06, '#7a5c3c'), B(.2, -.03, .215, .05, hz - .07, hz + .06, '#7a5c3c'));   // ear flaps
    },
    tool(arm, sw, bob) {      // magnifier in the right hand
      const y = .1 + sw;
      arm.push(F(.27, y, .018, .018, .44 + bob, .58 + bob, '#5a3a22', 6), ...SPH(.27, y + .02, .7 + bob, .1, '#c9a24a', { sy: .22, sl: 4, n: 12 }), ...SPH(.27, y + .045, .7 + bob, .078, '#d6eef8', { sy: .12, sl: 4, n: 12 }));
    }
  }
};
function humanPrims(p, look, t, idle) {
  const a = p.d, co = Math.cos(a), si = Math.sin(a), tf = (px, py) => [p.x + px * co - py * si, p.y + px * si + py * co];
  const ph = t * 10.5, mv = p.mv ? 1 : 0, sw = mv * Math.sin(ph) * .12, bob = mv ? Math.abs(Math.cos(ph)) * .03 : Math.sin(t * 2.2) * .006;
  const L = { legs: [[], []], arms: [[], []], backLow: [], body: [], bodyFront: [], neck: [], backHigh: [], head: [], cap: [], face: [] };
  // legs + shoes
  for (const s of [-1, 1]) {
    const o = s * sw, leg = L.legs[s < 0 ? 0 : 1], lift = mv ? Math.max(0, Math.sin(ph * s + (s < 0 ? 0 : Math.PI))) * .04 : 0;
    leg.push(B(s * .08 - .055, o - .07, s * .08 + .055, o + .12, lift, .035 + lift, look.sole), B(s * .08 - .052, o - .065, s * .08 + .052, o + .115, .035 + lift, .085 + lift, look.shoe));
    leg.push(F(s * .08, o * .5, .056, .062, .08 + lift, .26, look.legLow, 7), F(s * .08, o * .25, .064, .07, .26, .4 + bob, look.legUp, 7));
  }
  L.body.push(F(0, 0, .165, .18, .36 + bob, .48 + bob, look.hip, 12, .8), F(0, 0, .185, .15, .48 + bob, .8 + bob, look.body, 12, .8));
  L.neck.push(F(0, 0, .055, .055, .78 + bob, .86 + bob, SKIN_D, 8));
  // arms swing opposite to legs
  for (const s of [-1, 1]) {
    const o = -s * sw * .9, arm = L.arms[s < 0 ? 0 : 1];
    arm.push(...SPH(s * .2, o * .2, .755 + bob, .068, look.arm, { sl: 3, n: 8 }), F(s * .225, o * .6, .055, .05, .53 + bob, .76 + bob, look.arm, 8), ...SPH(s * .235, o, .5 + bob, .052, SKIN, { sl: 3, n: 8 }));
    if (s > 0 && look.tool) look.tool(arm, o, bob);
  }
  const hz = 1.02 + bob;
  L.head.push(...SPH(0, 0, hz, .2, SKIN, { sl: 6, n: 12, sz: .96 }));
  // face: eyes with highlights, blush, mouth
  for (const s of [-1, 1]) {
    L.face.push(B(s * .075 - .028, .175, s * .075 + .028, .2, hz - .03, hz + .04, '#2a2028'), B(s * .075 - .014, .2, s * .075 + .002, .203, hz + .012, hz + .03, '#ffffff'), B(s * .125 - .025, .15, s * .125 + .025, .18, hz - .07, hz - .05, '#f09a8c'));
  }
  L.face.push(B(-.022, .185, .022, .2, hz - .09, hz - .075, '#9a4a42'));
  look.extra(L, bob); look.hairdo(L, hz); look.hat(L, hz);
  // painter's order depends on whether the front faces the camera
  const fx = -si, fy = co, front = fx * SY + fy * CY > -0.12;
  const depth = part => { const q = part.t === 'b' ? [(part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2] : [part.cx, part.cy]; const [wx, wy] = tf(q[0], q[1]); return rotY(wx, wy); };
  const legs = L.legs.slice().sort((A, Bq) => depth(A[2]) - depth(Bq[2])), arms = L.arms.slice().sort((A, Bq) => depth(A[1]) - depth(Bq[1]));
  const seq = front
    ? [...legs[0], ...legs[1], ...arms[0], ...L.backLow, ...L.body, ...L.bodyFront, ...L.neck, ...arms[1], ...L.backHigh, ...L.head, ...L.cap, ...L.face]
    : [...legs[0], ...legs[1], ...arms[0], ...L.bodyFront, ...L.body, ...L.neck, ...L.backLow, ...arms[1], ...L.head, ...L.cap, ...L.backHigh];
  return seq.map(q => framePrism(q, tf));
}
