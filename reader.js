(async () => {
  const mode = await globalThis.scrollReaderMode;
  'use strict';
  if (document.getElementById('continuous-reader-host')) return;
  const preferences = await chrome.storage.local.get({width:1000, theme:'dark'}).catch(()=>({width:1000,theme:'dark'}));
  const entry = new URL(location.href);
  const pageInfo = url => {
    const match = url.pathname.match(/^\/s\/[^/]+\/(\d+)-(\d+)\/?$/);
    return match ? { gallery: match[1], number: Number(match[2]) } : null;
  };
  const initial = pageInfo(entry);
  if (!initial || !document.querySelector('#img')) return;
  const pageURL = (value, base) => {
    try {
      const url = new URL(value, base);
      const info = pageInfo(url);
      return url.origin === entry.origin && info?.gallery === initial.gallery ? url : null;
    } catch { return null; }
  };
  function parse(doc, url) {
    const source = doc.querySelector('#img');
    if (!source?.getAttribute('src')) throw new Error('未找到阅读图片。可能需要登录、完成验证，或网站布局已改变。');
    const image = new URL(source.getAttribute('src'), url);
    if (!['https:', 'http:'].includes(image.protocol)) throw new Error('图片地址无法使用。');
    const current = pageInfo(url).number;
    const links = [...doc.querySelectorAll('a[href]')]
      .map(a => pageURL(a.getAttribute('href'), url)).filter(Boolean);
    const next = links.find(link => pageInfo(link).number === current + 1) || null;
    const previous = links.find(link => pageInfo(link).number === current - 1) || null;
    const first = links.find(link => pageInfo(link).number === 1) || null;
    const spans = [...doc.querySelectorAll('.sn span')].map(s => Number(s.textContent.replace(/,/g, '').trim()));
    const total = spans.length >= 2 && spans[1] >= current ? spans[1] : null;
    if (!next && total && current < total) throw new Error('无法识别下一页链接，请切回原网页查看。');
    return { image: image.href, next, first, previous, current, total };
  }
  let firstData;
  try { firstData = parse(document, entry); } catch { return; }
  const BATCH = mode === 'batch';
  if (!firstData.total) return;
  const total = firstData.total;
  const positionKey = 'eh-scroll-reader:settings-reload';
  let restoredPosition = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(positionKey) || 'null');
    sessionStorage.removeItem(positionKey);
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload' &&
        saved?.url === entry.href && Date.now()-saved.time >= 0 && Date.now()-saved.time < 300000 &&
        Number.isInteger(saved.page) && saved.page >= 1 && saved.page <= total &&
        Number.isFinite(saved.fraction) && saved.fraction >= 0 && saved.fraction <= 1) restoredPosition = saved;
  } catch {}
  const openingPage = restoredPosition?.page || initial.number;
  const start = 1;
  const remaining = total - start + 1;
  const urls = new Map([[initial.number, entry]]);
  if (firstData.first) urls.set(1, firstData.first);
  const host = document.createElement('div');
  host.id = 'continuous-reader-host';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
    :host{overflow-anchor:none;display:block;background:#17191e;color:#e8e9ed;min-height:100vh;font:14px/1.6 system-ui;text-align:center;color-scheme:dark}
    [hidden]{display:none!important}*{box-sizing:border-box}
    header{position:sticky;top:0;z-index:20;background:#242730f5;padding:12px;display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap}
    button{font:inherit;color:inherit;background:#373d4c;border:1px solid #636b7e;border-radius:7px;padding:5px 12px;cursor:pointer}a{color:#a9c9ff}
    main{max-width:var(--width,1000px);margin:auto}figure{margin:0}figcaption{padding:8px}
    .page{position:relative;aspect-ratio:var(--ratio,.7);background:#20232b;display:flex;align-items:center;justify-content:center}
    .page img{min-height:0;display:block;width:100%;height:100%;object-fit:contain}.page span{position:absolute;padding:12px;background:#20232be6;border-radius:8px}
    footer{padding:24px;min-height:80px}#help{padding:10px;color:#b7bed0}#resume{position:fixed;top:12px;right:16px;z-index:2147483647}
    :host([data-theme="light"]){background:#f5f5f5;color:#20242b;color-scheme:light}
    :host([data-theme="light"]) header{background:#fffffff5;border-bottom:1px solid #ccc}
    :host([data-theme="light"]) button{background:#eee;color:#20242b;border-color:#999}
    :host([data-theme="light"]) a{color:#2459a5}
    :host([data-theme="light"]) .page,:host([data-theme="light"]) .page span{background:#e5e5e5}
    :host([data-theme="light"]) #help{color:#555}
    :host([data-theme="light"]) #reader-settings-dialog{background:#fff;color:#20242b}
    :host([data-theme="light"]) #reader-settings-dialog small{color:#555}
    :host([data-theme="light"]) #reader-settings-dialog button{background:#eee;color:#20242b}
    header{background:#242730;padding:12px 20px;gap:12px 24px;justify-content:space-between;font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;border-bottom:1px solid #434a58}
    .reader-summary{display:flex;flex-direction:column;gap:4px;flex:0 1 auto;text-align:left}
    .reader-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .reader-title strong{font-size:17px;font-weight:650;white-space:nowrap}
    .version{font-size:12px;color:#b7bed0}
    .mode-badge{font-size:13px;padding:3px 9px;border-radius:6px;background:#354259;color:#dce8ff;white-space:nowrap}
    #status{font-size:14px;color:#c6cedb;font-variant-numeric:tabular-nums}
    #toolbar-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;min-width:0}
    #toolbar-actions button,#toolbar-actions select{font:inherit;min-height:40px;padding:7px 12px;border-radius:8px;white-space:nowrap;flex-shrink:0}
    #toolbar-actions label{display:flex;align-items:center;gap:8px;white-space:nowrap}
    #toolbar-actions input{font:inherit}
    #width{width:110px;min-width:60px;accent-color:#729de9}
    #width-number{height:38px;padding:4px 7px;border:1px solid #788298;border-radius:6px;font-variant-numeric:tabular-nums}
    #preference-status:empty{display:none}
    :host([data-theme="light"]) header{background:#fff;border-color:#d8dde5}
    :host([data-theme="light"]) header button{background:#f5f6f8;border-color:#c8ced8}
    :host([data-theme="light"]) .mode-badge{background:#e9effa;color:#2a4e85}
    :host([data-theme="light"]) #status,:host([data-theme="light"]) .version{color:#596273}
    @media(max-width:1200px){#toolbar-actions{flex:1 1 100%;justify-content:flex-start}header{gap:10px}.reader-summary{flex-direction:row;align-items:center;gap:16px;flex-wrap:wrap}}
    @media(max-width:600px){header{padding:10px;font-size:14px}#width{width:75px}.reader-title strong{font-size:16px}.reader-summary{gap:6px}#toolbar-actions{gap:6px}}
  </style><div id="reader"><header><div class="reader-summary"><div class="reader-title"><strong>连续滚动</strong><span class="version">v2.0.14</span><span class="mode-badge">${BATCH ? '每次加载 10 页' : '全部加载'}</span></div><span id="status" role="status"></span></div><div id="toolbar-actions"><button id="pause">暂停加载</button><button id="retry" hidden>重试失败项</button><label class="width-control">宽度 <input id="width" type="range" min="400" max="1600" step="10" value="1000"><input id="width-number" aria-label="漫画宽度" type="number" min="400" max="1600" step="10" value="1000" style="width:76px"> px</label><button id="theme" aria-label="切换黑白背景">白色背景</button><span id="preference-status" role="status"></span><button id="settings">设置</button><button id="original">原网页</button></div></header><div id="help"></div><main></main><footer id="sentinel"></footer></div><button id="resume" hidden>回到滚动阅读</button>`;
  const q = selector => shadow.querySelector(selector);
  q('#settings').onclick = () => globalThis.openReaderSettings(shadow, mode);
  const main = q('main');
  let preferredWidth = Math.min(1600,Math.max(400,Number(preferences.width)||1000));
  function applyWidth(value) {
    preferredWidth = Math.min(1600,Math.max(400,Number(value)||preferredWidth));
    main.style.setProperty('--width', preferredWidth+'px');
    q('#width').value=preferredWidth;
    q('#width-number').value=preferredWidth;
  }
  async function savePreference(value) {
    try { await chrome.storage.local.set(value);q('#preference-status').textContent=''; }
    catch {q('#preference-status').textContent='设置未保存，请重试';}
  }
  function applyTheme(theme) {
    host.dataset.theme=theme==='light'?'light':'dark';
    q('#theme').textContent=host.dataset.theme==='light'?'黑色背景':'白色背景';
  }
  applyWidth(preferredWidth);applyTheme(preferences.theme);
  q('#theme').onclick=()=>{applyTheme(host.dataset.theme==='light'?'dark':'light');savePreference({theme:host.dataset.theme});};
  q('#width-number').onchange=e=>{applyWidth(e.target.value);savePreference({width:preferredWidth});checkBottom();};
  q('#width').onchange=()=>savePreference({width:preferredWidth});
  document.body.prepend(host);
  const style = document.createElement('style');
  style.textContent = 'html.continuous-reader-active body{margin:0!important;padding:0!important;min-width:0!important}html.continuous-reader-active body>*:not(#continuous-reader-host){display:none!important}';
  document.head.append(style);
  document.documentElement.classList.add('continuous-reader-active');
  q('#help').textContent = `打开第 ${openingPage} 页；第 1—${total} 页均保留，可向上或向下阅读。${BATCH ? '图片按每批 10 页随滚动加载。' : ''}`;
  const initialImage = document.querySelector('#img');
  const ratio = initialImage.naturalWidth && initialImage.naturalHeight ? initialImage.naturalWidth / initialImage.naturalHeight : .7;
  main.style.setProperty('--ratio', String(ratio));
  const records = new Map();
  let readingPage = openingPage;
  let shown = start - 1, active = 0, paused = false, discovering = false, discoveryDone = false, discoveryError = '';
  // Only HTML lookups are bounded. Image downloads start eagerly and never block other pages.
  const HTML_CONCURRENCY = 6;
  function status() {
    q('#pause').title = paused ? '继续获取后续图片。' : '暂停获取后续图片；已加载的图片仍可阅读，进行中的请求会继续完成。';
    q('#pause').setAttribute('aria-pressed',String(paused));
    const ready = [...records.values()].filter(r => r.state === 'ready').length;
    const errors = [...records.values()].filter(r => r.state === 'error').length;
    q('#status').textContent = `共 ${total} 页 · 已加载 ${ready} 页${ready === total ? ' · 全部加载完成' : ''}${errors ? ` · 失败 ${errors}` : ''}${paused ? ' · 已暂停' : ''}`;
    q('#retry').hidden = !errors && !discoveryError;
    q('#sentinel').textContent = ready === total ? '全部加载完成' : (discoveryError || (errors ? '部分图片加载失败，可点击重试' : paused ? '已暂停加载' : BATCH ? '上下滚动以加载附近的图片' : '图片加载中…'));
  }
  function reveal() {
    if (paused || shown >= total) return;
    const end = total;
    for (let number = shown + 1; number <= end; number++) {
      const figure = document.createElement('figure');
      const caption = document.createElement('figcaption');
      caption.textContent = `第 ${number} 页 / ${total} `;
      const link = document.createElement('a');
      link.textContent = '原页';link.target = '_blank';link.rel = 'noopener';link.hidden = true;
      caption.append(link);
      const frame = document.createElement('div');frame.className = 'page';
      const img = document.createElement('img');img.loading = 'eager';img.decoding = 'async';img.alt = `第 ${number} 页`;img.hidden = true;
      const message = document.createElement('span');message.textContent = '等待获取图片…';
      const retry = document.createElement('button');retry.textContent = '重新获取图片';retry.hidden = true;
      const record = {number,figure,frame,img,message,retry,link,state:'queued',attempts:0,eligible:!BATCH || (number>=openingPage && number<openingPage+10)};
      retry.onclick = () => {if(record.state !== 'error')return;record.state='queued';record.attempts=0;retry.hidden=true;record.message.textContent='等待重试…';pump();};
      caption.append(' ',retry);frame.append(img,message);figure.append(caption,frame);main.append(figure);
      records.set(number,record);
    }
    shown = end;
    status();pump();
  }
  async function html(url) {
    const response = await fetch(url.href,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`网站返回 ${response.status}`);
    const actual = new URL(response.url);
    if(actual.origin !== entry.origin || actual.pathname !== url.pathname)throw new Error('网页跳转，请在原网页完成登录或验证');
    return new DOMParser().parseFromString(await response.text(),'text/html');
  }
  async function resolveImage(record) {
    try {
      const url = urls.get(record.number);
      record.link.href=url.href;record.link.hidden=false;
      record.message.textContent='正在获取图片…';
      const data = record.number===initial.number && !record.attempts ? firstData : parse(await html(url),url);
      if(data.next)urls.set(data.current+1,data.next);
      startImage(record,data.image);
    } catch(error) { fail(record,error.message); }
    finally { active--;pump();status(); }
  }
  function fail(record,reason) {
    record.img.hidden=true;record.message.hidden=false;
    record.message.textContent=`${reason}，可重新获取`;
    record.state='error';record.retry.hidden=false;status();
  }
  function restoreReadingPosition(position) {
    const target=records.get(position.page)?.figure;
    if(!target)return;
    const rect=target.getBoundingClientRect();
    const line=q('header').getBoundingClientRect().bottom+8;
    const delta=rect.top+position.fraction*rect.height-line;
    if(Math.abs(delta)>.5)window.scrollTo({top:Math.max(0,scrollY+delta),behavior:'instant'});
  }
  function applyImageRatio(record) {
    const width=record.img.naturalWidth,height=record.img.naturalHeight;
    if(!width||!height)return;
    const visible=!q('#reader').hidden;
    const position=visible?captureReadingPosition():null;
    record.frame.style.aspectRatio=String(width/height);
    if(position)restoreReadingPosition(position);
  }
  function startImage(record,source) {
    return new Promise(done => {
    record.state='image';record.img.hidden=false;record.message.textContent='图片加载中…';
    let timer;
    const cleanup=()=>{clearTimeout(timer);record.img.onload=null;record.img.onerror=null;};
    const failure=()=>{
      cleanup();record.img.removeAttribute('src');
      if(record.attempts < 1) {
        record.attempts++;record.state='cooldown';record.message.textContent='正在重新获取图片地址…';
        setTimeout(()=>{record.state='queued';pump();},1500);
      } else fail(record,'图片加载失败');
      done();
    };
    record.img.onload=()=>{
      cleanup();done();record.state='ready';record.message.hidden=true;record.retry.hidden=true;
      applyImageRatio(record);
      status();
    };
    record.img.onerror=failure;
    timer=setTimeout(failure,120000);
    record.img.src=source;
    });
  }
  function pump() {
    if(paused)return;
    for(const record of [...records.values()].sort((a,b) => {
      const anchor = readingPage;
      const rank = n => n>=anchor ? n-anchor : total+anchor-n;
      return rank(a.number)-rank(b.number);
    })) {
      if(active>=HTML_CONCURRENCY)break;
      if(record.state!=='queued'||!record.eligible||!urls.has(record.number))continue;
      record.state='html';active++;resolveImage(record);
    }
  }
  function galleryURL(value,base) {
    try {
      const url=new URL(value,base);
      return url.origin===entry.origin && new RegExp(`^/g/${initial.gallery}/[^/]+/?$`).test(url.pathname) ? url : null;
    }catch{return null;}
  }
  async function discover() {
    if(discovering || discoveryDone || paused)return;
    discovering=true;discoveryError='';
    try {
      const gallery=[...document.querySelectorAll('a[href]')].map(a=>galleryURL(a.getAttribute('href'),entry)).find(Boolean);
      if(gallery) {
        gallery.search='';gallery.hash='';
        const pending=[gallery],visited=new Set();
        while(pending.length && urls.size < remaining && !paused) {
          const url=pending.shift();if(visited.has(url.href))continue;visited.add(url.href);
          const doc=await html(url);
          for(const a of doc.querySelectorAll('a[href]')) {
            const href=a.getAttribute('href');const page=pageURL(href,url);
            if(page){const n=pageInfo(page).number;if(n>=start && n<=total)urls.set(n,page);}
            const index=galleryURL(href,url);
            if(index && index.pathname===gallery.pathname) {
              const p=Number(index.searchParams.get('p') || 0);
              if(Number.isInteger(p)&&p>=0&&p<total){index.search='';if(p)index.searchParams.set('p',String(p));index.hash='';if(!visited.has(index.href)&&!pending.some(u=>u.href===index.href))pending.push(index);}
            }
          }
          pump();
          if(urls.size<remaining)await new Promise(resolve=>setTimeout(resolve,300));
        }
      }
      let backward=firstData;
      const backwardSeen=new Set();
      while(!paused && backward.previous && !urls.has(1)){
        const previous=backward.previous;
        const n=pageInfo(previous).number;
        if(backwardSeen.has(n))break;backwardSeen.add(n);
        urls.set(n,previous);pump();
        if(n===1)break;
        backward=parse(await html(previous),previous);
      }
      // Some reader layouts omit the gallery link. Walk their HTML links independently of image downloads.
      let cursor=urls.get(start);
      const visited=new Set();
      while(urls.size<remaining && cursor && !paused) {
        const n=pageInfo(cursor).number;
        if(visited.has(n))break;visited.add(n);
        if(urls.has(n+1)){cursor=urls.get(n+1);continue;}
        const data=n===initial.number ? firstData : parse(await html(cursor),cursor);
        if(!data.next)break;urls.set(n+1,data.next);cursor=data.next;pump();
      }
      discoveryDone=urls.size>=remaining;
      if(!paused && !discoveryDone)throw new Error('部分页面地址未找到，请重试或检查原网页');
    }catch(error){discoveryError=error.message;}
    finally{discovering=false;status();pump();}
  }
  let checkPending=false;
  function checkBottom() {
    if(checkPending)return;checkPending=true;
    requestAnimationFrame(()=>{
      checkPending=false;
      if(paused || q('#reader').hidden)return;
      let nearest=null, distance=Infinity;
      for(const record of records.values()){
        const rect=record.figure.getBoundingClientRect();
        if(Math.abs(rect.top-80)<distance){nearest=record;distance=Math.abs(rect.top-80);}
        if(BATCH && rect.bottom>-1000 && rect.top<innerHeight+1000){
          const first=openingPage+Math.floor((record.number-openingPage)/10)*10;
          for(let n=Math.max(1,first);n<=Math.min(total,first+9);n++){records.get(n).eligible=true;}
        }
      }
      if(nearest)readingPage=nearest.number;
      pump();
    });
  }
  window.addEventListener('scroll',checkBottom,{passive:true});
  window.addEventListener('resize',checkBottom);
  q('#pause').onclick=()=>{paused=!paused;q('#pause').textContent=paused?'继续加载':'暂停加载';status();if(!paused){pump();discover();checkBottom();}};
  q('#retry').onclick=()=>{for(const r of records.values())if(r.state==='error'){r.state='queued';r.attempts=0;r.retry.hidden=true;r.message.textContent='等待重试…';}paused=false;q('#pause').textContent='暂停加载';pump();discover();status();};
  q('#width').oninput=e=>{applyWidth(e.target.value);checkBottom();};
  let scrollPosition=0, originalReadingPosition=null;
  q('#original').onclick=()=>{originalReadingPosition=captureReadingPosition();scrollPosition=scrollY;paused=true;q('#reader').hidden=true;q('#resume').hidden=false;host.style.minHeight='0';document.documentElement.classList.remove('continuous-reader-active');window.scrollTo(0,0);};
  q('#resume').onclick=()=>{q('#reader').hidden=false;q('#resume').hidden=true;host.style.minHeight='';document.documentElement.classList.add('continuous-reader-active');paused=false;q('#pause').textContent='暂停加载';if(originalReadingPosition)restoreReadingPosition(originalReadingPosition);else window.scrollTo(0,scrollPosition);pump();discover();status();checkBottom();};
  function captureReadingPosition() {
    if (q('#reader').hidden && originalReadingPosition) return originalReadingPosition;
    const line = q('header').getBoundingClientRect().bottom + 8;
    let closest = null, distance = Infinity;
    for (const record of records.values()) {
      const rect = record.figure.getBoundingClientRect();
      const delta = rect.top > line ? rect.top-line : rect.bottom < line ? line-rect.bottom : 0;
      if (delta < distance) {
        closest = {page:record.number, fraction:Math.max(0,Math.min(1,(line-rect.top)/Math.max(1,rect.height)))};
        distance = delta;
      }
      if (delta === 0) break;
    }
    return closest || {page:openingPage,fraction:0};
  }
  globalThis.prepareReaderReload = () => {
    const position = captureReadingPosition();
    sessionStorage.setItem(positionKey, JSON.stringify({...position,url:entry.href,time:Date.now()}));
  };
  function locateInitialPage() {
    const target = records.get(openingPage)?.figure;
    if (!target) return;
    const headerHeight = q('header').getBoundingClientRect().height;
    window.scrollTo({top: Math.max(0, window.scrollY + target.getBoundingClientRect().top + (restoredPosition?.fraction || 0)*target.getBoundingClientRect().height - headerHeight - 8), behavior:'instant'});
  }
  reveal();
  // All frames exist before positioning; downloads never move the initial anchor again.
  await globalThis.readerI18n.ready;
  globalThis.readerI18n.mount(shadow,q('#toolbar-actions'));
  locateInitialPage();
  discover();
})();

