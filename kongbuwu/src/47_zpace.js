/* ===== 真实鬼屋的节奏（RULES 36）=====
   紧张—释放：游客越久没被吓，紧张度越高，下一下越狠（安静 9 秒满，×1.6）；被吓一次清零。
   习惯：同一种吓法 25 秒内对同一个人连用，每次 ×0.72（最低 ×0.45）；换着来才有效。
   恢复：8 秒没被吓，SAN 每秒回 0.5%（最多回到 75%）。
   声东击西：机关 / 敲墙 / 房间剧情点 / 别人的尖叫会把游客的注意力拉过去（头上「？」+ 黄色虚线指着看的方向），
   这时从他背后（和他看的方向夹角 ≥ 100°）出手 ×1.6。
   游客性格（按游客种类）：主播看得远、被吓狠了会喊「家人们」；情侣被吓后 3 秒内再吓 ×1.4；嘴硬的前两下只会笑（×0.4），之后 ×1.25；
   学生注意力最容易被拉走（×1.6 久）；壮汉在亮处 ×0.8、黑屋 ×1.4，他被吓跑旁边的人一起慌；医学生不怕人偶棺材（×0.6），怕声音（×1.3）。
   房间剧情点：每个房间第一次有游客进来时触发（look 盯着一样东西 / dark 灯灭 6 秒 / story 一句不对劲的话 + 紧张度）。 */
const HPC = { tenseT: 9, tenseMul: .6, habWin: 25, habK: .72, habMin: .45, recDelay: 8, recRate: .005, recCap: .75, lookT: 2.4, combo: 1.6, comboAng: 1.75, attR: 7, darkT: 6 };
const HROLE = { torch: '主播', pair: '情侣', calm: '嘴硬', distract: '学生', darkfear: '胆大', corpse: '医学生' };
const HROLE_IN = { torch: '家人们，我进来了！', pair: '别怕，我在呢。', calm: '哈，全是假的。', distract: '等等，我先拍个照……', darkfear: '我走前面，跟紧了。', corpse: '解剖课比这吓人多了。' };
function hRoleOf(v) { return HROLE[v.u.trait] ? v.u.trait : ''; }
/* 每一下吓人都过一遍：返回倍率（紧张度 × 习惯 × 声东击西 × 性格） */
function hPace(H, v, kind, src, el) { const t = v.tense || 0; let m = 1 + t * HPC.tenseMul;
  v.hab = v.hab || {}; const h = v.hab[kind], n = h && H.t - h.t < HPC.habWin ? h.n : 0; m *= Math.max(HPC.habMin, Math.pow(HPC.habK, n)); v.hab[kind] = { n: n + 1, t: H.t };
  let combo = false; if (v.att && H.t < v.att.until && src) { const a1 = Math.atan2(v.att.y - v.y, v.att.x - v.x), a2 = Math.atan2(src.y - v.y, src.x - v.x); let da = Math.abs(a1 - a2); if (da > Math.PI) da = 2 * Math.PI - da; combo = da >= HPC.comboAng; }
  if (combo) { m *= HPC.combo; v.att = null; H.stats.combo = (H.stats.combo || 0) + 1; hFloat(H, v.x, v.y - 2.4, '声东击西！', 'crit'); hHint(H, 'combo', '声东击西：游客头上冒「？」、盯着别处的时候，从他背后出手 ×1.6。'); }
  else if (t > .6) hFloat(H, v.x, v.y - 2.4, '憋了很久……', 'crit');
  if (n >= 2) { hFloat(H, v.x + .5, v.y - 2.9, '又来？', 'txt'); if (n === 2) hHint(H, 'hab', '同一种吓法连着用，游客会习惯（越来越不灵）。换个机关、换个员工，或者先安静一会儿。'); }
  m *= hRoleMul(H, v, kind, el, m); return m; }
