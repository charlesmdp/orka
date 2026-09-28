import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';

// Verify status semantics independently from Cloudflare's clean-URL redirects.
test('404 routes retain the error status, noindex and HEAD semantics', async () => {
  for (const path of ['/404', '/404/', '/404.html']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(new Request('https://orka.chat' + path, {method}), {
        ASSETS: {fetch: async request => {
          assert.equal(new URL(request.url).pathname, '/404');
          assert.equal(request.method, method);
          return new Response('<h1>Orky ate this page.</h1>', {headers:{'Content-Type':'text/html'}});
        }}
      });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
      assert.equal(response.headers.get('Cache-Control'), 'no-cache');
      assert.equal(await response.text(), method === 'HEAD' ? '' : '<h1>Orky ate this page.</h1>');
    }
  }
});
test('missing nested URLs keep the custom error content without a redirect', async () => {
  const response = await worker.fetch(new Request('https://orka.chat/missing/deep/page'), {
    ASSETS:{fetch:async () => new Response('<h1>Orky ate this page.</h1>', {status:404,headers:{'Content-Type':'text/html'}})}
  });
  assert.equal(response.status,404);
  assert.equal(response.headers.get('Location'),null);
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, follow');
  assert.match(await response.text(),/Orky ate this page/);
});
