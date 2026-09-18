import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,access,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {comparisons,comparisonSections} from '../scripts/comparison-content.mjs';
import {generateEditorial} from '../scripts/editorial-pages.mjs';
import {AI_MODELS,AI_MARKUP,aiCost,orkaPlan,vendorCost,VENDOR_PLANS} from '../public/pricing-model.js';
import {searchHelp} from '../public/editorial.js';

test('AI charges use per-million input/output prices and the approved 2× multiplier',()=>{
 assert.equal(AI_MARKUP,2);
 assert.equal(aiCost('gpt-5-mini',1e6,1e6),4.5);
 assert.equal(aiCost('claude-haiku-4-5',1e6,1e6),12);
 assert.equal(aiCost('gpt-5-mini',1e6,200000),1.3);
 assert.equal(aiCost('gpt-5-mini',1e6,200000,true),0.65);
 assert.equal(aiCost('gpt-5-mini',0,0),0);
 for(const invalid of [-1,NaN,Infinity])assert.equal(aiCost('gpt-5-mini',invalid,1),null);
 assert.equal(aiCost('unknown',1,1),null);
});

test('team calculations respect bundles, per-seat prices, limits and missing quotes',()=>{
 assert.deepEqual([1,3,4,20].map(n=>orkaPlan(n).price),[0,29,99,99]);
 assert.equal(orkaPlan(21),null);
 assert.equal(vendorCost('intercom',0,3),117);
 assert.equal(vendorCost('crisp',2,10),95);
 assert.equal(vendorCost('crisp',2,11),null);
 assert.equal(vendorCost('crisp',3,21),305);
 assert.equal(vendorCost('chatway',2,5),98);
 assert.equal(vendorCost('bestchat',3,7),null);
 assert.equal(vendorCost('tidio',1,11),null);
 assert.equal(vendorCost('willdesk',1,20),16.9);
 assert.equal(vendorCost('tawk',0,20),0);
 assert.equal(vendorCost('commslayer',0,20),0);
 assert.equal(vendorCost('gorgias',0,3),null);
 assert.equal(vendorCost('gorgias',0,3,0),0);
 assert.equal(vendorCost('rocketchat',0,3,-5),null);
 assert.equal(vendorCost('rocketchat',0,3,123),123);
});

test('help-center search works in both demo languages, with accents and no-result cases',()=>{
 assert.equal(searchHelp('premier equipe','fr')[0]?.id,'first-project');
 assert.equal(searchHelp('PRIVATE handovers')[0]?.id,'invite-team');
 assert.equal(searchHelp('potato submarine').length,0);
 assert.equal(searchHelp('').length,4);
});

test('all eleven guides have over 1,000 editorial words, usable evidence and complete catalogues',async()=>{
 assert.equal(comparisons.length,11);
 assert.equal(new Set(comparisons.map(c=>c.id)).size,11);
 const catalogue=JSON.parse(await readFile(new URL('../scripts/product-catalogue.json',import.meta.url),'utf8'));
 const featureIds=new Set(catalogue.features.map(f=>f[0]));
 assert.equal(featureIds.size,65);
 const temp=await mkdtemp(path.join(os.tmpdir(),'orka-editorial-'));
 try{
  const built=await generateEditorial(temp);
  assert.equal(built.comparisons,11);
  for(const c of comparisons){
   const sections=comparisonSections(c);
   assert.ok(sections.flatMap(s=>s.paragraphs).join(' ').split(/\s+/).length>=1000,c.id);
   for(const section of sections)for(const index of section.sources)assert.ok(c.sources[index],`${c.id}: invalid citation`);
   for(const [feature,proof] of Object.entries(c.proof)){
    assert.ok(featureIds.has(feature),`${c.id}: unknown feature ${feature}`);
    assert.ok(c.sources[proof[1]],`${c.id}: proof missing`);
   }
   assert.ok(VENDOR_PLANS[c.id][c.defaultPlan]);
   const html=await readFile(path.join(temp,`orka-vs-${c.id}.html`),'utf8');
   const md=await readFile(path.join(temp,`orka-vs-${c.id}.md`),'utf8');
   assert.equal([...html.matchAll(/<tr><th scope="row">/g)].length,65);
   assert.match(html,/<article class="ed-prose" data-longform>/);
   assert.match(html,/rel="canonical"/);assert.match(html,/type="text\/markdown"/);
   for(const section of sections)assert.ok(md.includes(section.paragraphs[0]));
   for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(json));
   const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
   for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),`${c.id} broken anchor ${id}`);
  }
  const aliases=await readFile(path.join(temp,'_redirects'),'utf8');assert.match(aliases,/^\/llm \/llms-full.txt 200/m);
  const facts=await readFile(path.join(temp,'llms-full.txt'),'utf8');assert.match(facts,/BIGMO SAS/);assert.match(facts,/hello@orka.chat/);assert.doesNotMatch(facts,/PENIDA|0\.50 \/ 1,000/);
  for(const c of comparisons)assert.ok((await readFile(path.join(temp,'sitemap.xml'),'utf8')).includes('/orka-vs-'+c.id));
  for(const name of (await readdir(temp)).filter(n=>n.endsWith('.html'))){
   const html=await readFile(path.join(temp,name),'utf8');
   for(const [,href] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(?:https?:|mailto:)/.test(href))continue;
    const raw=href.split('#')[0];if(!raw||raw==='/')continue;
    const rel=raw.replace(/^\//,'');
    const generated=path.join(temp,rel.includes('.')?rel:rel+'.html');
    const existing=new URL('../public/'+(rel.includes('.')?rel:rel+'.html'),import.meta.url);
    try{await access(generated)}catch{await assert.doesNotReject(access(existing),`${name}: missing ${href}`)}
   }
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