function hRoleMul(H, v, kind, el, m0) { switch (v.u.trait) {
  case 'calm': if ((v.laugh ?? 2) > 0) { v.laugh = (v.laugh ?? 2) - 1; hBub(H, v, v.laugh ? '哈哈哈，假的吧' : '哈……哈，有点意思', 1.6); v.emo = { s: 'sweat', until: H.t + 1.2 }; return .4; } if (!v.laughEnd) { v.laughEnd = 1; hBub(H, v, '……笑不出来了', 1.8); } return 1.25;
  case 'darkfear': return hDarkAt(H, v.x, v.y) ? 1.4 : .8;
  case 'corpse': return el === 'doll' || kind === 'coffin' || kind === 'sp_ward' ? .6 : el === 'sound' ? 1.3 : 1;
  case 'pair': if (v.hug && H.t < v.hug) { hBub(H, v, '抱、抱紧一点……', 1.4); return 1.4; } return 1;
  case 'torch': if (m0 >= 1.5) hBub(H, v, '家人们快看——啊啊啊！！', 1.6); return 1;
  default: return 1; } }
/* 注意力被拉走 */
function hAttend(H, v, x, y, dur, say) { if (hOut(v) || hScaredSt(v) || v.st === 'wait' || v.st === 'leave') return; if (v.att && H.t < v.att.until - .5) return;
  const d = (dur || HPC.lookT) * (v.u.trait === 'distract' ? 1.6 : 1); v.att = { x, y, until: H.t + d }; if (v.st === 'walk' || v.st === 'look') { hSnap(v); v.st = 'stare'; v.wait = Math.min(d, 1.8); } if (say) hBub(H, v, say, 1.6); }
const HATT = ['那边……什么声音？', '你听见没有？', '谁在那儿？', '那边亮了一下？'];
function hAttendNear(H, x, y, not, r) { for (const q of hActive(H)) { if ((not || []).includes(q) || hDist(q, { x, y }) > (r || HPC.attR) || !hmLos(H.M, q.x, q.y, x, y)) continue; hAttend(H, q, x, y, 0, rnd() < .5 ? pick(HATT) : null); } }
/* 被吓了一下：清零紧张度；情侣抱紧；壮汉被吓跑旁边的人一起慌；胆小的尖叫把别人的注意力拉过来 */
function hPaceHit(H, v, src) { v.tense = 0; v.lastHit = H.t; if (v.u.trait === 'pair') v.hug = H.t + 3;
  if (v.u.trait === 'darkfear' && v.u.hp < v.u.mhp * .5 && !v.braveBroke) { v.braveBroke = 1; for (const q of hActive(H)) if (q !== v && hDist(q, v) <= 5) { const d = Math.max(1, Math.round(q.u.mhp * .08)); q.u.hp = Math.max(1, q.u.hp - d); hBub(H, q, '连他都跑了？！', 1.6); } }
  if (v.u.trait === 'distract' || v.u.trait === 'pair') hAttendNear(H, v.x, v.y, [v], 5); }
/* 起哄只来自无聊：25 秒没被吓，或者已经习惯了（某种吓法 25 秒内用了 3 次以上） */
function hBored(H, v) { if (H.t - (v.lastHit ?? v.inT ?? H.t) > 25) return true; for (const k in v.hab || {}) if (v.hab[k].n >= 3 && H.t - v.hab[k].t < HPC.habWin) return true; return false; }
/* 每帧：紧张度涨、SAN 慢慢回、房间剧情点 */
function hPaceTick(H, v, dt) { if (hOut(v) || v.st === 'wait' || v.st === 'leave') return; if (v.inT == null) v.inT = H.t; if (!hScaredSt(v)) v.tense = Math.min(1, (v.tense || 0) + dt / HPC.tenseT);
  const q = H.t - (v.lastHit ?? H.t); if (q > HPC.recDelay && v.u.hp > 0 && v.u.hp < v.u.mhp * HPC.recCap) v.u.hp = Math.min(v.u.mhp * HPC.recCap, v.u.hp + v.u.mhp * HPC.recRate * (v.u.trait === 'pair' ? 1.5 : 1) * dt);
  if (v.att && H.t >= v.att.until) v.att = null;
  if (v.mv) return; const r = hmRoomAt(H.M, v.tx, v.ty); if (!r) return; v.rooms = v.rooms || {}; if (v.rooms[r.n]) return; v.rooms[r.n] = 1; if (v.st === 'walk' && !v.greet) { v.greet = 1; if (HROLE_IN[v.u.trait]) hBub(H, v, HROLE_IN[v.u.trait], 2); }
  const b = H.beats && H.beats[r.n]; if (!b || hScaredSt(v)) return; H.beatSeen = H.beatSeen || {}; const first = !H.beatSeen[r.n]; H.beatSeen[r.n] = 1;
  if (b.k === 'look' && b.at) hAttend(H, v, b.at[0], b.at[1], HPC.lookT + .6, b.say);
  else if (b.k === 'dark') { if (!H.lit || H.lit[r.n] !== false) { H.lit = H.lit || {}; H.lit[r.n] = false; H.litT = H.litT || {}; H.litT[r.n] = H.t + HPC.darkT; H.black = .5; hS(H, 'crack', v.x, v.y); } hBub(H, v, b.say, 1.8); v.tense = Math.min(1, (v.tense || 0) + .3); }
  else { hBub(H, v, b.say, 2.2); v.tense = Math.min(1, (v.tense || 0) + .35); }
  if (first) hLog(H, r.n + '：' + b.say, ''); }
