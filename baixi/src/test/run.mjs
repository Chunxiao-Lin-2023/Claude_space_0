// 百戏茶馆 test runner. Run through test/t.sh (it serialises browser use across parallel sessions).
//   bash test/t.sh --games gomoku,airhockey [--online] [--phone] [--level 2] [--time 60]
// For every game: lobby loads, AI-vs-AI ("bot") game in mode ai (+ local for turn games), screenshots at
// desktop/phone sizes, replay determinism for turn games, optional 2-client online game via a local PeerJS server.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import {spawn, execFileSync} from 'node:child_process';

const args = process.argv.slice(2); const arg = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const SRC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const games = arg('games', '') ? String(arg('games')).split(',') : null;
const TOOLS = '/home/claude/bxtools', OUTDIR = arg('out', TOOLS + '/shots');
const ROOT = fs.mkdtempSync('/tmp/bxsrv-'); fs.mkdirSync(ROOT + '/baixi');
execFileSync('python3', [SRC + '/build.py', ...(games ? ['--only', games.join(',')] : []), '--out', ROOT + '/baixi/index.html'], {stdio: 'inherit'});
const srv = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html; charset=utf-8'}); s.end(d); }); }).listen(0);
const port = srv.address().port, BASE = `http://127.0.0.1:${port}/baixi/`;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns', '--mute-audio']});
const TIME = +arg('time', 60) * 1000, LEVEL = +arg('level', 2);
const report = []; let fails = 0;
const peerjs = fs.readFileSync(TOOLS + '/node_modules/peerjs/dist/peerjs.min.js', 'utf8');
const VP = {desk: {width: 1280, height: 800}, ipad: {width: 1180, height: 820}, phoneP: {width: 393, height: 852}, phoneL: {width: 852, height: 393}};
const touchCtx = vp => ({viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});

async function page(vpName, q = '?test&bot', touch) {
  const vp = VP[vpName];
  const c = await browser.newContext(touch || vpName.startsWith('phone') ? touchCtx(vp) : {viewport: vp});
  await c.route(/peerjs\.min\.js/, r => r.fulfill({status: 200, contentType: 'text/javascript', body: peerjs}));
  await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const pg = await c.newPage(); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  pg.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|Failed to load resource/.test(m.text())) pg.errs.push('console: ' + m.text()); });
  await pg.goto(BASE + q); await pg.waitForFunction(() => window.BX && BX.lobby && document.querySelector('.tile'), null, {timeout: 20000});
  pg.ctxObj = c; return pg;
}
const shot = async (pg, id, name) => { fs.mkdirSync(OUTDIR + '/' + id, {recursive: true}); await pg.screenshot({path: `${OUTDIR}/${id}/${name}.png`}); };
const sstate = pg => pg.evaluate(() => { const S = BX.session(); return S ? {ended: !!S.ended, res: S.ended, log: S.log.length, st: S.inst && S.inst.st ? JSON.stringify(S.inst.st) : null, errs: BX.errors || [], turn: S.ctx.turn} : null; });

async function botGame(id, mode, vpName, extra = {}) {
  const pg = await page(vpName);
  const def = await pg.evaluate(id => { const d = BX.games[id]; return d && {kind: d.kind, modes: d.modes, seats: d.seats, title: d.title, hasRules: !!d.rules, hasIcon: !!d.icon}; }, id);
  if (!def) { await pg.ctxObj.close(); return {ok: false, msg: 'not registered'}; }
  await pg.evaluate(([id, mode, lv, ex]) => BX.quick(id, Object.assign({mode, level: lv, seed: 12345}, ex)), [id, mode, LEVEL, extra]);
  const t0 = Date.now(); let s, midShot = false;
  const limit = def.kind === 'realtime' ? Math.min(TIME, 45000) : def.kind === 'solo' ? 8000 : TIME;
  while (Date.now() - t0 < limit) {
    await pg.waitForTimeout(500); s = await sstate(pg);
    if (!midShot && Date.now() - t0 > 2500) { midShot = true; await shot(pg, id, `${mode}_${vpName}_mid`); }
    if (s && s.ended) break;
    if (pg.errs.length) break;
  }
  if (def.kind === 'solo' && !(s && s.ended)) {   // poke the board a bit
    for (let i = 0; i < 25; i++) { const vp = VP[vpName]; await pg.mouse.click(vp.width * (.2 + Math.random() * .6), vp.height * (.25 + Math.random() * .6)); await pg.waitForTimeout(60); }
    s = await sstate(pg);
  }
  await pg.waitForTimeout(1300); await shot(pg, id, `${mode}_${vpName}_end`);
  // replay determinism (turn games)
  let replay = '';
  if (def.kind === 'turn' && s && s.st) {
    const r = await pg.evaluate(() => { const S = BX.session(); const before = JSON.stringify(S.inst.st), cfg = S.cfg, log = S.log.slice(); BX.launch(S.def, Object.assign({}, cfg, {log})); const after = JSON.stringify(BX.session().inst.st); return {same: before === after, n: log.length, a: before.slice(0, 300), b: after.slice(0, 300)}; });
    replay = r.same ? `replay ok(${r.n})` : `REPLAY MISMATCH\n  before ${r.a}\n  after  ${r.b}`;
    if (!r.same) pg.errs.push('replay mismatch');
  } else if (def.kind === 'turn') { replay = 'NO inst.st'; pg.errs.push('turn game must expose inst.st'); }
  const errs = pg.errs.slice(0, 6); await pg.ctxObj.close();
  const ended = s && s.ended;
  const ok = !errs.length && (ended || def.kind !== 'turn');
  return {ok, msg: `${ended ? 'ended ' + JSON.stringify(s.res).slice(0, 80) : 'NOT ENDED in ' + (limit / 1000) + 's'} actions=${s ? s.log : '?'} ${replay}` + (errs.length ? '\n    ERR ' + errs.join('\n    ERR ') : '')};
}

