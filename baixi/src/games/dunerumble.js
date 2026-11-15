/* 沙丘乱斗 — the real-time 3D brawler lives in its own folder (../dunerumble/, own build, three.js renderer, PeerJS lobby
   for up to 6 players); here it is shown full-size inside the tea house in an iframe, so it is reached from the 百戏茶馆
   lobby instead of its own card in the game hub. The embedded page hides its own "back to hub" buttons (?embed=1) and
   follows the top bar's pause button through postMessage ({dr:1, pause}). */
BX.register({
  id: 'dunerumble', title: '沙丘乱斗', cat: 'arcade', order: 0, sub: '3D 英雄乱斗，吃鸡 / 3v3',
  desc: '十二位原创 Q 版英雄的俯视角 3D 乱斗：单人 / 双人吃鸡、宝石争霸、乱斗足球、赏金猎人、机甲 Boss 和训练场。草丛埋伏、开箱攒能量块越吃越大，每位英雄有副技能和两种星徽之力；奖杯段位、金币皮肤、每日任务。单人对抗 AI，也能在游戏里开房间 2–6 人联机。',
  kind: 'solo', hint: false, resume: false,
  howto: [
    '键鼠：<b>WASD</b> 移动、鼠标瞄准、<b>左键</b>攻击、<b>E / 右键</b>大招、<b>Q</b> 副技能、空格自动瞄准。',
    '触屏：左半屏拖动移动；右下摇杆拖动瞄准、松手攻击（轻点自动瞄准）；黄色摇杆放大招，绿色按钮副技能。',
    '躲进草丛别人看不见你；打碎能量箱捡绿色方块，攻击和血量都会变高。',
    '第一次玩可以先进「训练场」；联机在游戏自己的大厅里「联机 → 创建房间 / 加入」。'
  ],
  rules: `<p><b>吃鸡</b>：毒雾逐渐收缩，活到最后的人（双人模式是队伍）获胜；中途会有补给空投、流星雨和毒雾暴涨。</p>
<p><b>宝石争霸</b>：抢中间矿井的宝石，一队攒够 10 颗并守住 15 秒获胜。<b>乱斗足球</b>：带球冲刺，攻击键传球、大招射门，先进 2 球获胜。<b>赏金猎人</b>：击败对手拿走他头顶的星星，时间到星多的一队赢。<b>机甲 Boss</b>：三人合力打倒钢铁巨像。</p>
<p>每位英雄每局有 3 次副技能，开局前从两个星徽之力里选一个。AI 分简单、普通、困难三档，可开启自动调节。</p>`,
  icon(g, w, h) {
    const D = BX.draw;
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f6c27a'); sky.addColorStop(1, '#f0a35e');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.arc(w * 0.78, h * 0.24, 13, 0, Math.PI * 2); g.fill();
    const dune = (y, a, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); g.lineTo(0, y); g.bezierCurveTo(w * 0.3, y - a, w * 0.55, y + a, w, y - a * 0.4); g.lineTo(w, h); g.closePath(); g.fill(); };
    dune(h * 0.58, 14, '#e2a868'); dune(h * 0.72, 10, '#d8935a'); dune(h * 0.86, 8, '#c97f4b');
    // cactus
    g.fillStyle = '#4f8a4a'; D.rr(g, w * 0.12, h * 0.42, 8, 34, 4); g.fill(); D.rr(g, w * 0.12 - 9, h * 0.5, 7, 14, 3.5); g.fill(); D.rr(g, w * 0.12 + 10, h * 0.46, 7, 12, 3.5); g.fill();
    // glowing energy cube
    g.save(); g.shadowColor = '#6dff8f'; g.shadowBlur = 10; g.fillStyle = '#3ee070'; g.translate(w * 0.3, h * 0.78); g.rotate(0.5); g.fillRect(-6, -6, 12, 12); g.restore();
    // an original round hero: goggles, scarf, little blaster
    const cx = w * 0.56, cy = h * 0.6;
    g.fillStyle = 'rgba(60,30,20,.25)'; g.beginPath(); g.ellipse(cx, cy + 22, 18, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a6fd8'; D.rr(g, cx - 12, cy + 2, 24, 18, 8); g.fill();
    g.fillStyle = '#ffd9b0'; g.beginPath(); g.arc(cx, cy - 6, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a4a2a'; g.beginPath(); g.arc(cx, cy - 10, 14.5, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = '#2b2f3a'; D.rr(g, cx - 13, cy - 11, 26, 7, 3); g.fill();
    g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc(cx - 5, cy - 7.5, 3, 0, Math.PI * 2); g.arc(cx + 5, cy - 7.5, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e0392d'; D.rr(g, cx - 11, cy + 1, 22, 5, 2.5); g.fill();
    g.fillStyle = '#5a6470'; D.rr(g, cx + 10, cy + 6, 16, 6, 2); g.fill();
    // shot streaks
    g.strokeStyle = '#fff3b0'; g.lineWidth = 3; g.lineCap = 'round';
    for (const [x, y, l] of [[cx + 32, cy + 9, 12], [cx + 50, cy + 4, 9], [cx + 48, cy + 14, 8]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y - 1); g.stroke(); }
  },
  create(ctx) {
    const ui = ctx.ui('dr-wrap');
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:auto;background:#2a1830';
    if (BX.ARTIFACT) {   // the standalone folder isn't published with the single-file version
      ui.innerHTML = '<div class="bx-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:340px;text-align:center;line-height:1.7">沙丘乱斗需要在游戏厅网页版里玩：<br><b>chunxiao-lin-2023.github.io/Claude_space_0/baixi/</b></div>';
      return { st: {}, frame() {} };
    }
    const fr = document.createElement('iframe');
    fr.src = '../dunerumble/?embed=1';
    fr.title = '沙丘乱斗';
    fr.allow = 'fullscreen; autoplay';
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#2a1830';
    ui.appendChild(fr);
    ctx.status('沙丘乱斗 · 选英雄和模式后开战');
    const post = m => { try { fr.contentWindow && fr.contentWindow.postMessage(Object.assign({ dr: 1 }, m), '*'); } catch (e) {} };
    setTimeout(() => { try { fr.focus(); } catch (e) {} }, 300);
    return {
      st: {},
      frame() {},
      onPause(p) { post({ pause: !!p }); },
      destroy() { post({ pause: true }); try { fr.src = 'about:blank'; fr.remove(); } catch (e) {} }
    };
  }
});
