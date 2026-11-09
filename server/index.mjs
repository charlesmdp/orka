import {answerFaq} from './faq.mjs';
import {analyzeSupportSite} from './site-tools.mjs';
// Public homepage metadata only. No remote HTML, scripts or cookies reach the client.
const MAX_HTML_BYTES = 512 * 1024;
const SITE_TIMEOUT_MS = 9000;
const metadataCache = new Map();

export function publicUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Invalid address');
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  const labels = host.split('.');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use a public HTTPS website');
  if (labels.length < 2 || host.length > 253 || host.includes(':') || /^\d[\d.]*$/.test(host)) throw new Error('Use a public domain');
  if (labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error('Invalid domain');
  if (!/[a-z]/.test(labels.at(-1)) || /(?:^|\.)(?:localhost|local|internal|invalid|test|example|home|lan|onion)$/.test(host)) throw new Error('Private domain');
  url.hash = '';
  return url;
}

export function isPublicIP(address) {
  if (address.includes(':')) {
    let value;
    try { value=new URL('https://['+address+']/').hostname.slice(1,-1); } catch { return false; }
    // Global IPv6 unicast. Exclude reserved protocol blocks, documentation,
    // 6to4 tunnels and the segment-routing range within 2000::/3.
    return /^[23][0-9a-f]{3}:/.test(value) && !/^2001:(?::|[0-9a-f]{1,2}:|1[0-9a-f]{2}:|db8:)/.test(value)
      && !value.startsWith('2002:') && !value.startsWith('3fff:');
  }
  if (!/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(address)) return false;
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a,b,c] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) || (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
}

async function publicDNS(host, fetcher, signal) {
  const replies = await Promise.all(['A','AAAA'].map(async type => {
    const response = await fetcher('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(host) + '&type=' + type, {headers:{Accept:'application/dns-json'}, signal});
    if (!response.ok) throw new Error('Could not check domain');
    return response.json();
  }));
  const addresses = replies.flatMap(reply => (reply.Answer || []).filter(record => record.type === 1 || record.type === 28).map(record => record.data));
  if (!addresses.length || addresses.some(address => !isPublicIP(address))) throw new Error('Domain is not public');
}

function decodeEntities(value) {
  return String(value).replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, entity) => {
    const named = {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};
    if (entity[0] !== '#') return named[entity.toLowerCase()] || all;
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : Number(entity.slice(1));
    return n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : '';
  });
}
const clean = (value, limit=240) => decodeEntities(value || '').replace(/<[^>]*>/g,'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);

export function parseMetadata(html, pageUrl) {
  const page = publicUrl(pageUrl);
  const head = html.split(/<\/head\s*>/i)[0].replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  const meta = new Map();
  const icons = [];
  for (const match of head.matchAll(/<(meta|link)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const attrs = {};
    for (const a of match[2].matchAll(/([a-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi)) attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
    if (match[1].toLowerCase() === 'meta') {
      const key = (attrs.property || attrs.name || '').toLowerCase();
      if (key && attrs.content && !meta.has(key)) meta.set(key,attrs.content);
    } else if (/\b(?:icon|apple-touch-icon)\b/i.test(attrs.rel || '') && attrs.href) {
      try { icons.push(publicUrl(new URL(attrs.href,page).href).href); } catch { /* Ignore private or executable icon URLs. */ }
    }
  }
  const title = clean(head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1],160);
  if (/just a moment|access denied|attention required|checking your browser|^forbidden$/i.test(title)) throw new Error('Website details not available');
  const siteName = clean(meta.get('og:site_name') || meta.get('application-name') || title.split(/\s[|–-]\s/)[0] || page.hostname.replace(/^www\./,''),90);
  const description = clean(meta.get('description') || meta.get('og:description') || meta.get('twitter:description'),230);
  return {siteName,description,favicon:icons[0] || page.origin + '/favicon.ico',hostname:page.hostname,url:page.origin,status:(title || description || meta.has('og:site_name')) ? 'ready' : 'unavailable'};
}

async function readHead(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let html = '', bytes = 0;
  try {
    while (bytes < MAX_HTML_BYTES) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const remaining = MAX_HTML_BYTES - bytes;
      html += decoder.decode(chunk.value.subarray(0,remaining),{stream:true});
      bytes += chunk.value.byteLength;
      if (/<\/head\s*>/i.test(html)) break;
    }
    html += decoder.decode();
    return html;
  } finally { await reader.cancel().catch(() => {}); }
}

export async function websiteMetadata(input, fetcher=fetch) {
  let current = publicUrl(input);
  current.pathname = '/'; current.search = '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),SITE_TIMEOUT_MS);
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      await publicDNS(current.hostname,fetcher,controller.signal);
      const response = await fetcher(current.href, {redirect:'manual',signal:controller.signal,headers:{Accept:'text/html,application/xhtml+xml','User-Agent':'OrkaSitePreview/1.0 (+https://orka.chat)'}});
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) throw new Error('Missing redirect');
        current = publicUrl(new URL(location,current).href);
        continue;
      }
      if (!response.ok || !/^(text\/html|application\/xhtml\+xml)\b/i.test(response.headers.get('content-type') || '')) {
        await response.body?.cancel();
        throw new Error('No readable homepage');
      }
      const data = parseMetadata(await readHead(response),current.href);
      if (new URL(data.favicon).hostname !== current.hostname) {
        try { await publicDNS(new URL(data.favicon).hostname,fetcher,controller.signal); }
        catch { data.favicon = current.origin + '/favicon.ico'; }
      }
      const xframe = response.headers.get('x-frame-options') || '';
      const csp = response.headers.get('content-security-policy') || '';
      data.canEmbed = /deny|sameorigin/i.test(xframe) || /(?:^|;)\s*frame-ancestors\s+'(?:none|self)'\s*(?:;|$)/i.test(csp) ? false : null;
      return data;
    }
    throw new Error('Too many redirects');
  } finally { clearTimeout(timer); }
}

