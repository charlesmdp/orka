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
 const projectDialog=document.getElementById('project-explainer');
 if(projectDialog){
  let projectTrigger;
  document.querySelectorAll('[data-project-help]').forEach(button=>button.addEventListener('click',()=>{
   projectTrigger=button;
   if(!projectDialog.open){projectDialog.showModal();projectDialog.scrollTop=0;}
  }));
  projectDialog.querySelectorAll('[data-close-project]').forEach(button=>button.addEventListener('click',()=>projectDialog.close()));
  projectDialog.addEventListener('click',event=>{
   if(event.target!==projectDialog)return;
   const bounds=projectDialog.getBoundingClientRect();
   if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)projectDialog.close();
  });
  projectDialog.addEventListener('close',()=>projectTrigger?.focus({preventScroll:true}));
 }
 const selectOwnKey=()=>{
  const choice=document.querySelector('[data-own-key]');
  if(!choice)return;
  choice.checked=true;choice.dispatchEvent(new Event('change',{bubbles:true}));
 };
 if(new URLSearchParams(window.location.search).get('billing')==='own-key')selectOwnKey();
 document.querySelectorAll('[data-byok-estimate]').forEach(link=>link.addEventListener('click',()=>{
  if(link.getAttribute('href')==='#ai-pricing')selectOwnKey();
 }));
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
   const label=document.createElement('span');label.textContent='YOU FOUND FEEDING TIME';
   const title=document.createElement('h2');title.id='orca-surprise-title';title.textContent='Big appetite. Tiny leftovers.';
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const description='A fierce ceramic orca bites and chews the Crisp, Intercom, tawk.to, Help Scout, Zendesk, Chatway and Gorgias logos, then comically poops little stone cubes in each logo’s main color.';
   const poster='/assets/orca-chomp-still.jpg';
   const media=document.createElement(reduced?'img':'video');media.width=960;media.height=600;
   media.className='orca-feast-media';media.setAttribute('aria-label',description);
   const pause=document.createElement('button');pause.type='button';pause.className='orca-feast-pause';pause.textContent='Pause animation';pause.hidden=reduced;
   let fallback=null,playing=true;
   if(reduced){media.src=poster;media.alt=description;}
   else{
    media.muted=true;media.loop=true;media.autoplay=true;media.playsInline=true;media.poster=poster;media.preload='auto';
    media.src='/assets/orca-chomp.mp4';
    const useGif=()=>{
     if(!media.isConnected||fallback)return;
     fallback=document.createElement('img');fallback.className='orca-feast-media';fallback.width=960;fallback.height=600;fallback.alt=description;
     fallback.src=playing?'/assets/orca-chomp.gif':poster;media.replaceWith(fallback);
    };
    media.addEventListener('error',useGif,{once:true});
    pause.addEventListener('click',async()=>{
     if(fallback){playing=!playing;fallback.src=playing?'/assets/orca-chomp.gif':poster;}
     else if(media.paused){try{await media.play();playing=true;}catch{playing=false;}}
     else{media.pause();playing=false;}
     pause.textContent=playing?'Pause animation':'Play animation';
    });
    media.addEventListener('pause',()=>{playing=false;pause.textContent='Play animation';});
    media.addEventListener('play',()=>{playing=true;pause.textContent='Pause animation';});
    dialog.addEventListener('close',()=>{media.pause();media.removeAttribute('src');media.load();},{once:true});
   }
   const copy=document.createElement('p');copy.textContent='Logos in. Little stone cubes out.';
   dialog.append(close,label,title,media,copy,pause);document.body.append(dialog);dialog.showModal();close.focus();
   if(!reduced)media.play().catch(()=>{playing=false;pause.textContent='Play animation';});
   close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{dialog.remove();logo.focus();},{once:true});
  });
 });
 document.querySelectorAll('[data-assistant-choice]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-assistant-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('[data-assistant-name]').textContent=button.dataset.assistantChoice;
 }));
}
