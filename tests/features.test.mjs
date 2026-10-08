import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matchesFeature} from '../public/features.js';
import {featureVisual,illustratedFeatureIds} from '../scripts/feature-visuals.mjs';
import {buildFaqKnowledge} from '../scripts/faq-knowledge.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const html = await readFile(new URL('../public/features.html', import.meta.url), 'utf8');

test('feature illustrations stay decorative and their example conversations never become FAQ facts',async()=>{
  const catalogue=JSON.parse(await readFile(new URL('../scripts/product-catalogue.json',import.meta.url),'utf8'));
  assert.ok(illustratedFeatureIds.length>=catalogue.features.length*.8,'Illustrate most of the catalogue');
  for(const id of illustratedFeatureIds){
    assert.ok(catalogue.features.some(f=>f[0]===id),id+' must belong to the catalogue');
    const preview=featureVisual(id,'conversations');
    assert.match(preview,/aria-hidden="true"/);
    assert.doesNotMatch(preview,/<(?:button|input|a\s|script)/,'Previews must not add fake controls or tab stops');
  }
  const dir=await mkdtemp(path.join(tmpdir(),'orka-feature-preview-'));
  try{
    await writeFile(path.join(dir,'features.html'),`<title>Features</title><main>${featureVisual('live-chat','conversations')}<h4>Real-time live chat</h4><p>Talk to visitors while they are on your website.</p></main>`);
    const docs=await buildFaqKnowledge(dir);
    assert.ok(docs[0].text.includes('Talk to visitors'));
    assert.doesNotMatch(docs[0].text,/Forest green|in stock/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('feature search combines category and all search words, ignoring case and accents', () => {
  assert.equal(matchesFeature('Two-way translation for cafés', 'ai', ' CAFÉ translation ', 'all'), true);
  assert.equal(matchesFeature('Two-way translation', 'ai', 'translation', 'context'), false);
  assert.equal(matchesFeature('Two-way translation', 'ai', 'translation visitor', 'ai'), false);
  assert.equal(matchesFeature('Live visitor map', 'context', '  ', 'context'), true);
});

test('the catalogue covers the original feature inventory and every audience recommendation resolves', () => {
  const covered = new Set([...html.matchAll(/data-source-features="([^"]*)"/g)].flatMap(match => match[1].split(' ').filter(Boolean)));
  for (let number = 1; number <= 38; number++) assert.ok(covered.has(String(number)), `Missing original feature ${number}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Page anchors must be unique');
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Broken anchor ${match[1]}`);
  for (const audience of ['solo', 'team', 'legal', 'shop', 'saas', 'agency']) {
    assert.ok(html.includes(`data-audience="${audience}"`));
    assert.ok(html.includes(`data-audience-story="${audience}"`));
  }
  for (const feature of ['help-center', 'multilingual-help', 'custom-orky', 'visitor-cart', 'ai-shortcuts']) {
    assert.ok(ids.includes(`feature-${feature}`), `Missing additional feature ${feature}`);
  }
});

test('all account calls to action use the requested signup and login destinations', async () => {
  for (const page of ['index', 'features', 'terms', 'privacy', 'cookies']) {
    const source = await readFile(new URL(`../public/${page}.html`, import.meta.url), 'utf8');
    const links = [...source.matchAll(/<a\b[^>]*href="([^"]*(?:dashboard|app)\.orka\.chat[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.ok(links.length >= 2, `${page} needs account navigation`);
    for (const [, href, label] of links) {
      assert.equal(href, /log\s*in/i.test(label) ? 'http://dashboard.orka.chat/' : 'http://dashboard.orka.chat/signup', `${page}: ${label}`);
    }
  }
});
