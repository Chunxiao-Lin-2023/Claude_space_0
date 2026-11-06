# 墨阅（Moyue Reader）

轻量的网页文档阅读器，支持 PDF、EPUB、MOBI/AZW3、FB2、TXT、DOCX、ODT、RTF、Markdown、HTML、代码、XLSX/CSV、PPTX、图片和 CBZ。

网址：https://chunxiao-lin-2023.github.io/Claude_space_0/reader/

## 跨设备同步（GitHub 私有仓库）

1. 在 GitHub 新建一个**私有**仓库，例如 `moyue-library`。
2. 创建 fine-grained token：Repository access 只选这个仓库，Permissions → Contents 设为 **Read and write**。
3. 打开墨阅 → 右上角「⋯」→「同步到 GitHub…」，填入 `用户名/仓库名` 和 token。每台设备填一次。

公开仓库会被拒绝，避免书和笔记被公开。token 只存在当前浏览器的 localStorage 里，只发给 api.github.com。

私有仓库里的内容：

| 路径 | 内容 |
| --- | --- |
| `library.json` | 书架：书名、格式、进度、封面缩略图、删除记录 |
| `books/<id>.<ext>` | 书本文件（单个 ≤ 95 MB，更大的只留在本机） |
| `state/<id>.json` | 每本书的阅读位置、书签、笔记、阅读时长 |
| `settings.json` | 主题、字体、排版设置，自定义字体列表 |
| `fonts/` | 上传的字体文件 |

合并规则：阅读位置以最后一次翻动的设备为准；书签和笔记按条目合并，删除会同步；设置以最后修改的为准。

## 开发

- 源码在 `src/`，`index.html` 是构建产物：`python3 reader/src/build.py`
- 其他构建：`build.py artifact <out>`（claude.ai 页面，无 GitHub 同步）、`build.py local <out>`（优先从 `./lib` 加载库，离线使用）。
- 本地存储前缀 `moyue.`，IndexedDB 库名 `moyue`。
- 解析库按需从 jsDelivr（备用 cdnjs）加载：pdf.js 3.11、JSZip、mammoth、docx-preview、SheetJS、marked、DOMPurify、highlight.js、KaTeX。
