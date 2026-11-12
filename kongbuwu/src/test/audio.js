// node test/audio.js — 离线渲染每个音效和每种背景氛围：检查不报错、有声音、不爆音；再导出几段试听 WAV 到 /tmp/kbw/audio/
const { chromium } = require('playwright'); const fs = require('fs'); const D = '/tmp/kbw/audio'; fs.mkdirSync(D, { recursive: true });
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const r = await pg.evaluate(async () => { const out = { sfx: {}, mus: {}, wav: {} }; const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
    for (const k of Object.keys(SFX)) { const x = await auRender(4, () => sfxRaw(k)); out.sfx[k] = [+x.peak.toFixed(3), +x.rms.toFixed(4)]; }
    const musR = async (m, secs, extra) => auRender(secs, c => { MUS.drone = null; MUS.mood = ''; MUS.next = {}; musicMode(m); for (let t = 0; t < secs - 2; t += .12) musicTick(t); if (extra) extra(c); });
    for (const m of Object.keys(MOODS)) { const x = await musR(m, 16); out.mus[m] = [+x.peak.toFixed(3), +x.rms.toFixed(4)]; }
    const at = (t, k) => { AU.off = t; sfxRaw(k); AU.off = 0; };
    const demo = await musR('mirror', 26, () => { at(4, 'clock'); at(8, 'breath'); at(12, 'whisper'); at(15, 'drip'); at(17, 'crack'); at(19.4, 'reverse'); at(20.3, 'stinger'); at(23, 'heart'); });
    out.wav.mirror = b64(auWav(demo.buf));
    const night = await musR('night', 24, () => { at(6, 'steps'); at(11, 'knock'); at(15, 'creak'); at(19, 'scream'); }); out.wav.night = b64(auWav(night.buf));
    const door = await musR('door', 20, () => { at(8, 'hum'); at(14, 'giggle'); at(16, 'bell'); }); out.wav.door = b64(auWav(door.buf));
    const fight = await musR('fight', 14, () => { at(5, 'heavy'); at(9, 'stinger'); }); out.wav.fight = b64(auWav(fight.buf));
    return out; });
  for (const k in r.wav) fs.writeFileSync(`${D}/${k}.wav`, Buffer.from(r.wav[k], 'base64'));
  const bad = []; for (const [k, v] of Object.entries(r.sfx)) if (!(v[0] > .005) || v[0] > .99) bad.push('sfx ' + k + ' ' + v); for (const [k, v] of Object.entries(r.mus)) if (!(v[1] > .002) || v[0] > .99) bad.push('mus ' + k + ' ' + v);
  console.log('sfx', JSON.stringify(r.sfx)); console.log('mus', JSON.stringify(r.mus)); console.log('bad', bad); console.log('errors', errs); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
