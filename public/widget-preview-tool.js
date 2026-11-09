import { getWidgetBackground } from './tools-sites.js';

export function accentInk(hex) {
  const [r,g,b]=hex.slice(1).match(/../g).map(pair=>{
    const value=parseInt(pair,16)/255;
    return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
  });
  return .2126*r+.7152*g+.0722*b>.179?'#000000':'#ffffff';
}

export function readWidgetUpload(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type))
    throw new Error('Choose a PNG, JPG or WebP screenshot.');
  if (!file.size || file.size>10*1024*1024) throw new Error('Choose a screenshot smaller than 10 MB.');
  return file;
}

export function activateWidgetStudio(panel) {
  const get=selector=>panel.querySelector(selector);
  const all=selector=>[...panel.querySelectorAll(selector)];
  const brand=get('#wp-brand'), color=get('#wp-color'), greeting=get('#wp-greeting');
  const updateText=()=>{
    get('[data-team-name]').textContent=brand.value.trim() || 'Your team';
    get('[data-welcome]').textContent=greeting.value.trim() || 'How can we help?';
    get('[data-color-label]').textContent=color.value.toUpperCase();
    panel.style.setProperty('--wp-accent',color.value);
    panel.style.setProperty('--wp-ink',accentInk(color.value));
    get('[data-copy-status]').textContent='';
  };
  [brand,color,greeting].forEach(input=>input.addEventListener('input',updateText));
  updateText();

  const launcher=get('[data-launcher]'), messenger=get('#wp-messenger');
  const setOpen=(open,moveFocus=false)=>{
    messenger.hidden=!open;
    launcher.setAttribute('aria-expanded',String(open));
    launcher.setAttribute('aria-label',open?'Minimize chat':'Open chat preview');
    if (moveFocus) (open?get('[data-minimize]'):launcher).focus({preventScroll:true});
  };
  launcher.addEventListener('click',()=>setOpen(messenger.hidden,true));
  get('[data-minimize]').addEventListener('click',()=>setOpen(false,true));
  get('.wp-dock').addEventListener('keydown',event=>{
    if (event.key==='Escape' && !messenger.hidden) {event.preventDefault();setOpen(false,true);}
  });
  const press=(buttons,selected)=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button===selected)));
  const layouts=all('[data-layout-option]');
  layouts.forEach(button=>button.addEventListener('click',()=>{
    press(layouts,button);
    panel.dataset.layout=button.dataset.layoutOption;
    get('[data-copy-status]').textContent='';
    setOpen(false);
  }));
  const stage=get('.wp-stage');
  function fitWebsite() {
    const width=stage.clientWidth;
    if (!width) return;
    const viewport=panel.dataset.device==='mobile'?390:1280;
    const scale=width/viewport;
    stage.style.setProperty('--wp-frame-width',viewport+'px');
    stage.style.setProperty('--wp-frame-height',Math.ceil(stage.clientHeight/scale)+'px');
    stage.style.setProperty('--wp-frame-scale',String(scale));
  }
  if (typeof ResizeObserver!=='undefined') new ResizeObserver(fitWebsite).observe(stage);
  fitWebsite();
  const sizes=all('[data-size]');
  sizes.forEach(button=>button.addEventListener('click',()=>{
    panel.dataset.device=button.dataset.size;
    press(sizes,button);
    fitWebsite();
  }));
  const history=get('.wp-history'), composer=get('.wp-composer'), message=get('#wp-test-message');
  composer.addEventListener('submit',event=>{
    event.preventDefault();
    if (!message.value.trim()) return;
    const bubble=document.createElement('div');
    bubble.className='wp-msg wp-outgoing';
    bubble.textContent=message.value.trim();
    history.append(bubble);
    history.scrollTop=history.scrollHeight;
    message.value='';
    message.focus({preventScroll:true});
  });

  const backdrop=get('[data-background-image]');
  let frame=get('.wp-website-frame');
  const sample=backdrop.currentSrc || backdrop.src;
  const address=get('[data-preview-address]'), status=get('[data-background-status]');
  const sourceButtons=all('[data-source]'), panes=all('[data-source-pane]');
  const websiteForm=get('.wp-site-form'), website=get('#wp-url'), file=get('#wp-file');
  let imageUrl='';
  let revision=0;
  let controller;
  function cancelBackground() {
    revision++;
    controller?.abort();
    websiteForm.querySelector('button').disabled=false;
    websiteForm.removeAttribute('aria-busy');
    status.textContent='';
    status.removeAttribute('data-error');
    return revision;
  }
  function loadFrame(website,signal) {
    const next=frame.cloneNode(false);
    next.hidden=true;
    return new Promise((resolve,reject)=>{
      function finish() {
        next.removeEventListener('load',ready);
        signal.removeEventListener('abort',abort);
      }
      function ready() { finish();resolve(next); }
      function abort() { finish();next.remove();reject(new Error('Homepage load cancelled.')); }
      next.addEventListener('load',ready);
      signal.addEventListener('abort',abort,{once:true});
      next.src=website;
      frame.after(next);
    });
  }
  function applyBackground(src,label,description,loadedFrame) {
    if (loadedFrame) {
      frame.remove();
      frame=loadedFrame;
      frame.hidden=false;
      backdrop.hidden=true;
    } else {
      frame.hidden=true;
      frame.removeAttribute('src');
      backdrop.removeAttribute('srcset');
      backdrop.src=src;
      backdrop.alt=description;
      backdrop.hidden=false;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl=src.startsWith('blob:')?src:'';
    address.textContent=label;
  }
  async function useBlob(blob,id,label,description) {
    const url=URL.createObjectURL(blob);
    let used=false;
    try {
      const picture=new Image();
      picture.src=url;
      await picture.decode();
      if (revision!==id) return;
      applyBackground(url,label,description);
      used=true;
    } finally { if (!used) URL.revokeObjectURL(url); }
  }
  function reportError(text) {status.dataset.error='';status.textContent=text;}
  sourceButtons.forEach(button=>button.addEventListener('click',()=>{
    cancelBackground();
    press(sourceButtons,button);
    const source=button.dataset.source;
    panes.forEach(pane=>{pane.hidden=pane.dataset.sourcePane!==source;});
    if (source==='sample') {
      applyBackground(sample,'orka.chat','Sample background showing the Orka homepage');
      file.value='';
    }
  }));
  website.addEventListener('input',cancelBackground);
  websiteForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const id=cancelBackground();
    controller=new AbortController();
    const request=controller;
    const timer=setTimeout(()=>request.abort(),30000);
    websiteForm.querySelector('button').disabled=true;
    websiteForm.setAttribute('aria-busy','true');
    status.textContent='Opening the homepage…';
    try {
      const result=await getWidgetBackground(website.value,request.signal);
      if (revision!==id) return;
      const host=new URL(result.website).hostname;
      if (result.kind==='website') {
        const loaded=await loadFrame(result.website,request.signal);
        if (revision!==id) { loaded.remove();return; }
        applyBackground(result.website,host,'',loaded);
        status.textContent='Showing the public homepage. If it stays blank, choose Upload and use a screenshot.';
      } else {
        await useBlob(result.blob,id,host,'Homepage screenshot of '+host);
        if (revision===id) status.textContent='Homepage screenshot loaded.';
      }
    } catch(error) {
      if (id===revision) reportError(request.signal.aborted?'The homepage took too long. Try a screenshot instead.':error.message);
    } finally {
      clearTimeout(timer);
      if (id===revision) {
        websiteForm.querySelector('button').disabled=false;
        websiteForm.removeAttribute('aria-busy');
      }
    }
  });
  file.addEventListener('change',async ()=>{
    if (!file.files?.length) return;
    const id=cancelBackground();
    try {
      const selected=readWidgetUpload(file.files[0]);
      await useBlob(selected,id,selected.name,'Uploaded website screenshot');
      if (revision===id) status.textContent='Screenshot loaded from your device.';
    } catch(error) {
      if (revision===id) reportError(error.name==='EncodingError'?'This file could not be opened as an image. Choose another screenshot.':error.message);
    } finally { if (revision===id) file.value=''; }
  });
  get('[data-copy-settings]').addEventListener('click',async ()=>{
    const settings=['Team: '+(brand.value.trim() || 'Your team'),'Color: '+color.value,'Welcome: '+(greeting.value.trim() || 'How can we help?'),'Launcher: '+(panel.dataset.layout==='people'?'People':'Classic')].join('\n');
    try {
      await navigator.clipboard.writeText(settings);
      get('[data-copy-status]').textContent='Settings copied.';
    } catch { get('[data-copy-status]').textContent='Clipboard unavailable. Select the settings to copy them.'; }
  });
}
if (typeof document!=='undefined') {
  const studio=document.querySelector('[data-widget-studio]');
  if (studio) activateWidgetStudio(studio);
}
