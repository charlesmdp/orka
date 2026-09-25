import {selectFaqSources} from '../server/faq.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, access, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Pages output includes the API, linked assets and cache headers', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs', '--pages'], {cwd:root});
  const output = new URL('../dist/client/', import.meta.url);
  const html = await readFile(new URL('index.html', output), 'utf8');
  const old = await readFile(new URL('old.html', output), 'utf8');
  assert.match(html,/<body class="hero-experiment experiment-mosaic new2-mosaic"/);
  assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
  assert.match(old,/<section class="hero dark-section"/);
  assert.doesNotMatch(old,/mosaic-dashboard-fresco/);
  assert.match(old,/<meta name="robots" content="noindex, follow">/);
  assert.match(old,/rel="canonical" href="https:\/\/orka.chat\/old"/);
  for(const tier of ['solo','pod','fleet']) assert.ok(html.includes('mosaic-pricing-'+tier+'.jpg'));
  assert.match(html,/data-map-search/);
  assert.match(html,/data-map-location/);
  const headers = await readFile(new URL('_headers', output), 'utf8');
  const routes = JSON.parse(await readFile(new URL('_routes.json', output), 'utf8'));
  assert.equal(routes.version, 1);
  assert.ok(routes.include.includes('/*'));
  assert.ok(!routes.exclude.includes('/api/*'));
  assert.match(headers, /Cache-Control: no-cache/);
  for (const basename of ['style', 'refinement', 'refresh', 'product-polish', 'app', 'live-map']) {
    const ext = ['app', 'live-map'].includes(basename) ? 'js' : 'css';
    const match = html.match(new RegExp('"(' + basename + '\\.[a-f0-9]{12}\\.' + ext + ')"'));
    assert.ok(match, basename + ' should use a versioned URL');
    await access(new URL(match[1], output));
    assert.ok(headers.includes('/' + match[1] + '\n  Cache-Control: public, max-age=31536000, immutable'));
  }
  const mapFile = html.match(/"(live-map\.[a-f0-9]{12}\.js)"/)[1];
  const mapSource = await readFile(new URL(mapFile, output), 'utf8');
  const modelFile = mapSource.match(/from '\.\/(map-model\.[a-f0-9]{12}\.js)'/)[1];
  await access(new URL(modelFile, output));
  assert.ok(headers.includes('/' + modelFile + '\n  Cache-Control: public, max-age=31536000, immutable'));
  for (const page of ['features', 'terms', 'privacy', 'cookies']) {
    const source = await readFile(new URL(page + '.html', output), 'utf8');
    assert.ok(headers.includes('/' + page + '\n  Cache-Control: no-cache'));
    assert.ok(headers.includes('/' + page + '.html\n  Cache-Control: no-cache'));
    assert.doesNotMatch(source, /content="noindex/);
    assert.match(source, /href="pages\.[a-f0-9]{12}\.css"/);
    assert.ok(new RegExp('src="' + (page === 'features' ? 'features' : 'pages') + '\\.[a-f0-9]{12}\\.js"').test(source));
    for (const [, filename] of source.matchAll(/(?:href|src)="([^"/]+\.(?:css|js))"/g)) {
      assert.match(filename, /\.[a-f0-9]{12}\.(?:css|js)$/);
      await access(new URL(filename, output));
      assert.ok(headers.includes('/' + filename + '\n  Cache-Control: public, max-age=31536000, immutable'));
    }
  }
  await assert.rejects(access(new URL('.openai/hosting.json', output)));

  const allPages=(await readdir(output)).filter(n=>n.endsWith('.html'));
  const pageNames=allPages.filter(n=>!['new.html','new2.html','new3.html','new4.html','old.html'].includes(n));
  assert.equal(allPages.length,84);
  assert.equal(pageNames.length,79);
  const knowledge=JSON.parse(await readFile(new URL('faq-knowledge.json',output),'utf8'));
  assert.equal(selectFaqSources('What does Pod cost?',knowledge.documents)[0].url,'https://orka.chat/pricing');
  assert.ok(!knowledge.documents.some(doc=>doc.url==='https://orka.chat/old'));
  const homepageFooter=html.match(/<footer class="o-footer"[\s\S]*?<\/footer>/)[0];
  const sitemap=await readFile(new URL('sitemap.xml',output),'utf8');
  assert.ok(!sitemap.includes('<loc>https://orka.chat/old</loc>'));
  for (const [route,style] of [['new','pixel'],['new2','mosaic'],['new3','mosaic'],['new4','mosaic']]) {
    const preview=await readFile(new URL(route+'.html',output),'utf8');
    assert.match(preview,new RegExp('seascape-hero seascape-'+style));
    assert.match(preview,/<meta name="robots" content="noindex, follow">/);
    assert.match(preview,/rel="canonical" href="https:\/\/orka.chat\/"/);
    assert.ok(!sitemap.includes('<loc>https://orka.chat/'+route+'</loc>'));
    assert.ok(!knowledge.documents.some(doc=>doc.url==='https://orka.chat/'+route));
    const belowHero=source=>source.slice(source.indexOf('<section class="ecosystem">'));
    if(route==='new2') {
      assert.match(preview,/new2-mosaic/);
      assert.equal((preview.match(/id="product"/g)||[]).length,1);
      assert.match(preview,/mosaic-dashboard-fresco/);
      for(const art of ['pod','night-shift','dialogue','context','learning','wide-net']) {
        assert.ok(preview.includes('new2-mosaic-'+art+'.jpg'));
        await access(new URL('assets/new2-mosaic-'+art+'.jpg',output));
      }
      assert.doesNotMatch(preview,/orky-head-v2|orca-swimming.svg|orca-dialogue-v11|trawler-dorsal-v14/);
      const headings=source=>[...belowHero(source).matchAll(/<h[23][^>]*>[\s\S]*?<\/h[23]>/g)].map(m=>m[0]);
      assert.deepEqual(headings(preview),headings(html),'Mosaic art preserves all lower-section content');
      assert.ok(preview.includes(homepageFooter),'Mosaic keeps the shared footer');
      const mosaicCss=preview.match(/href="(new2-mosaic\.[a-f0-9]{12}\.css)"/)[1];
      await access(new URL(mosaicCss,output));
      await access(new URL('assets/new2-mosaic-dashboard-frame.jpg',output));
    } else {
      assert.equal(belowHero(preview),belowHero(old),'Other previews preserve every section after the hero');
      assert.doesNotMatch(preview,/mosaic-dashboard-fresco|new2-mosaic\./);
    }
    assert.equal((preview.match(/<h1\b/g)||[]).length,1);
    const ids=[...preview.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,'Preview has unique anchors');
    for (const [,src] of preview.matchAll(/src="(\/assets\/[^\"]+)"/g)) await access(new URL(src.slice(1),output));
    const css=preview.match(/href="(hero-experiments\.[a-f0-9]{12}\.css)"/)[1];
    await access(new URL(css,output));
    const js=preview.match(/src="(hero-experiments\.[a-f0-9]{12}\.js)"/)[1];
    await access(new URL(js,output));
    assert.match(preview.slice(0,preview.indexOf('<section class="ecosystem">')),/data-project-help/);
    assert.match(preview,/role="switch" aria-checked="false" aria-label="Night mode"/);
    const night=preview.match(/data-night-art data-src="([^"]+)"/)[1];
    await access(new URL(night.slice(1),output));
    assert.match(preview,/data-mascot-handle aria-label="Orky/);
    assert.doesNotMatch(preview,/data-motion-toggle|ILLUSTRATIVE CONVERSATIONS|seascape-mascot-shadow/);
    const header=preview.match(/<header[\s\S]*?<\/header>/)[0];
    assert.match(header,/data-night-toggle/);
    assert.doesNotMatch(preview,/seascape-versions|A little less support chaos/);
    assert.match(preview,/Make me swim/);
    assert.match(preview,/orky-flipper-front/);
    assert.ok(headers.includes('/'+route+'\n  Cache-Control: no-cache\n  X-Robots-Tag: noindex, follow'));
  }
  assert.doesNotMatch(sitemap, /<loc>https:\/\/orka\.chat\/home(?:\/|\.html)?<\/loc>/);
  for (const route of ['about','sdk','how-to-add-orka-to-single-page-application','ios-app','android-app','performance','is-orka-right-for-you',...['lovable','bolt','replit','base44','v0'].map(tool=>'how-to-add-live-chat-to-a-'+tool+'-app')]) {
    const page=await readFile(new URL(route+'.html',output),'utf8');
    assert.ok(homepageFooter.includes('href="/'+route+'"'),route+' is discoverable');
    assert.ok(knowledge.documents.some(doc=>doc.url==='https://orka.chat/'+route),route+' is available to the FAQ');
    assert.match(page,/FAQPage/);
    const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,route+' has unique anchors');
    for(const [,id] of page.matchAll(/(?:href="#|data-copy-snippet=")([^"]+)"/g)) assert.ok(ids.includes(id),route+' target '+id);
    assert.doesNotMatch(page,/ezwh5y-qj|contact@instantsign|655e0b2509d17bcdf954ec6f/);
    for (const [,src] of page.matchAll(/src="(\/assets\/[^\"]+)"/g)) await access(new URL(src.slice(1),output));
  }
  assert.doesNotMatch(html,/id="vibe-coding"|Start trial for free/);
  const vibePage=await readFile(new URL('best-live-chat-for-vibe-coded-projects.html',output),'utf8');
  assert.match(vibePage,/id="vibe-coding"/);
  for(const tool of ['lovable','bolt','replit','base44','v0']) assert.ok(vibePage.includes('/how-to-add-live-chat-to-a-'+tool+'-app'));
  const spa=await readFile(new URL('how-to-add-orka-to-single-page-application.html',output),'utf8');
  assert.match(spa,/default: Orka/);
  assert.match(spa,/YOUR_PROJECT_ID/);
  const android=await readFile(new URL('android-app.html',output),'utf8');
  assert.match(android,/https:\/\/play.google.com\/store\/search\?q=orka%20chat%20penida/);
  assert.equal([...sitemap.matchAll(/<loc>/g)].length,pageNames.length);
  for(const name of pageNames){
    const document=await readFile(new URL(name,output),'utf8');
    assert.equal((document.match(/window.ORKA_APP_ID="66471b6efff6410a175c00b6"/g)||[]).length,1,name);
    assert.doesNotMatch(document,/class="(?:support-float|brand-theme-switcher)"/);
    assert.match(document,/data-brand-theme="green"/);
    assert.match(document,/two dreamers/);
    const canonical='https://orka.chat/'+(name==='index.html'?'':name.slice(0,-5));
    assert.ok(document.includes('rel="canonical" href="'+canonical+'"'),name);
    assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),name);
    assert.equal(document.match(/<footer class="o-footer"[\s\S]*?<\/footer>/)?.[0],homepageFooter,name);
    assert.doesNotMatch(document,/https:\/\/orka-1t3\.pages\.dev/);
    assert.doesNotMatch(document,/not verified|unverified/i);
  }
  assert.match(await readFile(new URL('robots.txt',output),'utf8'),/Sitemap: https:\/\/orka\.chat\/sitemap\.xml/);
  assert.match(html,/FAQPage/);
  assert.ok(html.indexOf('class="section pod-section"')<html.indexOf('id="why-orka"'));
  const {default:worker} = await import(new URL('_worker.js', output));
  for (const host of ['orka.chat','orka-1t3.pages.dev']) {
    for (const pathname of ['/home','/home/','/home.html']) {
      for (const method of ['GET','HEAD']) {
        const redirect=await worker.fetch(new Request('https://'+host+pathname+'?utm_source=old-link',{method}),{});
        assert.equal(redirect.status,301);
        assert.equal(redirect.headers.get('Location'),'https://orka.chat/?utm_source=old-link');
      }
    }
  }
  for (const pathname of ['/homepage','/home/guide']) {
    const untouched=await worker.fetch(new Request('https://orka.chat'+pathname),{
      ASSETS:{fetch:async()=>new Response('Not found',{status:404})}
    });
    assert.equal(untouched.status,404);
  }
  const invalid = await worker.fetch(new Request('https://orka.pages.dev/api/website-preview', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:'https://localhost'})
  }), {});
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /public HTTPS/);
  const blocked = await worker.fetch(new Request('https://orka.pages.dev/api/website-preview', {
    method:'POST', headers:{Origin:'https://another-site.com'}, body:'{}'
  }), {});
  assert.equal(blocked.status, 403);
  const asset = await worker.fetch(new Request('https://orka.pages.dev/'), {
    ASSETS:{fetch:async () => new Response(html, {headers:{'Content-Type':'text/html'}})}
  });
  for (const pathname of ['/','/pricing','/orka-vs-crisp?ref=launch','/sitemap.xml']) {
    const redirect = await worker.fetch(new Request('https://orka-1t3.pages.dev'+pathname), {});
    assert.equal(redirect.status,301);
    assert.equal(redirect.headers.get('Location'),'https://orka.chat'+pathname);
  }
  for (const host of ['orka.chat','preview.orka-1t3.pages.dev']) {
    const passthrough = await worker.fetch(new Request('https://'+host+'/pricing'), {
      ASSETS:{fetch:async () => new Response('custom domain', {headers:{'Content-Type':'text/html'}})}
    });
    assert.equal(passthrough.status,200);
    assert.equal(await passthrough.text(),'custom domain');
  }
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('Cache-Control'), 'no-cache');
  assert.equal(await asset.text(), html);
});
