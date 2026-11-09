// Read the public document, never execute it. This tokenizer handles ordinary
// article HTML and keeps raw script/style content separate from visible text.
const voidElements = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const rawTags = new Set(['script','style','textarea','template','noscript']);
const htmlTokens = /<!--[\s\S]*?(?:-->|$)|<\/?[a-z][a-z\d:-]*\b(?:[^<>"']|"[^"]*"|'[^']*')*>|<![^>]*>|[^<]+|</gi;
const attrPattern = /([^\s=/><]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
function siteDocument(html, entities) {
  const root = {tag:'root',attrs:{},children:[]};
  const stack = [root], scripts = [];
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
      if (tag==='script' && !/\btype\s*=\s*["']?(?:application\/(?:ld\+)?json|importmap)/i.test(token))
        scripts.push(html.slice(match.index,closing?.index ?? html.length));
      tokens.lastIndex=closing?closingTag.lastIndex:html.length;
      continue;
    }
    const attrs = Object.create(null);
    for (const [,key,dq,sq,unquoted] of token.slice(heading[0].length,-1).matchAll(attrPattern)) {
      attrs[key.toLowerCase()] = entities(dq ?? sq ?? unquoted ?? '');
    }
    // Common optional end tags on exported help articles.
    if (['li','p','tr'].includes(tag) && stack.at(-1).tag === tag) stack.pop();
    const el = {tag,attrs,children:[]};
    stack.at(-1).children.push(el);
    if (!voidElements.has(tag) && !token.endsWith('/>')) stack.push(el);
  }
  return {root,scripts};
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
const chatSignatures = [
  ['Orka', /(?:widget\.orka\.chat\/app\.js|window\.ORKA_APP_ID\s*=)/i, 'Orka widget loader'],
  ['Crisp', /(?:client\.crisp\.chat\/l\.js|window\.CRISP_WEBSITE_ID\s*=)/i, 'Crisp loader or website ID'],
  ['Intercom', /(?:widget\.intercom\.io\/widget\/|window\.intercomSettings\s*=)/i, 'Intercom Messenger loader or settings'],
  ['Tidio', /(?:code\.tidio\.co\/|widget-v\d+\.tidiochat\.com\/)/i, 'Tidio widget script'],
  ['tawk.to', /embed\.tawk\.to\//i, 'tawk.to embed'],
  ['Zendesk', /(?:static\.zdassets\.com\/ekr\/snippet\.js|v2\.zopim\.com\/)/i, 'Zendesk Web Widget loader'],
  ['Gorgias', /(?:config\.gorgias\.chat\/|\.gorgias\.chat\/bundle-loader)/i, 'Gorgias Chat loader'],
  ['Chatwoot', /(?:window\.chatwootSDK\.run|app\.chatwoot\.com\/packs\/js\/sdk\.js)/i, 'Chatwoot SDK'],
  ['HubSpot', /(?:js(?:-[a-z\d]+)?\.usemessages\.com\/conversations|window\.HubSpotConversations\.)/i, 'HubSpot Conversations loader'],
  ['Drift', /js\.driftt\.com\/include\//i, 'Drift widget loader'],
  ['LiveChat', /cdn\.livechatinc\.com\/tracking\.js/i, 'LiveChat tracking script'],
  ['Help Scout', /beacon-v2\.helpscout\.net\//i, 'Help Scout Beacon loader'],
  ['Gleap', /(?:sdk\.gleap\.io\/|Gleap\.initialize\s*\()/i, 'Gleap SDK'],
  ['Freshchat', /(?:wchat\.freshchat\.com\/js\/widget|fw-cdn\.com\/[^"'\s]*\/widget\.js|window\.fcWidget\.init)/i, 'Freshchat or Freshworks widget loader']
];
function widgetMatches(scripts, doc, url) {
  const embeds = findSiteElements(doc, el=>el.tag==='iframe' && el.attrs.src).map(el=>el.attrs.src);
  const source = [...scripts,...embeds].join('\n');
  const matches = chatSignatures.filter(([,pattern])=>pattern.test(source));
  return {
    headline:matches.length ? matches.map(([name])=>name).join(' + ') : 'No recognized chat embed found',
    body:[`Page checked: ${url}`, ...matches.map(([name,,evidence])=>`${name} — ${evidence}`), '', 'Scope: scripts and embed URLs included in the initial HTML. A consent gate, tag manager or signed-in area can load a widget later.'].join('\n')
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
  const page=await fetchPage(input,{xml:action==='sitemap'});
  if (action==='sitemap') {
    if (/<sitemapindex[\s>]/i.test(page.text)) throw new Error('This is a sitemap index. Use one of its individual URL sitemaps.');
    if (!/<urlset[\s>]/i.test(page.text)) throw new Error('Use an XML URL sitemap or paste a list of article URLs.');
    const urls=[...page.text.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)].map(([,url])=>entities(url.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1')));
    if (urls.length>500) throw new Error('Choose a smaller sitemap or paste up to 500 article URLs per list.');
    return {urls};
  }
  const {root,scripts}=siteDocument(page.text,entities);
  if (action==='detect') return widgetMatches(scripts,root,page.url);
  if (action==='markdown') return convertArticle(root,page.url,allowUrl);
  if (action==='inventory') return helpInventory(root,page.url,allowUrl);
  if (action==='links') return checkHelpLinks(root,page.url,allowUrl,fetchPage);
  throw new Error('Unknown site tool.');
}
