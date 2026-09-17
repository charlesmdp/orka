import {mkdir, rm, cp, readFile, writeFile} from 'node:fs/promises';
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
let html = await readFile(path.join(output, 'client/index.html'), 'utf8');
let headers = '/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n';
for (const filename of ['style.css', 'refinement.css', 'refresh.css', 'app.js']) {
  const content = await readFile(path.join(root, 'public', filename));
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const ext = path.extname(filename);
  const versioned = filename.slice(0, -ext.length) + '.' + hash + ext;
  await writeFile(path.join(output, 'client', versioned), content);
  html = html.replaceAll('"' + filename + '"', '"' + versioned + '"');
  headers += '/' + versioned + '\n  Cache-Control: public, max-age=31536000, immutable\n';
}
await writeFile(path.join(output, 'client/index.html'), html);
await writeFile(path.join(output, 'client/_headers'), headers);
console.log('Built Orka for ' + (pages ? 'Cloudflare Pages' : 'Sites') + ' with versioned assets and website metadata preview.');
