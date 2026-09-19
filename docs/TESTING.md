# Verification and troubleshooting / 验证与排查

## Verification scope

Automated checks use local Chrome, synthetic HTML/images, and mocked extension APIs. They do not contact E-Hentai, validate real login behavior, or establish that Chrome has accepted the extension through its installation UI.

- JavaScript syntax and manifest-referenced files.
- Both settings surfaces show only batch/all modes in English and Chinese.
- No saved mode defaults to batch; obsolete saved mode falls back to batch.
- Applying mode/language preserves page 35 at the same relative position after opening page 25.
- A fresh direct link to page 10 still starts at page 10.
- Successful-image progress, natural image ratios, one automatic retry and manual retry.
- Sample reader screenshots use intercepted local fixtures only.

## Before a public release

Perform these manual checks in a clean Chrome profile:

1. Extract the release ZIP and load its manifest folder through chrome://extensions; check for extension errors.
2. Open an accessible real reading page in the middle of a book. Confirm pages exist above and below.
3. In default mode, scroll forward and back across batch boundaries.
4. Select all-pages mode and apply. Confirm loading continues without scrolling.
5. Change language, width and theme; verify saved choices after reload. Cancel a settings draft and verify it is discarded.
6. Read further, apply settings, and confirm the current reading position is retained.

## 故障排查

- **无法加载扩展**：先解压，选择直接包含 manifest.json 的文件夹，而不是 ZIP 或更外层目录。
- **没有出现阅读界面**：确认网址为 https://e-hentai.org/s/ 开头，并且原网页图片可见；登录或验证需在原网站完成。网站布局变化也可能导致插件无法启动，当前不会显示专门的启动失败提示。
- **部分图片失败或一直等待**：回到原网页检查网络、访问状态或目录是否可用，再使用重新获取图片/重试失败项。此版本的目录发现仍可能受目录请求失败影响。
- **变卡或内存较高**：使用默认 10 页模式，关闭其他漫画标签页；已加载图片仍会留在页面中。
- **安装新版后没有变化**：关闭其他版本，在扩展管理页重新加载正确的扩展，再刷新阅读页。
- **暂停后仍有图片出现**：已开始的请求会继续完成，这是当前行为。

以上自动化验证不是实际网站兼容性保证。发布前的人工安装与网站检查仍需完成。