function hPaceStep(H, dt) { if (H.litT) for (const n in H.litT) if (H.t >= H.litT[n]) { if (H.lit && H.lit[n] === false) H.lit[n] = true; delete H.litT[n]; }
  /* 心跳：离陈歌最近、最怕的那个人越怕跳得越快 */ if (H.t >= (H.hbT || 0)) { const w = hActive(H).filter(v => hDist(v, H.hero) < 12).sort((a, b) => a.u.hp / a.u.mhp - b.u.hp / b.u.mhp)[0]; if (w) { const fr = w.u.hp / w.u.mhp; if (fr < .75) hS(H, 'heart', w.x, w.y); H.hbT = H.t + .42 + fr * .9; } else H.hbT = H.t + 1; } }
/* 带位置的音效：左右声像按屏幕位置，离陈歌远了小声，隔着墙发闷 */
function hS(H, n, x, y) { if (!H || x == null || typeof AU === 'undefined' || !AU.ctx) return sfx(n); const cv = $('#hcv'), cw = cv ? cv.width / 16 : 20, ch = cv ? cv.height / 16 : 12, cx = (H.cam ? H.cam.x / 16 : 0) + cw / 2, cy = (H.cam ? H.cam.y / 16 : 0) + ch / 2; void cy;
  const pan = clamp((x - cx) / Math.max(6, cw / 2), -1, 1) * .85, d = Math.hypot(x - H.hero.x, y - H.hero.y), vol = clamp(1.25 - d / 22, .3, 1), lp = hmLos(H.M, H.hero.x, H.hero.y, x, y) ? 0 : 900;
  AU.pos = { pan, vol, lp }; try { sfx(n); } finally { AU.pos = null; } }
/* 员工回岗优先走员工通道（加权距离：通道 1，明处 2.2） */
function hmFieldW(M, tx, ty) { const key = 'w' + tx + ',' + ty; if (M.fields[key]) return M.fields[key]; const w = M.w, N = w * M.h, f = new Float32Array(N).fill(-1), done = new Uint8Array(N), hp = [[0, ty * w + tx]]; f[ty * w + tx] = 0;
  const push = (d, i) => { hp.push([d, i]); let c = hp.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (hp[p][0] <= hp[c][0]) break; [hp[p], hp[c]] = [hp[c], hp[p]]; c = p; } };
  const pop = () => { const top = hp[0], last = hp.pop(); if (hp.length) { hp[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < hp.length && hp[l][0] < hp[m][0]) m = l; if (r < hp.length && hp[r][0] < hp[m][0]) m = r; if (m === c) break; [hp[m], hp[c]] = [hp[c], hp[m]]; c = m; } } return top; };
  while (hp.length) { const [d, c] = pop(); if (done[c]) continue; done[c] = 1; const cx = c % w, cy = (c / w) | 0; for (const [dx, dy] of HD) { const nx = cx + dx, ny = cy + dy, k = ny * w + nx; if (nx < 0 || ny < 0 || nx >= w || ny >= M.h || M.hs[k] || done[k]) continue; const nd = d + (M.sec[k] ? 1 : 2.2); if (f[k] < 0 || nd < f[k]) { f[k] = nd; push(nd, k); } } }
  return M.fields[key] = f; }
