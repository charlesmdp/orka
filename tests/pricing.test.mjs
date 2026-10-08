import test from 'node:test';
import assert from 'node:assert/strict';
import {plans,featureGroups,homePlanCards} from '../scripts/plan-copy.mjs';
import {pricingBody} from '../scripts/pricing-page.mjs';

test('four plans preserve the approved prices, inheritance and AI eligibility',()=>{
 assert.deepEqual(plans.map(p=>[p.name,p.price,p.people,p.ai]),[['Free',0,'1 team member',false],['Light',9.99,'2 team members',false],['Pro',29,'3 team members',true],['Max',99,'12 team members',true]]);
 assert.deepEqual(plans.slice(1).map(p=>p.includes),['Everything in Free, plus','Everything in Light, plus','Everything in Pro, plus']);
 const cards=homePlanCards();assert.equal((cards.match(/data-orka-plan-card=/g)||[]).length,4);
 assert.equal((cards.match(/class="plan-ai-choice"/g)||[]).length,2);
 for(const p of plans)assert.ok(cards.includes(`mosaic-pricing-${p.style}.jpg`));
});
test('the complete comparison puts daily tools on Light, AI on Pro, and extras on Max',()=>{
 const rows=featureGroups.flatMap(g=>g.rows);assert.equal(rows.length,38);
 const matrix=new Map(rows.map(([label,values])=>[label,values]));
 for(const label of ['Live chat & email follow-up','SDK & custom visitor data','Help center','Live typing preview','Import your existing knowledge'])assert.deepEqual(matrix.get(label),[true,true,true,true]);
 assert.deepEqual(matrix.get('Project access & permissions'),['N/A',true,true,true]);
 for(const label of ['Conversation search','Image & file sharing','Support analytics','Saved replies','Live visitor map'])assert.deepEqual(matrix.get(label),[false,true,true,true]);
 for(const label of ['AI help center translation','Human handoff','AI confidence threshold','Bring your own AI key or use Orka AI'])assert.deepEqual(matrix.get(label),[false,false,true,true]);
 assert.deepEqual(matrix.get('Additional team members'),[false,false,false,'€8/member/mo']);
 for(const label of ['Team performance reports','Conversation satisfaction scores','Remove Orka branding'])assert.deepEqual(matrix.get(label),[false,false,false,true]);
});
test('pricing renders a crawlable 4-plan comparison, valid EUR offers and the project modal',()=>{
 const html=pricingBody({aiCalculator:()=>'',finalCta:()=>''});
 for(const p of plans)assert.ok(html.includes(`data-orka-plan-card="${p.name}"`));
 assert.equal((html.match(/<tr><th scope="row">/g)||[]).length,38);
 assert.match(html,/Crisp, GitBook, Intercom, Gleap &amp; Help Scout/);
 assert.match(html,/OpenAI, Anthropic or OpenRouter/);assert.match(html,/data-project/);
 const json=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const offers=json.find(j=>j['@type']==='SoftwareApplication').offers;
 assert.equal(offers.length,4);for(const offer of offers){assert.equal(offer.priceCurrency,'EUR');assert.equal(offer.priceSpecification.billingDuration,'P1M');}
 assert.doesNotMatch(html,/twenty people|20 people|\$29|\$99/);
});
