/* 剧本杀 · 入口 */
function act(a) {
  if (!G) return;
  if (NET.role === 'guest') { if (NET.conn && NET.conn.open) NET.conn.send({ t: 'act', a }); else toast('和房主的连接断了'); return; }
  apply(G, a, ME.seat); afterApply();
}
function afterApply() { aiAfter(); save(); netSend(); render(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && NET.role === 'host' && NET.peer && NET.peer.disconnected) try { NET.peer.reconnect(); } catch (e) { } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.close(); });
document.addEventListener('gesturestart', e => e.preventDefault());
if (window.__dbg) Object.defineProperty(window.__dbg, 'G', { get() { return G; }, set(v) { G = v; } });
if (window.__dbg) Object.assign(window.__dbg, { U, NET, apply, act, aiStep, suspicion, aiVote, enterPhase, newGame, render, SCRIPTS, ME: () => ME, setME: s => { ME = s; } });
render();
