/* 记忆翻牌 — concentration / pairs game with tea-house motif cards. */
const D = BX.draw, C = BX.C;
const MOTIFS = ['茶壶', '盖碗', '灯笼', '折扇', '梅花', '锦鲤', '月饼', '毛笔', '印章', '竹子', '莲花', '铜钱', '葫芦', '风筝', '大鼓', '元宝', '糖葫芦', '祥云', '包子', '鞭炮'];
const TINT = ['#f1e0cf', '#e3ecf3', '#f6dcd2', '#efe6cf', '#f7e1e4', '#f6e6d3', '#f3e4c4', '#ece8de', '#f5dcd6', '#e1eedc', '#f5e3ea', '#f3ead0', '#f1ead2', '#e2ebf2', '#f4ddd3', '#f5ecd0', '#f6dede', '#e0eef0', '#f1ede4', '#f6dcd6'];
const SIZES = {'4x4': [4, 4], '4x6': [4, 6], '6x6': [6, 6]};

function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
/* draw motif k centred at (x,y) inside a box of size s */
function motif(g, k, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.lineCap = 'round'; g.lineJoin = 'round';
  const P = Math.PI;
  switch (k) {
    case 0: { // 茶壶
      g.fillStyle = '#7a3b22'; g.beginPath(); g.moveTo(-28, 2); g.quadraticCurveTo(-46, -4, -48, -22); g.lineTo(-41, -24); g.quadraticCurveTo(-38, -8, -22, 14); g.closePath(); g.fill();
      g.strokeStyle = '#7a3b22'; g.lineWidth = 7; g.beginPath(); g.arc(30, 6, 15, -P / 2, P / 2); g.stroke();
      const gr = g.createRadialGradient(-10, -4, 4, 0, 8, 36); gr.addColorStop(0, '#b0603a'); gr.addColorStop(1, '#6a2f18');
      g.fillStyle = gr; ell(g, 0, 8, 32, 25); g.fill();
      g.fillStyle = '#5a2512'; ell(g, 0, -14, 19, 6); g.fill(); g.fillStyle = '#8a4428'; D.circle(g, 0, -22, 6); g.fill();
      g.fillStyle = 'rgba(255,230,200,.3)'; ell(g, -12, 0, 9, 5, -.4); g.fill();
      g.fillStyle = '#4a1e0e'; ell(g, 0, 33, 22, 4); g.fill();
      break;
    }
    case 1: { // 盖碗
      g.fillStyle = '#dfe7ef'; ell(g, 0, 32, 42, 9); g.fill(); g.strokeStyle = '#2f5d8a'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#f7f4ec'; g.beginPath(); g.moveTo(-31, -4); g.quadraticCurveTo(-29, 30, 0, 30); g.quadraticCurveTo(29, 30, 31, -4); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#3c6fa0'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 11, 12, 4, 0, P * 2); g.stroke(); }
      g.fillStyle = '#f7f4ec'; ell(g, 0, -8, 33, 9); g.fill(); g.strokeStyle = '#2f5d8a'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#2f5d8a'; ell(g, 0, -17, 7, 4); g.fill();
      g.strokeStyle = 'rgba(120,120,120,.5)'; g.lineWidth = 2.5; for (const sx of [-10, 6]) { g.beginPath(); g.moveTo(sx, -24); g.bezierCurveTo(sx - 8, -32, sx + 8, -38, sx, -46); g.stroke(); }
      break;
    }
    case 2: { // 灯笼
      g.strokeStyle = '#6b4426'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -48); g.lineTo(0, -36); g.stroke();
      const gr = g.createRadialGradient(-8, -6, 4, 0, 2, 38); gr.addColorStop(0, '#ff7a4a'); gr.addColorStop(1, '#b0221a');
      g.fillStyle = gr; ell(g, 0, 2, 32, 30); g.fill();
      g.strokeStyle = 'rgba(110,20,10,.55)'; g.lineWidth = 2; for (const rx of [10, 21]) { ell(g, 0, 2, rx, 30); g.stroke(); }
      g.fillStyle = '#d9a12b'; g.fillRect(-15, -33, 30, 8); g.fillRect(-15, 29, 30, 8);
      g.strokeStyle = '#d9a12b'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3, 37); g.lineTo(i * 4, 50); g.stroke(); }
      D.text(g, '福', 0, 3, {size: 26, color: '#ffd76a', font: 'serif', weight: 900});
      break;
    }
    case 3: { // 折扇
      const cx = 0, cy = 34, R1 = 62, R0 = 16, a0 = -P * .9, a1 = -P * .1, ribs = 9;
      g.fillStyle = '#6b4426'; g.beginPath(); g.moveTo(cx, cy); for (let i = 0; i <= ribs; i++) { const a = a0 + (a1 - a0) * i / ribs; g.lineTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); } g.closePath(); g.fill();
      for (let i = 0; i < ribs; i++) {
        const a = a0 + (a1 - a0) * i / ribs, b = a0 + (a1 - a0) * (i + 1) / ribs;
        g.fillStyle = i % 2 ? '#f1e3c2' : '#e8d4aa'; g.beginPath();
        g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.lineTo(cx + Math.cos(a) * R1, cy + Math.sin(a) * R1);
        g.lineTo(cx + Math.cos(b) * R1, cy + Math.sin(b) * R1); g.lineTo(cx + Math.cos(b) * R0, cy + Math.sin(b) * R0); g.closePath(); g.fill();
      }
      g.strokeStyle = '#8a5a30'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R1, a0, a1); g.stroke();
      g.fillStyle = '#c23a2b'; for (const [px, py, r] of [[-22, -8, 5], [-14, -14, 4], [10, -18, 5], [20, -6, 4], [0, -2, 3]]) { D.circle(g, px, py, r); g.fill(); }
      g.strokeStyle = '#3a2414'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(-5, -18, 26, -12); g.stroke();
      g.fillStyle = '#c8a052'; D.circle(g, cx, cy, 4); g.fill();
      break;
    }
    case 4: { // 梅花
      g.strokeStyle = '#4a2e1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-46, 40); g.quadraticCurveTo(-20, 20, -6, 6); g.moveTo(-26, 26); g.quadraticCurveTo(-30, 0, -40, -14); g.stroke();
      const flower = (fx, fy, r) => {
        g.fillStyle = '#e8607a'; for (let i = 0; i < 5; i++) { const a = -P / 2 + i * P * 2 / 5; D.circle(g, fx + Math.cos(a) * r * .62, fy + Math.sin(a) * r * .62, r * .5); g.fill(); }
        g.fillStyle = '#fbd3dc'; D.circle(g, fx, fy, r * .32); g.fill();
        g.fillStyle = '#e0a020'; for (let i = 0; i < 5; i++) { const a = i * P * 2 / 5; D.circle(g, fx + Math.cos(a) * r * .22, fy + Math.sin(a) * r * .22, r * .07); g.fill(); }
      };
      flower(10, -6, 30); flower(-38, -16, 14); g.fillStyle = '#c94a5e'; D.circle(g, 30, 30, 6); g.fill(); D.circle(g, -18, 32, 5); g.fill();
      break;
    }
    case 5: { // 锦鲤
      g.strokeStyle = 'rgba(47,93,138,.35)'; g.lineWidth = 2; for (const r of [40, 30]) { ell(g, 6, 8, r, r * .55); g.stroke(); }
      g.fillStyle = '#f08a3a'; g.beginPath(); g.moveTo(28, 0); g.quadraticCurveTo(46, -16, 48, -2); g.quadraticCurveTo(46, 14, 28, 0); g.fill();
      g.fillStyle = '#fffaf0'; ell(g, -4, 0, 34, 15); g.fill();
      g.fillStyle = '#e04a2a'; ell(g, -10, -4, 12, 8, .3); g.fill(); ell(g, 12, 3, 9, 6, -.3); g.fill();
      g.fillStyle = '#f08a3a'; g.beginPath(); g.moveTo(-6, 10); g.quadraticCurveTo(0, 26, 10, 22); g.quadraticCurveTo(4, 14, 4, 10); g.fill();
      g.fillStyle = '#1b1510'; D.circle(g, -27, -4, 3); g.fill();
      g.strokeStyle = '#c86a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-36, 3); g.quadraticCurveTo(-44, 8, -46, 14); g.stroke();
      break;
    }
    case 6: { // 月饼
      g.fillStyle = '#b36a26'; g.beginPath();
      for (let i = 0; i <= 72; i++) { const a = i * P * 2 / 72, r = 40 + Math.cos(a * 12) * 3.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill();
      const gr = g.createRadialGradient(-8, -10, 4, 0, 0, 34); gr.addColorStop(0, '#f0b45c'); gr.addColorStop(1, '#c47a2e');
      g.fillStyle = gr; D.circle(g, 0, 0, 33); g.fill();
      g.strokeStyle = '#9a5a1e'; g.lineWidth = 2; D.circle(g, 0, 0, 24); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i * P / 4; g.beginPath(); g.arc(Math.cos(a) * 28, Math.sin(a) * 28, 3, 0, P * 2); g.stroke(); }
      D.text(g, '月', 0, 1, {size: 26, color: '#8a4a16', font: 'serif', weight: 900});
      break;
    }
    case 7: { // 毛笔
      g.rotate(-P / 4);
      g.fillStyle = '#c9955a'; D.rr(g, -6, -50, 12, 62, 5); g.fill();
      g.strokeStyle = '#8a5a30'; g.lineWidth = 2; for (const yy of [-30, -8]) { g.beginPath(); g.moveTo(-6, yy); g.lineTo(6, yy); g.stroke(); }
      g.fillStyle = '#c23a2b'; g.fillRect(-7, 8, 14, 6);
      g.fillStyle = '#1b1510'; g.beginPath(); g.moveTo(-8, 14); g.quadraticCurveTo(-10, 36, 0, 52); g.quadraticCurveTo(10, 36, 8, 14); g.closePath(); g.fill();
      g.fillStyle = '#2a190d'; D.circle(g, 0, -52, 4); g.fill();
      g.rotate(P / 4);
      g.strokeStyle = 'rgba(27,21,16,.75)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-44, 42); g.quadraticCurveTo(-22, 30, -4, 44); g.stroke();
      break;
    }
    case 8: { // 印章
      g.fillStyle = '#7a4a2a'; D.rr(g, -18, -48, 36, 30, 6); g.fill(); g.fillStyle = '#9a6a3a'; ell(g, 0, -48, 14, 6); g.fill();
      g.fillStyle = '#b23a2b'; D.rr(g, -32, -18, 64, 64, 6); g.fill();
      g.strokeStyle = '#fbe9d0'; g.lineWidth = 3; D.rr(g, -25, -11, 50, 50, 3); g.stroke();
      D.text(g, '茶', 0, 15, {size: 38, color: '#fbe9d0', font: 'serif', weight: 900});
      break;
    }
    case 9: { // 竹子
      for (const [bx, h0, w] of [[-14, -48, 10], [12, -36, 8]]) {
        g.fillStyle = '#4f8f4a'; g.fillRect(bx - w / 2, h0, w, 96 + (-48 - h0) * 0 + (48 - 48));
        g.fillRect(bx - w / 2, h0, w, 48 - h0);
        g.fillStyle = '#2f6b33'; for (let yy = h0 + 18; yy < 48; yy += 22) g.fillRect(bx - w / 2 - 1.5, yy, w + 3, 3);
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(bx - w / 2 + 1.5, h0, 2.5, 48 - h0);
      }
      g.fillStyle = '#3f8f4a';
      const leaf = (lx, ly, a, L) => { g.save(); g.translate(lx, ly); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -L * .18, L, 0); g.quadraticCurveTo(L * .5, L * .18, 0, 0); g.fill(); g.restore(); };
      leaf(-10, -20, -.5, 34); leaf(-10, -20, -1.1, 26); leaf(16, -2, .3, 30); leaf(16, -2, -.3, 26); leaf(-18, 10, P + .4, 28);
      break;
    }
    case 10: { // 莲花
      g.fillStyle = '#4f8f4a'; ell(g, 0, 34, 44, 10); g.fill(); g.strokeStyle = '#2f6b33'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 34); g.lineTo(30, 30); g.stroke();
      const petal = (a, L, wd, col) => { g.save(); g.translate(0, 26); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-wd, -L * .55, 0, -L); g.quadraticCurveTo(wd, -L * .55, 0, 0); g.fill(); g.restore(); };
      for (const a of [-1.2, 1.2]) petal(a, 40, 16, '#f2a6b6');
      for (const a of [-.6, .6]) petal(a, 50, 17, '#ec8aa0');
      petal(0, 56, 18, '#f7c2cf');
      g.strokeStyle = 'rgba(190,60,90,.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 22); g.lineTo(0, -22); g.stroke();
      break;
    }
    case 11: { // 铜钱
      const gr = g.createRadialGradient(-10, -12, 4, 0, 0, 44); gr.addColorStop(0, '#f2d37a'); gr.addColorStop(1, '#a87a22');
      g.fillStyle = gr; D.circle(g, 0, 0, 40); g.fill(); g.strokeStyle = '#8a6018'; g.lineWidth = 3; D.circle(g, 0, 0, 34); g.stroke();
      g.fillStyle = TINT[11]; g.fillRect(-11, -11, 22, 22); g.strokeRect(-11, -11, 22, 22);
      for (const [ch, px, py] of [['通', 0, -23], ['宝', 0, 23], ['元', -23, 0], ['茶', 23, 0]]) D.text(g, ch, px, py, {size: 14, color: '#6a4410', font: 'serif', weight: 900});
      break;
    }
    case 12: { // 葫芦
      g.strokeStyle = '#4a2e1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(4, -48, 12, -48); g.stroke();
      g.fillStyle = '#4f8f4a'; ell(g, 16, -42, 10, 5, .3); g.fill();
      const gr = g.createRadialGradient(-10, 8, 4, 0, 14, 36); gr.addColorStop(0, '#f0c050'); gr.addColorStop(1, '#c47a20');
      g.fillStyle = gr; D.circle(g, 0, 18, 28); g.fill(); D.circle(g, 0, -20, 18); g.fill();
      g.fillStyle = '#c23a2b'; g.fillRect(-12, -6, 24, 6); g.strokeStyle = '#c23a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, -3); g.quadraticCurveTo(22, 4, 18, 18); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, -12, 10, 6, 9, .4); g.fill();
      break;
    }
    case 13: { // 风筝
      g.strokeStyle = '#6b4426'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 26); g.bezierCurveTo(-20, 36, 20, 42, 6, 52); g.stroke();
      g.fillStyle = '#c23a2b'; for (const [bx, by] of [[-6, 34], [8, 44]]) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 6, by - 4); g.lineTo(bx - 6, by + 4); g.closePath(); g.moveTo(bx, by); g.lineTo(bx + 6, by - 4); g.lineTo(bx + 6, by + 4); g.closePath(); g.fill(); }
      g.fillStyle = '#2f5d8a'; g.beginPath(); g.moveTo(0, -46); g.lineTo(-36, -8); g.lineTo(0, 26); g.lineTo(36, -8); g.closePath(); g.fill();
      g.fillStyle = '#d9a12b'; g.beginPath(); g.moveTo(0, -46); g.lineTo(-36, -8); g.lineTo(0, -8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, 26); g.lineTo(36, -8); g.lineTo(0, -8); g.closePath(); g.fill();
      g.strokeStyle = '#3a2414'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -46); g.lineTo(0, 26); g.moveTo(-36, -8); g.lineTo(36, -8); g.stroke();
      g.fillStyle = '#fffaf0'; D.circle(g, 0, -8, 7); g.fill(); g.fillStyle = '#c23a2b'; D.circle(g, 0, -8, 3.5); g.fill();
      break;
    }
    case 14: { // 大鼓
      g.strokeStyle = '#6b4426'; g.lineWidth = 5; g.beginPath(); g.moveTo(-40, -44); g.lineTo(-6, -14); g.moveTo(40, -44); g.lineTo(6, -14); g.stroke();
      g.fillStyle = '#e8d0a0'; D.circle(g, -40, -44, 5); g.fill(); D.circle(g, 40, -44, 5); g.fill();
      g.fillStyle = '#a8261c'; g.fillRect(-34, -6, 68, 34); ell(g, 0, 28, 34, 10); g.fill();
      g.fillStyle = '#e8d6b0'; ell(g, 0, -6, 34, 10); g.fill(); g.strokeStyle = '#6b4426'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#e6c57d'; for (let i = 0; i < 7; i++) { const xx = -30 + i * 10; D.circle(g, xx, 2 + Math.abs(xx) * .05, 2.2); g.fill(); D.circle(g, xx, 30 + (1 - Math.abs(xx) / 34) * 6, 2.2); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-26, 4, 6, 26);
      break;
    }
    case 15: { // 元宝
      const gr = g.createLinearGradient(0, -30, 0, 30); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(1, '#c8901e');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-44, -6); g.quadraticCurveTo(-40, 30, 0, 30); g.quadraticCurveTo(40, 30, 44, -6); g.quadraticCurveTo(24, 6, 0, 6); g.quadraticCurveTo(-24, 6, -44, -6); g.fill();
      g.strokeStyle = '#9a6a10'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#f5c84a'; ell(g, 0, -4, 18, 16); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, -6, -10, 5, 4); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.9)'; g.lineWidth = 2; for (const [sx, sy] of [[-34, -28], [34, -30], [30, 40]]) { g.beginPath(); g.moveTo(sx - 5, sy); g.lineTo(sx + 5, sy); g.moveTo(sx, sy - 5); g.lineTo(sx, sy + 5); g.stroke(); }
      break;
    }
    case 16: { // 糖葫芦
      g.strokeStyle = '#a8723d'; g.lineWidth = 4; g.beginPath(); g.moveTo(-26, 48); g.lineTo(24, -48); g.stroke();
      for (let i = 0; i < 4; i++) {
        const t = .12 + i * .21, px = -26 + 50 * t + 0, py = 48 - 96 * t;
        const gr = g.createRadialGradient(px - 5, py - 5, 2, px, py, 14); gr.addColorStop(0, '#ff6a5a'); gr.addColorStop(1, '#a8160e');
        g.fillStyle = gr; D.circle(g, px, py, 13); g.fill(); g.fillStyle = 'rgba(255,255,255,.65)'; ell(g, px - 4, py - 5, 4, 2.5, -.6); g.fill();
      }
      break;
    }
    case 17: { // 祥云
      g.strokeStyle = '#2f7f8a'; g.lineWidth = 6;
      const swirl = (sx, sy, r, dir) => { g.beginPath(); for (let t = 0; t <= 1.6 * P; t += .1) { const rr = r * (1 - t / (2.2 * P)); g.lineTo(sx + Math.cos(t * dir) * rr, sy + Math.sin(t * dir) * rr); } g.stroke(); };
      g.fillStyle = '#bfe0e0'; g.beginPath(); g.moveTo(-44, 20); g.quadraticCurveTo(-46, -8, -18, -8); g.quadraticCurveTo(-12, -32, 12, -24); g.quadraticCurveTo(40, -26, 38, 2); g.quadraticCurveTo(50, 20, 30, 22); g.closePath(); g.fill();
      swirl(-20, 6, 14, 1); swirl(14, -6, 16, -1); swirl(34, 12, 8, 1);
      g.beginPath(); g.moveTo(-44, 20); g.lineTo(30, 22); g.quadraticCurveTo(46, 30, 34, 40); g.stroke();
      break;
    }
    case 18: { // 包子
      g.fillStyle = 'rgba(0,0,0,.12)'; ell(g, 0, 32, 40, 8); g.fill();
      const gr = g.createRadialGradient(-10, -10, 4, 0, 4, 44); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e6dccb');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-40, 28); g.quadraticCurveTo(-44, -14, 0, -26); g.quadraticCurveTo(44, -14, 40, 28); g.closePath(); g.fill();
      g.strokeStyle = '#c9b89a'; g.lineWidth = 2.2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 3, -22); g.quadraticCurveTo(i * 9, -10, i * 12, 2); g.stroke(); }
      g.fillStyle = '#e8607a'; D.circle(g, 0, -24, 4); g.fill();
      break;
    }
    case 19: { // 鞭炮
      g.strokeStyle = '#6b4426'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -44); g.lineTo(0, 44); g.stroke();
      for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) {
        g.save(); g.translate(sd * 9, -36 + i * 18); g.rotate(sd * .5);
        g.fillStyle = '#c8261c'; D.rr(g, -6, -5, 12 + 6, 10, 2); g.fill(); g.fillStyle = '#e6c57d'; g.fillRect(-6, -5, 3, 10); g.restore();
      }
      g.fillStyle = '#ffb030'; for (const [sx, sy] of [[0, -48], [-6, -50], [6, -50]]) { D.circle(g, sx, sy, 3); g.fill(); }
      break;
    }
  }
  g.restore();
}

