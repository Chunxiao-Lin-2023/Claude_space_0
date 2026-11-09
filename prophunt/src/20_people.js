/* ================= people: rounded low-poly chibi characters =================
   Built from frusta (F) and sphere slices (SPH) so heads, bodies and limbs read round.
   Parts come back already in painter's order for the current facing (no per-part sort). */
const F = (cx, cy, r0, r1, z0, z1, c, n, sy, sx) => ({ t: 'f', cx, cy, r0: Math.max(.004, r0), r1: Math.max(.004, r1), z0, z1, c, n: n || 8, sy: sy || 1, sx: sx || 1 });
// sphere (or flattened ellipsoid) as stacked frusta between latitudes a0..a1 (degrees)
function SPH(cx, cy, cz, r, c, o) {
  o = o || {}; const n = o.n || 10, sl = o.sl || 5, a0 = o.a0 == null ? -90 : o.a0, a1 = o.a1 == null ? 90 : o.a1, sy = o.sy || 1, sx = o.sx || 1, sz = o.sz || 1, out = [];
  for (let k = 0; k < sl; k++) {
    const p = (a0 + (a1 - a0) * k / sl) * Math.PI / 180, q = (a0 + (a1 - a0) * (k + 1) / sl) * Math.PI / 180;
    out.push(F(cx, cy, r * Math.cos(p), r * Math.cos(q), cz + r * sz * Math.sin(p), cz + r * sz * Math.sin(q), c, n, sy, sx));
  }
  return out;
}
function framePrism(p, tf) {
  if (p.t !== 'f') return partPrism(p, tf);
  const pts = [], pts2 = [];
  for (let i = 0; i < p.n; i++) { const a = (i + .5) / p.n * Math.PI * 2 + (p.rot || 0), ca = Math.cos(a) * p.sx, sa = Math.sin(a) * p.sy; pts.push(tf(p.cx + ca * p.r0, p.cy + sa * p.r0)); pts2.push(tf(p.cx + ca * p.r1, p.cy + sa * p.r1)); }
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

/* ---------- per-scene outfits ---------- */
const eyesGlasses = (L, hz, c) => { for (const s of [-1, 1]) L.face.push(B(s * .075 - .05, .2, s * .075 + .05, .21, hz + .045, hz + .06, c), B(s * .075 - .05, .2, s * .075 + .05, .21, hz - .05, hz - .035, c), B(s * .125 - .005, .19, s * .125 + .01, .21, hz - .05, hz + .06, c)); L.face.push(B(-.025, .2, .025, .21, hz + .01, hz + .025, c)); };
const shortHair = (L, hz, col, bangs) => { L.cap.push(...SPH(0, -.01, hz, .216, col, { a0: 22, a1: 90, sl: 3, n: 12 })); L.backHigh.push(F(0, -.07, .2, .19, hz - .1, hz + .05, col, 12, .78)); if (bangs) L.face.push(B(-.15, .13, .15, .195, hz + .08, hz + .14, col)); };
PEOPLE.house = { hide: PEOPLE.hide, seek: PEOPLE.seek };
PEOPLE.school = {
  hide: { shoe: '#f4f2ec', sole: '#8b939c', legLow: SKIN, legUp: '#2f4a7a', hip: '#2f4a7a', body: '#f6f4ee', arm: '#f6f4ee',
    extra(L, bob) { L.neck.push(F(0, .02, .13, .08, .78 + bob, .84 + bob, '#d8342a', 3, .8)); L.bodyFront.push(B(-.03, .13, .03, .16, .62 + bob, .78 + bob, '#d8342a'), B(-.01, .14, .01, .155, .52 + bob, .6 + bob, '#d8d4cc'));
      L.backLow.push(B(-.15, -.27, .15, -.12, .44 + bob, .8 + bob, '#3f8ad8'), B(-.12, -.29, .12, -.26, .5 + bob, .64 + bob, '#f2c94a')); },
    hairdo(L, hz) { shortHair(L, hz, '#2a2220', 1); }, hat() { } },
  seek: { shoe: '#3a2a20', sole: '#1a1410', legLow: '#4a4f58', legUp: '#4a4f58', hip: '#4a4f58', body: '#8a6aa0', arm: '#8a6aa0',
    extra(L, bob) { L.neck.push(F(0, 0, .13, .11, .78 + bob, .84 + bob, '#f6f4ee', 10, .85)); for (let i = 0; i < 3; i++) L.bodyFront.push(B(-.015, .135, .015, .155, .56 + i * .08 + bob, .59 + i * .08 + bob, '#f2e6c0')); },
    hairdo(L, hz) { shortHair(L, hz, '#4a3020'); L.cap.push(...SPH(0, -.12, hz + .17, .1, '#4a3020', { sl: 3, n: 8 })); eyesGlasses(L, hz, '#2a2028'); },
    hat() { }, tool(arm, sw, bob) { arm.push(B(.2, .02 + sw, .34, .2 + sw, .5 + bob, .54 + bob, '#3f6fc8'), B(.21, .03 + sw, .33, .19 + sw, .54 + bob, .55 + bob, '#f6f4ee')); } }
};
PEOPLE.restaurant = {
  hide: { shoe: '#2a2d33', sole: '#111', legLow: '#3a3f4f', legUp: '#3a3f4f', hip: '#3a3f4f', body: '#e8a24a', arm: '#e8a24a',
    extra(L, bob) { L.bodyFront.push(B(-.15, .12, .15, .16, .4 + bob, .78 + bob, '#f6f4ee'), B(-.1, .155, .1, .17, .5 + bob, .6 + bob, '#e0dcd2')); L.backLow.push(B(-.17, -.17, .17, -.13, .56 + bob, .6 + bob, '#f6f4ee')); },
    hairdo(L, hz) { L.backHigh.push(F(0, -.07, .2, .19, hz - .1, hz + .04, '#3a2a20', 12, .78)); },
    hat(L, hz) { L.cap.push(...SPH(0, -.01, hz + .01, .222, '#d8342a', { a0: 18, a1: 90, sl: 3, n: 12 })); L.backHigh.push(...SPH(0, -.22, hz + .06, .06, '#d8342a', { sl: 3, n: 7 }), B(-.02, -.28, .06, -.22, hz - .08, hz + .04, '#d8342a')); L.face.push(B(-.17, .14, .17, .2, hz + .07, hz + .1, '#b82a22')); } },
  seek: { shoe: '#2a2d33', sole: '#111', legLow: '#3a3a3a', legUp: '#3a3a3a', hip: '#f6f6f2', body: '#f6f6f2', arm: '#f6f6f2',
    extra(L, bob) { L.body.unshift(F(0, 0, .2, .18, .32 + bob, .5 + bob, '#f6f6f2', 12, .82)); L.neck.push(F(0, 0, .14, .12, .78 + bob, .85 + bob, '#d8342a', 10, .85)); for (let i = 0; i < 3; i++) L.bodyFront.push(B(-.08, .13, -.05, .155, .5 + i * .09 + bob, .53 + i * .09 + bob, '#2a2d33'), B(.05, .13, .08, .155, .5 + i * .09 + bob, .53 + i * .09 + bob, '#2a2d33')); },
    hairdo(L, hz) { L.face.push(B(-.08, .19, -.01, .215, hz - .07, hz - .045, '#3a2a20'), B(.01, .19, .08, .215, hz - .07, hz - .045, '#3a2a20')); },
    hat(L, hz) { L.cap.push(F(0, 0, .2, .2, hz + .1, hz + .2, '#f6f6f2', 12), F(0, 0, .2, .26, hz + .2, hz + .38, '#ffffff', 12), ...SPH(0, 0, hz + .38, .26, '#ffffff', { a0: 0, sl: 3, n: 12, sz: .55 })); },
    tool(arm, sw, bob) { arm.push(C(.27, .08 + sw, .016, .45 + bob, .78 + bob, '#b8c0c8', 5), ...SPH(.27, .1 + sw, .43 + bob, .07, '#c8d0d8', { a0: -90, a1: 0, sl: 2, n: 8 })); } }
};
PEOPLE.hospital = {
  hide: { shoe: '#5f9bd8', sole: '#e8e4dc', legLow: '#cfe3f5', legUp: '#cfe3f5', hip: '#cfe3f5', body: '#cfe3f5', arm: '#cfe3f5',
    extra(L, bob) { for (const x of [-.12, -.04, .04, .12]) L.bodyFront.push(B(x - .012, .135, x + .012, .15, .48 + bob, .8 + bob, '#5f9bd8')); L.bodyFront.push(B(-.015, .14, .015, .155, .5 + bob, .78 + bob, '#f6f4ee')); },
    hairdo(L, hz) { shortHair(L, hz, '#6b4a2a', 1); L.face.push(B(.1, .16, .16, .18, hz - .05, hz - .03, '#f2e2c8'), B(.12, .16, .14, .18, hz - .07, hz - .01, '#f2e2c8')); },
    hat(L, hz) { L.cap.push(F(0, 0, .222, .222, hz + .03, hz + .1, '#ffffff', 12, .98)); } },
  seek: { shoe: '#f4f2ec', sole: '#8b939c', legLow: '#4a8a8a', legUp: '#4a8a8a', hip: '#f8f8f6', body: '#f8f8f6', arm: '#f8f8f6',
    extra(L, bob) { L.body.unshift(F(0, 0, .21, .18, .28 + bob, .5 + bob, '#f8f8f6', 12, .82)); L.bodyFront.push(B(-.06, .13, .06, .155, .62 + bob, .8 + bob, '#4a8a8a'), B(-.11, .13, -.09, .155, .58 + bob, .78 + bob, '#2a2d33'), B(.09, .13, .11, .155, .58 + bob, .78 + bob, '#2a2d33'), ...SPH(.1, .155, .56 + bob, .03, '#9aa3ad', { sl: 2, n: 6 }), B(.08, .135, .15, .155, .66 + bob, .7 + bob, '#5f9bd8')); },
    hairdo(L, hz) { shortHair(L, hz, '#2a2220'); },
    hat(L, hz) { L.cap.push(F(0, 0, .222, .222, hz + .06, hz + .1, '#3a3d44', 12, .98)); L.face.push(...SPH(0, .21, hz + .1, .07, '#d8e0e8', { sy: .2, sl: 3, n: 10 })); },
    tool(arm, sw, bob) { arm.push(B(.2, .04 + sw, .34, .26 + sw, .5 + bob, .53 + bob, '#8a5a36'), B(.21, .06 + sw, .33, .24 + sw, .53 + bob, .54 + bob, '#ffffff')); } }
};
PEOPLE.wild = {
  hide: { shoe: '#6b4a32', sole: '#3a2a1a', legLow: SKIN, legUp: '#c8b080', hip: '#c8b080', body: '#6a8a4a', arm: '#6a8a4a',
    extra(L, bob) { L.neck.push(F(0, .02, .14, .09, .78 + bob, .84 + bob, '#f2c94a', 3, .8)); L.bodyFront.push(B(-.03, .13, .03, .16, .66 + bob, .78 + bob, '#f2c94a')); L.backLow.push(B(-.16, -.3, .16, -.12, .42 + bob, .84 + bob, '#e8762a'), B(-.17, -.32, .17, -.28, .7 + bob, .86 + bob, '#c45a1a')); },
    hairdo(L, hz) { L.backHigh.push(F(0, -.07, .2, .19, hz - .1, hz + .04, '#7a4a26', 12, .78)); },
    hat(L, hz) { L.cap.push(F(0, 0, .3, .23, hz + .05, hz + .09, '#c8b080', 12), F(0, 0, .2, .17, hz + .09, hz + .24, '#c8b080', 12)); } },
  seek: { shoe: '#4a3020', sole: '#2a1a10', legLow: '#4a4030', legUp: '#4a4030', hip: '#5a6a3a', body: '#5a6a3a', arm: '#5a6a3a',
    extra(L, bob) { L.bodyFront.push(B(.05, .13, .12, .155, .68 + bob, .76 + bob, '#e8c84a'), B(-.12, .13, -.04, .155, .66 + bob, .72 + bob, '#4a5a2a')); L.neck.push(F(0, 0, .13, .12, .78 + bob, .84 + bob, '#4a5a2a', 10, .85)); },
    hairdo(L, hz) { L.backHigh.push(F(0, -.07, .2, .19, hz - .1, hz + .03, '#2a2220', 12, .78)); L.face.push(B(-.06, .19, .06, .215, hz - .075, hz - .05, '#5a3a20')); },
    hat(L, hz) { L.cap.push(F(0, 0, .34, .34, hz + .06, hz + .09, '#a08050', 14), F(0, 0, .2, .13, hz + .09, hz + .3, '#a08050', 4), B(-.205, -.02, .205, .02, hz + .09, hz + .13, '#5a4430')); },
    tool(arm, sw, bob) { arm.push(C(.24, .12 + sw, .035, .52 + bob, .66 + bob, '#2a2d33', 6), C(.32, .12 + sw, .035, .52 + bob, .66 + bob, '#2a2d33', 6), B(.25, .1 + sw, .31, .14 + sw, .56 + bob, .62 + bob, '#2a2d33')); } }
};
PEOPLE.sea = {
  hide: { shoe: '#f2c94a', sole: '#e0a82a', fin: 1, legLow: SKIN, legUp: '#ff7a5a', hip: '#ff7a5a', body: '#ff7a5a', arm: SKIN, sleeve: '#ff7a5a',
    extra(L, bob) { L.bodyFront.push(B(-.1, .135, .1, .155, .6 + bob, .64 + bob, '#ffd04a')); },
    hairdo(L, hz) { shortHair(L, hz, '#8a5a2a'); L.face.push(B(-.17, .12, .17, .2, hz + .0, hz + .06, '#2a2d33'), B(-.13, .2, -.02, .215, hz - .03, hz + .07, '#8fe0f0'), B(.02, .2, .13, .215, hz - .03, hz + .07, '#8fe0f0')); },
    hat(L, hz) { L.cap.push(C(.2, -.05, .025, hz - .05, hz + .3, '#f2c94a', 5), B(.18, -.07, .22, .02, hz + .28, hz + .32, '#f2c94a')); } },
  seek: { shoe: '#2a2d33', sole: '#111', fin: 1, legLow: '#2a2d33', legUp: '#2a2d33', hip: '#2a2d33', body: '#2a2d33', arm: '#2a2d33', hand: '#3a3d44',
    extra(L, bob) { L.bodyFront.push(B(-.17, .12, -.12, .15, .5 + bob, .8 + bob, '#f2c94a'), B(.12, .12, .17, .15, .5 + bob, .8 + bob, '#f2c94a')); L.backLow.push(C(-.07, -.2, .07, .45 + bob, .92 + bob, '#f2c94a', 8), C(.07, -.2, .07, .45 + bob, .92 + bob, '#f2c94a', 8), C(0, -.2, .02, .92 + bob, 1.0 + bob, '#9aa3ad', 5)); },
    hairdo(L, hz) { L.cap.push(...SPH(0, -.01, hz, .218, '#2a2d33', { a0: -10, a1: 90, sl: 4, n: 12 })); L.face.push(B(-.15, .19, .15, .23, hz - .06, hz + .1, '#2a2d33'), B(-.13, .23, .13, .235, hz - .04, hz + .08, '#9ae0f8'), C(0, .22, .03, hz - .16, hz - .06, '#3a3d44', 6)); },
    hat() { }, tool(arm, sw, bob) { arm.push(C(.27, .1 + sw, .04, .44 + bob, .62 + bob, '#f2c94a', 7), C(.27, .1 + sw, .055, .62 + bob, .68 + bob, '#ffffff', 8)); } }
};
function humanPrims(p, look, t, idle) {
  const a = p.d, co = Math.cos(a), si = Math.sin(a), tf = (px, py) => [p.x + px * co - py * si, p.y + px * si + py * co];
  const ph = t * 10.5, mv = p.mv ? 1 : 0, sw = mv * Math.sin(ph) * .12, bob = mv ? Math.abs(Math.cos(ph)) * .03 : Math.sin(t * 2.2) * .006;
  const L = { legs: [[], []], arms: [[], []], backLow: [], body: [], bodyFront: [], neck: [], backHigh: [], head: [], cap: [], face: [] };
  // legs + shoes
  for (const s of [-1, 1]) {
    const o = s * sw, leg = L.legs[s < 0 ? 0 : 1], lift = mv ? Math.max(0, Math.sin(ph * s + (s < 0 ? 0 : Math.PI))) * .04 : 0;
    const fl = look.fin ? .34 : .12, fw = look.fin ? .075 : .055;
    leg.push(B(s * .08 - fw, o - .07, s * .08 + fw, o + fl, lift, .035 + lift, look.sole), B(s * .08 - .052, o - .065, s * .08 + .052, o + .115, .035 + lift, .085 + lift, look.shoe));
    leg.push(F(s * .08, o * .5, .056, .062, .08 + lift, .26, look.legLow, 7), F(s * .08, o * .25, .064, .07, .26, .4 + bob, look.legUp, 7));
  }
  L.body.push(F(0, 0, .165, .18, .36 + bob, .48 + bob, look.hip, 12, .8), F(0, 0, .185, .15, .48 + bob, .8 + bob, look.body, 12, .8));
  L.neck.push(F(0, 0, .055, .055, .78 + bob, .86 + bob, SKIN_D, 8));
  // arms swing opposite to legs
  for (const s of [-1, 1]) {
    const o = -s * sw * .9, arm = L.arms[s < 0 ? 0 : 1];
    arm.push(...SPH(s * .2, o * .2, .755 + bob, .068, look.sleeve || look.arm, { sl: 3, n: 8 }), F(s * .225, o * .6, .055, .05, .53 + bob, .76 + bob, look.arm, 8), ...SPH(s * .235, o, .5 + bob, .052, look.hand || SKIN, { sl: 3, n: 8 }));
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
