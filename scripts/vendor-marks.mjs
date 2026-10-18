import {readFileSync} from 'node:fs';
const marks=JSON.parse(readFileSync(new URL('./vendor-logos.json',import.meta.url),'utf8'));
const escapeAttribute=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function vendorMark(item,size=36){
 const name=typeof item==='string'?item:item.name,id=typeof item==='string'?item:item.id;
 const mark=marks[id],source=id==='orka'?'/assets/orka-logo.svg':mark?.path;
 if(!source)throw new Error('Missing official logo: '+id);
 // Official wordmarks need their own horizontal space, not a square favicon slot.
 const wordmark=mark?.kind==='wordmark',width=wordmark?Math.min(140,size*4):size;
 const height=wordmark?Math.round(width*mark.height/mark.width):size;
 return `<img class="vendor-logo vendor-logo-${id}${wordmark?' vendor-logo-wordmark':''}" src="${source}" width="${width}" height="${height}" alt="${escapeAttribute(name)} logo" loading="lazy" decoding="async">`;
}
