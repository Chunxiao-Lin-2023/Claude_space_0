/* 房产大亨 — the real-time property-flipping game lives in its own folder (../housemogul/, own build + PeerJS lobby);
   here it is shown full-size inside the tea house in an iframe, so it is reached from the 百戏茶馆 lobby instead of
   its own card in the game hub. The embedded page hides its own "back to hub" buttons (?embed=1) and follows
   the top bar's pause button through postMessage. */
BX.register({
  id: 'housemogul', title: '房产大亨', cat: 'social', order: 2, sub: '实时炒房，低买高卖',
  desc: '一座会自己长大的等距小城：开发商在空地盖新楼，老房子被拆，房价每秒都在涨跌，挂牌房倒计时一到就撤。看准便宜的买下，等价签变红「赚」再卖掉，攒够现金买下山顶豪宅。单人可对抗王老板，也能在游戏里开房间双人联机。',
  kind: 'solo', hint: false, resume: false,
  howto: [
    '地图上在卖的房子头上有<b>价签</b>，小圆圈是还能卖多久；<b>点房子或价签</b>弹出小卡片，一下就能「买下」。',
    '你的房子头上写着<b>现在卖能赚多少</b>，数字一直在跳；变成红色「赚」时点它再点「卖」。',
    '拖动地图平移，滚轮或双指缩放；右下角暂停和 1×/2×/3× 倍速，左下角「我的房」依次看自己的房子。',
    '双人联机在游戏自己的标题画面里「创建房间 / 加入」。'
  ],
  rules: `<p>城市一直在变：房价时涨时跌，房子随时挂出来卖，开发商在空地上盖新楼，老房子会被拆掉。挂牌价比市场价便宜就买下，等有人出高价时卖掉，攒够<b>现金</b>一次付清买下山顶豪宅就赢。一局限时 15 分钟，到时比总身家。</p>
<p>难度：简单（有「超值 / 卖!」提示，豪宅便宜）、普通、困难。玩法：纯粹（只有涨跌和买卖），或加上贷款、房租、装修、验房、新闻传闻、手续费。</p>
<p>刚买的房要过户 5 秒才能卖；有人抢着要时会亮起「抢手」，出价特别高。单人可以暂停、加速，也能加入电脑对手王老板；双人联机两人在同一座城里实时抢房。</p>`,
  icon(g, w, h) {
    const D = BX.draw;
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9ccbe0'); sky.addColorStop(1, '#7cae8a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const TW = 34, TH = 17, ox = w / 2, oy = 28;
    const iso = (x, y, z) => [ox + (x - y) * TW / 2, oy + (x + y) * TH / 2 - (z || 0)];
    const poly = (pts, c) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fillStyle = c; g.fill(); };
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) poly([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)], (x === 2 || y === 3) ? '#7a7f87' : ((x + y) & 1 ? '#8fbf6a' : '#86b764'));
    const box = (x, y, s, z, col, roof) => {
      const a = x + 0.15, b = y + 0.15, c = x + s - 0.15, d = y + s - 0.15;
      poly([iso(a, d, 0), iso(c, d, 0), iso(c, d, z), iso(a, d, z)], col);
      poly([iso(c, b, 0), iso(c, d, 0), iso(c, d, z), iso(c, b, z)], '#00000033');
      poly([iso(c, b, 0), iso(c, d, 0), iso(c, d, z), iso(c, b, z)], col); poly([iso(c, b, 0), iso(c, d, 0), iso(c, d, z), iso(c, b, z)], 'rgba(0,0,0,.25)');
      if (roof) { const m = iso(x + s / 2, y + s / 2, z + 12); poly([iso(a, d, z), iso(c, d, z), m], roof); poly([iso(c, b, z), iso(c, d, z), m], 'rgba(0,0,0,.3)'); poly([iso(c, b, z), iso(c, d, z), m], roof); poly([iso(c, b, z), iso(c, d, z), m], 'rgba(0,0,0,.28)'); }
      else poly([iso(a, b, z), iso(c, b, z), iso(c, d, z), iso(a, d, z)], '#cfd6dc');
    };
    box(0, 0, 1, 14, '#d9b38a', '#9a4a36'); box(0, 4, 1, 14, '#e6d2b3', '#7c3f30'); box(4, 0, 2, 46, '#b9c7d4');
    box(3, 4, 2, 22, '#f7efe0', '#2c3a50'); box(0, 1.6, 1, 22, '#c9b6a2');
    // price tag + rising arrow
    const tx = iso(0.5, 0.5, 30); g.fillStyle = 'rgba(16,24,36,.92)'; D.rr(g, tx[0] - 26, tx[1] - 16, 52, 18, 5); g.fill();
    g.fillStyle = '#f5c451'; D.rr(g, tx[0] - 24, tx[1] - 14, 18, 14, 3); g.fill();
    g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1d1406'; g.fillText('超', tx[0] - 15, tx[1] - 6.5);
    g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.fillText('¥36万', tx[0] + 10, tx[1] - 6.5);
    const mx = iso(4, 4, 70); g.fillStyle = '#c9952a'; D.rr(g, mx[0] - 24, mx[1] - 10, 48, 17, 5); g.fill();
    g.fillStyle = '#1d1406'; g.font = 'bold 10px sans-serif'; g.fillText('豪宅', mx[0], mx[1] - 1);
    g.strokeStyle = '#e0392d'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(w - 38, h - 16); g.lineTo(w - 26, h - 30); g.lineTo(w - 18, h - 24); g.lineTo(w - 6, h - 42); g.stroke();
    g.beginPath(); g.moveTo(w - 6, h - 42); g.lineTo(w - 14, h - 40); g.moveTo(w - 6, h - 42); g.lineTo(w - 7, h - 34); g.stroke();
  },
  create(ctx) {
    const ui = ctx.ui('hm-wrap');
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:auto;background:#86b9cc';
    if (BX.ARTIFACT) {   // the standalone folder isn't published with the single-file version
      ui.innerHTML = '<div class="bx-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:340px;text-align:center;line-height:1.7">房产大亨需要在游戏厅网页版里玩：<br><b>chunxiao-lin-2023.github.io/Claude_space_0/baixi/</b></div>';
      return { st: {}, frame() {} };
    }
    const fr = document.createElement('iframe');
    fr.src = '../housemogul/?embed=1';
    fr.title = '房产大亨';
    fr.allow = 'fullscreen; autoplay';
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#86b9cc';
    ui.appendChild(fr);
    ctx.status('房产大亨 · 低买高卖，攒钱买下山顶豪宅');
    const post = m => { try { fr.contentWindow && fr.contentWindow.postMessage(Object.assign({ hm: 1 }, m), '*'); } catch (e) {} };
    setTimeout(() => { try { fr.focus(); } catch (e) {} }, 300);
    return {
      st: {},
      frame() {},
      onPause(p) { post({ pause: !!p }); },
      destroy() { post({ pause: true }); try { fr.src = 'about:blank'; fr.remove(); } catch (e) {} }
    };
  }
});
