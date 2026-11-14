/* ================= 夜晚任务（RULES 32）：恐怖场景改成百物语那样自己走、自己找、自己躲 =================
   用户：“百物语里面的每个小故事做的挺好的，氛围也挺好，为什么恐怖屋游戏里面就感觉差点意思”
   → 除了白天鬼屋经营，所有恐怖场景都在这里玩：全屏 iframe 里跑百物语引擎（kongbuwu/night/，构建时拼进 NIGHT_HTML）。
   没有血条和伤害数字；体力、精神、钱、栏目在夜里全都收起来。
   用法（剧情函数里）：const r = await night('trial'); if (r.kind === 'quit') return nightQuit();
     r.kind：'end' 走完了 · 'skip' 死了以后选“跳过这一夜” · 'quit' 中途离开（这一步不算完成，下次从检查点接着走）
     r.f：章节里 S.f.k_* 带回来的结果；r.inv：这一夜结束时口袋里的东西 */
function nightAuto() { return !!(window.__dbg && (__dbg.auto || __dbg.instant) && !__dbg.nightReal); }
function nightEnv() { return { lv: C.lv, items: Object.keys(C.bag || {}).filter(k => C.bag[k] > 0).concat(C.gear || []), pets: Object.keys(C.pets || {}), talents: (C.talents || []).slice(), live: !!STATE.live, liveHot: STATE.live ? Math.round(STATE.live.hot || 0) : 0, flags: Object.assign({}, C.f), diff: SET.diff }; }
function night(id, o = {}) {
  if (typeof NIGHT_IDS === 'undefined' || !NIGHT_IDS.includes(id)) { console.warn('夜晚任务不存在', id); return Promise.resolve({ kind: 'end', none: 1, f: {}, inv: [] }); }
  if (nightAuto()) return Promise.resolve({ kind: 'end', auto: 1, f: Object.assign({}, o.autoF || {}), inv: [] });
  F().ntq = F().ntq || {}; const fromCp = !!F().ntq[id];
  return new Promise(res => {
    const ov = document.createElement('div'); ov.id = 'nightov'; ov.innerHTML = '<iframe id="nightfr" title="夜晚任务" allow="autoplay; fullscreen"></iframe>'; document.body.appendChild(ov);
    const fr = ov.firstChild; fr.srcdoc = NIGHT_HTML; document.body.classList.add('nightup'); try { if (AU.ctx) AU.ctx.suspend(); } catch (e) { }
    const onMsg = ev => { const m = ev.data; if (!m || !m.kbwNight || ev.source !== fr.contentWindow) return;
      if (m.t === 'ready') { fr.contentWindow.postMessage({ kbwNight: 1, t: 'play', id, fromCp, env: nightEnv(), mute: !SET.snd }, '*'); setTimeout(() => { try { fr.focus(); fr.contentWindow.focus(); } catch (e) { } }, 60); }
      if (m.t === 'done') { window.removeEventListener('message', onMsg); ov.remove(); document.body.classList.remove('nightup'); try { if (AU.ctx) AU.ctx.resume(); } catch (e) { }
        if (m.kind === 'quit') F().ntq[id] = 1; else delete F().ntq[id]; STATE.nightLast = m; res(Object.assign({ f: {}, inv: [] }, m)); } };
    window.addEventListener('message', onMsg); STATE.night = { id, ov, fr };
  }); }
/* 中途离开：这一步不算完成 */
function nightQuit() { STATE.qAbort = 1; toast('这一夜还没走完——下次从刚才的检查点接着走'); }
/* 剧情里统一这样调：const r = await nt('attic'); if (!r) return;   （中途离开返回 null，这一步不算完成） */
async function nt(id, o) { const r = await night(id, o); if (r.kind === 'quit') { nightQuit(); return null; } nightAfter(r); return r; }
/* 回来以后（RULES 33）：这一夜的对话和笔记进回忆录；按评价给奖励；死过、跳过、失手记进章节评级 */
const NIGHT_RW = { S: [.12, 600], A: [.07, 300], B: [.04, 120], C: [0, 0] };
function nightAfter(r) {
  if (r.auto || r.none) return;
  if (r.log && r.log.length) { journalAdd('', '【夜晚 · ' + (r.title || r.id) + '】'); r.log.forEach(([w, t]) => journalAdd(w, t)); }
  const q = curQ(), ch = q ? q.ch : 0; if (ch) { chStart(ch); const s = FN().chs[ch], d = r.deaths || 0; s.lose = (s.lose || 0) + (r.kind === 'skip' ? 2 : d >= 3 ? 2 : d >= 1 ? 1 : 0); if (r.f && (r.f.k_fail || r.f.k_seen || r.f.k_spoke)) s.fail = (s.fail || 0) + 1; }
  const g = r.grade || 'C', rw = NIGHT_RW[g] || NIGHT_RW.C, exp = Math.round(HERO.need(C.lv) * rw[0]);
  if (exp) gainExp(exp); if (STATE.live && rw[1]) C.fans += rw[1];
  for (const [a, pet] of [['xiao', 'xiaoxiao'], ['pen', 'bixian'], ['cat', 'baimao']]) if (r.aids && r.aids[a]) petAff(pet, 2 * r.aids[a]);
  STATE.nightGrade = g; logLine('这一夜：评价 ' + g + (r.why ? '（' + r.why + '）' : '') + (exp ? '，经验 +' + exp : '') + (STATE.live && rw[1] ? '，关注 +' + rw[1] : ''), 'gain'); toast('这一夜：' + g + (exp ? ' · 经验 +' + exp : '')); }
/* 同一步里夜晚任务之前已经发过的奖励/打过的仗：中途离开再进来时不再重复（按步骤 id 记） */
async function preOnce(key, fn) { F().pre = F().pre || {}; if (F().pre[key]) return; const r = await fn(); if (r !== false) F().pre[key] = 1; return r; }   // fn 返回 false = 这一段没走完，下次还要再来
