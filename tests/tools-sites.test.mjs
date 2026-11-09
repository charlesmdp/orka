import test from 'node:test';
import assert from 'node:assert/strict';
import {supportSiteTool,isPublicIP} from '../server/index.mjs';
import {siteTools} from '../public/tools-sites.js';

const base='https://support.example.com';
const toolByName=(slug)=>siteTools.find(item=>item.slug===slug);
const html=(body)=>new Response(body,{headers:{'Content-Type':'text/html; charset=utf-8'}});
function req(action,url,origin='https://orka.chat') {
  return new Request('https://orka.chat/api/support-site-tool',{
    method:'POST',headers:{'Content-Type':'application/json',origin,'CF-Connecting-IP':action},body:JSON.stringify({action,url})
  });
}
const publicDns=()=>Response.json({Answer:[{type:1,data:'104.21.7.52'}]});
function webHandler(routes,calls=[]) {
  return async (address,options)=>{
    if (address.startsWith('https://cloudflare-dns.com/dns-query')) return publicDns();
    calls.push({address,options});
    if (!Object.hasOwn(routes,address)) throw new Error('Unexpected address');
    const handler=routes[address];
    return typeof handler==='function'?handler(options):html(handler);
  };
}

test('chat detection accepts known script signatures, including multiple installs, and ignores comments and documentation',async()=>{
  const page=base+'/apps', calls=[];
  const fetcher=webHandler({[page]:`<p>Learn about Crisp at client.crisp.chat/l.js</p>
    <!-- <script src="https://embed.tawk.to/1"></script> -->
    <script type="application/json">{"example":"https://widget.intercom.io/widget/"}</script>
    <script src="https://widget.orka.chat/app.js"></script><script src="https://code.tidio.co/123.js"></script>`},calls);
  const response=await supportSiteTool(req('detect',page),fetcher);
  assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.headline,'Orka + Tidio');
  assert.equal(calls[0].options.redirect,'manual');assert.equal(calls[0].options.headers.Authorization,undefined);
  const noMatches=await supportSiteTool(req('detect',page),webHandler({[page]:'<main>A harmless mention of Crisp</main>'}));
  assert.equal((await noMatches.json()).headline,'No recognized chat embed found');
});

test('Crisp-style escaped runtime configuration is detected on the redirected page',async()=>{
  const input=base+'/crisp', page=base+'/en/';
  const markup=String.raw`<script type="module">window.__APP__={CHATBOX:"https:\u002F\u002Fclient.crisp.chat\u002Fl.js"}</script>`;
  const result=await (await supportSiteTool(req('detect',input),webHandler({
    [input]:()=>Response.redirect(page,301),[page]:markup
  }))).json();
  assert.deepEqual(result.scan,{url:page,matches:[{name:'Crisp',evidence:'client.crisp.chat/l.js',source:page}],scriptsChecked:0,partial:false});
});

test('a large storefront with a late external installer is recognized and cites the actual bundle',async()=>{
  const page=base+'/store', bundle=base+'/assets/site.js?v=5';
  const markup='<base href="/assets/"><style>'+' '.repeat(715000)+'</style><script defer src="site.js?v=5"></script>';
  const calls=[];
  const result=await (await supportSiteTool(req('detect',page),webHandler({
    [page]:markup,[bundle]:()=>new Response('window.ORKA_APP_ID="demo";',{headers:{'Content-Type':'application/javascript'}})
  },calls))).json();
  assert.equal(result.headline,'Orka');
  assert.equal(result.scan.scriptsChecked,1);
  assert.deepEqual(result.scan.matches,[{name:'Orka',evidence:'window.ORKA_APP_ID assignment',source:bundle}]);
  assert.equal(result.scan.partial,false);
  assert.equal(calls.length,2);
});

test('irrelevant content and hostnames do not identify providers, inaccessible scripts produce a partial result',async()=>{
  const page=base+'/catalog', script=base+'/client.js';
  const markup=`<a href="https://crisp.chat">Crisp</a><script type="text/plain">"https://client.crisp.chat/l.js"</script>
    <script type="application/json">{"name":"window.ORKA_APP_ID=1"}</script>
    <style>/* <script src="https://widget.orka.chat/app.js"></script> */</style>
    <iframe src="https://notclient.crisp.chat/l.js"></iframe>
    <iframe src="https://example.net/?ref=https://client.crisp.chat/l.js"></iframe>
    <script type="module" src="/client.js"></script>`;
  const calls=[];
  const data=await (await supportSiteTool(req('detect',page),webHandler({
    [page]:markup,[script]:()=>new Response(null,{status:403})
  },calls))).json();
  assert.deepEqual(data.scan,{url:page,matches:[],scriptsChecked:0,partial:true});
  assert.match(data.headline,/incomplete/i);
  assert.equal(calls.length,2);
});

