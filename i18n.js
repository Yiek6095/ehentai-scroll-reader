'use strict';
globalThis.readerI18n = (() => {
  let language = 'en';
  const roots = new Set(), originals = new WeakMap(), attributes = new WeakMap();
  const dictionary = {
    '模式和语言将在点击“应用并刷新”后一起保存。取消或关闭不会保存这次选择。':'Mode and language are saved together when you click Apply and reload. Cancel or close to discard your changes.',
    '选择模式和语言后，点击应用一起保存并刷新当前阅读页。':'Choose a mode and language, then click Apply to save both and reload the current reader.',
    '全部加载完成':'All images loaded',
    '部分图片加载失败，可点击重试':'Some images failed. Click retry to try again.',
    '已暂停加载':'Loading paused',
    '上下滚动以加载附近的图片':'Scroll up or down to load nearby images',
    '关闭设置':'Close settings',
    '继续获取后续图片。':'Resume loading more images.',
    '暂停获取后续图片；已加载的图片仍可阅读，进行中的请求会继续完成。':'Stop starting new image loads. Loaded images remain readable; requests already in progress may finish.',
    '语言':'Language','连续滚动':'Scroll Reader','阅读模式':'Reading mode','每次加载 10 页 · 默认':'Load 10 pages at a time · Default','每次加载 10 页':'Load 10 pages at a time','全部加载':'Load all pages',
    '两种模式均保留整本页面，并定位到你打开的页码，可向上或向下阅读。图片加载失败时会重新获取地址并自动重试一次；仍失败可手动重试。':'Both modes keep every page and start at the page you opened. Scroll up or down to read. Failed images get a fresh URL and one automatic retry; you can retry manually if needed.',
    '随滚动按每批 10 页加载，支持向上和向下阅读，无需点击按钮。':'Automatically load the next batch of 10 pages as you scroll up or down.',
    '整本图片并行加载，无需滚动触发；消耗更多流量与内存。':'Load all pages without waiting for you to scroll. Uses more data and memory.',
    '应用并刷新当前阅读页':'Apply and reload reader','应用并刷新':'Apply and reload','取消':'Cancel','设置':'Settings','原网页':'Original','回到滚动阅读':'Back to reader','宽度':'Width','漫画宽度':'Image width','切换黑白背景':'Switch background theme','白色背景':'Light mode','黑色背景':'Dark mode',
    '暂停加载':'Pause loading','继续加载':'Resume loading','重试失败项':'Retry failed','原页':'Original','重新获取图片':'Refresh image','等待获取图片…':'Waiting for image…','等待重试…':'Waiting to retry…','正在获取图片…':'Fetching image…','图片加载中…':'Loading image…','正在重新获取图片地址…':'Getting a fresh image URL…','图片加载失败':'Image failed to load','全部页面已显示':'All pages are displayed','向下滚动，自动接上下一批 10 页':'Scroll down to load the next batch of 10',
    '设置未保存，请重试':'Could not save settings. Please retry.','应用后会刷新当前漫画页，并记住所选模式。':'Applying reloads this reader and remembers your selected mode.','正在读取设置…':'Loading settings…','当前选择已显示。':'Your saved selection is shown.','无法读取设置，请关闭后重新打开。':'Could not read settings. Close and reopen this panel.','已保存，正在应用…':'Saved. Applying…','已应用，阅读页正在刷新。':'Applied. Reloading the reader…','保存失败，请重试。':'Could not save. Please retry.','已保存。当前标签不是可连接的阅读页；下次打开阅读页会使用新模式。':'Saved. This tab is not an available reader. New reader pages will use this mode.','应用时会自动刷新当前阅读页。以后打开的阅读页会记住你的选择。':'Applying automatically reloads the current reader. Your selection is remembered for future pages.','两种模式':'Loading modes',
    '未找到阅读图片。可能需要登录、完成验证，或网站布局已改变。':'Image not found. Sign in, complete verification, or check for website layout changes.','图片地址无法使用。':'The image URL is unavailable.','无法识别下一页链接，请切回原网页查看。':'Next-page link not found. Check the original page.','网页跳转，请在原网页完成登录或验证':'Page redirected. Sign in or complete verification on the original page.','部分页面地址未找到，请重试或检查原网页':'Some page URLs were not found. Retry or check the original page.'
  };
  function translate(value) {
    const trimmed=value.trim();
    if(dictionary[trimmed])return value.replace(trimmed,dictionary[trimmed]);
    const result = value
      .replace(/连续滚动 · (v[\d.]+) · (.+)/g,(_,v,m)=>`Continuous reader · ${v} · ${dictionary[m]||m}`)
      .replace(/打开第 (\d+) 页；第 1—(\d+) 页均保留，可向上或向下阅读。/g,'Opened at page $1. All $2 pages are available; scroll up or down.')
      .replace(/图片按每批 10 页随滚动加载。/g,' Images load in batches of 10 as you scroll.')
      .replace(/共 (\d+) 页 · 已加载 (\d+) 页/g,'$1 pages · $2 loaded')
      .replace(/ · 失败 (\d+)/g,' · Failed: $1').replace(/ · 已暂停/g,' · Paused')
      .replace(/第 (\d+) 页 \/ (\d+)/g,'Page $1 / $2').replace(/第 (\d+) 页/g,'Page $1')
      .replace(/网站返回 (\d+)/g,'Server returned $1').replace(/，可重新获取/g,' — refresh to retry');
    return Object.keys(dictionary).sort((a,b)=>b.length-a.length).reduce((text,key)=>text.split(key).join(dictionary[key]),result);
  }
  function text(node) {
    const current=node.nodeValue;
    let original=originals.get(node);
    if(!original || (current!==original.zh && current!==original.en))original={zh:current,en:translate(current)};
    originals.set(node,original);
    const target=language==='en'?original.en:original.zh;
    if(current!==target)node.nodeValue=target;
  }
  function visit(root) {
    const walk=node=>{
      if(node.nodeType===3){text(node);return;}
      if(node.nodeType===1){
        if(['SCRIPT','STYLE','SELECT','OPTION'].includes(node.tagName))return;
        let saved=attributes.get(node)||{};
        for(const name of ['alt','aria-label','title'])if(node.hasAttribute(name)){
          const current=node.getAttribute(name);let item=saved[name];
          if(!item || (current!==item.zh && current!==item.en))item={zh:current,en:translate(current)};
          saved[name]=item;const target=language==='en'?item.en:item.zh;
          if(current!==target)node.setAttribute(name,target);
        }
        attributes.set(node,saved);
      }
      for(const child of node.childNodes||[])walk(child);
    };
    walk(root);
    for(const select of root.querySelectorAll?.('[data-reader-language]')||[])if(select.dataset.dirty!=='true')select.value=language;
  }
  function refresh(){for(const root of roots)visit(root);}
  const ready=chrome.storage.local.get({language:'en'}).then(data=>{language=data.language==='zh'?'zh':'en';refresh();}).catch(()=>{});
  function mount(root, container, options = {}) {
    if(!roots.has(root)){
      const palette=document.createElement('style');
      palette.textContent=`
        select[data-reader-language]{
          --language-bg:#242730;--language-fg:#f2f4f8;--language-border:#929aab;
          background-color:var(--language-bg);color:var(--language-fg);color-scheme:dark;
          border:1px solid var(--language-border)
        }
        :host([data-theme="light"]) select[data-reader-language]{
          --language-bg:#ffffff;--language-fg:#20242b;--language-border:#6c7587;color-scheme:light
        }
        select[data-reader-language] option{background-color:var(--language-bg);color:var(--language-fg)}
        select[data-reader-language]:focus-visible{outline:2px solid #518bea;outline-offset:2px}
      `;
      (root.nodeType===9?root.head:root).append(palette);
      roots.add(root);
      new MutationObserver(changes=>{
        for(const change of changes){
          if(change.type==='childList')for(const node of change.addedNodes)visit(node);
          else visit(change.target);
        }
      }).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['alt','aria-label','title']});
    }
    if(container && !container.querySelector('[data-reader-language]')){
      const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0';
      const select=document.createElement('select');select.dataset.readerLanguage='';if(options.deferred)select.dataset.deferred='true';select.setAttribute('aria-label','Language / 语言');
      select.innerHTML='<option value="zh">中文</option><option value="en">English</option>';
      select.style.cssText='font:inherit;padding:5px;border-radius:6px';
      const caption=document.createElement('span');caption.textContent='语言';label.append(caption,select);container.append(label);
      select.onchange=async()=>{
        if(options.deferred){select.dataset.dirty='true';return;}
        select.disabled=true;
        try{await chrome.storage.local.set({language:select.value});language=select.value;refresh();}
        catch{select.value=language;alert(language==='en'?'Could not save language. Please retry.':'语言保存失败，请重试。');}
        finally{select.disabled=false;}
      };
    }
    visit(root);ready.then(()=>visit(root));
  }
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.language){language=changes.language.newValue==='zh'?'zh':'en';refresh();}});
  if(location.protocol==='chrome-extension:')document.addEventListener('DOMContentLoaded',()=>mount(document,document.querySelector('#settings'),{deferred:true}));
  return {mount,ready};
})();
