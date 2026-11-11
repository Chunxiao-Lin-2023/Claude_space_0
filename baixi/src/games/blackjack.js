/* 二十一点 — 1–3 players against the house dealer (6-deck shoe, S17, DAS, BJ 3:2, insurance 2:1). */
const D = BX.draw, C = BX.C;
const NDECK = 6, MINB = 10, MAXB = 500, CHIPS = [10, 50, 100, 500];
const CHIPC = {10: ['#efe7d2', '#2f5d8a'], 50: ['#b23a2b', '#fff3e3'], 100: ['#1f4a38', '#e6c57d'], 500: ['#5b3a86', '#f3e2c0']};
const crd = c => ({r: c % 13 + 1, s: Math.floor(c / 13) % 4});
const val = c => Math.min(10, c % 13 + 1);   // A = 1
function total(cs) { let t = 0, a = 0; for (const c of cs) { const v = val(c); t += v; if (v === 1) a++; } const soft = a > 0 && t + 10 <= 21; return {t: soft ? t + 10 : t, soft}; }
const natural = h => h.c.length === 2 && !h.sp && total(h.c).t === 21;
const hiLo = c => { const v = val(c); return v >= 2 && v <= 6 ? 1 : (v === 1 || v === 10) ? -1 : 0; };

function drawChip(g, x, y, r, v) {
  const [base, edge] = CHIPC[v] || CHIPC[10];
  g.save();
  g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, x + r * .06, y + r * .12, r); g.fill();
  g.fillStyle = base; D.circle(g, x, y, r); g.fill();
  g.setLineDash([r * .42, r * .36]); g.lineWidth = r * .24; g.strokeStyle = edge; D.circle(g, x, y, r * .86); g.stroke(); g.setLineDash([]);
  g.lineWidth = Math.max(1, r * .06); g.strokeStyle = 'rgba(0,0,0,.25)'; D.circle(g, x, y, r * .6); g.stroke();
  g.fillStyle = D.shade(base, 10); D.circle(g, x, y, r * .57); g.fill();
  if (r > 7) D.text(g, String(v), x, y + r * .03, {size: r * (v >= 100 ? .52 : .62), color: v === 10 ? '#2f5d8a' : edge, weight: 800});
  g.restore();
}
/* pile of chips worth `amt`, centered at x, bottom at y */
function chipStack(g, x, y, amt, r) {
  if (!amt) return;
  const piles = []; let left = amt;
  for (const v of [500, 100, 50, 10]) { const k = Math.floor(left / v); if (k) { piles.push([v, k]); left -= k * v; } }
  const gap = r * 2.05, x0 = x - (piles.length - 1) * gap / 2;
  piles.forEach(([v, k], i) => { const m = Math.min(k, 8); for (let j = 0; j < m; j++) drawChip(g, x0 + i * gap, y - j * r * .26, r, v); });
}