test('oversized detection sources yield available evidence or a partial result, never a false complete negative',async()=>{
  const page=base+'/large', large=' '.repeat(4*1024*1024+1);
  const scan=body=>supportSiteTool(req('detect',page),webHandler({[page]:body})).then(r=>r.json());
  const positive=await scan('<script src="https://widget.orka.chat/app.js"></script>'+large);
  assert.equal(positive.headline,'Orka');
  assert.equal(positive.scan.partial,true);
  const unknown=await scan(large);
  assert.deepEqual(unknown.scan.matches,[]);
  assert.equal(unknown.scan.partial,true);
});

test('linked script scans enforce public DNS, private query stripping and a bounded number of requests',async()=>{
  const page=base+'/many';
  const markup='<script src="https://private.acme.com/chat.js"></script><script src="/secret.js?token=private"></script>'+
    Array.from({length:14},(_,i)=>'<script src="/app-'+i+'.js"></script>').join('');
  const fetched=[];
  const fetcher=async address=>{
    const url=new URL(address);
    if(url.hostname==='cloudflare-dns.com') return url.searchParams.get('name')==='private.acme.com'
      ? Response.json({Answer:[{type:1,data:'127.0.0.1'}]}) : publicDns();
    fetched.push(address);
    if(address===page) return html(markup);
    return new Response('let x;', {headers:{'content-type':'text/javascript'}});
  };
  const data=await (await supportSiteTool(req('detect',page),fetcher)).json();
  assert.equal(data.scan.partial,true);
  assert.ok(data.scan.scriptsChecked<=8);
  assert.ok(fetched.length<=9);
  assert.doesNotMatch(fetched.join('\n'),/token=|private.acme.com/);
});

test('markdown export prefers article content, preserves article structure, resolves base URL and leaves untrusted plaintext inert',async()=>{
  const url=base+'/en/guide';
  const body=`<head><base href="/documentation/"></head><nav>Menu</nav><main><aside>Sidebar</aside><article>
    <header><h1>A guide</h1></header><p>Visit <a href="billing">billing</a> &amp; <strong>save</strong>.</p>
    <ol><li>Open</li><li>Save</li></ol><pre>run &lt;demo&gt;  \n\n\nend  </pre><p>![load](https://elsewhere.net/x)</p>
    <a href="javascript:alert(1)">Unsafe link</a><a href="/x?token=secret">Sensitive link</a><script>alert('hello')</script></article></main>`;
  const response=await supportSiteTool(req('markdown',url),webHandler({[url]:body}));
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.download.filename,'a-guide.md');assert.equal(data.download.text,data.body);
  for (const expected of ['# A guide','[billing](https://support.example.com/documentation/billing) & **save**.','1. Open\n2. Save','run <demo>  \n\n\nend  ','\\!\\[load\\]']) assert.ok(data.body.includes(expected),expected);
  assert.doesNotMatch(data.body,/Sidebar|Menu|javascript:|token=|alert\(/);
});

test('inventory classifies Orka and common CMS routes; link checker distinguishes missing from inaccessible',async()=>{
  const page=base+'/knowledge', calls=[];
  const source=`<head><base href="/guide/"><link rel="alternate" hreflang="fr" href="/fr"></head>
    <nav><a href="/dashboard">Dashboard</a></nav><main><aside><a href="/sidebar">Sidebar</a></aside>
    <a href="/a/reset">Reset</a><a href="/a/reset#twice">Reset again</a><a href="/c/start">Start</a>
    <a href="shipping">Shipping</a><a href="https://elsewhere.com/foo">External</a><a href="/secret?token=hidden">Secret</a></main>`;
  const fetcher=webHandler({[page]:source,[base+'/a/reset']:()=>new Response(null,{status:404}),
    [base+'/c/start']:()=>new Response(null,{status:403}),[base+'/guide/shipping']:({method})=>new Response(null,{status:method==='HEAD'?405:200})},calls);
  const inventory=await (await supportSiteTool(req('inventory',page),fetcher)).json();
  assert.ok(inventory.body.includes('Article candidates: 1 · Collection candidates: 1'));
  assert.ok(inventory.body.includes('advertised: fr'));assert.doesNotMatch(inventory.download.text,/hidden|elsewhere/);
  const links=await (await supportSiteTool(req('links',page),fetcher)).json();
  assert.equal(links.headline,'1 broken · 1 unverified · 1 reachable');
  assert.ok(links.body.includes('3 of 3 eligible'));assert.ok(links.body.includes('HTTP 403'));
  assert.equal(calls.at(-1).address,base+'/guide/shipping');assert.equal(calls.at(-1).options.method,'GET');
});