function json(data,status=200) {
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
async function requestJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No request body');
  let bytes = 0, text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) throw new Error('Request too large');
      text += decoder.decode(value,{stream:true});
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); }
}
// Best-effort abuse protection per isolate, in addition to Browser Run's account quota.
const screenshotRequests = new Map();
let screenshotWindow = {start:0,count:0};
export async function screenshotPreview(request, env, fetcher=fetch, cache=globalThis.caches?.default) {
  const pageUrl = new URL(request.url);
  if (request.method !== 'POST') return json({error:'Method not allowed'},405);
  if (request.headers.get('origin') !== pageUrl.origin) return json({error:'Use the preview on Orka'},403);
  if (!env.SITE_CAPTURE?.fetch) return json({error:'Automatic screenshots are not available yet. You can upload an image instead.'},503);
  let target;
  try {
    if (Number(request.headers.get('content-length')) > 4096) return json({error:'Request too large'},413);
    target = publicUrl((await requestJson(request)).url);
    target = new URL(target.origin + '/');
  } catch { return json({error:'Enter a public HTTPS website'},400); }
  const cacheKey = new Request('https://orka.chat/_capture-cache/v1/' + encodeURIComponent(target.origin));
  const sendImage = response => new Response(response.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  const cached = await cache?.match(cacheKey).catch(() => null);
  if (cached) return sendImage(cached);
  const now = Date.now();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  for (const [key,value] of screenshotRequests) if (value.until <= now) screenshotRequests.delete(key);
  const attempts = screenshotRequests.get(ip) || {count:0,until:now + 600000};
  if (now - screenshotWindow.start >= 60000) screenshotWindow = {start:now,count:0};
  if (attempts.count >= 3 || screenshotWindow.count >= 20) return json({error:'A few too many previews. Try again later, or upload a screenshot.'},429);
  attempts.count++; screenshotWindow.count++;
  if (screenshotRequests.size >= 1000) screenshotRequests.delete(screenshotRequests.keys().next().value);
  screenshotRequests.set(ip,attempts);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),25000);
  try {
    await publicDNS(target.hostname,fetcher,controller.signal);
    // The service receives a fresh request, never the visitor's cookies or headers.
    const response = await env.SITE_CAPTURE.fetch(new Request('https://capture.internal/', {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:target.href}),signal:controller.signal
    }));
    if (!response.ok || !/^image\/jpeg\b/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel();
      throw new Error('Capture failed');
    }
    const image = await response.arrayBuffer();
    if (image.byteLength < 4 || image.byteLength > 3 * 1024 * 1024) throw new Error('Invalid image');
    const bytes = new Uint8Array(image);
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Invalid JPEG');
    const picture = new Response(image,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=86400'}});
    // Only anonymous public homepage captures are cached, for at most one day.
    await cache?.put(cacheKey,picture.clone()).catch(() => {});
    return sendImage(picture);
  } catch {
    return json({error:'This website could not be photographed. It may block automated browsers. Try an uploaded screenshot or the sample.'},502);
  } finally { clearTimeout(timeout); }
}
const siteToolActions = new Set(['detect','markdown','inventory','links','sitemap']);
const siteToolRequests = new Map();
const siteResponseFormats = {
  html: {
    accept:'text/html,application/xhtml+xml,*/*;q=0.1',
    readable:/^(?:text\/html|application\/xhtml\+xml)\b/i,
    error:'Use the address of an HTML page.'
  },
  xml: {
    accept:'application/xml,text/xml;q=0.9,*/*;q=0.1',
    readable:/^(?:application\/(?:[\w.-]+\+)?xml|text\/(?:xml|plain))\b/i,
    error:'Enter a public XML sitemap address.'
  },
  script: {
    accept:'application/javascript,text/javascript,*/*;q=0.1',
    readable:/^(?:(?:text|application)\/(?:x-)?(?:javascript|ecmascript)|text\/plain|application\/octet-stream)\b/i,
    error:'The linked asset did not return JavaScript.'
  }
};

