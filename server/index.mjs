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
    const value = address.toLowerCase();
    // Global unicast only; reject mapped IPv4, local, reserved and documentation ranges.
    return /^[23][0-9a-f]{0,3}:/.test(value) && !value.startsWith('2001:db8:') && !value.startsWith('2001:0:') && !value.startsWith('2002:');
  }
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
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/website-preview') {
      const response = await env.ASSETS.fetch(request);
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
    if (cached && cached.until > Date.now()) return json(cached.value);
    try {
      const value = await websiteMetadata(target.href);
      if (metadataCache.size >= 200) metadataCache.delete(metadataCache.keys().next().value);
      metadataCache.set(key,{value,until:Date.now() + (value.status === 'ready' ? 3600000 : 60000)});
      return json(value);
    } catch {
      return json({siteName:target.hostname.replace(/^www\./,''),description:'',hostname:target.hostname,favicon:'',url:target.origin,status:'unavailable',canEmbed:null});
    }
  }
};