/* 员工在明处走回岗位被游客看见：「那是工作人员吧？」紧张度清零 */
function hStaffSeen(H, st) { if (H.M.sec[st.ty * H.M.w + st.tx]) return; for (const v of hActive(H)) { if (hScaredSt(v) || (v.staffSeen || 0) > H.t || hDist(v, st) > 4) continue; const [fx, fy] = HD[v.dir || 0], dx = st.x - v.x, dy = st.y - v.y, d = Math.hypot(dx, dy); if ((dx * fx + dy * fy) < d * .3 || !hmLos(H.M, v.x, v.y, st.x, st.y)) continue; v.staffSeen = H.t + 15; v.tense = 0; hBub(H, v, '……那是工作人员吧？', 1.8); hHint(H, 'staffseen', '员工走回岗位时被游客看见，会让游客放松下来。员工会尽量走员工通道（墙里的暗紫虚线）。'); } }
/* ---------- 画 ---------- */
/* 游客在看哪：脚下一个小三角；注意力被拉走时头上「？」+ 黄色虚线指过去（沉浸模式只留「？」） */
function hAttDraw(g, H, ox, oy, t) { for (const v of hActive(H)) { const x = v.x * 16 + 8 - ox, y = v.y * 16 + 8 - oy, [fx, fy] = HD[v.dir || 0];
    if (!SET.imm) { g.fillStyle = 'rgba(255,240,200,.28)'; g.beginPath(); g.moveTo(x + fx * 9, y + 5 + fy * 6); g.lineTo(x + fx * 4 - fy * 3, y + 5 + fy * 3 - fx * 2); g.lineTo(x + fx * 4 + fy * 3, y + 5 + fy * 3 + fx * 2); g.fill(); }
    if (!v.att || H.t >= v.att.until) continue; const ax = v.att.x * 16 + 8 - ox, ay = v.att.y * 16 + 8 - oy, a = .45 + Math.sin(t * 8) * .2;
    if (!SET.imm) { const d = Math.hypot(ax - x, ay - y), k = Math.min(1, 44 / Math.max(1, d)); g.strokeStyle = `rgba(255,220,90,${a})`; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + (ax - x) * k, y - 4 + (ay - y) * k); g.stroke(); g.setLineDash([]); }
    g.fillStyle = `rgba(255,220,90,${.7 + a * .3})`; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('?', x, y - 24 - (v.P.tall ? 4 : 0)); g.textAlign = 'left'; } }
/* 俯瞰（🔍）= 总控制室的监控画面：发绿、扫描线、噪点、偶尔一阵雪花；陈歌所在的房间是正常画面 */
function hCctv(H, g, ox, oy, t) { const cw = g.canvas.width, ch = g.canvas.height, M = H.M, hr = hmRoomAt(M, H.hero.x, H.hero.y); g.save(); g.beginPath(); g.rect(0, 0, cw, ch);
  if (hr) for (const r of M.rooms) if (r.n === hr.n) g.rect(r.x0 * 16 - ox, r.y0 * 16 - oy, (r.x1 - r.x0 + 1) * 16, (r.y1 - r.y0 + 1) * 16);
  g.clip('evenodd'); g.fillStyle = 'rgba(40,70,55,.28)'; g.fillRect(0, 0, cw, ch); g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = (t * 20 | 0) % 3; y < ch; y += 3) g.fillRect(0, y, cw, 1);
  const burst = (t % 9) < .14; for (let i = 0, n = (cw * ch / (burst ? 40 : 320)) | 0; i < n; i++) { g.fillStyle = `rgba(220,240,230,${Math.random() * (burst ? .35 : .12)})`; g.fillRect((Math.random() * cw) | 0, (Math.random() * ch) | 0, 1, 1); }
  const gr = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * .3, cw / 2, ch / 2, Math.max(cw, ch) * .7); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); g.restore();
  const cr = hmRoomAt(M, (ox + cw / 2) / 16, (oy + ch / 2) / 16), sec = (H.t + 2 * 3600 + 13 * 60) | 0, ts = [sec / 3600 | 0, (sec / 60 | 0) % 60, sec % 60].map(n => String(n).padStart(2, '0')).join(':');
  g.font = '8px monospace'; g.fillStyle = 'rgba(200,232,210,.85)'; g.fillText('CAM ' + String(1 + ((cr ? M.rooms.findIndex(r => r.n === cr.n) : 0) % 12)).padStart(2, '0') + (cr ? ' · ' + cr.n : ''), 6, ch - 26); g.fillText('REC  ' + ts, 14, ch - 16);
  if ((t % 1.2) < .7) { g.fillStyle = '#e03030'; g.beginPath(); g.arc(8, ch - 19, 2.5, 0, 7); g.fill(); } }