function siteToolPageReader(fetcher, signal) {
  const checked = new Map();
  let requests = 0;
  return async (input, {statusOnly=false, xml=false, detect=false, script=false}={}) => {
    const format=siteResponseFormats[script?'script':xml?'xml':'html'];
    const byteLimit = detect ? 4 * 1024 * 1024 : MAX_HTML_BYTES;
    let current = publicUrl(input);
    let method = statusOnly ? 'HEAD' : 'GET';
    for (let redirects=0;redirects<=3;) {
      if ([...current.searchParams.keys()].some(key=>/(?:token|auth|password|secret|session|signature|api[_-]?key|^code$)/i.test(key)))
        throw new Error('Use a public page URL without sign-in tokens or private parameters.');
      if (++requests>16) throw new Error('The scan reached its request limit.');
      if (!checked.has(current.hostname)) checked.set(current.hostname,publicDNS(current.hostname,fetcher,signal));
      await checked.get(current.hostname);
      const response = await fetcher(current.href,{method,redirect:'manual',signal,headers:{
        Accept:format.accept,
        'User-Agent':'OrkaSupportTools/1.0 (+https://orka.chat/free-tools)'
      }});
      if ([301,302,303,307,308].includes(response.status)) {
        await response.body?.cancel();
        const target=response.headers.get('Location');
        if (!target) throw new Error('The website returned a redirect without a destination.');
        current=publicUrl(new URL(target,current).href);
        redirects++;
        continue;
      }
      if (statusOnly) {
        await response.body?.cancel();
        if (method==='HEAD' && [405,501].includes(response.status)) { method='GET'; continue; }
        return {url:current.href,status:response.status};
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error('The website returned HTTP '+response.status+'. Try a public page that opens without signing in.');
      }
      const reader=response.body?.getReader();
      if (!reader || !format.readable.test(response.headers.get('content-type') || '')) {
        await reader?.cancel();
        throw new Error(format.error);
      }
      const decoder=new TextDecoder();
      let text='',bytes=0,truncated=false;
      try {
        while (true) {
          const {done,value}=await reader.read();
          if (done) break;
          const remaining=byteLimit-bytes;
          if (value.byteLength>remaining) {
            if (!detect && !script) throw new Error('This page exceeds the 512 KiB scan limit. Try a shorter page.');
            text+=decoder.decode(value.subarray(0,remaining),{stream:true});
            truncated=true;
            break;
          }
          bytes+=value.byteLength;
          text+=decoder.decode(value,{stream:true});
        }
        text+=decoder.decode();
      } finally { await reader.cancel().catch(()=>{}); }
      if (!xml && !script) {
        const title=text.slice(0,16000).match(/<title\b[^>]{0,200}>([^<]{0,300})<\/title>/i)?.[1] || '';
        if (/just a moment|checking your browser|^access denied$|^forbidden$/i.test(title.trim()))
          throw new Error('This website blocks automated visitors. Try another public page.');
      }
      return {url:current.href,text,truncated};
    }
    throw new Error('This website redirected too many times.');
  };
}

