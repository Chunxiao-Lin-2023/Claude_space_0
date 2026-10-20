/* ================= 十夜怪谈 · 主循环 ================= */
let lastT = now();
function updateHint() { W.hint = (iControl() && canMove()) ? facingEnt() : null; }
function frame() {
  const t = now(); const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  try {
    if (W && UI.scene === 'play') {
      if (isHost()) {
        if (!W.paused) { if (iControl()) updatePlayer(dt); else hostCheckRemoteTile(); hostTick(dt); }
        netTick(dt);
      } else {
        guestTick(dt);
        if (iControl() && !W.busy) { updatePlayer(dt); guestSendPos(dt); }
      }
      updateHint();
      camUpdate(dt);
      render(dt);
    } else { RT += dt; drawTitleBG(bx); blit(); }
    UI.sync(dt);
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
bindUI();
UI.show('title');
if (!NET_OK) { $('tHost').classList.add('dim'); $('tJoin').classList.add('dim'); if (window.__ARTIFACT__) $('tfoot').innerHTML += '<br>这个预览版只能单人游玩；双人联机请打开游戏厅网址'; }
requestAnimationFrame(frame);
/* 测试钩子（仅 ?debug=1） */
if (QS.get('debug') === '1') window.__dbg = {
  get W() { return W; }, NET, UI, CHAPTERS, startChapter, doAct, sendAct, SAPI, GEN: () => GEN, store, retryFromCP, facing: () => facingEnt(),
  ent: id => getEnt(id), tp(x, y, dir) { SAPI.pos(x, y, dir); },
  step(x, y) { SAPI.pos(x, y); onPlayerArrive(); },
  face(id) {   // 走到实体旁边并面向它（直接传送）；id 也可以是 [x,y]
    const m = curMap();
    const e = Array.isArray(id) ? m.ents.find(z => !z.hidden && Math.round(z.px / TS) <= id[0] && id[0] < Math.round(z.px / TS) + z.w && Math.round(z.py / TS) <= id[1] && id[1] < Math.round(z.py / TS) + z.h && z.on) : getEnt(id);
    if (!e) return false;
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const cand = [];
    for (let x = ex; x < ex + e.w; x++) { cand.push([x, ey + e.h, 3]); cand.push([x, ey - 1, 0]); }
    for (let y = ey; y < ey + e.h; y++) { cand.push([ex - 1, y, 2]); cand.push([ex + e.w, y, 1]); }
    if (!e.solid) cand.unshift([ex, ey, W.pl.dir]);
    let fb = null;   // 优先选一个「调查键真的会选中它」的位置
    for (const [x, y, d] of cand) if ((x === ex && y === ey && !e.solid) || passable(m, x, y, W.pl)) { SAPI.pos(x, y, d); if (facingEnt() === e) return true; if (!fb) fb = [x, y, d]; }
    if (fb) { SAPI.pos(fb[0], fb[1], fb[2]); return true; }
    return false;
  }
};
