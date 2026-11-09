/* ===================== networking (PeerJS, 2 players, host authoritative) ===================== */
BX.net = (function () {
  const SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
  const OPTS = QS.get('peerhost') ? {host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1'} : {};
  const PREFIX = 'baixi-', CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const N = {role: null, code: '', peer: null, ctl: null, fst: null, other: null, lastRx: 0, hb: null, status: ''};
  const changed = () => document.dispatchEvent(new Event('bx-net'));
  const isArtifact = () => !!BX.ARTIFACT;
  function load() {
    return new Promise((res, rej) => {
      if (window.Peer) return res(); let i = 0;
      const next = () => { if (i >= SRC.length) return rej(new Error('load')); const s = document.createElement('script'); s.src = SRC[i++]; s.onload = () => window.Peer ? res() : next(); s.onerror = next; document.head.appendChild(s); };
      next();
    });
  }
  const up = () => !!(N.ctl && N.ctl.open && N.other);
  function send(o) { try { if (N.ctl && N.ctl.open) N.ctl.send(JSON.stringify(o)); } catch (e) {} }
  function fast(o) { try { const c = N.fst && N.fst.open ? N.fst : N.ctl; if (c && c.open) c.send(JSON.stringify(o)); } catch (e) {} }
  function rx(d) {
    let m; try { m = JSON.parse(d); } catch (e) { return; }
    N.lastRx = performance.now();
    if (m.t === 'ping') return;
    if (m.t === 'hello' && N.role === 'host') { N.other = {name: String(m.name || '茶客').slice(0, 10)}; send({t: 'welcome', name: BX.myName(), code: N.code}); N.status = ''; BX.sfx.play('bell'); BX.toast(N.other.name + (m.re ? ' 重新连上了' : ' 进入了茶馆')); changed(); setTimeout(() => BX.onRejoin && BX.onRejoin(), 50); return; }
    if (m.t === 'welcome' && N.role === 'guest') { clearTimeout(N.to); N.other = {name: String(m.name || '房主').slice(0, 10)}; N.status = ''; BX.sfx.play('bell'); BX.toast(R ? '已重新连上房间 ' + N.code : '已加入房间 ' + N.code); R = null; changed(); return; }
    if (m.t === 'name') { if (N.other) N.other.name = String(m.name || '').slice(0, 10); changed(); return; }
    if (m.t === 'bye') { gone(true); return; }
    if (m.t === 'busy') { leave(); N.status = '房间已满（最多 2 人）'; changed(); return; }
    BX.onNet && BX.onNet(m);
  }
  function startHB() {
    clearInterval(N.hb); N.lastRx = performance.now();
    N.hb = setInterval(() => {
      if (!N.ctl) return; send({t: 'ping'});
      if (N.other && performance.now() - N.lastRx > 15000) { try { N.ctl.close(); } catch (e) {} gone(); }
    }, 3000);
  }
  /* guest auto-reconnect: R = {code, n} while retrying after an unexpected drop */
  let R = null;
  function gone(deliberate) {
    const was = N.other; const role = N.role;
    if (role === 'host') { N.ctl = null; N.fst = null; N.other = null; changed(); if (was) BX.toast(was.name + ' 离开了房间'); BX.onNetGone && BX.onNetGone('host'); return; }
    if (role !== 'guest') return;
    const code = N.code; leave(true);
    if (!deliberate && code && was) {
      R = {code, n: 0}; N.status = '连接中断，正在重连…'; changed(); BX.toast('与房主的连接中断了，正在重连…', 2500);
      BX.onNetGone && BX.onNetGone('guest-retry'); setTimeout(retryJoin, 1200); return;
    }
    N.status = '与房主的连接断开了'; changed(); if (was) BX.toast('与房主的连接断开了');
    BX.onNetGone && BX.onNetGone('guest');
  }
  function retryJoin() {
    if (!R) return;
    if (R.n >= 5) { const c = R.code; R = null; N.status = '重连失败，可重新输入房间码 ' + c; changed(); BX.toast('重连失败'); BX.onNetGone && BX.onNetGone('guest'); return; }
    R.n++; join(R.code, true);
  }
  const failJoin = msg => { leave(true); if (R) { N.status = '连接中断，正在重连…（第 ' + R.n + ' 次）'; changed(); setTimeout(retryJoin, 2500); } else { N.status = msg; changed(); } };
  function leave(silent) {
    if (!silent) send({t: 'bye'});
    clearInterval(N.hb); clearTimeout(N.to);
    try { N.peer && N.peer.destroy(); } catch (e) {}
    Object.assign(N, {role: null, code: '', peer: null, ctl: null, fst: null, other: null, status: ''});
    changed();
  }
  async function host() {
    if (isArtifact()) { N.status = '这个版本不支持联机，请用游戏厅网址打开'; changed(); return; }
    leave(true); N.role = 'host'; N.status = '正在创建房间…'; changed();
    try { await load(); } catch (e) { leave(true); N.status = '联机组件加载失败，请检查网络'; changed(); return; }
    const open = tries => {
      const code = Array.from({length: 4}, () => CH[Math.floor(Math.random() * CH.length)]).join('');
      const peer = new Peer(PREFIX + code, OPTS); N.peer = peer; N.code = code;
      peer.on('open', () => { if (N.peer !== peer) return; N.status = '等待对方加入…'; startHB(); changed(); });
      peer.on('error', err => { if (N.peer !== peer) return; if (err.type === 'unavailable-id' && tries < 5) { try { peer.destroy(); } catch (e) {} open(tries + 1); } else if (!up()) { N.status = '房间出错（' + err.type + '）'; changed(); } });
      peer.on('disconnected', () => { if (N.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) {} });
      peer.on('connection', conn => {
        if (conn.label === 'fast') { N.fst = conn; conn.on('data', rx); return; }
        if (up()) { conn.on('open', () => { conn.send(JSON.stringify({t: 'busy'})); setTimeout(() => conn.close(), 300); }); return; }
        N.ctl = conn; conn.on('data', rx);
        conn.on('close', () => { if (N.ctl === conn) gone(); });
      });
    };
    open(0);
  }
  async function join(code, isRetry) {
    if (!isRetry) R = null;
    if (isArtifact()) { N.status = '这个版本不支持联机，请用游戏厅网址打开'; changed(); return; }
    code = String(code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) { N.status = '请输入 4 位房间码'; changed(); return; }
    leave(true); N.role = 'guest'; N.code = code; N.status = '正在连接房间 ' + code + ' …'; changed();
    try { await load(); } catch (e) { failJoin('联机组件加载失败，请检查网络'); return; }
    const peer = new Peer(undefined, OPTS); N.peer = peer;
    N.to = setTimeout(() => { if (N.role === 'guest' && !N.other) failJoin('连接超时：检查房间码，或让房主保持页面在前台'); }, isRetry ? 9000 : 15000);
    peer.on('error', err => { if (N.peer !== peer || N.other) return; failJoin(err.type === 'peer-unavailable' ? '找不到房间 ' + code : '连接失败（' + err.type + '）'); });
    peer.on('open', () => {
      const ctl = peer.connect(PREFIX + code, {label: 'ctl', reliable: true, serialization: 'raw'}); N.ctl = ctl;
      ctl.on('open', () => {
        send({t: 'hello', name: BX.myName(), v: BX.ver, re: !!R});
        const f = peer.connect(PREFIX + code, {label: 'fast', reliable: false, serialization: 'raw'}); N.fst = f; f.on('data', rx);
        startHB();
      });
      ctl.on('data', rx);
      ctl.on('close', () => { if (N.ctl === ctl) gone(); });
    });
  }
  addEventListener('beforeunload', () => { if (N.ctl) send({t: 'bye'}); });
  // phones kill WebRTC in the background: when the page comes back, notice a dead link right away
  document.addEventListener('visibilitychange', () => { if (!document.hidden && N.role === 'guest' && N.other && N.ctl && !N.ctl.open) gone(); });
  return {
    host: () => { R = null; return host(); }, join: c => join(c), leave: q => { R = null; leave(q); }, send, fast,
    get role() { return N.role; }, get code() { return N.code; }, get other() { return N.other; }, get status() { return N.status; },
    get up() { return up(); }, get retrying() { return !!R; }, cancelRetry() { R = null; },
    get isHost() { return N.role === 'host' && up(); }, get isGuest() { return N.role === 'guest' && up(); },
    _drop() { try { N.ctl && N.ctl.close(); } catch (e) {} try { N.fst && N.fst.close(); } catch (e) {} },   // tests: simulate a dropped link
    sendName() { send({t: 'name', name: BX.myName()}); },
  };
})();
