// Optional animation renderer. Requires @napi-rs/canvas and ffmpeg.
// Generated ceramic sprites and prompts: orca-chomp-artwork.md.
// Rival marks retain the sources documented in the original artwork renderer.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {spawn,execFileSync}=require('node:child_process');
const {writeFileSync}=require('node:fs');
const {once}=require('node:events');
const path=require('node:path');
const assets=path.join(__dirname,'../public/assets');
const W=960,H=600,FPS=24,BEAT=3.2;
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const vendors=[
 ['Crisp','vendor-logos/crisp.png','#149bf1'],
 ['Intercom','vendor-logos/intercom.png','#343a40'],
 ['tawk.to','vendor-logos/tawk.png','#36b449'],
 ['Help Scout','orca-feast-helpscout.png','#354be9'],
 ['Zendesk','orca-feast-zendesk.jpg','#1c302c'],
 ['Chatway','vendor-logos/chatway.png','#0755ed'],
 ['Gorgias','vendor-logos/gorgias.png','#ff9b80']
];
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function round(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function label(text,x,y,size,color,weight=500){ctx.font=`${weight} ${size}px sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function fit(img,x,y,w,h){const s=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*s)/2,y+(h-img.height*s)/2,img.width*s,img.height*s);}
function poly(points,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function tint(hex,n){return '#'+hex.slice(1).match(/../g).map(v=>Math.round(Math.max(0,Math.min(255,parseInt(v,16)+n))).toString(16).padStart(2,'0')).join('');}
function cube(x,y,s,color,rotation=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
 const d=s*.35;
 poly([[-s/2,-s/2],[0,-s/2-d],[s/2,-s/2],[0,-s/2+d]],tint(color,42));
 poly([[-s/2,-s/2],[0,-s/2+d],[0,s/2+d],[-s/2,s/2]],color);
 poly([[0,-s/2+d],[s/2,-s/2],[s/2,s/2],[0,s/2+d]],tint(color,-28));
 ctx.strokeStyle=tint(color,60);ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-s*.36,-s*.22);ctx.lineTo(-s*.12,-s*.09);ctx.lineTo(-s*.22,s*.2);ctx.stroke();
 ctx.fillStyle=tint(color,30);ctx.fillRect(-s*.32,s*.22,2,2);ctx.fillRect(s*.1,-s*.18,2,2);ctx.restore();
}
(async()=>{
 const [open,closed]=await Promise.all(['open','closed'].map(p=>loadImage(path.join(assets,`orca-chomp-${p}.png`))));
 const marks=await Promise.all(vendors.map(v=>loadImage(path.join(assets,v[1]))));
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#031b20');bg.addColorStop(.6,'#104b49');bg.addColorStop(1,'#06292e');
 const stones=[[-28,0,24],[0,4,26],[27,0,23],[-13,-23,24],[14,-23,22],[0,-47,24]];
 function frame(t,poster=false){
  const current=Math.floor(t/BEAT)%vendors.length,q=t%BEAT;
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Quiet marine stage, with real stone piles accumulating under each brand.
  for(let i=0;i<20;i++){const x=(i*137+Math.sin(t+i)*6)%W,y=465-((i*69+t*(9+i%5*3))%530);ctx.beginPath();ctx.arc(x,y,2+i%4,0,Math.PI*2);ctx.strokeStyle='#bce9dd1b';ctx.lineWidth=1;ctx.stroke();}
  ctx.fillStyle='#052425';ctx.fillRect(0,511,W,89);
  for(let i=0;i<7;i++){
   const px=100+i*126;
   ctx.beginPath();ctx.ellipse(px,519,42,10,0,0,Math.PI*2);ctx.fillStyle='#0003';ctx.fill();
   if(i<current)for(const [dx,dy,s]of stones)cube(px+dx,502+dy,s,vendors[i][2]);
   fit(marks[i],px-13,541,26,26);label(vendors[i][0],px,587,13,'#d0e5db',600);
  }
  // Anticipation, lunge and two sharp jaw closures keep the act of biting readable.
  const lunge=45*smooth((q-.52)/.29)*(1-smooth((q-1.38)/.25));
  const chomp=(q>=.94&&q<1.12)||(q>=1.28);
  const impact=(q>=.94&&q<1.04)||(q>=1.28&&q<1.38);
  const plop=q>1.72&&q<2.75;
  const wobble=impact?Math.sin(q*95)*6:plop?Math.sin(q*43)*2:0;
  const ox=85+lunge+wobble,oy=-9+Math.sin(t*2)*3,sw=766,sh=511;
  ctx.save();ctx.translate(ox,oy);ctx.drawImage(chomp?closed:open,0,0,sw,sh);ctx.restore();
  const mouthX=ox+sw*.905,mouthY=oy+sh*.505;
  // Logo remains full-size inside the teeth before the snap, then reappears bitten.
  if(q<.94||(q>=1.12&&q<1.28)){
   const caught=q>=.76,second=q>=1.12,progress=smooth(q/.76);
   const lx=caught?mouthX:1035+(mouthX-1035)*progress;
   const ly=caught?mouthY:245+(mouthY-245)*progress;
   const size=second?79:102;
   ctx.save();ctx.translate(lx,ly);ctx.rotate(second?-.3:Math.sin(progress*Math.PI)*-.2);
   if(second){ctx.beginPath();ctx.moveTo(-55,-55);ctx.lineTo(44,-55);ctx.lineTo(37,-31);ctx.lineTo(17,-29);ctx.lineTo(24,-7);ctx.lineTo(5,8);ctx.lineTo(22,26);ctx.lineTo(7,55);ctx.lineTo(-55,55);ctx.closePath();ctx.clip();}
   round(-size/2,-size/2,size,size,17,'#fffdf2');fit(marks[current],-size*.36,-size*.36,size*.72,size*.72);ctx.restore();
   if(caught){ // White fang tips visibly overlap the logo instead of it floating over the face.
    poly([[mouthX-35,mouthY-56],[mouthX-22,mouthY-54],[mouthX-26,mouthY-34]],'#f4e9c9');
    poly([[mouthX+21,mouthY+48],[mouthX+37,mouthY+45],[mouthX+28,mouthY+28]],'#f4e9c9');
   }
  }
  if(impact){
   const b=q<1.1?(q-.94)/.1:(q-1.28)/.1;
   for(let i=0;i<9;i++){const a=i*6.28/9;ctx.strokeStyle='#f0e9b6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mouthX+Math.cos(a)*44,mouthY+Math.sin(a)*38);ctx.lineTo(mouthX+Math.cos(a)*(58+b*16),mouthY+Math.sin(a)*(52+b*15));ctx.stroke();}
  }
  if(q>.94&&q<1.5){ctx.save();ctx.translate(803,139);ctx.rotate(-.1);label(q<1.17?'CHOMP!':'CRUNCH!',0,0,29,'#e1f89d',900);ctx.restore();}
  // Comedic rear-end stone cubes: an unmistakable plop, then bounce into colored piles.
  if(q>1.7){
   const startX=ox+sw*.28,startY=oy+sh*.64;
   for(let k=0;k<stones.length;k++){
    const age=q-1.75-k*.10;if(age<0)continue;
    const [dx,dy,s]=stones[k],endX=100+current*126+dx,endY=502+dy;
    const p=clamp(age/.6),flight=smooth(p),arc=Math.sin(p*Math.PI);
    const x=startX+(endX-startX)*flight-50*arc;
    let y=startY+(endY-startY)*flight-25*arc;
    if(age>.6&&age<.83)y-=Math.sin((age-.6)/.23*Math.PI)*9;
    cube(x,y,s*clamp(age/.12),vendors[current][2],p<1?Math.sin(age*15)*.35:0);
   }
   if(q<2.48){label('PLOP.',startX-20,startY-34,23,'#d7eaa7',800);for(let j=0;j<4;j++){ctx.beginPath();ctx.arc(startX-16-j*10,startY-4+j*4,3+j,0,Math.PI*2);ctx.fillStyle='#cee7cd32';ctx.fill();}}
  }
  round(24,19,225,61,18,'#061b21ba');fit(marks[current],38,31,36,36);
  ctx.textAlign='left';ctx.font='600 11px sans-serif';ctx.fillStyle='#a7c8bf';ctx.fillText(q<1.5?'ON THE MENU':'NICELY RECYCLED',85,41);ctx.font='700 20px sans-serif';ctx.fillStyle='#f4f4df';ctx.fillText(vendors[current][0],85,65);
  if(poster){label('CHOMP. CRUNCH. PLOP.',480,38,15,'#d7e9c3',700);}
 }
 frame(.83,true);writeFileSync(path.join(assets,'orca-chomp-still.jpg'),canvas.toBuffer('image/jpeg',90));
 // Contact sheet is a local review artifact, never requested by the production page.
 const sheet=createCanvas(1440,900),sctx=sheet.getContext('2d');
 [.5,.83,.98,1.19,1.9,2.8].forEach((t,i)=>{frame(t);sctx.drawImage(canvas,(i%3)*480,Math.floor(i/3)*450,480,300);sctx.fillStyle='#eee';sctx.font='18px sans-serif';sctx.fillText(`${t.toFixed(2)}s`,(i%3)*480+12,Math.floor(i/3)*450+330);});
 writeFileSync('/tmp/orca-chomp-sequence.jpg',sheet.toBuffer('image/jpeg',90));
 const out=path.join(assets,'orca-chomp.mp4');
 const encoder=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 const completed=once(encoder,'close');
 for(let f=0;f<Math.round(vendors.length*BEAT*FPS);f++){frame(f/FPS);const pixels=ctx.getImageData(0,0,W,H).data;if(!encoder.stdin.write(Buffer.from(pixels.buffer,pixels.byteOffset,pixels.byteLength)))await once(encoder.stdin,'drain');}
 encoder.stdin.end();const [code]=await completed;if(code!==0)throw new Error('Video encoding failed');
 execFileSync('ffmpeg',['-y','-v','error','-i',out,'-filter_complex','fps=8,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',path.join(assets,'orca-chomp.gif')]);
 console.log('Rendered 22.4-second ceramic chomp: MP4, GIF and reduced-motion poster.');
})().catch(error=>{console.error(error);process.exitCode=1;});
