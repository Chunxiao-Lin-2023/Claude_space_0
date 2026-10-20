/* 斗地主 — classic 3-player 叫分 Dou Dizhu. Engine + table UI live in _cards_ddz.js (BX.data.ddz.climb). */
BX.register({
  id: 'doudizhu', title: '斗地主', cat: 'cards', order: 1, sub: '一地主斗两农民',
  desc: '54 张牌三人对局，叫分抢地主，地主独得三张底牌，与两位农民一决胜负。炸弹、王炸、春天翻倍。电脑会拆牌组合、农民之间互相配合。',
  kind: 'turn', seats: 3, hidden: true, noFirst: false, firstLabel: '座位', aiDelay: 650,
  seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b'],
  rules: `<p><b>牌与人数</b>：一副 54 张（含大小王），三人，每人 17 张，留 3 张<b>底牌</b>。点数大小：大王 &gt; 小王 &gt; 2 &gt; A &gt; K &gt; Q &gt; J &gt; 10 … &gt; 3，不分花色。</p>
<p><b>叫分</b>：随机一人先叫，依次可叫 1、2、3 分或「不叫」，每次叫分必须高于前面的分数；叫到 3 分立即成为地主，否则一轮后叫分最高者当地主。三人都不叫则重新洗牌发牌。地主拿起三张底牌（亮给所有人看），先出牌。</p>
<p><b>牌型</b>：</p><ul>
<li>单张；对子；三张（三不带）；</li>
<li>三带一（三张 + 任意单张）；三带二（三张 + 一对）；</li>
<li>顺子：5 张或以上连续单牌，如 34567，最大到 A，<b>不能含 2 和王</b>；</li>
<li>连对：3 对或以上连续对子，如 334455；</li>
<li>飞机：2 个或以上连续三张，如 333444；可带同数量的单张（翅膀）或同数量的对子；</li>
<li>四带二：四张 + 两张单牌，或四张 + 两对；</li>
<li>炸弹：四张同点，可压除王炸外任何牌型；王炸：大王 + 小王，天下最大。</li></ul>
<p><b>出牌</b>：地主先出，按逆时针轮流。跟牌必须是<b>相同牌型、相同张数且更大</b>的牌（炸弹/王炸除外），也可以选择「不出」。其余两家都不出时，最后出牌者重新任意出牌。剩 2 张及以下时会<b>报警</b>。</p>
<p><b>胜负与计分</b>：谁先出完手牌，所在一方获胜（地主一方 vs 两位农民）。得分 = 叫分 × 倍数；每打出一个炸弹或王炸倍数 ×2；<b>春天</b>（地主出完而两农民一张未出）×2；<b>反春</b>（地主只出过一手牌，农民就出完）×2。</p>
<p><b>操作</b>：点选或在手牌上滑动多选，再点「出牌」；「提示」轮流给出可出的牌；键盘 Enter 出牌、空格不出、H 提示。</p>`,
  icon(g, w, h) {
    const L = BX.data.ddz;
    L.iconFan(g, w, h, '#2f6b4f', [53, 52, 1, 14, 27], (g, w, h) => {
      L.ui.seal(g, w * .14, h * .2, h * .24, '地', '#b23a2b');
      g.save(); g.globalAlpha = .9; BX.draw.text(g, '斗', w * .86, h * .2, {size: h * .22, color: '#f3e2c0', font: 'deco', weight: 400, shadow: true}); g.restore();
    });
  },
  create(ctx) { return BX.data.ddz.climb(ctx, 'ddz'); },
});