async function lobbyCheck() {
  for (const vp of ['desk', 'phoneP', 'phoneL']) {
    const pg = await page(vp, '');
    await shot(pg, '_lobby', vp);
    if (games && games.length === 1) { await pg.evaluate(id => BX.lobby.openSheet(BX.games[id]), games[0]); await pg.waitForTimeout(300); await shot(pg, games[0], 'sheet_' + vp); }
    const e = pg.errs.slice(); const le = await pg.evaluate(() => BX.loadErrors || []);
    await pg.ctxObj.close();
    if (e.length || le.length) { fails++; report.push(`LOBBY ${vp}: ` + [...e, ...le].join(' | ')); }
  }
}

async function onlineGame(id) {
  const PP = String(9200 + Math.floor(Math.random() * 700)); const ps = spawn('node', [SRC + '/test/peersrv.cjs', PP], {stdio: 'ignore'}); await new Promise(r => setTimeout(r, 1200));
  const mk = async vp => { const pg = await page(vp, '?test&bot&peerhost=127.0.0.1&peerport=' + PP + ''); return pg; };
  const H = await mk('desk'), G = await mk('phoneL');
  let msg = '', ok = true;
  try {
    await H.evaluate(() => { BX.store.set('name', '房主'); BX.net.host(); });
    await H.waitForFunction(() => BX.net.code && /等待/.test(BX.net.status), null, {timeout: 15000});
    const code = await H.evaluate(() => BX.net.code);
    await G.evaluate(c => { BX.store.set('name', '客人'); BX.net.join(c); }, code);
    await H.waitForFunction(() => BX.net.up, null, {timeout: 15000}); await G.waitForFunction(() => BX.net.up, null, {timeout: 15000});
    await H.evaluate(id => BX.quick(id, {mode: 'online', level: 2}), id);
    await G.waitForFunction(() => BX.session() && BX.session().cfg.mode === 'online', null, {timeout: 10000});
    const kind = await H.evaluate(id => BX.games[id].kind, id);
    const t0 = Date.now(); let a, b;
    while (Date.now() - t0 < (kind === 'realtime' ? 12000 : TIME)) { await H.waitForTimeout(600); a = await sstate(H); b = await sstate(G); if (kind === 'turn' && a.ended && b.ended) break; if (H.errs.length || G.errs.length) break; }
    await shot(H, id, 'online_host'); await shot(G, id, 'online_guest');
    if (kind === 'turn') { if (a.st !== b.st) { ok = false; msg += 'STATE DIVERGED host/guest; '; } msg += `host ended=${a.ended} guest ended=${b.ended} actions=${a.log}/${b.log}`; if (!a.ended) ok = false; }
    else { const moved = await G.evaluate(() => JSON.stringify(BX.session().inst.st || {}).length); msg += `realtime guest state size ${moved}`; }
  } catch (e) { ok = false; msg += 'EXC ' + e.message.split('\n')[0]; }
  const errs = [...H.errs.map(e => 'host: ' + e), ...G.errs.map(e => 'guest: ' + e)];
  if (errs.length) { ok = false; msg += '\n    ERR ' + errs.slice(0, 6).join('\n    ERR '); }
  await H.ctxObj.close(); await G.ctxObj.close(); ps.kill();
  return {ok, msg};
}

await lobbyCheck();
const ids = games || (await (async () => { const pg = await page('desk', ''); const l = await pg.evaluate(() => BX.list.map(d => d.id)); await pg.ctxObj.close(); return l; })());
for (const id of ids) {
  const pg = await page('desk', ''); const def = await pg.evaluate(id => { const d = BX.games[id]; return d && {kind: d.kind, modes: d.modes}; }, id); await pg.ctxObj.close();
  if (!def) { fails++; report.push(`FAIL ${id}: not registered (load error?)`); continue; }
  const runs = [];
  if (def.kind === 'solo') runs.push(['solo', 'desk'], ['solo', 'phoneP']);
  else {
    if (def.modes.includes('ai')) runs.push(['ai', 'desk']);
    if (def.modes.includes('local')) runs.push(['local', arg('phone') ? 'phoneP' : 'ipad']);
    if (arg('phone')) runs.push([def.modes.includes('ai') ? 'ai' : def.modes[0] === 'online' ? 'local' : def.modes[0], 'phoneL']);
  }
  for (const [mode, vp] of runs) {
    if (mode === 'online') continue;
    const r = await botGame(id, mode, vp); if (!r.ok) fails++;
    report.push(`${r.ok ? 'PASS' : 'FAIL'} ${id} [${mode} ${vp}] ${r.msg}`); console.log(report[report.length - 1]);
  }
  if (arg('online') && def.modes.includes('online')) { const r = await onlineGame(id); if (!r.ok) fails++; report.push(`${r.ok ? 'PASS' : 'FAIL'} ${id} [online] ${r.msg}`); console.log(report[report.length - 1]); }
}
console.log('\n===== SUMMARY =====\n' + report.join('\n') + `\n${fails ? fails + ' FAILURE(S)' : 'ALL PASS'}  shots: ${OUTDIR}`);
await browser.close(); srv.close(); fs.rmSync(ROOT, {recursive: true, force: true});
process.exit(fails ? 1 : 0);
