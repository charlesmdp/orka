// Optional artwork renderer; not part of the website build.
// Requires @napi-rs/canvas (npm) and ffmpeg. Run: node scripts/render-orca-feast.cjs
// The open/closed artwork was generated with imagegen. Existing competitor marks
// are documented in vendor-logos.json; Help Scout and Zendesk use their domain
// favicons, retrieved through Google's s2 favicon service at 128px on 2026-09-23.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {spawn,execFileSync}=require('node:child_process');
const {writeFileSync}=require('node:fs');
const {once}=require('node:events');
const path=require('node:path');
const assets=path.join(__dirname,'../public/assets');
const W=960,H=600,FPS=24,BEAT=1.8;
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const vendors=[['Crisp','vendor-logos/crisp.png'],['Intercom','vendor-logos/intercom.png'],['tawk.to','vendor-logos/tawk.png'],['Help Scout','orca-feast-helpscout.png'],['Zendesk','orca-feast-zendesk.jpg'],['Chatway','vendor-logos/chatway.png'],['Gorgias','vendor-logos/gorgias.png']];
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function round(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function label(text,x,y,size,color,weight=500){ctx.font=`${weight} ${size}px sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function fit(img,x,y,w,h){const s=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*s)/2,y+(h-img.height*s)/2,img.width*s,img.height*s);}
(async()=>{
 const [open,closed]=await Promise.all(['open','closed'].map(p=>loadImage(path.join(assets,`orca-feast-${p}.png`))));
 const marks=await Promise.all(vendors.map(v=>loadImage(path.join(assets,v[1]))));
 const background=ctx.createLinearGradient(0,0,W,H);background.addColorStop(0,'#021a17');background.addColorStop(.55,'#063b30');background.addColorStop(1,'#03241f');
 function frame(t,poster=false){
  const current=Math.floor(t/BEAT)%vendors.length,p=t/BEAT-Math.floor(t/BEAT);
  ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
  // Soft shafts and a current of bubbles make the water move with the orca.
  for(let i=0;i<5;i++){ctx.fillStyle=`rgba(131,229,181,${.015+i*.003})`;ctx.beginPath();ctx.moveTo(140+i*205,-30);ctx.lineTo(180+i*205,-30);ctx.lineTo(-80+i*205,H);ctx.lineTo(-230+i*205,H);ctx.fill();}
  for(let i=0;i<28;i++){
   const x=(i*131+Math.sin(t*.7+i)*12)%W,y=H-((i*83+t*(12+i%5*4))%(H+80));
   ctx.beginPath();ctx.arc(x,y,2+i%4*1.7,0,Math.PI*2);ctx.strokeStyle='#c0ffe129';ctx.lineWidth=1;ctx.stroke();
  }
  const lunge=25*Math.sin(Math.PI*smooth((p-.49)/.3))*(1-smooth((p-.8)/.17));
  const bob=Math.sin(t/BEAT*Math.PI*2)*5;
  const x=-133+lunge,y=-12+bob,sw=912,sh=608;
  const shut=smooth((p-.70)/.065)*(1-smooth((p-.90)/.09));
  // Swap aligned sprites for a crisp bite; overlaying transparent jaws ghosts.
  ctx.drawImage(shut>=.5?closed:open,x,y,sw,sh);
  const mouthX=x+1370/1536*sw,mouthY=y+535/1024*sh;
  if(p<.70){
   const progress=smooth(p/.70),s=1-.83*smooth((p-.49)/.21);
   const lx=1020+(mouthX-1020)*progress,ly=240+(mouthY-240)*progress+Math.sin(progress*Math.PI)*36;
   ctx.save();ctx.translate(lx,ly);ctx.rotate(Math.sin(progress*Math.PI)*-.19);ctx.scale(s,s);ctx.globalAlpha=1-smooth((p-.66)/.04);
   ctx.shadowColor='#0006';ctx.shadowBlur=22;ctx.shadowOffsetY=9;round(-51,-51,102,102,23,'#f8fbf5');ctx.shadowColor='transparent';
   fit(marks[current],-35,-35,70,70);ctx.restore();
  }
  if(p>.72&&p<.96){
   const burst=(p-.72)/.24;
   for(let i=0;i<9;i++){
    const angle=i*Math.PI*2/9;
    ctx.beginPath();ctx.arc(mouthX+Math.cos(angle)*(20+burst*70),mouthY+Math.sin(angle)*(18+burst*58),2+(1-burst)*3,0,Math.PI*2);
    ctx.strokeStyle=`rgba(204,255,194,${(1-burst)*.75})`;ctx.lineWidth=2;ctx.stroke();
   }
   ctx.save();ctx.globalAlpha=Math.sin(burst*Math.PI);ctx.translate(793,183-burst*12);ctx.rotate(-.08);label('GULP.',0,0,27,'#d8ff80',800);ctx.restore();
  }
  // Give every logo enough time to be identified before the bite.
  round(720,50,201,64,22,'#09271fc4');
  label(p>.74?'NEXT, PLEASE.':'ON THE MENU',820,72,10,'#a8cbb8',600);
  label(vendors[current][0],820,99,23,'#f4f8e9',700);
  const rowY=526;
  round(80,rowY-5,800,68,24,'#041b17b8');
  for(let i=0;i<vendors.length;i++){
   const cx=143+i*112,done=!poster&&(i<current||(i===current&&p>.73));
   ctx.globalAlpha=done?.25:1;
   round(cx-17,rowY+3,34,34,10,'#f9faf3');fit(marks[i],cx-12,rowY+8,24,24);
   label(vendors[i][0],cx,rowY+53,11,'#d8e6d9',500);ctx.globalAlpha=1;
  }
 }
 frame(.72,true);writeFileSync(path.join(assets,'orca-feast-still.jpg'),canvas.toBuffer('image/jpeg',90));
 const out=path.join(assets,'orca-feast.mp4');
 const encoder=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 const completed=once(encoder,'close');
 for(let f=0;f<Math.round(vendors.length*BEAT*FPS);f++){
  frame(f/FPS);const pixels=ctx.getImageData(0,0,W,H).data;
  if(!encoder.stdin.write(Buffer.from(pixels.buffer,pixels.byteOffset,pixels.byteLength)))await once(encoder.stdin,'drain');
 }
 encoder.stdin.end();const [code]=await completed;if(code!==0)throw new Error('Video encoding failed');
 execFileSync('ffmpeg',['-y','-v','error','-i',out,'-filter_complex','fps=10,scale=544:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',path.join(assets,'orca-feast.gif')]);
 console.log('Rendered 12.6-second orca feast: MP4, GIF and reduced-motion poster.');
})().catch(error=>{console.error(error);process.exitCode=1;});
