// One source of truth for the homepage cards, pricing page and feature comparison.
export const plans = [
  {name:'Free',style:'solo',price:0,icon:'sail',tag:'A PLACE TO START',people:'1 team member',includes:'The essentials, for every project',ai:false,
    title:'A home for every project.',copy:'A proper support home for a solo founder. Free to keep.',
    items:[['chat','Live chat & email follow-up'],['typing','Live typing preview'],['book','Help center & imports'],['code','SDK & custom visitor data'],['palette','Dozens of widget designs'],['phone','iOS & Android apps']],
    button:'Start free · No card required',footnote:'1 team member included. No credit card required.'},
  {name:'Light',style:'light',price:9.99,icon:'shell',tag:'SMALL CREW. SMOOTHER DAYS.',people:'2 team members',includes:'Everything in Free, plus',ai:false,
    title:'Two people. A lighter support day.',copy:'Stay organized, share the work and make time to switch off.',
    items:[['team','Project access & permissions'],['clock','Banners, hours & offline forms'],['search','Saved replies & conversation search'],['file','Image & file sharing'],['tag','Tags, filters & follow-up reminders'],['chart','Live visitor map & analytics']],
    button:'Choose Light',footnote:'2 team members included. AI features start on Pro.'},
  {name:'Pro',style:'pod',price:29,icon:'orca',tag:'YOUR CREW, WITH AN AI TEAMMATE',people:'3 team members',includes:'Everything in Light, plus',ai:true,
    title:'Let Orky take a little off your plate.',copy:'Helpful AI that knows your business and knows when to hand over.',
    items:[['spark','AI drafts & automatic replies'],['handoff','Human handoff & custom triggers'],['shield','Confidence controls & team alerts'],['translate','Chat & help center AI translation'],['summary','AI summaries & urgency scores'],['key','Your own key or Orka AI']],
    button:'Choose Pro',footnote:'3 team members included. AI usage is billed separately.'},
  {name:'Max',style:'fleet',price:99,icon:'anchor',tag:'YOUR WHOLE TEAM. YOUR OWN BRAND.',people:'12 team members',includes:'Everything in Pro, plus',ai:true,
    title:'More people. Fully your own.',copy:'Grow your team, make Orky yours and see how support is doing.',
    items:[['team','Extra teammates · €8/member/mo'],['palette','Custom AI name & image'],['badge','Remove Orka branding'],['heart','Conversation satisfaction scores'],['chart','Team performance reports'],['code','Higher API rate limits']],
    button:'Choose Max',footnote:'12 team members included. Extra members €8/month each. AI usage is separate.'}
];
const paths={
 check:'m5 12 4 4L19 6',chat:'M21 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 19 0Z',typing:'M4 5h16v12H8l-4 4V5 M8 10h.01M12 10h.01M16 10h.01',
 team:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 book:'M12 5v16M12 5C8 2 5 2 2 4v16c3-2 6-2 10 1 4-3 7-3 10-1V4c-3-2-6-2-10 1Z',code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',palette:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4 2 2 0 0 1 0-4h4a3 3 0 0 0 3-3c0-4-4-7-9-7ZM7 9h.01M10 6h.01M15 7h.01M6 13h.01',phone:'M7 2h10v20H7V2Zm4 16h2',clock:'M12 7v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',file:'M14 2H4v20h16V8L14 2Zm0 0v6h6M8 13h8M8 17h5',tag:'M3 3h9l9 9-9 9-9-9V3Zm5 5h.01',chart:'M3 3v18h18M7 16v-4m5 4V7m5 9V4',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',handoff:'M3 7h15m-4-4 4 4-4 4M21 17H6m4-4-4 4 4 4',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-5 10 3 3 7-7',translate:'M2 5h12M8 2v3m-3 3 7 8M12 5c0 6-4 9-9 12m11 4 4-12 4 12m-7-3h6',summary:'M4 5h16M4 10h16M4 15h10M4 20h7',key:'M14 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm0 0h8m-3 0v4m-3-4v3',badge:'M12 3 3 7v6c0 4 9 8 9 8s9-4 9-8V7l-9-4Zm-4 9 3 3 5-6',heart:'M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-6 5 3 12 8 17 5-5 14-12 8-17Z',layers:'m12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5'
};
export const planIcon=name=>`<svg class="pricing-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.check}"/></svg>`;
const esc=s=>String(s).replaceAll('&','&amp;');
export function planArtwork(p,className='mosaic-tier-art'){
 const description={solo:'One orca finding its own current',light:'Two orcas sharing the current',pod:'Three orcas swimming together',fleet:'A whole family of orcas, moving as one'}[p.style];
 return `<img class="${className}" src="/assets/mosaic-pricing-${p.style}.jpg" alt="${description}, in ceramic mosaic" width="1000" height="666" loading="lazy" decoding="async">`;
}
export function planEmblem(p){
 const artwork={Free:'<path d="M8 6h16a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6H14l-8 6V12a6 6 0 0 1 2-6Z"/><path d="M13 14h10m-10 5h6"/>',Light:'<circle cx="18" cy="18" r="7"/><path d="M18 3v3m0 24v3M3 18h3m24 0h3M7.4 7.4l2.1 2.1m17 17 2.1 2.1m0-21.2-2.1 2.1m-17 17-2.1 2.1"/>',Max:'<path d="m5 11 7 6 6-10 6 10 7-6-3 17H8L5 11Z"/><path d="M10 32h16"/>'};
 return `<span class="plan-emblem plan-emblem-${p.name.toLowerCase()}" aria-hidden="true">${p.name==='Pro'?'<img src="/assets/orky-app-icon.svg" alt="" width="44" height="44">':`<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${artwork[p.name]}</svg>`}</span>`;
}
export const planFeatureList=p=>`<p class="plan-inherits"><span class="plan-inherits-check" aria-hidden="true">${planIcon('check')}</span><strong>${p.includes}</strong></p><ul class="plan-features">${p.items.map(([,text])=>`<li><span class="plan-feature-check">${planIcon('check')}</span><span>${esc(text)}</span></li>`).join('')}</ul>`;
export function homePlanCards(){
 return plans.map(p=>`<article class="price-card price-${p.style}${p.name==='Pro'?' featured-plan':''}" data-orka-plan-card="${p.name}">${planArtwork(p)}<div class="price-card-heading"><span class="plan-name-with-emblem">${planEmblem(p)}<span class="mono">${p.name}</span></span>${p.name==='Pro'?'<span class="plan-popular">Most popular</span>':''}</div><h3>${p.title}</h3><div class="price"><span class="price-currency">€</span>${p.price}<span class="price-period">/ month</span></div><strong class="plan-seats">${p.people}</strong><p class="plan-description">${p.copy}</p><a class="button ${p.name==='Pro'?'button-lime':'button-outline'}" href="http://dashboard.orka.chat/signup">${p.button} <span aria-hidden="true">↗</span></a><div class="plan-projects">${planIcon('layers')}Unlimited projects <!-- PROJECT_HELP --></div>${planFeatureList(p)}${p.ai?'<a class="plan-ai-choice" href="#bring-your-own-key">Your key or Orka AI <span aria-hidden="true">↗</span></a>':''}<p class="plan-footnote">${p.footnote}</p></article>`).join('');
}
const all=[true,true,true,true],light=[false,true,true,true],ai=[false,false,true,true],max=[false,false,false,true];
export const featureGroups=[
 {name:'Your projects & people',icon:'team',rows:[
 ['Unlimited projects',all],['Team members',['1','2','3','12']],['Additional team members',[false,false,false,'€8/member/mo']],
 ['Project access & permissions',['N/A',true,true,true],'Assign teammates to specific projects and control the features they can access within each project.']]},
 {name:'A proper support home',icon:'chat',rows:[
 ['Import your existing knowledge',all,'Import from Crisp, GitBook, Intercom, Gleap & Help Scout.'],['SDK & custom visitor data',all],['Dozens of widget designs',all],['Live chat & email follow-up',all],['Live typing preview',all,'See what visitors are typing before they send.'],['Help center',all],['iOS & Android apps',all]]},
 {name:'A smoother support day',icon:'clock',rows:[
 ['Custom banners',light,'Night banners, emergencies, announcements and more.'],['Automatic offline contact form',light],['Business hours & availability scheduling',light],['Saved replies',light,'Reusable shortcuts for answers you send often.'],['Conversation search',light],['Image & file sharing',light],['Conversation tags & filters',light],['Follow-up reminders',light],['Live visitor map',light],['Support analytics',light]]},
 {name:'An AI teammate, on your terms',icon:'spark',note:'Pro & Max · AI usage billed separately',rows:[
 ['AI reply suggestions & drafts',ai,'Based on your help center, website, uploaded files and business instructions.'],['AI auto-replies',ai],['Human handoff',ai,'AI steps aside when a visitor asks for a human, gets frustrated, or needs help beyond its capabilities or knowledge.'],['Custom handoff triggers',ai,'Escalate when specific keywords are mentioned.'],['AI confidence threshold',ai,'Flag low-confidence answers for human review.'],['Handoff notifications & assignment',ai,'Notify your whole team, online teammates or selected teammates, and assign the conversation.'],['Seamless handoff',ai,'Keep the full conversation history and customize the message your visitor sees.'],['Two-way AI conversation translation',ai],['AI help center translation',ai],['AI conversation summaries',ai],['AI urgency scores',ai],['Bring your own AI key or use Orka AI',ai,'Connect OpenAI, Anthropic or OpenRouter with no Orka markup, or let Orka handle AI without a key.']]},
 {name:'Your brand. Your growing team.',icon:'badge',rows:[
 ['Custom AI assistant name & image',max],['Remove Orka branding',max],['Conversation satisfaction scores',max],['Team performance reports',max,'Track response times by teammate and time of day.'],['Higher API rate limits',max]]}
];
// Every pricing row links to its explanation in the product catalogue.
export const pricingFeatureIds=['shared-inbox','team-size','extra-members','project-permissions','help-import','sdk','widget-layouts','live-chat','live-typing','help-center','mobile','announcement-banner','offline-form','business-hours','saved-replies','history-search','attachments','tags','reminders','live-map','analytics','ai-drafts','automatic-replies','human-takeover','handoff-triggers','ai-confidence','handoff-assignment','seamless-handoff','translation','help-auto-translation','summaries','urgency','own-key','custom-orky','remove-branding','satisfaction','team-reports','api-limits'];
export function featureTable(projectHelp){
 const cell=value=>value===true?`<span class="feature-yes">${planIcon('check')}<span class="sr-only">Included</span></span>`:value===false?'<span class="feature-no"><span aria-hidden="true">—</span><span class="sr-only">Not included</span></span>':esc(value);
 let rowIndex=0;
 return `<div class="plan-comparison-shell"><table class="plan-comparison"><caption class="sr-only">All features, at a glance. Monthly prices in euros. AI usage is separate.</caption><colgroup><col class="comparison-label-col">${plans.map(()=>'<col>').join('')}</colgroup><thead><tr><th scope="col"><span class="comparison-heading-label">Your toolkit</span><small>Choose what helps your team.</small></th>${plans.map(p=>`<th scope="col" class="comparison-${p.name.toLowerCase()}"><span>${p.name}</span><strong>€${p.price}<small>/mo</small></strong><span class="comparison-members">${p.people}</span></th>`).join('')}</tr></thead>${featureGroups.map((g,i)=>`<tbody><tr class="feature-group"><th colspan="5" scope="colgroup"><span class="feature-group-label"><span class="feature-group-number">0${i+1}</span>${g.name}</span>${g.note?`<small>${g.note}</small>`:''}</th></tr>${g.rows.map(([name,values,detail])=>`<tr><th scope="row"><a class="comparison-feature-link" href="/features#feature-${pricingFeatureIds[rowIndex++]}">${name}</a>${name==='Unlimited projects'?' '+projectHelp():''}${detail?`<small>${esc(detail)}</small>`:''}</th>${values.map((v,i)=>`<td class="comparison-${plans[i].name.toLowerCase()}">${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody>`).join('')}</table></div>`;
}