test('support scans reject cross-origin, unsafe target or DNS, external access challenges and excessive payloads',async()=>{
  const page=base+'/article';
  assert.equal((await supportSiteTool(req('detect',page,'https://different.com'))).status,403);
  for (const value of ['http://shop.example.com','https://127.0.0.1/','https://u:p@site.com/','https://site.com/?token=secret'])
    assert.equal((await supportSiteTool(req('detect',value))).status,400);
  for (const value of ['2001:db8::4','2001:0db8::1','2001:0000::1','3::1','3fff::1','2001:abc:d:x'])
    assert.equal(isPublicIP(value),false,value);
  const redirect=(await supportSiteTool(req('detect',page),webHandler({[page]:()=>new Response(null,{status:302,headers:{Location:'https://127.0.0.1/'}})})));
  assert.equal(redirect.status,422);
  const calls=[];
  const privateRedirect=await supportSiteTool(req('detect',page),webHandler({[page]:()=>new Response(null,{status:302,headers:{Location:'/confirm?token=secret'}})},calls));
  assert.equal(privateRedirect.status,422);assert.equal(calls.length,1);
  let pageRequests=0;
  const blocked=await supportSiteTool(req('detect',page),async address=>{
    if(address.startsWith('https://cloudflare-dns.com'))return Response.json({Answer:[{type:1,data:'10.1.0.1'}]});pageRequests++;return html('x');
  });assert.equal(blocked.status,422);assert.equal(pageRequests,0);
  const challenged=await supportSiteTool(req('detect',page),webHandler({[page]:'<title>Just a moment...</title>'}));assert.equal(challenged.status,422);
  const tooBig=await supportSiteTool(req('markdown',page),webHandler({[page]:'a'.repeat(512*1024+1)}));assert.equal(tooBig.status,422);
  const dense=await supportSiteTool(req('inventory',page),webHandler({[page]:Array.from({length:510},(_,i)=>'<a href="/article/'+i+'">'+i+'</a>').join('')}));assert.equal(dense.status,422);
});

test('public sitemap reader accepts article URL sets, rejects sitemap indexes and unknown formats',async()=>{
  const url=base+'/sitemap.xml';
  const check=async text=>supportSiteTool(req('sitemap',url),webHandler({[url]:()=>new Response(text,{headers:{'content-type':'application/xml'}})}));
  assert.deepEqual((await (await check('<urlset><url><loc>https://support.example.com/a?q=a&amp;l=b</loc></url></urlset>')).json()).urls,[base+'/a?q=a&l=b']);
  assert.equal((await check('<sitemapindex><sitemap><loc>https://support.example.com/child.xml</loc></sitemap></sitemapindex>')).status,422);
});

test('redirect map handles identical URLs, unique slugs, ambiguous destinations, candidate reviews and missing pages',async()=>{
  const run=toolByName('help-center-redirect-map-generator').run;
  const old=['/kept','/articles/start','/articles/conflict','/articles/reset-account-password','/articles/unrelated'].map(x=>base+x);
  const targets=[base+'/kept','https://new.example.com/docs/start','https://new.example.com/fr/conflict','https://new.example.com/de/conflict','https://new.example.com/docs/reset-account-password-guide'];
  const result=await run({oldUrls:old.join('\n'),newUrls:'<urlset>'+targets.map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>'});
  const csv=result.download.text;
  for (const status of ['Unchanged','Same final slug','Review ambiguous matches','Review similar slug','Choose destination manually'])assert.ok(csv.includes(status));
  await assert.rejects(run({oldUrls:'about:blank',newUrls:targets[0]}));
  await assert.rejects(run({oldUrls:'',newUrls:targets[0]}));
});

test('widget preview validates local values and builds a real preview without network access',async()=>{
  const tool=toolByName('chat-widget-preview');
  const values=Object.fromEntries(tool.fields.map(({key,value})=>[key,value]));
  const result=await tool.run({...values,brand:'Petals',color:'#662244',message:'Can we help pick a bouquet?'});
  assert.deepEqual(result.preview,{brand:'Petals',color:'#662244',message:'Can we help pick a bouquet?'});
  await assert.rejects(tool.run({...values,color:'url(javascript:x)'}));
  await assert.rejects(tool.run({...values,website:'https://person:password@web.example.com'}));
});

test('each website tool has its own content, example, fields and FAQ',()=>{
  assert.equal(siteTools.length,6);assert.equal(new Set(siteTools.map(t=>t.slug)).size,6);
  for(const tool of siteTools) {
    assert.ok(tool.faqs.length>=3 && tool.fields.length>0 && tool.example && tool.description && tool.method,tool.slug);
  }
});
