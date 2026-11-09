import assert from 'node:assert/strict';
import {test} from 'node:test';
import {accentInk,readWidgetUpload} from '../public/widget-preview-tool.js';
import {getWidgetBackground,widgetHomepage} from '../public/tools-sites.js';
import {widgetPreviewWorkbench} from '../scripts/widget-preview-page.mjs';

test('the studio opens on a real homepage with a usable conversation and local screenshot option',()=>{
  const markup=widgetPreviewWorkbench();
  for (const detail of ['widget-preview-orka-home.webp','id="wp-messenger"','data-launcher','aria-expanded="true"','type="file"','data-size="mobile"','data-layout-option="classic"','data-welcome','wp-composer','Test messages stay in this preview.']) assert.ok(markup.includes(detail),detail);
  assert.match(markup,/<iframe [^>]*sandbox="allow-scripts"[^>]*credentialless[^>]*inert hidden>/);
  assert.doesNotMatch(markup,/allow-same-origin|allow-forms|allow-top-navigation|allow-popups|orca-cap.webp/);
  assert.equal(accentInk('#ffffff'),'#000000');
  assert.equal(accentInk('#080817'),'#ffffff');
  assert.equal(accentInk('#777777'),'#000000');
});
test('a local upload must be a supported image within the preview limit',()=>{
  const valid={type:'image/png',size:1024};
  assert.equal(readWidgetUpload(valid),valid);
  for (const file of [null,{type:'text/html',size:5},{type:'image/svg+xml',size:50},{type:'image/webp',size:11*1024*1024}]) assert.throws(()=>readWidgetUpload(file));
});
test('website preview strips paths and secrets before requesting the public homepage',()=>{
  assert.equal(widgetHomepage('  example.org/store?token=private#checkout'),'https://example.org');
  for (const invalid of ['http://example.org','https://name:pass@example.org','file:///secret','https://localhost','']) assert.throws(()=>widgetHomepage(invalid));
});
test('an embeddable homepage works with the screenshot service offline',async t=>{
  const requests=[];
  t.mock.method(globalThis,'fetch',async function(route,options){
    requests.push({route,url:JSON.parse(options.body).url});
    return Response.json({status:'ready',canEmbed:null,url:'https://www.example.org',captureAvailable:false});
  });
  assert.deepEqual(await getWidgetBackground('example.org/article/test'),{kind:'website',website:'https://www.example.org'});
  assert.deepEqual(requests,[{route:'/api/website-preview',url:'https://example.org'}]);
});
test('a blocked frame offers upload, with photographic fallback only when available',async t=>{
  let captureAvailable=false;
  const routes=[];
  t.mock.method(globalThis,'fetch',async function(route){
    routes.push(route);
    if (route.endsWith('screenshot')) return new Response(Uint8Array.of(0xff,0xd8,0xff,0xd9),{headers:{'content-type':'image/jpeg'}});
    return Response.json({status:'ready',url:'https://example.org',canEmbed:false,captureAvailable});
  });
  await assert.rejects(getWidgetBackground('example.org'),/blocks embedded previews.*Upload a screenshot/);
  assert.deepEqual(routes,['/api/website-preview']);
  captureAvailable=true;
  const result=await getWidgetBackground('example.org');
  assert.equal(result.kind,'image');
  assert.equal(result.blob.type,'image/jpeg');
  assert.equal(routes.at(-1),'/api/website-screenshot');
});
