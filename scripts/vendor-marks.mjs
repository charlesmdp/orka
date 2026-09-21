import {readFileSync} from 'node:fs';
const marks=JSON.parse(readFileSync(new URL('./vendor-logos.json',import.meta.url),'utf8'));
export function vendorMark(item,size=36){
 const name=typeof item==='string'?item:item.name,id=typeof item==='string'?item:item.id;
 const source=id==='orka'?'/assets/orka-logo.svg':marks[id]?.path;
 if(!source)throw new Error('Missing official logo: '+id);
 return `<img class="vendor-logo vendor-logo-${id}" src="${source}" width="${size}" height="${size}" alt="${name} logo" loading="lazy">`;
}
