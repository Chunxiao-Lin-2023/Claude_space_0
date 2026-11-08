/* ===================== app.js — UI & viewers ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) { if (kid == null || kid === false) continue; el.append(kid instanceof Node ? kid : document.createTextNode(String(kid))); }
  return el;
}
const icon = (n, cls = 'i') => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', cls); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-' + n); s.append(u); return s; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
const debounce = (fn, ms) => { let tm; return (...a) => { clearTimeout(tm); tm = setTimeout(() => fn(...a), ms); }; };
function throttle(fn, ms) { let last = 0, tm; return (...a) => { const now = Date.now(); clearTimeout(tm); if (now - last >= ms) { last = now; fn(...a); } else tm = setTimeout(() => { last = Date.now(); fn(...a); }, ms - (now - last)); }; }
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
function fnv(str) { let x = 0x811c9dc5; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193); } return (x >>> 0).toString(36); }
function cjkRatio(s) { s = s.slice(0, 6000); const m = s.match(/[㐀-鿿豈-﫿぀-ヿ가-힯]/g); const n = s.replace(/\s/g, '').length || 1; return (m ? m.length : 0) / n; }
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDark = () => ['dark', 'black'].includes(S.set.theme);
function fmtMin(min) { min = Math.max(1, Math.round(min)); if (min < 60) return t('mins', min); const hh = Math.floor(min / 60), mm = min % 60; return mm ? t('hrsMins', hh, mm) : t('hrs', hh); }
function fmtDate(ts) { const d = new Date(ts); return d.toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toTimeString().slice(0, 5); }

/* ---------- text offsets ---------- */
function textNodes(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const out = []; let n; while ((n = w.nextNode())) out.push(n); return out; }
function offsetOf(root, node, off) { try { const r = document.createRange(); r.setStart(root, 0); r.setEnd(node, off); return r.toString().length; } catch { return 0; } }
function pointAt(root, offset) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, total = 0, last = null;
  while ((n = w.nextNode())) { if (offset < total + n.length || (offset === total + n.length && n.length)) return { node: n, off: offset - total }; total += n.length; last = n; }
  return last ? { node: last, off: last.length } : null;
}
function rectAt(root, offset) {
  const p = pointAt(root, offset); if (!p) return null;
  const r = document.createRange(); r.setStart(p.node, p.off); r.setEnd(p.node, Math.min(p.off + 1, p.node.length));
  const rs = r.getClientRects(); if (rs.length) return rs[0];
  const el = p.node.parentElement; return el ? el.getBoundingClientRect() : null;
}
const BLOCKY = /^(TABLE|TBODY|THEAD|TFOOT|TR|UL|OL|DL|COLGROUP)$/;
function wrapRange(root, start, end, make) {
  const out = []; let pos = 0;
  for (const n of textNodes(root)) {
    const ns = pos, ne = pos + n.length; pos = ne;
    if (ne <= start) continue; if (ns >= end) break;
    if (n.parentNode && BLOCKY.test(n.parentNode.nodeName)) continue;
    const s = Math.max(start, ns) - ns, e = Math.min(end, ne) - ns; if (e <= s) continue;
    let node = n; if (s > 0) node = node.splitText(s); if (e - s < node.length) node.splitText(e - s);
    const m = make(); node.parentNode.insertBefore(m, node); m.appendChild(node); out.push(m);
  }
  return out;
}
function unwrap(root, sel) { const parents = new Set(); for (const m of root.querySelectorAll(sel)) { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); parents.add(p); } parents.forEach(p => p.normalize()); }
function caretAt(x, y) {
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && p.offsetNode ? { node: p.offsetNode, off: p.offset } : null; }
  if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r ? { node: r.startContainer, off: r.startOffset } : null; }
  return null;
}

