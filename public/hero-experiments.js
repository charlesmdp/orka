export function constrainMascot(x, y, bounds) {
  return {x:Math.max(bounds.left,Math.min(bounds.right,x)),y:Math.max(bounds.top,Math.min(bounds.bottom,y))};
}

export function springStep(position, velocity, seconds) {
  const dt=Math.min(Math.max(seconds,0),1/30);
  const v={x:(velocity.x-position.x*95*dt)*Math.exp(-15*dt),y:(velocity.y-position.y*95*dt)*Math.exp(-15*dt)};
  return {position:{x:position.x+v.x*dt,y:position.y+v.y*dt},velocity:v};
}

// The illustration faces left; mirror it when travelling right, and pitch into the path.
export function swimmingHeading(dx, dy, previous={facing:1,pitch:0}) {
  if(Math.hypot(dx,dy)<.15)return previous;
  const facing=Math.abs(dx)>.15?(dx>0?-1:1):previous.facing;
  const pitch=-facing*Math.atan2(dy,Math.abs(dx))*180/Math.PI;
  return {facing,pitch:Math.max(-65,Math.min(65,pitch))};
}

if(typeof document!=='undefined') {
 const hero=document.querySelector('.seascape-hero');
 if(hero) initializeHero(hero);
}

function initializeHero(hero) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=reduced.matches,visible=false,timer;
 const active=()=>!paused&&!document.hidden&&visible;
 const cards=[...hero.querySelectorAll('.seascape-note')];
 const stack=hero.querySelector('.seascape-note-stack');
 const examples=[
  ['orca-cap.webp','My cap store','Emma','Does this cap come in green?'],
  ['cowlendar-official-home.png','My booking app','Alex','Can I move my booking?'],
  ['calorie-app.svg','My calorie tracker','Sam','How do I upgrade my plan?'],
  ['orca-cap.webp','My cap store','Jules','Can you help with my order?'],
  ['cowlendar-official-home.png','My booking app','Mia','Can I speak to your team?'],
  ['calorie-app.svg','My calorie tracker','Theo','I love the new update!']
 ];
 let messageIndex=3;
 const arrive=(card,delay=0)=>{
  if(!active())return;
  card.querySelector('.seascape-note-surface').animate([
   {opacity:0,transform:'translateY(-28px) scale(.94)'},
   {opacity:1,transform:'translateY(3px) scale(1.008)',offset:.72},
   {opacity:1,transform:'translateY(0) scale(1)'}
  ],{duration:780,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
 };
 const schedule=()=>{
  clearTimeout(timer);
  hero.classList.toggle('motion-paused',!active());
  if(!active())return;
  timer=setTimeout(()=>{
   const card=cards.pop();
   const [icon,project,name,message]=examples[messageIndex++%examples.length];
   card.querySelector('[data-note-icon]').src='/assets/'+icon;
   card.querySelector('[data-note-project]').textContent=project;
   card.querySelector('[data-note-name]').textContent=name;
   card.querySelector('[data-note-message]').textContent=message;
   cards.unshift(card);stack.prepend(card);
   cards.forEach((item,index)=>item.dataset.slot=String(index));
   arrive(card);schedule();
  },5100);
 };
 const syncMotion=()=>{
  if(paused)hero.getAnimations({subtree:true}).forEach(animation=>{
   if(animation.effect?.getTiming().iterations!==Infinity)animation.finish();
  });
  schedule();
 };
 reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});
 new IntersectionObserver(([entry])=>{
  const first=!visible&&entry.isIntersecting;
  visible=entry.isIntersecting;schedule();
  if(first&&!hero.dataset.entered){hero.dataset.entered='true';cards.forEach((card,i)=>arrive(card,i*550));}
 },{threshold:.1}).observe(hero);
 document.addEventListener('visibilitychange',schedule);
 syncMotion();

 const nightButton=document.querySelector('[data-night-toggle]');
 const nightArt=hero.querySelector('[data-night-art]');
 let night=false,request=0;
 async function setNight(value) {
  night=value;const revision=++request;
  document.body.classList.toggle('hero-night',night);
  nightButton.setAttribute('aria-checked',String(night));
  nightButton.querySelector('[data-night-label]').textContent=night?'Night shift':'Night mode';
  try{sessionStorage.setItem('orka-hero-night',night?'1':'0');}catch{}
  if(night&&!nightArt.src){
   nightArt.src=nightArt.dataset.src;
   try{await nightArt.decode();}catch{return;}
  }
  if(revision===request&&nightArt.complete&&nightArt.naturalWidth)hero.classList.add('night-art-ready');
 }
 nightButton.addEventListener('click',()=>setNight(!night));
 try{if(sessionStorage.getItem('orka-hero-night')==='1')setNight(true);}catch{}

 const mascot=hero.querySelector('[data-mascot]');
 const handle=hero.querySelector('[data-mascot-handle]');
 const hint=hero.querySelector('[data-mascot-hint]');
 const status=hero.querySelector('[data-mascot-status]');
 let heading={facing:1,pitch:0};
 let position={x:0,y:0},velocity={x:0,y:0},pointer=null,frame=0,returnTimer,swimTimer,lastTime=0;
 const bounds=()=>({left:12-mascot.offsetLeft,right:hero.clientWidth-mascot.offsetWidth-mascot.offsetLeft-12,top:105-mascot.offsetTop,bottom:hero.clientHeight-mascot.offsetHeight-mascot.offsetTop-12});
 const paint=(dx=0,dy=0)=>{
  heading=swimmingHeading(dx,dy,heading);
  mascot.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
  handle.style.setProperty('--mascot-facing',heading.facing);
  handle.style.setProperty('--mascot-pitch',`${heading.pitch}deg`);
 };
 const stop=()=>{cancelAnimationFrame(frame);clearTimeout(returnTimer);clearTimeout(swimTimer);frame=0;mascot.classList.remove('is-returning','is-swimming');};
 const splash=()=>{
  if(!paused)handle.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-16px) rotate(-10deg)',offset:.4},{transform:'translateY(0) rotate(0)'}],{duration:700,easing:'cubic-bezier(.22,.68,.24,1)'});
 };
 const home=()=>{
  stop();mascot.classList.remove('is-dragging');velocity={x:0,y:0};
  if(paused){position={x:0,y:0};velocity={x:0,y:0};paint();hint.textContent='Make me swim';return;}
  mascot.classList.add('is-returning');hint.textContent='Make me swim';lastTime=0;
  const step=time=>{
   if(paused){home();return;}
   const result=springStep(position,velocity,lastTime?(time-lastTime)/1000:1/60);lastTime=time;
   const next=constrainMascot(result.position.x,result.position.y,bounds());
   const dx=next.x-position.x,dy=next.y-position.y;position=next;velocity=result.velocity;paint(dx,dy);
   if(Math.hypot(position.x,position.y)<.3&&Math.hypot(velocity.x,velocity.y)<2){
    position={x:0,y:0};velocity={x:0,y:0};heading.pitch=0;paint();mascot.classList.remove('is-returning');hint.textContent='Make me swim';frame=0;
   }else frame=requestAnimationFrame(step);
  };
  frame=requestAnimationFrame(step);
 };
 const later=()=>{clearTimeout(returnTimer);returnTimer=setTimeout(home,1800);};
 handle.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  stop();event.preventDefault();handle.setPointerCapture(event.pointerId);
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:event.timeStamp};velocity={x:0,y:0};
  mascot.classList.add('is-dragging');hint.textContent='Make me swim';handle.focus({preventScroll:true});
 });
 handle.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y,dt=Math.max(8,event.timeStamp-pointer.time)/1000;
  const next=constrainMascot(position.x+dx,position.y+dy,bounds());
  const travel={x:next.x-position.x,y:next.y-position.y};position=next;velocity={x:Math.max(-600,Math.min(600,dx/dt)),y:Math.max(-600,Math.min(600,dy/dt))};
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:event.timeStamp};paint(travel.x,travel.y);
 });
 const release=event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  pointer=null;mascot.classList.remove('is-dragging');heading.pitch=0;paint();
  if(event.type==='pointercancel'){home();return;}
  hint.textContent='Make me swim';status.textContent='Orky found a new swimming spot.';splash();later();
 };
 handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);handle.addEventListener('lostpointercapture',release);
 handle.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();pointer=null;home();status.textContent='Orky is back home.';return;}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();splash();return;}
  const move={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
  if(!move)return;
  event.preventDefault();stop();const next=constrainMascot(position.x+move[0],position.y+move[1],bounds());const dx=next.x-position.x,dy=next.y-position.y;position=next;velocity={x:0,y:0};paint(dx,dy);mascot.classList.add('is-swimming');swimTimer=setTimeout(()=>mascot.classList.remove('is-swimming'),450);later();
 });
 new ResizeObserver(()=>{stop();pointer=null;mascot.classList.remove('is-dragging');position={x:0,y:0};velocity={x:0,y:0};paint();}).observe(hero);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();position={x:0,y:0};velocity={x:0,y:0};paint();}});
}
