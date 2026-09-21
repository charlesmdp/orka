import {mkdir, rm, cp, readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildFaqKnowledge} from './faq-knowledge.mjs';
import {generateEditorial} from './editorial-pages.mjs';
import {comparisons} from './comparison-content.mjs';
import {sharedFooter,faqSection,faqSchema,homeFaqs} from './site-chrome.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const pages = process.argv.includes('--pages');
await rm(output, {recursive:true, force:true});
await cp(path.join(root, 'public'), path.join(output, 'client'), {recursive:true});
await generateEditorial(path.join(output, 'client'));
const faqWorker = (await readFile(path.join(root, 'server/faq.mjs'), 'utf8')).replace(/^export (?=(?:async )?function)/gm, '');
const worker = faqWorker + '\n' + (await readFile(path.join(root, 'server/index.mjs'), 'utf8')).replace(/^import .*faq.mjs';\n/m, '').replace(/^export (?=(?:async )?function)/gm, '');
if (pages) {
  await writeFile(path.join(output, 'client/_worker.js'), worker);
  await writeFile(path.join(output, 'client/_routes.json'), JSON.stringify({
    version: 1,
    include: ['/*'],
    exclude: []
  }, null, 2) + '\n');
} else {
  await mkdir(path.join(output, 'server'), {recursive:true});
  await mkdir(path.join(output, '.openai'), {recursive:true});
  await writeFile(path.join(output, 'server/index.js'), worker);
  await cp(path.join(root, '.openai/hosting.json'), path.join(output, '.openai/hosting.json'));
}
const homepage = await readFile(path.join(root, 'public/index.html'),'utf8');
const credits = homepage.match(/<details class="artwork-credits">[\s\S]*?<\/details>/)?.[0] || '';
const footer = sharedFooter(comparisons,credits);
let headers = '/\n  Cache-Control: no-cache\n';
const assetNames = new Map();
for (const filename of ['map-model.js', 'live-map.js', 'style.css', 'refinement.css', 'refresh.css', 'product-polish.css', 'app.js', 'pages.css', 'pages.js', 'features.js', 'pricing-model.js', 'help-demo-data.js', 'editorial.css', 'comparison.css', 'site-chrome.css', 'guides.css', 'site-interactions.js', 'editorial.js']) {
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
  html = html.replace(/<footer class="(?:site-footer|page-footer|pages-footer|ed-footer|o-footer)"[^>]*>[\s\S]*?<\/footer>/, footer);
  if (!html.includes('href="guides.css"')) html = html.replace('</head>','<link rel="stylesheet" href="guides.css"></head>');
  if (!html.includes('href="site-chrome.css"')) html = html.replace('</head>','<link rel="stylesheet" href="site-chrome.css"></head>');
  html = html.replace('<html lang="en">','<html lang="en" data-brand-theme="green">');
  html = html.replace('</head>','<script>try{if(sessionStorage.getItem("orka-letter-read")==="1")document.documentElement.dataset.letterRead="true";}catch{}</script><script type="module" src="site-interactions.js"></script></head>');
  html = html.replace('<!-- HOME_FAQ -->',faqSection(homeFaqs,{title:'More projects.\nFewer unanswered questions.'})+faqSchema(homeFaqs));
  for (const [original, versioned] of assetNames) html = html.replaceAll('"' + original + '"', '"' + versioned + '"');
  html = html.replace('</body>', '<script>window.ORKA_APP_ID="66471b6efff6410a175c00b6";(function(){if(document.querySelector("script[data-orka-widget]"))return;var s=document.createElement("script");s.src="https://widget.orka.chat/app.js";s.async=true;s.dataset.orkaWidget="true";document.head.appendChild(s);})();</script></body>');
  await writeFile(path.join(output, 'client', filename), html);
  headers += '/' + filename + '\n  Cache-Control: no-cache\n';
  if (filename !== 'index.html') headers += '/' + filename.slice(0, -5) + '\n  Cache-Control: no-cache\n';
}
await buildFaqKnowledge(path.join(output, 'client'));
headers += '/llm\n  Content-Type: text/markdown; charset=utf-8\n  Cache-Control: no-cache\n/*.md\n  Content-Type: text/markdown; charset=utf-8\n  Cache-Control: no-cache\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: no-cache\n/llms-full.txt\n  Content-Type: text/markdown; charset=utf-8\n  Cache-Control: no-cache\n/sitemap.xml\n  Cache-Control: no-cache\n/robots.txt\n  Cache-Control: no-cache\n';
await writeFile(path.join(output, 'client/_headers'), headers);
console.log('Built Orka for ' + (pages ? 'Cloudflare Pages' : 'Sites') + ' with versioned assets and website metadata preview.');
