// node test/review.js <章> [视口] — 用真实界面把这一章走一遍：每句话、每场对峙、每一步之后的探索画面都截图到 /tmp/kbw/rv<章>/，并自动记录可疑问题
const { chromium } = require('playwright'); const fs = require('fs');
const ch = +(process.argv[2] || 1), VP = { phoneP: [393, 852], phoneL: [852, 393], desk: [1280, 800] }[process.argv[3] || 'phoneP'], DIR = `/tmp/kbw/rv${ch}${process.argv[3] ? '_' + process.argv[3] : ''}`; fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR, { recursive: true });
const NEXT = { 1: 'q_trial', 2: 'q_date', 3: 'q_muyang', 4: 'q_prep', 5: 'q_end' };
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: VP[0], height: VP[1] }, hasTouch: VP[0] < 900, isMobile: VP[0] < 900 }); const errs = [], notes = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  let n = 0; await pg.exposeFunction('snap', async (tag) => { n++; const f = `${DIR}/${String(n).padStart(4, '0')}_${tag.replace(/[\/\\:*?"<>|\s]/g, '_').slice(0, 40)}.jpg`; await pg.screenshot({ path: f, type: 'jpeg', quality: 55 }); return f; });
  await pg.exposeFunction('note', s => { notes.push(s); });
  await pg.addInitScript(() => { localStorage.clear(); }); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const res = await pg.evaluate(async ([ch, NEXT]) => { const D = __dbg, sleep = ms => new Promise(r => setTimeout(r, ms)); D.nosave = true; D.mini = 1; SET.motion = 1; SET.scare = 1; let s = 777; D.rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    D.pick = o => (o.choices[0][0] || o.choices[0]) === '再来一次' ? 2 : 0;
    const wait = async (f, ms) => { const t0 = Date.now(); while (!f() && Date.now() - t0 < (ms || 20000)) await sleep(15); return f(); };
    const check = (tag) => { const out = []; const dl = document.querySelector('#dlg'); if (dl && dl.offsetParent && dl.scrollHeight > dl.clientHeight + 2) out.push('对话框要滚动'); const vw = innerWidth, vh = innerHeight;
      document.querySelectorAll('button, .btn').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.width && (r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1)) out.push('按钮出屏:' + e.textContent.trim().slice(0, 10)); });
      document.querySelectorAll('.card .n, .card h4, .b-turn, #tl span, .btn').forEach(e => { if (e.offsetParent && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') out.push('文字被截:' + e.textContent.trim().slice(0, 12)); });
      if (out.length) note(tag + ' → ' + [...new Set(out)].join('；')); };
    /* 对话：每句停下来截图 */
    const W = window.dlgShow; window.dlgShow = async o => { if (!D.STATE.scene) return W(o); D.auto = false; const p = W(o); await sleep(o.choices ? 250 : 420);
      const who = o.who || '', tag = (who ? who + '：' : '') + String(o.text || (o.choices ? '选择' : '')).slice(0, 18);
      if (who && who !== '陈歌' && who !== '我' && o.kind !== 'ph' && !STG.remote.has(who) && who !== '手机里的声音' && !stFind(who)) note(tag + ' → 说话人不在小剧场上');
      check(tag); await snap(tag); const r = DLG.res; DLG.res = null; D.auto = true; if (r) { if (o.choices) r(D.pick(o)); else r(); } return p; };
    const SB = window.startBattle; window.startBattle = async o => { D.instant = true; const p = SB(o); await sleep(60); if (D.STATE.battle) { renderBattle(); await sleep(250); check('对峙:' + (o.title || '')); await snap('对峙_' + (o.title || '')); } return p; };
    D.instant = true; D.slotNew(1); await wait(() => !D.STATE.scene); D.auto = true; if (ch > 1) { D.jumpTo(ch); D.auto = true; }
    const log = []; let guard = 0;
    while (D.C.q !== NEXT[ch] && D.C.q !== 'q_end' && guard++ < 120) { const q = D.curQ();
      if (questBlocked(q)) { if (D.isNight()) { await D.autoWalk('hh_rest'); D.sleepBed(); continue; } await D.autoWalk('hh_door'); await D.receive(sceneList()[0]); await wait(() => !D.STATE.scene && !D.STATE.battle); continue; }
      const at = D.questWhere(q); await wait(() => !D.STATE.scene && !D.STATE.battle);
      if (D.C.loc !== at) { await D.autoWalk(at); await wait(() => !D.STATE.scene && !D.STATE.battle); if (D.C.q !== q.id) { log.push(q.id); continue; } }
      if (D.C.q === q.id) { D.storyHereRun(); if (!await wait(() => !D.STATE.scene && !D.STATE.battle && D.C.q !== q.id, 120000)) return { fail: 'stuck ' + q.id, log, err: D.err }; }
      log.push(q.id); D.auto = true; refresh(); await sleep(350); check('探索:' + PLACES[D.C.loc].name); await snap('探索_' + PLACES[D.C.loc].name + '_' + D.C.q); }
    for (const t of ['phone', 'pet', 'bag', 'hero', 'log']) { D.navTo(t); await sleep(250); check('面板:' + t); await snap('面板_' + t); } closeSide();
    return { log, q: D.C.q, err: D.err }; }, [ch, NEXT]);
  fs.writeFileSync(`${DIR}/notes.txt`, notes.join('\n')); console.log(JSON.stringify(res)); console.log('shots', n, 'notes', notes.length); console.log('errors', errs); await b.close(); })();
