for(const demo of document.querySelectorAll('[data-notes-demo]')){
 const lastNote=[...demo.querySelectorAll('.cs-note')].at(-1);
 demo.querySelectorAll('[data-note-choice]').forEach(button=>button.addEventListener('click',()=>{
  if(lastNote)lastNote.dataset.noteColor=button.dataset.noteChoice;
  demo.querySelectorAll('[data-note-choice]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  demo.querySelector('[data-note-color-name]').textContent=button.dataset.noteChoice[0].toUpperCase()+button.dataset.noteChoice.slice(1);
 }));
}
const mcpTabs=[...document.querySelectorAll('[data-mcp-tab]')];
function selectMcpTab(button){mcpTabs.forEach(tab=>{const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;const panel=document.getElementById(tab.getAttribute('aria-controls'));if(panel)panel.hidden=!active;});}
mcpTabs.forEach((button,index)=>{
 button.addEventListener('click',()=>selectMcpTab(button));
 button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%mcpTabs.length;else if(event.key==='ArrowLeft')next=(index-1+mcpTabs.length)%mcpTabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=mcpTabs.length-1;else return;event.preventDefault();selectMcpTab(mcpTabs[next]);mcpTabs[next].focus();});
});
document.querySelector('[data-copy-mcp]')?.addEventListener('click',async()=>{
 const input=document.getElementById('mcp-server-url'),status=document.querySelector('[data-copy-status]');
 try{await navigator.clipboard.writeText(input.value);status.textContent='Server URL copied.';}catch{input.focus();input.select();status.textContent='Select and copy the server URL.';}
});
