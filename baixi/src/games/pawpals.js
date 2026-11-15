/* 猫猫咕咕的家 — the cat-house life sim lives in its own folder (../pawpals/: the desktop app's Python code running in
   Pyodide, own build + PeerJS rooms). Like 房产大亨 it is shown full-size inside the tea house in an iframe instead of
   having its own card in the game hub. ?embed=1 keeps online play on and turns the page's "back to the hall" actions
   into a message that brings the player back to the 百戏茶馆 lobby. */
BX.register({
  id: 'pawpals', title: '猫猫咕咕的家', cat: 'social', order: 3, sub: '养猫小屋 · 生活模拟',
  desc: '三花猫猫猫和狸花猫咕咕的三层小屋：爸爸妈妈和小宝的日常、院子和小镇出游、十几种对战小游戏。双击猫或家人就能自己操控，也能两个人联机住在一起。',
  alias: 'pawpals 猫猫 咕咕 养猫 宠物 小屋',
  kind: 'solo', hint: false, resume: false,
  howto: [
    '第一次打开要下载约 10 MB 的运行环境，之后浏览器会记住，再开就快了。',
    '点家具、开关灯、拉窗帘；<b>长按</b>（电脑上右键）猫、家人、家具或空白处出菜单；<b>双击</b>猫或家人就能自己操控。',
    '操控时触屏有摇杆和按钮；电脑上 WASD / 方向键走，空格跳，E 互动，F 拍 / 扔，Esc 放开。',
    '上方工具栏切换楼层、打开小镇地图和对战区；「☰ 菜单」里有联机（两个人用 4 位房间码住进同一间小屋）。',
    '小屋会自动存档；左上角「‹ 大厅」随时回到茶馆。'
  ],
  rules: `<p>这是一间会自己过日子的小屋：三花猫<b>猫猫</b>和狸花猫<b>咕咕</b>，还有爸爸、妈妈和小宝。他们会吃饭、睡觉、玩耍、出门，你可以看着，也可以双击任何一位自己来操控。</p>
<p>三层小屋加院子，小镇地图上还有各个地点可以去；对战区有十几种双人小游戏（对战里 J / K / L 攻击、技能、格挡），也能玩躲猫猫。</p>
<p>联机：在「☰ 菜单 → 联机」里开房间，把 4 位房间码告诉对方，两个人住进同一间小屋。这里的房间和茶馆右上角的联机房间是分开的。</p>`,
  icon(g, w, h) {
    const D = BX.draw;
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f6d9a8'); sky.addColorStop(1, '#e9b77e');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9fc67a'; g.fillRect(0, h * .82, w, h * .18);
    // house: three storeys
    const hx = w * .2, hw = w * .6, top = h * .26, fl = (h * .82 - top) / 3;
    g.fillStyle = '#b5523b'; g.beginPath(); g.moveTo(hx - 10, top + 2); g.lineTo(w / 2, h * .06); g.lineTo(hx + hw + 10, top + 2); g.closePath(); g.fill();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i % 2 ? '#f3e2c4' : '#fbeed6'; g.fillRect(hx, top + i * fl, hw, fl);
      g.fillStyle = 'rgba(90,60,30,.25)'; g.fillRect(hx, top + (i + 1) * fl - 2, hw, 2);
      g.fillStyle = '#ffe9a6'; D.rr(g, hx + hw * .62, top + i * fl + fl * .2, hw * .26, fl * .5, 3); g.fill();
      g.strokeStyle = '#8a5a34'; g.lineWidth = 1.5; g.strokeRect(hx + hw * .62, top + i * fl + fl * .2, hw * .26, fl * .5);
    }
    g.strokeStyle = '#7a4a2a'; g.lineWidth = 2; g.strokeRect(hx, top, hw, fl * 3);
    // a cat: body, head, ears, tail. patches: array of [dx, dy, r, color]
    const cat = (x, y, s, base, patches, flip) => {
      g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
      g.strokeStyle = base; g.lineWidth = 3.2 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(9 * s, -2 * s); g.quadraticCurveTo(20 * s, -6 * s, 16 * s, -18 * s); g.stroke();
      g.fillStyle = base; g.beginPath(); g.ellipse(0, 0, 11 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(-10 * s, -8 * s, 6.5 * s, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-15 * s, -11 * s); g.lineTo(-14 * s, -18 * s); g.lineTo(-10 * s, -13 * s); g.fill();
      g.beginPath(); g.moveTo(-9 * s, -13 * s); g.lineTo(-5 * s, -17 * s); g.lineTo(-5 * s, -10 * s); g.fill();
      for (const [dx, dy, r, c] of patches) { g.fillStyle = c; g.beginPath(); g.arc(dx * s, dy * s, r * s, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#2b2118'; g.beginPath(); g.arc(-12 * s, -9 * s, 1.1 * s, 0, Math.PI * 2); g.arc(-8 * s, -9 * s, 1.1 * s, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    // 猫猫 (calico) on the ground floor, 咕咕 (tabby) on the roof-side ledge
    cat(w * .42, h * .79, 1.25, '#fbf6ee', [[3, -2, 4, '#e08a3c'], [-11, -11, 3, '#3a2c22'], [6, 3, 3, '#3a2c22']], false);
    cat(w * .74, h * .80, 1.15, '#a58a6a', [[-2, -3, 2.2, '#6d5640'], [4, -3, 2.2, '#6d5640'], [-10, -12, 1.8, '#6d5640']], true);
    // heart
    g.fillStyle = '#d0533f'; const hx2 = w * .58, hy2 = h * .62;
    g.beginPath(); g.moveTo(hx2, hy2 + 5); g.bezierCurveTo(hx2 - 9, hy2 - 2, hx2 - 4, hy2 - 9, hx2, hy2 - 4); g.bezierCurveTo(hx2 + 4, hy2 - 9, hx2 + 9, hy2 - 2, hx2, hy2 + 5); g.fill();
  },
  create(ctx) {
    const ui = ctx.ui('pp-wrap');
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:auto;background:#f3e2c4';
    if (BX.ARTIFACT) {   // the pawpals folder isn't published with the single-file version
      ui.innerHTML = '<div class="bx-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:340px;text-align:center;line-height:1.7">猫猫咕咕的家需要在游戏厅网页版里玩：<br><b>chunxiao-lin-2023.github.io/Claude_space_0/baixi/</b></div>';
      return { st: {}, frame() {} };
    }
    const fr = document.createElement('iframe');
    fr.src = '../pawpals/?embed=1';
    fr.title = '猫猫咕咕的家';
    fr.allow = 'fullscreen; autoplay; clipboard-write';
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#f3e2c4';
    ui.appendChild(fr);
    ctx.status('猫猫咕咕的家 · 双击猫或家人就能操控');
    const post = m => { try { fr.contentWindow && fr.contentWindow.postMessage(Object.assign({ pawpals: 1 }, m), '*'); } catch (e) {} };
    // the house's own "回游戏厅 / 关闭小屋" actions ask to go back to the tea-house lobby
    ctx.on(window, 'message', e => { if (e.source === fr.contentWindow && e.data && e.data.pawpals && e.data.lobby) BX.toLobby(); });
    setTimeout(() => { try { fr.focus(); } catch (e) {} }, 300);
    return {
      st: {},
      frame() {},
      destroy() { post({ save: 1 }); setTimeout(() => { try { fr.src = 'about:blank'; fr.remove(); } catch (e) {} }, 60); }
    };
  }
});
