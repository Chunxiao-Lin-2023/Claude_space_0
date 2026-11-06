/* ===================== release.js — desktop downloads, updates, Tauri glue ===================== */
const APP_VERSION = '0.0.0'; // build fills from desktop/src-tauri/tauri.conf.json
const IS_DESKTOP = BUILD === 'desktop';
const RELEASES_API = 'https://api.github.com/repos/Chunxiao-Lin-2023/Claude_space_0/releases?per_page=30';
const RELEASES_PAGE = 'https://github.com/Chunxiao-Lin-2023/Claude_space_0/releases';
function cmpVer(a, b) { const pa = String(a).split('.').map(n => parseInt(n, 10) || 0), pb = String(b).split('.').map(n => parseInt(n, 10) || 0); for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; } return 0; }
function openExternal(url) {
  if (Desktop.on && window.__TAURI__.opener) { window.__TAURI__.opener.openUrl(url).catch(e => toast(String(e))); return; }
  const a = h('a', { href: url, target: '_blank', rel: 'noopener' }); document.body.append(a); a.click(); a.remove();
}
const Release = {
  latest: null, checked: false,
  async fetch() {
    if (BUILD === 'artifact') return null;
    try {
      const r = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-cache' });
      if (!r.ok) return null;
      const rel = (await r.json()).find(x => !x.draft && !x.prerelease && /^reader-v\d/.test(x.tag_name));
      this.checked = true;
      if (!rel) return this.latest = { none: true };
      return this.latest = { version: rel.tag_name.replace(/^reader-v/, ''), url: rel.html_url, date: rel.published_at, assets: (rel.assets || []).map(a => ({ name: a.name, url: a.browser_download_url, size: a.size })) };
    } catch { return null; }
  },
  pick(assets) {
    const find = re => assets.find(a => re.test(a.name));
    return { win: find(/-setup\.exe$/i) || find(/\.exe$/i), msi: find(/\.msi$/i), mac: find(/universal\.dmg$/i) || find(/\.dmg$/i) };
  },
  os() { const ua = navigator.userAgent; return /Macintosh|Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua) ? 'mac' : /Windows/.test(ua) ? 'win' : 'other'; },
  hasUpdate() { return IS_DESKTOP && this.latest && this.latest.version && cmpVer(this.latest.version, APP_VERSION) > 0; },
  label() { return IS_DESKTOP ? (this.hasUpdate() ? t('updAvailShort') : t('checkUpdate')) : t('getDesktop'); },
  button(cls = 'btn') { const b = h('button', { class: cls + (this.hasUpdate() ? ' upd' : ''), onclick: () => this.show() }, icon('download'), this.label()); return b; },
  async show() {
    closePops();
    const body = h('div', { class: 'rel' }, h('p', { class: 'muted', text: t('relLoading') }));
    modal({ title: IS_DESKTOP ? t('checkUpdate') : t('getDesktopTitle'), body, width: '520px' });
    const rel = await this.fetch();
    body.innerHTML = '';
    if (IS_DESKTOP) body.append(h('p', { text: t('curVersion', APP_VERSION) }));
    if (!rel) { body.append(h('p', { text: t('relOffline') }), h('p', {}, h('a', { href: RELEASES_PAGE, target: '_blank', rel: 'noopener' }, t('relAll')))); return; }
    if (rel.none) { body.append(h('p', { text: t('relNone') }), h('p', {}, h('a', { href: RELEASES_PAGE, target: '_blank', rel: 'noopener' }, t('relAll')))); return; }
    if (IS_DESKTOP && !this.hasUpdate()) { body.append(h('p', { class: 'ok', text: t('upToDate') })); return; }
    const p = this.pick(rel.assets), os = this.os();
    const date = rel.date ? new Date(rel.date).toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    body.append(h('p', { text: IS_DESKTOP ? t('newVersion', rel.version, date) : t('latestVersion', rel.version, date) }));
    const mb = a => a && a.size ? ` · ${(a.size / 1048576).toFixed(1)} MB` : '';
    const rows = [['mac', p.mac, t('dlMac')], ['win', p.win, t('dlWin')]].sort((a, b) => (b[0] === os) - (a[0] === os));
    const box = h('div', { class: 'dl' });
    for (const [k, a, label] of rows) {
      if (!a) continue;
      box.append(h('a', { class: 'btn' + (k === os || (os === 'other' && k === 'win') ? ' primary' : ''), href: a.url, target: '_blank', rel: 'noopener' }, icon('download'), h('span', {}, label, h('small', { text: a.name.replace(/^Moyue_/, '') + mb(a) }))));
    }
    if (p.msi) box.append(h('a', { class: 'alt', href: p.msi.url, target: '_blank', rel: 'noopener', text: t('dlMsi') }));
    body.append(box);
    body.append(h('ul', { class: 'notes' }, h('li', { text: t('noteWin') }), h('li', { text: t('noteMac') }), h('li', { text: IS_DESKTOP ? t('noteUpdate') : t('noteDesktop') })));
    body.append(h('p', {}, h('a', { href: rel.url, target: '_blank', rel: 'noopener' }, t('relNotes')), '   ', h('a', { href: RELEASES_PAGE, target: '_blank', rel: 'noopener' }, t('relAll'))));
  },
  async autoCheck() {
    if (!IS_DESKTOP) return;
    if (Date.now() - LS.get('relCheck', 0) < 6 * 3600e3 && !LS.get('relHas', false)) return;
    LS.set('relCheck', Date.now());
    await this.fetch();
    LS.set('relHas', this.hasUpdate());
    if (this.hasUpdate()) { toast(t('updAvail', this.latest.version), 5000); if (!S.doc) Shelf.render(); }
  },
};
const Desktop = {
  on: IS_DESKTOP && !!window.__TAURI__,
  seen: new Map(),
  async open(paths) {
    const { invoke } = window.__TAURI__.core;
    for (const p of paths || []) {
      if (Date.now() - (this.seen.get(p) || 0) < 3000) continue;
      this.seen.set(p, Date.now());
      try { const buf = await invoke('read_file', { path: p }); const name = p.split(/[\\/]/).pop(); await openFile(new File([buf], name)); }
      catch (e) { toast(String(e), 4000); }
      break;
    }
  },
  async init() {
    if (!this.on) return;
    document.documentElement.classList.add('desktop');
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      const href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:)/i.test(href)) { e.preventDefault(); e.stopPropagation(); openExternal(href); }
    }, true);
    try { await window.__TAURI__.event.listen('open-files', e => this.open(e.payload)); } catch {}
    try { const pend = await window.__TAURI__.core.invoke('take_pending'); if (pend && pend.length) this.open(pend); } catch {}
  },
};