BX.register({
  id: 'blackjack', title: '二十一点', cat: 'cards', order: 4, sub: '与庄家比点，越近21越好',
  desc: '六副牌牌靴、庄家软17停牌、黑杰克一赔一点五。可要牌、停牌、加倍、分牌、买保险。一至三人同桌对抗庄家，打完约定手数后筹码最多者胜。',
  kind: 'turn', seats: [1, 3], defSeats: 1, noFirst: true, aiDelay: 520,
  seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b'],
  options: [{key: 'hands', label: '局数', choices: [[5, '5 手'], [10, '10 手'], [20, '20 手']], def: 10},
    {key: 'surr', label: '投降', choices: [[0, '不可投降'], [1, '可投降（退一半）']], def: 0},
    {key: 'coach', label: '策略教练', choices: [[0, '关'], [1, '开（辅助模式下，偏离基本策略时提醒）']], def: 0, modes: ['ai', 'local']}],
  howto: ['点筹码累加注码，再点「下注」；上一手结束后可一键「同上」或「翻倍」。', '轮到你时点 <b>要牌 / 停牌 / 加倍 / 分牌</b>；手牌旁的数字是点数，「7/17」表示含 A 的软点数。', '💡 会按基本策略标出最佳操作；开启辅助模式后，可在开局选项里打开「策略教练」练习。', '键盘：1–4 筹码 · 回车 下注/同上 · H 要牌 · S 停牌 · D 加倍 · P 分牌 · R 投降 · Y/N 保险。'],
  rules: `<p><b>目标：</b>手牌点数尽量接近 21 点但不超过，并大于庄家。2–10 按面值，J/Q/K 记 10 点，A 记 1 点或 11 点（含 A 且记 11 不爆时称“软”点数）。</p>
<p><b>牌靴：</b>6 副牌混洗，发到切牌位置后在下一手开始前重新洗牌。</p>
<p><b>流程：</b>每手开始先下注（10–500）。随后每位玩家和庄家各发两张牌，庄家一张明牌、一张暗牌。</p>
<p><b>保险：</b>庄家明牌为 A 时，可花半个注码买保险；若庄家是黑杰克，保险 <b>2 赔 1</b>。</p>
<p><b>验牌：</b>庄家明牌为 A 或 10 点牌时先查看暗牌，若为黑杰克立即亮牌结算（玩家也是黑杰克则平局）。</p>
<p><b>玩家操作</b>（按座位顺序）：<br>· <b>要牌</b>：再拿一张；超过 21 点即爆牌输掉注码。<br>· <b>停牌</b>：不再要牌。<br>· <b>加倍</b>：仅前两张牌时可用，注码加倍并只再拿一张牌。<br>· <b>分牌</b>：前两张点数相同时可分成两手，各下同额注码；可再分牌，最多 4 手；分牌后可加倍。<b>分开的 A 每手只发一张牌</b>，分牌后的 21 点不算黑杰克。</p>
<p><b>庄家：</b>玩家都行动完毕后庄家亮暗牌，<b>16 点及以下必须要牌，17 点（含软 17）停牌</b>。</p>
<p><b>结算：</b>黑杰克（前两张为 A + 10 点牌）<b>3 赔 2</b>；点数大于庄家或庄家爆牌 1 赔 1；点数相同退还注码。</p>
<p><b>胜负：</b>每人 1000 筹码，打完设定手数（或全部输光）后，筹码最多者获胜；单人游戏筹码多于 1000 即为胜利。</p>
<p><b>投降（可选规则）：</b>开启后，前两张牌（未分牌）时可以放弃本手，收回一半注码。</p>
<p>键盘：H 要牌 · S 停牌 · D 加倍 · P 分牌 · R 投降。</p>`,
  icon(g, w, h) {
    const gr = g.createRadialGradient(w / 2, h * .2, 10, w / 2, h * .4, w * .8); gr.addColorStop(0, '#3a8a62'); gr.addColorStop(1, '#1d4a35'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, -h * .2, w * .62, h * 1.05, 0, 0, Math.PI); g.stroke();
    const cw = w * .26, ch = cw * 1.4;
    g.save(); g.translate(w * .36, h * .48); g.rotate(-.18); D.card(g, -cw / 2, -ch / 2, cw, ch, {r: 1, s: 0}); g.restore();
    g.save(); g.translate(w * .55, h * .44); g.rotate(.14); D.card(g, -cw / 2, -ch / 2, cw, ch, {r: 13, s: 1}); g.restore();
    chipStack(g, w * .8, h * .86, 160, h * .08); drawChip(g, w * .16, h * .84, h * .09, 500);
    D.text(g, '21', w * .82, h * .2, {size: h * .22, color: '#e6c57d', font: 'deco', weight: 400, shadow: true});
  },
  create(ctx) {
    const SURR = !!+ctx.opts.surr, COACH = !!+ctx.opts.coach && ctx.mode !== 'online' && ctx.assist;   // 策略教练 = assist only
    const n = ctx.n, HANDS = BX.test ? Math.min(6, ctx.opts.hands || 10) : (ctx.opts.hands || 10);
    const st = {n, H: HANDS, hno: 0, chips: new Array(n).fill(1000), shoe: [], pos: 0, cut: 0, shuf: 0,
      ph: 'bet', bet: [], pl: [], d: [], hole: true, ins: [], cur: -1, hi: 0, msg: '', last: new Array(n).fill(0), over: false, net: []};
    function newShoe() { st.shoe = ctx.rng.shuffle(BX.range(52 * NDECK)); st.pos = 0; st.cut = st.shoe.length - 70 - ctx.rng.int(30); st.shuf++; }
    newShoe();
    const draw = () => { if (st.pos >= st.shoe.length) newShoe(); return st.shoe[st.pos++]; };
    const active = s => st.bet[s] > 0;
    function startHand() {
      st.hno++; st.ph = 'bet'; st.old = st.hno > 1; st.ins = []; st.cur = -1; st.hi = 0; st.net = [];   // last hand stays on the felt (dimmed) until the deal
      st.bet = st.chips.map(c => c >= MINB ? null : 0);
      st.msg = st.pos >= st.cut ? '牌靴到切牌位置，本手前重新洗牌' : '';
    }
    function finish() {
      st.over = true; st.ph = 'over'; st.msg = '牌局结束';
      const txt = BX.range(n).map(s => ctx.name(s) + '：' + st.chips[s]).join('　');
      if (n === 1) { const w = st.chips[0] > 1000; ctx.end({win: w, title: w ? '满载而归' : '铩羽而归', big: w ? '胜' : '负', text: `最终筹码 ${st.chips[0]}（${st.chips[0] >= 1000 ? '+' : ''}${st.chips[0] - 1000}）`}); return; }
      const mx = Math.max(...st.chips); ctx.end({winner: BX.range(n).filter(s => st.chips[s] === mx), text: txt});
    }
    function beginPlay() {
      st.ph = 'play';
      for (let s = 0; s < n; s++) if (active(s) && natural(st.pl[s][0])) { st.pl[s][0].done = true; st.pl[s][0].bj = true; if (s === ctx.view && !ctx.fast) ctx.after(500, () => ctx.sfx('score')); }
      advance();
    }
    function advance() {
      for (let s = 0; s < n; s++) {
        if (!active(s)) continue;
        const hs = st.pl[s];
        for (let i = 0; i < hs.length; i++) {
          const hd = hs[i]; if (hd.done) continue;
          if (hd.c.length === 1) { hd.c.push(draw()); if (total(hd.c).t === 21) { hd.done = true; continue; } }
          st.cur = s; st.hi = i; return;
        }
      }
      st.cur = -1; st.ph = 'dealer';
    }
    const dealerBJ = () => st.d.length === 2 && total(st.d).t === 21;
    function needDealer() { for (let s = 0; s < n; s++) for (const hd of st.pl[s] || []) if (!hd.bust && !hd.bj && !hd.surr) return true; return false; }
    function settle() {
      const dt = total(st.d).t, dbj = dealerBJ(); st.hole = false;
      let anyWin = false, anyLose = false;
      for (let s = 0; s < n; s++) {
        if (!active(s)) continue; let net = 0;
        if (st.ins[s] > 0) { if (dbj) { st.chips[s] += st.ins[s] * 3; net += st.ins[s] * 2; } else net -= st.ins[s]; }
        for (const hd of st.pl[s]) {
          const pt = total(hd.c).t; let r;
          if (hd.surr) r = 'surr';
          else if (hd.bust) r = 'bust';
          else if (hd.bj || natural(hd)) r = dbj ? 'push' : 'bj';
          else if (dbj) r = 'lose';
          else if (dt > 21 || pt > dt) r = 'win';
          else if (pt === dt) r = 'push'; else r = 'lose';
          hd.res = r;
          const pay = r === 'bj' ? hd.b + hd.b * 3 / 2 : r === 'win' ? hd.b * 2 : r === 'push' ? hd.b : r === 'surr' ? hd.b / 2 : 0;
          st.chips[s] += pay; hd.net = pay - hd.b; net += hd.net;
          if (hd.net > 0) anyWin = true; if (hd.net < 0) anyLose = true;
        }
        st.net[s] = net;
      }
      st.ph = 'res';
      st.msg = dbj ? '庄家黑杰克！' : dt > 21 ? '庄家爆牌（' + dt + '点）' : '庄家 ' + dt + ' 点';
      ctx.sfx(anyWin ? 'coin' : anyLose ? 'chip' : 'chip');
    }
    const hand = () => st.cur >= 0 ? st.pl[st.cur][st.hi] : null;
    function legal(s) {
      const L = {};
      if (st.over) return L;
      if (st.ph === 'bet') { if (st.bet[s] == null) L.bet = true; return L; }
      if (st.ph === 'ins') { if (st.ins[s] == null) L.ins = true; return L; }
      if (st.ph !== 'play' || st.cur !== s) return L;
      const hd = hand(); if (!hd || hd.done) return L;
      L.hit = L.stand = true;
      if (hd.c.length === 2 && st.chips[s] >= hd.b) L.double = true;
      if (hd.c.length === 2 && val(hd.c[0]) === val(hd.c[1]) && st.pl[s].length < 4 && st.chips[s] >= hd.b) L.split = true;
      if (SURR && hd.c.length === 2 && st.pl[s].length === 1 && !hd.sp) L.surr = true;
      return L;
    }
    startHand();

    /* ---------------- AI ---------------- */
    function trueCount() {
      let rc = 0; for (let i = 0; i < st.pos; i++) { if (st.hole && st.d.length > 1 && st.shoe[i] === st.d[1]) continue; rc += hiLo(st.shoe[i]); }
      return rc / Math.max(.5, (st.shoe.length - st.pos) / 52);
    }
    function basic(hd, up, L) {
      const u = val(up) === 1 ? 11 : val(up), {t, soft} = total(hd.c);
      const pair = L.split ? val(hd.c[0]) : 0;
      if (L.surr && !soft && pair !== 8 && ((t === 16 && u >= 9) || (t === 15 && u === 10))) return 'surr';
      if (pair) {
        if (pair === 1 || pair === 8) return 'split';
        if (pair === 9 && u <= 9 && u !== 7) return 'split';
        if ((pair === 7 || pair === 2 || pair === 3) && u <= 7) return 'split';
        if (pair === 6 && u <= 6) return 'split';
        if (pair === 4 && (u === 5 || u === 6)) return 'split';
      }
      const dbl = x => L.double ? 'double' : x;
      if (soft) {
        if (t >= 20) return 'stand';
        if (t === 19) return u === 6 ? dbl('stand') : 'stand';
        if (t === 18) return u <= 6 ? dbl('stand') : u <= 8 ? 'stand' : 'hit';
        if (t === 17) return u >= 3 && u <= 6 ? dbl('hit') : 'hit';
        if (t >= 15) return u >= 4 && u <= 6 ? dbl('hit') : 'hit';
        return u >= 5 && u <= 6 ? dbl('hit') : 'hit';
      }
      if (t >= 17) return 'stand';
      if (t >= 13) return u <= 6 ? 'stand' : 'hit';
      if (t === 12) return u >= 4 && u <= 6 ? 'stand' : 'hit';
      if (t === 11) return u <= 10 ? dbl('hit') : 'hit';
      if (t === 10) return u <= 9 ? dbl('hit') : 'hit';
      if (t === 9) return u >= 3 && u <= 6 ? dbl('hit') : 'hit';
      return 'hit';
    }

    /* ---------------- UI ---------------- */
    const cv = ctx.canvas();
    const ui = ctx.ui(), bar = h('div', {class: 'bx-bar bj-bar'}); ui.append(bar);
    const style = h('style', {text: `.bj-bar{gap:8px;align-items:center}.bj-bar .bx-btn{min-width:64px;padding:10px 12px}
.bj-chip{width:50px;height:50px;min-height:50px;border-radius:50%;border:4px dashed;font-weight:800;font-size:14px;padding:0;box-shadow:0 3px 0 rgba(0,0,0,.35),0 4px 10px rgba(0,0,0,.3)}
.bj-chip:disabled{opacity:.35}.bj-chip:active{transform:translateY(2px)}
@keyframes bjPulse{50%{box-shadow:0 0 0 3px #ffd76a,0 0 18px 4px rgba(255,215,106,.9)}}.bj-hint{animation:bjPulse .9s ease-in-out infinite;outline:2px solid #ffd76a}
@media (max-height:500px){.bj-bar .bx-btn{min-height:42px;padding:8px 10px}.bj-chip{width:46px;height:46px;min-height:46px}}`});
    ui.append(style);
    let pend = 0, sig = '', hintA = null, coachN = 0, coachOK = 0;
    const me = () => ctx.view;
    const ACTN = {hit: '要牌', stand: '停牌', double: '加倍', split: '分牌', surr: '投降'};
    function play(t) {
      const s = me(), L = legal(s); if (!L[t] || !ctx.canAct(s)) return;
      if (COACH) {
        const rec = basic(hand(), st.d[0], L); coachN++;
        if (rec === t) coachOK++; else ctx.toast('基本策略：这里应当「' + ACTN[rec] + '」');
      }
      ctx.act({t}, s);
    }
    function refreshUI(force) {
      const s = me(), L = legal(s), can = ctx.canAct(s);
      const key = [st.ph, st.cur, st.hi, can, pend, JSON.stringify(L), st.chips[s], st.pl[s] ? st.pl[s].length : 0, JSON.stringify(hintA)].join('|');
      if (key === sig && !force) return; sig = key;
      bar.innerHTML = '';
      if (!can) return;
      const hk = (t) => hintA && hintA.t === t;
      const B = (txt, cls, fn, dis, hl) => h('button', {class: 'bx-btn ' + (cls || '') + (hl && !dis ? ' bj-hint' : ''), text: txt, disabled: !!dis, on: {click: () => { ctx.sfx('click'); fn(); }}});
      if (L.bet) {
        const cap = Math.min(st.chips[s], MAXB);
        for (const v of CHIPS) {
          const [bg, ed] = CHIPC[v];
          bar.append(h('button', {class: 'bj-chip', text: v, disabled: pend + v > cap, style: {background: bg, borderColor: ed, color: v === 10 ? '#2f5d8a' : ed}, on: {click: () => addChip(v)}}));
        }
        bar.append(B('清除', 'ghost', () => { pend = 0; refreshUI(true); }, !pend));
        const lb = st.last[s];
        if (pend) bar.append(B('下注 ' + pend, 'red', () => doBet(pend), false, hk('bet') && hintA.amt === pend));
        else if (lb && lb <= cap) {
          bar.append(B('同上 ' + lb, 'jade', () => doBet(lb), false, hk('bet') && hintA.amt === lb));
          if (lb * 2 <= cap) bar.append(B('翻倍 ' + lb * 2, '', () => doBet(lb * 2), false, hk('bet') && hintA.amt === lb * 2));
        } else bar.append(B('请选筹码', 'red', () => {}, true));
      } else if (L.ins) {
        const hd = st.pl[s][0];
        bar.append(B('买保险（' + hd.b / 2 + '）', 'jade', () => ctx.act({t: 'ins', take: true}, s), false, hk('ins') && hintA.take), B('不买', 'ghost', () => ctx.act({t: 'ins', take: false}, s), false, hk('ins') && !hintA.take));
      } else if (L.hit) {
        bar.append(B('要牌', 'red', () => play('hit'), false, hk('hit')), B('停牌', 'jade', () => play('stand'), false, hk('stand')),
          B('加倍', '', () => play('double'), !L.double, hk('double')), B('分牌', '', () => play('split'), !L.split, hk('split')));
        if (SURR) bar.append(B('投降', 'ghost', () => play('surr'), !L.surr, hk('surr')));
      }
    }
    function addChip(v) { const s = me(), cap = Math.min(st.chips[s], MAXB); if (!ctx.canAct(s) || !legal(s).bet || pend + v > cap) return; pend += v; ctx.sfx('chip'); refreshUI(true); }
    function doBet(v) { const s = me(); if (!v || !ctx.canAct(s)) return; pend = 0; ctx.act({t: 'bet', amt: v}, s); }
    const fmtT = (cs) => { const t = total(cs); return t.soft && t.t < 21 ? (t.t - 10) + '/' + t.t : String(t.t); };
    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.chips[s]);
      const s = me(), can = ctx.canAct(s), who = ctx.hotseat ? ctx.name(s) + '：' : '';
      const hs = `第 ${Math.min(st.hno, st.H)}/${st.H} 手 · `;
      const net = st.chips[s] - 1000, netT = net ? '（' + (net > 0 ? '+' : '') + net + '）' : '';
      let m;
      if (st.over) m = '牌局结束';
      else if (st.ph === 'bet') m = can ? who + '请下注' + netT : '等待下注…';
      else if (st.ph === 'ins') m = can ? who + '庄家明牌是 A，买保险吗？' : '等待保险决定…';
      else if (st.ph === 'play') { const hd = hand(); m = can ? who + '你的 ' + fmtT(hd.c) + ' 点' + (st.pl[s].length > 1 ? '（第' + (st.hi + 1) + '手）' : '') + '，要牌还是停牌？' : '轮到 ' + ctx.name(st.cur); }
      else if (st.ph === 'dealer' || st.ph === 'peek') m = '庄家行动中…';
      else m = st.msg;
      if (COACH && coachN) m += ` · 策略 ${coachOK}/${coachN}`;
      ctx.status(hs + m);
      refreshUI();
    }

    /* ---------------- drawing ---------------- */
    const vis = new Map(); let spawnWait = 0, snap = true, flip = 1;
    function layout() {
      const W = cv.w, br = bar.getBoundingClientRect(), barH = br.height ? br.height + 18 : 70;
      const Ha = Math.max(200, cv.h - barH), compact = Ha < 440;
      const chD = Math.min((Ha - 70) / 2.9, W / (W < 520 ? 5.2 : 5) * 1.4, 150), cwD = chD / 1.4;
      return {W, Ha, compact, chD, cwD};
    }
    function frame(dt) {
      const g = cv.g; cv.clear('#24170d');
      const L0 = layout(), {W, Ha, chD, cwD} = L0, Hc = cv.h;
      // table
      D.wood(g, 0, 0, W, Hc, {base: '#4a2c17', dark: '#24140a', seed: 5, grain: .25});
      const tx = 10, tw = W - 20, th = Ha + Math.min(60, Hc - Ha) - 4;
      g.save(); g.beginPath(); g.moveTo(tx, 0); g.lineTo(tx + tw, 0); g.ellipse(W / 2, 0, tw / 2, th, 0, 0, Math.PI); g.closePath();
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 16; g.fillStyle = '#6b3a1c'; g.fill(); g.restore();
      g.save(); g.beginPath(); g.moveTo(tx + 10, 0); g.lineTo(tx + tw - 10, 0); g.ellipse(W / 2, 0, tw / 2 - 10, th - 10, 0, 0, Math.PI); g.closePath(); g.clip();
      D.felt(g, 0, 0, W, th, {color: '#2b6a4c'});
      g.strokeStyle = 'rgba(230,197,125,.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(W / 2, 0, tw / 2 - 26, th - 30, 0, 0, Math.PI); g.stroke();
      g.restore();
      const yT = chD + 34;
      // shoe
      const shX = W - cwD * 1.25 - 16, shY = 10;
      g.save(); g.translate(shX, shY);
      D.rr(g, 0, 0, cwD * 1.15, chD * .75, 6); g.fillStyle = '#3a2010'; g.fill();
      D.card(g, cwD * .1, chD * .08, cwD * .85, chD * .6, null, {shadow: false});
      g.fillStyle = 'rgba(30,15,5,.55)'; g.fillRect(0, chD * .45, cwD * 1.15, chD * .3);
      D.text(g, '余 ' + (st.shoe.length - st.pos), cwD * .575, chD * .62, {size: Math.max(10, cwD * .2), color: '#f3e2c0'});
      g.restore();
      const shoeP = {x: shX + cwD * .1, y: shY + chD * .08};
      // targets
      const T = [];   // {c, x, y, w, h, face}
      const dW = cwD + Math.max(0, st.d.length - 1) * cwD * .62, dx0 = W / 2 - dW / 2;
      st.d.forEach((c, i) => T.push({c, x: dx0 + i * cwD * .62, y: 10, w: cwD, h: chD, hole: i === 1 && st.hole}));
      // seats
      const colW = W / n;
      const spots = [], HL = new Map();
      for (let s = 0; s < n; s++) {
        const hs = st.pl[s] || [], nh = Math.max(1, hs.length);
        const maxCards = Math.max(2, ...hs.map(x => x.c.length));
        const cw = Math.min(cwD * .95, colW / nh / (1 + (Math.min(maxCards, 6) - 1) * .3) * .9, 96), ch = cw * 1.4;
        const chipR = Math.max(9, Math.min(18, cw * .26));
        const nameY = Ha - 6, chipY = nameY - 20, cardsBottom = chipY - chipR * 2.4;
        const yP = Math.max(yT + 30, cardsBottom - ch - (Math.min(maxCards, 6) - 1) * ch * .1);
        const cx = colW * (s + .5);
        spots.push({s, cx, cw, ch, chipR, chipY, nameY, yP, hs});
        hs.forEach((hd, hi) => {
          const hx = cx - colW / 2 + colW * (hi + .5) / nh, k = hd.c.length, hw = cw + (k - 1) * cw * .3;
          HL.set(hd, {x: hx, w: hw});
          hd.c.forEach((c, j) => T.push({c, x: hx - hw / 2 + j * cw * .3, y: yP + j * ch * .1, w: cw, h: ch, rot: hd.dbl && j === 2 ? Math.PI / 2 : 0}));
        });
      }
      // felt lettering (only where no cards cover it)
      const minYP = Math.min(...spots.map(q => q.hs.length ? q.yP : Ha));
      if (minYP > yT + 14) D.text(g, '黑杰克 三赔二', W / 2, yT, {size: Math.max(12, Math.min(22, W / 28)), color: 'rgba(230,197,125,.55)', font: 'deco', weight: 400});
      const y2 = yT + Math.max(16, Math.min(24, W / 30));
      if (minYP > y2 + 12) D.text(g, '庄家十七点停牌 · 保险二赔一' + (SURR ? ' · 可投降' : ''), W / 2, y2, {size: Math.max(10, Math.min(14, W / 45)), color: 'rgba(230,197,125,.4)', font: 'serif'});
      const old = st.ph === 'bet' && st.old;
      // animate cards
      if (snap) { for (const t of T) vis.set(t.c, {x: t.x, y: t.y, wait: 0}); snap = false; }
      spawnWait = Math.max(0, spawnWait - dt);
      const live = new Set(T.map(t => t.c));
      for (const t of T) {
        let v = vis.get(t.c);
        if (!v) { v = {x: shoeP.x, y: shoeP.y, wait: spawnWait, snd: true}; spawnWait += .14; vis.set(t.c, v); }
        if (v.wait > 0) { v.wait -= dt; continue; }
        if (v.snd) { v.snd = false; ctx.sfx('card'); }
        const k = Math.min(1, dt * 11); v.x += (t.x - v.x) * k; v.y += (t.y - v.y) * k;
      }
      for (const c of [...vis.keys()]) if (!live.has(c)) vis.delete(c);
      const drawCard = t => {
        const v = vis.get(t.c); if (!v || v.wait > 0) return;
        if (old) g.globalAlpha = .5;
        drawCard0(t, v); g.globalAlpha = 1;
      };
      const drawCard0 = (t, v) => {
        if (t.hole) { D.card(g, v.x, v.y, t.w, t.h, null, {backText: '庄'}); return; }
        if (t.rot) { g.save(); g.translate(v.x + t.w / 2, v.y + t.h / 2 + t.h * .08); g.rotate(t.rot); D.card(g, -t.w / 2, -t.h / 2, t.w, t.h, crd(t.c)); g.restore(); return; }
        if (t.c === st.d[1] && flip < 1) { const sx = Math.abs(1 - 2 * flip); g.save(); g.translate(v.x + t.w / 2, 0); g.scale(sx, 1); D.card(g, -t.w / 2, v.y, t.w, t.h, flip < .5 ? null : crd(t.c), {backText: '庄'}); g.restore(); return; }
        D.card(g, v.x, v.y, t.w, t.h, crd(t.c));
      };
      // dealer
      D.text(g, '庄 家', dx0 - 10, 10 + chD * .5, {size: Math.max(13, chD * .16), color: 'rgba(243,226,192,.75)', font: 'deco', weight: 400, align: 'right'});
      for (const t of T) if (st.d.includes(t.c)) drawCard(t);
      if (st.d.length) {
        const vis2 = st.hole ? [st.d[0]] : st.d, dt2 = total(vis2);
        if (old) g.globalAlpha = .6;
        badge(g, dx0 + dW + 8, 10 + chD * .5, st.hole ? fmtT(vis2) : String(dt2.t), dt2.t > 21 ? '#a33022' : '#2a190d', Math.max(12, chD * .15), 'left');
        g.globalAlpha = 1;
      }
      // seats
      for (const sp of spots) {
        const {s, cx, cw, ch, chipR, chipY, nameY, hs} = sp;
        const turn = st.cur === s && st.ph === 'play';
        // betting circle
        g.strokeStyle = turn ? '#ffd76a' : 'rgba(230,197,125,.55)'; g.lineWidth = turn ? 2.5 : 1.5;
        g.beginPath(); g.ellipse(cx, chipY - chipR * .5, chipR * 2.4, chipR * 1.25, 0, 0, Math.PI * 2); g.stroke();
        if (!hs.length || old) {
          const amt = st.bet[s] != null ? st.bet[s] : (s === me() && ctx.canAct(s) ? pend : 0);
          if (amt) { g.globalAlpha = st.bet[s] != null ? 1 : .6; chipStack(g, cx, chipY, amt, chipR); g.globalAlpha = 1; }
          else if (st.ph === 'bet' && st.bet[s] == null) D.text(g, '下注', cx, chipY - chipR * .5, {size: chipR * .9, color: 'rgba(230,197,125,.6)', font: 'serif'});
          else if (st.bet[s] === 0) D.text(g, '观战', cx, chipY - chipR * .5, {size: chipR * .9, color: 'rgba(230,197,125,.45)', font: 'serif'});
        } else if (!old) {
          const tot = hs.reduce((a, x) => a + x.b, 0);
          chipStack(g, cx, chipY, tot, chipR);
          if (st.ins[s] > 0) { drawChip(g, cx + chipR * 3.4, chipY - chipR * .4, chipR * .8, st.ins[s] >= 50 ? 50 : 10); D.text(g, '保险', cx + chipR * 3.4, chipY + chipR * .9, {size: 10, color: '#e6c57d'}); }
        }
        // name plate
        const nm = ctx.name(s) + (ctx.isLocal(s) && !ctx.hotseat ? '（你）' : ''), col = ctx.color(s);
        g.font = '600 13px ' + BX.F.sans; const tw2 = Math.min(colW - 10, g.measureText(nm + '  ' + st.chips[s]).width + 34);
        g.fillStyle = turn ? 'rgba(230,197,125,.92)' : 'rgba(20,12,6,.72)'; D.rr(g, cx - tw2 / 2, nameY - 13, tw2, 22, 11); g.fill();
        g.fillStyle = col; D.circle(g, cx - tw2 / 2 + 11, nameY - 2, 5); g.fill();
        D.text(g, nm + '  ' + st.chips[s], cx + 6, nameY - 2, {size: 13, color: turn ? '#2a190d' : '#f3e2c0', maxW: tw2 - 26});
        // hands
        hs.forEach((hd, hi) => {
          for (const t of T) if (hd.c.includes(t.c)) drawCard(t);
          if (old) g.globalAlpha = .7;
          const hl = HL.get(hd) || {x: cx, w: cw}, act = turn && hi === st.hi, tt = total(hd.c), bx = hl.x - hl.w / 2, by = sp.yP - 4;
          const lv = hd.c.length ? vis.get(hd.c[hd.c.length - 1]) : null, ready = !!lv && lv.wait <= 0;
          if (act && ready) { g.strokeStyle = '#ffd76a'; g.lineWidth = 3; g.shadowColor = '#ffd76a'; g.shadowBlur = 10; D.rr(g, bx - 4, by, hl.w + 8, ch + (hd.c.length - 1) * ch * .1 + 8, 8); g.stroke(); g.shadowBlur = 0; }
          if (ready) {
            badge(g, bx - 2, by - 2, fmtT(hd.c), tt.t > 21 ? '#a33022' : tt.t === 21 ? '#8a6a1c' : '#2a190d', Math.max(11, cw * .22), 'center');
          }
          const lbl = hd.res ? {bj: '黑杰克', win: '赢', push: '平', lose: '输', bust: '爆牌', surr: '投降'}[hd.res] : hd.bust ? '爆牌' : hd.surr ? '投降' : hd.bj ? '黑杰克' : '';
          if (lbl && ready) {
            const good = hd.res === 'bj' || hd.res === 'win' || (!hd.res && hd.bj), y = sp.yP + ch * .45;
            const net = hd.net != null ? (hd.net > 0 ? ' +' + hd.net : hd.net < 0 ? ' ' + hd.net : '') : '';
            const fs = Math.max(13, cw * .26);
            g.font = '800 ' + fs + 'px ' + BX.F.sans; const lw = g.measureText(lbl + net).width + 16;
            g.fillStyle = good ? 'rgba(200,150,40,.95)' : hd.res === 'push' ? 'rgba(60,60,60,.85)' : 'rgba(150,35,25,.92)';
            D.rr(g, hl.x - lw / 2, y - fs * .75, lw, fs * 1.5, 8); g.fill();
            D.text(g, lbl + net, hl.x, y, {size: fs, color: '#fff8e6', weight: 800});
          }
          g.globalAlpha = 1;
        });
      }
      // banner
      const myNet = st.net[me()];
      const msg = st.ph === 'res' || st.ph === 'over' || (st.msg && st.ph !== 'play') ? st.msg + (st.ph === 'res' && n === 1 && myNet ? (myNet > 0 ? '  你赢 ' + myNet : '  你输 ' + (-myNet)) : '') : '';
      if (msg) {
        const fs = Math.max(13, Math.min(18, W / 32)); g.font = '700 ' + fs + 'px ' + BX.F.sans;
        const mw = g.measureText(msg).width + 28, my = Math.max(yT, Math.min(yT + Math.max(40, Math.min(56, W / 16)), Math.min(...spots.map(q => q.yP)) - fs - 14));
        g.fillStyle = 'rgba(20,12,6,.7)'; D.rr(g, W / 2 - mw / 2, my - fs, mw, fs * 2, fs); g.fill();
        D.text(g, msg, W / 2, my, {size: fs, color: '#f3e2c0'});
      }
      refreshUI();
    }
    function badge(g, x, y, txt, bg, fs, align) {
      g.font = '800 ' + fs + 'px ' + BX.F.sans; const w = Math.max(fs * 1.7, g.measureText(txt).width + fs * .8), hh = fs * 1.45;
      const x0 = align === 'left' ? x : x - w / 2;
      g.fillStyle = bg; D.rr(g, x0, y - hh / 2, w, hh, hh / 2); g.fill(); g.strokeStyle = 'rgba(230,197,125,.8)'; g.lineWidth = 1.2; g.stroke();
      D.text(g, txt, x0 + w / 2, y + 1, {size: fs, color: '#fff3d6', weight: 800});
    }

    const inst = {
      st,
      toMove() {
        if (st.over) return null;
        if (st.ph === 'bet') { const a = BX.range(n).filter(s => st.bet[s] == null); return a.length ? a : null; }
        if (st.ph === 'ins') { const a = BX.range(n).filter(s => st.ins[s] == null); return a.length ? a : null; }
        if (st.ph === 'play') return st.cur;
        return null;
      },
      valid(a, by) {
        const L = legal(by);
        if (a.t === 'bet') return !!L.bet && Number.isInteger(a.amt) && a.amt >= MINB && a.amt <= Math.min(MAXB, st.chips[by]) && a.amt % 10 === 0;
        if (a.t === 'ins') return !!L.ins;
        return !!L[a.t];
      },
      sysMove() {
        if (st.over) return null;
        if (st.ph === 'bet' && st.bet.every(b => b != null)) return {a: {t: 'deal'}, delay: 450};
        if (st.ph === 'ins' && st.ins.every(b => b != null)) return {a: {t: 'peek'}, delay: 500};
        if (st.ph === 'peek') return {a: {t: 'peek'}, delay: 700};
        if (st.ph === 'dealer') {
          if (st.hole) return {a: {t: 'reveal'}, delay: 600};
          if (needDealer() && total(st.d).t < 17) return {a: {t: 'dhit'}, delay: 750};
          return {a: {t: 'settle'}, delay: 500};
        }
        if (st.ph === 'res') return {a: {t: 'next'}, delay: 1500};   // results stay visible (dimmed) while betting
        return null;
      },
      apply(a, by) {
        const s = by; hintA = null;
        switch (a.t) {
          case 'bet': st.bet[s] = a.amt; st.chips[s] -= a.amt; st.last[s] = a.amt; ctx.sfx('chip'); break;
          case 'deal': {
            if (st.pos >= st.cut) { newShoe(); ctx.sfx('shuffle'); }
            st.msg = ''; st.old = false; st.pl = []; st.d = []; st.hole = true;
            const act = BX.range(n).filter(active);
            for (const p of act) st.pl[p] = [{c: [], b: st.bet[p]}];
            for (let r = 0; r < 2; r++) { for (const p of act) st.pl[p][0].c.push(draw()); st.d.push(draw()); }
            for (let p = 0; p < n; p++) if (!st.pl[p]) st.pl[p] = [];
            flip = 1; ctx.sfx('deal');
            const up = val(st.d[0]);
            if (up === 1) { st.ph = 'ins'; st.ins = BX.range(n).map(p => active(p) && st.chips[p] >= st.bet[p] / 2 ? null : 0); st.msg = '庄家明牌为 A，可以买保险'; }
            else if (up === 10) st.ph = 'peek';
            else beginPlay();
            break;
          }
          case 'ins': { const b = a.take ? st.bet[s] / 2 : 0; st.ins[s] = b; st.chips[s] -= b; if (b) ctx.sfx('chip'); break; }
          case 'peek':
            if (dealerBJ()) { st.hole = false; flip = 0; ctx.anim(420, k => flip = k); settle(); }
            else { st.msg = val(st.d[0]) === 1 || val(st.d[0]) === 10 ? '庄家验牌：不是黑杰克' : ''; beginPlay(); }
            break;
          case 'hit': case 'double': {
            const hd = hand();
            if (a.t === 'double') { st.chips[s] -= hd.b; hd.b *= 2; hd.dbl = true; ctx.sfx('chip'); }
            hd.c.push(draw()); const t = total(hd.c).t;
            if (t > 21) { hd.done = true; hd.bust = true; ctx.after(350, () => ctx.sfx('buzz')); if (ctx.isLocal(s) && !ctx.isAI(s)) ctx.buzz(30); }
            else if (t === 21 || a.t === 'double') hd.done = true;
            advance(); break;
          }
          case 'stand': hand().done = true; advance(); break;
          case 'surr': { const hd = hand(); hd.done = true; hd.surr = true; ctx.sfx('whoosh'); advance(); break; }
          case 'split': {
            const hd = hand(), c2 = hd.c.pop(); st.chips[s] -= hd.b; ctx.sfx('chip');
            const nh = {c: [c2], b: hd.b, sp: true}; hd.sp = true; st.pl[s].splice(st.hi + 1, 0, nh);
            if (val(hd.c[0]) === 1) { hd.c.push(draw()); nh.c.push(draw()); hd.done = nh.done = true; hd.sa = nh.sa = true; }
            else { hd.c.push(draw()); if (total(hd.c).t === 21) hd.done = true; }
            advance(); break;
          }
          case 'reveal': st.hole = false; flip = 0; ctx.anim(420, k => flip = k); ctx.sfx('flip'); break;
          case 'dhit': st.d.push(draw()); break;
          case 'settle': settle(); break;
          case 'next':
            if (st.hno >= st.H || st.chips.every(c => c < MINB)) finish();
            else startHand();
            break;
        }
        status();
      },
      aiMove(s, level) {
        const L = legal(s), rnd = Math.random;
        if (L.bet) {
          const cap = Math.min(st.chips[s], MAXB); let b;
          if (level === 1) b = BX.pick([10, 20, 50, 50, 100, 100, 150, 200, 300]);
          else if (level === 2) b = Math.round(st.chips[s] * .07 / 10) * 10;
          else { const tc = trueCount(), unit = Math.max(10, Math.round(st.chips[s] / 60 / 10) * 10); b = tc < 1 ? unit : unit * Math.min(6, Math.floor(tc) + 1); }
          b = Math.max(MINB, Math.floor(Math.min(cap, b) / 10) * 10);
          return {t: 'bet', amt: b};
        }
        if (L.ins) return {t: 'ins', take: level === 1 ? rnd() < .35 : level === 3 ? trueCount() >= 3 : false};
        if (!L.hit) return null;
        const hd = hand(), up = st.d[0];
        let m = basic(hd, up, L);
        if (level === 1) {
          const t = total(hd.c).t;
          if (rnd() < .3) m = t >= 17 ? 'stand' : t <= 11 ? 'hit' : rnd() < .5 ? 'hit' : 'stand';   // gut feeling
          if (m === 'split' && rnd() < .5) m = t >= 12 ? 'stand' : 'hit';
          if (m === 'double' && rnd() < .4) m = 'hit';
        }
        if (!L[m]) m = 'hit';
        return {t: m};
      },
      onTurn: status,
      onView() { pend = 0; sig = ''; hintA = null; status(); },
      showHint(a) {
        hintA = a; sig = '';
        if (a.t === 'bet') { pend = a.amt; ctx.toast('建议下注 ' + a.amt); }
        else if (ACTN[a.t]) ctx.toast('基本策略：' + ACTN[a.t]);
        else if (a.t === 'ins') ctx.toast(a.take ? '建议买保险' : '不建议买保险');
        refreshUI(true);
      },
      key(e) {
        const s = me(); if (!ctx.canAct(s)) return; const L = legal(s);
        const map = {KeyH: 'hit', KeyS: 'stand', KeyD: 'double', KeyP: 'split', KeyR: 'surr'}, t = map[e.code];
        if (t && L[t]) { play(t); return; }
        if (L.ins && (e.code === 'KeyY' || e.code === 'KeyN')) { ctx.act({t: 'ins', take: e.code === 'KeyY'}, s); return; }
        if (!L.bet) return;
        const ci = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (ci >= 0) { addChip(CHIPS[ci]); return; }
        if (e.code === 'Backspace' || e.code === 'Escape') { pend = 0; refreshUI(true); return; }
        if (e.code === 'Enter' || e.code === 'Space') { const lb = st.last[s]; if (pend) doBet(pend); else if (lb && lb <= Math.min(st.chips[s], MAXB)) doBet(lb); }
      },
      frame,
    };
    return inst;
  },
});
