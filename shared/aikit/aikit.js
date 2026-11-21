/* AIKit — Claude as an AI player for the hub's browser games (shared/aikit; games vendor a copy into src/vendor/).
   Backends, picked automatically:
     · hub / GitHub Pages: the owner's own API key, stored only in this browser (localStorage 'hub.ai', shared by every
       game on the hub origin), called straight from the page with the browser-access header. No server.
     · claude.ai artifact: the page's `sample` capability (the viewer's own claude.ai account, no key).
     · neither: AIKit.available() is false and games fall back to their scripted AI.
   In co-op only the host calls the API (the host runs the AI); guests never need a key.
   Games pass a JSON-schema tool and always get structured input back; they must validate it themselves. */
const AIKit = (() => {
  const CFG = 'hub.ai', USE = 'hub.ai.usage';
  const MODELS = { quick: 'claude-haiku-5-5', smart: 'claude-sonnet-5-5' };
  const PRICE = { 'claude-haiku-5-5': { i: 0.10, o: 0.50, cr: 0.01, cw: 0.125 }, 'claude-sonnet-5-5': { i: 2, o: 10, cr: 0.10, cw: 2.5 } };
  const TIERS = { eco: '省钱：全部用 Haiku', bal: '均衡：平时 Haiku，关键台词 Sonnet', best: '高质量：全部用 Sonnet' };
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  let sample = null, sampleTried = false, chain = Promise.resolve(), session = { calls: 0, usd: 0, fails: 0 };
  const isArtifact = () => !!window.__ARTIFACT__;
  function cfg() { return Object.assign({ key: '', on: true, tier: 'bal' }, get(CFG, {})); }
  function setCfg(p) { put(CFG, Object.assign(cfg(), p)); }
  async function loadSample() {
    if (sampleTried) return sample; sampleTried = true;
    try { if (window.claude && window.claude.use) sample = await window.claude.use('sample'); } catch (e) { sample = null; }
    return sample;
  }
  if (isArtifact()) setTimeout(loadSample, 0);
  function available() { const c = cfg(); if (!c.on) return false; return isArtifact() ? !!sample : !!c.key; }
  function backend() { return isArtifact() ? (sample ? 'claude.ai 账号' : '不可用') : cfg().key ? '你的 API 密钥' : '未设置密钥'; }
  function model(want) { const t = cfg().tier; return MODELS[t === 'eco' ? 'quick' : t === 'best' ? 'smart' : (want === 'smart' ? 'smart' : 'quick')]; }
  function track(m, u) {
    const p = PRICE[m] || PRICE[MODELS.quick]; if (!u) return;
    const usd = ((u.input_tokens || 0) * p.i + (u.output_tokens || 0) * p.o + (u.cache_read_input_tokens || 0) * p.cr + (u.cache_creation_input_tokens || 0) * p.cw) / 1e6;
    session.calls++; session.usd += usd; const all = get(USE, { calls: 0, usd: 0 }); all.calls++; all.usd += usd; put(USE, all);
  }
  function usage() { return { session: Object.assign({}, session), total: get(USE, { calls: 0, usd: 0 }) }; }
  function resetSession() { session = { calls: 0, usd: 0, fails: 0 }; }
  /* one call at a time, so a burst of lines never trips the rate limit */
  function call(opts) { const p = chain.then(() => callNow(opts)); chain = p.catch(() => { }); return p; }
  async function callNow({ system, user, tool, want, maxTokens, timeout }) {
    if (!available()) throw new Error('AI 不可用');
    const m = model(want), ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout || (want === 'smart' ? 20000 : 12000));
    try {
      if (isArtifact()) {
        const s = await loadSample(); if (!s) throw new Error('claude.ai 不允许这个页面调用 Claude');
        const prompt = system + '\n\n' + user + '\n\n只输出一个 JSON 对象，字段：' + JSON.stringify(tool.schema.properties) + '。不要输出别的。';
        try { const v = await s.json(prompt, { modelTier: want === 'smart' ? 'default' : 'quick', signal: ctl.signal, cache: false }); session.calls++; return v; }
        catch (e) { if (e && e.code === 'not_granted') sample = null; throw new Error((e && e.message) || 'claude.ai 调用失败'); }
      }
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': cfg().key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: m, max_tokens: maxTokens || 400, system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: user }], tools: [{ name: tool.name, description: tool.description || tool.name, input_schema: tool.schema }], tool_choice: { type: 'tool', name: tool.name } })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const msg = (j.error && j.error.message) || ('HTTP ' + r.status); const e = new Error(r.status === 401 ? '密钥无效（401）' : r.status === 429 ? '调用太频繁或额度用完（429）' : msg); e.status = r.status; throw e; }
      track(m, j.usage);
      const b = (j.content || []).find(x => x.type === 'tool_use'); if (!b) throw new Error('没有拿到结构化结果');
      return b.input;
    } catch (e) { session.fails++; if (e.name === 'AbortError') throw new Error('超时'); throw e; }
    finally { clearTimeout(to); }
  }
  async function test() {
    const v = await call({ system: '你是连通性测试。', user: '回复“通了”。', tool: { name: 'ok', schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } }, maxTokens: 30, timeout: 15000 });
    return v && v.text;
  }
  /* settings block any game can drop into its own dialog: returns HTML; bind with AIKit.bind(root, onChange) */
  function panelHTML(note) {
    const c = cfg(), u = usage(), esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const keyRow = isArtifact() ? `<p class="ak-mut">claude.ai 里的版本用你自己的 claude.ai 账号调用 Claude，不需要密钥。第一次会弹窗请你同意。</p>`
      : `<label class="ak-row">API 密钥<input class="ak-key" type="password" autocomplete="off" spellcheck="false" placeholder="${c.key ? '已保存：••••' + esc(c.key.slice(-4)) : 'sk-ant-…'}"></label>
         <div class="ak-btns"><button class="ak-save">保存密钥</button>${c.key ? '<button class="ak-clear">删除密钥</button>' : ''}</div>
         <p class="ak-mut">密钥只存在这台设备的浏览器里（游戏厅所有游戏共用），不会上传到任何地方，也不会进存档。打开浏览器开发者工具的人能看到它，所以建议单独建一个密钥，并在 Claude Console 里给它设消费上限。联机时只有开房间的人需要密钥。</p>`;
    return `<div class="ak">
      <label class="ak-row"><input class="ak-on" type="checkbox" ${c.on ? 'checked' : ''}> 用 Claude 扮演 AI 玩家 <span class="ak-mut">（${esc(backend())}）</span></label>
      ${keyRow}
      <div class="ak-row">档位 ${Object.keys(TIERS).map(k => `<label class="ak-tier"><input type="radio" name="ak-tier" value="${k}" ${c.tier === k ? 'checked' : ''}> ${TIERS[k]}</label>`).join('')}</div>
      <div class="ak-btns"><button class="ak-test">测试连接</button><span class="ak-msg ak-mut"></span></div>
      <p class="ak-mut">这次打开以来：${u.session.calls} 次调用，约 $${u.session.usd.toFixed(3)}${u.session.fails ? '，失败 ' + u.session.fails + ' 次（失败时自动用脚本台词）' : ''}；累计 ${u.total.calls} 次，约 $${u.total.usd.toFixed(2)}。费用按官网标价估算，以 Console 账单为准。</p>
      ${note ? `<p class="ak-mut">${note}</p>` : ''}</div>`;
  }
  function bind(root, onChange) {
    const q = s => root.querySelector(s), msg = t => { const m = q('.ak-msg'); if (m) m.textContent = t; };
    const on = q('.ak-on'); if (on) on.onchange = () => { setCfg({ on: on.checked }); onChange && onChange(); };
    root.querySelectorAll('input[name=ak-tier]').forEach(r => r.onchange = () => { setCfg({ tier: r.value }); onChange && onChange(); });
    const sv = q('.ak-save'); if (sv) sv.onclick = () => { const k = q('.ak-key').value.trim(); if (!/^sk-ant-/.test(k)) return msg('密钥应该以 sk-ant- 开头'); setCfg({ key: k, on: true }); onChange && onChange(); };
    const cl = q('.ak-clear'); if (cl) cl.onclick = () => { setCfg({ key: '' }); onChange && onChange(); };
    const t = q('.ak-test'); if (t) t.onclick = async () => { msg('测试中…'); try { const r = await test(); msg('✅ 通了（' + (r || 'ok') + '）'); } catch (e) { msg('❌ ' + e.message); } };
  }
  const css = `.ak{display:flex;flex-direction:column;gap:10px;font-size:15px}.ak-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.ak-key{flex:1;min-width:200px;font:15px ui-monospace,Menlo,monospace;padding:8px 10px;border-radius:8px;border:1px solid rgba(128,128,128,.4);background:rgba(0,0,0,.2);color:inherit}.ak-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ak-mut{opacity:.7;font-size:13px;line-height:1.6;margin:0}.ak-tier{display:flex;gap:6px;align-items:center;width:100%}`;
  if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
  return { cfg, setCfg, available, backend, call, test, usage, resetSession, panelHTML, bind, MODELS, TIERS, loadSample };
})();
