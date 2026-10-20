/* 德州扑克 — No-limit Texas Hold'em tournament (2–6 seats), side pots, best-5-of-7 evaluation, Monte-Carlo AI. */
const D = BX.draw, C = BX.C;
const BLINDS = [[10, 20], [15, 30], [25, 50], [50, 100], [75, 150], [100, 200], [150, 300], [200, 400], [300, 600], [400, 800], [500, 1000], [750, 1500], [1000, 2000], [1500, 3000], [2000, 4000], [3000, 6000]];
const HN = ['高牌', '一对', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺'];
const B5 = 759375;   // 15^5
const RK = c => c % 13, SU = c => (c / 13) | 0;
const toCard = c => { const r = RK(c) + 2; return {r: r === 14 ? 1 : r, s: SU(c)}; };
const CHIPC = [[500, '#5b3a86', '#f3e2c0'], [100, '#1b1510', '#e6c57d'], [25, '#1f6a48', '#fff3e3'], [5, '#b23a2b', '#fff3e3'], [1, '#efe7d2', '#2f5d8a']];

/* ---------- hand evaluation ---------- */
const rc = new Int8Array(13), sm = [0, 0, 0, 0], sc = [0, 0, 0, 0];
function strHigh(m) {   // m: 13-bit rank mask; returns high-card rank index (3..12, 3 = wheel 5-high) or -1
  const x = (m << 1) | ((m >> 12) & 1);
  for (let h = 13; h >= 4; h--) if (((x >> (h - 4)) & 31) === 31) return h - 1;
  return -1;
}
function evalN(cs, n) {
  rc.fill(0); sm[0] = sm[1] = sm[2] = sm[3] = 0; sc[0] = sc[1] = sc[2] = sc[3] = 0; let all = 0;
  for (let i = 0; i < n; i++) { const c = cs[i], r = c % 13, s = (c / 13) | 0; rc[r]++; sm[s] |= 1 << r; sc[s]++; all |= 1 << r; }
  let f = -1; for (let s = 0; s < 4; s++) if (sc[s] >= 5) f = s;
  if (f >= 0) { const h = strHigh(sm[f]); if (h >= 0) return 8 * B5 + h; }
  let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) {
    const k = rc[r];
    if (k === 4) q = r; else if (k === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; } else if (k === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; }
  }
  const kick = (ex, cnt) => { let v = 0, k = 0; for (let r = 12; r >= 0 && k < cnt; r--) if (rc[r] && ex.indexOf(r) < 0) { v = v * 15 + r; k++; } while (k++ < cnt) v *= 15; return v; };
  if (q >= 0) return 7 * B5 + q * 15 + kick([q], 1);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return 6 * B5 + t1 * 15 + Math.max(t2, p1);
  if (f >= 0) { let v = 0, k = 0; for (let r = 12; r >= 0 && k < 5; r--) if (sm[f] & (1 << r)) { v = v * 15 + r; k++; } return 5 * B5 + v; }
  const sh = strHigh(all); if (sh >= 0) return 4 * B5 + sh;
  if (t1 >= 0) return 3 * B5 + t1 * 225 + kick([t1], 2);
  if (p1 >= 0 && p2 >= 0) return 2 * B5 + p1 * 225 + p2 * 15 + kick([p1, p2], 1);
  if (p1 >= 0) return B5 + p1 * 3375 + kick([p1], 3);
  return kick([], 5);
}
const handName = v => { const c = Math.floor(v / B5); return c === 8 && v % B5 === 12 ? '皇家同花顺' : HN[c]; };
function best5(seven) {
  let bv = -1, bc = null; const t = [0, 0, 0, 0, 0];
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) {
    let k = 0; for (let i = 0; i < 7; i++) if (i !== a && i !== b) t[k++] = seven[i];
    const v = evalN(t, 5); if (v > bv) { bv = v; bc = t.slice(); }
  }
  return {v: evalN(seven, 7), cards: bc};
}
/* rough preflop strength 0..1 (used for opponent ranges at 高级) */
function pfStrength(a, b) {
  let r1 = RK(a), r2 = RK(b); if (r2 > r1) [r1, r2] = [r2, r1];
  if (r1 === r2) return .5 + r1 / 24;
  return (r1 + r2) / 24 * .8 + (SU(a) === SU(b) ? .06 : 0) + (r1 - r2 <= 1 ? .04 : r1 - r2 === 2 ? .02 : 0);
}

function chipStack(g, x, y, amt, r) {
  if (!amt) return;
  const piles = []; let left = amt;
  for (const [v, a, b] of CHIPC) { const k = Math.floor(left / v); if (k) { piles.push([a, b, Math.min(k, 6)]); left -= k * v; } }
  const ps = piles.slice(0, 3), gap = r * 1.9, x0 = x - (ps.length - 1) * gap / 2;
  ps.forEach(([a, b, k], i) => {
    for (let j = 0; j < k; j++) {
      const cx = x0 + i * gap, cy = y - j * r * .28;
      g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, cx + 1, cy + 2, r); g.fill();
      g.fillStyle = a; D.circle(g, cx, cy, r); g.fill();
      g.setLineDash([r * .5, r * .42]); g.lineWidth = r * .26; g.strokeStyle = b; D.circle(g, cx, cy, r * .84); g.stroke(); g.setLineDash([]);
      g.fillStyle = D.shade(a, 12); D.circle(g, cx, cy, r * .52); g.fill();
    }
  });
}

