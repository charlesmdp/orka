import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '})[x]);
export async function buildFaqKnowledge(directory){
 const documents=[];
 for(const file of (await readdir(directory)).filter(x=>x.endsWith('.html')).sort()){
  const html=await readFile(path.join(directory,file),'utf8');
  const title=decode(html.match(/<title>(.*?)<\/title>/s)?.[1]||'Orka');
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'';
  const text=decode(main.replace(/<(script|style|svg|form)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/(?:p|h[1-6]|li|tr|article|section|div)>/g,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim());
  if(!text)continue;
  const slug=file==='index.html'?'':file.replace(/\.html$/,'');
  for(let start=0,index=0;start<text.length;start+=2000,index++)documents.push({id:slug+'-'+index,title,url:'https://orka.chat/'+slug,text:text.slice(start,start+2400)});
 }
 await writeFile(path.join(directory,'faq-knowledge.json'),JSON.stringify({documents})+'\n');
 return documents;
}
