'use strict';
globalThis.openReaderSettings = async (shadow, currentMode) => {
  let dialog = shadow.querySelector('#reader-settings-dialog');
  if (dialog) { if (!dialog.open) dialog.showModal(); return; }
  dialog = document.createElement('dialog');
  dialog.id = 'reader-settings-dialog';
  dialog.innerHTML = `<style>
    #reader-settings-dialog{position:fixed;inset:0;margin:auto;width:min(440px,90vw);max-height:85vh;overflow:auto;padding:24px;border:1px solid #596174;border-radius:14px;background:#242730;color:#e8e9ed;text-align:left;font:14px/1.6 system-ui;box-shadow:0 20px 80px #0008}
    #reader-settings-dialog::backdrop{background:#0009}
    #reader-settings-dialog h2{font-size:20px;margin:0 0 16px;padding-right:44px}
    #reader-settings-dialog label{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid #596174;border-radius:8px;margin:10px 0}
    #reader-settings-dialog input{width:auto;margin-top:5px}
    #reader-settings-dialog strong,#reader-settings-dialog small{display:block}
    #reader-settings-dialog small{color:#bac3d5}#reader-settings-dialog .actions{display:flex;gap:10px;margin-top:18px}
    #reader-settings-dialog button{font:inherit;padding:7px 12px;border:1px solid #727c92;border-radius:7px;background:#373d4c;color:#fff;cursor:pointer}
    #reader-settings-dialog button[type=submit]{background:#b6ccff;color:#142344}
    #reader-settings-dialog #dismiss-settings{position:absolute;right:16px;top:16px;width:36px;height:36px;padding:0;display:grid;place-items:center;font-size:26px;line-height:1;border-color:transparent;background:transparent;color:inherit}
    #reader-settings-dialog #dismiss-settings:hover{background:#80808030}
    #reader-settings-dialog #dismiss-settings:focus-visible{outline:2px solid #729de9;outline-offset:2px}
  </style><button type="button" id="dismiss-settings" aria-label="关闭设置" title="关闭设置">×</button><form><h2>阅读模式</h2><p>两种模式均保留整本页面，并定位到你打开的页码，可向上或向下阅读。图片加载失败时会重新获取地址并自动重试一次；仍失败可手动重试。</p>
  <label><input type="radio" name="mode" value="batch"><span><strong>每次加载 10 页 · 默认</strong><small>随滚动按每批 10 页加载，支持向上和向下阅读，无需点击按钮。</small></span></label>
  <label><input type="radio" name="mode" value="all"><span><strong>全部加载</strong><small>整本图片并行加载，无需滚动触发；消耗更多流量与内存。</small></span></label>
  <div class="actions"><button type="submit">应用并刷新</button><button type="button" id="close-settings">取消</button></div>
  <p role="status">模式和语言将在点击“应用并刷新”后一起保存。取消或关闭不会保存这次选择。</p></form>`;
  shadow.append(dialog);
  dialog.querySelector(`input[value="${currentMode}"]`).checked = true;
  dialog.querySelector('#close-settings').onclick = () => dialog.close();
  dialog.querySelector('#dismiss-settings').onclick = () => dialog.close();
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const mode = dialog.querySelector('input[name="mode"]:checked')?.value;
    if (!['batch','all'].includes(mode)) return;
    const button = dialog.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const language=dialog.querySelector('[data-reader-language]').value;
      if(!['zh','en'].includes(language))throw new Error('Invalid language');
      await chrome.storage.local.set({mode,language});
      globalThis.prepareReaderReload?.();
      location.reload();
    } catch {
      dialog.querySelector('[role="status"]').textContent = '保存失败，请重试。';
      button.disabled = false;
    }
  };
  dialog.addEventListener('close', () => { dialog.remove(); shadow.querySelector('#settings')?.focus(); });
  globalThis.readerI18n.mount(shadow,dialog.querySelector('form'),{deferred:true});
  dialog.showModal();
};
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id === chrome.runtime.id && message?.type === 'reload-reader') {
    try {globalThis.prepareReaderReload?.();}
    catch {respond({ok:false});return;}
    respond({ok:true});
    setTimeout(() => location.reload(), 100);
  }
});
