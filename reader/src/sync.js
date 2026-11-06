/* ===================== sync.js — GitHub private-repo sync ===================== */
/* Layout of the private repo:
   library.json            { v:1, books:{ id: {id,name,title,author,fmt,size,added,last,progress,cover,path,sha} | {id,deleted:ts} } }
   books/<id><.ext>        raw book files (immutable)
   state/<id>.json         { pos, posT, bm[], notes[], del{}, ms, enc, alt }
   settings.json           { t, set, fonts[] }
   fonts/<fid><.ext>       uploaded font files                                                         */
function b64FromBytes(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
const b64FromText = s => b64FromBytes(new TextEncoder().encode(s));
function textFromB64(b) { const bin = atob(b.replace(/\s+/g, '')); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new TextDecoder().decode(u8); }
function blobToB64(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result.slice(fr.result.indexOf(',') + 1)); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); }); }
const extWithDot = name => { const e = extOf(name); return e ? '.' + e : ''; };
const MAX_UP = 95 * 1024 * 1024;

const Sync = {
  cfg: null,
  q: Promise.resolve(), cache: {}, busy: 0, lastOk: 0, err: '', timers: {},
  init() { this.cfg = LS.get('gh', null); this.lastOk = LS.get('ghLast', 0); },
  available() { return BUILD !== 'artifact'; },
  on() { return this.available() && !!(this.cfg && this.cfg.repo && this.cfg.token); },
  /* ---------- low level ---------- */
  url(path) { return `https://api.github.com/repos/${this.cfg.repo}/${path}`; },
  enc(p) { return p.split('/').map(encodeURIComponent).join('/'); },
  async api(path, { method = 'GET', body, raw, signal } = {}) {
    const r = await fetch(path.startsWith('https:') ? path : this.url(path), {
      method, body, signal, cache: 'no-cache',
      headers: { Authorization: 'Bearer ' + this.cfg.token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    });
    return r;
  },
  async fail(r) {
    let msg = ''; try { msg = (await r.json()).message || ''; } catch {}
    const e = new Error(r.status === 401 ? t('ghBadToken') : r.status === 403 ? t('ghForbidden', msg) : r.status === 404 ? t('ghNotFound') : `GitHub ${r.status} ${msg}`);
    e.status = r.status; return e;
  },
  write(fn) { const p = this.q.then(fn, fn); this.q = p.catch(() => {}); return p; },
  async getJson(path) {
    const r = await this.api('contents/' + this.enc(path));
    if (r.status === 404) { this.cache[path] = { data: null, sha: null }; return this.cache[path]; }
    if (!r.ok) throw await this.fail(r);
    const j = await r.json();
    let text;
    if (j.content && j.encoding === 'base64') text = textFromB64(j.content);
    else { const r2 = await this.api('contents/' + this.enc(path), { raw: true }); if (!r2.ok) throw await this.fail(r2); text = await r2.text(); }
    let data = null; try { data = JSON.parse(text); } catch {}
    return this.cache[path] = { data, sha: j.sha };
  },
  async putRaw(path, b64, sha, message) {
    const r = await this.api('contents/' + this.enc(path), { method: 'PUT', body: JSON.stringify({ message, content: b64, ...(sha ? { sha } : {}) }) });
    if (r.status === 409 || r.status === 422) { const e = new Error('conflict'); e.conflict = true; e.status = r.status; throw e; }
    if (!r.ok) throw await this.fail(r);
    return (await r.json()).content.sha;
  },
  /** read-merge-write with retry on conflict; merge(remoteData) returns next data or null for "no change" */
  updateJson(path, merge, message) {
    return this.write(async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const cur = attempt === 0 && this.cache[path] ? this.cache[path] : await this.getJson(path);
        const next = merge(cur.data);
        if (next == null) return cur.data;
        try { const sha = await this.putRaw(path, b64FromText(JSON.stringify(next, null, 1)), cur.sha, message); this.cache[path] = { data: next, sha }; return next; }
        catch (e) { if (!e.conflict) throw e; delete this.cache[path]; await sleep(300 * (attempt + 1)); }
      }
      throw new Error(t('ghConflict'));
    });
  },
  async run(label, fn) {
    if (!this.on()) return null;
    this.busy++; this.status();
    try { const r = await fn(); this.err = ''; this.lastOk = Date.now(); LS.set('ghLast', this.lastOk); return r; }
    catch (e) { console.warn('sync', label, e); this.err = e.message || String(e); return null; }
    finally { this.busy--; this.status(); }
  },
  later(key, ms, fn) { clearTimeout(this.timers[key]); this.timers[key] = setTimeout(() => { delete this.timers[key]; fn(); }, ms); },
  /* ---------- status UI ---------- */
  status() {
    const el = $('#sync-status'); if (!el) return;
    el.innerHTML = '';
    if (!this.available()) return;
    if (!this.on()) { el.append(h('button', { class: 'chip', onclick: () => this.setup() }, t('ghConnect'))); return; }
    const txt = this.busy ? t('ghSyncing') : this.err ? t('ghError', this.err) : this.lastOk ? t('ghSynced', this.cfg.repo, relTime(this.lastOk)) : t('ghConnected', this.cfg.repo);
    el.append(h('span', { class: this.err ? 'err' : '', text: txt }), h('button', { class: 'chip', onclick: () => this.syncAll(true) }, t('ghSyncNow')), h('button', { class: 'chip', onclick: () => this.setup() }, t('ghSettings')));
  },
  /* ---------- setup ---------- */
  async setup() {
    closePops();
    if (!this.available()) {
      return modal({ title: t('ghTitle'), body: h('div', {}, h('p', { text: t('ghArtifactOnly') }), h('p', {}, h('a', { href: PAGES_URL, target: '_blank', rel: 'noopener' }, PAGES_URL))) });
    }
    const repo = h('input', { type: 'text', placeholder: 'owner/moyue-library', value: this.cfg ? this.cfg.repo : '', autocomplete: 'off', spellcheck: 'false' });
    const tok = h('input', { type: 'password', placeholder: 'github_pat_…', value: this.cfg ? this.cfg.token : '', autocomplete: 'off' });
    const msg = h('p', { class: 'ghmsg' });
    const steps = h('ol', { class: 'ghsteps' },
      h('li', {}, t('ghStep1a'), h('a', { href: 'https://github.com/new', target: '_blank', rel: 'noopener' }, 'github.com/new'), t('ghStep1b')),
      h('li', {}, t('ghStep2a'), h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener' }, t('ghStep2link')), t('ghStep2b')),
      h('li', { text: t('ghStep3') }));
    const body = h('div', {}, steps, h('label', { class: 'fl', text: t('ghRepo') }), repo, h('label', { class: 'fl', text: 'Token' }), tok, msg, h('p', { class: 'ghnote', text: t('ghTokenNote') }));
    const buttons = [{ label: t('cancel'), value: null }];
    if (this.on()) buttons.push({ label: t('ghDisconnect'), onClick: () => { this.cfg = null; LS.del('gh'); this.cache = {}; this.status(); Shelf.render(); toast(t('ghDisconnected')); return true; } });
    buttons.push({ label: t('ghConnectSync'), primary: true, onClick: async () => {
      const cfg = { repo: repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, ''), token: tok.value.trim() };
      if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo) || !cfg.token) { msg.textContent = t('ghFillBoth'); return false; }
      msg.textContent = t('ghChecking');
      const prev = this.cfg; this.cfg = cfg;
      try {
        const r = await this.api(`https://api.github.com/repos/${cfg.repo}`);
        if (!r.ok) throw await this.fail(r);
        const j = await r.json();
        if (!j.private) { this.cfg = prev; msg.textContent = t('ghPublic'); return false; }
        if (j.permissions && j.permissions.push === false) { this.cfg = prev; msg.textContent = t('ghNoPush'); return false; }
      } catch (e) { this.cfg = prev; msg.textContent = e.message; return false; }
      LS.set('gh', cfg); this.cache = {}; this.err = '';
      toast(t('ghConnectedToast', cfg.repo));
      this.syncAll(true);
      return true;
    } });
    return modal({ title: t('ghTitle'), body, buttons, onOpen: () => (repo.value ? tok : repo).focus() });
  },
  /* ---------- full sync ---------- */
  async syncAll(manual) {
    if (!this.on()) return;
    await this.run('all', async () => {
      await this.pullSettings();
      await this.syncLibrary();
      await this.uploadMissing();
      if (S.id && S.st) await this.pushState(S.id);
    });
    if (!S.doc) Shelf.render();
    if (manual && !this.err) toast(t('ghDone'));
  },
  /* ---------- library ---------- */
  libEntry(b) { const { id, name, title, author, fmt, size, added, last, progress, cover, path, sha } = b; return { id, name, title, author, fmt, size, added, last, progress, cover, path, sha }; },
  mergeLib(remote, local, deletes) {
    const books = Object.assign({}, remote && remote.books);
    let changed = !remote;
    for (const [id, ts] of Object.entries(deletes)) { const rb = books[id]; if (!rb || (!rb.deleted && (rb.last || 0) <= ts)) { books[id] = { id, deleted: ts }; changed = true; } }
    for (const b of local) {
      if (deletes[b.id]) continue;
      const rb = books[b.id];
      if (rb && rb.deleted && rb.deleted >= (b.last || 0)) continue;
      const e = this.libEntry(b);
      if (!rb || rb.deleted || (e.last || 0) > (rb.last || 0) || (e.path && !rb.path) || (e.cover && !rb.cover)) {
        books[b.id] = Object.assign({}, rb && !rb.deleted ? rb : {}, e, { path: e.path || (rb && rb.path), sha: e.sha || (rb && rb.sha), cover: e.cover || (rb && rb.cover) });
        if (JSON.stringify(books[b.id]) !== JSON.stringify(rb)) changed = true;
      }
    }
    return changed ? { v: 1, books } : null;
  },
  async syncLibrary() {
    const { data } = await this.getJson('library.json');
    const remote = (data && data.books) || {};
    // remote → local
    const local = await IDB.all('books').catch(() => []);
    const map = new Map(local.map(b => [b.id, b]));
    const deletes = LS.get('ghDeleted', {});
    for (const [id, rb] of Object.entries(remote)) {
      const lb = map.get(id);
      if (rb.deleted) { if (lb && (lb.last || 0) <= rb.deleted) { await IDB.del('books', id).catch(() => {}); await IDB.del('blobs', id).catch(() => {}); map.delete(id); } continue; }
      if (deletes[id]) continue;
      if (!lb) { const nb = Object.assign({}, rb, { local: false }); await IDB.put('books', nb).catch(() => {}); map.set(id, nb); }
      else if ((rb.last || 0) > (lb.last || 0) || (rb.path && !lb.path) || (rb.cover && !lb.cover)) { const nb = Object.assign({}, lb, rb, { local: lb.local, cover: lb.cover || rb.cover }); await IDB.put('books', nb).catch(() => {}); map.set(id, nb); if (Shelf.meta && Shelf.meta.id === id) Shelf.meta = nb; }
    }
    // local → remote
    await this.updateJson('library.json', d => this.mergeLib(d, [...map.values()], deletes), 'moyue: update library');
    const done = {}; for (const id of Object.keys(deletes)) done[id] = 1;
    if (Object.keys(done).length) { const cur = LS.get('ghDeleted', {}); for (const id in done) delete cur[id]; LS.set('ghDeleted', cur); }
  },
  pushLibrarySoon() { if (this.on()) this.later('lib', 30000, () => this.run('lib', () => this.syncLibrary())); },
  async uploadBook(meta, file) {
    if (!this.on() || meta.path) return;
    if (file.size > MAX_UP) { toast(t('ghTooBig', meta.name), 3500); return; }
    const path = 'books/' + meta.id + extWithDot(meta.name);
    await this.run('upload', async () => {
      const b64 = await blobToB64(file);
      const sha = await this.write(async () => {
        try { return await this.putRaw(path, b64, null, `moyue: add ${meta.name}`); }
        catch (e) { if (e.conflict) { const r = await this.api('contents/' + this.enc(path)); if (r.ok) return (await r.json()).sha; } throw e; }
      });
      meta.path = path; meta.sha = sha; meta.local = true;
      await IDB.put('books', meta).catch(() => {});
      await this.syncLibrary();
    });
  },
  async uploadMissing() {
    const books = await IDB.all('books').catch(() => []);
    const todo = books.filter(b => !b.path && b.local !== false);
    let k = 0;
    for (const b of todo) {
      const rec = await IDB.get('blobs', b.id).catch(() => null); if (!rec) continue;
      k++; toast(t('ghUploading', k, todo.length, b.title || b.name), 60000);
      await this.uploadBook(b, rec.blob);
    }
    if (k) toast(t('ghUploaded', k));
  },
  async downloadBook(meta) {
    const r = await this.api('contents/' + this.enc(meta.path), { raw: true });
    if (!r.ok) throw await this.fail(r);
    const blob = await r.blob();
    const file = new File([blob], meta.name, { lastModified: meta.added || Date.now() });
    try { await IDB.put('blobs', { id: meta.id, blob: file }); meta.local = true; await IDB.put('books', meta); } catch {}
    return file;
  },
  async removeBook(meta) {
    if (!this.on()) return;
    const del = LS.get('ghDeleted', {}); del[meta.id] = Date.now(); LS.set('ghDeleted', del);
    await this.run('remove', async () => {
      if (meta.path) await this.write(async () => {
        let sha = meta.sha;
        if (!sha) { const r = await this.api('contents/' + this.enc(meta.path)); if (r.ok) sha = (await r.json()).sha; }
        if (sha) { const r = await this.api('contents/' + this.enc(meta.path), { method: 'DELETE', body: JSON.stringify({ message: `moyue: remove ${meta.name}`, sha }) }); if (!r.ok && r.status !== 404) throw await this.fail(r); }
      });
      await this.updateJson('state/' + meta.id + '.json', d => d ? { removed: Date.now() } : null, 'moyue: remove state').catch(() => {});
      await this.syncLibrary();
    });
  },
  /* ---------- per-book state ---------- */
  mergeState(a, b) {
    a = a || {}; b = b || {};
    const out = Object.assign({}, b, a);
    const ta = a.posT || 0, tb = b.posT || 0;
    if (tb > ta) { out.pos = b.pos; out.posT = tb; } else { out.pos = a.pos; out.posT = ta; }
    out.ms = Math.max(a.ms || 0, b.ms || 0);
    out.del = Object.assign({}, b.del, a.del);
    const mergeList = (x = [], y = []) => { const m = new Map(); for (const it of [...y, ...x]) { const o = m.get(it.id); if (!o || (it.u || it.t || 0) >= (o.u || o.t || 0)) m.set(it.id, it); } return [...m.values()].filter(it => !out.del[it.id]); };
    out.notes = mergeList(a.notes, b.notes); out.bm = mergeList(a.bm, b.bm);
    delete out.removed;
    return out;
  },
  stripState(st) { const { pos, posT, bm, notes, del, ms, enc, alt } = st; return { pos, posT, bm, notes, del, ms, enc, alt }; },
  async pullState(id, timeoutMs = 4000) {
    if (!this.on()) return null;
    const p = this.run('pullState', async () => { const { data } = await this.getJson('state/' + id + '.json'); return data; });
    const remote = await Promise.race([p, sleep(timeoutMs).then(() => null)]);
    return remote && !remote.removed ? remote : null;
  },
  async pushState(id) {
    if (!this.on()) return;
    const st = id === S.id ? S.st : LS.get('doc.' + id, null);
    if (!st) return;
    const local = this.stripState(st);
    const next = await this.updateJson('state/' + id + '.json', d => {
      const m = this.stripState(this.mergeState(local, d && !d.removed ? d : null));
      return d && JSON.stringify(this.stripState(d)) === JSON.stringify(m) ? null : m;
    }, 'moyue: reading state');
    if (next && id === S.id && S.st) {
      const before = JSON.stringify([S.st.notes, S.st.bm]);
      Object.assign(S.st, this.mergeState(S.st, next));
      LS.set('doc.' + id, S.st);
      if (JSON.stringify([S.st.notes, S.st.bm]) !== before) { Notes.refresh(); UI.syncBookmark(); if (Side.tab === 'bm') Side.render(); }
    }
  },
  stateDirty(id) { if (this.on() && id) this.later('st:' + id, 15000, () => this.run('state', () => this.pushState(id))); },
  flush() {
    if (!this.on()) return;
    for (const k of Object.keys(this.timers)) {
      clearTimeout(this.timers[k]); delete this.timers[k];
      if (k.startsWith('st:')) this.run('state', () => this.pushState(k.slice(3)));
      else if (k === 'lib') this.run('lib', () => this.syncLibrary());
      else if (k === 'set') this.run('set', () => this.pushSettings());
    }
  },
  /* ---------- settings & fonts ---------- */
  settingsDirty() { if (!this.on() || Sync.applying) return; LS.set('setT', Date.now()); this.later('set', 10000, () => this.run('set', () => this.pushSettings())); },
  settingsPayload() { const set = Object.assign({}, S.set); delete set.side; delete set.sideTab; return { t: LS.get('setT', 0), set, fonts: customFonts() }; },
  async pushSettings() {
    const mine = this.settingsPayload();
    await this.updateJson('settings.json', d => (d && (d.t || 0) >= mine.t) ? null : mine, 'moyue: settings');
  },
  async pullSettings() {
    const { data } = await this.getJson('settings.json');
    if (!data) { if (LS.get('setT', 0)) await this.pushSettings(); return; }
    const localT = LS.get('setT', 0);
    // fonts: union
    const fonts = customFonts(); let fch = false;
    for (const f of data.fonts || []) { const i = fonts.findIndex(x => x.id === f.id); if (i < 0) { fonts.push(f); fch = true; } else if (f.path && !fonts[i].path) { fonts[i].path = f.path; fch = true; } }
    if (fch) LS.set('customFonts', fonts);
    if ((data.t || 0) > localT) {
      this.applying = true;
      const keep = { side: S.set.side, sideTab: S.set.sideTab };
      S.set = Object.assign({}, DEF, data.set, keep); saveSet(); LS.set('setT', data.t);
      if (data.set.lang && data.set.lang !== LANG) { LANG = data.set.lang; UI.i18n(); }
      applySettings(); if (S.view === Flow) Flow.relayout(Flow.anchorO);
      this.applying = false;
    } else if (localT > (data.t || 0) || fch) await this.pushSettings();
  },
  async uploadFont(family, data, file) {
    if (!this.on()) return;
    await this.run('font', async () => {
      const list = customFonts(); const f = list.find(x => x.family === family); if (!f || f.path) return;
      if (data.byteLength > MAX_UP) return;
      const path = 'fonts/' + fnv(family) + extWithDot(file.name);
      await this.write(async () => { try { await this.putRaw(path, b64FromBytes(new Uint8Array(data)), null, `moyue: font ${family}`); } catch (e) { if (!e.conflict) throw e; } });
      f.path = path; LS.set('customFonts', list); LS.set('setT', Date.now());
      await this.pushSettings();
    });
  },
  async downloadFont(f) {
    if (!this.on() || !f.path) return null;
    const r = await this.api('contents/' + this.enc(f.path), { raw: true });
    if (!r.ok) return null;
    const data = await r.arrayBuffer();
    try { await IDB.put('fonts', { id: f.family, data }); } catch {}
    return data;
  },
};
function relTime(ts) { const m = Math.round((Date.now() - ts) / 60000); if (m < 1) return t('justNow'); if (m < 60) return t('minsAgo', m); const hh = Math.round(m / 60); if (hh < 24) return t('hrsAgo', hh); return fmtDate(ts); }
