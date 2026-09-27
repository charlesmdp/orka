// The homepage and pricing page share the same plan promises and feature lists.
export const plans = [
  {name:'Free',style:'solo',price:0,icon:'sail',tag:'THE ESSENTIALS, FOR EVERY PROJECT',people:'1 team member',
    title:'Real conversations. Zero subscription.',copy:'Support the customers behind every product you run, all from one inbox.',
    items:['1 team member','Live chat & email follow-up','Custom visitor data through the SDK & API','Multilingual help center & custom domain','iOS & Android apps'],
    button:'Start free · No card required',footnote:'AI, conversation translation and search start on Pro.'},
  {name:'Pro',style:'pod',price:29,icon:'orca',tag:'YOUR CREW, WITH AN AI TEAMMATE',people:'Up to 3 team members',
    title:'A little crew. A lot less busywork.',copy:'Answer together, let Orky draft, or put familiar questions on autopilot.',
    items:['Everything in Free','3 team members','AI drafts, auto-replies & reply buttons','Two-way AI conversation translation','Conversation summaries & urgency scores','Message search & image sharing','Support analytics & live visitor map'],
    button:'Choose Pro',footnote:'Your OpenAI, Anthropic or OpenRouter key — or Orka-managed AI. AI usage is billed separately.'},
  {name:'Max',style:'fleet',price:99,icon:'anchor',tag:'MORE PEOPLE. FULLY YOUR BRAND.',people:'Up to 20 team members',
    title:'Your whole team. Your own identity.',copy:'Bring more people aboard and make the widget and AI assistant feel like yours.',
    items:['Everything in Pro','20 team members','Your own name & image for Orky','Remove Orka branding','Your choice of AI provider & billing'],
    button:'Choose Max',footnote:'The same flexible AI options as Pro, with more room for your team. AI usage is billed separately.'}
];
const esc=s=>s.replaceAll('&','&amp;');
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export function homePlanCards(){
 return plans.map(p=>`<article class="price-card price-${p.style}${p.name==='Pro'?' featured-plan':''}" data-orka-plan-card="${p.name}"><div class="price-card-heading"><span class="mono">${p.name}</span>${p.name==='Pro'?'<span class="plan-popular">Most popular</span>':icon(p.name==='Free'?'chat':'team')}</div><h3>${p.title}</h3><div class="price"><span class="price-currency">$</span>${p.price}<span class="price-period">/ month</span></div><p class="plan-description">${p.copy}</p><a class="button ${p.name==='Pro'?'button-lime':'button-outline'}" href="http://dashboard.orka.chat/signup">${p.button} ${icon('arrow')}</a><div class="plan-projects">${icon('layers')}Unlimited projects <!-- PROJECT_HELP --></div><ul class="plan-features">${p.items.map(x=>`<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>${p.name!=='Free'?'<a class="plan-ai-choice" href="#bring-your-own-key">Your key or Orka AI <span aria-hidden="true">↗</span></a>':''}<p class="plan-footnote">${p.footnote}</p></article>`).join('');
}
