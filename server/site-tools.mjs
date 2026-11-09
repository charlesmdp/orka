// Read the public document, never execute it. This tokenizer handles ordinary
// article HTML and keeps raw script/style content separate from visible text.
const voidElements = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const rawTags = new Set(['script','style','textarea','template','noscript']);
const htmlTokens = /<!--[\s\S]*?(?:-->|$)|<\/?[a-z][a-z\d:-]*\b(?:[^<>"']|"[^"]*"|'[^']*')*>|<![^>]*>|[^<]+|</gi;
const attrPattern = /([^\s=/><]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
function siteTagAttributes(text,entities) {
  const attrs=Object.create(null);
  for (const [,key,dq,sq,unquoted] of text.matchAll(attrPattern)) {
    attrs[key.toLowerCase()]=entities(dq ?? sq ?? unquoted ?? '');
  }
  return attrs;
}
function siteDocument(html, entities) {
  const root = {tag:'root',attrs:{},children:[]};
  const stack = [root];
  const tokens=new RegExp(htmlTokens.source,htmlTokens.flags);
  let count = 0, match;
  while ((match=tokens.exec(html))!==null) {
    const token=match[0];
    if (++count > 65000 || stack.length > 220) throw new Error('This page is too complex. Try a single article.');
    if (token.startsWith('<!')) continue;
    const heading = token.match(/^<(\/?)([a-z][a-z\d:-]*)/i);
    if (!heading) { stack.at(-1).children.push(entities(token)); continue; }
    const tag = heading[2].toLowerCase();
    if (heading[1]) {
      for (let i=stack.length-1; i>0; i--) if (stack[i].tag === tag) { stack.length=i; break; }
      continue;
    }
    if (rawTags.has(tag)) {
      const closingTag=new RegExp('</'+tag+'\\s*>','ig');
      closingTag.lastIndex=tokens.lastIndex;
      const closing=closingTag.exec(html);
      tokens.lastIndex=closing?closingTag.lastIndex:html.length;
      continue;
    }
    const attrs = siteTagAttributes(token.slice(heading[0].length,-1),entities);
    // Common optional end tags on exported help articles.
    if (['li','p','tr'].includes(tag) && stack.at(-1).tag === tag) stack.pop();
    const el = {tag,attrs,children:[]};
    stack.at(-1).children.push(el);
    if (!voidElements.has(tag) && !token.endsWith('/>')) stack.push(el);
  }
  return root;
}
function findSiteElements(node, predicate, results=[], skip) {
  for (const child of node.children) {
    if (typeof child === 'string' || skip?.has(child.tag)) continue;
    if (predicate(child)) results.push(child);
    findSiteElements(child,predicate,results,skip);
  }
  return results;
}
function siteText(node) {
  return typeof node === 'string' ? node : node.children.map(siteText).join('');
}
function oneLineSiteText(node) { return siteText(node).replace(/\s+/g,' ').trim(); }
function contentRoot(root) {
  for (const tag of ['article','main','body']) {
    const matches = findSiteElements(root,node=>node.tag === tag);
    if (matches.length) {
      let longest=matches[0], length=-1;
      for (const item of matches) {
        const size=siteText(item).length;
        if (size>length) { longest=item; length=size; }
      }
      return longest;
    }
  }
  return root;
}
function hasPrivateSiteQuery(url) {
  return [...url.searchParams.keys()].some(key=>/(?:token|auth|password|secret|session|signature|api[_-]?key|^code$)/i.test(key));
}
function documentBase(doc,page,allowUrl) {
  const baseTag = findSiteElements(doc, el=>el.tag==='base' && el.attrs.href)[0];
  let base = page;
  if (baseTag) {
    try { base=allowUrl(new URL(baseTag.attrs.href,page).href).href; } catch { /* Fall back to the document address. */ }
  }
  return base;
}
function supportPageLinks(doc, page, allowUrl, scope=doc, skip) {
  const distinct = new Map();
  let outputSize=0;
  const base=documentBase(doc,page,allowUrl);
  const origin=new URL(page).origin;
  for (const el of findSiteElements(scope,node=>node.tag==='a' && node.attrs.href,[],skip)) {
    const raw = el.attrs.href.trim();
    if (!raw || raw.startsWith('#')) continue;
    try {
      const link = allowUrl(new URL(raw,base).href);
      if (link.origin !== origin || hasPrivateSiteQuery(link) || link.href === page || /\/(?:logout|signout|sign-out|log-out)(?:\/|$)/i.test(link.pathname)) continue;
      if (!distinct.has(link.href)) {
        const label=oneLineSiteText(el).slice(0,150) || link.pathname.slice(0,150);
        distinct.set(link.href,label);
        outputSize+=link.href.length+label.length;
      }
    } catch { /* Only inspect same-origin, public HTTPS links. */ }
    if (distinct.size>500 || outputSize>120000) throw new Error('The page lists too many links for one scan. Try a smaller collection or article.');
  }
  return [...distinct].map(([url,label])=>({url,label}));
}
// Match installation URLs in JavaScript and embed attributes rather than
// general mentions of a provider or links to its marketing site.
const chatSignatures = [
  ['Orka', /(?:\/\/widget\.orka\.chat\/app\.js\b|\bwindow\.ORKA_APP_ID\s*=)/i],
  ['Crisp', /(?:\/\/client\.crisp\.chat\/l\.js\b|\bwindow\.CRISP_WEBSITE_ID\s*=)/i],
  ['Intercom', /(?:\/\/widget\.intercom\.io\/widget\/|\bwindow\.intercomSettings\s*=)/i],
  ['Tidio', /\/\/(?:code\.tidio\.co|widget-v\d+\.tidiochat\.com)\//i],
  ['tawk.to', /\/\/embed\.tawk\.to\//i],
  ['Zendesk', /\/\/(?:static\.zdassets\.com\/ekr\/snippet\.js\b|v2\.zopim\.com\/)/i],
  ['Gorgias', /\/\/(?:config\.gorgias\.chat\/|[a-z\d-]+\.gorgias\.chat\/bundle-loader)/i],
  ['Chatwoot', /(?:\bwindow\.chatwootSDK\.run\b|\/\/app\.chatwoot\.com\/packs\/js\/sdk\.js\b)/i],
  ['HubSpot', /(?:\/\/js(?:-[a-z\d]+)?\.usemessages\.com\/conversations|\bwindow\.HubSpotConversations\.)/i],
  ['Drift', /\/\/js\.driftt\.com\/include\//i],
  ['LiveChat', /\/\/cdn\.livechatinc\.com\/tracking\.js\b/i],
  ['Help Scout', /\/\/beacon-v2\.helpscout\.net\//i],
  ['Gleap', /(?:\/\/sdk\.gleap\.io\/|\bGleap\.initialize\s*\()/i],
  ['Freshchat', /(?:\/\/wchat\.freshchat\.com\/js\/widget|\/\/(?:[a-z\d-]+\.)*fw-cdn\.com\/[\w./-]{1,220}\/widget\.js\b|\bwindow\.fcWidget\.init\b)/i]
];
// A detector only needs executable script blocks and embed URLs. Avoid building
// a document tree for large storefronts, especially long inline SVGs and styles.
function chatSources(html, entities) {
  const tokens=new RegExp(htmlTokens.source,htmlTokens.flags);
  const embeds=[], scripts=[], inline=[];
  let baseHref, count=0, partial=false, match;
  while ((match=tokens.exec(html))!==null) {
    if (++count>160000 || scripts.length+inline.length+embeds.length>=256) { partial=true; break; }
    const token=match[0];
    const heading=token.match(/^<(script|iframe|base|style|textarea|title|template|noscript)\b/i);
    if (!heading) continue;
    const tag=heading[1].toLowerCase();
    let end=tokens.lastIndex;
    if (tag!=='base') {
      const closingTag=new RegExp('</'+tag+'\\s*>','ig');
      closingTag.lastIndex=end;
      const closing=closingTag.exec(html);
      tokens.lastIndex=closing?closingTag.lastIndex:html.length;
      end=closing?.index ?? html.length;
    }
    if (!['script','iframe','base'].includes(tag)) continue;
    const attrs=siteTagAttributes(token.slice(heading[0].length,-1),entities);
    if (tag==='base') { baseHref ??= attrs.href; continue; }
    if (tag==='iframe') { if (attrs.src) embeds.push(attrs.src); continue; }
    const type=(attrs.type || '').trim().split(';')[0].toLowerCase();
    if (type && type!=='module' && !/^(?:text|application)\/(?:x-)?(?:java|ecma)script$/.test(type)) continue;
    if (attrs.src) scripts.push(attrs.src);
    else inline.push(html.slice(match.index+token.length,end));
  }
  return {baseHref,embeds,scripts,inline,partial};
}

function chatScriptPriority(url,origin) {
  if (/chat|messenger|beacon|support|widget|tagmanager/i.test(url.hostname+url.pathname)) return 0;
  if (url.origin===origin && /\/(?:site|app|main|index|entry|client)(?:[.-]|$)/i.test(url.pathname)) return 1;
  return url.origin===origin ? 2 : 3;
}

async function detectChat(page,fetchPage,allowUrl,entities) {
  const sources=chatSources(page.text,entities);
  const matches=new Map();
  let scriptsChecked=0, partial=Boolean(page.truncated || sources.partial);
  function inspect(code,source) {
    // Nuxt and other frameworks serialize configured loaders with escaped
    // slashes in executable JavaScript. Decode the URL characters without eval.
    const text=code.replace(/\\(?:u002f|x2f|\/)/gi,'/').replace(/\\(?:u003a|x3a)/gi,':').replace(/\\(?:u002e|x2e)/gi,'.');
    for (const [name,signature] of chatSignatures) {
      if (matches.has(name)) continue;
      const observed=signature.exec(text);
      if (observed) {
        const evidence=observed[0].replace(/^\/\//,'').replace(/\s*=\s*$/,' assignment').slice(0,120);
        matches.set(name,{name,evidence,source});
      }
    }
  }
  for (const code of sources.inline) inspect(code,page.url);
  let base=page.url;
  try { if (sources.baseHref) base=allowUrl(new URL(sources.baseHref,base).href).href; } catch { /* Keep the document URL. */ }
  const candidates=new Map();
  function inspectEmbed(raw,isScript) {
    let url;
    try { url=allowUrl(new URL(raw,base).href); } catch { partial=true; return; }
    if (hasPrivateSiteQuery(url)) { partial=true; return; }
    // Look at the actual script or iframe location, ignoring unrelated query values.
    inspect(url.origin+url.pathname,page.url);
    if (isScript) candidates.set(url.href,url);
  }
  for (const raw of sources.embeds) inspectEmbed(raw,false);
  for (const raw of sources.scripts) inspectEmbed(raw,true);
  if (!matches.size) {
    const origin=new URL(page.url).origin;
    const ordered=[...candidates.values()].sort((a,b)=>chatScriptPriority(a,origin)-chatScriptPriority(b,origin));
    const selected=ordered.slice(0,8);
    partial ||= ordered.length>selected.length;
    for (let i=0;i<selected.length;i+=3) {
      const batch=await Promise.all(selected.slice(i,i+3).map(async url=>{
        try { return await fetchPage(url.href,{script:true}); }
        catch { return null; }
      }));
      for (const linked of batch) {
        if (!linked) { partial=true; continue; }
        scriptsChecked++;
        partial ||= Boolean(linked.truncated);
        inspect(linked.text,linked.url);
      }
      if (matches.size) break;
    }
  }
  const found=[...matches.values()];
  const scope='Checked the page and '+scriptsChecked+' linked script'+(scriptsChecked===1?'':'s')+'.';
  const summary=found.map(m=>m.name+' — '+m.evidence+' · '+m.source);
  if (partial) summary.push('Some source content was unavailable or exceeded the scan limits.');
  if (!found.length) summary.push('A chat can also load after cookie consent, sign-in or an interaction.');
  return {
    headline:found.length ? found.map(m=>m.name).join(' + ') : partial ? 'Scan incomplete' : 'No recognized chat embed found',
    body:['Page checked: '+page.url,scope,...summary].join('\n'),
    scan:{url:page.url,matches:found,scriptsChecked,partial}
  };
}
function helpInventory(doc, url, allowUrl) {
  const links = supportPageLinks(doc,url,allowUrl);
  const languages = [...new Set(findSiteElements(doc,el=>el.tag==='link' && /\balternate\b/i.test(el.attrs.rel || '') && el.attrs.hreflang).map(el=>el.attrs.hreflang))];
  const article = /\/(?:a|article|articles|docs|answers|solutions\/articles)\//i;
  const collection = /\/(?:c|collections?|categories|category|sections?|folders?)\//i;
  const groups = links.map(link=>({...link,kind:article.test(new URL(link.url).pathname)?'Article candidate':collection.test(new URL(link.url).pathname)?'Collection candidate':'Other internal link'}));
  const tally = kind=>groups.filter(link=>link.kind===kind).length;
  const labels = groups.map(link=>`${link.kind} · ${link.url}`);
  return {
    headline:`${links.length} distinct internal link${links.length===1?'':'s'} on this page`,
    body:[`Source: ${url}`,`Article candidates: ${tally('Article candidate')} · Collection candidates: ${tally('Collection candidate')}`,`Alternate languages advertised: ${languages.join(', ') || 'none found'}`,'','Review these paths before switching your help center:',...labels.slice(0,15), ...(groups.length>15?['Download the CSV for the full list.']:[]), ...(groups.length?[]:['Try a public collection page that lists articles.'])].join('\n'),
    download:{filename:'help-center-inventory.csv',type:'text/csv;charset=utf-8',text:['type,url',...groups.map(({kind,url})=>`${kind},"${url.replaceAll('"','""')}"`)].join('\r\n')}
  };
}

const articleChrome = new Set(['head','nav','footer','aside','form','button','svg','canvas','iframe']);
function escapeArticleText(value) {
  return value.replace(/([\\`*_~\[\]#!|>])/g,'\\$1').replaceAll('<','&lt;').replace(/(^|\n)([+-]|\d+[.)])(?=\s)/g,'$1\\$2');
}
function articleMarkdown(el, base, budget) {
  if (typeof el === 'string') return escapeArticleText(el.replaceAll('\u0000','').replace(/\s+/g,' '));
  const {tag,attrs,children}=el;
  if (articleChrome.has(tag) || Object.hasOwn(attrs,'hidden') || attrs['aria-hidden']==='true') return '';
  if (tag==='pre' || tag==='code') {
    const raw=siteText(el);
    let fenceLength=tag==='pre'?3:1;
    for (const [run] of raw.matchAll(/`+/g)) fenceLength=Math.max(fenceLength,run.length+1);
    const fence='`'.repeat(fenceLength);
    const formatted=tag==='pre'?fence+'\n'+raw+(raw.endsWith('\n')?'':'\n')+fence:fence+raw+fence;
    const index=budget.code.push(formatted)-1;
    const token='\u0000'+index+'\u0000';
    return tag==='pre'?'\n\n'+token+'\n\n':token;
  }
  if (tag==='ul' || tag==='ol') {
    let number = Number.parseInt(attrs.start,10) || 1;
    const items=children.filter(node=>node.tag==='li').map(li=>{
      const marker=tag==='ul'?'- ':(number++)+'. ';
      return marker+li.children.map(node=>articleMarkdown(node,base,budget)).join('').trim().replace(/\n/g,'\n  ');
    });
    return '\n\n'+items.join('\n')+'\n\n';
  }
  const inside=children.map(node=>articleMarkdown(node,base,budget)).join('');
  if (/^h[1-6]$/.test(tag)) return '\n\n'+'#'.repeat(Number(tag[1]))+' '+inside.trim()+'\n\n';
  if (tag==='br') return '\n';
  if (['p','div','blockquote','section','tr','figure','details'].includes(tag)) return '\n\n'+inside.trim()+'\n\n';
  if (tag==='th' || tag==='td') return inside.trim()+' | ';
  if (tag==='strong' || tag==='b') return '**'+inside.trim()+'**';
  if (tag==='em' || tag==='i') return '*'+inside.trim()+'*';
  if (tag==='a' && inside.trim() && attrs.href) {
    try {
      const url = new URL(attrs.href,base);
      if (['https:','http:'].includes(url.protocol) && !url.username && !url.password && !hasPrivateSiteQuery(url)) {
        const destination=url.href.replace(/[()]/g,c=>c==='('?'%28':'%29');
        budget.links+=destination.length;
        if (budget.links<160000) return '['+inside.trim()+']('+destination+')';
      }
    } catch { /* Keep the link label. */ }
  }
  return inside;
}
function convertArticle(doc, url, allowUrl) {
  const article=contentRoot(doc), budget={links:0,code:[]};
  let markdown=articleMarkdown(article,documentBase(doc,url,allowUrl),budget).replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim().replace(/\u0000(\d+)\u0000/g,(_,index)=>budget.code[Number(index)]);
  if (budget.links>=160000 || markdown.length>220000) throw new Error('This article is too long to export. Try a shorter public article.');
  if (!markdown) throw new Error('No readable article text was found. Open a public article and try its address.');
  const heading = findSiteElements(article,node=>node.tag==='h1')[0] || findSiteElements(doc,node=>node.tag==='title')[0];
  const title = heading ? oneLineSiteText(heading) : new URL(url).hostname;
  if (!/^#\s/m.test(markdown)) markdown='# '+escapeArticleText(title)+'\n\n'+markdown;
  markdown+='\n';
  return {headline:title,body:markdown,download:{filename:(title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'help-article')+'.md',text:markdown,type:'text/markdown;charset=utf-8'}};
}
async function checkHelpLinks(doc, url, allowUrl, fetchPage) {
  const all=supportPageLinks(doc,url,allowUrl,contentRoot(doc),new Set(['nav','header','footer','aside','form'])), sample=all.slice(0,8);
  const rows=[];
  // Batches of four connections stay below the worker's concurrent connection limit.
  for (let i=0;i<sample.length;i+=4) {
    const batch=await Promise.all(sample.slice(i,i+4).map(async link=>{
      try {
        const target=await fetchPage(link.url,{statusOnly:true});
        const status=target.status;
        const group=[404,410].includes(status)?'Broken':status>=200&&status<300?'Reachable':'Unverified';
        return {...link,group,detail:'HTTP '+status+(target.url!==link.url?' → '+target.url:'')};
      } catch { return {...link,group:'Unverified',detail:'Request blocked, redirected beyond limits or timed out'}; }
    }));
    rows.push(...batch);
  }
  const count=type=>rows.filter(link=>link.group===type).length;
  return {headline:rows.length?`${count('Broken')} broken · ${count('Unverified')} unverified · ${count('Reachable')} reachable`:'No internal links found in the page content',body:[`Source: ${url}`,`Checked ${sample.length} of ${all.length} eligible internal links in document order.`,'',...rows.map(row=>`${row.group} · ${row.detail}\n${row.label}\n${row.url}\n`)].join('\n')};
}
export async function analyzeSupportSite(action,input,{fetchPage,allowUrl,entities}) {
  const page=await fetchPage(input,{xml:action==='sitemap',detect:action==='detect'});
  if (action==='detect') return detectChat(page,fetchPage,allowUrl,entities);
  if (action==='sitemap') {
    if (/<sitemapindex[\s>]/i.test(page.text)) throw new Error('This is a sitemap index. Use one of its individual URL sitemaps.');
    if (!/<urlset[\s>]/i.test(page.text)) throw new Error('Use an XML URL sitemap or paste a list of article URLs.');
    const urls=[...page.text.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)].map(([,url])=>entities(url.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1')));
    if (urls.length>500) throw new Error('Choose a smaller sitemap or paste up to 500 article URLs per list.');
    return {urls};
  }
  const root=siteDocument(page.text,entities);
  if (action==='markdown') return convertArticle(root,page.url,allowUrl);
  if (action==='inventory') return helpInventory(root,page.url,allowUrl);
  if (action==='links') return checkHelpLinks(root,page.url,allowUrl,fetchPage);
  throw new Error('Unknown site tool.');
}