/* ---------- storage ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('moyue.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('moyue.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('moyue.' + k); } catch {} },
};
const IDB = (() => {
  let dbp = null;
  const open = () => dbp ||= new Promise((res, rej) => {
    try {
      const r = indexedDB.open('moyue', 1);
      r.onupgradeneeded = () => { const db = r.result; for (const s of ['books', 'blobs', 'fonts']) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    } catch (e) { rej(e); }
  });
  const tx = async (store, mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t2 = db.transaction(store, mode); const req = fn(t2.objectStore(store)); t2.oncomplete = () => res(req && req.result); t2.onerror = () => rej(t2.error); t2.onabort = () => rej(t2.error); }); };
  return { put: (s, v) => tx(s, 'readwrite', o => o.put(v)), get: (s, k) => tx(s, 'readonly', o => o.get(k)), del: (s, k) => tx(s, 'readwrite', o => o.delete(k)), all: s => tx(s, 'readonly', o => o.getAll()) };
})();

/* ---------- settings ---------- */
const DEF = { theme: 'paper', lang: null, cjk: 'sys-serif', latin: 'follow', mono: 'sys-mono', fs: 19, lh: 1.85, ps: 0.6, ls: 0, pw: 720, align: 'justify', indent: 'auto', mode: 'scroll', pdfInvert: true, pdfFit: 'width', spread: false, ttsRate: 1, ttsPitch: 1, ttsExpr: true, voiceZh: 'auto', voiceEn: 'auto', ttsEngine: 'system', azVoiceZh: '', azVoiceEn: '', azStyle: 'auto', azDegree: 1.2, autoSpeed: 40, side: true, sideTab: 'toc' };
const S = { set: Object.assign({}, DEF, LS.get('settings', {})), doc: null, view: null, st: null, id: null, file: null, u8: null, fmt: null, lastAct: Date.now() };
let LANG = S.set.lang || ((navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
function t(k, ...a) { const e = I18N[k]; let s = e ? (LANG === 'zh' ? e[0] : e[1]) : k; a.forEach((v, i) => { s = s.split('{' + i + '}').join(v); }); return s; }
const saveSet = () => { LS.set('settings', S.set); if (typeof Sync !== 'undefined') Sync.settingsDirty(); };
function loadSt(id) { const st = Object.assign({ pos: null, posT: 0, bm: [], notes: [], del: {}, ms: 0, enc: 'auto', alt: false }, LS.get('doc.' + id, {})); st.del ||= {}; return st; }
const saveSt = debounce(() => { if (S.id && S.st) { LS.set('doc.' + S.id, S.st); Sync.stateDirty(S.id); } }, 300);
function markPos() { if (!S.mounting && S.st) S.st.posT = Date.now(); }

/* ---------- fonts ---------- */
const FONTS = {
  cjk: [
    { id: 'sys-serif', zh: '系统宋体', en: 'System Song', stack: '"Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC","Source Han Serif"', gen: 'serif' },
    { id: 'sys-sans', zh: '系统黑体', en: 'System Hei', stack: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC"', gen: 'sans-serif' },
    { id: 'sys-kai', zh: '系统楷体', en: 'System Kai', stack: '"Kaiti SC","STKaiti","KaiTi","KaiTi_GB2312","BiauKai"', gen: 'serif' },
    { id: 'sys-fang', zh: '系统仿宋', en: 'System Fangsong', stack: '"STFangsong","FangSong","FangSong_GB2312"', gen: 'serif' },
    { id: 'g-nserif', zh: '思源宋体', en: 'Noto Serif SC', g: 'Noto Serif SC', w: '400;700', gen: 'serif' },
    { id: 'g-nsans', zh: '思源黑体', en: 'Noto Sans SC', g: 'Noto Sans SC', w: '400;700', gen: 'sans-serif' },
    { id: 'g-wenkai', zh: '霞鹜文楷', en: 'LXGW WenKai', g: 'LXGW WenKai TC', w: '400;700', gen: 'serif' },
    { id: 'g-xiaowei', zh: '站酷小薇', en: 'ZCOOL XiaoWei', g: 'ZCOOL XiaoWei', gen: 'serif' },
    { id: 'g-mashan', zh: '马善政楷书', en: 'Ma Shan Zheng', g: 'Ma Shan Zheng', gen: 'serif' },
    { id: 'g-longcang', zh: '龙藏体', en: 'Long Cang', g: 'Long Cang', gen: 'serif' },
    { id: 'g-nserif-tc', zh: '思源宋体 繁', en: 'Noto Serif TC', g: 'Noto Serif TC', w: '400;700', gen: 'serif' },
    { id: 'g-nsans-tc', zh: '思源黑体 繁', en: 'Noto Sans TC', g: 'Noto Sans TC', w: '400;700', gen: 'sans-serif' },
  ],
  latin: [
    { id: 'follow', zh: '跟随中文字体', en: 'Same as Chinese' },
    { id: 'sys-georgia', zh: 'Georgia', en: 'Georgia', stack: 'Georgia,"Times New Roman"' },
    { id: 'sys-palatino', zh: 'Palatino', en: 'Palatino', stack: '"Palatino Linotype",Palatino,"Book Antiqua"' },
    { id: 'sys-charter', zh: 'Charter', en: 'Charter', stack: 'Charter,"Bitstream Charter","Sitka Text",Cambria' },
    { id: 'sys-helv', zh: 'Helvetica', en: 'Helvetica', stack: '"Helvetica Neue",Helvetica,Arial' },
    { id: 'sys-ui', zh: '系统界面', en: 'System UI', stack: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto' },
    { id: 'g-literata', zh: 'Literata', en: 'Literata', g: 'Literata', w: '400;700' },
    { id: 'g-sserif', zh: 'Source Serif 4', en: 'Source Serif 4', g: 'Source Serif 4', w: '400;700' },
    { id: 'g-garamond', zh: 'EB Garamond', en: 'EB Garamond', g: 'EB Garamond', w: '400;700' },
    { id: 'g-crimson', zh: 'Crimson Pro', en: 'Crimson Pro', g: 'Crimson Pro', w: '400;700' },
    { id: 'g-merri', zh: 'Merriweather', en: 'Merriweather', g: 'Merriweather', w: '400;700' },
    { id: 'g-lora', zh: 'Lora', en: 'Lora', g: 'Lora', w: '400;700' },
    { id: 'g-inter', zh: 'Inter', en: 'Inter', g: 'Inter', w: '400;700' },
    { id: 'g-atkinson', zh: 'Atkinson Hyperlegible', en: 'Atkinson Hyperlegible', g: 'Atkinson Hyperlegible', w: '400;700' },
    { id: 'g-plex', zh: 'IBM Plex Sans', en: 'IBM Plex Sans', g: 'IBM Plex Sans', w: '400;700' },
  ],
  mono: [
    { id: 'sys-mono', zh: '系统等宽', en: 'System mono', stack: '"SF Mono",Menlo,Consolas,"Liberation Mono"' },
    { id: 'g-jetbrains', zh: 'JetBrains Mono', en: 'JetBrains Mono', g: 'JetBrains Mono', w: '400;700' },
    { id: 'g-plexmono', zh: 'IBM Plex Mono', en: 'IBM Plex Mono', g: 'IBM Plex Mono', w: '400;700' },
    { id: 'g-firacode', zh: 'Fira Code', en: 'Fira Code', g: 'Fira Code', w: '400;700' },
  ],
};
const fontLabel = f => f.custom ? f.family : (LANG === 'zh' ? f.zh : f.en);
const customFonts = () => LS.get('customFonts', []);
function fontById(kind, id) { return FONTS[kind].find(f => f.id === id) || customFonts().find(f => f.id === id) || null; }
const loadedLinks = new Set();
function loadGoogle(f, text) {
  if (!f || !f.g) return;
  const fam = f.g.replace(/ /g, '+') + (f.w && !text ? ':wght@' + f.w : '');
  const href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap` + (text ? '&text=' + encodeURIComponent(text) : '');
  if (loadedLinks.has(href)) return; loadedLinks.add(href);
  document.head.append(h('link', { rel: 'stylesheet', href }));
}
const registered = new Set();
async function registerUpload(f) {
  if (!f || f.kind !== 'upload' || registered.has(f.family)) return;
  registered.add(f.family);
  try { const rec = await IDB.get('fonts', f.family).catch(() => null); const data = rec ? rec.data : await Sync.downloadFont(f); if (!data) { registered.delete(f.family); return; } const ff = new FontFace(f.family, data); await ff.load(); document.fonts.add(ff); }
  catch (e) { registered.delete(f.family); console.warn('font', e); }
}
const stackOf = f => !f ? '' : f.stack ? f.stack : f.g ? `"${f.g}"` : f.custom ? `"${f.family}"` : '';
function applyFonts() {
  const c = fontById('cjk', S.set.cjk) || FONTS.cjk[0];
  const l = S.set.latin === 'follow' ? null : fontById('latin', S.set.latin);
  const m = fontById('mono', S.set.mono) || FONTS.mono[0];
  for (const f of [c, l, m]) if (f) { if (f.g) loadGoogle(f); else if (f.kind === 'upload') registerUpload(f); }
  const root = document.documentElement.style;
  root.setProperty('--f-body', [l && stackOf(l), stackOf(c), c.gen || 'serif'].filter(Boolean).join(','));
  root.setProperty('--f-mono', [stackOf(m), 'monospace'].join(','));
}
function applySettings() {
  const st = S.set, root = document.documentElement;
  root.dataset.theme = st.theme;
  const r = root.style;
  r.setProperty('--fs', st.fs + 'px'); r.setProperty('--lh', st.lh); r.setProperty('--ps', st.ps + 'em');
  r.setProperty('--ls', st.ls + 'em'); r.setProperty('--pw', st.pw + 'px'); r.setProperty('--align', st.align);
  const cjk = S.doc ? S.doc.cjk : LANG === 'zh';
  r.setProperty('--indent', st.indent === 'on' || (st.indent === 'auto' && cjk && S.doc && S.doc.textual !== false) ? '2em' : '0');
  applyFonts();
  document.body.classList.toggle('pdf-invert', isDark() && st.pdfInvert && S.view === Pdf);
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = getComputedStyle(root).getPropertyValue('--shell').trim();
}
function setOpt(k, v) {
  const keep = S.view === Flow ? Flow.anchorO : null;
  S.set[k] = v; saveSet(); applySettings();
  if (S.view === Flow && ['fs', 'lh', 'ps', 'ls', 'pw', 'mode', 'cjk', 'latin', 'indent', 'align', 'mono'].includes(k)) Flow.relayout(keep);
  if (S.view === Pdf && k === 'theme') Pdf.refreshTheme();
}

/* ---------- small UI helpers ---------- */
let toastTm;
function toast(msg, ms = 2200) { const el = $('#toast'); el.textContent = msg; el.classList.add('open'); clearTimeout(toastTm); toastTm = setTimeout(() => el.classList.remove('open'), ms); }
function modal({ title, body, buttons = [{ label: t('close'), primary: true }], onOpen, width }) {
  return new Promise(res => {
    const box = $('#mbox'); box.innerHTML = ''; box.style.width = width || '';
    const close = v => { $('#modal').classList.remove('open'); document.removeEventListener('keydown', onKey, true); res(v); };
    const footer = h('footer');
    for (const b of buttons) footer.append(h('button', { class: 'btn' + (b.primary ? ' primary' : ''), onclick: async () => { const r = b.onClick ? await b.onClick() : b.value; if (r !== false) close(r === undefined ? b.value : r); } }, b.label));
    box.append(h('header', { text: title }), h('div', { class: 'mb' }, body), footer);
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } };
    document.addEventListener('keydown', onKey, true);
    $('#modal').classList.add('open');
    $('#modal').onclick = e => { if (e.target.id === 'modal') close(null); };
    if (onOpen) onOpen(box, close);
  });
}
function askPassword(wrong) {
  const inp = h('input', { type: 'password', placeholder: t('password') });
  return modal({ title: t(wrong ? 'pwWrong' : 'pwNeed'), body: inp, buttons: [{ label: t('cancel'), value: null }, { label: t('open'), primary: true, onClick: () => inp.value }],
    onOpen: (b, close) => { inp.focus(); inp.onkeydown = e => { if (e.key === 'Enter') close(inp.value); }; } });
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(t('copied')); return true; }
  catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove();
    if (ok) { toast(t('copied')); return true; }
    const area = h('textarea', { rows: 12 }); area.value = text;
    modal({ title: t('copyManual'), body: area, onOpen: () => { area.focus(); area.select(); } });
    return false;
  }
}
function setLoading(msg) {
  let el = $('#loading');
  if (msg == null) { if (el) el.remove(); return; }
  if (!el) { el = h('div', { id: 'loading' }); $('#main').append(el); }
  el.innerHTML = ''; el.append(h('div', {}, h('div', { class: 'spin' }), h('div', { text: msg })));
}
function closePops(except) { for (const p of $$('.pop.open')) if (p !== except) p.classList.remove('open'); $$('#top .ib.on-pop').forEach(b => b.classList.remove('on-pop', 'on')); }
function openPop(pop, btn, render) {
  const open = pop.classList.contains('open');
  closePops(); if (open) return;
  render(pop);
  pop.classList.add('open'); btn.classList.add('on', 'on-pop');
  const r = btn.getBoundingClientRect(); const w = pop.offsetWidth;
  pop.style.top = (r.bottom + 6) + 'px';
  pop.style.left = clamp(r.right - w, 8, innerWidth - w - 8) + 'px';
}

/* ======================= Flow viewer ======================= */
const Flow = {
  mount(doc) {
    this.doc = doc; this.si = -1; this.tok = 0; this.page = 0; this.pages = 1; this.step = 1; this.anchorO = 0;
    const cum = [0]; for (const s of doc.sections) cum.push(cum[cum.length - 1] + (s.len || 1));
    this.cum = cum; this.total = cum[cum.length - 1] || 1;
    stage.className = ''; stage.innerHTML = '';
    this.tabsEl = doc.tabs ? h('div', { class: 'sheet-tabs' }) : null;
    this.art = h('article', { class: 'flow', lang: doc.lang || (doc.cjk ? 'zh' : 'en') });
    this.end = h('nav', { class: 'endnav' });
    this.wrap = h('div', { class: 'flow-wrap' }, this.tabsEl, this.art, this.end);
    stage.append(this.wrap);
    if (this.tabsEl) doc.sections.forEach((s, i) => this.tabsEl.append(h('button', { 'data-i': i, onclick: () => this.show(i) }, s.title)));
    stage.onscroll = throttle(() => this.onScroll(), 90);
    stage.onwheel = e => { if (this.isPaged() && !e.ctrlKey) { e.preventDefault(); const now = Date.now(); if (now - (this.wt || 0) < 280 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 4) return; this.wt = now; (e.deltaY + e.deltaX > 0 ? this.next() : this.prev()); } };
    this.art.addEventListener('click', e => this.onClick(e));
    stage.onclick = e => { if (!this.isPaged() || !this.art.contains(e.target)) UI.tapExitsImmersive(e); };
    this.ro = new ResizeObserver(debounce(() => this.relayout(this.anchorO), 150)); this.ro.observe(stage);
    this.onImg = debounce(() => this.relayout(this.anchorO), 120);
    const pos = S.st.pos;
    return pos && pos.s != null ? this.show(pos.s, { offset: pos.o }) : this.show(0);
  },
  unmount() { if (this.ro) this.ro.disconnect(); stage.onscroll = null; stage.onwheel = null; stage.onclick = null; document.body.classList.remove('paged', 'spread'); $('#pagefoot').classList.add('hidden'); },
  isPaged() { return this.doc && !this.doc.fixed && S.set.mode !== 'scroll'; },
  spread() { return S.set.mode === 'spread' && stage.clientWidth >= 860; },
  sec() { return this.doc.sections[this.si]; },
  async show(si, opts = {}) {
    const doc = this.doc; si = clamp(si, 0, doc.sections.length - 1);
    const tok = ++this.tok;
    if (si !== this.si || opts.force) {
      const sec = doc.sections[si];
      this.art.innerHTML = '';
      this.art.className = 'flow' + (doc.fixed ? ' fixed ' + (doc.fixedClass || '') : '');
      try { if (sec.render) await sec.render(this.art); else this.art.innerHTML = sec.html; }
      catch (e) { console.error(e); this.art.innerHTML = `<p>${esc(t('renderFail'))}: ${esc(e.message || e)}</p>`; }
      if (tok !== this.tok) return;
      if (doc.resolve) { try { await doc.resolve(this.art, si); } catch (e) { console.warn(e); } }
      if (tok !== this.tok) return;
      this.si = si;
      for (const img of this.art.querySelectorAll('img')) if (!img.complete) img.addEventListener('load', this.onImg, { once: true });
      Notes.applyFlow(); Search.applyFlow();
      this.renderEnd();
      if (this.tabsEl) $$('button', this.tabsEl).forEach(b => b.classList.toggle('on', +b.dataset.i === si));
      if (TTS.on && !TTS.driving) TTS.stop();
    }
    this.layout();
    if (opts.anchor) { const el = this.findAnchor(opts.anchor); if (el) this.revealEl(el, true); else this.gotoStart(); }
    else if (opts.offset != null) this.gotoOffset(opts.offset);
    else if (opts.ratio != null) this.gotoRatio(opts.ratio);
    else if (opts.end) this.gotoEnd();
    else this.gotoStart();
    this.anchorO = opts.offset != null ? opts.offset : this.visibleOffset();
    this.afterMove();
  },
  findAnchor(id) { try { return this.art.querySelector('#' + CSS.escape(id)) || this.art.querySelector(`[name="${CSS.escape(id)}"]`); } catch { return null; } },
  renderEnd() {
    const e = this.end; e.innerHTML = ''; const secs = this.doc.sections;
    if (secs.length < 2 || this.doc.tabs) return;
    if (this.si > 0) e.append(h('button', { onclick: () => this.show(this.si - 1) }, t('prevCh'), h('b', { text: secs[this.si - 1].title })));
    if (this.si < secs.length - 1) e.append(h('button', { class: 'nx', onclick: () => this.show(this.si + 1) }, t('nextCh'), h('b', { text: secs[this.si + 1].title })));
    else e.append(h('button', { class: 'nx', disabled: true, style: { opacity: '.6', cursor: 'default' } }, t('theEnd'), h('b', { text: this.doc.title })));
  },
  layout() {
    const paged = this.isPaged(), spread = paged && this.spread();
    document.body.classList.toggle('paged', paged); document.body.classList.toggle('spread', spread);
    const art = this.art;
    art.querySelectorAll(':scope > .col-fill').forEach(x => x.remove());
    if (!paged) { art.style.cssText = ''; this.pages = 1; this.page = 0; $('#pagefoot').classList.add('hidden'); return; }
    const W = stage.clientWidth, H = stage.clientHeight;
    const padY = clamp(Math.round(H * 0.07), 24, 60), padB = padY + 22;
    const margin = clamp(W * 0.06, 18, 80);
    const gap = spread ? clamp(W * 0.07, 48, 120) : 80;
    const colW = spread ? Math.min(S.set.pw, (W - 2 * margin - gap) / 2) : Math.min(S.set.pw, W - 2 * margin);
    const colH = Math.max(120, H - padY - padB);
    stage.style.setProperty('--pad-y', padY + 'px'); stage.style.setProperty('--colh', (colH - 8) + 'px');
    Object.assign(art.style, { width: (spread ? colW * 2 + gap : colW) + 'px', height: colH + 'px', columnCount: spread ? 2 : 1, columnGap: gap + 'px' });
    this.step = colW + gap; this.spr = spread;
    let cols = Math.max(1, Math.round((art.scrollWidth + gap) / this.step));
    if (spread && cols % 2) { art.append(h('div', { class: 'col-fill' })); cols = Math.max(1, Math.round((art.scrollWidth + gap) / this.step)); }
    this.pages = spread ? Math.ceil(cols / 2) : cols;
    this.page = clamp(this.page, 0, this.pages - 1);
    $('#pagefoot').classList.remove('hidden');
  },
  relayout(keep) {
    if (!this.art || this.si < 0) return;
    const o = keep != null ? keep : this.visibleOffset();
    this.layout(); this.gotoOffset(o); this.anchorO = o; this.afterMove(true);
  },
  pageStep() { return this.spr ? this.step * 2 : this.step; },
  setPage(p) { this.page = clamp(p, 0, this.pages - 1); this.art.scrollLeft = this.page * this.pageStep(); this.footer(); },
  footer() { const f = $('#pagefoot'); if (this.isPaged()) f.textContent = this.spr ? `${this.page * 2 + 1}–${Math.min(this.page * 2 + 2, this.pages * 2)} / ${this.pages * 2}` : `${this.page + 1} / ${this.pages}`; },
  pageOfRect(r) { const ar = this.art.getBoundingClientRect(); const x = r.left - ar.left + this.art.scrollLeft; return Math.floor((x + 2) / this.pageStep()); },
  gotoStart() { if (this.isPaged()) this.setPage(0); else stage.scrollTop = 0; },
  gotoEnd() { if (this.isPaged()) this.setPage(this.pages - 1); else stage.scrollTop = stage.scrollHeight; },
  gotoRatio(r) { if (this.isPaged()) this.setPage(Math.round(r * (this.pages - 1))); else stage.scrollTop = r * (stage.scrollHeight - stage.clientHeight); },
  gotoOffset(o) {
    if (!o) return this.gotoStart();
    const r = rectAt(this.art, o); if (!r) return this.gotoStart();
    if (this.isPaged()) this.setPage(this.pageOfRect(r));
    else stage.scrollTop += r.top - stage.getBoundingClientRect().top - 36;
  },
  revealEl(el, top) {
    const r = el.getBoundingClientRect();
    if (this.isPaged()) { this.setPage(this.pageOfRect(r)); return; }
    const sr = stage.getBoundingClientRect();
    if (top) stage.scrollTop += r.top - sr.top - 28;
    else if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) stage.scrollTop += r.top - sr.top - sr.height * 0.35;
  },
  visibleOffset() {
    const art = this.art; if (!art || !art.firstChild) return 0;
    const ar = art.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const paged = this.isPaged();
    const y0 = paged ? ar.top + 2 : Math.max(sr.top, ar.top) + 4;
    const x0 = ar.left;
    const colW = paged && this.spr ? ar.width - this.step : ar.width;
    for (let dy = 0; dy < 360; dy += 10) {
      for (const fx of [0.04, 0.2, 0.45, 0.7, 0.92]) {
        const c = caretAt(x0 + colW * fx, y0 + dy);
        if (c && art.contains(c.node)) { const o = offsetOf(art, c.node, c.off); if (!paged || this.pageOfRect(rectAt(art, o) || ar) === this.page) return o; }
      }
    }
    return Math.round(this.withinRatio() * art.textContent.length);
  },
  withinRatio() {
    if (this.isPaged()) return this.pages > 1 ? this.page / (this.pages - 1) : (this.page ? 1 : 0);
    const max = stage.scrollHeight - stage.clientHeight; return max > 2 ? clamp(stage.scrollTop / max, 0, 1) : 0;
  },
  atEnd() { return this.isPaged() ? this.page >= this.pages - 1 : stage.scrollTop >= stage.scrollHeight - stage.clientHeight - 4; },
  progress() {
    if (this.si < 0) return 0;
    const len = this.sec().len || 1; const w = this.atEnd() ? 1 : this.withinRatio();
    return clamp((this.cum[this.si] + w * len) / this.total, 0, 1);
  },
  next() {
    if (this.isPaged()) { if (this.page < this.pages - 1) { this.setPage(this.page + 1); this.userMoved(); } else if (this.si < this.doc.sections.length - 1) this.show(this.si + 1); }
    else { if (!this.atEnd()) stage.scrollBy({ top: stage.clientHeight * 0.88, behavior: reduceMotion() ? 'auto' : 'smooth' }); else if (this.si < this.doc.sections.length - 1) this.show(this.si + 1); }
  },
  prev() {
    if (this.isPaged()) { if (this.page > 0) { this.setPage(this.page - 1); this.userMoved(); } else if (this.si > 0) this.show(this.si - 1, { end: true }); }
    else { if (stage.scrollTop > 4) stage.scrollBy({ top: -stage.clientHeight * 0.88, behavior: reduceMotion() ? 'auto' : 'smooth' }); else if (this.si > 0) this.show(this.si - 1, { end: true }); }
  },
  userMoved() { this.anchorO = this.visibleOffset(); this.afterMove(); },
  onScroll() { if (this.isPaged()) return; Sel.hide(); this.anchorO = this.visibleOffset(); this.afterMove(); },
  afterMove(quiet) {
    this.footer(); UI.updatePos(); Side.syncActive(); UI.syncBookmark();
    S.st.pos = { s: this.si, o: this.anchorO }; markPos(); saveSt(); Shelf.progress(this.progress());
  },
  getLoc() { return { s: this.si, o: this.anchorO }; },
  goLoc(l) { return this.show(l.s, { offset: l.o }); },
  onClick(e) {
    const a = e.target.closest('a');
    if (a) {
      const dh = a.getAttribute('data-href');
      if (dh) { e.preventDefault(); const [s, frag] = dh.split('#'); this.show(+s, { anchor: frag || null }); return; }
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault(); const id = decodeURIComponent(href.slice(1)); const el = this.findAnchor(id);
        if (el) { this.revealEl(el, true); this.userMoved(); }
        else if (this.doc.anchors && this.doc.anchors.has(id)) this.show(this.doc.anchors.get(id), { anchor: id });
        return;
      }
      return;
    }
    const mk = e.target.closest('mark.hl');
    const sel = getSelection();
    if (mk && sel.isCollapsed) { Sel.editNote(mk.dataset.nid, mk); return; }
    if (this.isPaged() && sel.isCollapsed) {
      const r = stage.getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width;
      if (fx < 0.28) this.prev(); else if (fx > 0.72) this.next(); else UI.toggleImmersive();
    }
  },
  textOf(si) {
    const doc = this.doc; doc._txt ||= [];
    if (doc._txt[si] != null) return doc._txt[si];
    const sec = doc.sections[si];
    if (sec.render) return si === this.si ? this.art.textContent : '';
    const tmp = document.createElement('template'); tmp.innerHTML = sec.html;
    return doc._txt[si] = tmp.content.textContent;
  },
  posInfo() {
    const sec = this.sec(); if (!sec) return {};
    const speed = this.doc.cjk ? 430 : 1250;
    const left = (sec.len || 1) * (1 - (this.atEnd() ? 1 : this.withinRatio()));
    return { label: sec.title, pct: this.progress(), eta: this.doc.fixed ? '' : t('chLeft', fmtMin(left / speed)) };
  },
  async jumpProgress(p) {
    const target = p * this.total; let si = 0;
    while (si < this.doc.sections.length - 1 && this.cum[si + 1] <= target) si++;
    const within = (target - this.cum[si]) / (this.doc.sections[si].len || 1);
    await this.show(si, { ratio: clamp(within, 0, 1) });
    this.anchorO = this.visibleOffset(); this.afterMove();
  },
  sectionAtProgress(p) { const target = p * this.total; let si = 0; while (si < this.doc.sections.length - 1 && this.cum[si + 1] <= target) si++; return this.doc.sections[si].title; },
  visibleSpan() { const len = this.art.textContent.length || 1; const per = this.isPaged() ? len / Math.max(1, this.pages) : len * stage.clientHeight / Math.max(stage.clientHeight, this.art.scrollHeight); return [this.anchorO, this.anchorO + Math.max(per, 1)]; },
};

/* ======================= PDF viewer ======================= */
const PX = 96 / 72;
const Pdf = {
  async mount(doc) {
    this.doc = doc; this.pdf = doc.pdf; this.n = this.pdf.numPages; this.rot = 0; this.zoom = 1; this.fit = S.set.pdfFit; this.spread = S.set.spread;
    this.P = []; this.rendered = new Set(); this.texts = []; this.cur = 0;
    stage.className = 'pdf-stage'; stage.innerHTML = '';
    document.body.classList.remove('paged', 'spread');
    const p1 = await this.pdf.getPage(1); const v = p1.getViewport({ scale: 1 }); this.base = { w: v.width, h: v.height };
    this.sizes = new Array(this.n).fill(null); this.sizes[0] = this.base;
    this.box = h('div', { class: 'pdfpages' + (this.spread ? ' spread' : '') });
    for (let i = 0; i < this.n; i++) { const el = h('div', { class: 'pdfpage', 'data-i': i }, h('div', { class: 'ph', text: i + 1 })); this.P.push({ el, sc: 0, rot: 0, tok: 0, task: null }); this.box.append(el); }
    stage.append(this.box);
    this.io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) this.render(+e.target.dataset.i); }, { root: stage, rootMargin: '150% 0px' });
    this.P.forEach(p => this.io.observe(p.el));
    stage.onscroll = throttle(() => this.onScroll(), 90);
    stage.onwheel = e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); } };
    this.ro = new ResizeObserver(debounce(() => { if (this.fit !== 'num') this.applyScale(); }, 150)); this.ro.observe(stage);
    stage.addEventListener('click', this.onTap = e => UI.tapExitsImmersive(e));
    stage.addEventListener('mousedown', this.onDown = e => { const tl = e.target.closest && e.target.closest('.textLayer'); if (tl) tl.classList.add('selecting'); });
    document.addEventListener('mouseup', this.onUp = () => $$('.textLayer.selecting').forEach(x => x.classList.remove('selecting')));
    applySettings();
    this.applyScale(false);
    const pos = S.st.pos;
    if (pos && pos.p != null) this.goto(pos.p, pos.y || 0); else this.afterMove();
  },
  unmount() { if (this.io) this.io.disconnect(); if (this.ro) this.ro.disconnect(); stage.onscroll = null; stage.onwheel = null; stage.removeEventListener('mousedown', this.onDown); stage.removeEventListener('click', this.onTap); document.removeEventListener('mouseup', this.onUp); this.P.forEach(p => { try { p.task && p.task.cancel(); } catch {} }); document.body.classList.remove('pdf-invert'); },
  sizeOf(i) { const s = this.sizes[i] || this.base; return this.rot % 180 ? { w: s.h, h: s.w } : s; },
  scale() { return this.zoom * PX; },
  computeZoom() {
    const W = stage.clientWidth - 40, H = stage.clientHeight - 40, s = this.sizeOf(this.cur || 0);
    const pw = (this.spread ? s.w * 2 + 10 : s.w) * PX;
    if (this.fit === 'width') return clamp(W / pw, 0.1, 6);
    if (this.fit === 'page') return clamp(Math.min(W / pw, H / (s.h * PX)), 0.1, 6);
    return this.zoom;
  },
  applyScale(keep = true) {
    const loc = keep ? this.getLoc() : null;
    this.zoom = this.computeZoom();
    const sc = this.scale();
    this.box.classList.toggle('spread', this.spread);
    for (let i = 0; i < this.n; i++) { const s = this.sizeOf(i), el = this.P[i].el; el.style.width = Math.floor(s.w * sc) + 'px'; el.style.height = Math.floor(s.h * sc) + 'px'; el.style.setProperty('--scale-factor', sc); }
    if (loc) this.goto(loc.p, loc.y, true);
    this.renderVisible(); UI.updateZoom();
  },
  renderVisible() { const sr = stage.getBoundingClientRect(); for (let i = Math.max(0, this.cur - 4); i < Math.min(this.n, this.cur + 6); i++) { const r = this.P[i].el.getBoundingClientRect(); if (r.bottom > sr.top - sr.height && r.top < sr.bottom + sr.height) this.render(i); } },
  async render(i) {
    const P = this.P[i]; const sc = this.scale(), rot = this.rot;
    if (P.sc === sc && P.rot === rot) return;
    if (P.task) { try { P.task.cancel(); } catch {} }
    const tok = ++P.tok;
    let page; try { page = await this.pdf.getPage(i + 1); } catch { return; }
    if (tok !== P.tok) return;
    if (!this.sizes[i]) { const v1 = page.getViewport({ scale: 1 }); this.sizes[i] = { w: v1.width, h: v1.height }; if (Math.abs(v1.width - this.base.w) > 1 || Math.abs(v1.height - this.base.h) > 1) { const s = this.sizeOf(i); P.el.style.width = Math.floor(s.w * sc) + 'px'; P.el.style.height = Math.floor(s.h * sc) + 'px'; } }
    const vp = page.getViewport({ scale: sc, rotation: (page.rotate + rot) % 360 });
    let ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    if (vp.width * vp.height * ratio * ratio > 1.6e7) ratio = Math.sqrt(1.6e7 / (vp.width * vp.height));
    const cv = document.createElement('canvas'); cv.width = Math.floor(vp.width * ratio); cv.height = Math.floor(vp.height * ratio);
    P.task = page.render({ canvasContext: cv.getContext('2d', { alpha: false }), viewport: vp, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null });
    try { await P.task.promise; } catch (e) { if (!e || e.name !== 'RenderingCancelledException') console.warn(e); return; }
    if (tok !== P.tok) return;
    P.task = null;
    const el = P.el; el.innerHTML = ''; el.append(cv, h('div', { class: 'tint' }));
    const tl = h('div', { class: 'textLayer' }); el.append(tl);
    P.sc = sc; P.rot = rot; this.rendered.add(i);
    try { const tc = await this.textContent(i, page); const task = pdfjsLib.renderTextLayer({ textContentSource: tc, container: tl, viewport: vp, textDivs: [] }); await task.promise; } catch (e) { console.warn('textlayer', e); }
    if (tok !== P.tok) return;
    tl.append(h('div', { class: 'endOfContent' }));
    this.links(page, vp, el);
    Notes.applyPdf(i, tl); Search.applyPdf(i, tl);
    this.evict();
  },
  async links(page, vp, el) {
    try {
      const anns = await page.getAnnotations({ intent: 'display' });
      for (const a of anns) {
        if (a.subtype !== 'Link') continue;
        const [x1, y1, x2, y2] = vp.convertToViewportRectangle(a.rect);
        const style = { left: Math.min(x1, x2) + 'px', top: Math.min(y1, y2) + 'px', width: Math.abs(x2 - x1) + 'px', height: Math.abs(y2 - y1) + 'px' };
        const url = a.url || a.unsafeUrl;
        if (url) el.append(h('a', { class: 'pdflink', href: url, target: '_blank', rel: 'noopener', title: url, style }));
        else if (a.dest) el.append(h('a', { class: 'pdflink', href: '#', style, onclick: async e => { e.preventDefault(); const p = await resolvePdfDest(this.pdf, a.dest); if (p != null) this.goto(p); } }));
      }
    } catch {}
  },
  evict() {
    if (this.rendered.size <= 18) return;
    const far = [...this.rendered].sort((a, b) => Math.abs(b - this.cur) - Math.abs(a - this.cur));
    for (const i of far.slice(0, this.rendered.size - 12)) { if (Math.abs(i - this.cur) < 6) continue; const P = this.P[i]; P.el.innerHTML = ''; P.el.append(h('div', { class: 'ph', text: i + 1 })); P.sc = 0; P.tok++; this.rendered.delete(i); }
  },
  async textContent(i, page) {
    if (this.texts[i]) return this.texts[i];
    page ||= await this.pdf.getPage(i + 1);
    return this.texts[i] = await page.getTextContent();
  },
  async pageText(i) { const tc = await this.textContent(i); return tc.items.map(x => x.str || '').join(''); },
  pageAt(y) { let lo = 0, hi = this.n - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (this.P[mid].el.offsetTop <= y) lo = mid; else hi = mid - 1; } return lo; },
  onScroll() {
    Sel.hide();
    const y = stage.scrollTop + stage.clientHeight * 0.3;
    this.cur = this.pageAt(y);
    this.afterMove();
  },
  afterMove() {
    UI.updatePos(); Side.syncActive(); UI.syncBookmark();
    S.st.pos = this.getLoc(); markPos(); saveSt(); Shelf.progress(this.progress());
  },
  getLoc() { const el = this.P[this.cur] && this.P[this.cur].el; const y = el ? clamp((stage.scrollTop - el.offsetTop) / el.offsetHeight, -0.2, 1) : 0; return { p: this.cur, y }; },
  goLoc(l) { this.goto(l.p, l.y || 0); },
  goto(p, y = 0, quiet) {
    p = clamp(p | 0, 0, this.n - 1); const el = this.P[p].el;
    stage.scrollTop = el.offsetTop - (y ? 0 : 14) + y * el.offsetHeight;
    this.cur = p; this.renderVisible();
    if (!quiet) this.afterMove();
  },
  next() { this.goto(this.cur + (this.spread ? 2 : 1)); },
  prev() { this.goto(this.cur - (this.spread ? 2 : 1)); },
  progress() { return this.n > 1 ? this.cur / (this.n - 1) : 1; },
  posInfo() { return { pageInput: true, cur: this.cur + 1, n: this.n, pct: this.progress(), eta: '' }; },
  jumpProgress(p) { this.goto(Math.round(p * (this.n - 1))); },
  sectionAtProgress(p) { return t('pageN', Math.round(p * (this.n - 1)) + 1); },
  zoomBy(f) { this.fit = 'num'; this.zoom = clamp(this.zoom * f, 0.2, 6); this.applyScale(); },
  setFit(f) { this.fit = f; S.set.pdfFit = f; saveSet(); this.applyScale(); },
  rotate() { this.rot = (this.rot + 90) % 360; this.P.forEach(p => p.sc = 0); this.applyScale(); },
  toggleSpread() { this.spread = !this.spread; S.set.spread = this.spread; saveSet(); this.applyScale(); },
  refreshTheme() { document.body.classList.toggle('pdf-invert', isDark() && S.set.pdfInvert); },
};

/* ======================= Gallery viewer ======================= */
const Gallery = {
  mount(doc) {
    this.doc = doc; this.cur = 0; this.zoom = 1; this.rot = 0; this.mode = (doc.single || doc.comic) ? 'single' : 'strip';
    stage.className = 'gal-stage';
    const pos = S.st.pos; if (pos && pos.p != null) this.cur = clamp(pos.p, 0, doc.items.length - 1);
    stage.onscroll = throttle(() => this.onScroll(), 100);
    stage.onwheel = e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); } };
    this.build(); this.afterMove();
  },
  unmount() { stage.onscroll = null; stage.onwheel = null; },
  build() {
    stage.innerHTML = '';
    this.box = h('div', { class: 'gal ' + this.mode + (this.zoom > 1 ? ' zoomed' : ''), style: { '--gz': this.zoom } });
    this.box.style.setProperty('--gz', this.zoom);
    const tr = this.rot ? `rotate(${this.rot}deg)` : '';
    if (this.mode === 'single') {
      const it = this.doc.items[this.cur];
      this.box.append(h('img', { src: it.url, alt: it.name, style: { transform: tr } }));
      this.box.onclick = e => { if (this.zoom > 1) return; const r = stage.getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width; if (fx < 0.3) this.prev(); else if (fx > 0.7) this.next(); else UI.toggleImmersive(); };
    } else {
      this.doc.items.forEach((it, i) => this.box.append(h('img', { src: it.url, alt: it.name, loading: 'lazy', 'data-i': i, style: { transform: tr } })));
      this.box.onclick = e => UI.tapExitsImmersive(e);
    }
    stage.append(this.box);
    if (this.mode === 'strip' && this.cur) requestAnimationFrame(() => { const im = this.box.children[this.cur]; if (im) stage.scrollTop = im.offsetTop - 12; });
  },
  onScroll() { if (this.mode !== 'strip') return; const y = stage.scrollTop + stage.clientHeight * 0.3; let c = 0; for (const im of this.box.children) { if (im.offsetTop <= y) c = +im.dataset.i; else break; } this.cur = c; this.afterMove(); },
  afterMove() { UI.updatePos(); Side.syncActive(); UI.syncBookmark(); S.st.pos = { p: this.cur }; markPos(); saveSt(); Shelf.progress(this.progress()); UI.updateZoom(); },
  goto(p) { this.cur = clamp(p, 0, this.doc.items.length - 1); if (this.mode === 'single') { this.build(); stage.scrollTop = 0; } else { const im = this.box.children[this.cur]; if (im) stage.scrollTop = im.offsetTop - 12; } this.afterMove(); },
  next() { if (this.cur < this.doc.items.length - 1) this.goto(this.cur + 1); },
  prev() { if (this.cur > 0) this.goto(this.cur - 1); },
  getLoc() { return { p: this.cur }; }, goLoc(l) { this.goto(l.p); },
  progress() { const n = this.doc.items.length; return n > 1 ? this.cur / (n - 1) : 1; },
  posInfo() { return { pageInput: this.doc.items.length > 1, cur: this.cur + 1, n: this.doc.items.length, pct: this.progress(), label: this.doc.items.length > 1 ? '' : this.doc.items[0].name }; },
  jumpProgress(p) { this.goto(Math.round(p * (this.doc.items.length - 1))); },
  sectionAtProgress(p) { return t('pageN', Math.round(p * (this.doc.items.length - 1)) + 1); },
  zoomBy(f) { this.zoom = clamp(this.zoom * f, 0.25, 8); this.build(); UI.updateZoom(); },
  setFit() { this.zoom = 1; this.build(); UI.updateZoom(); },
  rotate() { this.rot = (this.rot + 90) % 360; this.build(); },
  toggleSpread() { this.mode = this.mode === 'single' ? 'strip' : 'single'; this.build(); UI.updateZoom(); },
};

/* ======================= Notes & bookmarks ======================= */
const COLORS = [['y', 'cTeng'], ['g', 'cZhu'], ['b', 'cTian'], ['p', 'cYan'], ['v', 'cDing']];
const Notes = {
  fix(root, n) {
    const txt = root.textContent;
    if (txt.slice(n.start, n.end) === n.text) return true;
    let best = -1, bd = Infinity, i = txt.indexOf(n.text);
    while (i >= 0) { const d = Math.abs(i - n.start); if (d < bd) { bd = d; best = i; } i = txt.indexOf(n.text, i + 1); }
    if (best < 0) return false; n.end = best + n.text.length; n.start = best; return true;
  },
  mark(root, n) { wrapRange(root, n.start, n.end, () => h('mark', { class: `hl c-${n.color}${n.note ? ' has-note' : ''}`, 'data-nid': n.id })); },
  applyFlow() { if (S.view !== Flow || !Flow.art) return; const art = Flow.art; unwrap(art, 'mark.hl'); for (const n of S.st.notes) if (n.s === Flow.si && this.fix(art, n)) this.mark(art, n); },
  applyPdf(p, tl) { unwrap(tl, 'mark.hl'); for (const n of S.st.notes) if (n.p === p && this.fix(tl, n)) this.mark(tl, n); },
  refresh() {
    if (S.view === Flow) { this.applyFlow(); Search.applyFlow(); }
    else if (S.view === Pdf) for (const i of Pdf.rendered) { const tl = $('.textLayer', Pdf.P[i].el); if (tl) { unwrap(tl, 'mark.hit'); this.applyPdf(i, tl); Search.applyPdf(i, tl); } }
    if (Side.tab === 'notes') Side.render();
  },
  add(ctx, color) {
    const n = { id: uid(), start: ctx.start, end: ctx.end, text: ctx.text, color, note: '', t: Date.now() };
    if (ctx.p != null) n.p = ctx.p; else n.s = ctx.s;
    S.st.notes.push(n); saveSt(); this.refresh(); return n;
  },
  get(id) { return S.st.notes.find(n => n.id === id); },
  del(id) { S.st.notes = S.st.notes.filter(n => n.id !== id); S.st.del[id] = Date.now(); saveSt(); this.refresh(); },
  sorted() { return [...S.st.notes].sort((a, b) => ((a.s ?? a.p) - (b.s ?? b.p)) || a.start - b.start); },
  async edit(n) {
    const ta = h('textarea', { rows: 5, placeholder: t('notePh') }); ta.value = n.note || '';
    const r = await modal({ title: t('editNote'), body: h('div', {}, h('blockquote', { text: n.text }), ta), buttons: [{ label: t('cancel'), value: null }, { label: t('save'), primary: true, onClick: () => ta.value }], onOpen: () => ta.focus() });
    if (r == null) return; n.note = r.trim(); n.u = Date.now(); saveSt(); this.refresh();
  },
  where(n) { if (n.p != null) return t('pageN', n.p + 1); const sec = S.doc.sections && S.doc.sections[n.s]; return sec ? sec.title : ''; },
  go(n) {
    if (n.p != null) { Pdf.goto(n.p); setTimeout(() => { const m = $(`mark[data-nid="${n.id}"]`, stage); if (m) m.scrollIntoView({ block: 'center' }); }, 400); }
    else Flow.show(n.s, { offset: n.start }).then(() => { const m = $(`mark[data-nid="${n.id}"]`, Flow.art); if (m) { Flow.revealEl(m); Flow.userMoved(); } });
  },
  markdown() {
    const d = S.doc; let md = `# ${d.title}\n\n`; if (d.author) md += `${d.author}\n\n`;
    let lastWhere = null;
    for (const n of this.sorted()) {
      const w = this.where(n); if (w !== lastWhere) { md += `## ${w}\n\n`; lastWhere = w; }
      md += `> ${n.text.replace(/\n+/g, ' ')}\n\n`; if (n.note) md += `${n.note}\n\n`;
    }
    const bms = S.st.bm; if (bms.length) { md += `## ${t('bookmarks')}\n\n`; for (const b of bms) md += `- ${b.label}${b.text ? ' — ' + b.text : ''}\n`; }
    return md;
  },
};
const Bookmarks = {
  current() {
    const v = S.view, bm = S.st ? S.st.bm : [];
    if (v === Flow) { const [a, b] = Flow.visibleSpan(); return bm.filter(x => x.s === Flow.si && x.o >= a - 2 && x.o < b); }
    if (v === Pdf || v === Gallery) return bm.filter(x => x.p === v.cur);
    return [];
  },
  toggle() {
    const v = S.view; if (!v) return; const cur = this.current();
    if (cur.length) { S.st.bm = S.st.bm.filter(x => !cur.includes(x)); cur.forEach(x => S.st.del[x.id] = Date.now()); toast(t('bmRemoved')); }
    else {
      const b = { id: uid(), t: Date.now() };
      if (v === Flow) { b.s = Flow.si; b.o = Flow.anchorO; b.label = Flow.sec().title; b.text = Flow.art.textContent.slice(b.o, b.o + 70).replace(/\s+/g, ' ').trim(); }
      else { b.p = v.cur; b.label = t('pageN', v.cur + 1); b.text = ''; if (v === Pdf) Pdf.pageText(v.cur).then(tx => { b.text = tx.slice(0, 70).trim(); b.u = Date.now(); saveSt(); if (Side.tab === 'bm') Side.render(); }); }
      S.st.bm.push(b); toast(t('bmAdded'));
    }
    saveSt(); UI.syncBookmark(); if (Side.tab === 'bm') Side.render();
  },
  go(b) { if (b.s != null) Flow.show(b.s, { offset: b.o }); else S.view.goto(b.p); },
};

/* ======================= Search ======================= */
const Search = {
  q: '', res: [], idx: -1, tok: 0, busy: false,
  async run(q) {
    q = q.trim(); const tok = ++this.tok; this.q = q; this.res = []; this.idx = -1; this.clearMarks();
    if (!q || !S.doc) { this.update(); return; }
    const ql = q.toLowerCase(); const MAX = 1500; this.busy = true; this.update();
    const scan = (text, push) => { const tl = text.toLowerCase(); let i = tl.indexOf(ql); while (i >= 0 && this.res.length < MAX) { push(i, text); i = tl.indexOf(ql, i + ql.length); } };
    const snip = (text, i) => { const a = Math.max(0, i - 28), b = Math.min(text.length, i + q.length + 60); return (a > 0 ? '…' : '') + esc(text.slice(a, i)) + '<b class="hit">' + esc(text.slice(i, i + q.length)) + '</b>' + esc(text.slice(i + q.length, b)); };
    if (S.view === Flow) {
      for (let s = 0; s < S.doc.sections.length; s++) {
        const text = Flow.textOf(s);
        scan(text, i => this.res.push({ s, start: i, end: i + q.length, snip: snip(text, i) }));
        if (s % 40 === 39) { await sleep(0); if (tok !== this.tok) return; }
      }
    } else if (S.view === Pdf) {
      for (let p = 0; p < Pdf.n && this.res.length < MAX; p++) {
        let text = ''; try { text = await Pdf.pageText(p); } catch {}
        if (tok !== this.tok) return;
        scan(text, i => this.res.push({ p, start: i, end: i + q.length, snip: snip(text, i) }));
        if (p % 10 === 9) { this.update(true); }
      }
    }
    if (tok !== this.tok) return;
    this.busy = false;
    const here = S.view.getLoc();
    let k = this.res.findIndex(r => r.s != null ? (r.s > here.s || (r.s === here.s && r.start >= here.o - 5)) : r.p >= here.p);
    if (k < 0) k = 0;
    this.apply(); this.update();
    if (this.res.length) this.go(k); else toast(t('noResults'));
  },
  clearMarks() { if (S.view === Flow && Flow.art) unwrap(Flow.art, 'mark.hit'); if (S.view === Pdf) $$('.textLayer', stage).forEach(tl => unwrap(tl, 'mark.hit')); },
  apply() { this.clearMarks(); if (S.view === Flow) this.applyFlow(); else if (S.view === Pdf) for (const i of Pdf.rendered) { const tl = $('.textLayer', Pdf.P[i].el); if (tl) this.applyPdf(i, tl); } },
  markIn(root, list) { const cur = this.res[this.idx]; for (const r of list) wrapRange(root, r.start, r.end, () => h('mark', { class: 'hit' + (r === cur ? ' cur' : '') })); },
  applyFlow() { if (!this.res.length || S.view !== Flow) return; unwrap(Flow.art, 'mark.hit'); this.markIn(Flow.art, this.res.filter(r => r.s === Flow.si).slice(0, 400)); },
  applyPdf(p, tl) { if (!this.res.length) return; unwrap(tl, 'mark.hit'); this.markIn(tl, this.res.filter(r => r.p === p)); },
  async go(k) {
    if (!this.res.length) return;
    this.idx = (k + this.res.length) % this.res.length; const r = this.res[this.idx];
    if (r.s != null) {
      if (Flow.si !== r.s) await Flow.show(r.s, { offset: r.start }); else this.applyFlow();
      this.applyFlow();
      const m = $('mark.hit.cur', Flow.art); if (m) { Flow.revealEl(m); Flow.userMoved(); }
    } else {
      Pdf.goto(r.p);
      const tl = $('.textLayer', Pdf.P[r.p].el); if (tl) this.applyPdf(r.p, tl);
      for (let i = 0; i < 30; i++) { const m = $('mark.hit.cur', Pdf.P[r.p].el); if (m) { m.scrollIntoView({ block: 'center' }); break; } await sleep(100); }
      Pdf.P.forEach((P, i) => { if (i !== r.p) { const tl2 = $('.textLayer', P.el); if (tl2) $$('mark.hit.cur', tl2).forEach(x => x.classList.remove('cur')); } });
    }
    this.update();
  },
  update(partial) {
    const c = $('#q-count');
    c.textContent = !this.q ? '' : this.busy && !this.res.length ? '…' : this.res.length ? `${this.idx + 1}/${this.res.length}${this.res.length >= 1500 ? '+' : ''}` : '0';
    if (Side.tab === 'search' && document.body.classList.contains('side-open')) Side.render();
  },
};

/* ======================= Selection bar ======================= */
const Sel = {
  ctx: null, nid: null,
  ctxOf(range) {
    const node = range.startContainer, el = node.nodeType === 1 ? node : node.parentElement;
    if (S.view === Flow && Flow.art.contains(range.commonAncestorContainer)) {
      const root = Flow.art; return { root, s: Flow.si, start: offsetOf(root, range.startContainer, range.startOffset), end: offsetOf(root, range.endContainer, range.endOffset) };
    }
    if (S.view === Pdf && el) {
      const tl = el.closest('.textLayer'); if (!tl) return null;
      const p = +tl.parentElement.dataset.i;
      const start = offsetOf(tl, range.startContainer, range.startOffset);
      const end = tl.contains(range.endContainer) ? offsetOf(tl, range.endContainer, range.endOffset) : tl.textContent.length;
      return { root: tl, p, start, end };
    }
    return null;
  },
  check() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) { if (!this.nid) this.hide(); return; }
    const r = sel.getRangeAt(0); const ctx = this.ctxOf(r);
    if (!ctx || ctx.end <= ctx.start) return this.hide();
    ctx.text = ctx.root.textContent.slice(ctx.start, ctx.end);
    if (!ctx.text.trim()) return this.hide();
    this.ctx = ctx; this.nid = null; this.show(r.getBoundingClientRect(), false);
  },
  editNote(id, mk) { const n = Notes.get(id); if (!n) return; this.nid = id; this.ctx = null; this.show(mk.getBoundingClientRect(), true, n); },
  show(rect, edit, note) {
    const bar = $('#selbar'); bar.innerHTML = '';
    const text = edit ? note.text : this.ctx.text;
    for (const [c, nm] of COLORS) bar.append(h('button', { class: 'sw' + (edit && note.color === c ? ' on' : ''), title: t(nm), style: { background: `var(--c-${c})` }, onclick: () => {
      if (edit) { note.color = c; note.u = Date.now(); saveSt(); Notes.refresh(); this.hide(); } else { Notes.add(this.ctx, c); getSelection().removeAllRanges(); this.hide(); }
    } }));
    bar.append(h('span', { class: 'sep' }));
    bar.append(h('button', { class: 'ib', title: t('note'), onclick: () => { let n = note; if (!edit) { n = Notes.add(this.ctx, 'y'); getSelection().removeAllRanges(); } this.hide(); Notes.edit(n); } }, icon('note'), h('span', { class: 'hide-sm', text: t('note') })));
    bar.append(h('button', { class: 'ib', title: t('copy'), onclick: () => { copyText(text); this.hide(); } }, icon('copy')));
    if (!edit) {
      if (TTS.ok) bar.append(h('button', { class: 'ib', title: t('readSel'), onclick: () => { TTS.speakOnly(text); this.hide(); } }, icon('vol')));
      bar.append(h('button', { class: 'ib', title: t('searchDoc'), onclick: () => { $('#q').value = text.slice(0, 80); Search.run(text.slice(0, 80)); this.hide(); getSelection().removeAllRanges(); } }, icon('search')));
      const enc = encodeURIComponent(text.slice(0, 300));
      bar.append(h('a', { class: 'ib', title: t('dict'), href: `https://cn.bing.com/dict/search?q=${enc}`, target: '_blank', rel: 'noopener' }, icon('dict')));
      bar.append(h('a', { class: 'ib', title: t('translate'), href: `https://translate.google.com/?sl=auto&tl=${cjkRatio(text) > 0.3 ? 'en' : 'zh-CN'}&text=${enc}&op=translate`, target: '_blank', rel: 'noopener' }, icon('trans')));
    } else bar.append(h('button', { class: 'ib', title: t('delete'), onclick: () => { Notes.del(note.id); this.hide(); } }, icon('trash')));
    bar.classList.add('open');
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    const x = clamp(rect.left + rect.width / 2, bw / 2 + 8, innerWidth - bw / 2 - 8);
    let y = rect.top - 10;
    if (y - bh < 60) { y = rect.bottom + 10 + bh; }
    bar.style.left = x + 'px'; bar.style.top = y + 'px';
  },
  hide() { $('#selbar').classList.remove('open'); this.nid = null; },
};

/* ======================= TTS ======================= */
const TTS_NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Fred|Junior|Kathy|Ralph|Deranged|Hysterical)\b/i;
const CJK_RE = /[぀-ヿ㐀-鿿豈-﫿가-힯]/;
const TTS = {
  ok: 'speechSynthesis' in window, on: false, paused: false, gen: 0, voices: [], queue: [], driving: false, warned: false, cur: null,
  init() {
    if (!this.ok) return;
    const load = () => { this.voices = speechSynthesis.getVoices() || []; if ($('#p-tts').classList.contains('open')) renderTTS($('#p-tts')); };
    load(); speechSynthesis.onvoiceschanged = load;
    if ('voice' in S.set) { delete S.set.voice; saveSet(); } // old single-voice setting read Chinese with English voices
  },
  async ready() { if (this.voices.length) return; for (let i = 0; i < 15 && !this.voices.length; i++) { await sleep(100); this.voices = speechSynthesis.getVoices() || []; } },
  langOf: v => (v.lang || '').toLowerCase().replace('_', '-'),
  isCantonese(v) { return /^(yue|zh-hk|zh-yue)/.test(this.langOf(v)) || /cantonese|粤|粵|香港|hong ?kong|sin-ji|sinji/i.test(v.name || ''); },
  isZhVoice(v) { return !this.isCantonese(v) && (/^(zh|cmn|wuu)\b/.test(this.langOf(v)) || /chinese|mandarin|普通话|國語|国语|中文/i.test(v.name || '')); },
  isEnVoice(v) { return /^en\b/.test(this.langOf(v)); },
  /** 0 basic … 5 natural/neural; used to sort and to label voices. */
  quality(v) {
    const n = v.name || '';
    if (/natural|neural|online/i.test(n)) return 5;
    if (/premium|高级|高品質/i.test(n)) return 5;
    if (/enhanced|增强|增強|improved/i.test(n)) return 4;
    if (/google|siri/i.test(n)) return 3;
    if (/compact|eloquence/i.test(n)) return 0;
    return v.localService === false ? 3 : 1;
  },
  /** Short display name: “Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)” → “Xiaoxiao”. */
  shortName(v) { return (v.name || '').replace(/^Microsoft\s+/i, '').replace(/\s+Online\s*\((Natural|Neural)\)/i, '').replace(/\s+-\s+.*$/, '').replace(/\s*\((Enhanced|Premium|增强|增強|高级)\)/i, '').trim() || v.name; },
  qualityTag(v) { const q = this.quality(v); return q >= 5 ? t('qNatural') : q === 4 ? t('qEnhanced') : v.localService === false ? t('online') : ''; },
  /** Usable voices of one language, best first. Cantonese and novelty voices are left out. */
  list(lang) {
    const want = v => !TTS_NOVELTY.test(v.name || '') && (lang === 'zh' ? this.isZhVoice(v) : this.isEnVoice(v));
    const region = v => { const l = this.langOf(v); return lang === 'zh' ? (/^(zh-cn|zh-hans|cmn-hans|cmn-cn|zh$|cmn$)/.test(l) ? 2 : /^(zh-tw|cmn-hant|zh-hant)/.test(l) ? 1 : 0) : (/^en-us/.test(l) ? 2 : /^en-gb/.test(l) ? 1 : 0); };
    return this.voices.filter(want).sort((a, b) => this.quality(b) - this.quality(a) || region(b) - region(a) || a.name.localeCompare(b.name));
  },
  voiceFor(lang) {
    const pref = S.set[lang === 'zh' ? 'voiceZh' : 'voiceEn'];
    if (pref && pref !== 'auto') { const v = this.voices.find(x => x.voiceURI === pref); if (v && !this.isCantonese(v)) return v; }
    return this.list(lang)[0] || null;
  },
  /** Runs of text for a Chinese or an English voice, with their offsets. Mostly-Chinese text stays whole: Chinese voices read Latin words and digits too. */
  runs(text) {
    if (!CJK_RE.test(text)) return [{ lang: 'en', text, start: 0 }];
    if (cjkRatio(text) > 0.15 || !(this.useAzure() ? Azure.voiceFor('en') : this.voiceFor('en'))) return [{ lang: 'zh', text, start: 0 }];
    const out = []; let cur = null, i = 0;
    for (const ch of text) {
      const k = CJK_RE.test(ch) || /[　-〿＀-￯]/.test(ch) ? 'zh' : /[A-Za-z]/.test(ch) ? 'en' : null;
      if (!cur) cur = { lang: k || 'en', text: '', start: i };
      else if (k && k !== cur.lang) { out.push(cur); cur = { lang: k, text: '', start: i }; }
      cur.text += ch; i += ch.length;
    }
    if (cur) out.push(cur);
    return out.filter(r => r.text.trim());
  },
  /** Make a sentence pleasant to hear: links, footnote marks, emoji and markup symbols are dropped; dashes and ellipses become pauses. */
  clean(s, lang) {
    return s.replace(/https?:\/\/\S+|www\.\S+/gi, lang === 'zh' ? '链接' : 'link')
      .replace(/\[\d{1,3}\]|［\d{1,3}］/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[—–]{1,2}|―/g, lang === 'zh' ? '，' : ', ')
      .replace(/…+|\.{3,}/g, lang === 'zh' ? '。' : '. ')
      .replace(/[*#_~^|<>{}\\`=]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  },
  /** Sentence spans [start, end) in the original text; closing quotes stay with their sentence, long ones split at commas. */
  spans(text) {
    const out = []; let start = 0, m;
    const re = /[。！？!?；;]+[”’」』"')）\]]*|[.:](?=\s+[A-Z0-9“"(])[”’"')]*/g;
    const push = (a, b) => {
      while (b - a > 90) {
        const seg = text.slice(a, a + 90); const k = seg.search(/[，,、：:）)][^，,、：:）)]*$/);
        const cut = k > 15 ? a + k + 1 : a + 80; out.push([a, cut]); a = cut;
      }
      if (text.slice(a, b).trim()) out.push([a, b]);
    };
    while ((m = re.exec(text))) { const end = m.index + m[0].length; push(start, end); start = end; }
    if (start < text.length) push(start, text.length);
    return out;
  },
  /** What a sentence sounds like: dialogue, exclamation or question — for light prosody on system voices and styles on Azure. */
  kind(s) { return /^[\s　]*[“"「『‘]|[“"「『][^”"」』]{2,}[”"」』]/.test(s) ? 'talk' : /[！!]/.test(s) ? 'excl' : /[？?]/.test(s) ? 'ask' : 'narr'; },
  /** Utterances for a passage: [{lang, text, raw, start, end, kind}], offsets relative to the passage. */
  items(text) {
    const out = [];
    for (const r of this.runs(text)) for (const [a, b] of this.spans(r.text)) {
      const raw = r.text.slice(a, b), clean = this.clean(raw, r.lang);
      if (!clean || !/[\p{L}\p{N}]/u.test(clean)) continue;
      out.push({ lang: r.lang, text: clean, raw, start: r.start + a, end: r.start + b, kind: this.kind(raw) });
    }
    return out;
  },
  markSent(el, it) {
    if (!el) return; this.clearSent(el);
    try { const ms = wrapRange(el, it.start, it.end, () => h('mark', { class: 'tts-sent' })); if (ms[0] && S.view === Flow) { Flow.revealEl(ms[0]); if (Flow.isPaged()) Flow.userMoved(); } } catch {}
  },
  clearSent(el) { if (el) unwrap(el, 'mark.tts-sent'); else if (Flow.art) unwrap(Flow.art, 'mark.tts-sent'); },
  missingZh() {
    if (this.warned) return; this.warned = true;
    this.stop();
    modal({ title: t('noZhVoiceTitle'), body: h('div', {}, h('p', { text: t('noZhVoice') }), h('p', { style: { color: 'var(--ink2)' }, text: t('zhVoiceHow_' + osKind()) })) });
  },
  useAzure() { return S.set.ttsEngine === 'azure' && Azure.ok(); },
  async speak(text, done, el) {
    if (this.useAzure()) return Azure.speak(text, done, this.gen, el);
    await this.ready();
    const items = this.items(text);
    for (const it of items) { it.v = this.voiceFor(it.lang); if (it.lang === 'zh' && !it.v) { this.missingZh(); return; } }
    this.cur = { items, i: 0, done, el };
    this.step();
  },
  /** Speak the current utterance of this.cur; pause cancels and resume restarts the same sentence (speechSynthesis.resume is unreliable). */
  step() {
    const c = this.cur; if (!c) return; const g = this.gen;
    if (c.i >= c.items.length) { this.clearSent(c.el); this.cur = null; return c.done && c.done(); }
    const it = c.items[c.i];
    this.markSent(c.el, it);
    const u = new SpeechSynthesisUtterance(it.text);
    if (it.v) { u.voice = it.v; u.lang = it.v.lang; } else u.lang = it.lang === 'zh' ? 'zh-CN' : 'en-US';
    let r = S.set.ttsRate, p = S.set.ttsPitch || 1;
    if (S.set.ttsExpr !== false) {
      if (it.kind === 'talk') { p *= 1.08; r *= 1.04; }
      else if (it.kind === 'excl') { p *= 1.1; r *= 1.03; }
      else if (it.kind === 'ask') p *= 1.05;
    }
    u.rate = clamp(r, 0.1, 4); u.pitch = clamp(p, 0, 2);
    u.onend = () => { if (g !== this.gen || this.cur !== c) return; c.i++; this.step(); };
    u.onerror = ev => { if (g !== this.gen || this.cur !== c || ev.error === 'interrupted' || ev.error === 'canceled') return; c.i++; this.step(); };
    speechSynthesis.speak(u);
  },
  speakOnly(text) { this.stop(); this.gen++; if (this.useAzure()) Azure.unlock(); this.speak(text, () => {}); },
  start() {
    if (!S.view || (!this.ok && !this.useAzure())) return; this.stop(); this.warned = false; this.on = true; this.paused = false; this.gen++; if (this.useAzure()) Azure.unlock(); UI.syncTTS();
    if (S.view === Flow) { this.queue = this.blocksFrom(Flow.anchorO); this.nextBlock(); }
    else if (S.view === Pdf) this.pdfPage(Pdf.cur);
  },
  blocks() { return $$('p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th,dt,dd,figcaption,div.sp', Flow.art).filter(el => !el.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote,td,dd') && el.textContent.trim() && !el.closest('pre') ); },
  blocksFrom(o) { const bl = this.blocks(); const art = Flow.art; let k = bl.findIndex(el => { const end = offsetOf(art, el, el.childNodes.length); return end > o; }); return bl.slice(Math.max(0, k)); },
  nextBlock() {
    if (!this.on) return;
    $$('.tts-cur', stage).forEach(x => x.classList.remove('tts-cur'));
    const el = this.queue.shift();
    if (!el) {
      if (Flow.si < Flow.doc.sections.length - 1) { this.driving = true; Flow.show(Flow.si + 1).then(() => { this.driving = false; this.queue = this.blocks(); setTimeout(() => this.nextBlock(), 600); }); }
      else this.stop();
      return;
    }
    el.classList.add('tts-cur');
    Flow.revealEl(el); if (Flow.isPaged()) Flow.userMoved();
    const heading = /^H[1-6]$/.test(el.tagName);
    const g = this.gen;
    // a short breath between paragraphs, a longer one after headings
    this.speak(el.textContent, () => { if (g === this.gen || this.on) setTimeout(() => this.nextBlock(), heading ? 650 : 320); }, el);
  },
  async pdfPage(p) {
    if (!this.on) return; if (p >= Pdf.n) return this.stop();
    if (Pdf.cur !== p) Pdf.goto(p);
    const tc = await Pdf.textContent(p);
    const text = tc.items.map(x => (x.str || '') + (x.hasEOL ? (/[㐀-鿿]$/.test(x.str || '') ? '' : ' ') : '')).join('');
    this.speak(text || ' ', () => setTimeout(() => this.pdfPage(p + 1), 400));
  },
  pause() {
    if (!this.on) return; this.paused = !this.paused;
    if (this.useAzure()) Azure.pause(this.paused);
    else if (this.paused) { this.gen++; speechSynthesis.cancel(); }
    else { this.gen++; this.step(); }
    UI.syncTTS();
  },
  stop() { this.on = false; this.paused = false; this.gen++; this.cur = null; Azure.stop(); if (this.ok) speechSynthesis.cancel(); $$('.tts-cur').forEach(x => x.classList.remove('tts-cur')); this.clearSent(); UI.syncTTS(); },
};
function osKind() { const ua = navigator.userAgent; return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : /Macintosh|Mac OS X/.test(ua) ? 'mac' : /Windows/.test(ua) ? 'win' : 'other'; }

/* ======================= Auto scroll ======================= */
const Auto = {
  on: false,
  toggle() { this.on ? this.stop() : this.start(); },
  start() {
    if (!S.view || (S.view === Flow && Flow.isPaged())) { toast(t('autoNeedScroll')); return; }
    this.on = true; let last = performance.now(), acc = 0; toast(t('autoOn'));
    const step = now => {
      if (!this.on) return; const dt = Math.min(100, now - last); last = now;
      acc += S.set.autoSpeed * dt / 1000; const px = Math.floor(acc); acc -= px;
      if (px) stage.scrollTop += px;
      if (stage.scrollTop >= stage.scrollHeight - stage.clientHeight - 1) {
        if (S.view === Flow && Flow.si < Flow.doc.sections.length - 1) { Flow.show(Flow.si + 1); }
        else { this.stop(); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  stop() { if (this.on) toast(t('autoOff')); this.on = false; },
};

/* ======================= Sidebar ======================= */
const Side = {
  tab: S.set.sideTab || 'toc',
  tabs() {
    const v = S.view; const out = ['toc'];
    if (v === Pdf || (v === Gallery && S.doc.items.length > 1)) out.push('thumbs');
    out.push('bm');
    if (v !== Gallery) out.push('notes', 'search');
    return out;
  },
  open(tab) { if (tab) this.tab = tab; document.body.classList.add('side-open'); S.set.side = true; saveSet(); this.render(); $('#b-side').classList.add('on'); },
  close() { document.body.classList.remove('side-open'); if (innerWidth > 900) { S.set.side = false; saveSet(); } $('#b-side').classList.remove('on'); },
  toggle() { document.body.classList.contains('side-open') ? this.close() : this.open(); },
  render() {
    if (!S.doc) return;
    const tabs = this.tabs(); if (!tabs.includes(this.tab)) this.tab = 'toc';
    S.set.sideTab = this.tab; saveSet();
    const tb = $('#tabs'); tb.innerHTML = '';
    for (const k of tabs) tb.append(h('button', { class: 'tab' + (k === this.tab ? ' on' : ''), onclick: () => { this.tab = k; this.render(); } }, t('tab_' + k)));
    const body = $('#sidebody'); body.innerHTML = ''; body.scrollTop = 0;
    this['r_' + this.tab](body);
    this.syncActive(true);
  },
  mobileClose() { if (innerWidth <= 900) this.close(); },
  r_toc(body) {
    const toc = S.view === Gallery ? S.doc.items.map((it, i) => ({ title: it.name, level: 0, p: i })) : S.doc.toc || [];
    if (!toc.length) { body.append(h('div', { class: 'side-empty', text: t('noToc') })); return; }
    const box = h('div', { class: 'toc' });
    toc.forEach((x, i) => {
      const a = h('a', { 'data-i': i, style: { '--lv': Math.min(x.level, 6) }, onclick: () => { this.goToc(x); this.mobileClose(); } }, x.title);
      if (x.p != null && S.view === Pdf) a.prepend(h('span', { class: 'pg', text: x.p + 1 }));
      box.append(a);
    });
    body.append(box);
  },
  goToc(x) {
    if (S.view === Flow) { if (x.s == null) return; Flow.show(x.s, { anchor: x.anchor || null }); }
    else if (S.view === Pdf) { if (x.p != null) Pdf.goto(x.p); else if (x.url) openExternal(x.url); }
    else if (S.view === Gallery) Gallery.goto(x.p);
  },
  r_thumbs(body) {
    const grid = h('div', { class: 'thumbs' }); body.append(grid);
    if (S.view === Gallery) { S.doc.items.forEach((it, i) => grid.append(h('div', { class: 'thumb', 'data-i': i, onclick: () => { Gallery.goto(i); this.mobileClose(); } }, h('div', { class: 'tb', style: { aspectRatio: '3/4' } }, h('img', { src: it.url, loading: 'lazy', alt: '' })), i + 1))); return; }
    const q = []; let running = false;
    const pump = async () => { if (running) return; running = true; while (q.length) { const [i, tb] = q.shift(); if (!tb.isConnected || tb.dataset.done) continue; try { const page = await Pdf.pdf.getPage(i + 1); const v1 = page.getViewport({ scale: 1 }); const sc = 260 / v1.width; const vp = page.getViewport({ scale: sc }); const cv = h('canvas'); cv.width = vp.width; cv.height = vp.height; await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; tb.innerHTML = ''; tb.append(cv); tb.dataset.done = 1; } catch {} } running = false; };
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { const tb = e.target; q.push([+tb.dataset.i, tb]); io.unobserve(tb); } pump(); }, { root: body, rootMargin: '200px' });
    const s0 = Pdf.sizeOf(0);
    for (let i = 0; i < Pdf.n; i++) { const tb = h('div', { class: 'tb', 'data-i': i, style: { aspectRatio: `${s0.w}/${s0.h}` } }); grid.append(h('div', { class: 'thumb', 'data-i': i, onclick: () => { Pdf.goto(i); this.mobileClose(); } }, tb, i + 1)); io.observe(tb); }
  },
  r_bm(body) {
    body.append(h('div', { class: 'side-head' }, h('span', { text: t('bmCount', S.st.bm.length) }), h('button', { class: 'btn sm', onclick: () => Bookmarks.toggle() }, icon('bm'), t('bmToggle'))));
    if (!S.st.bm.length) { body.append(h('div', { class: 'side-empty', text: t('noBm') })); return; }
    const list = h('div', { class: 'items' });
    const sorted = [...S.st.bm].sort((a, b) => ((a.s ?? a.p) - (b.s ?? b.p)) || ((a.o || 0) - (b.o || 0)));
    for (const b of sorted) list.append(h('div', { class: 'item', onclick: () => { Bookmarks.go(b); this.mobileClose(); } },
      h('span', { class: 'bar', style: { background: 'var(--accent)' } }),
      h('div', { class: 'q', text: b.text || b.label }), h('div', { class: 'm' }, h('span', { text: b.label }), h('span', { text: fmtDate(b.t) })),
      h('button', { class: 'ib del', title: t('delete'), onclick: e => { e.stopPropagation(); S.st.bm = S.st.bm.filter(x => x !== b); S.st.del[b.id] = Date.now(); saveSt(); UI.syncBookmark(); this.render(); } }, icon('x'))));
    body.append(list);
  },
  r_notes(body) {
    const notes = Notes.sorted();
    body.append(h('div', { class: 'side-head' }, h('span', { text: t('noteCount', notes.length) }), notes.length ? h('button', { class: 'btn sm', onclick: () => copyText(Notes.markdown()) }, icon('copy'), t('exportMd')) : null));
    if (!notes.length) { body.append(h('div', { class: 'side-empty', text: t('noNotes') })); return; }
    const list = h('div', { class: 'items' }); let lastW = null;
    for (const n of notes) {
      const w = Notes.where(n); if (w !== lastW) { list.append(h('div', { class: 'res-group', text: w })); lastW = w; }
      list.append(h('div', { class: 'item', onclick: () => { Notes.go(n); this.mobileClose(); } },
        h('span', { class: 'bar', style: { background: `var(--c-${n.color})` } }),
        h('div', { class: 'q', text: n.text }), n.note ? h('div', { class: 'n', text: n.note }) : null,
        h('div', { class: 'm' }, h('span', { text: fmtDate(n.t) }), h('a', { href: '#', onclick: e => { e.preventDefault(); e.stopPropagation(); Notes.edit(n); } }, n.note ? t('editNote') : t('addNote'))),
        h('button', { class: 'ib del', title: t('delete'), onclick: e => { e.stopPropagation(); Notes.del(n.id); } }, icon('x'))));
    }
    body.append(list);
  },
  r_search(body) {
    const inp = h('input', { type: 'search', placeholder: t('searchPh'), value: Search.q, style: { width: '100%', height: '34px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 10px', background: 'var(--paper)', outline: '0' } });
    inp.onkeydown = e => { if (e.key === 'Enter') { $('#q').value = inp.value; Search.run(inp.value); } };
    body.append(h('div', { style: { padding: '12px 14px 4px' } }, inp));
    if (!Search.q) { body.append(h('div', { class: 'side-empty', text: t('searchHint') })); setTimeout(() => inp.focus(), 50); return; }
    body.append(h('div', { class: 'side-head' }, h('span', { text: Search.busy ? t('searching') : t('resCount', Search.res.length) })));
    const list = h('div', { class: 'items' }); let lastG = null;
    Search.res.slice(0, 600).forEach((r, k) => {
      const g = r.s != null ? S.doc.sections[r.s].title : t('pageN', r.p + 1);
      if (g !== lastG) { list.append(h('div', { class: 'res-group', text: g })); lastG = g; }
      list.append(h('div', { class: 'item' + (k === Search.idx ? ' on' : ''), 'data-k': k, onclick: () => { Search.go(k); this.mobileClose(); } }, h('div', { class: 'q', html: r.snip })));
    });
    body.append(list);
    const on = $('.item.on', list); if (on) on.scrollIntoView({ block: 'center' });
  },
  syncActive(scroll) {
    if (!S.doc || !document.body.classList.contains('side-open')) return;
    const body = $('#sidebody');
    if (this.tab === 'toc') {
      const items = $$('.toc a', body); if (!items.length) return;
      const toc = S.view === Gallery ? null : S.doc.toc; let k = -1;
      if (S.view === Flow) {
        for (let i = 0; i < toc.length; i++) {
          const x = toc[i]; if (x.s == null) continue;
          if (x.s < Flow.si) k = i;
          else if (x.s === Flow.si) {
            if (!x.anchor) { k = i; continue; }
            const el = Flow.findAnchor(x.anchor);
            if (!el) { if (k < 0 || toc[k].s !== Flow.si) k = i; continue; }
            const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
            const before = Flow.isPaged() ? Flow.pageOfRect(r) <= Flow.page : r.top <= sr.top + sr.height * 0.3;
            if (before || k < 0 || toc[k].s !== Flow.si) k = i; if (!before) break;
          } else break;
        }
      } else if (S.view === Pdf) { for (let i = 0; i < toc.length; i++) if (toc[i].p != null && toc[i].p <= Pdf.cur) k = i; }
      else k = Gallery.cur;
      items.forEach((a, i) => a.classList.toggle('on', i === k));
      if (k >= 0 && items[k]) { const a = items[k], br = body.getBoundingClientRect(), ar = a.getBoundingClientRect(); if (scroll || ar.top < br.top || ar.bottom > br.bottom) body.scrollTop += ar.top - br.top - br.height * 0.35; }
    } else if (this.tab === 'thumbs') {
      const cur = S.view.cur; const th = $$('.thumb', body);
      th.forEach((x, i) => x.classList.toggle('on', i === cur));
      const a = th[cur]; if (a) { const br = body.getBoundingClientRect(), ar = a.getBoundingClientRect(); if (scroll || ar.top < br.top || ar.bottom > br.bottom) body.scrollTop += ar.top - br.top - br.height * 0.35; }
    }
  },
};

/* ======================= UI glue ======================= */
const stage = document.getElementById('stage');
const UI = {
  updatePos() {
    const v = S.view; if (!v) return; const info = v.posInfo(); const lab = $('#pos-label');
    if (info.pageInput) {
      let inp = $('input', lab);
      if (!inp) { lab.innerHTML = ''; inp = h('input', { type: 'text', inputmode: 'numeric' }); inp.onkeydown = e => { if (e.key === 'Enter') { v.goto(+inp.value - 1); inp.blur(); } e.stopPropagation(); }; lab.append(inp, h('span', { class: 'n' })); }
      if (document.activeElement !== inp) inp.value = info.cur;
      $('.n', lab).textContent = ' / ' + info.n;
    } else lab.textContent = info.label || '';
    if (!$('#slider').matches(':active')) $('#slider').value = Math.round((info.pct || 0) * 1000);
    $('#pct').textContent = Math.round((info.pct || 0) * 100) + '%';
    $('#eta').textContent = info.eta || '';
    const sub = v === Flow ? (Flow.sec() ? Flow.sec().title : '') : v === Pdf ? t('pageOf', Pdf.cur + 1, Pdf.n) : '';
    $('#t-sub').textContent = sub && sub !== S.doc.title ? sub : (S.doc.author || '');
  },
  updateZoom() {
    const v = S.view; const zg = $('#zgroup'); zg.classList.toggle('hidden', !(v === Pdf || v === Gallery));
    if (v === Pdf) { $('#z-val').textContent = Math.round(Pdf.zoom * 100) + '%'; $('#z-fit').innerHTML = ''; $('#z-fit').append(icon(Pdf.fit === 'page' ? 'fitw' : 'fitp')); $('#z-fit').title = t(Pdf.fit === 'page' ? 'fitWidth' : 'fitPage'); $('#z-spread').classList.remove('hidden'); $('#z-spread').innerHTML = ''; $('#z-spread').append(icon('spread')); $('#z-spread').classList.toggle('on', Pdf.spread); $('#z-spread').title = t('spreadPdf'); }
    if (v === Gallery) { $('#z-val').textContent = Math.round(Gallery.zoom * 100) + '%'; $('#z-fit').innerHTML = ''; $('#z-fit').append(icon('fitp')); $('#z-fit').title = t('fitPage'); $('#z-spread').classList.toggle('hidden', S.doc.items.length < 2); $('#z-spread').innerHTML = ''; $('#z-spread').append(icon(Gallery.mode === 'single' ? 'scroll' : 'fitp')); $('#z-spread').title = t(Gallery.mode === 'single' ? 'stripMode' : 'singleMode'); }
  },
  syncBookmark() { const b = $('#b-bm'); if (!S.doc) return; const on = Bookmarks.current().length > 0; b.classList.toggle('on', on); b.title = t(on ? 'bmRemove' : 'bmAdd'); },
  syncTTS() { $('#b-tts').classList.toggle('on', TTS.on); if ($('#p-tts').classList.contains('open')) renderTTS($('#p-tts')); },
  toggleImmersive(force) {
    const on = force != null ? force : !document.body.classList.contains('immersive');
    document.body.classList.toggle('immersive', on); closePops(); Sel.hide();
    const b = $('#imm-exit'); b.classList.remove('dim'); clearTimeout(this.immTm);
    if (on) { this.immTm = setTimeout(() => b.classList.add('dim'), 2500); if (!this.immHinted) { this.immHinted = true; toast(t('immHint'), 2600); } }
  },
  /** In focus mode a plain tap on the page (not a link, mark or selection) brings the bars back. */
  tapExitsImmersive(e) {
    if (!document.body.classList.contains('immersive')) return false;
    if (e.target.closest && e.target.closest('a,button,mark.hl,input,select,textarea')) return false;
    if (!getSelection().isCollapsed) return false;
    this.toggleImmersive(false); return true;
  },
  i18n() {
    document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
    for (const el of $$('[data-tip]')) el.title = t('tip_' + el.dataset.tip);
    $('#q').placeholder = t('searchPh');
    $('#b-prev').title = t('prev'); $('#b-next').title = t('next');
    $('#z-in').title = t('zoomIn'); $('#z-out').title = t('zoomOut'); $('#z-rot').title = t('rotate'); $('#z-val').title = t('zoomReset');
    $('#dropmask-t').textContent = t('dropHere');
    $('#imm-exit-l').textContent = t('immExit');
    if (!S.doc) { $('#t-title').textContent = t('appName'); Shelf.render(); }
  },
  readerMode(on) {
    $('#home').classList.toggle('hidden', on); stage.classList.toggle('hidden', !on); $('#bottom').classList.toggle('hidden', !on);
    for (const id of ['#searchbox', '#b-bm', '#b-tts']) $(id).classList.toggle('hidden', !on);
    $('#b-side').classList.toggle('hidden', !on);
    if (!on) { document.body.classList.remove('side-open', 'paged', 'spread', 'immersive', 'pdf-invert'); $('#pagefoot').classList.add('hidden'); $('#b-alt').classList.add('hidden'); $('#t-sub').textContent = ''; $('#t-title').textContent = t('appName'); }
  },
};

/* ======================= Open / close ======================= */
async function sampleHash(file) { const n = Math.min(file.size, 65536); const buf = new Uint8Array(await file.slice(0, n).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 97) s += buf[i]; return fnv(s); }
async function openFile(file, opts = {}) {
  closeDoc(true); closePops(); UI.readerMode(true); stage.innerHTML = ''; setLoading(t('opening', file.name));
  $('#t-title').textContent = file.name; $('#t-sub').textContent = '';
  try {
    const id = opts.id || ('d' + fnv(file.name + '|' + file.size) + (await sampleHash(file)));
    S.id = id; S.st = loadSt(id); S.file = file;
    if (Sync.on()) { setLoading(t('syncingState')); const remote = await Sync.pullState(id); if (remote) S.st = Object.assign(loadSt(id), Sync.mergeState(S.st, remote)); setLoading(t('opening', file.name)); }
    const u8 = new Uint8Array(await file.arrayBuffer());
    const fmt = opts.fmt || await detectFormat(file.name, u8);
    S.fmt = fmt; S.u8 = fmt === 'pdf' ? null : u8;
    let doc = await parseFile(fmt === 'pdf' ? u8 : u8, file.name, fmt, S.st.enc);
    if (S.st.alt && doc.alt) { try { const base = doc; const a = await doc.alt.make(); a.alt = { label: 'layoutReflow', make: async () => base }; doc = a; } catch (e) { console.warn(e); } }
    await mountDoc(doc);
    Shelf.save(file, doc, id, fmt);
  } catch (e) { console.error(e); showError(e, file.name); }
}
async function mountDoc(doc) {
  S.doc = doc;
  if (doc.kind === 'flow') { const sample = doc.sections.slice(0, 3).map(s => s.html || '').join(' ').replace(/<[^>]+>/g, ' ').slice(0, 8000); doc.cjk = cjkRatio(sample + doc.title) > 0.2; }
  else doc.cjk = cjkRatio(doc.title || '') > 0.2;
  const view = doc.kind === 'pdf' ? Pdf : doc.kind === 'gallery' ? Gallery : Flow;
  S.view = view;
  applySettings();
  setLoading(null);
  document.title = doc.title + ' — ' + t('appName');
  $('#t-title').textContent = doc.title;
  const alt = $('#b-alt'); alt.classList.toggle('hidden', !doc.alt); if (doc.alt) { $('#b-alt-l').textContent = t(doc.alt.label); alt.title = t(doc.alt.label); }
  $('#b-tts').classList.toggle('hidden', !TTS.ok || view === Gallery);
  $('#searchbox').classList.toggle('hidden', view === Gallery);
  S.mounting = true;
  try { await view.mount(doc); } finally { setTimeout(() => { S.mounting = false; }, 600); }
  UI.updateZoom(); UI.syncBookmark();
  if (S.set.side && innerWidth > 900 && ((doc.toc && doc.toc.length > 1) || view === Pdf)) Side.open(); else if (document.body.classList.contains('side-open')) Side.render();
  stage.focus({ preventScroll: true });
}
async function toggleAlt() {
  const d = S.doc; if (!d || !d.alt) return;
  setLoading(t('switching'));
  try {
    const base = d; const nd = await d.alt.make();
    if (!nd.alt) nd.alt = { label: base.alt.label === 'layoutOrig' ? 'layoutReflow' : 'layoutOrig', make: async () => base };
    S.st.alt = nd.fixedClass === 'docx'; S.st.pos = null; saveSt();
    S.view.unmount(); await mountDoc(nd);
  } catch (e) { setLoading(null); toast(e.message || String(e)); }
}
function closeDoc(keepReader) {
  TTS.stop(); Auto.stop(); Sel.hide();
  if (S.view && S.view.unmount) try { S.view.unmount(); } catch {}
  if (S.doc) { for (const u of S.doc.urls || []) URL.revokeObjectURL(u); if (S.doc.pdf) try { S.doc.pdf.destroy(); } catch {} }
  if (S.st && S.id) { LS.set('doc.' + S.id, S.st); Sync.stateDirty(S.id); Sync.flush(); }
  S.doc = null; S.view = null; S.id = null; S.st = null; S.u8 = null; if (Shelf.meta) { IDB.put('books', Shelf.meta).catch(() => {}); Shelf.meta = null; }
  Search.q = ''; Search.res = []; $('#q').value = ''; $('#q-count').textContent = '';
  stage.innerHTML = ''; stage.className = '';
  document.title = t('appName');
  if (!keepReader) { UI.readerMode(false); Shelf.render(); }
}
function showError(e, name) {
  setLoading(null);
  stage.className = ''; stage.innerHTML = '';
  stage.append(h('div', { style: { maxWidth: '520px', margin: '12vh auto', padding: '0 24px', lineHeight: '1.8' } },
    h('h2', { style: { font: '700 22px var(--seal)', margin: '0 0 8px' }, text: t('openFail') }),
    h('p', { style: { color: 'var(--ink2)', margin: '0 0 6px' }, text: name }),
    h('p', { text: (e && e.message) || String(e) }),
    h('div', { style: { display: 'flex', gap: '10px', marginTop: '20px' } }, h('button', { class: 'btn primary', onclick: () => $('#file').click() }, icon('open'), t('openOther')), h('button', { class: 'btn', onclick: () => closeDoc() }, t('backShelf')))));
}
async function reopenWithEncoding(enc) {
  if (!S.file) return; S.st.enc = enc; saveSt(); const f = S.file, id = S.id; await openFile(f, { id });
}

/* ======================= Shelf / home ======================= */
const FMT_COLOR = { pdf: '#9A3E3E', epub: '#2E5E8C', mobi: '#3F6E5A', fb2: '#5A4F8C', docx: '#2F5597', odt: '#2F5597', rtf: '#5E6A75', txt: '#6B5B45', md: '#3D4B59', html: '#7A5632', code: '#26323D', sheet: '#2E7D4F', csv: '#2E7D4F', pptx: '#A4512E', image: '#4A5A6A', cbz: '#7A3E6E' };
const Shelf = {
  ok: true, meta: null,
  async save(file, doc, id, fmt) {
    try {
      const now = Date.now(); let m = await IDB.get('books', id);
      if (!m || m.local === false) { m = Object.assign(m || { id, name: file.name, size: file.size, added: now }, { fmt }); if (file.size < 300 * 1024 * 1024) { await IDB.put('blobs', { id, blob: file }); m.local = true; } }
      m.title = doc.title || file.name; m.author = doc.author || ''; m.last = now; m.fmt = fmt;
      this.meta = m; await IDB.put('books', m);
      if (!m.cover) this.makeCover(doc).then(c => { if (c && this.meta && this.meta.id === id) { this.meta.cover = c; IDB.put('books', this.meta).catch(() => {}); Sync.pushLibrarySoon(); } });
      if (Sync.on() && !m.path) Sync.uploadBook(m, file); else Sync.pushLibrarySoon();
    } catch (e) { this.ok = false; }
  },
  progress(p) { if (!this.meta || S.mounting) return; this.meta.progress = p; this.meta.last = Date.now(); this._saveP(); Sync.pushLibrarySoon(); },
  _saveP: debounce(() => { const m = Shelf.meta; if (!m) return; IDB.put('books', m).catch(() => {}); }, 1500),
  async makeCover(doc) {
    try {
      let src = null;
      if (doc.kind === 'pdf') { const page = await doc.pdf.getPage(1); const v = page.getViewport({ scale: 1 }); const vp = page.getViewport({ scale: 260 / v.width }); const cv = h('canvas'); cv.width = vp.width; cv.height = vp.height; await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; return cv.toDataURL('image/jpeg', 0.82); }
      if (doc.cover) src = await doc.cover();
      if (doc.kind === 'gallery') src = doc.items[0].url;
      if (!src) return null;
      const img = new Image(); img.src = src; await img.decode();
      const w = 260, hh = Math.round(w * img.naturalHeight / img.naturalWidth); const cv = h('canvas'); cv.width = w; cv.height = Math.min(hh, 520);
      cv.getContext('2d').drawImage(img, 0, 0, w, hh); return cv.toDataURL('image/jpeg', 0.82);
    } catch { return null; }
  },
  async render() {
    const home = $('#home'); if (S.doc) return;
    let books = [];
    try { books = await IDB.all('books'); } catch { this.ok = false; }
    books.sort((a, b) => (b.last || 0) - (a.last || 0));
    home.innerHTML = '';
    const fileBtn = h('button', { class: 'btn primary', onclick: e => { e.stopPropagation(); $('#file').click(); } }, icon('open'), t('openFile'));
    const demo = h('button', { class: 'btn', onclick: e => { e.stopPropagation(); openSample(); } }, t('trySample'));
    const last = books[0];
    const coverEl = b => { const cv = h('div', { class: 'cv' }); if (b.cover) cv.append(h('img', { src: b.cover, alt: '' })); else cv.append(h('div', { class: 'gcover', style: { background: FMT_COLOR[b.fmt] || '#3D4B59' } }, h('div', { class: 'gt', text: b.title || b.name }), h('div', { class: 'gf', text: (extOf(b.name) || b.fmt || '').toUpperCase() }))); return cv; };
    const cont = last ? h('div', { class: 'cont', onclick: e => { e.stopPropagation(); this.open(last); } }, coverEl(last), h('div', { style: { minWidth: 0 } }, h('small', { text: t('continueAt', Math.round((last.progress || 0) * 100)) }), h('b', { text: last.title || last.name }))) : null;
    const lp = h('div', { class: 'lp', onclick: () => $('#file').click() }, h('div', {}, h('h2', { text: t('dropTitle') }), h('p', { text: t('dropSub') }), cont), h('div', { class: 'acts' }, fileBtn, demo));
    const groups = [['fgDoc', 'PDF  DOCX  ODT  RTF'], ['fgBook', 'EPUB  MOBI  AZW3  FB2  TXT'], ['fgSheet', 'XLSX  XLS  ODS  CSV  TSV'], ['fgSlide', 'PPTX'], ['fgWeb', 'Markdown  HTML  JSON  XML'], ['fgCode', t('fgCodeList')], ['fgImg', 'PNG  JPG  WebP  GIF  SVG  AVIF  CBZ']];
    const rp = h('div', { class: 'rp' }, h('h3', { text: t('formats') }), h('dl', { class: 'fmt-list' }, groups.map(([k, v]) => h('div', {}, h('dt', { text: t(k) }), h('dd', { text: v })))));
    const book = h('div', { class: 'book' }, lp, rp);
    const head = h('div', { class: 'home-head' }, h('div', { class: 'seal big', text: '墨' }), h('div', {}, h('h1', { text: t('appName') }), h('p', { text: t('tagline') })), h('div', { class: 'spacer' }), Release.button('btn sm dlbtn'));
    const shelfHead = h('div', { class: 'shelf-head' }, h('h2', { text: t('shelf') }), h('div', { id: 'sync-status', class: 'sync-status' }), h('span', { class: 'cnt', text: books.length ? t('bookCount', books.length) : '' }));
    const shelf = h('div', { class: 'shelf' });
    for (const b of books) {
      const cv = coverEl(b);
      const pct = Math.round((b.progress || 0) * 100);
      shelf.append(h('div', { class: 'bk', title: b.name, tabindex: 0, onclick: () => this.open(b), onkeydown: e => { if (e.key === 'Enter') this.open(b); } }, cv,
        h('div', { class: 'bt', text: b.title || b.name }),
        b.local === false ? h('span', { class: 'cloud', text: t('cloudOnly') }) : null,
        h('div', { class: 'bp' }, h('i', {}, h('b', { style: { width: pct + '%' } })), h('span', { text: pct ? pct + '%' : t('unread') })),
        h('button', { class: 'rm', title: t('removeShelf'), onclick: e => { e.stopPropagation(); this.remove(b); } }, icon('x'))));
    }
    home.append(h('div', { class: 'home-inner' }, head, book, shelfHead, books.length ? shelf : h('div', { class: 'shelf-empty', text: this.ok ? t('shelfEmpty') : t('shelfNoStore') })));
    Sync.status();
  },
  async open(b) {
    let rec = null; try { rec = await IDB.get('blobs', b.id); } catch {}
    if (!rec && Sync.on() && b.path) {
      toast(t('ghDownloading', b.title || b.name), 60000);
      try { const f = await Sync.downloadBook(b); $('#toast').classList.remove('open'); await openFile(f, { id: b.id }); } catch (e) { toast(e.message || t('shelfMissing'), 4000); }
      return;
    }
    if (!rec) { toast(t('shelfMissing')); return; }
    const f = rec.blob instanceof File ? rec.blob : new File([rec.blob], b.name); await openFile(f, { id: b.id });
  },
  async remove(b) { try { await IDB.del('books', b.id); await IDB.del('blobs', b.id); } catch {} LS.del('doc.' + b.id); toast(t('removed', b.title || b.name)); this.render(); Sync.removeBook(b); },
};

/* ======================= Popovers ======================= */
function sliderRow(label, key, min, max, step, fmt) {
  const out = h('output', { text: fmt(S.set[key]) });
  const inp = h('input', { type: 'range', min, max, step, value: S.set[key] });
  inp.oninput = () => { out.textContent = fmt(+inp.value); setOpt(key, +inp.value); };
  return h('div', { class: 'rowc' }, h('label', { text: label }), inp, out);
}
function seg(options, cur, onPick) { return h('div', { class: 'seg' }, options.map(([v, l]) => h('button', { class: v === cur ? 'on' : '', onclick: () => onPick(v) }, l))); }
function fontGrid(kind, sampleZh) {
  const list = [...FONTS[kind], ...(kind !== 'mono' ? customFonts() : [])];
  const grid = h('div', { class: 'fonts' });
  for (const f of list) {
    const label = fontLabel(f);
    if (f.g) loadGoogle(f, label + (kind === 'cjk' ? '永和九年' : 'Aa'));
    if (f.kind === 'upload') registerUpload(f);
    const fam = f.id === 'follow' ? 'var(--ui)' : [stackOf(f), kind === 'cjk' ? (f.gen || 'serif') : 'serif'].join(',');
    const btn = h('button', { class: S.set[kind] === f.id ? 'on' : '', onclick: () => { setOpt(kind, f.id); renderAa($('#p-aa')); } },
      h('span', { class: 'fn', style: { fontFamily: fam }, text: f.id === 'follow' ? label : kind === 'cjk' ? label : label }),
      h('span', { class: 'fs', text: f.custom ? t(f.kind === 'upload' ? 'fontUploaded' : 'fontLocal') : f.g ? 'Google Fonts' : t('fontSystem') }));
    if (f.custom) btn.append(h('span', { class: 'x', title: t('delete'), onclick: e => { e.stopPropagation(); removeCustomFont(f); } }, '×'));
    grid.append(btn);
  }
  return grid;
}
function addCustomFont(family, kindTag) {
  family = family.trim().replace(/^["']|["']$/g, ''); if (!family) return null;
  const list = customFonts(); const id = 'u-' + fnv(family);
  if (!list.find(f => f.id === id)) { list.push({ id, family, custom: true, kind: kindTag, gen: 'serif' }); LS.set('customFonts', list); }
  return id;
}
function removeCustomFont(f) {
  LS.set('customFonts', customFonts().filter(x => x.id !== f.id));
  if (f.kind === 'upload') IDB.del('fonts', f.family).catch(() => {});
  for (const k of ['cjk', 'latin']) if (S.set[k] === f.id) S.set[k] = DEF[k];
  saveSet(); applySettings(); renderAa($('#p-aa'));
}
async function uploadFonts(files) {
  let lastId = null;
  for (const file of files) {
    const family = file.name.replace(/\.[^.]+$/, '');
    try {
      const data = await file.arrayBuffer();
      const ff = new FontFace(family, data); await ff.load(); document.fonts.add(ff); registered.add(family);
      try { await IDB.put('fonts', { id: family, data }); } catch { toast(t('fontNoStore')); }
      lastId = addCustomFont(family, 'upload');
      Sync.uploadFont(family, data, file);
    } catch (e) { toast(t('fontBad', file.name)); }
  }
  if (lastId) { const isCjk = await fontHasCjk(customFonts().find(f => f.id === lastId).family); setOpt(isCjk ? 'cjk' : 'latin', lastId); toast(t('fontAdded')); }
  renderAa($('#p-aa'));
}
async function fontHasCjk(family) {
  try { const c = h('canvas'); const x = c.getContext('2d'); x.font = `40px "${family}", monospace`; const a = x.measureText('永和九年').width; x.font = '40px monospace'; const b = x.measureText('永和九年').width; return Math.abs(a - b) > 1; } catch { return false; }
}
async function pickLocalFont() {
  if (!window.queryLocalFonts) return;
  let fams = [];
  try { const fonts = await window.queryLocalFonts(); fams = [...new Set(fonts.map(f => f.family))].sort(naturalSort); }
  catch (e) { toast(t('localFontDenied'), 3500); return; }
  const inp = h('input', { type: 'search', placeholder: t('filterFonts') }); const list = h('div', { class: 'fontpick' });
  const draw = () => { list.innerHTML = ''; const q = inp.value.toLowerCase(); for (const f of fams.filter(f2 => f2.toLowerCase().includes(q)).slice(0, 400)) list.append(h('button', { style: { fontFamily: `"${f}"` }, onclick: async () => { const id = addCustomFont(f, 'local'); $('#modal').classList.remove('open'); setOpt((await fontHasCjk(f)) ? 'cjk' : 'latin', id); renderAa($('#p-aa')); } }, f)); };
  inp.oninput = draw; draw();
  modal({ title: t('localFonts'), body: h('div', {}, inp, list), onOpen: () => inp.focus() });
}
function renderAa(pop) {
  pop.innerHTML = '';
  const v = S.view, flow = v === Flow && !S.doc.fixed, textual = S.doc && S.u8 && ['txt', 'md', 'html', 'code', 'csv'].includes(S.fmt);
  const themes = [['paper', 'thPaper', '#FFFFFF', '#23292F'], ['sepia', 'thSepia', '#F4ECDF', '#3B3027'], ['green', 'thGreen', '#DCEADC', '#21312A'], ['dark', 'thDark', '#262B31', '#CBD1D7'], ['black', 'thBlack', '#000000', '#A6ACB2']];
  pop.append(h('section', {}, h('h4', { text: t('theme') }), h('div', { class: 'themes' }, themes.map(([k, l, bg, fg]) => h('button', { class: S.set.theme === k ? 'on' : '', onclick: () => { setOpt('theme', k); renderAa(pop); } }, h('div', { class: 'sw', style: { background: bg, color: fg }, text: '文' }), h('span', { text: t(l) }))))));
  if (v === Pdf) pop.append(h('section', {}, h('h4', { text: 'PDF' }), h('div', { class: 'row2' }, h('span', { text: t('pdfInvert') }), seg([[true, t('on')], [false, t('off')]], S.set.pdfInvert, x => { setOpt('pdfInvert', x); Pdf.refreshTheme(); renderAa(pop); })), h('p', { style: { margin: '6px 0 0', fontSize: '12px', color: 'var(--ink2)' }, text: t('pdfInvertHint') })));
  if (flow) {
    pop.append(h('section', {}, h('h4', { text: t('pageMode') }), seg([['scroll', t('mScroll')], ['paged', t('mPaged')], ['spread', t('mSpread')]], S.set.mode, x => { setOpt('mode', x); renderAa(pop); })));
  }
  if (!v || v === Flow) {
    pop.append(h('section', {}, h('h4', {}, t('fontCjk'), h('small', { text: t('fontCjkHint') })), fontGrid('cjk')));
    pop.append(h('section', {}, h('h4', {}, t('fontLatin'), h('small', { text: t('fontLatinHint') })), fontGrid('latin')));
    const nameInp = h('input', { type: 'text', placeholder: t('fontNamePh') });
    const addName = () => { const id = addCustomFont(nameInp.value, 'local'); if (!id) return; fontHasCjk(nameInp.value).then(c => { setOpt(c ? 'cjk' : 'latin', id); renderAa(pop); }); };
    nameInp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') addName(); };
    pop.append(h('section', {}, h('h4', { text: t('customFont') }),
      h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, h('button', { class: 'btn sm', onclick: () => $('#fontfile').click() }, icon('open'), t('uploadFont')), window.queryLocalFonts ? h('button', { class: 'btn sm', onclick: pickLocalFont }, t('localFonts')) : null),
      h('div', { class: 'addfont' }, nameInp, h('button', { class: 'btn sm', onclick: addName }, t('add'))),
      h('p', { style: { margin: '8px 0 0', fontSize: '12px', color: 'var(--ink2)', lineHeight: '1.6' }, text: t('customFontHint') })));
    if (v === Flow && S.doc.fixedClass === 'code' || !v) pop.append(h('section', {}, h('h4', { text: t('fontMono') }), fontGrid('mono')));
  }
  if (flow || !v) {
    pop.append(h('section', {}, h('h4', { text: t('typeset') }),
      sliderRow(t('fsize'), 'fs', 12, 34, 1, x => x + 'px'),
      sliderRow(t('lheight'), 'lh', 1.2, 2.6, 0.05, x => x.toFixed(2)),
      sliderRow(t('pspace'), 'ps', 0, 2, 0.1, x => x.toFixed(1) + 'em'),
      sliderRow(t('lspace'), 'ls', -0.05, 0.2, 0.01, x => (x * 100).toFixed(0) + '%'),
      sliderRow(t('pwidth'), 'pw', 420, 1200, 10, x => x + 'px'),
      h('div', { class: 'row2' }, h('span', { text: t('align') }), seg([['justify', t('alJustify')], ['left', t('alLeft')]], S.set.align, x => { setOpt('align', x); renderAa(pop); })),
      h('div', { class: 'row2' }, h('span', { text: t('indent') }), seg([['auto', t('auto')], ['on', t('on')], ['off', t('off')]], S.set.indent, x => { setOpt('indent', x); renderAa(pop); }))));
  }
  if (v && (v === Pdf || (v === Flow && !Flow.isPaged()))) pop.append(h('section', {}, h('h4', {}, t('autoScroll'), h('small', { text: 'A' })), sliderRow(t('speed'), 'autoSpeed', 5, 240, 5, x => x + 'px/s'), h('button', { class: 'btn sm', onclick: () => { Auto.toggle(); closePops(); } }, icon(Auto.on ? 'pause' : 'play'), t(Auto.on ? 'autoStop' : 'autoStart'))));
  if (textual) { const sel = h('select', {}, ENCODINGS.map(e => h('option', { value: e, selected: (S.st.enc || 'auto') === e }, e === 'auto' ? t('auto') : e.toUpperCase()))); sel.onchange = () => { closePops(); reopenWithEncoding(sel.value); }; pop.append(h('section', {}, h('h4', { text: t('encoding') }), sel)); }
  pop.append(h('section', {}, h('button', { class: 'btn sm', onclick: () => { const keep = { lang: S.set.lang, side: S.set.side, sideTab: S.set.sideTab }; S.set = Object.assign({}, DEF, keep); saveSet(); applySettings(); if (S.view === Flow) Flow.relayout(Flow.anchorO); renderAa(pop); } }, t('resetType'))));
}
function renderTTS(pop) {
  pop.innerHTML = '';
  const az = S.set.ttsEngine === 'azure';
  const sample = lang => lang === 'zh' ? '夜深了，窗外的雨还在下。“你听见了吗？”她轻声问。' : 'The rain kept falling. "Did you hear that?" she whispered.';
  const tryBtn = lang => h('button', { class: 'ib', title: t('preview'), onclick: () => TTS.speakOnly(sample(lang)) }, icon('play'));
  pop.append(h('section', {}, h('h4', { text: t('tts') }), h('div', { class: 'ttsrow' },
    h('button', { class: 'btn primary', onclick: () => TTS.on ? TTS.pause() : TTS.start() }, icon(TTS.on && !TTS.paused ? 'pause' : 'play'), t(TTS.on ? (TTS.paused ? 'resume' : 'pause') : 'readFromHere')),
    h('button', { class: 'btn', disabled: !TTS.on, onclick: () => TTS.stop() }, icon('stop'), t('stop')))));
  pop.append(h('section', {}, h('h4', { text: t('ttsEngine') }), seg([['system', t('engSystem')], ['azure', t('engAzure')]], az ? 'azure' : 'system', v => {
    if (v === 'azure' && !Azure.ok()) { closePops(); Azure.setup(); return; }
    TTS.stop(); S.set.ttsEngine = v; saveSet(); renderTTS(pop);
  })));
  const sec = h('section', {}); pop.append(sec);
  if (az && Azure.ok()) {
    const voicesBox = h('div', {}, h('p', { class: 'ttsnote', text: t('relLoading') }));
    sec.append(voicesBox);
    Azure.ensureVoices().then(() => {
      voicesBox.innerHTML = '';
      const pick = (lang, key) => {
        const list = Azure.listFor(lang), cur = Azure.voiceFor(lang);
        const sel = h('select', {}, list.map(v => h('option', { value: v.name, selected: cur && v.name === cur.name }, Azure.label(v))));
        sel.onchange = () => { S.set[key] = sel.value; saveSet(); renderTTS(pop); TTS.speakOnly(sample(lang)); };
        return h('div', { class: 'row3' }, h('span', { text: t(lang === 'zh' ? 'timbreZh' : 'timbreEn') }), sel, tryBtn(lang));
      };
      const zv = Azure.voiceFor('zh');
      const styles = zv ? zv.styles : [];
      const ssel = h('select', {}, h('option', { value: 'auto', selected: S.set.azStyle === 'auto' }, t(styles.length ? 'styleAuto' : 'styleAutoNone')), h('option', { value: 'none', selected: S.set.azStyle === 'none' }, t('styleNone')), styles.map(st => h('option', { value: st, selected: S.set.azStyle === st }, Azure.styleLabel(st))));
      ssel.onchange = () => { S.set.azStyle = ssel.value; saveSet(); TTS.speakOnly(sample('zh')); };
      voicesBox.append(pick('zh', 'azVoiceZh'), pick('en', 'azVoiceEn'),
        h('div', { class: 'row3' }, h('span', { text: t('emotion') }), ssel, tryBtn('zh')),
        sliderRow(t('emotionDeg'), 'azDegree', 0.5, 2, 0.1, x => x.toFixed(1) + '×'),
        h('p', { class: 'ttsnote', text: t('azAutoNote') }),
        h('p', { class: 'ttsnote' }, t('azUsage', Azure.usage().toLocaleString()), '  ', h('a', { href: '#', onclick: e => { e.preventDefault(); closePops(); Azure.setup(); } }, t('azChange'))));
    }).catch(e => { voicesBox.innerHTML = ''; voicesBox.append(h('p', { class: 'warn', text: e instanceof TypeError ? t('azNet') : e.message }), h('button', { class: 'btn sm', onclick: () => { closePops(); Azure.setup(); } }, t('azChange'))); });
  } else {
    const pick = (lang, key) => {
      const list = TTS.list(lang);
      if (!list.length) return h('div', { class: 'row2' }, h('span', { text: t(lang === 'zh' ? 'voiceZh' : 'voiceEn') }), h('span', { class: 'warn', text: t(lang === 'zh' ? 'noZhVoiceShort' : 'noEnVoiceShort') }));
      const tag = v => { const q = TTS.qualityTag(v); return q ? `，${q}` : ''; };
      const sel = h('select', {}, h('option', { value: 'auto', selected: !S.set[key] || S.set[key] === 'auto' }, t('voiceAuto') + `（${TTS.shortName(list[0])}）`), list.map(v => h('option', { value: v.voiceURI, selected: S.set[key] === v.voiceURI, title: v.name }, `${TTS.shortName(v)}（${v.lang}${tag(v)}）`)));
      sel.onchange = () => { S.set[key] = sel.value; saveSet(); TTS.speakOnly(sample(lang)); };
      return h('div', { class: 'row3' }, h('span', { text: t(lang === 'zh' ? 'voiceZh' : 'voiceEn') }), sel, tryBtn(lang));
    };
    sec.append(pick('zh', 'voiceZh'), pick('en', 'voiceEn'), h('div', { class: 'row2' }, h('span', { text: t('ttsExpr') }), seg([[true, t('on')], [false, t('off')]], S.set.ttsExpr !== false, v => { S.set.ttsExpr = v; saveSet(); renderTTS(pop); TTS.speakOnly(sample('zh')); })));
    sec.append(h('p', { class: 'ttsnote', text: TTS.list('zh').length ? t('natural_' + osKind()) : t('zhVoiceHow_' + osKind()) }));
  }
  pop.append(h('section', {}, sliderRow(t('rate'), 'ttsRate', 0.5, 2.5, 0.1, x => x.toFixed(1) + '×'), sliderRow(t('pitch'), 'ttsPitch', 0.5, 1.5, 0.05, x => x.toFixed(2))));
}
function renderMore(pop) {
  pop.innerHTML = ''; const m = h('div', { class: 'menu' });
  const item = (ic, label, key, fn, dis) => h('button', { onclick: () => { closePops(); fn(); }, disabled: dis, style: dis ? { opacity: '.4' } : null }, icon(ic), label, key ? h('kbd', { text: key }) : null);
  if (S.doc && S.st) m.append(h('div', { style: { padding: '8px 10px 6px', fontSize: '12.5px', color: 'var(--ink2)' }, text: t('readTime', fmtMin(S.st.ms / 60000)) }), h('hr'));
  m.append(item('open', t('openFile'), 'O', () => $('#file').click()));
  if (S.doc) m.append(item('home', t('backShelf'), '', () => closeDoc()));
  m.append(h('hr'));
  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) m.append(item('full', t('fullscreen'), 'F', toggleFullscreen));
  if (S.doc) { m.append(item('eye', t('immersive'), 'Z', () => UI.toggleImmersive())); m.append(item('scroll', t(Auto.on ? 'autoStop' : 'autoScroll'), 'A', () => Auto.toggle(), S.view === Gallery)); }
  m.append(item('globe', t('ghMenu'), '', () => Sync.setup()));
  m.append(item('download', Release.label(), '', () => Release.show()));
  m.append(item('key', t('shortcuts'), '?', showKeys));
  m.append(h('hr'));
  m.append(item('globe', LANG === 'zh' ? 'English' : '中文', '', () => { LANG = LANG === 'zh' ? 'en' : 'zh'; S.set.lang = LANG; saveSet(); UI.i18n(); if (S.doc) { Side.render(); UI.updatePos(); UI.updateZoom(); $('#b-alt-l').textContent = S.doc.alt ? t(S.doc.alt.label) : ''; } }));
  pop.append(m);
}
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => toast(t('fsFail'))); else if (!p) toast(t('fsFail')); }
  } catch { toast(t('fsFail')); }
}
function showKeys() {
  const rows = [['← / →', 'kPage'], ['Space', 'kNext'], ['Ctrl / ⌘ + F', 'kSearch'], ['T', 'kToc'], ['B', 'kBm'], ['R', 'kTts'], ['A', 'kAuto'], ['+ / −', 'kZoom'], ['D', 'kTheme'], ['F', 'kFull'], ['Z', 'kImm'], ['O', 'kOpen'], ['Esc', 'kEsc']];
  modal({ title: t('shortcuts'), body: h('div', { class: 'keys' }, rows.flatMap(([k, l]) => [h('span', { class: 'kbd', text: k }), h('span', { text: t(l) })])) });
}

/* ======================= Sample document ======================= */
function openSample() {
  const md = t('sampleMd');
  const f = new File([md], t('sampleName') + '.md', { type: 'text/markdown', lastModified: 1 });
  openFile(f);
}

/* ======================= Events ======================= */
function bind() {
  $('#b-side').onclick = () => Side.toggle();
  $('#imm-exit').onclick = () => UI.toggleImmersive(false);
  $('#scrim').onclick = () => Side.close();
  $('#b-home').onclick = () => { if (S.doc) closeDoc(); };
  $('#b-aa').onclick = e => openPop($('#p-aa'), e.currentTarget, renderAa);
  $('#b-tts').onclick = e => openPop($('#p-tts'), e.currentTarget, renderTTS);
  $('#b-more').onclick = e => openPop($('#p-more'), e.currentTarget, renderMore);
  $('#b-bm').onclick = () => Bookmarks.toggle();
  $('#b-alt').onclick = () => toggleAlt();
  $('#b-prev').onclick = () => S.view && S.view.prev();
  $('#b-next').onclick = () => S.view && S.view.next();
  $('#z-in').onclick = () => S.view && S.view.zoomBy(1.15);
  $('#z-out').onclick = () => S.view && S.view.zoomBy(1 / 1.15);
  $('#z-val').onclick = () => { if (S.view === Pdf) { Pdf.fit = 'num'; Pdf.zoom = 1; Pdf.applyScale(); } else if (S.view === Gallery) Gallery.setFit(); };
  $('#z-fit').onclick = () => { if (S.view === Pdf) Pdf.setFit(Pdf.fit === 'page' ? 'width' : 'page'); else if (S.view === Gallery) Gallery.setFit(); };
  $('#z-rot').onclick = () => S.view && S.view.rotate && S.view.rotate();
  $('#z-spread').onclick = () => S.view && S.view.toggleSpread && S.view.toggleSpread();
  const slider = $('#slider'), tip = $('#slider-tip');
  slider.oninput = () => { if (!S.view) return; const p = slider.value / 1000; tip.textContent = S.view.sectionAtProgress(p) + '  ' + Math.round(p * 100) + '%'; tip.classList.remove('hidden'); const r = slider.getBoundingClientRect(), wr = $('#slider-wrap').getBoundingClientRect(); tip.style.left = (r.left - wr.left + p * r.width) + 'px'; };
  slider.onchange = () => { tip.classList.add('hidden'); if (S.view) S.view.jumpProgress(slider.value / 1000); };
  slider.onpointerup = () => tip.classList.add('hidden');
  // search
  const q = $('#q');
  q.onkeydown = e => {
    e.stopPropagation();
    if (e.key === 'Enter') { if (q.value.trim() !== Search.q) Search.run(q.value); else Search.go(Search.idx + (e.shiftKey ? -1 : 1)); }
    else if (e.key === 'Escape') { q.value = ''; Search.run(''); q.blur(); $('#searchbox').classList.remove('open'); }
  };
  $('#q-next').onclick = () => Search.q ? Search.go(Search.idx + 1) : Search.run(q.value);
  $('#q-prev').onclick = () => Search.go(Search.idx - 1);
  $('#q-icon').onclick = () => { $('#searchbox').classList.add('open'); q.focus(); };
  q.onblur = () => setTimeout(() => { if (!q.value && document.activeElement !== q) $('#searchbox').classList.remove('open'); }, 200);
  // files
  $('#file').onchange = e => { const f = e.target.files[0]; if (f) openFile(f); e.target.value = ''; };
  $('#fontfile').onchange = e => { if (e.target.files.length) uploadFonts([...e.target.files]); e.target.value = ''; };
  let dragN = 0;
  addEventListener('dragenter', e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { dragN++; document.body.classList.add('dragging'); e.preventDefault(); } });
  addEventListener('dragover', e => { if ([...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault(); });
  addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) document.body.classList.remove('dragging'); });
  addEventListener('drop', e => {
    e.preventDefault(); dragN = 0; document.body.classList.remove('dragging');
    const files = [...(e.dataTransfer.files || [])]; if (!files.length) return;
    const fonts = files.filter(f => /\.(ttf|otf|woff2?|ttc)$/i.test(f.name));
    if (fonts.length) uploadFonts(fonts);
    const doc = files.find(f => !/\.(ttf|otf|woff2?|ttc)$/i.test(f.name)); if (doc) openFile(doc);
  });
  // selection
  document.addEventListener('mouseup', e => { if (e.target.closest && e.target.closest('#selbar')) return; setTimeout(() => Sel.check(), 10); });
  document.addEventListener('touchend', e => { if (e.target.closest && e.target.closest('#selbar')) return; setTimeout(() => Sel.check(), 300); });
  document.addEventListener('keyup', e => { if (e.shiftKey) Sel.check(); });
  document.addEventListener('mousedown', e => {
    if (!e.target.closest('#selbar') && !e.target.closest('mark.hl')) Sel.hide();
    if (!e.target.closest('.pop') && !e.target.closest('#top .ib') && !e.target.closest('#modal')) closePops();
  });
  // activity
  for (const ev of ['keydown', 'pointerdown', 'wheel', 'touchstart']) addEventListener(ev, () => S.lastAct = Date.now(), { passive: true });
  setInterval(() => { if (S.doc && S.st && document.visibilityState === 'visible' && Date.now() - S.lastAct < 180000) { S.st.ms += 15000; saveSt(); } }, 15000);
  addEventListener('beforeunload', () => { if (S.st && S.id) LS.set('doc.' + S.id, S.st); Sync.flush(); });
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); if (S.st && S.id) { LS.set('doc.' + S.id, S.st); Sync.stateDirty(S.id); } Sync.flush(); }
    else if (Sync.on() && Date.now() - hiddenAt > 120000) { if (S.doc && S.id) Sync.run('resume', async () => { await Sync.pushState(S.id); }); else Sync.syncAll(); }
  });
  if (document.fonts) document.fonts.addEventListener('loadingdone', debounce(() => { if (S.view === Flow) Flow.relayout(Flow.anchorO); }, 200));
  addEventListener('keydown', onKey);
}
function onKey(e) {
  const tg = e.target; if (tg.matches && tg.matches('input,textarea,select,[contenteditable]')) return;
  if ($('#modal').classList.contains('open')) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  if (mod && (k === 'f' || k === 'F')) { if (S.doc && S.view !== Gallery) { e.preventDefault(); $('#searchbox').classList.add('open'); $('#q').focus(); $('#q').select(); } return; }
  if (mod && (k === '=' || k === '+' || k === '-')) { if (S.view === Pdf || S.view === Gallery) { e.preventDefault(); S.view.zoomBy(k === '-' ? 1 / 1.15 : 1.15); } return; }
  if (mod || e.altKey) return;
  if (k === 'Escape') { if ($$('.pop.open').length) closePops(); else if ($('#selbar').classList.contains('open')) Sel.hide(); else if (Auto.on) Auto.stop(); else if (document.body.classList.contains('immersive')) UI.toggleImmersive(false); else if (Search.q) { $('#q').value = ''; Search.run(''); } return; }
  if (k === 'o' || k === 'O') { $('#file').click(); return; }
  if (k === 'f' || k === 'F') { toggleFullscreen(); return; }
  if (k === '?') { showKeys(); return; }
  if (k === 'd' || k === 'D') { const th = ['paper', 'sepia', 'green', 'dark', 'black']; setOpt('theme', th[(th.indexOf(S.set.theme) + 1) % th.length]); toast(t('th' + S.set.theme[0].toUpperCase() + S.set.theme.slice(1))); return; }
  if (!S.view) return;
  const v = S.view;
  if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { if (k === ' ' && Auto.on) { Auto.stop(); e.preventDefault(); return; } if (v === Flow && !Flow.isPaged() && (k === 'ArrowRight')) { e.preventDefault(); v.next(); return; } e.preventDefault(); v.next(); return; }
  if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); v.prev(); return; }
  if ((k === 'ArrowDown' || k === 'ArrowUp') && (v === Flow && Flow.isPaged() || (v === Gallery && Gallery.mode === 'single'))) { e.preventDefault(); k === 'ArrowDown' ? v.next() : v.prev(); return; }
  if (k === 'Home' && v === Flow) { e.preventDefault(); Flow.show(0); return; }
  if (k === 'End' && v === Flow) { e.preventDefault(); Flow.show(S.doc.sections.length - 1, { end: true }); return; }
  if (k === 't' || k === 'T') { if (!document.body.classList.contains('side-open') || Side.tab !== 'toc') Side.open('toc'); else Side.close(); return; }
  if (k === 'b' || k === 'B') { Bookmarks.toggle(); return; }
  if (k === 'r' || k === 'R') { if (TTS.ok && v !== Gallery) TTS.on ? TTS.stop() : TTS.start(); return; }
  if (k === 'a' || k === 'A') { Auto.toggle(); return; }
  if (k === 'z' || k === 'Z') { UI.toggleImmersive(); return; }
  if (k === '+' || k === '=') { if (v === Flow) setOpt('fs', clamp(S.set.fs + 1, 12, 34)); else v.zoomBy(1.15); return; }
  if (k === '-' || k === '_') { if (v === Flow) setOpt('fs', clamp(S.set.fs - 1, 12, 34)); else v.zoomBy(1 / 1.15); return; }
}

/* ======================= init ======================= */
function init() {
  Sync.init();
  applySettings(); UI.i18n(); bind(); TTS.init();
  if (!TTS.ok) $('#b-tts').classList.add('hidden');
  UI.readerMode(false);
  if (Sync.on()) Sync.syncAll();
  Desktop.init(); Release.autoCheck();
}
init();
