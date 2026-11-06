/* ===================== formats.js — parsers ===================== */
const BUILD = 'local'; // build flag: local | artifact | pages
const PAGES_URL = 'https://chunxiao-lin-2023.github.io/Claude_space_0/reader/';
const PREFER_CDN = BUILD !== 'local';
const LIBS = {
  pdf:      ['lib/pdf.min.js', 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'],
  jszip:    ['lib/jszip.min.js', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'],
  mammoth:  ['lib/mammoth.browser.min.js', 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'],
  docxview: ['lib/docx-preview.min.js', 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.3/dist/docx-preview.min.js'],
  xlsx:     ['lib/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'],
  marked:   ['lib/marked.min.js', 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js'],
  purify:   ['lib/purify.min.js', 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js'],
  hljs:     ['lib/highlight.min.js', 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'],
  katex:    ['lib/katex.min.js', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js'],
};
const srcOrder = list => PREFER_CDN ? [...list.slice(1), list[0]] : list;
const LIB_SRC = {};
const libCache = {};
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load ' + src)); };
    document.head.appendChild(s);
  });
}
function loadLib(name) {
  return libCache[name] ||= (async () => {
    if (name === 'docxview') await loadLib('jszip');
    for (const src of srcOrder(LIBS[name])) {
      try { await loadScript(src); LIB_SRC[name] = src; return; } catch (e) { /* try next */ }
    }
    delete libCache[name];
    throw new Error(t('libFail', name));
  })();
}
const HL_EXTRA = ['verilog','vhdl','tcl','matlab','latex','dockerfile','scala','dart','powershell','cmake','protobuf','haskell','elixir','julia','fortran','nginx','groovy','x86asm','armasm','llvm'];
async function ensureLang(lang) {
  await loadLib('hljs');
  if (!lang || hljs.getLanguage(lang)) return !!lang;
  if (!HL_EXTRA.includes(lang)) return false;
  let ok = false;
  for (const base of srcOrder(['lib/hl/', 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/languages/', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/'])) {
    try { await loadScript(base + lang + '.min.js'); ok = true; break; } catch {}
  }
  if (!ok) return false;
  return !!hljs.getLanguage(lang);
}

/* ---------- detection ---------- */
const CODE_EXT = {
  js:'javascript',mjs:'javascript',cjs:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',py:'python',pyw:'python',
  c:'c',h:'c',cpp:'cpp',cc:'cpp',cxx:'cpp',hpp:'cpp',hh:'cpp',cs:'csharp',java:'java',kt:'kotlin',kts:'kotlin',go:'go',rs:'rust',
  rb:'ruby',php:'php',swift:'swift',mm:'objectivec',scala:'scala',sh:'bash',bash:'bash',zsh:'bash',fish:'bash',ps1:'powershell',
  sql:'sql',css:'css',scss:'scss',sass:'scss',less:'less',xml:'xml',svgxml:'xml',xsl:'xml',plist:'xml',vue:'xml',svelte:'xml',
  yaml:'yaml',yml:'yaml',toml:'ini',ini:'ini',cfg:'ini',conf:'ini',properties:'ini',env:'bash',json:'json',jsonc:'json',json5:'json',
  geojson:'json',ipynb:'json',lua:'lua',r:'r',pl:'perl',pm:'perl',dart:'dart',v:'verilog',sv:'verilog',svh:'verilog',vh:'verilog',
  vhd:'vhdl',vhdl:'vhdl',tcl:'tcl',xdc:'tcl',sdc:'tcl',m:'matlab',tex:'latex',sty:'latex',bib:'latex',dockerfile:'dockerfile',
  makefile:'makefile',mk:'makefile',cmake:'cmake',proto:'protobuf',hs:'haskell',ex:'elixir',exs:'elixir',jl:'julia',f90:'fortran',
  f:'fortran',for:'fortran',groovy:'groovy',gradle:'groovy',asm:'x86asm',s:'armasm',ll:'llvm',diff:'diff',patch:'diff',graphql:'graphql',
  gql:'graphql',vb:'vbnet',wat:'wasm',nginx:'nginx',gitignore:'bash',
};
const IMG_EXT = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', jfif:'image/jpeg', gif:'image/gif', webp:'image/webp', bmp:'image/bmp', svg:'image/svg+xml', avif:'image/avif', ico:'image/x-icon', apng:'image/apng' };
const FMT_BY_EXT = {
  pdf:'pdf', epub:'epub', mobi:'mobi', azw:'mobi', azw3:'mobi', prc:'mobi', kf8:'mobi', fb2:'fb2', docx:'docx', docm:'docx', dotx:'docx',
  odt:'odt', rtf:'rtf', txt:'txt', text:'txt', log:'txt', nfo:'txt', md:'md', markdown:'md', mdown:'md', mkd:'md', mdx:'md',
  html:'html', htm:'html', xhtml:'html', mht:'html', xlsx:'sheet', xlsm:'sheet', xlsb:'sheet', xls:'sheet', ods:'sheet', numbers:'sheet',
  csv:'csv', tsv:'csv', pptx:'pptx', ppsx:'pptx', potx:'pptx', cbz:'cbz', zip:'zip', doc:'legacy', ppt:'legacy', wps:'legacy',
  cbr:'rar', rar:'rar', '7z':'rar', djvu:'djvu', tif:'tiff', tiff:'tiff', heic:'tiff',
};
function extOf(name) {
  const n = name.toLowerCase();
  if (/(^|\/)(dockerfile|makefile)$/.test(n)) return n.split('/').pop();
  const m = /\.([a-z0-9]+)$/.exec(n); return m ? m[1] : '';
}
async function detectFormat(name, u8) {
  const ext = extOf(name);
  const head = String.fromCharCode(...u8.subarray(0, 8));
  if (head.startsWith('%PDF')) return 'pdf';
  if (u8.length > 68 && String.fromCharCode(...u8.subarray(60, 68)) === 'BOOKMOBI') return 'mobi';
  if (u8[0] === 0x50 && u8[1] === 0x4B) {
    if (['epub','docx','docm','dotx','pptx','ppsx','potx','xlsx','xlsm','odt','ods','cbz'].includes(ext)) return FMT_BY_EXT[ext];
    await loadLib('jszip');
    const zip = await JSZip.loadAsync(u8);
    const files = Object.keys(zip.files);
    const mt = zip.file('mimetype') ? (await zip.file('mimetype').async('string')).trim() : '';
    if (mt === 'application/epub+zip' || files.includes('META-INF/container.xml')) return 'epub';
    if (mt.includes('opendocument.text')) return 'odt';
    if (mt.includes('opendocument.spreadsheet')) return 'sheet';
    if (files.some(f => f.startsWith('word/'))) return 'docx';
    if (files.some(f => f.startsWith('ppt/'))) return 'pptx';
    if (files.some(f => f.startsWith('xl/'))) return 'sheet';
    if (files.some(f => IMG_EXT[extOf(f)])) return 'cbz';
    return 'zip';
  }
  if (u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0) return ext === 'xls' ? 'sheet' : 'legacy';
  if (IMG_EXT[ext]) return 'image';
  if (head.startsWith('{\\rtf')) return 'rtf';
  if (FMT_BY_EXT[ext]) return FMT_BY_EXT[ext];
  if (CODE_EXT[ext]) return 'code';
  // sniff text vs binary
  let bin = 0; const n = Math.min(u8.length, 4096);
  for (let i = 0; i < n; i++) { const c = u8[i]; if (c === 0 || (c < 8)) bin++; }
  if (bin > n * 0.02 && !(u8[0] === 0xFF && u8[1] === 0xFE) && !(u8[0] === 0xFE && u8[1] === 0xFF)) return 'binary';
  const txt = new TextDecoder('utf-8').decode(u8.subarray(0, 2048)).trimStart();
  if (/^<(!doctype html|html)/i.test(txt)) return 'html';
  if (/^<\?xml[^>]*>\s*<FictionBook/i.test(txt)) return 'fb2';
  return 'txt';
}

/* ---------- text decoding ---------- */
const ENCODINGS = ['auto','utf-8','gb18030','big5','utf-16le','utf-16be','shift_jis','euc-kr','windows-1252','windows-1251','iso-8859-1'];
function decodeText(u8, forced) {
  if (forced && forced !== 'auto') {
    try { return new TextDecoder(forced).decode(u8); } catch { /* fall through */ }
  }
  if (u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return new TextDecoder('utf-8').decode(u8.subarray(3));
  if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(u8.subarray(2));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch {}
  let zEven = 0, zOdd = 0; const n = Math.min(u8.length, 4000);
  for (let i = 0; i < n; i++) if (u8[i] === 0) (i % 2 ? zOdd++ : zEven++);
  if (zOdd > n / 6) return new TextDecoder('utf-16le').decode(u8);
  if (zEven > n / 6) return new TextDecoder('utf-16be').decode(u8);
  const sample = u8.subarray(0, 60000);
  const score = (s, chars) => { let k = 0; for (const c of s) if (chars.includes(c)) k++; const bad = (s.match(/\uFFFD/g) || []).length; return k - bad * 3; };
  const gb = new TextDecoder('gb18030').decode(sample);
  const big = new TextDecoder('big5').decode(sample);
  const sj = new TextDecoder('shift_jis').decode(sample);
  const sGb = score(gb, '的一是了不在人有我他这个们中来上大为和国地到以说时要就出会也你对生能而子那得于着下自之年过发后作里'),
        sBig = score(big, '的一是了不在人有我他這個們中來上大為和國地到以說時要就出會也你對生能而子那得於著下自之年過發後作裡'),
        sSj = score(sj, 'のはをにがでとたしてるいますこれそあなかもった');
  if (sBig > sGb * 1.2 && sBig > sSj) return new TextDecoder('big5').decode(u8);
  if (sSj > sGb * 1.2 && sSj > 20) return new TextDecoder('shift_jis').decode(u8);
  if (sGb > 0 || /[\x80-\xff]/.test(String.fromCharCode(...sample.subarray(0, 200)))) return new TextDecoder('gb18030').decode(u8);
  return new TextDecoder('windows-1252').decode(u8);
}

/* ---------- shared helpers ---------- */
function parseXml(str) { return new DOMParser().parseFromString(str, 'application/xml'); }
function parseMarkup(str) {
  let d = new DOMParser().parseFromString(str, 'application/xhtml+xml');
  if (d.getElementsByTagName('parsererror').length || !d.body) d = new DOMParser().parseFromString(str, 'text/html');
  return d;
}
const byTag = (root, name) => Array.from(root.getElementsByTagNameNS('*', name));
const firstTag = (root, name) => root.getElementsByTagNameNS('*', name)[0] || null;
function resolvePath(base, href) {
  if (!href) return href;
  href = href.split('#')[0];
  try { href = decodeURIComponent(href); } catch {}
  if (/^[a-z]+:/i.test(href)) return href;
  const parts = (href.startsWith('/') ? href.slice(1) : base + href).split('/');
  const out = [];
  for (const p of parts) { if (p === '..') out.pop(); else if (p !== '.' && p !== '') out.push(p); }
  return out.join('/');
}
const dirOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
function mimeOf(name) { return IMG_EXT[extOf(name)] || 'application/octet-stream'; }
function sniffImg(u8) {
  if (u8[0] === 0xFF && u8[1] === 0xD8) return 'image/jpeg';
  if (u8[0] === 0x89 && u8[1] === 0x50) return 'image/png';
  if (u8[0] === 0x47 && u8[1] === 0x49) return 'image/gif';
  if (u8[0] === 0x42 && u8[1] === 0x4D) return 'image/bmp';
  if (u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50) return 'image/webp';
  return null;
}
let purifyHooked = false, KEEP_STYLE = false;
function sanitize(html, keepStyle) {
  KEEP_STYLE = !!keepStyle;
  try { return sanitizeInner(html); } finally { KEEP_STYLE = false; }
}
function sanitizeInner(html) {
  if (!purifyHooked) {
    purifyHooked = true;
    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.attrName === 'style') {
        if (KEEP_STYLE) return;
        const keep = (data.attrValue || '').split(';').map(s => s.trim()).filter(s => /^(text-align|font-style|font-weight|text-decoration|vertical-align|font-variant)\s*:/i.test(s));
        data.attrValue = keep.join(';');
        if (!data.attrValue) data.keepAttr = false;
      }
    });
  }
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'link', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'base', 'noscript', 'audio', 'video', 'source'],
    ADD_ATTR: ['target', 'epub:type'],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true,
  });
}
function plainLen(html) { return Math.max(1, html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').length); }
function slug(i) { return 'h-' + i; }
/** Single-section doc from HTML; builds TOC from headings. */
function docFromHtml(html, title, extra = {}) {
  const box = document.createElement('div'); box.innerHTML = html;
  const toc = []; let i = 0;
  for (const hEl of box.querySelectorAll('h1,h2,h3,h4')) {
    const txt = hEl.textContent.trim(); if (!txt) continue;
    if (!hEl.id) hEl.id = slug(i++);
    toc.push({ title: txt.slice(0, 120), level: +hEl.tagName[1] - 1, s: 0, anchor: hEl.id });
  }
  const minLv = toc.reduce((m, x) => Math.min(m, x.level), 9); toc.forEach(x => x.level -= minLv === 9 ? 0 : minLv);
  const out = box.innerHTML;
  return { kind: 'flow', title, sections: [{ title, html: out, len: plainLen(out) }], toc, ...extra };
}

/* ---------- TXT / RTF (paragraph lists) ---------- */
const CH_RE = /^[ \t　]*(第[ 　]*[0-9０-９零〇一二两三四五六七八九十百千万]+[ 　]*[章节節回卷集部篇幕话話](?:[ 　:：.、·\-—]?.{0,36})?|(?:序章|序幕|楔子|引子|序言|前言|自序|后记|後記|尾声|尾聲|终章|終章|番外[0-9一二三四五六七八九十]*)(?:[ 　:：.、·\-—].{0,36})?|(?:chapter|part|book)[ .:]+(?:[0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b.{0,48}|(?:prologue|epilogue)\b.{0,40})$/i;
function textToDoc(text, title) {
  text = text.replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const nonEmpty = lines.filter(l => l.trim()).length || 1;
  const blanks = lines.length - nonEmpty;
  const cjk = cjkRatio(text) > 0.2;
  // English hard-wrapped prose: paragraphs separated by blank lines
  const hardWrap = !cjk && blanks > nonEmpty * 0.12 && avgLen(lines) < 90;
  let paras = [];
  if (hardWrap) {
    let buf = [];
    for (const l of lines) { if (l.trim()) buf.push(l.trim()); else if (buf.length) { paras.push(buf.join(' ')); buf = []; } }
    if (buf.length) paras.push(buf.join(' '));
  } else paras = lines.map(l => l.replace(/^[ \t　 ]+/, '').replace(/\s+$/, '')).filter(Boolean);
  return parasToDoc(paras, title);
}
function avgLen(lines) { let s = 0, n = 0; for (const l of lines) if (l.trim()) { s += l.length; n++; } return n ? s / n : 0; }
function parasToDoc(paras, title) {
  const chIdx = [];
  paras.forEach((p, i) => { if (p.length <= 60 && CH_RE.test(p)) chIdx.push(i); });
  const sections = [];
  const pHtml = p => '<p>' + esc(p) + '</p>';
  if (chIdx.length >= 2) {
    if (chIdx[0] > 0) {
      const pre = paras.slice(0, chIdx[0]);
      sections.push({ title: t('preface'), html: pre.map(pHtml).join('') });
    }
    chIdx.forEach((start, k) => {
      const end = k + 1 < chIdx.length ? chIdx[k + 1] : paras.length;
      const head = paras[start];
      sections.push({ title: head, html: '<h2>' + esc(head) + '</h2>' + paras.slice(start + 1, end).map(pHtml).join('') });
    });
  } else {
    // chunk long texts without chapter marks
    const CH = 40000; let cur = [], len = 0, part = 1;
    for (const p of paras) {
      cur.push(p); len += p.length;
      if (len > CH) { sections.push({ title: t('partN', part++), html: cur.map(pHtml).join('') }); cur = []; len = 0; }
    }
    if (cur.length || !sections.length) sections.push({ title: sections.length ? t('partN', part) : title, html: cur.map(pHtml).join('') });
  }
  sections.forEach(s => s.len = plainLen(s.html));
  const toc = sections.length > 1 ? sections.map((s, i) => ({ title: s.title, level: 0, s: i })) : [];
  return { kind: 'flow', title, sections, toc, textual: true };
}
function rtfToParas(u8) {
  let src = ''; for (let i = 0; i < u8.length; i += 8192) src += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  const CP = { 936: 'gbk', 54936: 'gb18030', 950: 'big5', 932: 'shift_jis', 949: 'euc-kr', 1250: 'windows-1250', 1251: 'windows-1251', 1252: 'windows-1252', 1253: 'windows-1253', 1254: 'windows-1254', 1255: 'windows-1255', 1256: 'windows-1256', 65001: 'utf-8', 10000: 'macintosh' };
  const SKIP = new Set(['fonttbl','colortbl','stylesheet','info','pict','object','header','footer','headerl','headerr','headerf','footerl','footerr','footerf','listtable','listoverridetable','rsidtbl','generator','themedata','colorschememapping','datastore','latentstyles','xmlnstbl','mmathPr','pgdsctbl','revtbl','fldinst','filetbl','private','userprops','xe','tc','bkmkstart','bkmkend','datafield','shpinst','nonshppict','blipuid','wgrffmtfilter','pnseclvl','listtext','sp','sv','sn']);
  const SYM = { emdash: '—', endash: '–', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”', bullet: '•', tab: '\t', line: '\n', emspace: ' ', enspace: ' ', qmspace: ' ' };
  let cp = 'windows-1252', st = { skip: false, uc: 1 }, stack = [], paras = [], cur = '', bytes = [];
  const flush = () => { if (bytes.length) { try { cur += new TextDecoder(cp).decode(new Uint8Array(bytes)); } catch { cur += String.fromCharCode(...bytes); } bytes = []; } };
  let i = 0; const L = src.length;
  while (i < L) {
    const c = src[i];
    if (c === '{') { flush(); stack.push({ ...st }); i++; continue; }
    if (c === '}') { flush(); st = stack.pop() || st; i++; continue; }
    if (c === '\\') {
      const n = src[i + 1];
      if (n === "'") { if (!st.skip) bytes.push(parseInt(src.substr(i + 2, 2), 16)); i += 4; continue; }
      if (n === '\\' || n === '{' || n === '}') { flush(); if (!st.skip) cur += n; i += 2; continue; }
      if (n === '*') { st.skip = true; i += 2; continue; }
      if (n === '~') { flush(); if (!st.skip) cur += ' '; i += 2; continue; }
      if (n === '-' || n === '_') { i += 2; continue; }
      if (n === '\n' || n === '\r') { flush(); if (!st.skip) { paras.push(cur); cur = ''; } i += 2; continue; }
      const m = /^([a-zA-Z]{1,32})(-?\d{1,10})? ?/.exec(src.slice(i + 1, i + 46));
      if (!m) { i += 2; continue; }
      i += 1 + m[0].length;
      const w = m[1], arg = m[2] != null ? parseInt(m[2], 10) : null;
      if (w === 'bin') { i += arg || 0; continue; }
      if (w === 'u') {
        flush();
        if (!st.skip) cur += String.fromCharCode(arg < 0 ? arg + 65536 : arg);
        let k = st.uc;
        while (k > 0 && i < L) {
          if (src[i] === '\\' && src[i + 1] === "'") i += 4;
          else if (src[i] === '\\') { const mm = /^\\[a-zA-Z]+-?\d* ?/.exec(src.slice(i, i + 40)); i += mm ? mm[0].length : 2; }
          else if (src[i] === '{' || src[i] === '}') break;
          else i++;
          k--;
        }
        continue;
      }
      if (w === 'uc') { st.uc = arg ?? 1; continue; }
      if (w === 'ansicpg') { cp = CP[arg] || cp; continue; }
      if (SKIP.has(w)) { flush(); st.skip = true; continue; }
      flush();
      if (st.skip) continue;
      if (w === 'par' || w === 'sect' || w === 'page' || w === 'row') { paras.push(cur); cur = ''; }
      else if (w === 'cell') cur += '\t';
      else if (SYM[w]) cur += SYM[w];
      continue;
    }
    if (c === '\r' || c === '\n') { i++; continue; }
    if (!st.skip) { flush(); cur += c; }
    i++;
  }
  flush(); paras.push(cur);
  return paras.map(p => p.replace(/^[ \t　]+/, '').trimEnd()).filter(p => p.trim());
}

/* ---------- Markdown / HTML / code ---------- */
function replaceOutsideCode(src, fn) {
  const re = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) { out += fn(src.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
  return out + fn(src.slice(last));
}
async function highlightIn(root) {
  const blocks = root.querySelectorAll('pre > code');
  if (!blocks.length) return;
  await loadLib('hljs');
  for (const b of blocks) {
    const m = /(?:lang|language)-([\w+#-]+)/.exec(b.className);
    let lang = m ? m[1].toLowerCase() : null;
    const alias = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash', shell: 'bash', yml: 'yaml', v: 'verilog', sv: 'verilog', systemverilog: 'verilog', vhd: 'vhdl', tex: 'latex', 'c++': 'cpp', rs: 'rust', golang: 'go', ps: 'powershell', md: 'markdown', html: 'xml' };
    lang = alias[lang] || lang;
    if (b.textContent.length > 200000) continue;
    try {
      if (lang && await ensureLang(lang)) b.innerHTML = hljs.highlight(b.textContent, { language: lang, ignoreIllegals: true }).value;
      else if (!lang && b.textContent.length < 20000) b.innerHTML = hljs.highlightAuto(b.textContent).value;
      b.classList.add('hljs');
    } catch {}
  }
}
async function parseMd(text, title) {
  await Promise.all([loadLib('marked'), loadLib('purify')]);
  const maths = [];
  if (text.includes('$')) {
    text = replaceOutsideCode(text, seg => seg
      .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => { maths.push([tex, true]); return `@@MATH${maths.length - 1}@@`; })
      .replace(/(^|[^\\$\w])\$(?!\s)([^$\n]+?)(?<!\s)\$(?![\w$])/g, (m, pre, tex) => { maths.push([tex, false]); return pre + `@@MATH${maths.length - 1}@@`; }));
  }
  let html = sanitize(marked.parse(text, { gfm: true, breaks: false }));
  if (maths.length) {
    try {
      await loadLib('katex');
      html = html.replace(/@@MATH(\d+)@@/g, (m, i) => {
        const [tex, disp] = maths[+i];
        try { return katex.renderToString(tex, { displayMode: disp, output: 'mathml', throwOnError: false }); } catch { return esc(tex); }
      });
    } catch { html = html.replace(/@@MATH(\d+)@@/g, (m, i) => esc(maths[+i][0])); }
  }
  const box = document.createElement('div'); box.innerHTML = html;
  await highlightIn(box);
  for (const a of box.querySelectorAll('a[href]')) if (/^https?:/i.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
  const h1 = box.querySelector('h1');
  return docFromHtml(box.innerHTML, h1 ? h1.textContent.trim() : title, { textual: true });
}
async function parseHtmlDoc(text, name) {
  await loadLib('purify');
  const d = new DOMParser().parseFromString(text, 'text/html');
  const title = (d.title || '').trim() || name;
  for (const a of d.querySelectorAll('a[href]')) if (/^https?:/i.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
  const box = document.createElement('div'); box.innerHTML = sanitize(d.body ? d.body.innerHTML : text);
  await highlightIn(box);
  return docFromHtml(box.innerHTML, title, { textual: true });
}
async function parseCode(text, name) {
  const ext = extOf(name);
  let lang = CODE_EXT[ext] || (/^(dockerfile|makefile)$/.test(ext) ? ext : null);
  if (lang === 'json') { try { text = JSON.stringify(JSON.parse(text), null, 2); } catch {} }
  let inner = esc(text);
  if (text.length < 1500000) {
    try {
      await loadLib('hljs');
      if (lang && await ensureLang(lang)) inner = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
      else if (text.length < 100000) { const r = hljs.highlightAuto(text); inner = r.value; lang = r.language; }
    } catch {}
  }
  const n = text.split('\n').length;
  let gut = ''; for (let i = 1; i <= n; i++) gut += `<i data-n="${i}"></i>`;
  const html = `<div class="codebox"><div class="gut" aria-hidden="true">${gut}</div><pre><code class="hljs">${inner}</code></pre></div>`;
  return { kind: 'flow', title: name, sections: [{ title: name, html, len: text.length }], toc: [], fixed: true, fixedClass: 'code', textual: true, subtitle: lang ? lang : '' };
}

/* ---------- DOCX / ODT ---------- */
async function parseDocx(u8, name) {
  await Promise.all([loadLib('mammoth'), loadLib('purify')]);
  const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  const r = await mammoth.convertToHtml({ arrayBuffer: buf }, {
    styleMap: ["p[style-name='Title'] => h1.title:fresh", "p[style-name='Subtitle'] => p.subtitle:fresh", "p[style-name='Quote'] => blockquote:fresh", "p[style-name='Intense Quote'] => blockquote:fresh", "p[style-name='标题'] => h1:fresh", "p[style-name='副标题'] => p.subtitle:fresh"],
  });
  const html = sanitize(r.value);
  const doc = docFromHtml(html || '<p></p>', name.replace(/\.[^.]+$/, ''));
  doc.alt = { label: 'layoutOrig', make: () => docxOriginal(u8, name) };
  return doc;
}
async function docxOriginal(u8, name) {
  await loadLib('docxview');
  const title = name.replace(/\.[^.]+$/, '');
  return {
    kind: 'flow', title, fixed: true, fixedClass: 'docx', toc: [],
    sections: [{ title, len: 1, render: async (el) => {
      const styleHost = document.getElementById('docx-styles') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'docx-styles', hidden: true }));
      styleHost.innerHTML = '';
      await docx.renderAsync(new Blob([u8]), el, styleHost, { inWrapper: true, ignoreLastRenderedPageBreak: true, breakPages: true, experimental: true, useBase64URL: true, renderHeaders: true, renderFooters: true, renderFootnotes: true });
    } }],
    alt: null,
  };
}
async function parseOdt(u8, name) {
  await Promise.all([loadLib('jszip'), loadLib('purify')]);
  const zip = await JSZip.loadAsync(u8);
  const xml = parseXml(await zip.file('content.xml').async('string'));
  const NS_T = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
  const styles = {};
  for (const s of byTag(xml, 'style')) {
    const nm = s.getAttribute('style:name'), tp = firstTag(s, 'text-properties'), pp = firstTag(s, 'paragraph-properties');
    styles[nm] = { b: tp && /bold|[6-9]00/.test(tp.getAttribute('fo:font-weight') || ''), i: tp && (tp.getAttribute('fo:font-style') === 'italic'), u: tp && tp.getAttribute('style:text-underline-style') && tp.getAttribute('style:text-underline-style') !== 'none', c: pp && pp.getAttribute('fo:text-align') === 'center' };
  }
  const imgs = {};
  for (const f of Object.keys(zip.files)) if (IMG_EXT[extOf(f)]) imgs[f] = URL.createObjectURL(new Blob([await zip.file(f).async('uint8array')], { type: mimeOf(f) }));
  const ln = el => el.localName;
  function inline(node) {
    let out = '';
    for (const c of node.childNodes) {
      if (c.nodeType === 3) { out += esc(c.data); continue; }
      if (c.nodeType !== 1) continue;
      const n = ln(c);
      if (n === 's') out += ' '.repeat(+(c.getAttribute('text:c') || 1));
      else if (n === 'tab') out += '\t';
      else if (n === 'line-break') out += '<br>';
      else if (n === 'span') { const s = styles[c.getAttribute('text:style-name')] || {}; let x = inline(c); if (s.b) x = `<b>${x}</b>`; if (s.i) x = `<i>${x}</i>`; if (s.u) x = `<u>${x}</u>`; out += x; }
      else if (n === 'a') { const href = c.getAttribute('xlink:href') || ''; out += /^https?:/.test(href) ? `<a href="${esc(href)}" target="_blank" rel="noopener">${inline(c)}</a>` : inline(c); }
      else if (n === 'note') { const body = firstTag(c, 'note-body'); out += `<sup title="${esc(body ? body.textContent : '')}">${esc((firstTag(c, 'note-citation') || {}).textContent || '*')}</sup>`; }
      else if (n === 'frame') { const im = firstTag(c, 'image'); const href = im && im.getAttribute('xlink:href'); if (href && imgs[href]) out += `<img src="${imgs[href]}" alt="">`; }
      else if (n === 'bookmark' || n === 'bookmark-start' || n === 'soft-page-break' || n === 'sequence-decls' || n === 'annotation') { /* skip */ }
      else out += inline(c);
    }
    return out;
  }
  function block(node) {
    let out = '';
    for (const c of node.children) {
      const n = ln(c);
      if (n === 'h') { const lv = Math.min(6, +(c.getAttribute('text:outline-level') || 1)); out += `<h${lv}>${inline(c)}</h${lv}>`; }
      else if (n === 'p') { const s = styles[c.getAttribute('text:style-name')] || {}; out += `<p${s.c ? ' style="text-align:center"' : ''}>${inline(c) || '<br>'}</p>`; }
      else if (n === 'list') out += '<ul>' + Array.from(c.children).filter(x => ln(x) === 'list-item' || ln(x) === 'list-header').map(li => '<li>' + block(li) + '</li>').join('') + '</ul>';
      else if (n === 'table') out += '<table>' + byTag(c, 'table-row').map(r => '<tr>' + Array.from(r.children).filter(x => ln(x) === 'table-cell').map(td => `<td${td.getAttribute('table:number-columns-spanned') ? ` colspan="${td.getAttribute('table:number-columns-spanned')}"` : ''}>${block(td)}</td>`).join('') + '</tr>').join('') + '</table>';
      else if (n === 'section' || n === 'index-body' || n === 'table-of-content' || n === 'text') out += block(c);
    }
    return out;
  }
  const body = firstTag(xml, 'text');
  const raw = (body ? block(body) : '').replace(/<img src="(blob:[^"]+)"/g, '<img data-blob="$1"');
  const doc = docFromHtml(sanitize(raw) || '<p></p>', name.replace(/\.[^.]+$/, ''));
  doc.resolve = (art) => { art.querySelectorAll('img[data-blob]').forEach(im => im.src = im.dataset.blob); };
  doc.urls = Object.values(imgs);
  return doc;
}

/* ---------- EPUB ---------- */
async function parseEpub(u8, name) {
  await Promise.all([loadLib('jszip'), loadLib('purify')]);
  const zip = await JSZip.loadAsync(u8);
  const lower = {}; Object.keys(zip.files).forEach(f => lower[f.toLowerCase()] = f);
  const fileOf = p => zip.file(p) || (lower[p.toLowerCase()] && zip.file(lower[p.toLowerCase()]));
  const read = async p => { const f = fileOf(p); if (!f) throw new Error('missing ' + p); return f.async('string'); };
  const cont = parseXml(await read('META-INF/container.xml'));
  const opfPath = firstTag(cont, 'rootfile').getAttribute('full-path');
  const opf = parseXml(await read(opfPath));
  const base = dirOf(opfPath);
  const manifest = {};
  for (const it of byTag(opf, 'item')) manifest[it.getAttribute('id')] = { id: it.getAttribute('id'), href: resolvePath(base, it.getAttribute('href')), type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' };
  const spineEl = firstTag(opf, 'spine');
  const spine = byTag(opf, 'itemref').map(r => manifest[r.getAttribute('idref')]).filter(x => x && /html|xml/.test(x.type) && !/ncx/.test(x.type));
  const meta = n => { const e = firstTag(opf, n); return e ? e.textContent.trim() : ''; };
  const title = meta('title') || name.replace(/\.[^.]+$/, '');
  const author = byTag(opf, 'creator').map(e => e.textContent.trim()).join(', ');
  const lang = meta('language');
  const index = new Map(); spine.forEach((it, i) => index.set(it.href, i));
  const sections = [];
  for (const [i, it] of spine.entries()) {
    let raw; try { raw = await read(it.href); } catch { raw = '<p></p>'; }
    const d = parseMarkup(raw);
    const body = d.body || firstTag(d, 'body') || d.documentElement;
    const dir = dirOf(it.href);
    for (const img of body.querySelectorAll('img')) {
      const src = img.getAttribute('src');
      if (src && !/^(data|https?):/i.test(src)) { img.setAttribute('data-src', resolvePath(dir, src)); img.removeAttribute('src'); }
    }
    for (const im of byTag(body, 'image')) {
      const href = im.getAttribute('xlink:href') || im.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || im.getAttribute('href');
      if (href) { im.setAttribute('data-src', resolvePath(dir, href)); im.removeAttributeNS('http://www.w3.org/1999/xlink', 'href'); im.removeAttribute('xlink:href'); im.removeAttribute('href'); }
    }
    for (const a of body.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (/^[a-z]+:/i.test(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); continue; }
      const [p, frag] = href.split('#');
      const si = p ? index.get(resolvePath(dir, p)) : i;
      a.removeAttribute('href');
      if (si != null) { a.setAttribute('data-href', si + '#' + (frag || '')); a.setAttribute('href', '#' + (frag || '')); }
    }
    const tmp = document.implementation.createHTMLDocument('');
    const html = sanitize(tmp.importNode(body, true).innerHTML);
    sections.push({ title: '', html, len: plainLen(html), path: it.href });
  }
  // TOC
  let toc = [];
  const mapHref = (dir, href) => { if (!href) return null; const [p, frag] = href.split('#'); const s = index.get(resolvePath(dir, p)); return s == null ? null : { s, anchor: frag ? decodeURIComponent(frag) : null }; };
  const navItem = Object.values(manifest).find(x => /\bnav\b/.test(x.props));
  try {
    if (navItem) {
      const nd = parseMarkup(await read(navItem.href)); const dir = dirOf(navItem.href);
      const navs = byTag(nd, 'nav');
      const nav = navs.find(n => /toc/.test(n.getAttribute('epub:type') || n.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || '')) || navs[0];
      const walk = (ol, lv) => { for (const li of Array.from(ol.children).filter(c => c.localName === 'li')) {
        const a = Array.from(li.children).find(c => c.localName === 'a' || c.localName === 'span');
        const m = a && mapHref(dir, a.getAttribute('href'));
        if (a) toc.push({ title: a.textContent.trim().replace(/\s+/g, ' '), level: lv, ...(m || { s: null }) });
        const sub = Array.from(li.children).find(c => c.localName === 'ol' || c.localName === 'ul');
        if (sub) walk(sub, lv + 1);
      } };
      const ol = nav && Array.from(nav.getElementsByTagNameNS('*', 'ol'))[0];
      if (ol) walk(ol, 0);
    }
    if (!toc.length) {
      const ncxId = spineEl && spineEl.getAttribute('toc');
      const ncx = (ncxId && manifest[ncxId]) || Object.values(manifest).find(x => /ncx/.test(x.type));
      if (ncx) {
        const nd = parseXml(await read(ncx.href)); const dir = dirOf(ncx.href);
        const walk = (el, lv) => { for (const np of Array.from(el.children).filter(c => c.localName === 'navPoint')) {
          const label = firstTag(np, 'text'), content = firstTag(np, 'content');
          const m = content && mapHref(dir, content.getAttribute('src'));
          toc.push({ title: label ? label.textContent.trim() : '', level: lv, ...(m || { s: null }) });
          walk(np, lv + 1);
        } };
        const navMap = firstTag(nd, 'navMap'); if (navMap) walk(navMap, 0);
      }
    }
  } catch (e) { console.warn('toc', e); }
  toc = toc.filter(x => x.title);
  for (const x of toc) if (x.s != null && !sections[x.s].title) sections[x.s].title = x.title;
  sections.forEach((s, i) => { if (!s.title) s.title = titleFromHtml(s.html) || t('sectionN', i + 1); });
  if (!toc.length) toc = sections.map((s, i) => ({ title: s.title, level: 0, s: i }));
  // cover
  let coverPath = null;
  const ci = Object.values(manifest).find(x => /cover-image/.test(x.props));
  const metaCover = byTag(opf, 'meta').find(m => m.getAttribute('name') === 'cover');
  if (ci) coverPath = ci.href; else if (metaCover && manifest[metaCover.getAttribute('content')]) coverPath = manifest[metaCover.getAttribute('content')].href;
  const urlCache = new Map(); const urls = [];
  const blobUrl = async (p) => {
    if (urlCache.has(p)) return urlCache.get(p);
    const f = fileOf(p); if (!f) return null;
    const data = await f.async('uint8array');
    const u = URL.createObjectURL(new Blob([data], { type: sniffImg(data) || mimeOf(p) }));
    urlCache.set(p, u); urls.push(u); return u;
  };
  return {
    kind: 'flow', title, author, lang, sections, toc, urls,
    resolve: async (art) => {
      await Promise.all(Array.from(art.querySelectorAll('[data-src]')).map(async el => {
        const u = await blobUrl(el.getAttribute('data-src')); if (!u) return;
        if (el.localName === 'img') el.src = u; else el.setAttribute('href', u);
      }));
    },
    cover: coverPath ? () => blobUrl(coverPath) : null,
  };
}
function titleFromHtml(html) {
  const m = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i.exec(html);
  if (m) { const s = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); if (s) return s.slice(0, 80); }
  return '';
}

/* ---------- MOBI / AZW3 ---------- */
function palmdoc(d) {
  const out = new Uint8Array(d.length * 8 + 16); let o = 0, i = 0;
  while (i < d.length) {
    const c = d[i++];
    if (c >= 1 && c <= 8) { for (let k = 0; k < c && i < d.length; k++) out[o++] = d[i++]; }
    else if (c < 0x80) out[o++] = c;
    else if (c >= 0xC0) { out[o++] = 0x20; out[o++] = c ^ 0x80; }
    else { if (i >= d.length) break; const pair = (c << 8) | d[i++]; const dist = (pair >> 3) & 0x7FF, len = (pair & 7) + 3; for (let k = 0; k < len; k++) { out[o] = out[o - dist]; o++; } }
  }
  return out.subarray(0, o);
}
function trailingSize(d, flags) {
  let size = 0, f = flags >> 1;
  while (f) {
    if (f & 1) { let num = 0; const end = d.length - size; for (let j = Math.max(0, end - 4); j < end; j++) { const v = d[j]; if (v & 0x80) num = 0; num = (num << 7) | (v & 0x7f); } size += num; }
    f >>= 1;
  }
  if (flags & 1) size += (d[d.length - size - 1] & 3) + 1;
  return size;
}
function mobiHeader(dv, o) {
  const str = (a, n) => { let s = ''; for (let k = 0; k < n; k++) s += String.fromCharCode(dv.getUint8(a + k)); return s; };
  const h = { compression: dv.getUint16(o), textLength: dv.getUint32(o + 4), recCount: dv.getUint16(o + 8), encryption: dv.getUint16(o + 12), magic: str(o + 16, 4) };
  if (h.magic !== 'MOBI') return h;
  h.len = dv.getUint32(o + 20); h.encoding = dv.getUint32(o + 28); h.version = dv.getUint32(o + 36);
  h.nameOff = dv.getUint32(o + 84); h.nameLen = dv.getUint32(o + 88); h.firstImg = dv.getUint32(o + 108);
  h.exthFlags = dv.getUint32(o + 128); h.extra = h.len >= 0xE4 ? dv.getUint16(o + 242) : 0;
  h.exth = {};
  if (h.exthFlags & 0x40) {
    let p = o + 16 + h.len;
    if (str(p, 4) === 'EXTH') {
      const cnt = dv.getUint32(p + 8); p += 12;
      for (let k = 0; k < cnt && p < dv.byteLength - 8; k++) {
        const type = dv.getUint32(p), len = dv.getUint32(p + 4);
        const data = new Uint8Array(dv.buffer, dv.byteOffset + p + 8, Math.max(0, len - 8));
        h.exth[type] = data; p += len;
      }
    }
  }
  return h;
}
async function parseMobi(u8, name) {
  await loadLib('purify');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const nrec = dv.getUint16(76);
  const offs = []; for (let i = 0; i < nrec; i++) offs.push(dv.getUint32(78 + i * 8)); offs.push(u8.length);
  const rec = i => u8.subarray(offs[i], offs[i + 1]);
  let hdr = mobiHeader(dv, offs[0]), base = 0;
  if (hdr.magic !== 'MOBI') throw new Error(t('badFile'));
  const u32 = a => a && a.length >= 4 ? (a[0] << 24 | a[1] << 16 | a[2] << 8 | a[3]) >>> 0 : null;
  const exthStr = (h, k) => h.exth[k] ? new TextDecoder(h.encoding === 65001 ? 'utf-8' : 'windows-1252').decode(h.exth[k]) : '';
  const firstHdr = hdr;
  const boundary = u32(hdr.exth[121]);
  if (boundary != null && boundary !== 0xFFFFFFFF && boundary < nrec) {
    try { const h8 = mobiHeader(dv, offs[boundary]); if (h8.magic === 'MOBI') { hdr = h8; base = boundary; } } catch {}
  }
  if (hdr.encryption) throw new Error(t('drm'));
  if (hdr.compression === 17480) throw new Error(t('huff'));
  const kf8 = hdr.version >= 8;
  const parts = []; let total = 0;
  for (let i = 1; i <= hdr.recCount; i++) {
    let d = rec(base + i); d = d.subarray(0, Math.max(0, d.length - trailingSize(d, hdr.extra)));
    const x = hdr.compression === 2 ? palmdoc(d) : d; parts.push(x); total += x.length;
  }
  let bytes = new Uint8Array(total); { let p = 0; for (const x of parts) { bytes.set(x, p); p += x.length; } }
  bytes = bytes.subarray(0, Math.min(bytes.length, hdr.textLength || bytes.length));
  const enc = hdr.encoding === 65001 ? 'utf-8' : 'windows-1252';
  // filepos anchors (MOBI6)
  if (!kf8) {
    const ascii = new TextDecoder('latin1').decode(bytes);
    const pos = new Set(); const re = /filepos=['"]?0*(\d+)/gi; let m;
    while ((m = re.exec(ascii))) pos.add(+m[1]);
    if (pos.size) {
      const sorted = [...pos].filter(p => p < bytes.length).sort((a, b) => a - b);
      const chunks = []; let last = 0;
      for (const p of sorted) { chunks.push(bytes.subarray(last, p)); chunks.push(new TextEncoder().encode(`<a id="fp${p}"></a>`)); last = p; }
      chunks.push(bytes.subarray(last));
      const len = chunks.reduce((s, c) => s + c.length, 0); const nb = new Uint8Array(len); let q = 0; for (const c of chunks) { nb.set(c, q); q += c.length; } bytes = nb;
    }
  }
  let html = new TextDecoder(enc).decode(bytes);
  // images
  const imgRec = (n) => {
    const tryIdx = [base + hdr.firstImg + n - 1, firstHdr.firstImg + n - 1];
    for (const idx of tryIdx) { if (idx > 0 && idx < nrec) { const d = rec(idx); const m = sniffImg(d); if (m) return { d, m }; } }
    return null;
  };
  const urls = []; const cache = {};
  const imgUrl = n => { if (cache[n] !== undefined) return cache[n]; const r = imgRec(n); const u = r ? URL.createObjectURL(new Blob([r.d], { type: r.m })) : ''; if (u) urls.push(u); return cache[n] = u; };
  html = html
    .replace(/<mbp:pagebreak\s*\/?>/gi, '<hr data-pb="1">')
    .replace(/<\/?mbp:[^>]*>/gi, '')
    .replace(/(<img[^>]*?)\s(?:recindex|hirecindex|lorecindex)=['"]?0*(\d+)['"]?/gi, '$1 data-mobi="$2"')
    .replace(/kindle:embed:([0-9A-V]{4})(\?[^"')\s]*)?/gi, (m, b32) => 'mobi-img:' + parseInt(b32, 32))
    .replace(/\sfilepos=['"]?0*(\d+)['"]?/gi, ' href="#fp$1"')
    .replace(/href=["']kindle:pos:[^"']*["']/gi, '');
  // split into parts: KF8 by <html, MOBI6 by pagebreak
  let pieces = kf8 ? html.split(/(?=<html[\s>])/i) : html.split(/<hr data-pb="1">/i);
  const sections = []; let acc = '';
  const flushSec = () => {
    if (!acc.trim()) return;
    const d = new DOMParser().parseFromString(acc, 'text/html');
    d.querySelectorAll('img').forEach(im => {
      const src = im.getAttribute('src') || '';
      if (src.startsWith('mobi-img:')) im.setAttribute('data-mobi', src.slice(9));
      im.removeAttribute('src');
    });
    d.querySelectorAll('font[size]').forEach(f => { const s = +f.getAttribute('size'); if (s >= 6) f.style.fontWeight = '700'; });
    const sh = sanitize(d.body.innerHTML);
    if (plainLen(sh) > 1 || /<img/i.test(sh)) sections.push({ title: '', html: sh, len: plainLen(sh) });
    acc = '';
  };
  for (const pc of pieces) { acc += pc; if (plainLen(acc) > 1800 || kf8) flushSec(); }
  flushSec();
  if (!sections.length) sections.push({ title: '', html: '<p></p>', len: 1 });
  // anchors across sections
  const anchors = new Map();
  sections.forEach((s, i) => { const re = /id="([^"]+)"/g; let m; while ((m = re.exec(s.html))) if (!anchors.has(m[1])) anchors.set(m[1], i); });
  const toc = [];
  sections.forEach((s, i) => {
    const tt = titleFromHtml(s.html) || (s.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28));
    s.title = tt || t('sectionN', i + 1);
    toc.push({ title: s.title, level: 0, s: i });
  });
  let title = exthStr(firstHdr, 503);
  if (!title && firstHdr.nameLen) title = new TextDecoder(enc).decode(rec(0).subarray(firstHdr.nameOff, firstHdr.nameOff + firstHdr.nameLen));
  const author = exthStr(firstHdr, 100);
  const coverOff = u32(firstHdr.exth[201]);
  return {
    kind: 'flow', title: title || name.replace(/\.[^.]+$/, ''), author, sections, toc, anchors, urls,
    resolve: (art) => { art.querySelectorAll('img[data-mobi]').forEach(im => { const u = imgUrl(+im.dataset.mobi); if (u) im.src = u; }); },
    cover: coverOff != null && coverOff !== 0xFFFFFFFF ? () => imgUrl(coverOff + 1) : null,
  };
}

/* ---------- FB2 ---------- */
async function parseFb2(u8, name) {
  await loadLib('purify');
  const head = new TextDecoder('latin1').decode(u8.subarray(0, 200));
  const m = /encoding=["']([\w-]+)["']/i.exec(head);
  let text; try { text = new TextDecoder(m ? m[1] : 'utf-8').decode(u8); } catch { text = decodeText(u8); }
  const x = parseXml(text);
  const bins = {}; const urls = [];
  for (const b of byTag(x, 'binary')) {
    try { const raw = atob(b.textContent.replace(/\s+/g, '')); const arr = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i); const u = URL.createObjectURL(new Blob([arr], { type: b.getAttribute('content-type') || sniffImg(arr) || 'image/jpeg' })); bins[b.getAttribute('id')] = u; urls.push(u); } catch {}
  }
  const href = el => (el.getAttribute('l:href') || el.getAttribute('xlink:href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '').replace(/^#/, '');
  const conv = (el) => {
    let out = '';
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { out += esc(c.data); continue; }
      if (c.nodeType !== 1) continue;
      const n = c.localName;
      const inner = () => conv(c);
      switch (n) {
        case 'p': out += `<p>${inner()}</p>`; break;
        case 'title': out += `<h2>${Array.from(c.children).map(p => conv(p)).join(' ') || inner()}</h2>`; break;
        case 'subtitle': out += `<p class="subtitle"><b>${inner()}</b></p>`; break;
        case 'emphasis': out += `<em>${inner()}</em>`; break;
        case 'strong': out += `<strong>${inner()}</strong>`; break;
        case 'strikethrough': out += `<s>${inner()}</s>`; break;
        case 'sup': case 'sub': case 'code': out += `<${n}>${inner()}</${n}>`; break;
        case 'empty-line': out += '<br>'; break;
        case 'epigraph': out += `<blockquote class="epigraph">${inner()}</blockquote>`; break;
        case 'cite': out += `<blockquote>${inner()}</blockquote>`; break;
        case 'poem': out += `<div class="poem">${inner()}</div>`; break;
        case 'stanza': out += `<p class="stanza">${Array.from(c.children).map(v => conv(v)).join('<br>')}</p>`; break;
        case 'v': out += inner(); break;
        case 'text-author': out += `<p style="text-align:right"><i>${inner()}</i></p>`; break;
        case 'image': { const id = href(c); out += bins[id] ? `<p><img data-blob="${bins[id]}" alt=""></p>` : ''; break; }
        case 'a': { const h2 = href(c); out += h2 && !/^https?:/.test(h2) ? `<a href="#${esc(h2)}">${inner()}</a>` : inner(); break; }
        case 'section': out += `<div${c.getAttribute('id') ? ` id="${esc(c.getAttribute('id'))}"` : ''}>${inner()}</div>`; break;
        case 'table': out += `<table>${inner()}</table>`; break;
        case 'tr': case 'td': case 'th': out += `<${n}>${inner()}</${n}>`; break;
        default: out += inner();
      }
    }
    return out;
  };
  const ti = firstTag(x, 'title-info');
  const title = (ti && firstTag(ti, 'book-title') ? firstTag(ti, 'book-title').textContent.trim() : '') || name.replace(/\.[^.]+$/, '');
  const authEl = ti && firstTag(ti, 'author');
  const author = authEl ? ['first-name', 'middle-name', 'last-name'].map(k => (firstTag(authEl, k) || {}).textContent || '').join(' ').replace(/\s+/g, ' ').trim() : '';
  const bodies = byTag(x, 'body');
  const sections = [];
  for (const body of bodies) {
    const notes = body.getAttribute('name') === 'notes';
    const top = Array.from(body.children).filter(c => c.localName === 'section');
    const lead = Array.from(body.children).filter(c => c.localName !== 'section');
    if (lead.length && !notes) { const html = lead.map(c => conv({ childNodes: [c] })).join(''); if (html.trim()) sections.push({ title: title, html }); }
    if (notes) { sections.push({ title: t('notes'), html: conv(body) }); continue; }
    for (const s of top) { const tt = firstTag(s, 'title'); sections.push({ title: tt ? tt.textContent.trim().replace(/\s+/g, ' ') : '', html: `<div${s.getAttribute('id') ? ` id="${esc(s.getAttribute('id'))}"` : ''}>${conv(s)}</div>` }); }
  }
  sections.forEach((s, i) => { s.html = sanitize(s.html); s.len = plainLen(s.html); if (!s.title) s.title = t('sectionN', i + 1); });
  const anchors = new Map(); sections.forEach((s, i) => { const re = /id="([^"]+)"/g; let m; while ((m = re.exec(s.html))) if (!anchors.has(m[1])) anchors.set(m[1], i); });
  const coverEl = ti && firstTag(ti, 'coverpage');
  const coverId = coverEl && firstTag(coverEl, 'image') ? href(firstTag(coverEl, 'image')) : null;
  return { kind: 'flow', title, author, sections, toc: sections.map((s, i) => ({ title: s.title, level: 0, s: i })), anchors, urls,
    resolve: art => art.querySelectorAll('img[data-blob]').forEach(im => im.src = im.dataset.blob),
    cover: coverId && bins[coverId] ? () => bins[coverId] : null };
}

/* ---------- Spreadsheets ---------- */
async function parseSheet(input, name, isText) {
  await loadLib('xlsx');
  const MAXR = 5000;
  const wb = isText ? XLSX.read(input, { type: 'string', sheetRows: MAXR + 1, raw: false }) : XLSX.read(input, { type: 'array', sheetRows: MAXR + 1, cellDates: true, dense: false });
  const colName = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const sections = wb.SheetNames.map(sn => {
    const ws = wb.Sheets[sn];
    if (!ws || !ws['!ref']) return { title: sn, html: `<p class="note">${esc(t('emptySheet'))}</p>`, len: 1 };
    const rg = XLSX.utils.decode_range(ws['!ref']);
    const cols = Math.min(rg.e.c - rg.s.c + 1, 300);
    let tbl = XLSX.utils.sheet_to_html(ws, { header: '', footer: '', editable: false });
    tbl = tbl.replace(/^[\s\S]*?<table/i, '<table').replace(/<\/table>[\s\S]*$/i, '</table>');
    let head = '<thead><tr>'; for (let c = 0; c < cols; c++) head += `<th data-c="${colName(rg.s.c + c)}"></th>`; head += '</tr></thead>';
    tbl = tbl.replace(/<table[^>]*>/i, m => m + head + '<tbody>').replace(/<\/table>/i, '</tbody></table>');
    tbl = tbl.replace(/\s(id|data-t|data-v|data-z)="[^"]*"/g, '');
    const truncated = rg.e.r - rg.s.r + 1 > MAXR ? `<p class="note">${esc(t('sheetTrunc', MAXR))}</p>` : '';
    return { title: sn, html: tbl + truncated, len: plainLen(tbl) };
  });
  return { kind: 'flow', title: name.replace(/\.[^.]+$/, ''), sections, toc: sections.map((s, i) => ({ title: s.title, level: 0, s: i })), fixed: true, fixedClass: 'sheet', tabs: sections.length > 1 };
}

/* ---------- PPTX ---------- */
async function parsePptx(u8, name) {
  await Promise.all([loadLib('jszip'), loadLib('purify')]);
  const zip = await JSZip.loadAsync(u8);
  const read = async p => { const f = zip.file(p); return f ? f.async('string') : null; };
  const relsOf = async (p) => {
    const rp = dirOf(p) + '_rels/' + p.split('/').pop() + '.rels';
    const x = await read(rp); const map = {};
    if (x) for (const r of byTag(parseXml(x), 'Relationship')) map[r.getAttribute('Id')] = { target: r.getAttribute('TargetMode') === 'External' ? r.getAttribute('Target') : resolvePath(dirOf(p), r.getAttribute('Target')), type: r.getAttribute('Type') };
    return map;
  };
  const pres = parseXml(await read('ppt/presentation.xml'));
  const presRels = await relsOf('ppt/presentation.xml');
  const sz = firstTag(pres, 'sldSz');
  const W = sz ? +sz.getAttribute('cx') : 12192000, H = sz ? +sz.getAttribute('cy') : 6858000;
  const slidePaths = byTag(pres, 'sldId').map(s => presRels[s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')]).filter(Boolean).map(r => r.target);
  const ptW = W / 12700;
  const urls = []; const media = {};
  const mediaUrl = async p => { if (media[p] !== undefined) return media[p]; const f = zip.file(p); if (!f || /\.(emf|wmf|tiff?)$/i.test(p)) return media[p] = null; const d = await f.async('uint8array'); const u = URL.createObjectURL(new Blob([d], { type: sniffImg(d) || mimeOf(p) })); urls.push(u); return media[p] = u; };
  const xmlCache = {};
  const getXml = async p => xmlCache[p] ||= (async () => { const s = await read(p); return s ? parseXml(s) : null; })();
  const xfrmOf = el => { const x = Array.from(el.children).find(c => c.localName === 'spPr' || c.localName === 'grpSpPr' || c.localName === 'xfrm'); const xf = x ? (x.localName === 'xfrm' ? x : firstTag(x, 'xfrm')) : null; if (!xf) return null; const off = firstTag(xf, 'off'), ext = firstTag(xf, 'ext'); if (!off || !ext) return null; return { x: +off.getAttribute('x'), y: +off.getAttribute('y'), w: +ext.getAttribute('cx'), h: +ext.getAttribute('cy'), chOff: firstTag(xf, 'chOff'), chExt: firstTag(xf, 'chExt') }; };
  const phOf = sp => { const ph = firstTag(sp, 'ph'); return ph ? { type: ph.getAttribute('type') || 'body', idx: ph.getAttribute('idx') } : null; };
  async function phXfrm(layoutPath, ph) {
    const lookIn = async p => { const x = p && await getXml(p); if (!x) return null; for (const sp of byTag(x, 'sp')) { const q = phOf(sp); if (!q) continue; if ((ph.idx && q.idx === ph.idx) || (!ph.idx && q.type === ph.type) || (q.type === ph.type && ['title', 'ctrTitle'].includes(ph.type))) { const xf = xfrmOf(sp); if (xf) return xf; } } return null; };
    let xf = await lookIn(layoutPath);
    if (!xf && layoutPath) { const lr = await relsOf(layoutPath); const m = Object.values(lr).find(r => /slideMaster$/.test(r.type)); if (m) { xf = await lookIn(m.target); if (!xf) { const x = await getXml(m.target); if (x) for (const sp of byTag(x, 'sp')) { const q = phOf(sp); if (q && (q.type === ph.type || (ph.type === 'ctrTitle' && q.type === 'title') || (ph.type === 'subTitle' && q.type === 'body'))) { xf = xfrmOf(sp); if (xf) break; } } } } }
    return xf;
  }
  const color = el => { const c = el && firstTag(el, 'srgbClr'); return c ? '#' + c.getAttribute('val') : null; };
  function runsHtml(p, defSz) {
    let out = '';
    for (const r of p.children) {
      if (r.localName === 'br') { out += '<br>'; continue; }
      if (r.localName !== 'r' && r.localName !== 'fld') continue;
      const tt = firstTag(r, 't'); if (!tt) continue;
      const pr = firstTag(r, 'rPr'); let txt = esc(tt.textContent); const st = [];
      if (pr) {
        if (pr.getAttribute('sz')) st.push(`font-size:${(+pr.getAttribute('sz') / 100 / ptW * 100).toFixed(3)}cqw`);
        const fill = Array.from(pr.children).find(c => c.localName === 'solidFill'); const col = color(fill); if (col) st.push('color:' + col);
        if (pr.getAttribute('b') === '1') txt = `<b>${txt}</b>`; if (pr.getAttribute('i') === '1') txt = `<i>${txt}</i>`; if (pr.getAttribute('u') && pr.getAttribute('u') !== 'none') txt = `<u>${txt}</u>`;
      }
      out += st.length ? `<span style="${st.join(';')}">${txt}</span>` : txt;
    }
    return out;
  }
  function textBody(tx, ph) {
    if (!tx) return '';
    const bodyPr = firstTag(tx, 'bodyPr'); const fsc = bodyPr && firstTag(bodyPr, 'normAutofit') ? +(firstTag(bodyPr, 'normAutofit').getAttribute('fontScale') || 100000) / 100000 : 1;
    const isTitle = ph && (ph.type === 'title' || ph.type === 'ctrTitle');
    const def = (isTitle ? 40 : ph && ph.type === 'subTitle' ? 24 : ph ? 22 : 18) * fsc;
    const bullets = ph && ph.type === 'body';
    let html = '';
    for (const p of byTag(tx, 'p')) {
      const pPr = firstTag(p, 'pPr'); const algn = pPr && pPr.getAttribute('algn'); const lvl = pPr ? +(pPr.getAttribute('lvl') || 0) : 0;
      const inner = runsHtml(p, def);
      const noBu = pPr && firstTag(pPr, 'buNone');
      const bu = (bullets && !noBu && inner) || (pPr && firstTag(pPr, 'buChar'));
      const st = [`font-size:${(def / ptW * 100).toFixed(3)}cqw`];
      if (algn) st.push('text-align:' + ({ ctr: 'center', r: 'right', just: 'justify' }[algn] || 'left'));
      if (lvl) st.push(`margin-left:${lvl * 1.6}em`);
      if (isTitle) st.push('font-weight:600');
      html += `<p style="${st.join(';')}">${bu ? '• ' : ''}${inner || '&nbsp;'}</p>`;
    }
    return html;
  }
  const sections = []; const toc = []; let allHtml = '';
  for (const [k, sp] of slidePaths.entries()) {
    const x = await getXml(sp); if (!x) continue;
    const rels = await relsOf(sp);
    const layout = Object.values(rels).find(r => /slideLayout$/.test(r.type));
    const notesRel = Object.values(rels).find(r => /notesSlide$/.test(r.type));
    const bg = firstTag(x, 'bg'); const bgc = bg && color(firstTag(bg, 'solidFill'));
    let shapes = '', slideTitle = '', autoY = 0.08;
    const pct = (v, tot) => (v / tot * 100).toFixed(3) + '%';
    async function walk(tree, tf) {
      for (const el of tree.children) {
        const n = el.localName;
        if (n === 'grpSp') {
          const g = xfrmOf(el);
          let sub = tf;
          if (g && g.chOff && g.chExt) {
            const cx = +g.chOff.getAttribute('x'), cy = +g.chOff.getAttribute('y'), cw = +g.chExt.getAttribute('cx') || 1, ch = +g.chExt.getAttribute('cy') || 1;
            const outer = tf(g.x, g.y, g.w, g.h);
            sub = (x0, y0, w0, h0) => ({ x: outer.x + (x0 - cx) * outer.w / cw, y: outer.y + (y0 - cy) * outer.h / ch, w: w0 * outer.w / cw, h: h0 * outer.h / ch });
          }
          await walk(el, sub); continue;
        }
        if (!['sp', 'pic', 'graphicFrame', 'cxnSp'].includes(n)) continue;
        const ph = phOf(el);
        let xf = xfrmOf(el);
        if (!xf && ph && layout) xf = await phXfrm(layout.target, ph);
        let box = xf ? tf(xf.x, xf.y, xf.w, xf.h) : null;
        let inner = '';
        if (n === 'sp') {
          const tx = Array.from(el.children).find(c => c.localName === 'txBody');
          inner = textBody(tx, ph);
          if (ph && (ph.type === 'title' || ph.type === 'ctrTitle') && tx) slideTitle = slideTitle || tx.textContent.trim();
          const spPr = Array.from(el.children).find(c => c.localName === 'spPr');
          const fill = spPr && Array.from(spPr.children).find(c => c.localName === 'solidFill');
          const fc = color(fill);
          if (!inner && !fc) continue;
          if (!box) { box = { x: W * 0.06, y: H * autoY, w: W * 0.88, h: H * 0.2 }; autoY += 0.22; }
          const anchor = tx && firstTag(tx, 'bodyPr') && firstTag(tx, 'bodyPr').getAttribute('anchor');
          shapes += `<div class="sp" style="left:${pct(box.x, W)};top:${pct(box.y, H)};width:${pct(box.w, W)};height:${pct(box.h, H)};${fc ? 'background:' + fc + ';' : ''}display:flex;flex-direction:column;justify-content:${anchor === 'ctr' ? 'center' : anchor === 'b' ? 'flex-end' : 'flex-start'};padding:0.6cqw 0.8cqw">${inner}</div>`;
        } else if (n === 'pic') {
          const blip = firstTag(el, 'blip'); const rid = blip && (blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed'));
          const u = rid && rels[rid] ? await mediaUrl(rels[rid].target) : null;
          if (!u || !box) continue;
          shapes += `<div class="sp" style="left:${pct(box.x, W)};top:${pct(box.y, H)};width:${pct(box.w, W)};height:${pct(box.h, H)}"><img data-blob="${u}" alt=""></div>`;
        } else if (n === 'graphicFrame') {
          const tbl = firstTag(el, 'tbl'); if (!tbl || !box) continue;
          let th = '<table>'; for (const tr of byTag(tbl, 'tr')) { th += '<tr>' + Array.from(tr.children).filter(c => c.localName === 'tc').map(tc => `<td>${byTag(tc, 'p').map(p => runsHtml(p, 14)).join('<br>')}</td>`).join('') + '</tr>'; } th += '</table>';
          shapes += `<div class="sp" style="left:${pct(box.x, W)};top:${pct(box.y, H)};width:${pct(box.w, W)};height:auto">${th}</div>`;
        }
      }
    }
    const tree = firstTag(x, 'spTree');
    if (tree) await walk(tree, (a, b, c, d) => ({ x: a, y: b, w: c, h: d }));
    let notes = '';
    if (notesRel) { const nx = await getXml(notesRel.target); if (nx) { const txt = byTag(nx, 'sp').filter(s => { const q = phOf(s); return q && q.type === 'body'; }).map(s => byTag(s, 'p').map(p => p.textContent).join('\n')).join('\n').trim(); if (txt) notes = `<div class="slide-notes">${esc(txt)}</div>`; } }
    const id = 'slide-' + (k + 1);
    allHtml += `<div class="slide" id="${id}" style="aspect-ratio:${W}/${H};${bgc ? 'background:' + bgc : ''}">${shapes}</div>${notes}<p class="slide-no"><span>${k + 1} / ${slidePaths.length}</span></p>`;
    toc.push({ title: `${k + 1}. ${(slideTitle || t('slideN', k + 1)).replace(/\s+/g, ' ').slice(0, 60)}`, level: 0, s: 0, anchor: id });
  }
  const html = sanitize(allHtml, true);
  return { kind: 'flow', title: name.replace(/\.[^.]+$/, ''), sections: [{ title: name, html, len: plainLen(html) }], toc, fixed: true, fixedClass: 'slides', urls,
    resolve: art => art.querySelectorAll('img[data-blob]').forEach(im => im.src = im.dataset.blob) };
}

/* ---------- images / comics ---------- */
async function parseImage(u8, name) {
  const url = URL.createObjectURL(new Blob([u8], { type: mimeOf(name) }));
  return { kind: 'gallery', title: name, items: [{ name, url }], urls: [url], single: true };
}
async function parseCbz(u8, name) {
  await loadLib('jszip');
  const zip = await JSZip.loadAsync(u8);
  const files = Object.keys(zip.files).filter(f => !zip.files[f].dir && IMG_EXT[extOf(f)] && !/(^|\/)(__MACOSX|\.)/.test(f)).sort(naturalSort);
  if (!files.length) throw new Error(t('noImages'));
  const items = []; const urls = [];
  for (const f of files) { const d = await zip.file(f).async('uint8array'); const u = URL.createObjectURL(new Blob([d], { type: mimeOf(f) })); urls.push(u); items.push({ name: f.split('/').pop(), url: u }); }
  return { kind: 'gallery', title: name.replace(/\.[^.]+$/, ''), items, urls, comic: true };
}

/* ---------- PDF ---------- */
async function parsePdf(u8, name) {
  await loadLib('pdf');
  const base = new URL(LIB_SRC.pdf.replace(/(build\/)?pdf\.min\.js$/, ''), location.href).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = base + (base.includes('pdfjs-dist') ? 'build/' : '') + 'pdf.worker.min.js';
  const task = pdfjsLib.getDocument({
    data: u8, isEvalSupported: false,
    cMapUrl: base + 'cmaps/', cMapPacked: true,
    ...(BUILD === 'artifact' ? { useSystemFonts: true } : { standardFontDataUrl: base + 'standard_fonts/' }),
  });
  task.onPassword = (update, reason) => {
    askPassword(reason === 2).then(pw => { if (pw == null) task.destroy(); else update(pw); });
  };
  const pdf = await task.promise;
  let title = name.replace(/\.[^.]+$/, ''), author = '';
  try { const md = await pdf.getMetadata(); if (md.info && md.info.Title && md.info.Title.trim().length > 1 && !/^untitled|microsoft word/i.test(md.info.Title)) title = md.info.Title.trim(); if (md.info && md.info.Author) author = md.info.Author; } catch {}
  const toc = [];
  try {
    const ol = await pdf.getOutline();
    const walk = async (items, lv) => { for (const it of items || []) { if (toc.length > 3000) return; toc.push({ title: (it.title || '').trim(), level: lv, dest: it.dest, url: it.url }); await walk(it.items, lv + 1); } };
    await walk(ol, 0);
    await Promise.all(toc.map(async x => { x.p = await resolvePdfDest(pdf, x.dest); }));
  } catch (e) { console.warn('outline', e); }
  return { kind: 'pdf', title, author, pdf, toc: toc.filter(x => x.title) };
}
async function resolvePdfDest(pdf, dest) {
  try {
    if (typeof dest === 'string') dest = await pdf.getDestination(dest);
    if (!Array.isArray(dest)) return null;
    const ref = dest[0];
    if (ref && typeof ref === 'object') return await pdf.getPageIndex(ref);
    if (Number.isInteger(ref)) return ref;
  } catch {}
  return null;
}

/* ---------- dispatcher ---------- */
async function parseFile(u8, name, fmt, enc) {
  const base = name.replace(/\.[^.]+$/, '');
  switch (fmt) {
    case 'pdf': return parsePdf(u8, name);
    case 'epub': return parseEpub(u8, name);
    case 'mobi': return parseMobi(u8, name);
    case 'fb2': return parseFb2(u8, name);
    case 'docx': return parseDocx(u8, name);
    case 'odt': return parseOdt(u8, name);
    case 'rtf': return parasToDoc(rtfToParas(u8), base);
    case 'txt': return textToDoc(decodeText(u8, enc), base);
    case 'md': return parseMd(decodeText(u8, enc), base);
    case 'html': return parseHtmlDoc(decodeText(u8, enc), base);
    case 'code': case 'binary-text': return parseCode(decodeText(u8, enc), name);
    case 'sheet': return parseSheet(u8, name, false);
    case 'csv': return parseSheet(decodeText(u8, enc), name, true);
    case 'pptx': return parsePptx(u8, name);
    case 'image': return parseImage(u8, name);
    case 'cbz': return parseCbz(u8, name);
    case 'legacy': throw new Error(t('legacy'));
    case 'rar': throw new Error(t('rar'));
    case 'tiff': case 'djvu': throw new Error(t('unsupportedFmt', extOf(name).toUpperCase()));
    case 'zip': throw new Error(t('zipUnknown'));
    default: throw new Error(t('unsupported'));
  }
}
