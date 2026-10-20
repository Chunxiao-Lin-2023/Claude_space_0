/* 跑得快 — classic 16-card version (48 cards). Engine + table UI live in _cards_ddz.js (BX.data.ddz.climb). */
BX.register({
  id: 'paodekuai', title: '跑得快', cat: 'cards', order: 2, sub: '有大必压，先出完者胜',
  desc: '经典 16 张玩法：去掉大小王、三张 2 和一张 A，黑桃 3 先出。有大必压，下家报单要顶大牌，谁先出完谁赢，剩牌越多输越多。',
  kind: 'turn', seats: [2, 3], defSeats: 3, hidden: true, firstLabel: '座位', aiDelay: 600,
  seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b'],
  rules: `<p><b>用牌</b>：一副牌去掉大小王、三张 2（只留 ♠2）和 ♠A（留三张 A），共 48 张。三人每人 16 张；两人时各发 16 张，其余 16 张扣下不看。点数：2 &gt; A &gt; K &gt; … &gt; 3，不分花色。</p>
<p><b>先出</b>：三人局持 <b>♠3</b> 者先出，且第一手必须包含 ♠3；两人局由手中点数最小的牌的持有者先出，第一手须含这张牌。</p>
<p><b>牌型</b>：单张；对子；连对（2 对或以上相连，如 3344）；三带二（三张 + 任意两张，最后一手可以少带：三带一或三张）；顺子（5 张或以上相连，最大到 A，不含 2）；飞机（2 个或以上相连三张，每个三张带两张，最后一手可少带）；<b>炸弹</b>（四张同点，可压任何牌型，大炸压小炸）。</p>
<p><b>有大必压</b>：轮到你时，只要手里有能压过上家的牌就<b>必须出</b>，不能「不出」；真的要不起才可以过。</p>
<p><b>报单</b>：当你的下家只剩 1 张牌时，你如果出单张，必须出手中<b>最大</b>的单张（出对子等其他牌型不受限制）。</p>
<p><b>胜负</b>：先出完手牌者获胜。其余玩家按剩余张数输分（剩 1 张即已报单，不罚）；一张牌都没出过的玩家被「<b>关门</b>」，罚分翻倍。</p>
<p><b>操作</b>：点选或在手牌上滑动多选，再点「出牌」；「提示」轮流给出可出的牌；要不起时只有「要不起」按钮。键盘 Enter 出牌、空格过、H 提示。</p>`,
  icon(g, w, h) {
    const L = BX.data.ddz;
    L.iconFan(g, w, h, '#245a6b', [2, 15, 28, 41, 1], (g, w, h) => {
      BX.draw.text(g, '跑', w * .14, h * .2, {size: h * .24, color: '#f3e2c0', font: 'deco', weight: 400, shadow: true});
      g.strokeStyle = 'rgba(243,226,192,.8)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * (.74 + i * .03), h * (.12 + i * .07)); g.lineTo(w * (.94), h * (.12 + i * .07)); g.stroke(); }
    });
  },
  create(ctx) { return BX.data.ddz.climb(ctx, 'pdk'); },
});
