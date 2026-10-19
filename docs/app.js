import {cleanImage} from './cleaner.js';
import {makeZip} from './zip.js';
const input=document.querySelector('#files'),zone=document.querySelector('#dropzone'),results=document.querySelector('#results'),section=document.querySelector('#results-section'),status=document.querySelector('#status');
const downloads=[];const allButton=document.querySelector('#download-all');
const urls=new Set();let count=0,queue=Promise.resolve(),generation=0;
const format=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;
function element(tag,className,value){const el=document.createElement(tag);el.className=className;if(value!==undefined)el.textContent=value;return el;}
function url(blob){const u=URL.createObjectURL(blob);urls.add(u);return u;}
async function process(files,token){
 for(const file of files){
  if(token!==generation)return;
  section.hidden=false;status.textContent=`Cleaning ${file.name}…`;
  const row=element('div','file-row'),info=element('div','file-info');info.append(element('p','filename',file.name));row.append(info);results.append(row);count++;document.querySelector('#count').textContent=count;
  try{
   if(file.size>100*1024*1024)throw new Error('This file exceeds the 100 MB limit. Choose a smaller image.');
   const result=cleanImage(await file.arrayBuffer());if(token!==generation)return;
   const blob=new Blob([result.bytes],{type:result.type});const downloadUrl=url(blob);
   const preview=element('img','thumb');preview.alt='';preview.src=downloadUrl;row.prepend(preview);
   info.append(element('p','file-meta',`${format(file.size)} → ${format(blob.size)} · Image data preserved`));
   const details=element('details','');details.append(element('summary','',result.removed.length?`${result.removed.length} metadata ${result.removed.length===1?'category':'categories'} removed`:'No removable metadata found'));
   if(result.removed.length)details.append(element('div','',result.removed.join(' · ')));info.append(details);
   const a=element('a','download','Download');a.href=downloadUrl;a.download=file.name.replace(/\.[^.]+$/,'')+'-cleaned.'+result.extension;row.append(a);downloads.push({name:a.download,bytes:result.bytes});allButton.hidden=downloads.length<2;
  }catch(error){info.append(element('p','file-meta error',error.message));}
  await new Promise(resolve=>requestAnimationFrame(resolve));
 }
 if(token===generation)status.textContent='Finished. Your original files are unchanged.';
}
function add(files){const items=Array.from(files);if(!items.length)return;const token=generation;queue=queue.then(()=>process(items,token)).catch(()=>{status.textContent='Something went wrong. Clear the list and try again.';});}
input.addEventListener('change',()=>{add(input.files);input.value='';});
let depth=0;zone.addEventListener('dragenter',e=>{e.preventDefault();depth++;zone.classList.add('drag');});zone.addEventListener('dragover',e=>e.preventDefault());zone.addEventListener('dragleave',()=>{if(--depth<=0){depth=0;zone.classList.remove('drag');}});zone.addEventListener('drop',e=>{e.preventDefault();depth=0;zone.classList.remove('drag');add(e.dataTransfer.files);});
window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
document.querySelector('#clear').addEventListener('click',()=>{generation++;downloads.length=0;allButton.hidden=true;for(const u of urls)URL.revokeObjectURL(u);urls.clear();results.replaceChildren();section.hidden=true;count=0;status.textContent='';});
window.addEventListener('pagehide',()=>{for(const u of urls)URL.revokeObjectURL(u);});

allButton.addEventListener('click',()=>{const archive=makeZip(downloads);const a=document.createElement('a');a.href=url(new Blob([archive],{type:'application/zip'}));a.download='metadata-wiper.zip';a.click();});
