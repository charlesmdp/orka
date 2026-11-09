import { escapeHtml as esc, faqSchema, origin } from './site-chrome.mjs';
import { tools, toolGroups, toolFamily, updated } from './free-tool-catalogue.mjs';

const hub = 'free-tools';
const imageDir = '/assets/free-tools/';
const hubTitle = 'Free Customer Support Tools for Live Chat, Help Centers & Ecommerce';
const hubDescription = 'Use 20 free tools to inspect a live chat installation, move help articles, forecast support volume and prepare customer replies. Get results without an account.';
const documentation = {
  'first-response-time-calculator': ['How Zendesk measures first reply time','https://support.zendesk.com/hc/en-us/articles/4408821871642-Understanding-ticket-reply-time'],
  'help-center-redirect-map-generator': ['Google Search Central’s guide to redirects','https://developers.google.com/search/docs/crawling-indexing/301-redirects'],
  'help-center-to-markdown-converter': ['CommonMark formatting reference','https://commonmark.org/help/'],
  'shopify-faq-generator': ['Shopify’s guide to store policies','https://help.shopify.com/en/manual/checkout-settings/refund-privacy-tos']
};
const productGuides = {
  'Live chat': ['/features','Explore live chat features'],
  'Knowledge base': ['/help-center','Explore the Orka help center'],
  'Ecommerce': ['/best-live-chat-for-shopify','Live chat for Shopify stores'],
  'Support operations': ['/features','Explore the shared inbox'],
  'AI & writing': ['/ai','Explore Orky for customer support']
};
const icon = (slug, size=96, lazy=false) => `<img src="${imageDir}${slug}.svg" width="${size}" height="${size}" alt="" decoding="async"${lazy?' loading="lazy"':''}>`;
const schema = obj => `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org',...obj}).replaceAll('<','\\u003c')}</script>`;
const card = t => `<a class="ft-card" href="/${t.slug}">${icon(t.slug,81,true)}<div><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p></div><span class="ft-arrow" aria-hidden="true">↗</span></a>`;

function decorate(html,slug,name,desc,extra) {
  const image = origin + imageDir + slug + '-share.jpg';
  return html.replace(/<meta property="og:image"[^>]+>/,`<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(name)} by Orka"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(name)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}">`)
    .replace('</head>',`<meta name="orka-content-kind" content="editorial"><link rel="stylesheet" href="free-tools.css">${extra}</head>`);
}
const directoryQuestions = [
  ['Do I need an Orka account to use these tools?', 'All 20 tools are free to use here. Open a tool, change the sample inputs and run it without signing in.'],
  ['Which tool should I use before moving a help center?', 'Start with the migration checker to list links on a public collection page. Use the Markdown converter for an individual article, then compare your old and new URL lists in the redirect map generator.'],
  ['Can I export my results?', 'Every tool lets you copy its result. The redirect map and migration inventory offer CSV downloads. The article converter, FAQ generators and bug report tool also offer text files you can keep or edit.']
];
function directory(documentPage) {
  const groups = toolGroups.map(g=>({...g,items:tools.filter(t=>t.category===g.name)}));
  const inventory = groups.map(g=>`<section class="ft-collection" id="${g.id}"><h2>${esc(g.name)}</h2><div class="ft-card-grid">${g.items.map(card).join('')}</div></section>`).join('');
  const illustration = ['live-chat-detector','help-center-to-markdown-converter','wismo-calculator'].map(slug=>icon(slug,128)).join('');
  const body = `<div class="ft-page ft-index"><div class="ft-wrap">
    <header class="ft-library-hero"><div><h1>Free customer<br><em>support tools.</em></h1><p>Check your chat widget, move a help center or plan your next support shift. Choose a tool to get started.</p></div>
      <div class="ft-library-art" aria-hidden="true">${illustration}</div></header>
    <nav class="ft-categories" aria-label="Tool categories">${groups.map(g=>`<a href="#${g.id}">${esc(g.name)} <span>${g.items.length}</span></a>`).join('')}</nav>
    ${inventory}
    <section class="ft-faq ft-directory-faq"><h2>Frequently asked questions</h2>${directoryQuestions.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
  </div></div>`;
  const items=tools.map((t,i)=>({'@type':'ListItem',position:i+1,name:t.name,url:origin+'/'+t.slug}));
  return {
    html: decorate(documentPage(hub,hubTitle,hubDescription,body,{script:false,updated}),hub,hubTitle,hubDescription,schema({'@type':'ItemList',name:'Free customer support tools',numberOfItems:items.length,itemListElement:items})+faqSchema(directoryQuestions)),
    md: `# Free customer support tools\n\nCanonical: ${origin}/${hub}\nUpdated: ${updated}\n\n${hubDescription}\n\n`+
      groups.map(g=>'## '+g.name+'\n\n'+g.items.map(t=>`- [${t.name}](${origin}/${t.slug}): ${t.description}`).join('\n')).join('\n\n')+'\n\n## Frequently asked questions\n\n'+directoryQuestions.map(([q,a])=>'### '+q+'\n\n'+a).join('\n\n')+'\n'
  };
}

