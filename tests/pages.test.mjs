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

  const pageNames=(await readdir(output)).filter(n=>n.endsWith('.html'));
  const homepageFooter=html.match(/<footer class="o-footer"[\s\S]*?<\/footer>/)[0];
  const sitemap=await readFile(new URL('sitemap.xml',output),'utf8');
  assert.equal([...sitemap.matchAll(/<loc>/g)].length,pageNames.length);
  for(const name of pageNames){
    const document=await readFile(new URL(name,output),'utf8');
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
