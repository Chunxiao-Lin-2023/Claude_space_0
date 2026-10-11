// Drives render.html in headless Chromium (SwiftShader) and dumps PNG frames.
// usage: node run.mjs preview|units|props [unitFilter]
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'frames');
const mode = process.argv[2] || 'preview', filt = process.argv[3];
const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript'};
const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': types[path.extname(f)] || 'application/octet-stream'}); s.end(d); });
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const page = await browser.newPage();
page.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 1; });
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://127.0.0.1:${port}/render/render.html`);
await page.waitForFunction(() => window.READY, null, {timeout: 60000});

export const ANIMS = {
  warmage: {idle: 1, walk: 8, cast: 5, die: 5},
  sorc: {idle: 1, walk: 8, cast: 5, die: 5},
  grunt: {idle: 1, walk: 8, attack: 6, die: 5},
  kobold: {idle: 1, walk: 8, attack: 5, die: 5},
  archer: {idle: 1, walk: 8, attack: 6, die: 5},
  ogre: {idle: 1, walk: 8, attack: 7, die: 5},
  bat: {walk: 6, attack: 5, die: 5},
  chief: {idle: 1, walk: 8, attack: 7, die: 5},
};
const PROPS = {spikes: 3, tar: 1, spring: 2, barricade: 2, arrowwall: 2, brimstone: 2, grinder: 3, frost: 2, rift: 1, barrel: 1, crate: 1, brazier: 1, bones: 1};
const DIRS4 = {spring: [0, 2, 4, 6], arrowwall: [0, 2, 4, 6], grinder: [0, 2, 4, 6]};

function save(dir, name, r) {
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, name + '.png'), Buffer.from(r.url.split(',')[1], 'base64'));
  return {ax: r.ax, ay: r.ay, w: r.w, h: r.h};
}
const t0 = Date.now();
if (mode === 'preview') {
  const dir = path.join(OUT, '_preview');
  for (const u of Object.keys(ANIMS)) {
    if (filt && !filt.split(',').includes(u)) continue;
    const meta = {};
    for (const [a, n] of Object.entries(ANIMS[u])) {
      const picks = n === 1 ? [0] : [0, Math.floor(n / 3), Math.floor(2 * n / 3)];
      for (const f of picks) for (const d of [2, 1, 0, 7, 6, 3]) {
        meta[`${u}_${a}_${f}_${d}`] = save(dir, `${u}_${a}_${f}_${d}`, await page.evaluate(([u, a, t, d]) => window.renderUnit(u, a, t, d), [u, a, f / n, d]));
      }
    }
    fs.writeFileSync(path.join(dir, u + '.json'), JSON.stringify(meta));
  }
} else if (mode === 'units') {
  for (const u of Object.keys(ANIMS)) {
    if (filt && !filt.split(',').includes(u)) continue;
    const dir = path.join(OUT, u), meta = {anims: ANIMS[u], frames: {}};
    for (const [a, n] of Object.entries(ANIMS[u])) for (let f = 0; f < n; f++) for (let d = 0; d < 8; d++) {
      const t = a === 'die' ? f / (n - 1) : f / n;
      meta.frames[`${a}_${f}_${d}`] = save(dir, `${a}_${f}_${d}`, await page.evaluate(([u, a, t, d]) => window.renderUnit(u, a, t, d), [u, a, t, d]));
    }
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
    console.log(u, 'done', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
} else if (mode === 'props') {
  const dir = path.join(OUT, 'props'), meta = {};
  for (const [p, n] of Object.entries(PROPS)) {
    if (filt && !filt.split(',').includes(p)) continue;
    for (let f = 0; f < n; f++) for (const d of (DIRS4[p] || [2])) {
      meta[`${p}_${f}_${d}`] = save(dir, `${p}_${f}_${d}`, await page.evaluate(([p, f, d]) => window.renderProp(p, f, d), [p, f, d]));
    }
  }
  const old = fs.existsSync(path.join(dir, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'))) : {};
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(Object.assign(old, meta)));
}
console.log('total', ((Date.now() - t0) / 1000).toFixed(1) + 's');
await browser.close(); srv.close();
