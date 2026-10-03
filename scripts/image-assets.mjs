import sharp from 'sharp';
import {readdir, readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Originals remain editable in public/assets. Only content-hashed derivatives
// are cached for a year; no image service or runtime transformation is needed.
export async function buildImageAssets(directory) {
  const assets = path.join(directory, 'assets');
  const destination = path.join(assets, 'optimized');
  await mkdir(destination, {recursive:true});
  const images = new Map();
  async function walk(folder) {
    for (const entry of await readdir(folder, {withFileTypes:true})) {
      if (entry.name === 'optimized') continue;
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!/\.(?:jpe?g|png|webp)$/i.test(entry.name)) continue;
      const original = await readFile(file);
      if (original.length < 16000) continue;
      const meta = await sharp(original).metadata();
      if (meta.pages > 1) continue; // Never flatten animations.
      const key = path.relative(assets, file).split(path.sep).join('/');
      const stem = key.replace(/\.[^.]+$/, '').replaceAll('/', '-');
      const hero = /^hero-.*\.jpg$/.test(key);
      const width = key.startsWith('app-logos/') ? Math.min(meta.width,320) : meta.width;
      const encode = w => sharp(original).rotate().resize({width:w,withoutEnlargement:true});
      async function save(buffer, w, format) {
        const hash = createHash('sha256').update(buffer).digest('hex').slice(0,12);
        const name = `${stem}-${w}.${hash}.${format}`;
        await writeFile(path.join(destination,name),buffer);
        return {url:`/assets/optimized/${name}`,width:w,bytes:buffer.length};
      }
      let full = await encode(width).webp({quality:82,effort:5}).toBuffer();
      // Already efficient WebP files do not need another lossy generation.
      if (path.extname(file)==='.webp' && width===meta.width) full=original;
      if (full.length>=original.length && width===meta.width && !hero && path.extname(file)!=='.webp') continue;
      const item = {originalBytes:original.length,width,height:Math.round(meta.height*width/meta.width),webp:[]};
      const responsive = width>=700 && (hero || /^(?:mosaic-|new2-mosaic-|comparison-|trawler-|orca-dialogue)/.test(key));
      const widths = responsive ? (hero?[768,1200]:[480,800]).filter(w=>w<width) : [];
      for(const w of widths) item.webp.push(await save(await encode(w).webp({quality:82,effort:5}).toBuffer(),w,'webp'));
      item.webp.push(await save(full,width,'webp'));
      if(hero) {
        item.avif=[];
        for(const w of [...widths,width]) item.avif.push(await save(await encode(w).avif({quality:50,effort:4}).toBuffer(),w,'avif'));
      }
      images.set(key,item);
    }
  }
  await walk(assets);
  await writeFile(path.join(directory,'image-manifest.json'),JSON.stringify(Object.fromEntries(images),null,2)+'\n');
  const before=[...images.values()].reduce((n,i)=>n+i.originalBytes,0);
  const after=[...images.values()].reduce((n,i)=>n+(i.avif||i.webp).at(-1).bytes,0);
  console.log(`Images: ${images.size} optimized; full-size files ${(before/1e6).toFixed(1)} MB → ${(after/1e6).toFixed(1)} MB.`);
  return images;
}

export const imageSrcset = sources => sources.map(s=>`${s.url} ${s.width}w`).join(', ');

export function rewriteImageUrls(content, images) {
  for(const [original,item] of images) {
    const url=item.webp.at(-1).url;
    // Also covers filenames assigned dynamically as 'assets/' + icon.
    content=content.replaceAll('assets/'+original,url.slice(1));
    content=content.replaceAll(`'${original}'`,`'${url.slice('/assets/'.length)}'`)
      .replaceAll(`"${original}"`,`"${url.slice('/assets/'.length)}"`);
  }
  return content;
}

export function optimizePageImages(html, images) {
  html=html.replace(/<img\b[^>]*>/g,tag=>{
    const original=tag.match(/(?<![\w-])src="\/?assets\/([^"]+)"/)?.[1];
    const item=images.get(original);
    if(!item || item.webp.length<2 || /(?:data-hero-art|srcset=)/.test(tag)) return tag;
    const sizes=/class="[^"]*(?:c-plan-art|mosaic-tier-art)/.test(tag)
      ? '(max-width: 700px) calc(100vw - 48px), (max-width: 1100px) 50vw, 430px'
      : /class="[^"]*mosaic-story-image/.test(tag)
        ? '(max-width: 700px) calc(100vw - 48px), (max-width: 1100px) 50vw, 640px'
        : '(max-width: 700px) 100vw, 1200px';
    return tag.replace(/>$/,` srcset="${imageSrcset(item.webp)}" sizes="${sizes}" decoding="async">`).replace(/decoding="async"([^>]*?)decoding="async"/,'decoding="async"$1');
  });
  // Keep Open Graph/Twitter's original JPEG/PNG for unfurlers that lack WebP.
  return html.replace(/<meta\b[^>]*>|[\s\S]+?(?=<meta\b|$)/g,part=>/^<meta\b/.test(part)?part:rewriteImageUrls(part,images));
}
