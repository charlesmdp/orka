import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {portfolioVendors,portfolioRow,portfolioCsv,formatPortfolioCost} from '../public/portfolio-pricing.js';
import {generateEditorial} from '../scripts/editorial-pages.mjs';
import {founderResourceSlugs} from '../scripts/founder-resources.mjs';
import {comparisons} from '../scripts/comparison-content.mjs';
import {editorialUpdated,editorialYear,migrationPath} from '../scripts/editorial-policy.mjs';

test('portfolio table distinguishes workspace multiplication, included projects and resource limits',()=>{
 const row=id=>portfolioRow(portfolioVendors.find(v=>v.id===id),3);
 assert.deepEqual(row('orka').totals,[29,29,29]);
 assert.deepEqual(row('crisp').totals,[95,285,950]);
 assert.deepEqual(row('gleap').totals,[179,179,179]);
 assert.deepEqual(row('commslayer').totals,[39,39,39]);
 assert.deepEqual(row('tawk').totals,[0,0,0]);
 assert.deepEqual(row('helpscout').totals,[90,126,null]);
 assert.deepEqual(portfolioRow(portfolioVendors[0],1).totals,[0,0,0]);
 assert.deepEqual(portfolioRow(portfolioVendors[0],13).totals,[107,107,107]);
 assert.deepEqual(portfolioRow(portfolioVendors.find(v=>v.id==='crisp'),11).totals,[null,null,null]);
 for(const seats of [0,-1,1.5,NaN,Infinity])assert.equal(portfolioRow(portfolioVendors[0],seats),null);
 assert.equal(formatPortfolioCost(null,'USD'),'Plan limit');
});

test('download preserves units, plan limits and sources instead of presenting missing prices as zero',()=>{
 const csv=portfolioCsv(3);
 assert.equal(csv.split('\r\n').filter(Boolean).length,portfolioVendors.length+1);
 assert.match(csv,/"Crisp","Essentials · help center included","3","USD","95","285","950"/);
 assert.match(csv,/"Orka","Pro","3","EUR","29","29","29"/);
 assert.match(csv,/"Help Scout"[^\r\n]+"Plan limit"/);
 assert.match(csv,/"Billing assumptions","Source","Price reference date"/);
 assert.match(csv,/"2026-10-18"/);
 assert.match(portfolioCsv(1,{crisp:0}),/"Crisp","Free","1","USD","0","0","0"/);
 assert.match(portfolioCsv(3,{helpscout:2}),/"Help Scout","Plus · 5 inboxes & 3 Docs sites","3","USD","162","162","390"/);
});

test('revised comparison editions keep evergreen URLs, coherent dates and a contextual migration path',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'orka-founder-seo-'));
 try{
  await generateEditorial(dir);
  const sitemap=await readFile(path.join(dir,'sitemap.xml'),'utf8');
  for(const c of comparisons)for(const slug of [`orka-vs-${c.id}`,`${c.id}-alternatives`,`${c.id}-review`]){
   const html=await readFile(path.join(dir,slug+'.html'),'utf8'),md=await readFile(path.join(dir,slug+'.md'),'utf8');
   assert.ok(html.match(/<title>(.*?)<\/title>/s)[1].includes(editorialYear),slug);
   assert.ok(html.match(/<h1>(.*?)<\/h1>/s)[1].includes(editorialYear),slug);
   assert.ok(html.includes(`"dateModified":"${editorialUpdated}"`),slug);
   assert.ok(md.includes(`Updated: ${editorialUpdated}`),slug);
   const main=html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
   assert.ok(main.includes(`href="${migrationPath(c.id)}"`),slug);
   assert.ok(main.includes('href="/installation"'),slug);
   assert.ok(sitemap.includes(`<loc>https://orka.chat/${slug}</loc><lastmod>${editorialUpdated}</lastmod>`),slug);
  }
  const newSlugs=[...founderResourceSlugs,'migrate-gleap-help-center-to-orka','migrate-gorgias-help-center-to-orka','migrate-tawk-help-center-to-orka'];
  for(const slug of newSlugs){
   const html=await readFile(path.join(dir,slug+'.html'),'utf8');
   assert.equal([...html.matchAll(/<h1\b/g)].length,1,slug);
   const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
   assert.equal(ids.length,new Set(ids).size,slug+' duplicate id');
   assert.ok(html.includes(`rel="canonical" href="https://orka.chat/${slug}"`));
   for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),slug+' missing '+id);
   assert.ok(sitemap.includes(`<loc>https://orka.chat/${slug}</loc>`),slug);
   const md=await readFile(path.join(dir,slug+'.md'),'utf8');
   assert.ok(md.includes('2026-10-19'));
  }
  const pricing=await readFile(path.join(dir,'live-chat-pricing.html'),'utf8');
  assert.match(pricing,/data-project-price[^>]*>€29/);
  assert.match(pricing,/founder-resources.js/);
  assert.match(pricing,/pricing-model|Official billing reference/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
