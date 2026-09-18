import {mkdir, rm, cp, readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const pages = process.argv.includes('--pages');
await rm(output, {recursive:true, force:true});
await cp(path.join(root, 'public'), path.join(output, 'client'), {recursive:true});
const worker = (await readFile(path.join(root, 'server/index.mjs'), 'utf8')).replace(/^export (?=(?:async )?function)/gm, '');
if (pages) {
  await writeFile(path.join(output, 'client/_worker.js'), worker);
  await writeFile(path.join(output, 'client/_routes.json'), JSON.stringify({
    version: 1,
    include: ['/api/*'],
    exclude: []
  }, null, 2) + '\n');
} else {
  await mkdir(path.join(output, 'server'), {recursive:true});
  await mkdir(path.join(output, '.openai'), {recursive:true});
  await writeFile(path.join(output, 'server/index.js'), worker);
  await cp(path.join(root, '.openai/hosting.json'), path.join(output, '.openai/hosting.json'));
}
let headers = '/\n  Cache-Control: no-cache\n';
const assetNames = new Map();
for (const filename of ['map-model.js', 'live-map.js', 'style.css', 'refinement.css', 'refresh.css', 'product-polish.css', 'app.js', 'pages.css', 'pages.js', 'features.js']) {
  let content = await readFile(path.join(root, 'public', filename), 'utf8');
  for (const [original, versioned] of assetNames) content = content.replaceAll('./' + original, './' + versioned);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const ext = path.extname(filename);
  const versioned = filename.slice(0, -ext.length) + '.' + hash + ext;
  assetNames.set(filename, versioned);
  await writeFile(path.join(output, 'client', versioned), content);
  headers += '/' + versioned + '\n  Cache-Control: public, max-age=31536000, immutable\n';
}
for (const filename of (await readdir(path.join(output, 'client'))).filter(name => name.endsWith('.html'))) {
  let html = await readFile(path.join(output, 'client', filename), 'utf8');
  for (const [original, versioned] of assetNames) html = html.replaceAll('"' + original + '"', '"' + versioned + '"');
  await writeFile(path.join(output, 'client', filename), html);
  headers += '/' + filename + '\n  Cache-Control: no-cache\n';
  if (filename !== 'index.html') headers += '/' + filename.slice(0, -5) + '\n  Cache-Control: no-cache\n';
}
await writeFile(path.join(output, 'client/_headers'), headers);
console.log('Built Orka for ' + (pages ? 'Cloudflare Pages' : 'Sites') + ' with versioned assets and website metadata preview.');
