import test from 'node:test';
import assert from 'node:assert/strict';
import {vendorCost,orkaPlan,projectCostSummary,PROJECT_BILLING} from '../public/pricing-model.js';
import {migrationPages,migrationSlugs} from '../scripts/migration-guides.mjs';
import {additionalAlternativePages} from '../scripts/alternative-guides.mjs';
import {comparisonBody,reviewBody,alternativesBody} from '../scripts/comparison-layout.mjs';
import {comparisons} from '../scripts/comparison-content.mjs';

test('portfolio subscriptions multiply only documented per-workspace and per-property costs',()=>{
 assert.equal(vendorCost('crisp',2,3,null,3),285);
 assert.equal(vendorCost('crisp',3,21,null,3),915);
 assert.equal(vendorCost('crisp',0,3,null,3),null);
 assert.equal(vendorCost('tidio',1,3,null,3),87);
 assert.equal(vendorCost('intercom',0,3,null,3),351);
 assert.equal(vendorCost('chatra',1,3,null,3),93);
 assert.equal(vendorCost('commslayer',1,3,null,3),39);
 assert.equal(vendorCost('tawk',0,3,null,3),0);
 assert.equal(vendorCost('tawk',1,3,null,3),87);
 assert.equal(vendorCost('gorgias',0,3,250,3),250);
 assert.equal(vendorCost('rocketchat',0,3,100,5),100);
 assert.equal(orkaPlan(3).price,29);
 assert.match(projectCostSummary('crisp',2,3,3),/3 workspaces × \$95.00 = \$285.00/);
});
test('unsupported project scope never masquerades as an included subscription',()=>{
 assert.equal(vendorCost('chatway',1,3,null,3),null);
 assert.equal(vendorCost('chatway',2,3,null,3),199);
 assert.equal(vendorCost('willdesk',0,3,null,2),null);
 assert.equal(vendorCost('willdesk',1,3,null,3),16.9);
 assert.equal(vendorCost('willdesk',1,3,null,4),null);
 assert.equal(vendorCost('bestchat',2,3,null,3),null);
 for(const projects of [0,-1,1.5,NaN,Infinity])assert.equal(vendorCost('crisp',2,3,null,projects),null);
});
test('every comparison, review and alternatives page exposes project billing and its source',()=>{
 for(const item of comparisons){
  for(const render of [comparisonBody,reviewBody,alternativesBody]){
   const html=render(item,{costCalculator:()=>'',finalCta:()=>''});
   assert.match(html,/id="project-pricing"/);
   assert.ok(html.includes(PROJECT_BILLING[item.id].source));
   assert.match(html,/Launch a fourth project: still €29/);
  }
 }
});
test('migration guides explain both real URL entry routes and scope',()=>{
 const pages=migrationPages();assert.deepEqual(pages.map(p=>p.slug),migrationSlugs);
 for(const p of pages){
  assert.match(p.body,/During account creation/);
  assert.match(p.body,/In the Help center tab/);
  assert.match(p.body,/automatically/);
  assert.match(p.body,/Conversation history, inbox rules and domain redirects are separate/);
  assert.equal(p.updated,'2026-10-15');
  assert.match(p.body,/"@type":"FAQPage"/);
 }
});
test('new alternatives use the actual multibrand and inbox billing models',()=>{
 const [zendesk,chatwoot]=additionalAlternativePages();
 assert.equal(zendesk.slug,'zendesk-alternatives');assert.match(zendesk.body,/\$447/);
 assert.equal(chatwoot.slug,'chatwoot-alternatives');assert.match(chatwoot.body,/\$57/);
 for(const page of [zendesk,chatwoot]){
  assert.match(page.body,/15 October 2026/);assert.match(page.body,/id="sources"/);
  assert.doesNotMatch(page.body,/href="\/(?:orka-vs-(?:zendesk|chatwoot)|(?:zendesk|chatwoot)-review)"/);
  assert.match(page.body,/does not promise a Zendesk or Chatwoot importer/);
 }
});