export async function supportSiteTool(request,fetcher=fetch) {
  if (request.method!=='POST') return json({error:'Method not allowed'},405);
  if (request.headers.get('origin')!==new URL(request.url).origin) return json({error:'Run the tool from this Orka page.'},403);
  let action,target;
  try {
    const payload=await requestJson(request);
    action=payload.action;
    if (!siteToolActions.has(action)) return json({error:'Unknown tool.'},400);
    target=publicUrl(payload.url);
    if ([...target.searchParams.keys()].some(key=>/(?:token|auth|password|secret|session|signature|api[_-]?key|^code$)/i.test(key)))
      return json({error:'Use a public page URL without sign-in tokens or private parameters.'},400);
  } catch { return json({error:'Enter a public HTTPS address.'},400); }
  const now=Date.now();
  const ip=request.headers.get('CF-Connecting-IP') || 'unknown';
  const entry=siteToolRequests.get(ip);
  if (entry?.until>now && entry.count>=20) return json({error:'Scan limit reached. Try again in a minute.'},429);
  if (entry?.until>now) entry.count++;
  else {
    if (siteToolRequests.size>=1000) siteToolRequests.delete(siteToolRequests.keys().next().value);
    siteToolRequests.set(ip,{count:1,until:now+60000});
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
    const result=await analyzeSupportSite(action,target.href,{fetchPage:siteToolPageReader(fetcher,controller.signal),allowUrl:publicUrl,entities:decodeEntities});
    return json(result);
  } catch (error) {
    const message=controller.signal.aborted ? 'The website took too long to respond. Try again or enter a smaller page.' :
      error instanceof TypeError ? 'The website could not be reached. Check the address and try again.' : error.message;
    return json({error:message || 'This public page could not be scanned.'},422);
  } finally { clearTimeout(timer); }
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    // Consolidate legacy homepage URLs before the static asset fallback.
    if (['/home', '/home/', '/home.html'].includes(url.pathname)) {
      return Response.redirect('https://orka.chat/' + url.search, 301);
    }
    // Redirect only the public Pages hostname; custom and preview domains stay independent.
    if (url.hostname === 'orka-1t3.pages.dev') {
      url.protocol = 'https:';
      url.hostname = 'orka.chat';
      return Response.redirect(url.href, 301);
    }
    if (url.pathname === '/api/support-site-tool') return supportSiteTool(request);
    if (url.pathname === '/api/website-screenshot') return screenshotPreview(request,env);
    if (url.pathname === '/api/faq-answer') return answerFaq(request,env);
    if (url.pathname !== '/api/website-preview') {
      // Pages serves 404.html for missing assets. The explicit preview route
      // must also be an actual 404, never an indexable soft-404 success page.
      const explicitNotFound = ['/404', '/404/', '/404.html'].includes(url.pathname);
      const assetRequest = explicitNotFound
        ? new Request(new URL('/404', url), request)
        : request;
      const response = await env.ASSETS.fetch(assetRequest);
      if (explicitNotFound || response.status === 404) {
        const copy = new Response(request.method === 'HEAD' ? null : response.body, {
          status:404, statusText:'Not Found', headers:response.headers
        });
        copy.headers.set('Cache-Control','no-cache');
        copy.headers.set('X-Robots-Tag','noindex, follow');
        return copy;
      }
      if ((response.headers.get('content-type') || '').includes('text/html')) {
        const copy = new Response(response.body,response);
        copy.headers.set('Cache-Control','no-cache');
        return copy;
      }
      return response;
    }
    if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed'},405);
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return json({error:'Use the preview on Orka'},403);
    let target;
    try {
      if (Number(request.headers.get('content-length')) > 4096) return json({error:'Request too large'},413);
      const input = request.method === 'GET' ? url.searchParams.get('url') : (await requestJson(request)).url;
      target = publicUrl(input);
    } catch { return json({error:'Enter a public HTTPS website'},400); }
    const key = target.origin;
    const cached = metadataCache.get(key);
    if (cached && cached.until > Date.now()) return json({...cached.value,captureAvailable:!!env.SITE_CAPTURE?.fetch});
    try {
      const value = await websiteMetadata(target.href);
      if (metadataCache.size >= 200) metadataCache.delete(metadataCache.keys().next().value);
      metadataCache.set(key,{value,until:Date.now() + (value.status === 'ready' ? 3600000 : 60000)});
      return json({...value,captureAvailable:!!env.SITE_CAPTURE?.fetch});
    } catch {
      return json({siteName:target.hostname.replace(/^www\./,''),description:'',hostname:target.hostname,favicon:'',url:target.origin,status:'unavailable',canEmbed:null,captureAvailable:!!env.SITE_CAPTURE?.fetch});
    }
  }
};
