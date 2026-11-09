// Shared content and browser actions for the public website and help-center tools.
// Remote checks return selected facts or converted text, never a remote document to embed.
const exampleCenter = 'https://help.cowlendar.com';
const exampleArticle = exampleCenter+'/a/welcome-to-cowlendar';
const exampleCollection = exampleCenter+'/c/beginners-guide';
const urlField = (label,value)=>({key:'url',label,type:'url',value,hint:'Use a public HTTPS address.'});

async function requestSiteAnalysis(action,url) {
  const response=await fetch('/api/support-site-tool',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,url})
  });
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('The website scanner is unavailable. Try again in a moment.');
  const data=await response.json();
  if (!response.ok) throw new Error(data.error || 'The website could not be checked.');
  return data;
}
function mapUrl(value) {
  let url;
  try { url=new URL(value); } catch { throw new Error('Each entry must be an absolute HTTP or HTTPS URL.'); }
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use public article URLs without credentials.');
  url.hash='';
  return url;
}
function parseSitemapLocations(xml) {
  if (/<sitemapindex[\s>]/i.test(xml)) throw new Error('Use a URL sitemap inside the index, or paste the article URLs.');
  const locations=[...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)].map(([,loc])=>loc.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1').replace(/&amp;/gi,'&'));
  if (!locations.length) throw new Error('This sitemap contains no article URLs.');
  return locations;
}
async function readUrlList(value) {
  const text=value.trim();
  if (!text || text.length>220000) throw new Error('Paste up to 500 URLs in each list.');
  let locations;
  if (text.startsWith('<')) locations=parseSitemapLocations(text);
  else if (/^https:\/\/\S+\.xml(?:\?\S*)?$/i.test(text)) locations=(await requestSiteAnalysis('sitemap',text)).urls;
  else locations=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  if (!locations.length || locations.length>500) throw new Error('Each list must contain between 1 and 500 URLs.');
  return [...new Set(locations.map(value=>mapUrl(value).href))].map(href=>{
    const url=new URL(href);
    const path=url.pathname.replace(/\/+$/,'') || '/';
    const slug=path.split('/').at(-1) || '';
    let readable=slug;
    try { readable=decodeURIComponent(slug); } catch { /* Keep the URL spelling. */ }
    const words=new Set(readable.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(word=>word && !/^\d+$/.test(word)));
    return {href,path:path+url.search,slug,words};
  });
}
function redirectCandidate(old,targets) {
  if (targets.some(target=>target.href===old.href)) return {status:'Unchanged',destination:old.href};
  for (const [key,reason] of [['path','Same path'],['slug','Same final slug']]) {
    if (!old[key] || (key==='slug' && ['index','index.html','index.htm'].includes(old.slug))) continue;
    const matches=targets.filter(target=>target[key]===old[key]);
    if (matches.length===1) return {status:reason,destination:matches[0].href};
    if (matches.length>1) return {status:'Review ambiguous matches',destination:''};
  }
  const scored=targets.map(target=>{
    const shared=[...old.words].filter(word=>target.words.has(word)).length;
    const union=old.words.size+target.words.size-shared;
    return {target,score:shared>=2?shared/union:0};
  }).sort((a,b)=>b.score-a.score);
  if (scored[0].score>=0.6 && scored[0].score-(scored[1]?.score || 0)>=0.15) return {status:'Review similar slug',destination:scored[0].target.href};
  return {status:'Choose destination manually',destination:''};
}
async function generateRedirectMap(values) {
  const [oldUrls,newUrls]=await Promise.all([readUrlList(values.oldUrls),readUrlList(values.newUrls)]);
  const rows=oldUrls.map(old=>({from:old.href,...redirectCandidate(old,newUrls)}));
  const unchanged=rows.filter(row=>row.status==='Unchanged').length;
  const matched=rows.filter(row=>row.destination && row.status!=='Unchanged').length;
  const escaped=s=>'"'+s.replaceAll('"','""')+'"';
  return {
    headline:matched+' proposed redirect'+(matched===1?'':'s')+' for review',
    body:[oldUrls.length+' source URLs · '+newUrls.length+' candidate destinations · '+unchanged+' unchanged','',...rows.slice(0,12).map(row=>row.status+'\n'+row.from+(row.destination?' → '+row.destination:'')+'\n'),...(rows.length>12?['The CSV includes every source URL.']:[])].join('\n'),
    download:{filename:'help-center-redirect-map.csv',type:'text/csv;charset=utf-8',text:['source,destination,match',...rows.map(row=>[row.from,row.destination,row.status].map(escaped).join(','))].join('\r\n')}
  };
}
let previousPreviewImage;
async function previewChatWidget(values) {
  const brand=values.brand.trim(), message=values.message.trim(), color=values.color.trim();
  if (!brand || brand.length>70 || !message || message.length>240) throw new Error('Use a brand name up to 70 characters and a welcome message up to 240 characters.');
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Choose a six-digit hex color, such as #356052.');
  const preview={brand,message,color};
  let stage='Sample page';
  if (values.website.trim()) {
    let target;
    try { target=new URL(values.website.trim()); } catch { throw new Error('Enter a full HTTPS website address, or keep the sample page.'); }
    if (target.protocol!=='https:' || !target.hostname.includes('.') || target.username || target.password) throw new Error('Enter a public HTTPS website address.');
    preview.website=target.origin;
    try {
      const shot=await fetch('/api/website-screenshot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:target.origin})});
      if (shot.ok && shot.headers.get('Content-Type')?.startsWith('image/jpeg')) {
        preview.image=URL.createObjectURL(await shot.blob());
        stage='Homepage snapshot of '+target.hostname;
      } else stage='Sample page · A snapshot of '+target.hostname+' is unavailable';
    } catch { stage='Sample page · The homepage snapshot could not be loaded'; }
  }
  if (previousPreviewImage) URL.revokeObjectURL(previousPreviewImage);
  previousPreviewImage=preview.image;
  return {headline:brand+' chat preview',body:stage+'\nWidget color: '+color+'\nWelcome message: '+message,preview};
}

export const siteTools=[
  {
    slug:'live-chat-detector',name:'Live Chat Detector',title:'Free Live Chat Detector for Any Public Website',
    description:'Identify live chat software on a public website. Scan a URL for Orka, Crisp, Intercom, Tidio, Gorgias and other chat embed signatures.',
    category:'Live chat',intro:'Enter a public page to see which live chat providers appear in its initial HTML. Each match includes the installation signal that identified it.',
    fields:[urlField('Website page URL','https://orka.chat/apps')],button:'Detect live chat',run:({url})=>requestSiteAnalysis('detect',url),
    method:'The detector reads the page as an anonymous visitor and compares its script tags and iframe sources with known provider signatures. It reports every match, so you can spot an older widget during a migration. Run it on the page where visitors actually chat.',
    example:'Suppose a shop includes client.crisp.chat/l.js on its product page. The result names Crisp and identifies its loader. A product page still using the previous provider will show a different result when scanned separately.',
    faqs:[
      ['Which chat widgets can I identify?','Signatures cover Orka, Crisp, Intercom, Tidio, tawk.to, Zendesk, Gorgias, Chatwoot, HubSpot Conversations, Drift, LiveChat, Help Scout Beacon, Gleap and Freshchat.'],
      ['Why can I see a chat bubble when the scan finds nothing?','A consent button, tag manager, login or JavaScript event can load the widget after the first response. The scan reads the HTML sent by the server. Try the page where the chat is normally available and check those conditions.'],
      ['Does a detected script mean the widget is working?','It identifies an installation signal. Sending and receiving a test message in a browser is how to confirm the widget and inbox both work.']
    ],
    related:['chat-widget-preview','chat-welcome-message-generator']
  },
  {
    slug:'help-center-to-markdown-converter',name:'Help Center to Markdown Converter',title:'Free Help Center Article to Markdown Converter',
    description:'Convert a public help center article URL to a downloadable Markdown file with headings, lists, code and links. Preview the converted text before exporting.',
    category:'Knowledge base',intro:'Paste a published help article and download an editable .md file. Relative links become full URLs so they still lead to the original resources after export.',
    fields:[urlField('Public article URL',exampleArticle)],button:'Convert to Markdown',run:({url})=>requestSiteAnalysis('markdown',url),
    method:'The converter reads one public HTML document and prefers an article element, then a main element, then the body. It keeps common text formatting, headings, links, ordered steps and code. Review the preview before importing it into a new editor.',
    example:'A guide with an “Installation” heading, three numbered steps and a link to /settings becomes a Markdown heading, an ordered list and a link pointing back to the source domain.',
    faqs:[
      ['Can I export several help articles?','Run the converter once per article. Each result includes its own Markdown download. For a collection page, choose a specific article link first.'],
      ['What happens to embedded videos and custom components?','The output focuses on written content. Reinsert video embeds, screenshots, tabs and interactive components in the destination editor.'],
      ['Which articles can be read?','Use a public HTTPS URL that serves article text as HTML within 512 KiB. Articles behind a login, bot challenge or JavaScript-only viewer may require an export from your existing help desk.']
    ],
    related:['help-center-migration-checker','help-center-redirect-map-generator']
  },
  {
    slug:'help-center-migration-checker',name:'Help Center Migration Checker',title:'Free Help Center Migration Checker and Link Inventory',
    description:'Prepare a help center migration from one public URL. Find linked article and collection candidates, discover advertised languages and export the inventory.',
    category:'Knowledge base',intro:'Start with a help center home or collection page. See which internal URLs a visitor can discover there, then export them as a starting list for your migration.',
    fields:[urlField('Help center or collection URL',exampleCenter)],button:'Check migration inventory',run:({url})=>requestSiteAnalysis('inventory',url),
    method:'The checker lists distinct same-origin links in the initial HTML. Common article and collection paths receive a candidate label. Other paths stay in the export for review. Alternate-language declarations are read from the source page.',
    example:'If a collection links to /articles/reset-password twice, the CSV contains one article candidate. A link to /collections/account appears separately so your team can preserve the collection hierarchy.',
    faqs:[
      ['Does the count include every article in my help center?','It covers links published on the page you enter. Scan additional collections or compare your provider’s article export for a full inventory.'],
      ['How can I use the inventory during a migration?','Review the candidates, flag outdated pages and record each new destination. Use the redirect map generator once your new article URLs are available.'],
      ['Will submitting a URL change my help center?','The checker reads public content and returns a CSV. Migration and publishing are separate actions in your chosen help desk.']
    ],
    related:['help-center-redirect-map-generator','help-center-broken-link-checker']
  },
  {
    slug:'help-center-redirect-map-generator',name:'Help Center Redirect Map Generator',title:'Free Help Center 301 Redirect Map Generator',
    description:'Match old and new help center article URLs from lists or XML sitemaps. Review exact matches, similar slugs and unresolved URLs in a downloadable redirect CSV.',
    category:'Knowledge base',intro:'Compare two article inventories and build a reviewable redirect map before your old help center goes offline. Supply one URL per line, XML sitemap text or a public .xml sitemap address.',
    fields:[
      {key:'oldUrls',label:'Old article URLs or XML sitemap',type:'textarea',value:'https://help.example.com/articles/reset-password\nhttps://help.example.com/articles/edit-shipping-address'},
      {key:'newUrls',label:'New article URLs or XML sitemap',type:'textarea',value:'https://docs.example.com/account/reset-password\nhttps://docs.example.com/orders/edit-shipping-address'}
    ],button:'Generate redirect map',run:generateRedirectMap,
    method:'Matching starts with identical URLs, then checks for a single matching path or final slug. Similar slugs are suggested only when at least two words overlap and the best match clearly leads. Ambiguous destinations stay blank for a person to choose. Each list supports up to 500 URLs.',
    example:'An old /articles/reset-password page and a new /account/reset-password page share the final slug. The CSV stores both addresses with “Same final slug” as the reason to review the pair.',
    faqs:[
      ['Can I paste a sitemap instead of copying individual links?','Yes. Paste XML from a URL sitemap or enter a public HTTPS .xml sitemap address. With a sitemap index, open the child file containing your help articles.'],
      ['What if two translated articles use the same slug?','If both candidates survive the path and slug checks, the result flags an ambiguous match. Use the language and article content to choose the correct destination.'],
      ['Does the CSV install 301 redirects?','It supplies source URLs, proposed destinations and match reasons. Review each row, implement permanent redirects at your host, then test that each old URL opens the intended article.']
    ],
    related:['help-center-migration-checker','help-center-broken-link-checker']
  },
  {
    slug:'help-center-broken-link-checker',name:'Help Center Broken Link Checker',title:'Free Broken Link Checker for Help Center Articles',
    description:'Check up to eight internal links on a public help center page. See HTTP status, source link text, broken destinations and links that need manual verification.',
    category:'Knowledge base',intro:'Paste an article or collection URL to find broken internal links in its content. The results show the link text and destination so you can find the exact reference to fix.',
    fields:[urlField('Article or collection URL',exampleCollection)],button:'Check internal links',run:({url})=>requestSiteAnalysis('links',url),
    method:'The checker reads the article or main content and follows the first eight distinct internal HTTPS links in document order. A 404 or 410 is marked broken. Successful 2xx responses are reachable. Timeouts, access restrictions and server errors remain unverified.',
    example:'A password guide links to /account/security, which returns HTTP 410. The checker lists the anchor text, the destination and “Broken”. A separate link that returns HTTP 403 is listed for manual verification.',
    faqs:[
      ['How many pages and links does one scan check?','Each scan starts from one page and tests up to eight unique links on the same origin. The result also gives the number of eligible links found in that content.'],
      ['Are redirects treated as broken links?','The checker follows up to three public redirects and reports the final address. A redirect to a successful page is reachable. Check the destination if it might point to the wrong article.'],
      ['Does the tool catch soft 404s or broken heading anchors?','The link check uses HTTP responses. A missing article that returns a successful status or a missing heading on an otherwise working page needs a browser check.']
    ],
    related:['help-center-migration-checker','help-center-redirect-map-generator']
  },
  {
    slug:'chat-widget-preview',name:'Chat Widget Preview',title:'Free Live Chat Widget Preview for Your Website',
    description:'Preview a branded chat widget with your color, business name and welcome message. Use a sample page or request a screenshot of your public homepage.',
    category:'Live chat',intro:'Try a chat bubble with your own brand and greeting before you install anything. Use the sample or enter a public website to preview the design on a homepage snapshot.',
    fields:[
      {key:'brand',label:'Business name',type:'text',value:'Coast & Co.'},
      {key:'color',label:'Widget color',type:'color',value:'#356052'},
      {key:'message',label:'Welcome message',type:'textarea',value:'Hi there! Need a hand choosing a size?'},
      {key:'website',label:'Website for a homepage snapshot',type:'url',value:'',optional:true,hint:'Leave blank to use the sample page.'}
    ],button:'Preview widget',run:previewChatWidget,
    method:'Choose a brand, accent color and greeting to draw a sample launcher and message. Entering a website requests an anonymous desktop capture of its homepage. If the site blocks screenshots, the preview uses a sample background.',
    example:'A clothing shop can compare “How can we help?” with “Need a hand choosing a size?” using its own green accent, then pick the greeting that suits the product page.',
    faqs:[
      ['Do I need to install a script to preview my widget?','The preview runs on this page. You can adjust the design and wording before choosing a live chat platform.'],
      ['Can I use a particular product or checkout page as the background?','Automatic captures use the public homepage of the domain you enter. Pages that require an account or restrict screenshots use the sample background instead.'],
      ['Does this send a real message to my team?','This is a visual preview. Connecting a team inbox and testing message delivery takes place when you install a live widget.']
    ],
    related:['chat-welcome-message-generator','live-chat-detector']
  }
];