function cardBack(g, x, y, w, h) {
  const r = w * .1;
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#9a3226'); gr.addColorStop(1, '#6e1d14');
  g.fillStyle = gr; D.rr(g, x, y, w, h, r); g.fill();
  g.save(); D.rr(g, x + w * .08, y + w * .08, w * .84, h - w * .16, r * .6); g.clip();
  g.strokeStyle = 'rgba(230,197,125,.28)'; g.lineWidth = Math.max(1, w * .025);
  const st = w * .17;
  for (let yy = y; yy < y + h + st; yy += st) for (let xx = x; xx < x + w + st; xx += st) { g.strokeRect(xx + st * .2, yy + st * .2, st * .6, st * .6); }
  g.restore();
  g.strokeStyle = '#e6c57d'; g.lineWidth = Math.max(1.2, w * .03); D.rr(g, x + w * .08, y + w * .08, w * .84, h - w * .16, r * .6); g.stroke();
  g.fillStyle = '#e6c57d'; D.circle(g, x + w / 2, y + h / 2, w * .2); g.fill();
  D.text(g, '茶', x + w / 2, y + h / 2 + w * .01, {size: w * .26, color: '#7a2318', font: 'serif', weight: 900});
}
function cardFace(g, x, y, w, h, k, o = {}) {
  const r = w * .1;
  g.fillStyle = '#fffaf0'; D.rr(g, x, y, w, h, r); g.fill();
  g.fillStyle = TINT[k]; D.rr(g, x + w * .06, y + w * .06, w * .88, h - w * .12, r * .7); g.fill();
  g.strokeStyle = o.glow || 'rgba(120,80,40,.35)'; g.lineWidth = o.glow ? Math.max(3, w * .06) : 1; D.rr(g, x, y, w, h, r); g.stroke();
  motif(g, k, x + w / 2, y + h * .44, Math.min(w * .82, h * .66));
  if (w > 46) D.text(g, MOTIFS[k], x + w / 2, y + h * .87, {size: Math.min(w * .17, 15), color: C.ink2, font: 'serif', weight: 700});
}

