import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,access} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {conversationTokens,CONVERSATION_PROFILES,aiCost} from '../public/pricing-model.js';
import {openQuestionInChat} from '../public/site-interactions.js';
import {installationGuides,exampleSnippet} from '../scripts/installation-content.mjs';
import {bestChatGuides} from '../scripts/best-chat-content.mjs';
import {generateEditorial} from '../scripts/editorial-pages.mjs';

test('conversation estimates count ten replies and reread only the preceding history',()=>{
 for(const [id,p] of Object.entries(CONVERSATION_PROFILES)){
  let input=0,history=0,output=0;
  for(let turn=0;turn<10;turn++){
   input+=p.contextTokens+history+p.userTokens;
   output+=p.replyTokens;
   history+=p.userTokens+p.replyTokens;
  }
  assert.deepEqual(conversationTokens(id),{input,output});
  assert.deepEqual(conversationTokens(id,1000),{input:input*1000,output:output*1000});
 }
 const tokens=conversationTokens('typical',1000);
 assert.deepEqual(tokens,{input:23700000,output:1200000});
 assert.equal(aiCost('gpt-5-mini',tokens.input,tokens.output),16.65);
 assert.equal(aiCost('claude-haiku-4-5',tokens.input,tokens.output),59.4);
 assert.equal(aiCost('gpt-5-mini',tokens.input,tokens.output,true),8.325);
 assert.deepEqual(conversationTokens('typical',0),{input:0,output:0});
 for(const bad of [-1,1.5,Infinity,NaN])assert.equal(conversationTokens('typical',bad),null);
 assert.equal(conversationTokens('unknown',1),null);
});

test('FAQ handoff opens Orka with the question as an unsent draft after the widget is ready',async()=>{
 const calls=[];let ticks=0;
 const widget={showWidget(){calls.push('visible');},show(text){calls.push(text);}};
 const options={getWidget:()=>ticks>0?widget:null,isReady:()=>ticks>1,wait:async()=>{ticks++;}};
 assert.equal(await openQuestionInChat('  ',options),false);
 assert.equal(ticks,0);
 assert.equal(await openQuestionInChat(' Can I use A&B?\nWhat about café + SaaS? ',options),true);
 assert.deepEqual(calls,['visible','Can I use A&B?\nWhat about café + SaaS?']);
 assert.equal(ticks,2);
 // No email, automatic send, account data or conversation history is passed.
 assert.equal(calls.length,2);
});

test('FAQ handoff ends its wait and keeps a blocked widget retryable',async()=>{
 let waits=0;
 await assert.rejects(openQuestionInChat('Where do I start?',{getWidget:()=>null,isReady:()=>false,wait:async()=>{waits++;}}),/question is still here/);
 assert.equal(waits,50);
 let draft;
 assert.equal(await openQuestionInChat('Where do I start?',{getWidget:()=>({show:text=>draft=text}),isReady:()=>true}),true);
 assert.equal(draft,'Where do I start?');
});

test('installation guides protect the project ID and all buying guides have navigable, sourced shortlists',async()=>{
 assert.equal(installationGuides.length,10);assert.equal(bestChatGuides.length,8);
 assert.match(exampleSnippet,/YOUR_PROJECT_ID/);assert.doesNotMatch(exampleSnippet,/[a-f0-9]{24}/);
 assert.ok(bestChatGuides.some(g=>g.picks[0][0]!=='orka'));
 const temp=await mkdtemp(path.join(os.tmpdir(),'orka-guide-test-'));
 try{
  await generateEditorial(temp);
  for(const g of installationGuides){
   const html=await readFile(path.join(temp,'how-to-add-orka-to-'+g.id+'.html'),'utf8');
   assert.match(html,/YOUR_PROJECT_ID/);assert.match(html,/&lt;script type=/);
   assert.doesNotMatch(html,/[a-f0-9]{24}|<script type="text\/javascript">window\.ORKA/);
   assert.match(html,/FAQPage/);assert.match(html,/data-faq-ask/);
   assert.match(html,/published/i);
   for(const [,url] of g.sources)assert.ok(html.includes(url));
   if(g.id==='shopify')assert.match(html,/https:\/\/apps.shopify.com\/orka-live-chat/);
  }
  for(const g of bestChatGuides){
   const html=await readFile(path.join(temp,'best-live-chat-for-'+g.id+'.html'),'utf8');
   assert.match(html,/editorial/i);assert.match(html,/September 2026/);assert.match(html,/FAQPage/);
   const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
   for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),'Missing anchor '+id);
   for(const [id] of g.picks)assert.ok(html.includes('id="pick-'+id+'"'));
  }
  const marks=JSON.parse(await readFile(new URL('../scripts/vendor-logos.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(marks).length,11);
  for(const [id,mark] of Object.entries(marks)){
   await access(new URL('../public'+mark.path,import.meta.url));
   for(const slug of ['orka-vs-'+id,id+'-review',id+'-alternatives']){
    assert.ok((await readFile(path.join(temp,slug+'.html'),'utf8')).includes(mark.path),slug);
   }
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
