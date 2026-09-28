import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {screenshotPreview} from '../server/index.mjs';
import capture from '../workers/site-capture/index.mjs';

const picture = () => new Response(new Uint8Array([255,216,255,217]),{headers:{'Content-Type':'image/jpeg'}});
const dns = async () => Response.json({Answer:[{type:1,data:'104.21.7.52'}]});
const request = (url, ip='1') => new Request('https://orka.chat/api/website-screenshot',{
  method:'POST',headers:{Origin:'https://orka.chat','Content-Type':'application/json','CF-Connecting-IP':ip,Cookie:'private=never-forward',Authorization:'Bearer never-forward'},body:JSON.stringify({url})
});

test('screenshot endpoint rejects cross-origin, private addresses and missing capture service',async()=>{
  assert.equal((await worker.fetch(new Request('https://orka.chat/api/website-screenshot'),{})).status,405);
  assert.equal((await screenshotPreview(new Request('https://orka.chat/api/website-screenshot',{method:'POST',body:'{}'}),{})).status,403);
  assert.equal((await screenshotPreview(request('https://example.com/'),{})).status,503);
  let called=false;
  const env={SITE_CAPTURE:{fetch:async()=>{called=true;return picture();}}};
  assert.equal((await screenshotPreview(request('https://127.0.0.1/'),env,dns)).status,400);
  const privateDNS=async()=>Response.json({Answer:[{type:1,data:'10.0.0.1'}]});
  assert.equal((await screenshotPreview(request('https://private.company.com/','2'),env,privateDNS)).status,502);
  assert.equal(called,false);
});

test('only anonymous homepage URL reaches capture; a cached image avoids another browser run',async()=>{
  let calls=0;const entries=new Map();
  const cache={match:async key=>entries.get(key.url)?.clone(),put:async(key,value)=>entries.set(key.url,value)};
  const env={SITE_CAPTURE:{fetch:async incoming=>{
    calls++;
    assert.deepEqual(await incoming.json(),{url:'https://example.com/'});
    assert.equal(incoming.headers.get('Cookie'),null);
    assert.equal(incoming.headers.get('Authorization'),null);
    return picture();
  }}};
  const first=await screenshotPreview(request('https://example.com/account?secret=discard#token','3'),env,dns,cache);
  assert.equal(first.status,200);assert.equal(first.headers.get('Content-Type'),'image/jpeg');
  assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const second=await screenshotPreview(request('https://example.com/another','4'),env,()=>{throw new Error('cache should skip DNS');},cache);
  assert.equal(second.status,200);assert.equal(calls,1);
});

test('invalid capture responses fail safely and repeated captures are limited',async()=>{
  const env={SITE_CAPTURE:{fetch:async()=>new Response('<script>bad</script>',{headers:{'Content-Type':'text/html'}})}};
  assert.equal((await screenshotPreview(request('https://example.com/','5'),env,dns)).status,502);
  env.SITE_CAPTURE.fetch=async()=>new Response('not an image',{headers:{'Content-Type':'image/jpeg'}});
  assert.equal((await screenshotPreview(request('https://example.com/','5'),env,dns)).status,502);
  env.SITE_CAPTURE.fetch=async()=>picture();
  assert.equal((await screenshotPreview(request('https://example.com/','5'),env,dns)).status,200);
  assert.equal((await screenshotPreview(request('https://example.com/','5'),env,dns)).status,429);
});

test('internal browser capture uses a bounded desktop viewport with no account context',async()=>{
  const result=await capture.fetch(new Request('https://capture.internal/',{method:'POST',body:JSON.stringify({url:'https://example.com/account?token=discard'})}),{
    BROWSER:{quickAction:async(action,options)=>{
      assert.equal(action,'screenshot');assert.equal(options.url,'https://example.com/');
      assert.deepEqual(options.viewport,{width:1280,height:800,deviceScaleFactor:1});
      assert.equal(options.screenshotOptions.fullPage,false);assert.equal(options.gotoOptions.timeout,15000);
      assert.equal(options.cookies,undefined);assert.equal(options.authenticate,undefined);
      assert.equal(options.setExtraHTTPHeaders,undefined);
      return picture();
    }}
  });
  assert.equal(result.status,200);
});
