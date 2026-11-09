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
export const widgetDefaults = {
  brand: 'Orka', color: '#356052', message: 'Hi there! Have a question about Orka?'
};

export function widgetHomepage(value) {
  const address=String(value || '').trim();
  if (!address || /\s/.test(address)) throw new Error('Enter your public website address.');
  let target;
  try { target=new URL(/^[a-z][a-z0-9+.-]*:/i.test(address) ? address : 'https://'+address); }
  catch { throw new Error('Enter your public website address.'); }
  if (target.protocol!=='https:' || !target.hostname.includes('.') || target.username || target.password)
    throw new Error('Enter a public HTTPS website address.');
  return target.origin;
}

export async function captureWidgetHomepage(website,signal) {
  const url=widgetHomepage(website);
  const response=await fetch('/api/website-screenshot',{
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}), signal
  });
  if (!response.ok) throw new Error('The homepage could not be captured. You can upload a screenshot instead.');
  const blob=await response.blob();
  if (blob.type!=='image/jpeg' || !blob.size || blob.size>3*1024*1024)
    throw new Error('The homepage capture could not be opened. You can upload a screenshot instead.');
  return blob;
}

export async function getWidgetBackground(website,signal) {
  const url=widgetHomepage(website);
  const response=await fetch('/api/website-preview',{
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}), signal
  });
  if (!response.ok) throw new Error('This website could not be checked. Upload a screenshot to use it as the background.');
  const details=await response.json();
  if (details.captureAvailable) {
    try { return {kind:'image',blob:await captureWidgetHomepage(url,signal),website:url}; }
    catch (error) { if (signal?.aborted) throw error; }
  }
  if (details.status==='ready' && details.canEmbed!==false) return {kind:'website',website:widgetHomepage(details.url)};
  if (details.canEmbed===false) throw new Error('This website blocks embedded previews. Upload a screenshot to see your widget there.');
  throw new Error('This homepage could not be opened. Upload a screenshot to preview it.');
}

async function previewChatWidget(values) {
  const brand=values.brand.trim(), message=values.message.trim(), color=values.color.trim();
  if (!brand || brand.length>70 || !message || message.length>240) throw new Error('Use a brand name up to 70 characters and a welcome message up to 240 characters.');
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Choose a six-digit hex color, such as #356052.');
  const preview={brand,message,color};
  if (values.website?.trim()) {
    preview.website=widgetHomepage(values.website);
    const background=await getWidgetBackground(preview.website);
    if (background.blob) preview.image=URL.createObjectURL(background.blob);
    else preview.website=background.website;
  }
  return {headline:brand+' chat preview',body:brand+' · '+color+'\n'+message,preview};
}

export const siteTools=[
  {
    slug:'live-chat-detector',name:'Live Chat Detector',title:'Free Live Chat Detector for Any Public Website',
    description:'Identify live chat software on a public website. Scan a URL for Orka, Crisp, Intercom, Tidio, Gorgias and other chat embed signatures.',
    category:'Live chat',intro:'Find out which live chat a website uses. Enter its address to see the provider and the code that identified it.',
    fields:[{...urlField('Website address','https://orka.chat/apps'),hint:'Enter a domain or public HTTPS page URL.'}],button:'Scan website',run:({url})=>requestSiteAnalysis('detect',url),
    method:'The detector checks the public page for chat installation code. It can also inspect linked scripts for a loader added by the site’s JavaScript. Each match includes the signal and the page or script where it was found.',
    example:'A product page that loads client.crisp.chat/l.js returns Crisp. If your help center runs on another domain, scan one of its articles to see whether it uses the same provider.',
    faqs:[
      ['Which chat widgets can I identify?','Signatures cover Orka, Crisp, Intercom, Tidio, tawk.to, Zendesk, Gorgias, Chatwoot, HubSpot Conversations, Drift, LiveChat, Help Scout Beacon, Gleap and Freshchat.'],
      ['Why can I see a chat bubble when the scan finds nothing?','The detector reads public page code and can check linked scripts. A widget can still load after a consent choice, login or click. Try the exact page where it appears. A scan that cannot cover all the code is marked as partial.'],
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
    description:'Customize an Orka chat widget on a real homepage or your own screenshot. Try the launcher, change colors and test the conversation on desktop or mobile.',
    category:'Live chat',intro:'See how Orka looks on your website. Change the greeting and colors, open the launcher and try a conversation.',
    fields:[
      {key:'brand',label:'Team name',type:'text',value:widgetDefaults.brand},
      {key:'color',label:'Accent color',type:'color',value:widgetDefaults.color},
      {key:'message',label:'Welcome message',type:'textarea',value:widgetDefaults.message},
      {key:'website',label:'Public website homepage',type:'url',value:'',optional:true}
    ],button:'Preview widget',run:previewChatWidget,
    method:'Start with the Orka homepage or choose a background from your own site. Switch between the People and Classic launchers, edit your team name and greeting, and send a local test message. Choose Desktop or Mobile to see how the widget fits at each width.',
    example:'To check the mobile experience on a product page, upload a screenshot from your phone, choose Mobile and open the launcher. Try your longest welcome message and send a test reply to see how the conversation fits.',
    faqs:[
      ['Can I preview the widget on my own website?','Choose Website and enter your public domain to load its homepage. If the site blocks previews or you want to see a specific product or checkout, choose Upload and use a screenshot from your device.'],
      ['Which parts of the chat widget can I customize?','Change the team name, accent color, greeting and launcher style. The changes appear immediately. Close the conversation to see the launcher in its position on the page.'],
      ['Where do my test messages and uploaded screenshots go?','Test messages and uploaded screenshots stay in this tab. Choosing Website sends the public domain to Orka to check whether the homepage can be previewed. Refreshing the page clears your preview.']
    ],
    related:['chat-welcome-message-generator','live-chat-detector']
  }
];