BX.register({
  id: 'memory', title: '记忆翻牌', cat: 'brain', order: 1, sub: '翻开两张，配成一对',
  desc: '桌上扣着成对的茶馆小物：茶壶、灯笼、折扇、锦鲤……每次翻开两张，图案相同就收下并再翻一次。一人可挑战最少翻牌次数，多人比谁配对最多。',
  kind: 'turn', seats: [1, 4], defSeats: 2,
  options: [{key: 'size', label: '牌阵', choices: [['4x4', '4×4（8对）'], ['4x6', '4×6（12对）'], ['6x6', '6×6（18对）']], def: '4x6'}],
  rules: `<p>所有牌两两成对，洗匀后背面朝上排成方阵。</p>
<p>轮到你时<b>翻开两张牌</b>：若图案相同，这一对归你，并且<b>可以继续再翻</b>；若不同，两张牌稍后自动翻回，轮到下一位。</p>
<p>所有牌都被配完时，<b>配对最多者获胜</b>；对数相同则并列。</p>
<p><b>单人挑战</b>（人数选 1 人）：用尽量少的翻牌次数（每翻两张算一次）把所有牌配完，会记录各牌阵的最佳成绩。</p>
<p>电脑会记住看过的牌，但初级、中级会逐渐忘记较早翻过的牌。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 5, base: '#7a4a2a', dark: '#3a1e0e'});
    const cw = w * .2, ch = cw * 1.3;
    const pos = [[.1, .14, 'b'], [.33, .1, 2], [.56, .14, 'b'], [.18, .52, 0], [.42, .5, 2], [.66, .52, 'b']];
    for (const [px, py, k] of pos) {
      const x = px * w, y = py * h;
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fillStyle = '#000'; D.rr(g, x, y, cw, ch, 4); g.fill(); g.restore();
      if (k === 'b') cardBack(g, x, y, cw, ch); else cardFace(g, x, y, cw, ch, k, {glow: k === 2 ? '#e0a020' : null});
    }
  },
  create(ctx) {
    const [R, Cn] = SIZES[ctx.opts.size] || SIZES['4x6'], N = R * Cn, n = ctx.n, solo = n === 1;
    const kinds = ctx.rng.shuffle(BX.range(MOTIFS.length)).slice(0, N / 2);
    const cards = ctx.rng.shuffle(kinds.concat(kinds));
    const st = {R, Cn, cards, gone: new Array(N).fill(-1), up: [], turn: 0, sc: new Array(n).fill(0), tries: 0, seen: new Array(N).fill(-1), nflip: 0, pend: null, last: [], over: false};
    const cv = ctx.canvas();
    const vis = {f: new Array(N).fill(0), gone: new Array(N).fill(0), shake: 0, glow: 0};
    let preview = -1;
    const bestRec = ctx.load('best.flips.' + (ctx.opts.size || '4x6'), null);

    /* ---------- layout ---------- */
    function L() {
      const W = cv.w, H = cv.h, portrait = H > W * 1.05;
      const strip = portrait ? {x: 0, y: 0, w: W, h: 62} : {x: 0, y: 0, w: Math.min(190, Math.max(130, W * .18)), h: H};
      const area = portrait ? {x: 0, y: strip.h, w: W, h: H - strip.h} : {x: strip.w, y: 0, w: W - strip.w, h: H};
      const flip = portrait && R !== Cn;
      const cols = flip ? R : Cn, rows = flip ? Cn : R, gap = .09, asp = 1.3;
      const f = BX.fit(area.w, area.h, cols + (cols - 1) * gap, rows * asp + (rows - 1) * gap, portrait ? 8 : 12);
      return {portrait, strip, area, flip, cols, rows, cw: f.s, ch: f.s * asp, gp: f.s * gap, ox: area.x + f.x, oy: area.y + f.y};
    }
    function rect(i, l) {
      const lr = Math.floor(i / Cn), lc = i % Cn;
      const sr = l.flip ? lc : lr, sc = l.flip ? lr : lc;
      return {x: l.ox + sc * (l.cw + l.gp), y: l.oy + sr * (l.ch + l.gp), w: l.cw, h: l.ch};
    }
    const cardAt = p => { const l = L(); for (let i = 0; i < N; i++) { const r = rect(i, l); if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i; } return -1; };
    const canFlip = i => i >= 0 && st.gone[i] < 0 && !st.up.includes(i) && !st.pend;

    ctx.on(cv.cv, 'pointerdown', e => {
      if (!ctx.canAct(st.turn)) return;
      const i = cardAt(cv.pos(e)); if (!canFlip(i)) return;
      ctx.act({i}, st.turn);
    });

    const nm = s => solo ? '你' : ctx.name(s);
    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.sc[s] + ' 对');
      if (solo) ctx.info(0, '翻 ' + st.tries + ' 次');
      if (st.over) return ctx.status('全部配完');
      const mine = ctx.isLocal(st.turn);
      if (st.pend === 'match') return ctx.status('<b style="color:#e6c57d">配对成功！</b>' + (solo ? '' : nm(st.turn) + ' 再翻一次'));
      if (st.pend === 'miss') return ctx.status('没配上，翻回去…');
      const who = solo ? '' : (ctx.hotseat ? ctx.name(st.turn) : mine ? '你' : ctx.name(st.turn));
      ctx.status(solo ? (st.up.length ? '再翻一张' : '翻开两张牌') : who + (st.up.length ? ' 翻第二张' : ' 翻牌') + (mine || ctx.hotseat ? '' : '…'));
    }

    function endGame() {
      st.over = true;
      if (solo) {
        let html = `共翻牌 <b>${st.tries}</b> 次（最少可能 ${N / 2} 次）`;
        const rec = ctx.best('flips.' + (ctx.opts.size || '4x6'), st.tries, 'min');
        if (!ctx.fast) html += rec.isNew ? '<br><b style="color:#b23a2b">新纪录！</b>' : `<br>最佳纪录：${rec.best} 次`;
        ctx.end({win: true, title: '全部配对', html, delay: 700});
        return;
      }
      const mx = Math.max(...st.sc), win = BX.range(n).filter(s => st.sc[s] === mx);
      ctx.end({winner: win.length === n ? -1 : win.length === 1 ? win[0] : win, text: BX.range(n).map(s => ctx.name(s) + ' ' + st.sc[s] + ' 对').join('　'), delay: 700});
    }

    const inst = {
      st,
      toMove: () => st.over || st.pend ? null : st.turn,
      valid: a => Number.isInteger(a.i) && canFlip(a.i) && st.up.length < 2,
      sysMove: () => st.pend && !st.over ? {a: {sys: st.pend}, delay: st.pend === 'match' ? 700 : 1150} : null,
      apply(a, by) {
        if (a.sys) {
          if (a.sys === 'match') {
            for (const i of st.up) st.gone[i] = st.turn;
            st.sc[st.turn]++; st.up = []; st.pend = null;
            if (st.gone.every(v => v >= 0)) { status(); endGame(); return; }
          } else { st.up = []; st.pend = null; if (!solo) st.turn = (st.turn + 1) % n; }
          status(); return;
        }
        const i = a.i; st.up.push(i); st.seen[i] = st.nflip++; st.last = st.up.slice();
        ctx.sfx('flip');
        if (st.up.length === 2) {
          st.tries++;
          const ok = st.cards[st.up[0]] === st.cards[st.up[1]];
          st.pend = ok ? 'match' : 'miss';
          if (!ctx.fast) ctx.after(260, () => { ctx.sfx(ok ? 'score' : 'buzz'); if (ok) vis.glow = 1; else vis.shake = 1; });
        }
        status();
      },
      async aiMove(seat, level) {
        // online guest: give the host a moment to finish its own turn bookkeeping (avoids a rejected request race)
        if (ctx.online && !ctx.isHost) await BX.sleep(BX.test ? 120 : 30);
        const P = st.nflip, mem = new Map();   // card idx -> kind for remembered cards
        const halfLife = [0, 4, 12, 999][level];
        for (let j = 0; j < N; j++) {
          if (st.gone[j] >= 0 || st.seen[j] < 0 || st.up.includes(j)) continue;
          const age = P - st.seen[j];
          if (level >= 3 || Math.random() < Math.pow(.5, age / halfLife)) mem.set(j, st.cards[j]);
        }
        const free = BX.range(N).filter(j => st.gone[j] < 0 && !st.up.includes(j));
        const unseen = free.filter(j => st.seen[j] < 0);
        const unknown = free.filter(j => !mem.has(j));
        const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
        if (level === 1 && Math.random() < .15) return {i: rnd(free)};
        if (st.up.length === 1) {
          const k = st.cards[st.up[0]];
          for (const [j, v] of mem) if (v === k) return {i: j};
          return {i: rnd(unseen.length ? unseen : unknown.length ? unknown : free)};
        }
        const byKind = {};
        for (const [j, v] of mem) { (byKind[v] = byKind[v] || []).push(j); if (byKind[v].length === 2) return {i: byKind[v][0]}; }
        return {i: rnd(unseen.length ? unseen : unknown.length ? unknown : free)};
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); const l = L();
        // table
        D.wood(g, 0, 0, cv.w, cv.h, {seed: 21, base: '#6e4428', dark: '#2e1a0c', grain: .22});
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(l.strip.x, l.strip.y, l.strip.w, l.strip.h);
        // cards
        const sp = BX.test ? 40 : 5.5;
        if (vis.shake > 0) vis.shake = Math.max(0, vis.shake - dt * 2.2);
        if (vis.glow > 0) vis.glow = Math.max(0, vis.glow - dt * 1.3);
        for (let i = 0; i < N; i++) {
          const tgt = st.up.includes(i) ? 1 : 0;
          vis.f[i] += BX.clamp(tgt - vis.f[i], -dt * sp, dt * sp);
          const gTarget = st.gone[i] >= 0 ? 1 : 0; vis.gone[i] += BX.clamp(gTarget - vis.gone[i], -dt * 3, dt * 3);
          const r = rect(i, l);
          // empty slot
          g.fillStyle = 'rgba(0,0,0,.16)'; D.rr(g, r.x, r.y, r.w, r.h, r.w * .1); g.fill();
          if (vis.gone[i] >= 1) { // owner mark
            if (!solo) { g.fillStyle = D.alpha(ctx.color(st.gone[i]), .55); D.circle(g, r.x + r.w / 2, r.y + r.h / 2, r.w * .1); g.fill(); }
            continue;
          }
          const t = st.gone[i] >= 0 ? 1 : vis.f[i], gk = vis.gone[i];
          let x = r.x, y = r.y, w = r.w, h = r.h;
          const sx = Math.abs(1 - 2 * t);
          const pend = st.pend && st.up.includes(i);
          if (pend && st.pend === 'miss' && vis.shake > 0) x += Math.sin(vis.shake * 40) * r.w * .05 * vis.shake;
          const lift = Math.sin(Math.PI * t) * r.h * .06 + (pend && st.pend === 'match' ? r.h * .04 : 0);
          g.save(); g.globalAlpha = 1 - gk;
          g.translate(x + w / 2, y + h / 2 - lift); const sc = 1 + gk * .25; g.scale(Math.max(.02, sx) * sc, sc);
          g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6 + lift; g.shadowOffsetY = 2 + lift * .6;
          g.fillStyle = '#000'; D.rr(g, -w / 2, -h / 2, w, h, w * .1); g.fill(); g.shadowColor = 'transparent';
          if (t < .5) cardBack(g, -w / 2, -h / 2, w, h);
          else cardFace(g, -w / 2, -h / 2, w, h, st.cards[i], {glow: pend && st.pend === 'match' ? '#e0a020' : pend ? '#c23a2b' : null});
          g.restore();
          if (preview === i) { g.strokeStyle = C.gold2; g.lineWidth = 3; D.rr(g, x - 2, y - 2, w + 4, h + 4, w * .12); g.stroke(); }
        }
        // score strip
        drawStrip(g, l);
      },
    };
    function drawStrip(g, l) {
      const S = l.strip;
      if (solo) {
        const items = [['翻牌次数', String(st.tries)], ['已配对', st.sc[0] + ' / ' + N / 2]];
        if (bestRec != null) items.push(['最佳纪录', bestRec + ' 次']);
        items.forEach((it, k) => {
          let x, y, w, h;
          if (l.portrait) { w = S.w / items.length; h = S.h; x = S.x + k * w; y = S.y; } else { w = S.w; h = 74; x = S.x; y = S.y + 16 + k * 84; }
          D.text(g, it[0], x + w / 2, y + h * .32, {size: 12, color: 'rgba(243,226,192,.7)'});
          D.text(g, it[1], x + w / 2, y + h * .68, {size: l.portrait ? 20 : 24, color: '#f3e2c0', font: 'deco', weight: 400});
        });
        return;
      }
      for (let s = 0; s < n; s++) {
        let x, y, w, h;
        if (l.portrait) { w = (S.w - 12) / n; h = S.h - 12; x = 6 + s * w; y = 6; } else { w = S.w - 16; h = Math.min(86, (S.h - 20) / n - 8); x = 8; y = 12 + s * (h + 8); }
        const on = st.turn === s && !st.over;
        g.fillStyle = on ? 'rgba(230,197,125,.22)' : 'rgba(255,255,255,.06)'; D.rr(g, x + 2, y, w - 4, h, 10); g.fill();
        if (on) { g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.stroke(); }
        const cx = x + 18;
        D.disc(g, cx, y + h / 2, 8, ctx.color(s), {shadow: false});
        const nameW = w - 44;
        D.text(g, ctx.name(s), cx + 14, y + h * .33, {size: l.portrait ? 12 : 14, color: '#f3e2c0', align: 'left', maxW: nameW});
        D.text(g, st.sc[s] + ' 对', cx + 14, y + h * .7, {size: l.portrait ? 16 : 20, color: on ? '#ffd76a' : '#e6c57d', align: 'left', font: 'deco', weight: 400});
      }
    }
    status();
    return inst;
  },
});
