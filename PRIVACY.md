# Privacy / 隐私说明

Applies to version 2.0.15. Based on inspection of the included source code.

## English

The extension includes no analytics, advertising code, or developer-operated data collection endpoint. It does not ask for a separate account or upload reading data to the developer. It is not an anonymity tool.

| Data / access | Purpose and location |
| --- | --- |
| Mode, language, width, theme | Saved locally with Chrome extension storage (`chrome.storage.local`); not Chrome sync storage. |
| Current page, within-page fraction, original reading URL and timestamp | Temporarily written to the website tab's `sessionStorage` when applying settings. Used once on a matching reload within five minutes, then removed when the reader next checks it. This is website-origin storage, not private extension storage, and can be accessed by scripts on that origin. |
| Gallery/reading HTML | Requested from the current website to discover page links and image addresses. Same-origin requests use the browser's existing website session. |
| Images | Requested from addresses supplied by the website, including its image servers. Those servers receive normal browser requests and may log them under their own policies. |
| Active tab | The settings popup queries the active tab ID and sends a reload message to the reader in that tab. |

The manifest requests only the `storage` permission and injects scripts only on `https://e-hentai.org/s/*`. It requests no history, cookies, downloads, or all-sites permissions. Using the existing website session does not mean the extension reads cookie values through the cookies API.

There is no separately maintained long-term reading history or extension-managed image download database. Browser-managed image caches may remain. Remove the extension to remove its extension settings; close the reading tab to end its normal session-storage lifetime. Website data and browser cache can also be cleared with Chrome's browsing-data controls.

If you report a problem through GitHub, anything you post in a public issue can be seen by other people. Remove private data first.

## 简体中文

代码不包含统计分析、广告代码或开发者收集数据的接口，不要求注册额外账户，也不会把阅读数据上传给开发者。本插件不是匿名工具。

- **本地设置**：模式、语言、宽度、背景保存在扩展本地存储，不使用 Chrome 同步存储。
- **临时位置**：应用设置时，把当前页、页内位置、原阅读网址及时间写入该网站标签页的 `sessionStorage`。相同网址在五分钟内刷新时可恢复，阅读器下次检查时移除记录。这属于网站存储，同源网站脚本也可以访问，不是扩展专属的私密存储。
- **网站请求**：为了获取页码链接和图片地址，会请求网站目录及阅读页；同源请求使用浏览器已有的网站会话。图片从网站提供的图片服务器加载，这些服务器可能按其自身政策记录请求。
- **当前标签页**：设置弹窗取得活动标签页编号，向对应阅读器发送刷新消息。
- **权限**：仅申请 `storage`，脚本只在 `https://e-hentai.org/s/*` 上运行；没有申请历史记录、Cookie 读取、下载或所有网站访问权限。
- **清理**：卸载扩展可删除扩展设置；关闭阅读标签页通常结束对应临时会话存储。浏览器自身的缓存或会话恢复可能保留数据，可在 Chrome 中清理网站数据与缓存。

插件没有单独保存长期阅读历史或建立图片下载数据库。在公开 GitHub Issue 中发送的内容会对外可见，反馈前请删除私人信息。
