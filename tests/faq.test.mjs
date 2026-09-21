import test from 'node:test';
import assert from 'node:assert/strict';
import {answerFaq,selectFaqSources,allowFaqRequest} from '../server/faq.mjs';
import {safeFaqSource} from '../public/site-interactions.js';
import {appGuidePages} from '../scripts/app-guides.mjs';
import {readFile,access} from 'node:fs/promises';
const documents=[{id:'pricing-0',title:'Orka pricing',url:'https://orka.chat/pricing',text:'Solo free. Pod $29 for 3 people. Fleet $99 for 20 people. Unlimited projects. AI costs separate.'},{id:'help-0',title:'Help center',url:'https://orka.chat/help-center',text:'Markdown help articles, multilingual content, translation and custom domains.'},{id:'features-0',title:'Features',url:'https://orka.chat/features',text:'Live chat and shared inbox for unlimited projects.'}];
const request=(question,options={})=>new Request('https://orka.chat/api/faq-answer',{method:'POST',headers:{Origin:'https://orka.chat','Content-Type':'application/json','CF-Connecting-IP':Math.random().toString(),...options.headers},body:JSON.stringify({question,...options.body})});
const env={OPENAI_API_KEY:'test-secret-never-real',ASSETS:{fetch:async()=>Response.json({documents})}};
const result=(answer='Pod is $29 per month for up to three people.',ids=['pricing-0'])=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({answer,supported:true,source_ids:ids})}]}]});
test('FAQ retrieves relevant website facts and supports French price questions',()=>{
 assert.equal(selectFaqSources('Quels sont les prix ?',documents)[0].id,'pricing-0');
 assert.equal(selectFaqSources('Help center translation',documents)[0].id,'help-0');
});
test('FAQ sends only the submitted question and selected public excerpts, with the key server-side',async()=>{
 let sent;
 const response=await answerFaq(request('What does Pod cost?',{body:{account:{secret:'do not send'},chat_history:['private conversation']}}),env,async(url,options)=>{sent={url,...options};return result();});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.sources[0].url,'https://orka.chat/pricing');
 const payload=JSON.parse(sent.body);assert.equal(payload.model,'gpt-5-mini');assert.equal(payload.store,false);
 assert.deepEqual(Object.keys(JSON.parse(payload.input)).sort(),['excerpts','question']);assert.doesNotMatch(sent.body,/private conversation|do not send/);
 assert.equal(sent.headers.Authorization,'Bearer test-secret-never-real');assert.doesNotMatch(JSON.stringify(data),/test-secret/);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('FAQ fails safely for missing key, bad origin, oversize input and provider errors',async()=>{
 const never=()=>{throw new Error('Should not call provider');};
 assert.equal((await answerFaq(request('Price please'),{},never)).status,503);
 assert.equal((await answerFaq(request('Price please',{headers:{Origin:'https://other.example'}}),env,never)).status,403);
 assert.equal((await answerFaq(request('x'.repeat(601)),env,never)).status,400);
 const error=await answerFaq(request('Price please'),env,async()=>Response.json({error:'secret debug details'},{status:401}));
 assert.equal(error.status,502);assert.doesNotMatch(await error.text(),/secret debug/);
 assert.equal((await answerFaq(request('Price please'),env,async()=>result('Made up',['unknown-source']))).status,502);
 assert.equal((await answerFaq(request('Price please'),env,async()=>result('No citations',[]))).status,502);
});
test('FAQ only accepts site links and limits bursts',()=>{
 assert.equal(safeFaqSource('javascript:alert(1)'),null);assert.equal(safeFaqSource('https://evil.example/'),null);
 assert.equal(safeFaqSource('https://orka.chat@evil.example/'),null);assert.equal(safeFaqSource('https://orka.chat/pricing'),'https://orka.chat/pricing');
 const now=Date.now()+1000000;
 for(let i=0;i<6;i++)assert.equal(allowFaqRequest('burst-test',now),true);
 assert.equal(allowFaqRequest('burst-test',now),false);assert.equal(allowFaqRequest('burst-test',now+600001),true);
});
test('new app guides are substantial, linked, source-based and contain no real installation ID',async()=>{
 const pages=appGuidePages();assert.equal(pages.length,5);
 for(const page of pages){
  assert.ok(page.body.includes('FAQPage'));assert.ok(page.body.includes('September 2026'));
  const words=page.body.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').split(/\s+/).length;
  assert.ok(words>800,page.slug+' too short');assert.doesNotMatch(page.body,/[a-f\d]{24}/);
  for(const [,src] of page.body.matchAll(/src="(\/assets\/[^\"]+)"/g))await access(new URL('../public'+src,import.meta.url));
 }
 const shopify=pages.find(p=>p.slug.endsWith('shopify-apps')).body;
 for(const feature of ['Cowlendar','BIG Digital Downloads','Rapi Bundles','EZ Product Image Translate','Shopify plan','App plan','Installed','SDK'])assert.ok(shopify.includes(feature));
 const gif=await readFile(new URL('../public/assets/orca-surprise.gif',import.meta.url));assert.match(gif.subarray(0,6).toString(),/^GIF8/);
});
