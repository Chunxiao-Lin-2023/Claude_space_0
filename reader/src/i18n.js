/* ===================== i18n.js ===================== */
const I18N = {
  appName: ['墨阅', 'Moyue Reader'],
  tagline: ['打开任意文档，安静地读。', 'Open any document. Read in peace.'],
  dropTitle: ['把文件拖到这里', 'Drop a file here'],
  dropSub: ['或点击这一页选择文件。文件只在你的浏览器里打开，不会上传到任何地方。', 'Or click this page to choose one. Files open only in your browser and are never uploaded.'],
  dropHere: ['松开以打开', 'Release to open'],
  openFile: ['打开文件', 'Open file'],
  trySample: ['试读示例', 'Try a sample'],
  formats: ['支持的格式', 'Supported formats'],
  fgDoc: ['文档', 'Documents'], fgBook: ['电子书', 'E-books'], fgSheet: ['表格', 'Spreadsheets'], fgSlide: ['演示', 'Slides'], fgWeb: ['标记与网页', 'Markup'], fgCode: ['代码', 'Code'], fgImg: ['图片与漫画', 'Images & comics'],
  fgCodeList: ['Python  C/C++  Verilog  VHDL  Tcl  JS/TS  Rust  Go  MATLAB  LaTeX 等 60 余种', 'Python  C/C++  Verilog  VHDL  Tcl  JS/TS  Rust  Go  MATLAB  LaTeX and 60+ more'],
  shelf: ['书架', 'Library'],
  bookCount: ['{0} 本', '{0} items'],
  shelfEmpty: ['书架是空的。打开过的文件会留在这里，下次点一下就能从上次的位置继续读。', 'Your library is empty. Files you open stay here so you can pick up where you left off.'],
  shelfNoStore: ['这个浏览器不允许本页保存数据，书架和阅读进度不会被记住。', 'This browser does not let the page store data, so the library and progress will not be kept.'],
  shelfMissing: ['找不到这本书的文件，请重新打开。', 'The file for this item is missing. Open it again.'],
  removeShelf: ['从书架移除', 'Remove from library'],
  removed: ['已移除《{0}》', 'Removed "{0}"'],
  continueAt: ['继续阅读，已读 {0}%', 'Continue reading, {0}% done'],
  unread: ['未读', 'New'],
  opening: ['正在打开 {0}', 'Opening {0}'],
  switching: ['正在切换版式', 'Switching layout'],
  openFail: ['无法打开这个文件', 'This file could not be opened'],
  openOther: ['打开其他文件', 'Open another file'],
  backShelf: ['返回书架', 'Back to library'],
  renderFail: ['渲染失败', 'Rendering failed'],
  libFail: ['无法加载组件 {0}，请检查网络后重试。', 'Could not load the {0} component. Check your connection and try again.'],
  badFile: ['文件已损坏或格式不正确。', 'The file is damaged or not in the expected format.'],
  drm: ['这本书带有 DRM 版权保护，无法在这里打开。', 'This book is DRM-protected and cannot be opened here.'],
  huff: ['这本 MOBI 使用了 HUFF/CDIC 压缩，暂不支持。可用 Calibre 转换为 EPUB 后打开。', 'This MOBI uses HUFF/CDIC compression, which is not supported. Convert it to EPUB with Calibre first.'],
  legacy: ['这是旧版二进制 Office 格式（.doc / .ppt）。请在 Office 或 WPS 中另存为 .docx / .pptx 后打开。', 'This is a legacy binary Office file (.doc / .ppt). Save it as .docx / .pptx in Office or WPS, then open it.'],
  rar: ['RAR / 7z 压缩包暂不支持，请解压或改用 ZIP（CBZ）。', 'RAR / 7z archives are not supported. Extract them or use ZIP (CBZ).'],
  unsupportedFmt: ['浏览器无法显示 {0} 格式。', 'Browsers cannot display {0} files.'],
  zipUnknown: ['这个 ZIP 里没有可阅读的内容。', 'This ZIP has nothing readable in it.'],
  unsupported: ['无法识别这个文件的格式。', 'The file format was not recognized.'],
  noImages: ['压缩包里没有图片。', 'The archive contains no images.'],
  emptySheet: ['此工作表为空。', 'This sheet is empty.'],
  sheetTrunc: ['只显示前 {0} 行。', 'Showing the first {0} rows only.'],
  preface: ['开始', 'Beginning'],
  partN: ['第 {0} 部分', 'Part {0}'],
  sectionN: ['第 {0} 节', 'Section {0}'],
  slideN: ['幻灯片 {0}', 'Slide {0}'],
  notes: ['注释', 'Notes'],
  pageN: ['第 {0} 页', 'Page {0}'],
  pageOf: ['第 {0} / {1} 页', 'Page {0} of {1}'],
  prevCh: ['上一章', 'Previous'], nextCh: ['下一章', 'Next'], theEnd: ['已读到最后', 'The end'],
  chLeft: ['本章剩余 {0}', '{0} left in chapter'],
  mins: ['{0} 分钟', '{0} min'], hrs: ['{0} 小时', '{0} h'], hrsMins: ['{0} 小时 {1} 分', '{0} h {1} min'],
  readTime: ['本书已读 {0}', 'Read for {0}'],
  layoutOrig: ['原版式', 'Original layout'], layoutReflow: ['重排版式', 'Reflow'],
  // sidebar
  tab_toc: ['目录', 'Contents'], tab_thumbs: ['缩略图', 'Pages'], tab_bm: ['书签', 'Bookmarks'], tab_notes: ['笔记', 'Notes'], tab_search: ['搜索', 'Search'],
  noToc: ['这份文档没有目录。', 'This document has no table of contents.'],
  bmCount: ['{0} 个书签', '{0} bookmarks'], bmToggle: ['书签', 'Bookmark'],
  noBm: ['还没有书签。按 B 或点右上角的书签按钮，记下当前位置。', 'No bookmarks yet. Press B or use the bookmark button to mark this spot.'],
  bmAdded: ['已加书签', 'Bookmark added'], bmRemoved: ['已删除书签', 'Bookmark removed'], bmAdd: ['添加书签 (B)', 'Add bookmark (B)'], bmRemove: ['删除书签 (B)', 'Remove bookmark (B)'],
  bookmarks: ['书签', 'Bookmarks'],
  noteCount: ['{0} 条笔记', '{0} notes'], exportMd: ['复制为 Markdown', 'Copy as Markdown'],
  noNotes: ['还没有笔记。选中一段文字，就可以划线、换颜色或写下想法。', 'No notes yet. Select some text to highlight it or write a note.'],
  editNote: ['编辑笔记', 'Edit note'], addNote: ['写笔记', 'Add note'], notePh: ['写下你的想法…', 'Write your thoughts…'],
  searchPh: ['在文档中搜索', 'Search in document'], searchHint: ['输入关键词后按回车。快捷键 Ctrl / ⌘ + F。', 'Type a word and press Enter. Shortcut: Ctrl / ⌘ + F.'],
  searching: ['正在搜索…', 'Searching…'], resCount: ['{0} 处结果', '{0} results'], noResults: ['没有找到', 'No matches'],
  // selection
  cTeng: ['藤黄', 'Gamboge'], cZhu: ['竹青', 'Bamboo'], cTian: ['天青', 'Celadon blue'], cYan: ['胭脂', 'Rouge'], cDing: ['丁香', 'Lilac'],
  note: ['笔记', 'Note'], copy: ['复制', 'Copy'], readSel: ['朗读', 'Read aloud'], searchDoc: ['在文中搜索', 'Search document'], dict: ['查词典', 'Dictionary'], translate: ['翻译', 'Translate'], delete: ['删除', 'Delete'],
  copied: ['已复制', 'Copied'], copyManual: ['请手动复制', 'Copy this text'],
  // typography
  theme: ['主题', 'Theme'], thPaper: ['素白', 'Paper'], thSepia: ['宣纸', 'Sepia'], thGreen: ['豆青', 'Green'], thDark: ['黛灰', 'Dusk'], thBlack: ['墨夜', 'Night'],
  pageMode: ['翻页方式', 'Page turning'], mScroll: ['滚动', 'Scroll'], mPaged: ['分页', 'Pages'], mSpread: ['双页', 'Two pages'],
  fontCjk: ['中文字体', 'Chinese font'], fontCjkHint: ['正文汉字', 'for CJK text'],
  fontLatin: ['英文字体', 'Latin font'], fontLatinHint: ['字母与数字', 'letters & digits'],
  fontMono: ['代码字体', 'Code font'], fontSystem: ['本机字体', 'System font'], fontUploaded: ['已上传', 'Uploaded'], fontLocal: ['本机', 'Installed'],
  customFont: ['更多字体', 'More fonts'], uploadFont: ['上传字体文件', 'Upload font file'], localFonts: ['读取本机字体', 'Browse installed fonts'],
  fontNamePh: ['输入本机已安装的字体名，如 方正书宋', 'Installed font name, e.g. Baskerville'],
  customFontHint: ['支持 TTF / OTF / WOFF / WOFF2，也可以直接把字体文件拖进窗口。上传的字体保存在本机浏览器里。', 'TTF / OTF / WOFF / WOFF2 are supported; you can also drop font files onto the window. Uploaded fonts stay in this browser.'],
  add: ['添加', 'Add'], fontAdded: ['字体已添加', 'Font added'], fontBad: ['{0} 不是可用的字体文件', '{0} is not a usable font file'], fontNoStore: ['字体本次可用，但浏览器不允许保存', 'Font works for now but could not be saved'],
  localFontDenied: ['浏览器没有允许本页读取字体列表。可以在下方直接输入字体名。', 'The browser did not allow listing fonts here. Type the font name below instead.'],
  filterFonts: ['筛选字体', 'Filter fonts'],
  typeset: ['排版', 'Layout'], fsize: ['字号', 'Size'], lheight: ['行距', 'Line'], pspace: ['段距', 'Paragraph'], lspace: ['字距', 'Tracking'], pwidth: ['版心', 'Width'],
  align: ['对齐', 'Align'], alJustify: ['两端对齐', 'Justify'], alLeft: ['左对齐', 'Left'],
  indent: ['首行缩进', 'Indent'], auto: ['自动', 'Auto'], on: ['开', 'On'], off: ['关', 'Off'],
  resetType: ['恢复默认设置', 'Reset to defaults'],
  encoding: ['文本编码', 'Text encoding'],
  pdfInvert: ['夜间反色', 'Invert at night'], pdfInvertHint: ['在黛灰、墨夜主题下把白底页面反转为深色。', 'Inverts white pages in the Dusk and Night themes.'],
  autoScroll: ['自动滚屏', 'Auto-scroll'], speed: ['速度', 'Speed'], autoStart: ['开始滚屏', 'Start'], autoStop: ['停止滚屏', 'Stop auto-scroll'],
  autoOn: ['自动滚屏中，按空格或 Esc 停止', 'Auto-scrolling. Press Space or Esc to stop'], autoOff: ['已停止滚屏', 'Auto-scroll stopped'], autoNeedScroll: ['自动滚屏需要“滚动”翻页方式', 'Auto-scroll needs the Scroll page mode'],
  // tts
  tts: ['朗读', 'Read aloud'], readFromHere: ['从当前位置朗读', 'Read from here'], pause: ['暂停', 'Pause'], resume: ['继续', 'Resume'], stop: ['停止', 'Stop'],
  voice: ['声音', 'Voice'], voiceAuto: ['自动', 'Automatic'], rate: ['语速', 'Rate'], voiceZh: ['中文声音', 'Chinese voice'], voiceEn: ['英文声音', 'English voice'], online: ['在线', 'online'],
  ttsExpr: ['语气起伏', 'Expressive'], qNatural: ['自然', 'natural'], qEnhanced: ['增强', 'enhanced'],
  ttsEngine: ['声音来源', 'Voice source'], engSystem: ['系统语音', 'System voices'], engAzure: ['Azure 神经语音', 'Azure neural'],
  timbreZh: ['中文音色', 'Chinese'], timbreEn: ['英文音色', 'English'], emotion: ['情绪', 'Emotion'], emotionDeg: ['情绪强度', 'Intensity'], pitch: ['音调', 'Pitch'], preview: ['试听', 'Preview'],
  styleAuto: ['自动（按句子判断）', 'Automatic (per sentence)'], styleAutoNone: ['这个音色没有情绪风格', 'This voice has no styles'], styleNone: ['不加情绪', 'No style'],
  female: ['女声', 'female'], male: ['男声', 'male'], nStyles: ['{0} 种情绪', '{0} styles'],
  azAutoNote: ['自动情绪：旁白用讲述语气，引号里的对话用聊天语气，感叹句更兴奋，悲伤、恐怖、愤怒的句子各换对应风格。只有部分音色支持情绪，晓晓、云希支持的最多。', 'Automatic emotion: narration in a storytelling tone, quoted dialogue conversational, exclamations livelier, and sad, frightening or angry sentences in matching styles. Only some voices have styles; Xiaoxiao and Yunxi have the most.'],
  azUsage: ['本月约用 {0} / 500,000 字符（汉字按 2 个计，估算）', 'About {0} / 500,000 characters used this month (CJK counted twice, estimate)'], azChange: ['修改 Azure 设置', 'Azure settings'],
  azTitle: ['设置 Azure 神经语音', 'Set up Azure neural voices'], azStep1a: ['在 Azure 门户', 'In the Azure portal, '], azStep1link: ['创建“语音服务”资源', 'create a Speech service resource'],
  azStep1b: ['：定价层选 Free F0（每月 50 万字符免费，用完会暂停而不会扣费），区域选离你近的，例如 East US。没有账号先免费注册。', ': pick the Free F0 pricing tier (500,000 characters a month; it pauses rather than bills when used up) and a nearby region such as East US. Sign up for free if needed.'],
  azStep2: ['资源建好后打开“密钥和终结点”，复制“密钥 1”和“位置/区域”。', 'When it is ready, open Keys and Endpoint and copy KEY 1 and the Location/Region.'],
  azStep3: ['填在下面。密钥只保存在这台设备的浏览器里，不会同步到 GitHub。', 'Enter them below. The key stays in this browser and is not synced to GitHub.'],
  azKey: ['密钥', 'Key'], azKeyPh: ['密钥 1', 'KEY 1'], azRegion: ['区域', 'Region'], azSave: ['保存并连接', 'Save and connect'], azNeedKey: ['请填写密钥。', 'Enter the key.'],
  azNote: ['朗读的文字会发送到 Azure 语音服务生成声音。', 'Text being read is sent to Azure Speech to generate audio.'],
  azReady: ['Azure 已连接，找到 {0} 个中文音色', 'Azure connected: {0} Chinese voices'], azRemoved: ['已移除 Azure 设置', 'Azure settings removed'],
  azBadKey: ['Azure 密钥不对，或和区域不匹配', 'The Azure key is wrong or does not match the region'], azQuota: ['Azure 本月免费额度用完了，或请求太快，请稍后再试', 'Azure free quota used up or too many requests; try again later'],
  azBadReq: ['Azure 不接受这段文字的格式', 'Azure rejected the request'], azHttp: ['Azure 返回错误 {0}', 'Azure error {0}'],
  azNet: ['连不上 Azure 语音服务，请检查网络和区域', 'Could not reach Azure Speech; check the network and region'], azTapToPlay: ['浏览器拦住了自动播放，请再点一次朗读', 'The browser blocked playback; tap Read again'],
  natural_win: ['想要更自然的声音：用 Edge 浏览器打开网页版，可选“Microsoft Xiaoxiao Online (Natural)”等在线自然语音。', 'For more natural voices, open the web version in Edge and pick an online Natural voice such as Microsoft Xiaoxiao Online.'],
  natural_mac: ['想要更自然的声音：系统设置 → 辅助功能 → 朗读内容 → 系统声音 → 管理声音，下载中文“婷婷（增强）”等增强版声音。', 'For more natural voices, download an Enhanced Chinese voice (e.g. Tingting Enhanced) in System Settings → Accessibility → Spoken Content → Manage Voices.'],
  natural_ios: ['想要更自然的声音：设置 → 辅助功能 → 朗读内容 → 声音 → 中文，下载“增强”或“高级”版本。', 'For more natural voices, download an Enhanced or Premium Chinese voice in Settings → Accessibility → Spoken Content → Voices.'],
  natural_android: ['想要更自然的声音：在系统的文字转语音设置里安装 Google 的中文高质量语音包。', 'For more natural voices, install Google high-quality Chinese voice data in text-to-speech settings.'],
  natural_other: ['系统语音的语气基本固定；想要有感情的朗读，可以切换到 Azure 神经语音。', 'System voices have a fixed tone; switch to Azure neural voices for expressive reading.'],
  noZhVoiceShort: ['这台设备没有中文语音', 'No Chinese voice on this device'], noEnVoiceShort: ['这台设备没有英文语音', 'No English voice on this device'],
  ttsNote: ['中文段落用中文声音读，英文段落用英文声音读；句号、逗号处停顿，段落之间稍作停留。选一个声音会先试读一句。', 'Chinese passages use the Chinese voice and English passages the English voice, pausing at full stops and commas. Picking a voice plays a short sample.'],
  noZhVoiceTitle: ['没有中文语音', 'No Chinese voice'], noZhVoice: ['这台设备的浏览器里没有中文语音，所以读不了中文。装好中文语音后，重新打开墨阅即可。', 'This browser has no Chinese voice, so Chinese text cannot be read aloud. Install one, then reopen Moyue.'],
  zhVoiceHow_win: ['Windows：设置 → 时间和语言 → 语音 → 添加语音，选“中文(简体，中国)”。装好后重启浏览器或墨阅。用 Edge 浏览器打开网页版，还能用晓晓等在线自然语音。', 'Windows: Settings → Time & language → Speech → Add voices → Chinese (Simplified, China), then restart the browser or app. Edge also offers online natural Chinese voices.'],
  zhVoiceHow_mac: ['macOS：系统设置 → 辅助功能 → 朗读内容 → 系统声音 → 管理声音，勾选中文（普通话）里的声音（如婷婷）下载。', 'macOS: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, then download a Chinese (Mandarin) voice such as Tingting.'],
  zhVoiceHow_ios: ['iPhone / iPad：设置 → 辅助功能 → 朗读内容 → 声音 → 中文，下载一个声音（如婷婷）。', 'iPhone / iPad: Settings → Accessibility → Spoken Content → Voices → Chinese, and download a voice such as Tingting.'],
  zhVoiceHow_android: ['安卓：设置 → 系统 → 语言和输入法 → 文字转语音输出，在首选引擎里安装中文语音数据。', 'Android: Settings → System → Languages & input → Text-to-speech output, and install Chinese voice data for the engine.'],
  zhVoiceHow_other: ['请在系统的语音或辅助功能设置里安装中文语音。', 'Install a Chinese voice in your system speech or accessibility settings.'],
  noVoices: ['系统里没有可用的中文或英文语音。', 'No Chinese or English system voices are available.'],
  // more / misc
  immExit: ['退出沉浸', 'Exit focus'], immHint: ['轻点页面或右上角按钮即可退出沉浸阅读', 'Tap the page or the button at the top right to leave focus mode'],
  fullscreen: ['全屏', 'Full screen'], immersive: ['沉浸阅读', 'Focus mode'], shortcuts: ['键盘快捷键', 'Keyboard shortcuts'], fsFail: ['当前窗口不允许全屏', 'Full screen is not allowed here'],
  close: ['好', 'OK'], cancel: ['取消', 'Cancel'], save: ['保存', 'Save'], open: ['打开', 'Open'],
  password: ['密码', 'Password'], pwNeed: ['这个 PDF 需要密码', 'This PDF needs a password'], pwWrong: ['密码不对，请重试', 'Wrong password, try again'],
  prev: ['上一页', 'Previous'], next: ['下一页', 'Next'], zoomIn: ['放大', 'Zoom in'], zoomOut: ['缩小', 'Zoom out'], zoomReset: ['100%', '100%'], rotate: ['旋转', 'Rotate'],
  fitWidth: ['适合宽度', 'Fit width'], fitPage: ['适合整页', 'Fit page'], spreadPdf: ['双页', 'Two pages'], stripMode: ['连续滚动', 'Continuous'], singleMode: ['单页', 'Single page'],
  tip_side: ['侧栏 (T)', 'Sidebar (T)'], tip_home: ['书架', 'Library'], tip_bm: ['书签 (B)', 'Bookmark (B)'], tip_tts: ['朗读 (R)', 'Read aloud (R)'], tip_aa: ['外观与字体', 'Appearance & fonts'], tip_more: ['更多', 'More'],
  kPage: ['上一页 / 下一页', 'Previous / next page'], kNext: ['向后翻页（Shift 向前）', 'Page forward (Shift: back)'], kSearch: ['搜索', 'Search'], kToc: ['目录', 'Contents'], kBm: ['书签', 'Bookmark'], kTts: ['朗读 / 停止', 'Read aloud / stop'], kAuto: ['自动滚屏', 'Auto-scroll'], kZoom: ['字号或缩放', 'Font size or zoom'], kTheme: ['切换主题', 'Cycle theme'], kFull: ['全屏', 'Full screen'], kImm: ['沉浸阅读', 'Focus mode'], kOpen: ['打开文件', 'Open file'], kEsc: ['关闭面板 / 退出', 'Close panel / exit'],
  // GitHub sync
  ghMenu: ['同步到 GitHub…', 'Sync with GitHub…'], ghTitle: ['同步到 GitHub', 'Sync with GitHub'],
  ghConnect: ['连接 GitHub 同步', 'Connect GitHub sync'], ghSyncNow: ['立即同步', 'Sync now'], ghSettings: ['设置', 'Settings'],
  ghSyncing: ['正在同步…', 'Syncing…'], ghError: ['同步出错：{0}', 'Sync error: {0}'], ghSynced: ['已同步到 {0}，{1}', 'Synced to {0}, {1}'], ghConnected: ['已连接 {0}', 'Connected to {0}'],
  ghArtifactOnly: ['claude.ai 里的这个页面不能访问 GitHub。请打开 GitHub Pages 上的墨阅，在那里连接同步：', 'This page on claude.ai cannot reach GitHub. Open Moyue on GitHub Pages and connect there:'],
  ghStep1a: ['', ''], ghNewRepoLink: ['新建私有仓库 moyue-library', 'Create the private repository moyue-library'], ghStep1b: ['（名称和 Private 已填好，点 Create repository）', ' (name and Private are prefilled; click Create repository)'],
  ghStep2a: ['', ''], ghStep2link: ['生成 token', 'Generate a token'], ghStep2b: ['（权限已填好。在 Repository access 选 Only select repositories，勾上 moyue-library，然后点 Generate token 并复制）', ' (permissions are prefilled. Under Repository access choose Only select repositories, tick moyue-library, then Generate token and copy it)'],
  ghStep3: ['把仓库名和 token 填到下面。每台设备填一次。', 'Enter the repository and token below, once on each device.'],
  ghRepo: ['仓库（用户名/仓库名）', 'Repository (owner/name)'],
  ghTokenNote: ['token 只保存在这台设备的浏览器里，用来直接访问 GitHub，不会发送到其他地方。', 'The token is kept only in this browser and is sent only to GitHub.'],
  ghDisconnect: ['断开', 'Disconnect'], ghDisconnected: ['已断开 GitHub 同步，本机数据保留', 'GitHub sync disconnected; local data kept'],
  ghConnectSync: ['连接并同步', 'Connect and sync'], ghFillBoth: ['请填写仓库名（用户名/仓库名）和 token。', 'Enter the repository (owner/name) and a token.'],
  ghChecking: ['正在检查仓库…', 'Checking repository…'],
  ghPublic: ['这个仓库是公开的，书和笔记会被所有人看到。请换成私有仓库。', 'This repository is public, so everyone could see your books and notes. Use a private repository.'],
  ghNoPush: ['token 没有这个仓库的写入权限，请把 Contents 设为 Read and write。', 'The token cannot write to this repository. Set Contents to Read and write.'],
  ghBadToken: ['token 无效或已过期', 'The token is invalid or expired'], ghForbidden: ['GitHub 拒绝了请求（{0}）', 'GitHub refused the request ({0})'],
  ghNotFound: ['找不到仓库，或 token 没有访问它的权限', 'Repository not found, or the token cannot access it'],
  ghConflict: ['多台设备同时写入，请稍后再同步', 'Another device was writing at the same time; sync again shortly'],
  ghConnectedToast: ['已连接 {0}，开始同步', 'Connected to {0}, syncing'], ghDone: ['同步完成', 'Sync complete'],
  ghTooBig: ['《{0}》超过 95 MB，只保存在本机，不上传', '"{0}" is over 95 MB and stays on this device only'],
  ghUploading: ['正在上传 {0}/{1}：{2}', 'Uploading {0}/{1}: {2}'], ghUploaded: ['已上传 {0} 本到 GitHub', 'Uploaded {0} items to GitHub'],
  ghDownloading: ['正在从 GitHub 下载《{0}》', 'Downloading "{0}" from GitHub'],
  getDesktop: ['下载桌面版', 'Desktop app'], getDesktopTitle: ['下载墨阅桌面版', 'Get the Moyue desktop app'], checkUpdate: ['检查更新', 'Check for updates'],
  updAvailShort: ['有新版本', 'Update available'], updAvail: ['墨阅 {0} 已发布，点“有新版本”下载', 'Moyue {0} is out. Use "Update available" to download it'],
  relLoading: ['正在查找最新版本…', 'Looking up the latest release…'], relOffline: ['暂时连不上 GitHub，可以直接打开发布页下载。', 'GitHub could not be reached. Open the releases page to download.'],
  relNone: ['安装包还在构建中，几分钟后再来看看。', 'The installers are still being built. Check back in a few minutes.'],
  relAll: ['所有版本', 'All releases'], relNotes: ['更新说明', 'Release notes'],
  curVersion: ['当前版本 {0}', 'Installed version {0}'], upToDate: ['已是最新版本', 'You have the latest version'],
  newVersion: ['新版本 {0}（{1}）可以下载：', 'Version {0} ({1}) is available:'], latestVersion: ['最新版本 {0}（{1}）', 'Latest version {0} ({1})'],
  dlMac: ['macOS 版（Apple 芯片与 Intel 通用）', 'macOS (Apple silicon and Intel)'], dlWin: ['Windows 版（64 位安装程序）', 'Windows (64-bit installer)'], dlMsi: ['需要 MSI 安装包？', 'Need an MSI installer?'],
  noteWin: ['Windows 首次运行若提示“Windows 已保护你的电脑”，点“更多信息”→“仍要运行”。', 'On Windows, if SmartScreen says it protected your PC, choose More info → Run anyway.'],
  noteMac: ['macOS 首次打开若提示无法验证开发者，到“系统设置 → 隐私与安全性”点“仍要打开”。', 'On macOS, if the developer cannot be verified, go to System Settings → Privacy & Security and choose Open Anyway.'],
  noteDesktop: ['桌面版自带所有组件，可离线使用，也能双击 PDF、EPUB 等文件直接打开。GitHub 同步需要在桌面版里再填一次 token。', 'The desktop app works offline and opens PDF, EPUB and other files by double-click. Enter your GitHub token once more in the app to sync.'],
  noteUpdate: ['下载后直接安装，会覆盖旧版本，书架和笔记都会保留。', 'Install it over the current version; your library and notes are kept.'],
  cloudOnly: ['云端', 'Cloud'], syncingState: ['正在同步阅读进度', 'Syncing reading position'],
  justNow: ['刚刚', 'just now'], minsAgo: ['{0} 分钟前', '{0} min ago'], hrsAgo: ['{0} 小时前', '{0} h ago'],
  sampleName: ['墨阅 · 试读', 'Moyue sample'],
  sampleMd: [`# 墨阅试读

这是一份内置的示例文档，用来试试排版、字体和各种阅读功能。点右上角的 **Aa**，可以分别给中文和英文选字体，再调字号、行距、段距和版心宽度。

## 一间安静的书房

傍晚的光从窗格里斜着进来，落在摊开的书页上。纸面微微泛黄，字一行一行排得很齐，像田埂上刚插好的秧苗。读书人不急，翻过一页，停一停，把刚才那句话在心里又念了一遍。

好的排版不让人注意到它自己。字距合适，行距宽松，段落之间留一点呼吸，眼睛顺着行走，不会在行尾迷路。中文正文常用宋体或楷体，英文则配一款气质相近的衬线字体，比如 Literata 或 EB Garamond，两种文字混在同一行里，也能相安无事。

> 试着选中这段文字：可以划线、换颜色、写笔记、复制，或者让系统读给你听。

## Reading in English

Good typography disappears. When the measure is comfortable and the leading is generous, the eye glides from one line to the next without effort. Mixed passages such as "FPGA 加速器 runs at 300 MHz" should look settled, with the Latin font and the Chinese font each doing their own job.

Press **D** to cycle themes, **T** for the table of contents, **B** to bookmark this spot, and **R** to have it read aloud.

## 代码与公式

\`\`\`verilog
module blink #(parameter N = 24) (input clk, output led);
  reg [N-1:0] cnt = 0;
  always @(posedge clk) cnt <= cnt + 1'b1;
  assign led = cnt[N-1];
endmodule
\`\`\`

行内公式 $e^{i\\pi} + 1 = 0$，以及独立公式：

$$\\hat{y}(n) = \\mathbf{W}_{out}\\,\\mathbf{x}(n), \\quad \\mathbf{x}(n) = \\tanh\\big(\\mathbf{W}_{in} u(n) + \\mathbf{W}\\mathbf{x}(n-1)\\big)$$

## 表格

| 格式 | 打开方式 | 说明 |
| --- | --- | --- |
| PDF | 原样渲染 | 支持目录、缩略图、搜索、划线、链接 |
| EPUB / MOBI / TXT | 重排 | 可换字体、分页或双页 |
| DOCX | 重排或原版式 | 右上角可切换 |
| XLSX / CSV | 表格 | 多个工作表用标签切换 |

## 快捷键

左右方向键翻页，空格向后翻，Ctrl / ⌘ + F 搜索，F 全屏，Z 沉浸阅读，A 自动滚屏，? 查看全部快捷键。

读完了？回到书架，把你自己的文件拖进来吧。`, `# Moyue sample

This built-in sample lets you try the typography, fonts and reading tools. Open **Aa** in the top right to pick a Chinese font and a Latin font separately, then adjust size, line spacing, paragraph spacing and page width.

## A quiet study

Evening light comes in at an angle and settles on the open page. The paper is faintly yellow, and the lines of type sit in tidy rows. The reader is in no hurry: turn a page, pause, and say the last sentence once more in your head.

Good typography disappears. When the measure is comfortable and the leading is generous, the eye glides from line to line and never loses its place at the end of one. Mixed passages such as "FPGA 加速器 runs at 300 MHz" should still look settled, with each script set in its own face.

> Try selecting this sentence: highlight it, change its colour, add a note, copy it, or have it read aloud.

## 中文段落

傍晚的光从窗格里斜着进来，落在摊开的书页上。好的排版不让人注意到它自己。字距合适，行距宽松，段落之间留一点呼吸。

## Code and maths

\`\`\`verilog
module blink #(parameter N = 24) (input clk, output led);
  reg [N-1:0] cnt = 0;
  always @(posedge clk) cnt <= cnt + 1'b1;
  assign led = cnt[N-1];
endmodule
\`\`\`

Inline maths $e^{i\\pi} + 1 = 0$ and a display equation:

$$\\hat{y}(n) = \\mathbf{W}_{out}\\,\\mathbf{x}(n), \\quad \\mathbf{x}(n) = \\tanh\\big(\\mathbf{W}_{in} u(n) + \\mathbf{W}\\mathbf{x}(n-1)\\big)$$

## Formats

| Format | How it opens | Notes |
| --- | --- | --- |
| PDF | Rendered as is | Outline, thumbnails, search, highlights, links |
| EPUB / MOBI / TXT | Reflowed | Change fonts, paginate, two-page spread |
| DOCX | Reflow or original | Switch in the top bar |
| XLSX / CSV | Grid | Sheet tabs for workbooks |

## Shortcuts

Arrow keys turn pages, Space pages forward, Ctrl / ⌘ + F searches, F is full screen, Z is focus mode, A auto-scrolls, and ? lists every shortcut.

Done? Go back to the library and drop in a file of your own.`],
};
