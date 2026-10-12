import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {workPackages,totalBuildHours,scenarios,scenarioTotal} from '../scripts/blog-costs.mjs';
import {blogPages,blogPosts} from '../scripts/blog-pages.mjs';
import {generateEditorial} from '../scripts/editorial-pages.mjs';
import {buildFaqKnowledge} from '../scripts/faq-knowledge.mjs';
import {ownershipCost} from '../public/blog-budget.js';

test('DIY budget covers the entire product without double-counting features',async()=>{
 const catalogue=JSON.parse(await readFile(new URL('../scripts/product-catalogue.json',import.meta.url),'utf8'));
 const ids=workPackages.flatMap(p=>p[3]);
 assert.equal(new Set(ids).size,ids.length,'A feature cannot be billed in two work packages');
 assert.deepEqual([...ids].sort(),catalogue.features.map(f=>f[0]).sort());
 assert.deepEqual(totalBuildHours,[488,968]);
 assert.deepEqual(scenarios.map(scenarioTotal),[10,130.02,527.94]);
 assert.equal(ownershipCost({hours:488,rate:50,maintenance:12,services:130.02,extras:0}),33160.24);
 assert.equal(ownershipCost({hours:488,rate:0,maintenance:12,services:10,extras:25}),145,'Zero hourly value must reveal cash cost');
 assert.equal(ownershipCost({hours:0,rate:0,maintenance:0,services:0,extras:0}),0);
 assert.equal(ownershipCost({hours:NaN,rate:50,maintenance:12,services:10,extras:0}),null);
 assert.equal(ownershipCost({hours:-1,rate:50,maintenance:12,services:10,extras:0}),null);
});

test('blog articles are crawlable, sourced, cross-linked and isolated from product FAQ facts',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'orka-blog-'));
 try{
  await generateEditorial(directory);
  const sitemap=await readFile(path.join(directory,'sitemap.xml'),'utf8');
  for(const post of blogPages()){
   const html=await readFile(path.join(directory,post.slug+'.html'),'utf8');
   assert.ok(sitemap.includes('https://orka.chat/'+post.slug));
   assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
   assert.doesNotMatch(html,/<!-- (?:TOTAL_|COST_|WORK_|SCENARIO|FEATURE_COUNT|OWNERSHIP|ARCHITECTURE)/);
   for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g))JSON.parse(json);
   const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
   assert.equal(ids.length,new Set(ids).size);
   for(const [,id] of html.matchAll(/href="#([^"#]+)"/g))assert.ok(ids.includes(id),`${post.slug}: missing ${id}`);
   if(post.slug==='blog')continue;
   assert.ok(post.words>3000);
   assert.match(html,/BlogPosting/);
   assert.ok((html.match(/href="https:\/\//g)||[]).length>=15);
   const markdown=await readFile(path.join(directory,post.slug+'.md'),'utf8');
   assert.match(markdown,/https:\/\/developers.cloudflare.com/);
   assert.match(markdown,/https:\/\/resend.com/);
   assert.ok(html.includes('/'+blogPosts.find(p=>p.slug!==post.slug).slug));
  }
  const knowledge=await buildFaqKnowledge(directory);
  assert.ok(!knowledge.some(d=>blogPosts.some(p=>d.url.endsWith('/'+p.slug))),'Hypothetical DIY prices must not become Orka FAQ claims');
 }finally{await rm(directory,{recursive:true,force:true});}
});
