import { buildCatalog } from './shell-catalog.js?v=2';
const form=document.querySelector('#shell-form'),filter=document.querySelector('#snippet-filter');
const error=document.querySelector('#form-error'),status=document.querySelector('#copy-status'),catalog=document.querySelector('#shell-catalog');
let entries=[];
const codeBlock=(text,id)=>{const pre=document.createElement('pre'),code=document.createElement('code');code.textContent=text;code.id=id;pre.append(code);return pre;};
const copyButton=id=>{const b=document.createElement('button');b.type='button';b.dataset.copy=id;b.textContent='Copy';return b;};
function render() {
 catalog.replaceChildren();
 for(const e of entries.filter(e=>filter.value==='all'||e.id===filter.value||e.platform===filter.value)){
  const article=document.createElement('article');article.className='command-row';article.dataset.language=e.id;
  const title=document.createElement('div');title.className='command-name';
  const h=document.createElement('h3');h.textContent=e.name;
  const badge=document.createElement('span');badge.className='help';badge.textContent=`${e.platform} · ${e.tested?'Loopback tested':'Reference / not locally tested'}`;title.append(h,badge);
  const content=document.createElement('div');content.className='command-content';
  content.append(copyButton(`command-${e.id}`),codeBlock(e.command,`command-${e.id}`));
  const notes=document.createElement('p');notes.className='help';notes.textContent=e.notes;content.append(notes);
  if(e.encoded){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Encoded variant · same underlying command';details.append(summary,copyButton(`encoded-${e.id}`),codeBlock(e.encoded,`encoded-${e.id}`));content.append(details);}
  article.append(title,content);catalog.append(article);
 }
}
function update(){
 status.textContent='';
 try{
  entries=buildCatalog(Object.fromEntries(new FormData(form)));
  const port=Number(form.elements.port.value);
  document.querySelector('#listener').textContent=`nc -lvnp ${port}`;
  document.querySelector('#ncat-alternative').textContent=`ncat --listen --verbose ${port}`;
  error.textContent='';
 }catch(e){entries=[];error.textContent=e.message;document.querySelector('#listener').textContent='Correct the callback settings.';document.querySelector('#ncat-alternative').textContent='—';}
 document.querySelector('[data-copy="listener"]').disabled=!entries.length;
 document.querySelector('#export-notes').disabled=!entries.length;
 render();
}
for(const e of buildCatalog({host:'127.0.0.1',port:'8888'})){const option=document.createElement('option');option.value=e.id;option.textContent=e.name;filter.append(option);}
form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',e=>e.preventDefault());filter.addEventListener('change',render);
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-copy]');if(!button)return;
 const output=document.getElementById(button.dataset.copy);if(!output)return;
 try{await navigator.clipboard.writeText(output.textContent);status.textContent='Command copied.';button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1200);}
 catch{const range=document.createRange();range.selectNodeContents(output);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Command selected. Use your browser’s copy action.';}
});
document.querySelector('#export-notes').addEventListener('click',()=>{
 const visible=entries.filter(e=>filter.value==='all'||e.id===filter.value||e.platform===filter.value);
 if(!visible.length)return;
 const text='# Reverse Shell Cheatsheet\n\n## Listener\n\n```sh\n'+document.querySelector('#listener').textContent+'\n```\n\n'+visible.map(e=>`## ${e.name}\n\n${e.platform}; ${e.tested?'loopback tested':'not locally tested'}.\n\n\`\`\`\n${e.command}\n\`\`\`\n\n${e.notes}\n`).join('\n')+'\nGenerated locally. No command was executed by the page.\n';
 const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='reverse-shell-cheatsheet.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
update();