function renderField(f) {
  const id = 'tool-input-'+f.key;
  const hintId = id+'-hint';
  const attrs = `id="${id}" name="${f.key}"${f.optional?'':' required'}${f.hint?` aria-describedby="${hintId}"`:''}`;
  let input;
  if (f.type==='select') input=`<select ${attrs}>${f.options.map(([v,label])=>`<option value="${esc(v)}"${f.value===v?' selected':''}>${esc(label)}</option>`).join('')}</select>`;
  else if (f.type==='textarea') input=`<textarea ${attrs} rows="${Math.min(6,Math.max(3,String(f.value).split('\n').length))}">${esc(f.value)}</textarea>`;
  else {
    const limits=['min','max','step'].filter(k=>f[k]!=null).map(k=>` ${k}="${esc(f[k])}"`).join('');
    input=`<input ${attrs} type="${f.type}" value="${esc(f.value)}"${limits}>`;
  }
  return `<div class="ft-field${f.type==='textarea'?' ft-wide':''}"><label for="${id}">${esc(f.label)}${f.optional?' <small>(optional)</small>':''}</label>${input}${f.hint?`<small id="${hintId}">${esc(f.hint)}</small>`:''}</div>`;
}
function renderTool(documentPage,t) {
  const group=toolGroups.find(g=>g.name===t.category);
  const relatedSlugs = [...new Set([...(t.related||[]), ...tools.filter(x=>x.category===t.category).map(x=>x.slug)])].filter(s=>s!==t.slug);
  const related=relatedSlugs.map(s=>tools.find(x=>x.slug===s)).filter(Boolean).slice(0,2);
  const faq = t.faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const doc=documentation[t.slug];
  const guide=productGuides[t.category];
  const methodTitle = toolFamily(t)==='math'?'How the calculation works':'How it works';
  const body=`<div class="ft-page"><div class="ft-wrap">
    <nav class="ft-breadcrumb" aria-label="Breadcrumb"><a href="/free-tools">Free tools</a><span aria-hidden="true">/</span><a href="/free-tools#${group.id}">${esc(t.category)}</a></nav>
    <header class="ft-hero"><div><h1>${esc(t.name)}</h1><p>${esc(t.intro)}</p></div><div class="ft-hero-art ft-tone-${group.id}">${icon(t.slug,194)}</div></header>
    <section class="ft-workbench" aria-label="${esc(t.name)} workspace" data-tool="${t.slug}" data-family="${toolFamily(t)}">
      <form autocomplete="off" method="post" class="ft-form">
        <noscript><p>Enable JavaScript to run this tool. Its method and worked example are available below.</p></noscript>
        <fieldset disabled><legend>Your inputs</legend><div class="ft-fields">${t.fields.map(renderField).join('')}</div><button class="ft-submit" type="submit">${esc(t.button)} <span aria-hidden="true">→</span></button></fieldset>
      </form>
      <div class="ft-output"><div class="ft-example" data-example><h2>Worked example</h2><p>${esc(t.example)}</p></div>
        <div data-result hidden><h2 tabindex="-1" data-headline></h2><div class="ft-result-body" data-body></div><div data-preview hidden></div><div class="ft-actions"><button type="button" data-copy>Copy result</button><a data-download hidden download>Download file ↓</a></div></div>
        <p class="ft-status" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>
    </section>
    <div class="ft-reading"><section><h2>${methodTitle}</h2><p>${esc(t.method)}</p>${doc?`<a class="ft-ref" href="${doc[1]}">${esc(doc[0])} ↗</a>`:''}</section>
      <section class="ft-faq"><h2>Frequently asked questions</h2>${faq}</section></div>
    <nav class="ft-more" aria-label="Related tools and guides"><h2>Related tools</h2><div>${related.map(x=>`<a href="/${x.slug}">${icon(x.slug,38,true)} ${esc(x.name)} <span aria-hidden="true">↗</span></a>`).join('')}</div><a href="${guide[0]}">${guide[1]} →</a></nav>
  </div></div>`;
  const url=origin+'/'+t.slug;
  const appSchema=schema({'@type':'WebApplication','@id':url+'#tool',url,name:t.name,description:t.description,applicationCategory:'BusinessApplication',operatingSystem:'Any',browserRequirements:'Requires JavaScript',inLanguage:'en',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},publisher:{'@type':'Organization',name:'Orka',url:origin},image:origin+imageDir+t.slug+'-share.jpg'});
  const crumbs=schema({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Free tools',item:origin+'/'+hub},{'@type':'ListItem',position:2,name:t.category,item:origin+'/'+hub+'#'+group.id},{'@type':'ListItem',position:3,name:t.name,item:url}]});
  const extra=appSchema+crumbs+faqSchema(t.faqs)+'<script type="module" src="free-tools.js"></script>';
  const md = [`# ${t.name}`,`Canonical: ${url}\nUpdated: ${updated}\nPublisher: Orka`,t.intro,'## Inputs',t.fields.map(f=>'- '+f.label+(f.hint?' — '+f.hint:'')).join('\n'),'## '+methodTitle,t.method,'## Worked example',t.example,'## Frequently asked questions',...t.faqs.flatMap(([q,a])=>['### '+q,a]),...(doc?['## Reference',`[${doc[0]}](${doc[1]})`]:[]),'## Related tools',related.map(r=>`- [${r.name}](${origin}/${r.slug})`).join('\n')].join('\n\n')+'\n';
  return {html:decorate(documentPage(t.slug,t.title,t.description,body,{script:false,updated}),t.slug,t.name,t.description,extra),md};
}
export function addToolPages(files,documentPage) {
  const pages = [[hub,directory(documentPage)],...tools.map(t=>[t.slug,renderTool(documentPage,t)])];
  for(const [slug,page] of pages) {
    files.set(slug+'.html',page.html);
    files.set(slug+'.md',page.md);
  }
}