BX.register({
  id: 'holdem', title: '德州扑克', cat: 'cards', order: 5, sub: '无限注德州锦标赛',
  desc: '两张底牌配五张公共牌，组成最好的五张牌型。无限注下注、边池、盲注递增，单挑或最多六人同桌，赢光所有筹码者胜。',
  kind: 'turn', seats: [2, 6], defSeats: 2, noFirst: true, hidden: true, aiDelay: 650,
  options: [
    {key: 'blind', label: '涨盲', choices: [[5, '每 5 手'], [10, '每 10 手'], [15, '每 15 手']], def: 10},
    {key: 'limit', label: '结束', choices: [[0, '淘汰到底'], [30, '限 30 手'], [60, '限 60 手']], def: 0},
  ],
  rules: `<p><b>无限注德州扑克</b>锦标赛。每人 1000 筹码，盲注从 10/20 起按设定手数递增。</p>
<p><b>座位：</b>庄家按钮每手顺时针移动一位。按钮左侧依次下小盲、大盲；<b>单挑时庄家下小盲</b>，翻牌前先行动、翻牌后后行动。</p>
<p><b>发牌与下注：</b>每人两张底牌（只有自己能看）。共四轮下注：翻牌前、翻牌（三张公共牌）、转牌（第四张）、河牌（第五张）。轮到你时可以<b>弃牌、让牌</b>（无人下注时）、<b>跟注、加注或全下</b>。</p>
<p><b>加注规则：</b>最小加注额等于本轮上一次下注/加注的增量（至少一个大盲）；不足最小加注的全下不重新开放加注。下注没有上限（无限注）。</p>
<p><b>边池：</b>有人全下而筹码不足时，超出部分组成边池，全下者只能赢取自己有份的底池。</p>
<p><b>摊牌：</b>用两张底牌与五张公共牌中任选五张组成最好的牌型，大者赢得底池，相同则平分。牌型从大到小：<b>同花顺 &gt; 四条 &gt; 葫芦 &gt; 同花 &gt; 顺子 &gt; 三条 &gt; 两对 &gt; 一对 &gt; 高牌</b>（A 可作 A-2-3-4-5 最小顺子）。</p>
<p><b>胜负：</b>筹码输光即出局，最后拥有全部筹码者获胜；若设定了手数上限，到达后筹码最多者获胜。</p>
<p>同屏对战时会提示交换设备，请勿偷看他人底牌。</p>`,
  icon(g, w, h) {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .7); gr.addColorStop(0, '#2f7a56'); gr.addColorStop(1, '#173d2b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7a2a1a'; g.lineWidth = 10; g.beginPath(); g.ellipse(w / 2, h / 2, w * .52, h * .56, 0, 0, Math.PI * 2); g.stroke();
    const cw = w * .15, ch = cw * 1.4;
    [[1, 0], [13, 0], [12, 0], [6, 1], [11, 0]].forEach(([r, s], i) => D.card(g, w * .12 + i * cw * 1.08, h * .3, cw, ch, {r, s}, {mini: true}));
    chipStack(g, w * .25, h * .86, 170, h * .07); chipStack(g, w * .72, h * .88, 625, h * .07);
    D.text(g, '全下', w * .5, h * .14, {size: h * .14, color: '#e6c57d', font: 'deco', weight: 400, shadow: true});
  },
  create(ctx) {
    const n = ctx.n, T = !!BX.test;
    const EVERY = T ? 2 : (ctx.opts.blind || 10), LIMIT = T ? 40 : (ctx.opts.limit || 0);
    const st = {n, chips: new Array(n).fill(1000), btn: ctx.rng.int(n), hno: 0, lvl: 0, sb: 10, bb: 20, ph: 'deal', street: 0,
      deck: [], dp: 0, board: [], hole: [], bet: [], tot: [], fold: [], allin: [], need: [], done: [], agg: [], act: [],
      cur: -1, curBet: 0, minR: 0, show: false, res: null, over: false, dealt: []};
    const inHand = s => st.dealt[s] && !st.fold[s];
    const canBet = s => inHand(s) && !st.allin[s];
    const nextFrom = (s, f) => { for (let k = 1; k <= n; k++) { const p = (s + k) % n; if (f(p)) return p; } return -1; };
    const potTotal = () => st.tot.reduce((a, b) => a + b, 0);
    function post(s, amt) { const a = Math.min(amt, st.chips[s]); st.chips[s] -= a; st.bet[s] += a; st.tot[s] += a; if (!st.chips[s]) st.allin[s] = true; return a; }
    function startHand() {
      const alive = BX.range(n).filter(s => st.chips[s] > 0);
      if (alive.length <= 1 || (LIMIT && st.hno >= LIMIT)) return finish();
      st.hno++; st.lvl = Math.floor((st.hno - 1) / EVERY);
      const L = st.lvl < BLINDS.length ? BLINDS[st.lvl] : (() => { const m = 2 ** (st.lvl - BLINDS.length + 1), b = BLINDS[BLINDS.length - 1]; return [b[0] * m, b[1] * m]; })();
      st.sb = L[0]; st.bb = L[1];
      st.btn = st.hno === 1 && st.chips[st.btn] > 0 ? st.btn : nextFrom(st.btn, s => st.chips[s] > 0);
      st.deck = ctx.rng.shuffle(BX.range(52)); st.dp = 0; st.board = []; st.street = 0; st.show = false; st.res = null;
      for (let s = 0; s < n; s++) { st.dealt[s] = st.chips[s] > 0; st.fold[s] = false; st.allin[s] = false; st.bet[s] = 0; st.tot[s] = 0; st.hole[s] = []; st.agg[s] = 0; st.act[s] = ''; st.need[s] = false; st.done[s] = false; }
      let p = st.btn; for (let r = 0; r < 2; r++) for (let k = 0; k < alive.length; k++) { p = nextFrom(p, q => st.dealt[q]); st.hole[p].push(st.deck[st.dp++]); }
      const sbS = alive.length === 2 ? st.btn : nextFrom(st.btn, q => st.dealt[q]), bbS = nextFrom(sbS, q => st.dealt[q]);
      post(sbS, st.sb); post(bbS, st.bb); st.act[sbS] = '小盲'; st.act[bbS] = '大盲';
      st.curBet = st.bb; st.minR = st.bb; st.sbS = sbS; st.bbS = bbS;
      for (let s = 0; s < n; s++) st.need[s] = canBet(s);
      st.ph = 'bet'; st.cur = bbS; ctx.sfx('deal');
      nextActor();
    }
    function nextActor() {
      if (BX.range(n).filter(inHand).length === 1) return winByFold();
      // nobody left who could still act meaningfully
      const nx = nextFrom(st.cur, s => canBet(s) && (st.need[s] || st.bet[s] < st.curBet));
      if (nx < 0) return endStreet();
      st.cur = nx; st.ph = 'bet';
    }
    function endStreet() {
      for (let s = 0; s < n; s++) st.bet[s] = 0;
      st.cur = -1;
      if (BX.range(n).filter(canBet).length < 2 && BX.range(n).filter(inHand).length > 1) st.show = true;   // all-in: table the hands
      st.ph = st.street >= 3 ? 'show' : 'deal';
    }
    function dealStreet() {
      st.street++; st.dp++;   // burn
      const k = st.street === 1 ? 3 : 1; for (let i = 0; i < k; i++) st.board.push(st.deck[st.dp++]);
      st.curBet = 0; st.minR = st.bb;
      for (let s = 0; s < n; s++) { st.need[s] = canBet(s); st.done[s] = false; if (inHand(s) && !st.allin[s]) st.act[s] = ''; }
      ctx.sfx(k === 3 ? 'deal' : 'card');
      if (BX.range(n).filter(canBet).length < 2) { st.ph = st.street >= 3 ? 'show' : 'deal'; return; }
      st.cur = st.btn; st.ph = 'bet'; nextActor();
    }
    function award(pots) {
      st.res = {pots, hno: st.hno}; st.ph = 'res';
      for (const p of pots) { const share = Math.floor(p.amt / p.win.length); let odd = p.amt - share * p.win.length;
        for (const w of [...p.win].sort((a, b) => ((a - st.btn + n - 1) % n) - ((b - st.btn + n - 1) % n))) { st.chips[w] += share + (odd > 0 ? 1 : 0); odd--; } }
      for (let s = 0; s < n; s++) st.tot[s] = 0;
    }
    function winByFold() {
      const w = BX.range(n).find(inHand);
      for (let s = 0; s < n; s++) st.bet[s] = 0;
      award([{amt: potTotal(), win: [w], hand: ''}]); st.cur = -1;
    }
    function showdown() {
      st.show = true;
      const vals = {}; for (let s = 0; s < n; s++) if (inHand(s)) { const b = best5(st.hole[s].concat(st.board)); vals[s] = b; }
      const lv = [...new Set(BX.range(n).filter(s => st.tot[s] > 0 && inHand(s)).map(s => st.tot[s]))].sort((a, b) => a - b);
      const pots = []; let prev = 0;
      for (let i = 0; i < lv.length; i++) {
        const L = lv[i]; let amt = 0;
        for (let s = 0; s < n; s++) amt += Math.max(0, Math.min(st.tot[s], L) - prev);
        if (i === lv.length - 1) for (let s = 0; s < n; s++) amt += Math.max(0, st.tot[s] - L);   // dead money from folded players
        const el = BX.range(n).filter(s => inHand(s) && st.tot[s] >= L);
        const top = Math.max(...el.map(s => vals[s].v));
        const win = el.filter(s => vals[s].v === top);
        if (amt > 0) pots.push({amt, win, hand: el.length > 1 ? handName(top) : '', ret: el.length === 1});
        prev = L;
      }
      st.best = {}; for (const s in vals) st.best[s] = {v: vals[s].v, name: handName(vals[s].v), cards: vals[s].cards};
      award(pots); ctx.sfx('flip');
    }
    function finish() {
      st.over = true; st.ph = 'over'; st.cur = -1;
      const mx = Math.max(...st.chips), w = BX.range(n).filter(s => st.chips[s] === mx);
      ctx.end({winner: w, text: BX.range(n).map(s => ctx.name(s) + ' ' + st.chips[s]).join('　') + `（共 ${st.hno} 手）`});
    }
    function legal(s) {
      if (st.ph !== 'bet' || st.cur !== s || st.over) return null;
      const toCall = Math.min(st.curBet - st.bet[s], st.chips[s]), maxTo = st.bet[s] + st.chips[s];
      const canRaise = !st.done[s] && st.chips[s] > toCall && BX.range(n).some(p => p !== s && canBet(p));
      const minTo = Math.min(maxTo, st.curBet + st.minR);
      return {toCall, check: toCall === 0, canRaise, minTo, maxTo};
    }
    function doAct(a, s) {
      const L = legal(s);
      if (a.t === 'fold') { st.fold[s] = true; st.act[s] = '弃牌'; ctx.sfx('whoosh'); }
      else if (a.t === 'check' || (a.t === 'call' && L.toCall === 0)) { st.act[s] = '让牌'; ctx.sfx('tick'); }
      else if (a.t === 'call') { post(s, L.toCall); st.act[s] = st.allin[s] ? '全下' : '跟注'; ctx.sfx('chip'); }
      else if (a.t === 'raise') {
        const to = Math.max(L.minTo, Math.min(L.maxTo, Math.round(a.to)));
        const inc = to - st.curBet, full = inc >= st.minR;
        post(s, to - st.bet[s]);
        if (to > st.curBet) {
          if (full) { st.minR = inc; for (let p = 0; p < n; p++) st.done[p] = false; }
          for (let p = 0; p < n; p++) if (p !== s && canBet(p)) st.need[p] = true;
          st.act[s] = st.allin[s] ? '全下' : st.curBet === 0 ? '下注 ' + to : '加注到 ' + to;
          st.curBet = to; st.agg[s]++;
        } else st.act[s] = st.allin[s] ? '全下' : '跟注';
        ctx.sfx('chip');
      }
      st.need[s] = false; st.done[s] = true;
      nextActor();
    }
    startHand();

    /* ---------------- AI ---------------- */
    function equity(s, iters, ranged) {
      const known = new Set(st.hole[s].concat(st.board));
      const rest = BX.range(52).filter(c => !known.has(c));
      const opps = BX.range(n).filter(p => p !== s && inHand(p));
      const need = 5 - st.board.length, buf = new Array(7), ob = new Array(7);
      let win = 0;
      for (let it = 0; it < iters; it++) {
        let m = rest.length;
        const take = () => { const j = Math.floor(Math.random() * m); const c = rest[j]; rest[j] = rest[m - 1]; rest[m - 1] = c; m--; return c; };
        const oh = [];
        for (const p of opps) {
          let a = take(), b = take();
          if (ranged && st.agg[p] > 0) {
            const th = st.agg[p] >= 2 ? .62 : .46;
            for (let k = 0; k < 4 && pfStrength(a, b) < th && Math.random() < .85; k++) { m += 2; a = take(); b = take(); }
          }
          oh.push(a, b);
        }
        const bd = st.board.slice(); for (let k = 0; k < need; k++) bd.push(take());
        buf[0] = st.hole[s][0]; buf[1] = st.hole[s][1]; for (let k = 0; k < 5; k++) buf[2 + k] = bd[k];
        const mv = evalN(buf, 7); let best = 0, ties = 0, lost = false;
        for (let i = 0; i < opps.length; i++) {
          ob[0] = oh[2 * i]; ob[1] = oh[2 * i + 1]; for (let k = 0; k < 5; k++) ob[2 + k] = bd[k];
          const v = evalN(ob, 7); if (v > mv) { lost = true; break; } if (v === mv) ties++;
        }
        if (!lost) win += 1 / (ties + 1);
        void best;
      }
      return win / iters;
    }
    function aiDecide(s, level) {
      const L = legal(s); if (!L) return null;
      const rnd = Math.random, pot = potTotal(), toCall = L.toCall, bb = st.bb, stack = st.chips[s];
      const iters = T ? 120 : [0, 350, 1500, 2600][level];
      const opps = BX.range(n).filter(p => p !== s && inHand(p)).length;
      const eq = equity(s, iters, level >= 3);
      const odds = toCall / (pot + toCall);
      const raiseTo = frac => { const amt = st.curBet + Math.max(st.minR, Math.round((pot + toCall) * frac / bb) * bb); return {t: 'raise', to: Math.min(L.maxTo, Math.max(L.minTo, amt))}; };
      const passive = () => toCall === 0 ? {t: 'check'} : {t: 'fold'};
      const fair = 1 / (opps + 1);
      if (level === 1) {
        if (toCall === 0) return L.canRaise && eq > fair + .25 && rnd() < .5 ? raiseTo(.5) : {t: 'check'};
        if (L.canRaise && eq > fair + .35 && rnd() < .35) return raiseTo(.6);
        if (eq > odds * .55 || rnd() < .3 || toCall <= bb * 2) return {t: 'call'};
        return {t: 'fold'};
      }
      const pre = st.street === 0;
      const inPos = nextFrom(s, p => inHand(p) && !st.allin[p]) === -1 || BX.range(n).filter(p => inHand(p) && p !== s).every(p => ((p - st.btn + n) % n) < ((s - st.btn + n) % n));
      let e = eq;
      if (level === 3) {
        e += inPos ? .03 : -.02;
        // push / fold when short
        if (pre && stack + st.bet[s] <= bb * 10) {
          if (e > fair + .08 || (toCall === 0 && e > fair)) return L.canRaise ? {t: 'raise', to: L.maxTo} : {t: 'call'};
          return toCall <= bb / 2 && e > fair - .1 ? {t: 'call'} : passive();
        }
      }
      const strong = fair + (level === 3 ? .22 : .25), good = fair + .1;
      if (toCall === 0) {
        if (L.canRaise && e > strong) return raiseTo(.55 + rnd() * .3);
        if (L.canRaise && e > good && rnd() < .45) return raiseTo(.5);
        if (level === 3 && L.canRaise && inPos && !pre && rnd() < .2) return raiseTo(.5);         // positional bluff / stab
        if (level === 3 && L.canRaise && !pre && st.street < 3 && e > fair - .05 && e < good && rnd() < .25) return raiseTo(.6);  // semi-bluff
        return {t: 'check'};
      }
      const big = toCall > stack * .35;
      if (L.canRaise && e > strong + (big ? .1 : 0)) return rnd() < (level === 3 ? .8 : .65) ? raiseTo(.7 + rnd() * .3) : {t: 'call'};
      if (level === 3 && L.canRaise && !big && pre && inPos && e > fair && rnd() < .2) return raiseTo(.6);
      if (e >= odds + (big ? .08 : .03) * (level === 3 ? 1 : 1.2)) return {t: 'call'};
      if (level === 3 && toCall <= bb && pre && e > fair - .12) return {t: 'call'};
      return {t: 'fold'};
    }

    /* ---------------- UI ---------------- */
    const cv = ctx.canvas();
    const ui = ctx.ui();
    ui.append(h('style', {text: `.he-bar{gap:8px}.he-bar .bx-btn{min-width:84px;padding:10px 12px}
.he-rp{position:absolute;left:50%;transform:translateX(-50%);width:min(520px,calc(100% - 16px));display:flex;flex-direction:column;gap:8px}
.he-rp .row{display:flex;gap:6px;align-items:center}.he-rp .row .bx-btn{flex:1;min-width:0;padding:8px 4px;font-size:14px}
.he-rp input{flex:1;height:40px;accent-color:#c8a052}.he-rp b{min-width:70px;text-align:right;font-size:18px;color:#e6c57d}
@media (max-height:500px){.he-bar .bx-btn{min-height:42px;padding:8px 10px}.he-rp{gap:5px;padding:8px 10px}.he-rp .row .bx-btn{min-height:40px}}`}));
    const bar = h('div', {class: 'bx-bar he-bar'}), rp = h('div', {class: 'bx-panel he-rp'}); rp.hidden = true;
    ui.append(rp, bar);
    let sig = '', raiseOpen = false, rv = 0;
    const me = () => ctx.view;
    function refreshUI(force) {
      const s = me(), L = ctx.canAct(s) ? legal(s) : null;
      const key = JSON.stringify([L, raiseOpen, st.hno, st.ph, st.street]);
      if (key === sig && !force) return; sig = key;
      bar.innerHTML = ''; rp.innerHTML = '';
      if (!L) { raiseOpen = false; rp.hidden = true; return; }
      const B = (txt, cls, fn, dis) => h('button', {class: 'bx-btn ' + (cls || ''), text: txt, disabled: !!dis, on: {click: () => { ctx.sfx('click'); fn(); }}});
      bar.append(B('弃牌', 'ghost', () => { raiseOpen = false; ctx.act({t: 'fold'}, s); }, L.check && false));
      bar.append(L.check ? B('让牌', 'jade', () => { raiseOpen = false; ctx.act({t: 'check'}, s); }) : B((L.toCall >= st.chips[s] ? '全下 ' : '跟注 ') + L.toCall, 'jade', () => { raiseOpen = false; ctx.act({t: 'call'}, s); }));
      if (L.canRaise) {
        if (!raiseOpen) bar.append(B(L.minTo >= L.maxTo ? '全下 ' + L.maxTo : (st.curBet ? '加注' : '下注'), 'red', () => { if (L.minTo >= L.maxTo) ctx.act({t: 'raise', to: L.maxTo}, s); else { raiseOpen = true; rv = L.minTo; refreshUI(true); } }));
        else {
          bar.append(B('确认 ' + (rv >= L.maxTo ? '全下' : rv), 'red', () => { raiseOpen = false; ctx.act({t: 'raise', to: rv}, s); }));
          const pot = potTotal(), step = Math.max(1, Math.round(st.bb / 2));
          const lbl = h('b', {text: rv}), inp = h('input', {type: 'range', min: L.minTo, max: L.maxTo, step, value: rv});
          const setV = v => { rv = BX.clamp(Math.round(v), L.minTo, L.maxTo); if (rv > L.maxTo - step) rv = L.maxTo; inp.value = rv; lbl.textContent = rv >= L.maxTo ? '全下' : rv; bar.lastChild.textContent = '确认 ' + (rv >= L.maxTo ? '全下' : rv); };
          inp.addEventListener('input', () => setV(+inp.value));
          const q = (t, f) => B(t, 'ghost', () => setV(f()));
          const pr = f => st.curBet + L.toCall + Math.round((pot + L.toCall) * f);
          rp.append(h('div', {class: 'row'}, q('最小', () => L.minTo), q('½池', () => pr(.5)), q('⅔池', () => pr(2 / 3)), q('底池', () => pr(1)), q('全下', () => L.maxTo)),
            h('div', {class: 'row'}, inp, lbl));
          rp.append(h('div', {class: 'row'}, B('取消', 'ghost', () => { raiseOpen = false; refreshUI(true); })));
          setV(rv);
        }
      }
      rp.hidden = !raiseOpen;
      requestAnimationFrame(() => { const r = bar.getBoundingClientRect(), pr = ui.getBoundingClientRect(); rp.style.bottom = (pr.bottom - r.top + 8) + 'px'; });
    }
    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.chips[s] + (st.dealt[s] || st.chips[s] ? '' : ' 出局'));
      const s = me(), L = ctx.canAct(s) ? legal(s) : null, who = ctx.hotseat ? ctx.name(s) + '：' : '';
      const head = `第${st.hno}手 盲注 ${st.sb}/${st.bb} · `;
      let m;
      if (st.over) m = '比赛结束';
      else if (st.ph === 'res') m = resText();
      else if (L) m = who + (L.check ? '轮到你：让牌或下注' : '轮到你：需跟注 ' + L.toCall);
      else if (st.ph === 'bet') m = '等待 ' + ctx.name(st.cur) + '…';
      else m = '发牌中…';
      ctx.status(head + m);
      refreshUI();
    }
    function resText() {
      if (!st.res) return '';
      return st.res.pots.filter(p => !p.ret).map(p => p.win.map(w => ctx.name(w)).join('、') + (p.hand ? ' 以' + p.hand : '') + ' 赢得 ' + p.amt).join('；') || (st.res.pots[0] ? ctx.name(st.res.pots[0].win[0]) + ' 收回 ' + st.res.pots[0].amt : '');
    }

    /* ---------------- drawing ---------------- */
    const vis = new Map(); let visH = -1, wait = 0, flies = [], prevBets = [], resSeen = -1, glow = 0;
    function geo() {
      const W = cv.w, br = bar.getBoundingClientRect(), barH = Math.max(br.height, 50) + 14;
      const Ha = Math.max(220, cv.h - barH), wide = W / Ha > 1.5;
      const cw = BX.clamp(Math.min(W / 7.2, Ha * (wide ? .15 : .1)), 26, 78);
      return {W, Ha, wide, cw, ch: cw * 1.4, cx: W / 2, cy: Ha / 2 + (wide ? 0 : 0)};
    }
    function seatPos(s, G) {
      const k = (s - me() + n) % n;
      const plW = BX.clamp(G.W / (G.wide ? 6.5 : 3.6), 92, 140);
      let ang;
      if (n === 2) ang = k ? -Math.PI / 2 : Math.PI / 2;
      else ang = Math.PI / 2 + k * 2 * Math.PI / n;
      const mine = k === 0, scale = mine ? 1.05 : .72;
      const blockH = G.ch * scale * .7 + 36;
      const rx = G.W / 2 - plW / 2 - 6, ry = G.Ha / 2 - blockH / 2 - 6;
      let x = G.cx + rx * Math.cos(ang), y = G.cy + ry * Math.sin(ang);
      if (n > 2 && !mine && Math.abs(Math.cos(ang)) > .3) y = G.cy + ry * .78 * Math.sin(ang) - (Math.sin(ang) > 0.2 ? 0 : 0);
      return {x, y: y + blockH / 2 - 18, plW, mine, scale, ang, blockH};
    }
    function frame(dt) {
      const g = cv.g; cv.clear('#1e130a');
      const G = geo(), {W, Ha, cw, ch, cx, cy} = G;
      D.wood(g, 0, 0, W, cv.h, {base: '#3e2414', dark: '#1a0e06', seed: 9, grain: .25});
      // table
      const tw = W - 8, th = Ha - 4;
      g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 18;
      D.rr(g, cx - tw / 2, cy - th / 2, tw, th, Math.min(tw, th) / 2);
      const rail = g.createLinearGradient(0, cy - th / 2, 0, cy + th / 2); rail.addColorStop(0, '#7a2a1a'); rail.addColorStop(1, '#4a140a'); g.fillStyle = rail; g.fill(); g.restore();
      const ins = Math.max(10, Math.min(18, Math.min(tw, th) * .05));
      D.rr(g, cx - tw / 2 + ins, cy - th / 2 + ins, tw - ins * 2, th - ins * 2, (Math.min(tw, th) - ins * 2) / 2);
      g.save(); g.clip(); D.felt(g, cx - tw / 2, cy - th / 2, tw, th, {color: '#2a6a4b'}); g.restore();
      g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = 1.5;
      D.rr(g, cx - tw / 2 + ins + 7, cy - th / 2 + ins + 7, tw - ins * 2 - 14, th - ins * 2 - 14, (Math.min(tw, th) - ins * 2 - 14) / 2); g.stroke();
      // felt logo
      D.text(g, '百戏茶馆', cx, cy + ch * .5 + 34, {size: Math.max(12, cw * .3), color: 'rgba(230,197,125,.18)', font: 'deco', weight: 400});
      // board
      if (st.hno !== visH) { visH = st.hno; vis.clear(); wait = 0; prevBets = []; flies = []; }
      const deckP = {x: cx - cw / 2, y: cy - ch * 2.2};
      const bx0 = cx - (5 * cw + 4 * cw * .1) / 2, by = cy - ch / 2;
      const T = [];
      for (let i = 0; i < 5; i++) {
        const x = bx0 + i * cw * 1.1;
        g.strokeStyle = 'rgba(230,197,125,.25)'; g.lineWidth = 1; D.rr(g, x, by, cw, ch, cw * .09); g.stroke();
        if (st.board[i] != null) T.push({id: 'b' + st.board[i], c: st.board[i], x, y: by, w: cw, h: ch, face: true});
      }
      // pot
      const potAmt = potTotal() - st.bet.reduce((a, b) => a + (b || 0), 0) + (st.res ? 0 : 0);
      const side = G.wide && Ha < 420, bw = 5 * cw * 1.1 - cw * .1;
      const potX = side ? bx0 - 46 : cx, potY = side ? cy - 4 : by - Math.max(16, ch * .32);
      if (potAmt > 0 && st.ph !== 'res') {
        if (side) { chipStack(g, potX, potY, potAmt, Math.max(7, cw * .15)); D.text(g, '底池', potX, potY + 16, {size: 12, color: '#f3e2c0'}); D.text(g, String(potAmt), potX, potY + 31, {size: 13, color: '#ffd76a', weight: 800}); }
        else { chipStack(g, cx - 52, potY + 6, potAmt, Math.max(7, cw * .14)); D.text(g, '底池 ' + potAmt, cx + 10, potY, {size: Math.max(12, cw * .24), color: '#f3e2c0', weight: 700, align: 'left'}); }
      }
      if (side) { D.text(g, '盲注', bx0 + bw + 46, cy - 8, {size: 12, color: 'rgba(243,226,192,.6)'}); D.text(g, st.sb + '/' + st.bb, bx0 + bw + 46, cy + 9, {size: 12, color: 'rgba(243,226,192,.75)', weight: 700}); }
      else D.text(g, `盲注 ${st.sb}/${st.bb}`, cx, by + ch + Math.max(12, ch * .2), {size: Math.max(10, cw * .19), color: 'rgba(243,226,192,.6)'});
      // seats
      const SP = BX.range(n).map(s => seatPos(s, G));
      for (let s = 0; s < n; s++) {
        if (!st.dealt[s]) continue;
        const p = SP[s], w = cw * p.scale, hh = w * 1.4;
        const showFace = p.mine || (st.show && inHand(s));
        st.hole[s].forEach((c, j) => T.push({id: 'h' + c, c, s, x: p.x - w * (j ? -.06 : 1.02) , y: p.y - 18 - hh * .72, w, h: hh, face: showFace, rot: (j ? 1 : -1) * .06, fold: st.fold[s]}));
      }
      // tween cards
      wait = Math.max(0, wait - dt);
      for (const t of T) {
        let v = vis.get(t.id);
        if (!v) { v = {x: deckP.x, y: deckP.y, w: t.w * .7, wait: ctx.fast ? 0 : wait, snd: true}; wait += .09; vis.set(t.id, v); }
        if (v.wait > 0) { v.wait -= dt; continue; }
        if (v.snd) { v.snd = false; ctx.sfx('card'); }
        const k = Math.min(1, dt * 10); v.x += (t.x - v.x) * k; v.y += (t.y - v.y) * k; v.w += (t.w - v.w) * k;
      }
      const winCards = new Set(); if (st.ph === 'res' && st.best && st.res && st.res.pots.some(p => p.hand)) for (const p of st.res.pots) if (p.hand) for (const w of p.win) for (const c of st.best[w].cards) winCards.add(c);
      const drawC = t => {
        const v = vis.get(t.id); if (!v || v.wait > 0) return;
        const hh = v.w * 1.4;
        g.save(); g.translate(v.x + v.w / 2, v.y + hh / 2); if (t.rot) g.rotate(t.rot);
        if (t.fold) g.globalAlpha = .35;
        const lift = winCards.size && winCards.has(t.c) ? -hh * .1 : 0;
        D.card(g, -v.w / 2, -hh / 2 + lift, v.w, hh, t.face ? toCard(t.c) : null, {backText: '戏', mini: v.w < 34, sel: lift ? '#ffd76a' : false, dim: winCards.size > 0 && !winCards.has(t.c) && t.face});
        g.restore();
      };
      for (const t of T) if (t.id[0] === 'b') drawC(t);
      // seats: cards, plate, bets
      for (let s = 0; s < n; s++) {
        const p = SP[s];
        if (!st.dealt[s] && !st.chips[s]) { plate(g, p, s, '出局'); continue; }
        for (const t of T) if (t.s === s) drawC(t);
        plate(g, p, s);
        // dealer button
        if (s === st.btn) { const bxp = p.x + p.plW / 2 + 4, byp = p.y - 22; D.disc(g, bxp, byp, 11, '#f6efdc', {shadow: true}); D.text(g, '庄', bxp, byp + 1, {size: 12, color: '#7a2a1a', font: 'serif', weight: 900}); }
        // bet
        const side = p.x <= cx + 2 ? 1 : -1, bpx = p.x + side * (p.plW / 2 + 30), bpy = p.y - 8;
        p.bx = bpx; p.by = bpy;
        if (st.bet[s]) { chipStack(g, bpx, bpy + 4, st.bet[s], Math.max(7, cw * .13)); D.text(g, String(st.bet[s]), bpx, bpy + Math.max(14, cw * .3), {size: 12, color: '#fff3d6', weight: 700, stroke: 'rgba(0,0,0,.6)', strokeW: 3}); }
        // hand name at showdown
        if (st.show && st.best && st.best[s] && st.ph === 'res') {
          const won = st.res.pots.some(q => q.win.includes(s) && q.hand);
          const txt = st.best[s].name; g.font = '800 13px ' + BX.F.sans; const tw2 = g.measureText(txt).width + 16;
          g.fillStyle = won ? 'rgba(200,150,40,.95)' : 'rgba(30,20,10,.8)'; D.rr(g, p.x - tw2 / 2, p.y + 20, tw2, 20, 10); g.fill();
          D.text(g, txt, p.x, p.y + 30, {size: 13, color: '#fff8e6', weight: 800});
        }
      }
      // chips sliding into the pot / to winners
      for (let s = 0; s < n; s++) { if (prevBets[s] && !st.bet[s] && SP[s].bx != null) flies.push({x0: SP[s].bx, y0: SP[s].by, x1: potX, y1: potY, amt: prevBets[s], t: 0}); prevBets[s] = st.bet[s]; }
      if (st.res && resSeen !== st.res.hno + '/' + st.hno) {
        resSeen = st.res.hno + '/' + st.hno;
        for (const q of st.res.pots) for (const w of q.win) flies.push({x0: potX, y0: potY, x1: SP[w].x, y1: SP[w].y - 20, amt: Math.floor(q.amt / q.win.length), t: -.35});
        if (!ctx.fast) { const mine = st.res.pots.some(q => q.win.includes(me()) && !q.ret); ctx.after(350, () => ctx.sfx(mine ? 'coin' : 'chip')); }
        glow = 1;
      }
      flies = flies.filter(f => f.t < 1);
      for (const f of flies) { f.t += dt * 2.4; if (f.t < 0) { chipStack(g, f.x0, f.y0, f.amt, Math.max(7, cw * .13)); continue; } const k = BX.ease.inOut(Math.min(1, f.t)); chipStack(g, BX.lerp(f.x0, f.x1, k), BX.lerp(f.y0, f.y1, k), f.amt, Math.max(7, cw * .13)); }
      // result banner
      if (st.ph === 'res' || st.over) {
        const txt = st.over ? '比赛结束' : resText(); const fs = Math.max(13, Math.min(17, W / 30));
        g.font = '700 ' + fs + 'px ' + BX.F.sans; const mw = Math.min(W - 20, g.measureText(txt).width + 28), my = side ? by + ch + fs + 4 : by + ch + Math.max(30, ch * .55);
        g.fillStyle = 'rgba(20,12,6,.78)'; D.rr(g, cx - mw / 2, my - fs, mw, fs * 2, fs); g.fill();
        D.text(g, txt, cx, my, {size: fs, color: '#ffe3a0', maxW: mw - 16});
      }
      glow = Math.max(0, glow - dt);
      refreshUI();
    }
    function plate(g, p, s, extra) {
      const turn = st.cur === s && st.ph === 'bet', w = p.plW, hh = 36, x = p.x - w / 2, y = p.y - 18;
      g.save();
      if (turn) { g.shadowColor = '#ffd76a'; g.shadowBlur = 14; }
      g.fillStyle = turn ? '#3a2410' : 'rgba(18,10,4,.86)'; D.rr(g, x, y, w, hh, 10); g.fill(); g.restore();
      g.strokeStyle = turn ? '#ffd76a' : D.alpha(ctx.color(s), .9); g.lineWidth = turn ? 2.5 : 1.5; D.rr(g, x, y, w, hh, 10); g.stroke();
      const nm = ctx.name(s) + (ctx.isLocal(s) && !ctx.hotseat ? '（你）' : '');
      D.text(g, nm, p.x, y + 11, {size: 12, color: st.fold[s] || extra ? 'rgba(243,226,192,.5)' : '#f3e2c0', maxW: w - 10});
      const a = extra || (st.act[s] && st.ph !== 'res' ? st.act[s] : '');
      D.text(g, String(st.chips[s]), p.x - (a ? w * .2 : 0), y + 26, {size: 13, color: '#ffd76a', weight: 800});
      if (a) D.text(g, a, p.x + w * .22, y + 26, {size: 11, color: a === '弃牌' || a === '出局' ? '#c98' : a === '全下' ? '#ff8a6a' : '#cfe8d8', weight: 700, maxW: w * .5});
    }

    return {
      st,
      toMove: () => st.ph === 'bet' && !st.over ? st.cur : null,
      valid(a, by) {
        const L = legal(by); if (!L) return false;
        if (a.t === 'fold' || a.t === 'call') return true;
        if (a.t === 'check') return L.check;
        if (a.t === 'raise') return L.canRaise && Number.isFinite(a.to) && a.to >= L.minTo && a.to <= L.maxTo;
        return false;
      },
      sysMove() {
        if (st.over) return null;
        if (st.ph === 'deal') return {a: {t: 'deal'}, delay: st.show ? 1100 : 650};
        if (st.ph === 'show') return {a: {t: 'show'}, delay: 700};
        if (st.ph === 'res') return {a: {t: 'next'}, delay: st.best && st.show ? 3600 : 2000};
        return null;
      },
      apply(a, by) {
        if (by === -1) {
          if (a.t === 'deal') dealStreet();
          else if (a.t === 'show') showdown();
          else if (a.t === 'next') { st.best = null; startHand(); }
        } else doAct(a, by);
        status();
      },
      aiMove(s, level) {
        const a = aiDecide(s, level); if (!a) return null;
        const L = legal(s);
        if (a.t === 'raise' && !L.canRaise) return {t: L.check ? 'check' : 'call'};
        if (a.t === 'check' && !L.check) return {t: 'call'};
        return a;
      },
      onTurn: status,
      onView() { sig = ''; raiseOpen = false; status(); },
      key(e) {
        const s = me(); if (!ctx.canAct(s)) return; const L = legal(s); if (!L) return;
        if (e.code === 'KeyF') ctx.act({t: 'fold'}, s);
        else if (e.code === 'KeyC' || e.code === 'Space') ctx.act({t: L.check ? 'check' : 'call'}, s);
      },
      frame,
    };
  },
});
