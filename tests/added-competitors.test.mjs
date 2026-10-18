import test from 'node:test';
import assert from 'node:assert/strict';
import {vendorCost,projectCostSummary} from '../public/pricing-model.js';

test('three people and three projects use each documented billing model',()=>{
 for(const [vendor,plan,expected] of [
  ['gleap',1,179],['helpscout',1,126],['freshchat',1,69],
  ['zendesk',1,447],['chatwoot',1,57]
 ])assert.equal(vendorCost(vendor,plan,3,null,3),expected,vendor);
 assert.match(projectCostSummary('helpscout',1,3,3),/\$90\.00 team base \+ \$36\.00 project add-ons/);
});

test('Gleap Starter enforces one seat and project while Team stays a flat subscription',()=>{
 assert.equal(vendorCost('gleap',0,1,null,1),35);
 assert.equal(vendorCost('gleap',0,2,null,1),null);
 assert.equal(vendorCost('gleap',0,1,null,2),null);
 assert.equal(vendorCost('gleap',1,50,null,20),179);
 assert.equal(vendorCost('gleap',2,50,null,20),359);
});

test('Help Scout charges only resources beyond the included inboxes and Docs sites',()=>{
 assert.equal(vendorCost('helpscout',1,3,null,2),90);
 assert.equal(vendorCost('helpscout',1,3,null,5),198);
 assert.equal(vendorCost('helpscout',2,3,null,3),162);
 assert.equal(vendorCost('helpscout',2,3,null,4),186);
 assert.equal(vendorCost('helpscout',2,3,null,6),246);
});

test('Help Scout rejects teams or independently configured projects above plan limits',()=>{
 assert.equal(vendorCost('helpscout',0,5,null,1),0);
 assert.equal(vendorCost('helpscout',0,6,null,1),null);
 assert.equal(vendorCost('helpscout',0,5,null,2),null);
 assert.equal(vendorCost('helpscout',1,25,null,5),858);
 assert.equal(vendorCost('helpscout',1,26,null,1),null);
 assert.equal(vendorCost('helpscout',1,3,null,6),null);
 assert.equal(vendorCost('helpscout',2,50,null,50),4368);
 assert.equal(vendorCost('helpscout',2,51,null,1),null);
 assert.equal(vendorCost('helpscout',2,3,null,51),null);
});

test('Help Scout Pro bills at least ten users and still adds resources individually',()=>{
 assert.equal(vendorCost('helpscout',3,3,null,3),900);
 assert.equal(vendorCost('helpscout',3,10,null,5),900);
 assert.equal(vendorCost('helpscout',3,11,null,5),990);
 assert.equal(vendorCost('helpscout',3,3,null,6),924);
 assert.equal(vendorCost('helpscout',3,3,null,11),1056);
});

test('Freshchat and Chatwoot enforce free seat limits without adding a website multiplier',()=>{
 assert.equal(vendorCost('freshchat',0,10,null,3),0);
 assert.equal(vendorCost('freshchat',0,11,null,1),null);
 assert.equal(vendorCost('freshchat',1,3,null,8),69);
 assert.equal(vendorCost('chatwoot',0,2,null,3),0);
 assert.equal(vendorCost('chatwoot',0,3,null,1),null);
 assert.equal(vendorCost('chatwoot',1,3,null,8),57);
});

test('Zendesk brand limits require an appropriate plan or a complete Enterprise quote',()=>{
 assert.equal(vendorCost('zendesk',0,3,null,1),207);
 assert.equal(vendorCost('zendesk',0,3,null,2),null);
 assert.equal(vendorCost('zendesk',1,3,null,5),447);
 assert.equal(vendorCost('zendesk',1,3,null,6),null);
 assert.equal(vendorCost('zendesk',2,3,1250,6),1250);
 assert.match(projectCostSummary('zendesk',2,3,6,1250),/complete portfolio estimate · no project multiplier/);
 for(const quote of [null,-1,NaN,Infinity,'1250'])assert.equal(vendorCost('zendesk',2,3,quote,6),null);
 assert.equal(vendorCost('zendesk',2,3,0,6),0);
});

test('new billing models reject invalid team or project counts before computing totals',()=>{
 for(const vendor of ['gleap','helpscout','freshchat','zendesk','chatwoot']){
  for(const count of [0,-1,1.5,NaN,Infinity]){
   assert.equal(vendorCost(vendor,1,count,null,3),null);
   assert.equal(vendorCost(vendor,1,3,null,count),null);
  }
 }
});
