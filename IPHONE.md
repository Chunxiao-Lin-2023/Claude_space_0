# iPhone 适配规范

所有游戏都要在 iPhone 上好玩（Safari 和「添加到主屏幕」两种方式），同时**桌面和 iPad 的样子完全不变**。

每个游戏由**它自己的会话**按这份规范适配：只改自己的文件夹，在自己的源码里改，再构建。不要去改别的游戏的文件。

## 测试视口

| 类型 | 尺寸（CSS px） |
| --- | --- |
| 竖屏手机 | 393×852（iPhone 15）、375×667（iPhone SE） |
| 横屏手机 | 852×393、852×340（Safari 带工具栏）、667×375（SE） |
| 回归 | 桌面 1280×800（无触屏）、iPad 1180×820 和 820×1180（触屏）——改前改后截图对比，必须一致 |

Playwright：`newContext({viewport, hasTouch:true, isMobile:true, deviceScaleFactor:1, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'})`。WebGL 游戏加 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`。点按钮前先 `scrollIntoViewIfNeeded()`。用 `python3 -m http.server` 从仓库根目录起服务，按 `/<game>/` 路径打开（游戏厅按钮依赖这个路径）。监听 `pageerror`。

## 手机专用媒体查询（保证桌面和 iPad 不受影响）

```css
@media (pointer:coarse) and (max-height:500px) { /* 横屏手机 */ }
@media (pointer:coarse) and (max-width:500px)  { /* 竖屏手机 */ }
```

```js
const PHONE = matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)');
// resize / orientationchange 时重新判断
```

iPad 最短边 ≥ 768，桌面是 `pointer:fine`，都不会命中。

## 要求

1. **两个方向都能用到每个界面**：标题/菜单、角色或关卡选择、游戏内 HUD、暂停菜单、回合间界面（商店/升级/结算/失败）、帮助和设置、所有弹窗。不能有被裁掉又滚不到的内容。
   - 弹窗和面板：`max-height: calc(100dvh - 16px)` + `overflow:auto`。
   - 超高的框不要用 `align-items:center` 垂直居中（顶部会被裁掉且滚不回来），用 `align-items: safe center` 或在滚动容器里 `margin:auto`。
   - 主要按钮（开始/继续/确认）在手机上尽量不用滚动就能点到（紧凑布局或底部吸附按钮栏）。
2. **HUD 放得下**：393 宽、340 高时按钮不重叠、不出屏。手机上字号和间距可以收紧，但点击目标 ≥ 40px。摇杆和技能键按手机尺寸缩小，不要盖住画面中央。
3. **安全区**：横屏时刘海/灵动岛占一侧约 59px，底部小白条约 21px。所有贴边元素（HUD、触屏按键、暂停键、小地图、底栏）都要偏移 `env(safe-area-inset-*)`，例如 `left: max(12px, env(safe-area-inset-left))`。viewport meta 必须有 `viewport-fit=cover`。Chromium 模拟不了安全区，靠代码检查。
4. **方向**：俯视角游戏两个方向都要能玩。横版游戏可以在竖屏游戏中显示「横屏体验更好」提示，带「继续竖屏」按钮（本次会话不再提示），不要强制锁死。
5. **性能**：画布/渲染器像素比上限 2（`Math.min(devicePixelRatio, 2)`）；WebGL 等重的游戏在手机上可以用 1.5。
6. **iOS 细节**：iPhone 没有全屏 API，`!(document.fullscreenEnabled||document.webkitFullscreenEnabled)` 时隐藏全屏按钮；游戏区域 `-webkit-touch-callout:none`、`user-select:none`；按钮 `touch-action:manipulation`；手机上输入框字号 ≥ 16px（否则 iOS 聚焦时会放大页面）；全屏高度用 `100dvh` 不用 `100vh`。
7. **改动小而集中**：优先追加手机媒体查询 CSS 和少量 JS 钩子，不重排、不挪代码；不改玩法、数值、美术、桌面和 iPad 布局。
8. **在源码里改**：源码在 `<game>/src/`，改完构建出 `<game>/index.html`，两者一起提交。开工前 `git pull --rebase`，先确认从源码构建出来的文件和仓库里的 `index.html` 一致——**不一致说明别人直接改过 `index.html`，先把那些改动合进源码**（例如游戏厅按钮），再开始。

## 2026-10-11 审计发现（393×852 与 852×393）

- **机巧百战**：竖屏 HUD 右上角溢出，声音和暂停按钮在屏幕外；竖屏暂停框左侧被裁；开始按钮在菜单下方两三屏。
- **云岛冒险**：竖屏游戏中顶部按钮和角色面板重叠，触屏按键很大、盖住画面；横屏标题面板、创建角色面板、菜单窗口（`#wMenu`）超出屏幕底部；菜单里的「全屏」按钮在 iPhone 上无效。另外：本游戏仓库里只有构建产物，**源码请提交到 `cloudisle/src/`**；`index.html` 里已有别的会话加的游戏厅按钮（`#bHub`、`#mHub`），重新构建前先合进源码。
- **裂隙守卫**：竖屏基本可用；横屏暂停框比屏幕高且垂直居中，顶部「已暂停 / 继续」被裁且滚不到；横屏标题和选关要滚动才能点到开始；竖屏顶部波次框挤到右侧按钮。
- **沙丘乱斗**：竖屏和横屏都能玩；横屏点暂停后看不到暂停面板（待查）；标题面板里「开战」在竖屏要滚动，横屏六张大英雄卡要滚很久。
- 均未检查：回合间/结算界面、帮助、联机房间、各种弹窗——适配时都要过一遍。
