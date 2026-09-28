export function projectHelp(){
 return '<button type="button" class="project-help" data-project-help aria-haspopup="dialog" aria-controls="project-explainer">What is a project? <span aria-hidden="true">↗</span></button>';
}

const chatBubble = '<span class="project-mini-chat"><img src="/assets/orka-logo.svg" width="23" height="21" alt=""></span>';
function browserPreview(address,body,kind){
 return `<div class="project-preview project-preview-${kind}" aria-hidden="true"><div class="project-browser-bar"><i></i><i></i><i></i><span>${address}</span></div>${body}${chatBubble}</div>`;
}
function storePreview(){
 return browserPreview('your-store.com',`<div class="project-shop-nav"><strong>COAST &amp; CO.</strong><span>Shop &nbsp; About &nbsp; Bag (1)</span></div><div class="project-shop-product"><div class="project-shop-photo"><img src="/assets/orca-cap.webp" width="130" height="108" alt="" loading="lazy"></div><div><small>THE EVERYDAY COLLECTION</small><strong>Your new<br>favorite cap.</strong><span>$48.00</span><b>Add to bag</b></div></div>`,'store');
}

function projectTeamCards(){
 const people={Emma:'portrait-founder-2.png',Theo:'portrait-founder-3.jpg',Jules:'portrait-founder-4.jpg'};
 const projects=[
  {title:'Landing page',url:'yourbrand.com',kind:'landing',team:['Emma','Theo'],role:'Marketing & pre-sales',preview:'<small>YOUR NEXT GREAT PRODUCT</small><strong>Make work<br>feel lighter.</strong><b>Meet your product ↗</b>'},
  {title:'Your app',url:'app.yourbrand.com',kind:'workspace',team:['Theo','Jules'],role:'Technical & customer support',preview:'<div class="project-team-app-nav">Your workspace <span>●</span></div><div class="project-team-app-stats"><i></i><i></i><i></i></div><div class="project-team-app-bars"><i></i><i></i><i></i><i></i></div>'},
  {title:'Demo site',url:'demo.yourbrand.com',kind:'demo',team:['Emma','Jules'],role:'Product demos & onboarding',preview:'<div class="project-demo-window"><span></span><span></span><span></span><span></span></div><b>Try it out ↗</b>'},
  {title:'Your ecom website',team:['Emma','Theo'],role:'Orders, sizing & returns',customPreview:storePreview()}
 ];
 return projects.map((p,i)=>`<article>${p.customPreview || browserPreview(p.url,`<div class="project-team-screen project-team-screen-${p.kind}">${p.preview}</div>`,'team')}<div class="project-team-copy"><span class="project-eyebrow">PROJECT 0${i+1}</span><h4>${p.title}</h4><p>${p.role}</p><span class="project-team-label">Assigned teammates</span><div class="project-team-members">${p.team.map(name=>`<img src="/assets/${people[name]}" width="32" height="32" alt="" loading="lazy">`).join('')}<span>${p.team.join(' &amp; ')}</span></div></div></article>`).join('');
}

export function projectDialog(){
 return `<dialog class="project-dialog" id="project-explainer" aria-labelledby="project-explainer-title" aria-describedby="project-explainer-intro">
 <div class="project-dialog-top"><span>WHAT IS A PROJECT?</span><button type="button" class="project-dialog-close" data-close-project aria-label="Close project explanation" autofocus>×</button></div>
 <div class="project-dialog-content"><h2 id="project-explainer-title">One project for each thing you run.</h2><p id="project-explainer-intro">A shop, a SaaS, a website… each can have its own space in Orka.</p>
 <section class="project-split-visual project-team-explainer" aria-labelledby="project-split-title"><span class="project-eyebrow">ONE BRAND OR MANY. ONE INBOX.</span><h3 id="project-split-title">Give each project the right crew.</h3><p class="project-team-intro">Separate your landing page, app, demo and store. Choose who helps on each one.</p><div class="project-team-grid">${projectTeamCards()}</div><div class="project-team-note"><strong>Your choice of team, for each project.</strong><ul><li>Assign different teammates, or the same people across projects.</li><li>Each project keeps its own widget, AI sources and settings.</li><li>Every conversation still reaches your shared inbox.</li></ul></div></section>
 <div class="project-inbox-summary"><img src="/assets/orka-logo.svg" width="37" height="34" alt=""><div><strong>Four projects. One shared inbox.</strong><p>Example teams. Your plan sets the number of teammates, not projects.</p></div></div></div>
 <div class="project-dialog-bottom"><p><strong>Unlimited projects. Every plan.</strong><span>No per-project fee.</span></p><button type="button" data-close-project>Got it</button></div>
 </dialog>`;
}

export function byokSpotlight({calculator='/ai?billing=own-key#ai-pricing'}={}){
 return `<section class="byok-spotlight" id="bring-your-own-key" aria-labelledby="byok-title"><div class="byok-story"><span class="byok-badge">YOUR AI. YOUR CHOICE. · PRO &amp; MAX</span><h2 id="byok-title">Your key. Your AI bill.<br><em>Zero Orka markup.</em></h2><p>Connect your own <strong>OpenAI, Anthropic or OpenRouter API key</strong>. Orky helps with your support, your provider bills the AI usage directly, and Orka adds <strong>no margin</strong>.</p><div class="byok-providers"><span><img src="/assets/chatgpt-mark.svg" width="24" height="24" alt="">OpenAI</span><span><img src="/assets/claude-mark.svg" width="26" height="26" alt="">Anthropic</span><span><span class="openrouter-monogram" aria-hidden="true">↗</span>OpenRouter</span><span class="byok-all-plans">Available on Pro &amp; Max</span></div><a class="byok-link" href="${calculator}" data-byok-estimate>Estimate with my own key <span aria-hidden="true">↗</span></a></div><div class="byok-receipt"><span class="project-eyebrow">WITH YOUR OWN API KEY</span><div class="byok-receipt-row"><span>AI usage</span><strong>Paid to your provider</strong></div><div class="byok-receipt-total"><span>Orka’s AI markup</span><strong>$0<span>Always zero with your key.</span></strong></div><p>Your Orka team plan stays separate.<br>Provider API usage is still paid.</p><div class="byok-managed"><strong>No key? Let Orka handle it.</strong><p>Select Orka-managed AI on Pro or Max. No API account or key to connect: Orka handles it, and you pay for usage at the displayed model rates (standard API rates ×2).</p><a href="/ai#ai-pricing">See models, rates &amp; conversation estimates ↗</a></div></div><p class="byok-fineprint">AI features are available on Pro and Max. Your subscription and AI usage are separate. An API key is not included in a ChatGPT or Claude subscription. With OpenRouter, your bill depends on the selected model and provider rates and terms. Orka adds no markup when you use your own key.</p></section>`;
}
