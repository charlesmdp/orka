import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{publicUrl,isPublicIP,parseMetadata,websiteMetadata} from '../server/index.mjs';

test('only public HTTPS domains can be requested', () => {
  assert.equal(publicUrl('https://nomads.com/').hostname,'nomads.com');
  for (const value of ['http://example.com','https://localhost','https://127.0.0.1','https://2130706433','https://[::1]/','https://a.internal','https://u:p@example.com','https://example.com:8000']) assert.throws(() => publicUrl(value),value);
  for (const ip of ['127.0.0.1','10.0.0.1','172.16.4.4','192.168.1.1','169.254.169.254','100.64.0.1','::1','fc00::1','fe80::1','::ffff:127.0.0.1']) assert.equal(isPublicIP(ip),false,ip);
  for (const ip of ['104.21.7.52','192.0.78.17','2606:4700:10::6816:102a']) assert.equal(isPublicIP(ip),true,ip);
});

test('metadata handles common Shopify tags, entities and relative favicons', () => {
  const html=`<head><title>Caps &amp; Friends - Online store</title><meta content='Caps &amp; Friends' property='og:site_name'><meta name="description" content="Caps for sunny days &amp; everyday adventures."><link href='/cdn/shop/files/favicon.png?v=1' rel='icon'></head>`;
  const result=parseMetadata(html,'https://caps.com/');
  assert.equal(result.siteName,'Caps & Friends');
  assert.equal(result.description,'Caps for sunny days & everyday adventures.');
  assert.equal(result.favicon,'https://caps.com/cdn/shop/files/favicon.png?v=1');
  assert.equal(result.status,'ready');
});

test('ignore fake metadata in comments/scripts, executable icons and challenge pages', () => {
  const data=parseMetadata(`<head><!-- <meta name="description" content="fake"> --><script>const x='<meta name="description" content="also fake">'</script><title>Good site</title><link rel="icon" href="javascript:alert(1)"><meta name="description" content="A &quot;real&quot; description."></head>`,'https://good.com/');
  assert.equal(data.description,'A "real" description.');assert.equal(data.favicon,'https://good.com/favicon.ico');
  assert.throws(()=>parseMetadata('<title>Just a moment...</title>','https://good.com/'));
});

function dnsResponse(ip='104.21.7.52') {return Response.json({Status:0,Answer:[{type:1,data:ip}]});}
test('fetch metadata without cookies and recognize a site that blocks frames', async () => {
  const calls=[];
  const mock=async (input,options) => {
    calls.push([input,options]);
    if(input.startsWith('https://cloudflare-dns.com/'))return dnsResponse();
    return new Response('<head><title>Nomads</title><meta name="description" content="A community for people who work remotely."></head>',{headers:{'content-type':'text/html','x-frame-options':'SAMEORIGIN'}});
  };
  const data=await websiteMetadata('https://nomads.com/account?secret=discard',mock);
  assert.equal(data.canEmbed,false);assert.equal(data.siteName,'Nomads');assert.ok(data.description.includes('remotely'));
  const request=calls.find(([url])=>url==='https://nomads.com/');assert.ok(request);assert.equal(request[1].redirect,'manual');assert.equal(request[1].headers.Cookie,undefined);
});

test('private DNS and redirects are rejected before their content is requested', async () => {
  let pageRequests=0;
  await assert.rejects(websiteMetadata('https://public-name.com/',async input=>{if(input.startsWith('https://cloudflare-dns.com/'))return dnsResponse('127.0.0.1');pageRequests++;return new Response('private');}));
  assert.equal(pageRequests,0);
  await assert.rejects(websiteMetadata('https://redirect.com/',async input=>input.startsWith('https://cloudflare-dns.com/')?dnsResponse():new Response(null,{status:302,headers:{location:'https://169.254.169.254/'}})));
});

test('API rejects cross-origin and large requests; HTML is revalidated', async () => {
  const wrong=await worker.fetch(new Request('https://orka.test/api/website-preview',{method:'POST',headers:{Origin:'https://elsewhere.com'},body:'{}'}),{});assert.equal(wrong.status,403);
  const large=await worker.fetch(new Request('https://orka.test/api/website-preview',{method:'POST',body:'x'.repeat(5000)}),{});assert.equal(large.status,400);
  const page=await worker.fetch(new Request('https://orka.test/'),{ASSETS:{fetch:async()=>new Response('<h1>Orka</h1>',{headers:{'content-type':'text/html'}})}});assert.equal(page.headers.get('cache-control'),'no-cache');
});
