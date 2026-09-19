'use strict';
const form=document.querySelector('#settings');
const fieldset=form.querySelector('fieldset');
const button=form.querySelector('button');
const status=document.querySelector('#status');
const valid=mode=>['batch','all'].includes(mode);
async function initialize(){
 try{
   const saved=await chrome.storage.local.get({mode:'batch'});
   const mode=valid(saved.mode)?saved.mode:'batch';
   form.querySelector('input[value="'+mode+'"]').checked=true;
   fieldset.disabled=false;button.disabled=false;
   status.textContent='当前选择已显示。';
 }catch{status.textContent='无法读取设置，请关闭后重新打开。';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const mode=form.querySelector('input[name="mode"]:checked')?.value;
 if(!valid(mode))return;
 button.disabled=true;
 try{
   const language=form.querySelector('[data-reader-language]').value;
   if(!['zh','en'].includes(language))throw new Error('Invalid language');
   await chrome.storage.local.set({mode,language});
   form.querySelector('[data-reader-language]').dataset.dirty='false';
   status.textContent='已保存，正在应用…';
   try {
     const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
     if(!tab?.id)throw new Error('No active tab');
     const result=await chrome.tabs.sendMessage(tab.id,{type:'reload-reader'});
     if(!result?.ok)throw new Error('Not a reader');
     status.textContent='已应用，阅读页正在刷新。';
   }catch{status.textContent='已保存。当前标签不是可连接的阅读页；下次打开阅读页会使用新模式。';}
 }
 catch{status.textContent='保存失败，请重试。';}
 finally{button.disabled=false;}
});
initialize();
