// Internal service only: Pages validates the public URL and DNS before calling.
// Never expose this Worker through workers.dev, preview URLs or a public route.
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', {status:405});
    let url;
    try {
      const input = await request.json();
      url = new URL(input.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.port ||
          !/^[a-z0-9][a-z0-9.-]*\.[a-z]+$/i.test(url.hostname) ||
          /(?:^|\.)(localhost|local|internal|test|home|lan|onion)$/.test(url.hostname)) throw new Error();
      // Only a public homepage. No account paths, query strings, cookies or auth.
      url = new URL(url.origin + '/');
    } catch { return new Response('Invalid website', {status:400}); }
    try {
      const response = await env.BROWSER.quickAction('screenshot', {
        url:url.href,
        viewport:{width:1280,height:800,deviceScaleFactor:1},
        screenshotOptions:{type:'jpeg',quality:80,fullPage:false},
        gotoOptions:{waitUntil:'networkidle2',timeout:15000},
        // Do not navigate to literal IPs, local names or nonstandard ports.
        rejectRequestPattern:[
          '^https?://(?:[^/]*@)?(?:\\[|[0-9]+(?:\\.[0-9]+){0,3}(?=[:/]))',
          '^https?://[^/:]+:(?!443(?:/|$))',
          '^https?://(?:[^/]+\\.)?(?:localhost|local|internal|home|lan|onion)(?=[:/])',
          '^https?://[^./:]+(?=[:/])'
        ]
      });
      if (!response.ok || !/^image\/jpeg\b/i.test(response.headers.get('content-type') || '')) {
        await response.body?.cancel();
        return new Response('This website could not be captured', {status:502});
      }
      return new Response(response.body, {headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    } catch { return new Response('Capture unavailable', {status:502}); }
  }
};
