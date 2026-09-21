export async function openQuestionInChat(question, {
 getWidget=()=>window.Orka,
 isReady=()=>!!document.querySelector('.orka-container .orka-button'),
 wait=()=>new Promise(resolve=>setTimeout(resolve,200))
}={}){
 const text=String(question).trim().slice(0,600);
 if(!text)return false;
 // show(message) opens Orka with a draft. It does not send the message.
 for(let attempt=0;attempt<50;attempt++){
  const widget=getWidget();
  if(typeof widget?.show==='function'&&isReady()){
   widget.showWidget?.();widget.show(text);return true;
  }
  await wait();
 }
 throw new Error('The chat could not load. Please allow the Orka widget, then try again. Your question is still here.');
}
export function safeFaqSource(url){try{const u=new URL(url);return u.origin==='https://orka.chat'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
if(typeof document!=='undefined'){
 document.documentElement.dataset.brandTheme='green';
 try{localStorage.removeItem('orka-brand-theme');}catch{}
 // sessionStorage follows this tab across pages and reloads, not future sessions.
 try{if(sessionStorage.getItem('orka-letter-read')==='1')document.documentElement.dataset.letterRead='true';}catch{}
 document.querySelectorAll('.letter-nav-stamp').forEach(link=>link.addEventListener('click',()=>{
  try{sessionStorage.setItem('orka-letter-read','1');}catch{}
  document.documentElement.dataset.letterRead='true';
 }));
 const invite=document.querySelector('[data-hero-widget-invite]');
 if(invite){
  let dismissed=window.scrollY>0,widgetObserver,resizeObserver;
  const hide=()=>{invite.hidden=true;};
  const bindWidget=()=>{
   if(dismissed)return;
   const container=document.querySelector('.orka-container');
   const launcher=container?.querySelector('.orka-button');
   if(!launcher)return;
   const position=()=>{
    if(dismissed||window.scrollY>0||!container.classList.contains('orka-closed')){hide();return;}
    const bounds=container.querySelector('.orka-button')?.getBoundingClientRect();
    if(!bounds?.width||!bounds.height){hide();return;}
    const width=Math.min(Math.max(bounds.width,250),420,window.innerWidth-32);
    const left=Math.min(Math.max(16,bounds.right-width),window.innerWidth-width-16);
    invite.style.width=width+'px';invite.style.left=left+'px';
    invite.style.bottom=(window.innerHeight-bounds.top+12)+'px';invite.hidden=false;
   };
   widgetObserver?.disconnect();
   widgetObserver=new MutationObserver(position);
   widgetObserver.observe(container,{attributes:true,childList:true,attributeFilter:['class','style']});
   if('ResizeObserver' in window){resizeObserver=new ResizeObserver(position);resizeObserver.observe(launcher);}
   window.addEventListener('resize',position,{passive:true});position();
  };
  if(!dismissed){
   widgetObserver=new MutationObserver(bindWidget);
   widgetObserver.observe(document.body,{childList:true,subtree:true});bindWidget();
  }
  window.addEventListener('scroll',()=>{
   if(window.scrollY<=0||dismissed)return;
   dismissed=true;hide();widgetObserver?.disconnect();resizeObserver?.disconnect();
  },{passive:true});
 }
 document.querySelectorAll('[data-faq-ask]').forEach(form=>{
  const input=form.querySelector('input'),button=form.querySelector('button'),result=form.querySelector('[data-faq-result]');
  input.addEventListener('input',()=>input.setCustomValidity(''));
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(button.disabled)return;
   const question=input.value.trim();
   if(question.length<3){input.setCustomValidity('Please enter your question.');input.reportValidity();return;}
   input.setCustomValidity('');button.disabled=true;form.setAttribute('aria-busy','true');result.hidden=false;result.textContent='Orky is checking our pages…';
   try{
    const response=await fetch('/api/faq-answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question}),signal:AbortSignal.timeout(30000)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Please try again in a moment.');
    result.replaceChildren();
    const label=document.createElement('strong');label.textContent='Orky · AI answer';
    const paragraph=document.createElement('p');paragraph.textContent=data.answer;
    result.append(label,paragraph);
    const sources=document.createElement('nav');sources.setAttribute('aria-label','Sources for this answer');
    for(const source of data.sources||[]){const url=safeFaqSource(source.url);if(!url)continue;const a=document.createElement('a');a.href=url;a.textContent=source.title.replace(/ — Orka$/,'')+' ↗';sources.append(a);}
    result.append(sources);
    const note=document.createElement('small');note.textContent='Generated from our published pages. AI can make mistakes.';result.append(note);
   }catch(error){result.textContent=error.name==='TimeoutError'?'Orky is taking a little longer. Please try again.':error.message;}
   finally{
    const contact=document.createElement('button');contact.type='button';contact.className='faq-ask-human';contact.textContent='Ask a human instead ↗';result.append(contact);
    contact.addEventListener('click',async()=>{
     contact.disabled=true;contact.textContent='Opening your chat…';
     let status=result.querySelector('[data-chat-status]');
     if(!status){status=document.createElement('small');status.dataset.chatStatus='';result.append(status);}
     status.textContent='';
     try{await openQuestionInChat(question);status.textContent='Your question is ready in the chat. Review it and press Send when you’re ready.';}
     catch(error){status.textContent=error.message;}
     finally{contact.disabled=false;contact.textContent='Ask a human instead ↗';}
    });
    button.disabled=false;form.removeAttribute('aria-busy');
   }
  });
 });
 document.querySelectorAll('[data-copy-snippet]').forEach(button=>button.addEventListener('click',async()=>{
  const snippet=document.getElementById(button.dataset.copySnippet);
  try{await navigator.clipboard.writeText(snippet.textContent);button.textContent=button.dataset.copySuccess||'Copied · replace YOUR_PROJECT_ID';}
  catch{button.textContent='Select and copy the text below';snippet.focus();}
 }));
 // Keep normal logo navigation, while allowing five quick clicks to discover Orky.
 document.querySelectorAll('header a.wordmark').forEach(logo=>{
  let count=0,last=0,navigation;
  logo.addEventListener('click',event=>{
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
   event.preventDefault();clearTimeout(navigation);
   const now=Date.now();count=now-last<700?count+1:1;last=now;
   if(count<5){navigation=setTimeout(()=>{location.href=logo.href;count=0;},700);return;}
   count=0;
   const dialog=document.createElement('dialog');dialog.className='orca-surprise';dialog.setAttribute('aria-labelledby','orca-surprise-title');
   const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close the orca surprise');
   const label=document.createElement('span');label.textContent='YOU FOUND OUR HAPPY PLACE';
   const title=document.createElement('h2');title.id='orca-surprise-title';title.textContent='One day, in the wild.';
   const img=document.createElement('img');img.width=560;img.height=360;img.alt='An orca jumping above the green ocean';
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;img.src=reduced?'/assets/orca-surprise-still.png':'/assets/orca-surprise.gif';
   const copy=document.createElement('p');copy.textContent='Until then, we’ll keep building little things with a lot of heart.';
   dialog.append(close,label,title,img,copy);document.body.append(dialog);dialog.showModal();close.focus();
   close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{dialog.remove();logo.focus();},{once:true});
  });
 });
 document.querySelectorAll('[data-assistant-choice]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-assistant-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('[data-assistant-name]').textContent=button.dataset.assistantChoice;
 }));
}
