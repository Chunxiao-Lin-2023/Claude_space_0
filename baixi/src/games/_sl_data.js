/* shared helpers for the solo games solitaire / minesweeper / sudoku / huarongdao / tangram / mjlink */
BX.data.slkit = (function () {
  const K = {};
  K.fmt = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + String(s % 60).padStart(2, '0'); };
  let cssDone = false;
  K.css = function () {
    if (cssDone) return; cssDone = true;
    const s = document.createElement('style');
    s.textContent = `
.sk-bar{position:absolute;display:flex;gap:6px;pointer-events:none;z-index:2;box-sizing:border-box}
.sk-bar.bot{top:auto;left:0;right:0;bottom:0;height:62px;padding:6px 8px 8px;justify-content:center;align-items:stretch}
.sk-bar.side{left:auto;top:0;bottom:0;right:0;width:74px;padding:6px 6px 6px 2px;flex-direction:column;justify-content:center}
.sk-bar > button{pointer-events:auto;flex:1 1 0;max-width:96px;min-width:0;min-height:44px;border:none;border-radius:12px;background:linear-gradient(180deg,rgba(84,55,30,.94),rgba(46,28,14,.94));color:#f3e2c0;box-shadow:inset 0 0 0 1px rgba(230,197,125,.38),0 3px 8px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;font:600 12px/1.15 -apple-system,"PingFang SC","Noto Sans SC",sans-serif;padding:2px;cursor:pointer;white-space:nowrap}
.sk-bar.side > button{max-width:none;max-height:60px}
.sk-bar > button i{font-style:normal;font-size:19px;line-height:1.15;font-family:"Noto Serif SC","Songti SC",serif;font-weight:700}
.sk-bar > button.on{background:linear-gradient(180deg,#d0533f,#a33022);color:#fff}
.sk-bar > button.gold{background:linear-gradient(180deg,#e6c57d,#c8a052);color:#3a2410}
.sk-bar > button:disabled{opacity:.38;cursor:default}
.sk-bar > button:active:not(:disabled){transform:translateY(1px);filter:brightness(1.1)}
.sk-pick{position:absolute;inset:0;background:rgba(20,12,5,.6);display:flex;align-items:center;justify-content:center;z-index:5;padding:10px;box-sizing:border-box}
.sk-pick .pk-box{background:#f3e9d2;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.5);width:min(720px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden}
.sk-pick .pk-h{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px;font:400 22px "ZCOOL XiaoWei","Noto Serif SC",serif;color:#2b2118;letter-spacing:2px}
.sk-pick .pk-h button{border:none;background:transparent;font-size:22px;width:44px;height:44px;color:#8c7a63}
.sk-pick .pk-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;padding:6px 12px 14px;overflow:auto}
.sk-pick .pk-it{position:relative;border:1px solid rgba(94,75,56,.25);border-radius:12px;background:rgba(255,255,255,.55);padding:6px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;min-height:44px;font:600 13px -apple-system,"PingFang SC",sans-serif;color:#2b2118}
.sk-pick .pk-it.cur{border-color:#b23a2b;box-shadow:0 0 0 2px rgba(178,58,43,.35)}
.sk-pick .pk-it small{font-weight:500;font-size:11px;color:#8c7a63}
.sk-pick .pk-it canvas{width:88px;height:66px}
.sk-pick .pk-it .ok{position:absolute;right:5px;top:4px;width:22px;height:22px;border-radius:50%;background:#b23a2b;color:#fff3e3;font:700 13px/22px serif;text-align:center}
.sk-ban{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:4;display:flex;gap:8px;align-items:center;padding:8px 10px 8px 14px;border-radius:14px;background:rgba(30,18,8,.88);color:#f3e2c0;font:600 14px -apple-system,"PingFang SC",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.45);white-space:nowrap}
.sk-ban .bx-btn{min-height:40px;padding:6px 12px;font-size:14px}
`;
    document.head.append(s);
  };
  /* toolbar of big buttons: bottom row normally, right column on short landscape screens */
  K.bar = function (ctx, items) {
    K.css();
    const el = ctx.ui('sk-bar bot'), b = {};
    for (const it of items) {
      const bt = BX.h('button', {title: it.t}, BX.h('i', {text: it.ic}), BX.h('span', {text: it.t}));
      if (it.cls) bt.classList.add(it.cls);
      ctx.on(bt, 'click', e => { e.stopPropagation(); if (bt.disabled) return; it.on(); });
      ctx.on(bt, 'pointerdown', e => e.stopPropagation());
      el.append(bt); b[it.k] = bt;
    }
    let mode = '', key = '', ar = null;
    return {
      el, b,
      area(w, hh) {
        const k = w + 'x' + hh; if (k === key && ar) return ar; key = k;
        const side = hh < 520 && w > hh * 1.3, m = side ? 'side' : 'bot';
        if (m !== mode) { mode = m; el.className = 'gm-ui sk-bar ' + m; }
        ar = side ? {x: 0, y: 0, w: w - (el.offsetWidth || 74), h: hh, side} : {x: 0, y: 0, w, h: hh - (el.offsetHeight || 62), side};
        return ar;
      },
      label(k, t, ic) { const x = b[k]; if (!x) return; x.lastChild.textContent = t; if (ic) x.firstChild.textContent = ic; },
      on(k, f) { b[k] && b[k].classList.toggle('on', !!f); },
      dis(k, f) { if (b[k]) b[k].disabled = !!f; },
    };
  };
  K.status = ctx => { let last = null; return s => { if (s !== last) { last = s; ctx.status(s); } }; };
  /* modal-ish chooser grid inside the game. items: [{label, sub, done, cur, draw(g,w,h)}] → onPick(i) */
  K.picker = function (ctx, title, items, onPick, onClose) {
    K.css();
    const ov = BX.h('div', {class: 'sk-pick'});
    const close = () => { ov.remove(); onClose && onClose(); };
    const grid = BX.h('div', {class: 'pk-g'});
    items.forEach((it, i) => {
      const cv = BX.h('canvas', {width: 176, height: 132});
      const gg = cv.getContext('2d'); gg.scale(2, 2); try { it.draw && it.draw(gg, 88, 66); } catch (e) {}
      const el = BX.h('div', {class: 'pk-it' + (it.cur ? ' cur' : '')}, it.draw ? cv : null, BX.h('div', {text: it.label}), it.sub ? BX.h('small', {text: it.sub}) : null, it.done ? BX.h('div', {class: 'ok', text: '✓'}) : null);
      el.addEventListener('click', () => { ov.remove(); onPick(i); });
      grid.append(el);
    });
    ov.append(BX.h('div', {class: 'pk-box'}, BX.h('div', {class: 'pk-h'}, BX.h('span', {text: title}), BX.h('button', {text: '✕', on: {click: close}})), grid));
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.addEventListener('pointerdown', e => e.stopPropagation());
    ctx.el.append(ov);
    return ov;
  };
  /* particles: sparks, petals and plum blossoms */
  const COL = ['#e05a47', '#f2b8a0', '#e6c57d', '#fff3e0', '#d0533f', '#f7d9c4', '#c8a052'];
  K.fx = function () {
    const ps = [];
    const add = p => { if (ps.length < 900) ps.push(p); };
    return {
      burst(x, y, n = 24, o = {}) {
        const cols = o.colors || COL;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, sp = (o.sp || 220) * (.35 + Math.random() * .85);
          add({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 60), g: o.g != null ? o.g : 420, life: 0, max: (o.life || .9) * (.6 + Math.random() * .7), c: cols[i % cols.length], s: (o.size || 4) * (.6 + Math.random() * .8), k: o.kind || 'spark', r: Math.random() * 6, vr: (Math.random() - .5) * 9, sw: 0});
        }
      },
      rain(w, hh, n = 70, o = {}) {
        for (let i = 0; i < n; i++) add({x: Math.random() * w, y: -20 - Math.random() * hh * .8, vx: (Math.random() - .5) * 40, vy: 50 + Math.random() * 90, g: 0, life: 0, max: 4 + Math.random() * 2.5, c: COL[i % COL.length], s: (o.size || 7) * (.7 + Math.random() * .6), k: Math.random() < .45 ? 'flower' : 'petal', r: Math.random() * 6, vr: (Math.random() - .5) * 3, sw: Math.random() * 6});
      },
      draw(g, dt) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i]; p.life += dt; if (p.life >= p.max) { ps.splice(i, 1); continue; }
          p.vy += p.g * dt; p.x += (p.vx + (p.k !== 'spark' ? Math.sin(p.life * 2 + p.sw) * 30 : 0)) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          const a = 1 - Math.pow(p.life / p.max, 2);
          g.save(); g.globalAlpha = Math.max(0, a); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
          if (p.k === 'spark') { g.beginPath(); for (let j = 0; j < 4; j++) { const an = j * Math.PI / 2; g.lineTo(Math.cos(an) * p.s, Math.sin(an) * p.s); g.lineTo(Math.cos(an + Math.PI / 4) * p.s * .35, Math.sin(an + Math.PI / 4) * p.s * .35); } g.closePath(); g.fill(); }
          else if (p.k === 'petal') { g.beginPath(); g.ellipse(0, 0, p.s, p.s * .55, 0, 0, Math.PI * 2); g.fill(); }
          else { for (let j = 0; j < 5; j++) { const an = j * Math.PI * 2 / 5; g.beginPath(); g.arc(Math.cos(an) * p.s * .55, Math.sin(an) * p.s * .55, p.s * .48, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#f7d36a'; g.beginPath(); g.arc(0, 0, p.s * .28, 0, Math.PI * 2); g.fill(); }
          g.restore();
        }
      },
      get n() { return ps.length; },
      clear() { ps.length = 0; },
    };
  };
  /* table backgrounds */
  K.table = function (g, w, hh, kind) {
    if (kind === 'felt') {
      const gr = g.createRadialGradient(w / 2, hh * .45, 30, w / 2, hh / 2, Math.max(w, hh) * .75);
      gr.addColorStop(0, '#2f7555'); gr.addColorStop(1, '#173f2c'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      g.save(); g.globalAlpha = .06; g.strokeStyle = '#fff'; g.lineWidth = 1;
      for (let i = -hh; i < w; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + hh, hh); g.stroke(); }
      g.restore();
    } else {
      BX.draw.wood(g, 0, 0, w, hh, {base: '#7a4b28', dark: '#3d2210', seed: 5, grain: .22});
      const gr = g.createRadialGradient(w / 2, hh / 2, Math.min(w, hh) * .3, w / 2, hh / 2, Math.max(w, hh) * .8);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    }
  };
  /* small seal stamp */
  K.seal = function (g, x, y, s, ch, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || -.08);
    g.fillStyle = '#b23a2b'; BX.draw.rr(g, -s / 2, -s / 2, s, s, s * .14); g.fill();
    g.strokeStyle = '#f6dcc8'; g.lineWidth = Math.max(1, s * .05); BX.draw.rr(g, -s * .4, -s * .4, s * .8, s * .8, s * .08); g.stroke();
    BX.draw.text(g, ch, 0, s * .03, {size: s * .58, color: '#fbeee0', font: 'serif', weight: 900});
    g.restore();
  };
  return K;
})();
