/* ===================== azure.js — Azure neural voices for read-aloud ===================== */
const AZ_REGIONS = ['eastus','eastus2','westus','westus2','westus3','centralus','northcentralus','southcentralus','westcentralus','canadacentral','brazilsouth','westeurope','northeurope','uksouth','francecentral','germanywestcentral','swedencentral','switzerlandnorth','norwayeast','eastasia','southeastasia','japaneast','japanwest','koreacentral','australiaeast','centralindia','uaenorth'];
const AZ_LOCALE = { 'zh-CN': ['普通话', 'Mandarin'], 'zh-TW': ['台湾国语', 'Taiwanese Mandarin'], 'zh-HK': ['粤语（香港）', 'Cantonese (HK)'], 'yue-CN': ['粤语', 'Cantonese'], 'wuu-CN': ['吴语', 'Wu'], 'zh-CN-liaoning': ['东北话', 'Northeastern'], 'zh-CN-sichuan': ['四川话', 'Sichuanese'], 'zh-CN-shaanxi': ['陕西话', 'Shaanxi'], 'zh-CN-henan': ['河南话', 'Henan'], 'zh-CN-shandong': ['山东话', 'Shandong'], 'zh-CN-guangxi': ['广西话', 'Guangxi'], 'en-US': ['美式英语', 'US English'], 'en-GB': ['英式英语', 'UK English'], 'en-AU': ['澳洲英语', 'Australian English'], 'en-CA': ['加拿大英语', 'Canadian English'], 'en-IN': ['印度英语', 'Indian English'] };
const AZ_STYLE = { 'narration-relaxed': ['轻松讲述', 'relaxed narration'], 'narration-professional': ['专业讲述', 'professional narration'], 'documentary-narration': ['纪录片旁白', 'documentary'], 'gentle': ['温柔', 'gentle'], 'calm': ['平静', 'calm'], 'lyrical': ['抒情', 'lyrical'], 'poetry-reading': ['诗朗诵', 'poetry reading'], 'affectionate': ['亲切', 'affectionate'], 'cheerful': ['开心', 'cheerful'], 'excited': ['兴奋', 'excited'], 'hopeful': ['充满希望', 'hopeful'], 'friendly': ['友好', 'friendly'], 'chat': ['聊天', 'chat'], 'chat-casual': ['随意聊天', 'casual chat'], 'sad': ['悲伤', 'sad'], 'depressed': ['沮丧', 'depressed'], 'sorry': ['抱歉', 'sorry'], 'fearful': ['害怕', 'fearful'], 'terrified': ['惊恐', 'terrified'], 'whispering': ['耳语', 'whispering'], 'whisper': ['耳语', 'whisper'], 'angry': ['生气', 'angry'], 'disgruntled': ['不满', 'disgruntled'], 'unfriendly': ['冷淡', 'unfriendly'], 'shouting': ['喊叫', 'shouting'], 'serious': ['严肃', 'serious'], 'embarrassed': ['尴尬', 'embarrassed'], 'envious': ['羡慕', 'envious'], 'empathetic': ['共情', 'empathetic'], 'newscast': ['新闻播报', 'newscast'], 'assistant': ['助手', 'assistant'], 'customerservice': ['客服', 'customer service'], 'sports-commentary': ['体育解说', 'sports commentary'], 'advertisement-upbeat': ['广告', 'upbeat ad'], 'story': ['讲故事', 'story'] };
/** For automatic emotion: each mood lists styles to try, in order, among what the chosen voice supports. */
const AZ_MOOD = {
  narr: ['narration-relaxed', 'story', 'gentle', 'calm', 'lyrical', 'narration-professional'],
  talk: ['chat', 'friendly', 'chat-casual', 'affectionate', 'cheerful'],
  excited: ['excited', 'cheerful'],
  sad: ['sad', 'depressed', 'sorry'],
  fear: ['fearful', 'terrified', 'whispering', 'whisper'],
  angry: ['angry', 'disgruntled', 'unfriendly'],
};
const xmlEsc = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const Azure = {
  voices: null, ctrl: null, audio: null,
  cfg() { return LS.get('azure', null); },
  ok() { const c = this.cfg(); return !!(c && c.key && c.region); },
  base() { return `https://${this.cfg().region}.tts.speech.microsoft.com/cognitiveservices`; },
  label(v) {
    const loc = AZ_LOCALE[v.locale] ? AZ_LOCALE[v.locale][LANG === 'zh' ? 0 : 1] : v.locale;
    const g = v.gender === 'Female' ? t('female') : v.gender === 'Male' ? t('male') : '';
    return [v.local, g, loc, v.styles.length ? t('nStyles', v.styles.length) : ''].filter(Boolean).join(LANG === 'zh' ? '，' : ', ');
  },
  styleLabel: s => AZ_STYLE[s] ? AZ_STYLE[s][LANG === 'zh' ? 0 : 1] : s,
  async fetchVoices(cfg) {
    const r = await fetch(`https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': cfg.key } });
    if (!r.ok) throw this.err(r.status);
    const list = await r.json();
    return list.filter(v => /^(zh|wuu|en)-/.test(v.Locale) && !/^zh-HK/.test(v.Locale)).map(v => ({ name: v.ShortName, local: v.LocalName || v.DisplayName, gender: v.Gender, locale: v.Locale, styles: v.StyleList || [] }))
      .sort((a, b) => (a.locale === 'zh-CN' ? 0 : a.locale.startsWith('zh') ? 1 : 2) - (b.locale === 'zh-CN' ? 0 : b.locale.startsWith('zh') ? 1 : 2) || b.styles.length - a.styles.length || a.name.localeCompare(b.name));
  },
  async ensureVoices() {
    if (this.voices) return this.voices;
    const c = this.cfg(); const cached = LS.get('azureVoices', null);
    if (cached && cached.region === c.region && Date.now() - cached.t < 7 * 864e5) return this.voices = cached.list;
    this.voices = await this.fetchVoices(c);
    LS.set('azureVoices', { region: c.region, t: Date.now(), list: this.voices });
    return this.voices;
  },
  err(status) {
    const e = new Error(status === 401 || status === 403 ? t('azBadKey') : status === 429 ? t('azQuota') : status === 400 ? t('azBadReq') : t('azHttp', status));
    e.status = status; return e;
  },
  listFor(lang) { return (this.voices || []).filter(v => lang === 'zh' ? /^(zh|wuu)-/.test(v.locale) && !/^zh-HK/.test(v.locale) : v.locale.startsWith('en-')); },
  voiceFor(lang) {
    const want = S.set[lang === 'zh' ? 'azVoiceZh' : 'azVoiceEn'];
    const list = this.listFor(lang);
    return list.find(v => v.name === want) || list.find(v => v.name === (lang === 'zh' ? 'zh-CN-XiaoxiaoNeural' : 'en-US-JennyNeural')) || list[0] || null;
  },
  mood(s) {
    if (/^[\s　]*[“"「『‘]|[“"「『][^”"」』]{2,}[”"」』]/.test(s)) return 'talk';
    if (/[泪哭泣悲哀痛逝叹惋凄]|死了|\b(tears?|cried|cry|weep|grief|mourn|sorrow)\b/i.test(s)) return 'sad';
    if (/[鬼怕惧恐惊颤尖叫阴森诡]|毛骨悚然|\b(afraid|scared|terror|horror|ghost|scream)\w*/i.test(s)) return 'fear';
    if (/[怒吼骂]|滚开|混蛋|\b(angry|furious|rage|shouted)\b/i.test(s)) return 'angry';
    if (/[！!]/.test(s)) return 'excited';
    return 'narr';
  },
  styleFor(s, v) {
    const pick = S.set.azStyle || 'auto';
    if (pick === 'none' || !v.styles.length) return null;
    if (pick !== 'auto') return v.styles.includes(pick) ? pick : null;
    const cands = AZ_MOOD[this.mood(s)];
    return cands.find(x => v.styles.includes(x)) || AZ_MOOD.narr.find(x => v.styles.includes(x)) || null;
  },
  ssml(sentences, v) {
    const rate = Math.round((S.set.ttsRate - 1) * 100), pitch = Math.round(((S.set.ttsPitch || 1) - 1) * 50);
    const sign = n => (n >= 0 ? '+' : '') + n + '%';
    const deg = clamp(+S.set.azDegree || 1.2, 0.5, 2).toFixed(2);
    const body = sentences.map(s => {
      const inner = `<prosody rate="${sign(rate)}" pitch="${sign(pitch)}">${xmlEsc(s)}</prosody>`;
      const st = this.styleFor(s, v);
      return st ? `<mstts:express-as style="${st}" styledegree="${deg}">${inner}</mstts:express-as>` : inner;
    }).join('');
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${v.locale}"><voice name="${v.name}">${body}</voice></speak>`;
  },
  countUsage(text) {
    const m = new Date().toISOString().slice(0, 7); const u = LS.get('azUsage', { m, chars: 0 });
    if (u.m !== m) { u.m = m; u.chars = 0; }
    u.chars += text.length + (text.match(/[㐀-鿿豈-﫿぀-ヿ가-힯]/g) || []).length; // CJK counted twice
    LS.set('azUsage', u);
  },
  usage() { const m = new Date().toISOString().slice(0, 7); const u = LS.get('azUsage', { m, chars: 0 }); return u.m === m ? u.chars : 0; },
  async synth(ssml, plain) {
    const c = this.cfg();
    const r = await fetch(this.base() + '/v1', { method: 'POST', signal: this.ctrl.signal, headers: { 'Ocp-Apim-Subscription-Key': c.key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' }, body: ssml });
    if (!r.ok) throw this.err(r.status);
    this.countUsage(plain);
    return URL.createObjectURL(await r.blob());
  },
  /** iOS only lets audio start inside a tap; play a silent clip on the shared element right away so later clips may follow. */
  unlock() {
    this.audio ||= new Audio();
    try { this.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; const p = this.audio.play(); if (p && p.catch) p.catch(() => {}); } catch {}
  },
  fail(e) {
    TTS.stop();
    if (e && e.name === 'AbortError') return;
    const msg = e instanceof TypeError ? t('azNet') : (e && e.message) || String(e);
    toast(msg, 4500);
  },
  async speak(text, done, g, el) {
    try { await this.ensureVoices(); } catch (e) { this.fail(e); return; }
    if (g !== TTS.gen) return;
    this.ctrl = this.ctrl && !this.ctrl.signal.aborted ? this.ctrl : new AbortController();
    // group consecutive sentences of one language into requests of up to ~380 characters
    const groups = [];
    for (const it of TTS.items(text)) {
      const v = this.voiceFor(it.lang); if (!v) continue;
      const last = groups[groups.length - 1];
      if (last && last.v === v && last.len + it.text.length <= 380) { last.sents.push(it.text); last.len += it.text.length; last.end = it.end; }
      else groups.push({ v, sents: [it.text], len: it.text.length, start: it.start, end: it.end });
    }
    if (!groups.length) return done && done();
    const req = gr => this.synth(this.ssml(gr.sents, gr.v), gr.sents.join(''));
    let i = 0, next = req(groups[0]); next.catch(() => {});
    const playNext = async () => {
      if (g !== TTS.gen) return;
      if (i >= groups.length) { TTS.clearSent(el); return done && done(); }
      const gr = groups[i], cur = next; i++;
      next = i < groups.length ? req(groups[i]) : null; if (next) next.catch(() => {});
      let url; try { url = await cur; } catch (e) { if (g === TTS.gen) this.fail(e); return; }
      if (g !== TTS.gen) { URL.revokeObjectURL(url); return; }
      TTS.markSent(el, gr);
      const a = this.audio ||= new Audio();
      a.onended = () => { URL.revokeObjectURL(url); playNext(); };
      a.onerror = () => { URL.revokeObjectURL(url); playNext(); };
      a.src = url;
      try { await a.play(); } catch (e) { if (g === TTS.gen) this.fail(new Error(t('azTapToPlay'))); }
    };
    playNext();
  },
  pause(p) { if (!this.audio) return; if (p) this.audio.pause(); else this.audio.play().catch(() => {}); },
  stop() { if (this.ctrl) { this.ctrl.abort(); this.ctrl = null; } if (this.audio) { this.audio.pause(); this.audio.onended = null; this.audio.removeAttribute('src'); } },
  async setup() {
    const c = this.cfg() || {};
    const key = h('input', { type: 'password', placeholder: t('azKeyPh'), value: c.key || '', autocomplete: 'off' });
    const reg = h('select', {}, AZ_REGIONS.map(r => h('option', { value: r, selected: (c.region || 'eastus') === r }, r)));
    const msg = h('p', { class: 'ghmsg' });
    const steps = h('ol', { class: 'ghsteps' },
      h('li', {}, t('azStep1a'), h('a', { href: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices', target: '_blank', rel: 'noopener' }, t('azStep1link')), t('azStep1b')),
      h('li', { text: t('azStep2') }), h('li', { text: t('azStep3') }));
    const buttons = [{ label: t('cancel'), value: null }];
    if (this.ok()) buttons.push({ label: t('ghDisconnect'), onClick: () => { LS.del('azure'); LS.del('azureVoices'); this.voices = null; S.set.ttsEngine = 'system'; saveSet(); toast(t('azRemoved')); renderTTS($('#p-tts')); return true; } });
    buttons.push({ label: t('azSave'), primary: true, onClick: async () => {
      const cfg = { key: key.value.trim(), region: reg.value };
      if (!cfg.key) { msg.textContent = t('azNeedKey'); return false; }
      msg.textContent = t('ghChecking');
      try { const list = await this.fetchVoices(cfg); LS.set('azure', cfg); this.voices = list; LS.set('azureVoices', { region: cfg.region, t: Date.now(), list }); }
      catch (e) { msg.textContent = e instanceof TypeError ? t('azNet') : e.message; return false; }
      S.set.ttsEngine = 'azure'; saveSet(); toast(t('azReady', this.listFor('zh').length));
      setTimeout(() => { const pop = $('#p-tts'); if (pop.classList.contains('open')) renderTTS(pop); }, 50);
      return true;
    } });
    return modal({ title: t('azTitle'), body: h('div', {}, steps, h('label', { class: 'fl', text: t('azKey') }), key, h('label', { class: 'fl', text: t('azRegion') }), reg, msg, h('p', { class: 'ghnote', text: t('azNote') })), buttons, onOpen: () => key.focus() });
  },
};
