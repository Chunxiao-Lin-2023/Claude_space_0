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
  voice: ['声音', 'Voice'], voiceAuto: ['自动（按语言选择）', 'Automatic (by language)'], rate: ['语速', 'Rate'],
  noVoices: ['系统里没有可用的中文或英文语音。', 'No Chinese or English system voices are available.'],
  // more / misc
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
  ghUnlock: ['输入同步口令', 'Enter sync passphrase'], ghUnlockTitle: ['连接同步', 'Connect sync'],
  ghUnlockBody: ['输入你的同步口令，这台设备就会连上 {0}。每台设备只需输入一次。', 'Enter your sync passphrase to connect this device to {0}. Once per device.'],
  ghPassPh: ['同步口令', 'Sync passphrase'], ghPassWrong: ['口令不对，请再试一次。', 'Wrong passphrase, try again.'],
  ghLater: ['以后再说', 'Not now'], ghOther: ['用其他仓库', 'Use another repo'], ghUnlockGo: ['连接', 'Connect'],
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
