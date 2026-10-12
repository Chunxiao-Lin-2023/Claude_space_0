// The house sounds: pre-rendered from the desktop synthesizer (mu-law), decoded on first use.
window.PawSound = (function () {
  let ac = null, master = null;
  const cache = new Map();
  let muted = false;
  try { muted = localStorage.getItem("pawpals.muted") === "1"; } catch (e) {}
  function decode(b64) {
    const bin = atob(b64), n = bin.length, rate = window.PawSoundData.rate;
    const buf = ac.createBuffer(1, n, rate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const y = bin.charCodeAt(i) / 127.5 - 1;
      d[i] = Math.sign(y) * (Math.pow(256, Math.abs(y)) - 1) / 255;
    }
    return buf;
  }
  return {
    init(ctx) {
      ac = ctx;
      const comp = ac.createDynamicsCompressor();
      master = ac.createGain(); master.gain.value = 0.9;
      master.connect(comp); comp.connect(ac.destination);
    },
    play(name, kind, volume) {
      if (!ac || muted || !window.PawSoundData) return;
      const S = window.PawSoundData.s;
      const list = (S[kind] && S[kind][name]) || (S.calico && S.calico[name]);
      if (!list || !list.length) return;
      const i = Math.floor(Math.random() * list.length), key = (S[kind] && S[kind][name] ? kind : "calico") + name + i;
      let buf = cache.get(key);
      if (!buf) { buf = decode(list[i]); cache.set(key, buf); }
      const src = ac.createBufferSource(); src.buffer = buf;
      src.playbackRate.value = 0.95 + Math.random() * 0.1;
      const g = ac.createGain(); g.gain.value = Math.max(0, Math.min(1.5, (volume == null ? 45 : volume) / 45));
      src.connect(g); g.connect(master); src.start();
    },
    toggleMute() { muted = !muted; try { localStorage.setItem("pawpals.muted", muted ? "1" : "0"); } catch (e) {} return muted; },
    isMuted() { return muted; },
  };
})();
