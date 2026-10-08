// Small, self-contained product illustrations: no video player or animation library.
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = '<img src="/assets/orky-app-icon.svg" width="24" height="24" alt="">';
const avatar = (name='Emma', n=1) => `<span class="fv-avatar fv-avatar-${n}">${e(name.slice(0,1))}</span>`;
const chip = (text, kind='') => `<span class="fv-chip ${kind}">${e(text)}</span>`;
const row = (left,right,kind='') => `<div class="fv-row ${kind}"><span>${left}</span><strong>${right}</strong></div>`;
const bubble = (text,kind='') => `<div class="fv-bubble ${kind}">${e(text)}</div>`;
const lines = '<span class="fv-line"></span><span class="fv-line short"></span>';
const orky = text => `<div class="fv-agent">${icon}<span>Orky<strong>${e(text)}</strong></span></div>`;
const window = (title,body,kind='') => `<div class="fv-window ${kind}"><div class="fv-bar"><span class="fv-dots"><i></i><i></i><i></i></span><span>${e(title)}</span><span class="fv-live"></span></div><div class="fv-content">${body}</div></div>`;
const people = names => `<div class="fv-people">${names.map((n,i)=>avatar(n,i+1)).join('')}<span>${e(names.join(' · '))}</span></div>`;
const typing = '<span class="fv-typing"><i></i><i></i><i></i></span>';
const chat = (question,answer,kind='') => window('A conversation, in Orka',bubble(question)+bubble(answer,'reply fv-arrive'),kind);
const keyValues = (title,entries) => window(title,entries.map(([k,v])=>row(e(k),e(v),'fv-data')).join(''));
const list = (title,entries) => window(title,entries.map((v,i)=>row(e(v),i===0?chip('Open'):e('↗'),i===0?'fv-highlight':'')).join(''));
const handoff = (title,first,second) => window(title,orky(first)+`<div class="fv-transfer"><span></span><b>↓</b><span></span></div><div class="fv-agent fv-arrive">${avatar('Emma')}<span>Emma<strong>${e(second)}</strong></span></div>`,'fv-ai');
const banner = (kind,title,copy) => window('Your website',`<div class="fv-site-lines">${lines}</div><div class="fv-banner ${kind}"><span>${kind==='night'?'☾':kind==='alert'?'!':'☀'}</span><div><strong>${e(title)}</strong><small>${e(copy)}</small></div></div>`);
const article = (title,copy,footer='') => window('Your help center',`<div class="fv-article"><span class="fv-eyebrow">GETTING STARTED</span><strong>${e(title)}</strong><span>${e(copy)}</span>${lines}${footer}</div>`);
const bars = (title,labels,values) => window(title,`<div class="fv-chart">${values.map((v,i)=>`<div><span style="--bar:${v}%" class="fv-bar-grow"></span><small>${e(labels[i])}</small></div>`).join('')}</div>`);
const switcher = (title,label,on=true) => window(title,row(e(label),`<span class="fv-switch ${on?'on':''}"><i></i></span>`)+row('This conversation',chip(on?'AI enabled':'Human replies'))+`<div class="fv-site-lines">${lines}</div>`);
const sources = (title,names,last='Ready for Orky') => window(title,`<div class="fv-source-grid">${names.map((n,i)=>`<span><b>${['▤','↗','⊞','≡'][i]}</b>${e(n)}</span>`).join('')}</div><div class="fv-source-result fv-arrive">${icon}<span>${e(last)}</span><b>✓</b></div>`,'fv-ai');
const settings = (title,label,value) => window(title,`<span class="fv-eyebrow">${e(label)}</span><div class="fv-input">${e(value)}<b>✓</b></div><div class="fv-site-lines">${lines}</div>`);
const widget = (title,body,kind='') => window(title,`<div class="fv-mini-site"><div>${lines}<span class="fv-site-button"></span></div><div class="fv-mini-widget ${kind}"><span class="fv-widget-top">${avatar('Emma')} Here to help</span>${body}</div></div>`);

const previews = {
  'live-chat':()=>chat('Does this come in green?','Yes! Forest green is in stock.'),
  'live-typing':()=>window('A little head start',`<span class="fv-eyebrow">VISITOR IS TYPING</span><div class="fv-compose"><span class="fv-type-text">Can I change my delivery address?</span><i class="fv-caret"></i></div>${row(typing,'Before they press send')}`),
  'history-search':()=>window('Find the conversation',`<div class="fv-input">⌕ <span>delivery address</span></div><div class="fv-search-result fv-arrive">${avatar('Alex',2)}<div><strong>Alex · Your store</strong><span>Can I change my <mark>delivery address</mark>?</span></div></div>`),
  'saved-replies':()=>window('Your reply composer',`<div class="fv-input fv-mono">/shipping</div><div class="fv-shortcut fv-arrive"><span class="fv-eyebrow">SAVED REPLY</span><strong>Orders ship in 2–3 working days.</strong><span>You’ll get a tracking link by email.</span></div>`),
  'attachments':()=>window('Everything in the conversation',bubble('Here’s the setup guide.')+`<div class="fv-file fv-arrive"><span>PDF</span><div><strong>Getting started.pdf</strong><small>Ready to download</small></div><b>↓</b></div>`),
  'emoji':()=>window('A little personality',bubble('Thank you, that worked!')+`<div class="fv-emoji">👋 <span>💚</span> 🐋 ✨ 🙌</div>`),
  'read-receipts':()=>window('No more guessing',bubble('All set. Your booking is updated.','reply')+`<div class="fv-receipt fv-arrive"><b>✓✓</b> Read by Alex</div>`),
  'email-follow-up':()=>window('The conversation continues',`<div class="fv-channel"><span>Live chat</span><b>→</b><span>Email</span></div><div class="fv-email fv-arrive"><span>To: alex@example.com</span><strong>Re: Your question</strong><span>We found the answer for you…</span></div>`),
  'shared-inbox':()=>window('One inbox. Every product.',`<div class="fv-projects"><span>Your SaaS</span><span>Your store</span><span>Your app</span></div><div class="fv-converge"><i></i><i></i><i></i></div><div class="fv-inbox fv-arrive"><img src="/assets/orka-logo.svg" width="26" height="24" alt=""><strong>All conversations</strong>${chip('3 new')}</div>`),
  'assignment':()=>window('Give it an owner',bubble('I need a hand with the integration.')+`<div class="fv-assigned fv-arrive">${avatar('Theo',2)}<span>Assigned to <strong>Theo</strong></span><b>✓</b></div>`),
  'private-notes':()=>window('Just between your team',`<div class="fv-note"><span>⌑ PRIVATE NOTE</span><strong>@Theo</strong> Can you check the integration?<small>Only your teammates can see this.</small></div>`),
  'tags':()=>window('A little order in the inbox',bubble('Can you help me set this up?')+`<div class="fv-tags">${chip('Onboarding')}${chip('Shopify')}${chip('Technical')}</div>`),
  'filters':()=>window('Focus on your product',`<div class="fv-tags">${chip('Your app ▾')}${chip('Unresolved ▾')}</div>${row(avatar('Alex',2)+' Integration question',chip('2 new'),'fv-highlight')}${row(avatar('Jules',3)+' Help with my plan','↗')}`),
  'resolved':()=>window('A happy ending',bubble('That fixed it. Thank you!')+`<div class="fv-resolved fv-arrive"><span>✓</span><strong>Conversation resolved</strong></div>`),
  'reminders':()=>window('Come back at the right time',bubble('I’ll have the details tomorrow.')+`<div class="fv-reminder fv-arrive"><span>◷</span><div><strong>Remind me tomorrow</strong><small>9:00 AM · Back in your inbox</small></div></div>`),
  'urgency':()=>window('See what needs you first',row('🐟 A quick question',chip('Low'))+row('🦈 Checkout is down',chip('Critical','warm'),'fv-highlight')+row('🐡 Setup help',chip('Normal'))),
  'team-size':()=>window('Your crew, together',people(['Emma','Theo','Jules'])+`<div class="fv-team-plans"><span>Free <b>1</b></span><span>Light <b>2</b></span><span>Pro <b>3</b></span><span>Max <b>12</b></span></div>`),
  'extra-members':()=>window('Room to grow on Max',`<div class="fv-seats"><strong>12</strong><span>included teammates</span><b>+</b>${avatar('New',3)}</div><div class="fv-footnote">€8 / extra member / month</div>`),
  'project-permissions':()=>window('The right team, for each project',row('Landing page',`${avatar('Emma')} Marketing`)+row('Your app',`${avatar('Theo',2)} Technical`)+`<div class="fv-permission"><span>Conversations ✓</span><span>Settings —</span></div>`),
  'knowledge':()=>sources('Your knowledge, connected',['Help center','Website','Files','Instructions']),
  'automatic-replies':()=>window('Orky is covering for you',bubble('Where can I find my invoice?')+orky('Go to Settings → Billing → Invoices.'),'fv-ai'),
  'ai-drafts':()=>window('A draft. You have the final say.',`<div class="fv-draft">${orky('Your order ships within 2–3 working days.')}<span>Review and make it your own.</span></div><div class="fv-actions"><span>Edit draft</span><strong>Send reply ↗</strong></div>`,'fv-ai'),
  'human-takeover':()=>handoff('A human, when it matters','“Can I speak to someone?”','I’m here. Let’s take a look.'),
  'ai-per-chat':()=>switcher('You choose where AI helps','Auto-reply'),
  'translation':()=>window('Two languages. One conversation.',`<div class="fv-translation"><span>🇫🇷 ORIGINAL</span><strong>Où est ma commande ?</strong></div><div class="fv-translation translated fv-arrive"><span>🇬🇧 TRANSLATION</span><strong>Where is my order?</strong></div>`),
  'ai-shortcuts':()=>window('A helpful starting point',`<div class="fv-tags">${chip('Say hello')}${chip('Draft an answer')}${chip('Say goodbye')}</div>${bubble('Hi Alex! How can I help today?','reply fv-arrive')}`,'fv-ai'),
  'summaries':()=>window('Catch up in a moment',`<div class="fv-summary">${icon}<div><strong>Conversation summary</strong><span>• Customer needs setup help</span><span>• Connected their store</span><span>• Next: check the integration</span></div></div>`,'fv-ai'),
  'ai-providers':()=>window('Your AI, your choice',`<div class="fv-provider-main">${icon}<strong>Let Orka handle it</strong><span>No key needed</span></div><div class="fv-provider-list"><span>OpenAI</span><span>Anthropic</span><span>OpenRouter</span></div>`,'fv-ai'),
  'own-key':()=>window('Bring your own key',`<div class="fv-input">Provider <strong>OpenRouter ▾</strong></div><div class="fv-input fv-mono">•••• •••• •••• <b>✓</b></div><div class="fv-footnote">Your provider’s bill. <strong>0% Orka markup.</strong></div>`,'fv-ai'),
  'usage-pricing':()=>window('Orka-managed AI',orky('Ready when you need a hand.')+`<div class="fv-meter"><i></i></div><div class="fv-footnote">AI usage billed separately · Pro & Max</div>`,'fv-ai'),
  'custom-orky':()=>window('Meet your AI teammate',`<div class="fv-custom-ai">${icon}<b>→</b><span class="fv-avatar fv-avatar-3">C</span><div><strong>Coast Concierge</strong><small>Your name. Your image.</small></div></div>`,'fv-ai'),
  'handoff-triggers':()=>window('Your words are the signal',`<div class="fv-tags">${chip('cancel my account','warm')}${chip('speak to a person','warm')}</div><div class="fv-trigger fv-arrive"><span>Keyword detected</span><b>→</b><strong>Bring in your team</strong></div>`,'fv-ai'),
  'ai-confidence':()=>window('Know when to ask a human',`<span class="fv-eyebrow">CONFIDENCE THRESHOLD</span><div class="fv-threshold"><i></i><b></b></div><div class="fv-confidence fv-arrive"><span>Below your threshold</span>${chip('Human review','warm')}</div>`,'fv-ai'),
  'handoff-assignment':()=>window('Send the right people a heads-up',`<div class="fv-options"><span>Whole team</span><strong>✓ Online teammates</strong><span>Selected people</span></div>${row(avatar('Emma')+' New handoff',chip('Assigned'),'fv-arrive')}`,'fv-ai'),
  'seamless-handoff':()=>handoff('No need to start from scratch','History and context stay here.','I’ve read the conversation.'),
  'live-map':()=>`<div class="fv-map"><svg viewBox="0 0 360 170" fill="none"><path d="M39 44 65 23 113 25 132 42 115 54 104 74 87 79 75 68 57 69ZM103 88 124 91 139 109 126 147 113 156 107 129 94 105ZM163 37 184 27 202 35 222 23 267 27 307 49 314 66 285 71 267 58 252 79 231 64 218 80 199 69 186 57 170 60ZM177 74 203 70 220 91 206 118 188 133 178 108 166 87ZM275 119 296 109 321 125 317 140 287 146 273 134" fill="#c5d9cd"/><path d="M0 57H360M0 113H360M90 0V170M180 0V170M270 0V170" stroke="#d7e4df" stroke-width=".6"/></svg><i class="fv-pin pin-a"></i><i class="fv-pin pin-b"></i><i class="fv-pin pin-c"></i><span class="fv-map-label">● Visitors, across your projects</span></div>`,
  'visitor-list':()=>list('Online right now',['Alex · Your store','Jules · Your app','Sam · Your website']),
  'visitor-profile':()=>window('The person behind the message',`<div class="fv-profile">${avatar('Alex',2)}<div><strong>Alex Rivera</strong><span>alex@example.com</span></div>${chip('Online')}</div><div class="fv-profile-data"><span>🇬🇧 London</span><span>English</span><span>Chrome · macOS</span></div>`),
  'browsing-context':()=>window('Their journey, right here',`<div class="fv-journey"><span>/collections</span><b>↓</b><span>/products/forest-cap</span><b>↓</b><strong>● Asking you a question</strong></div>`),
  'custom-data':()=>keyValues('Visitor data',[['App plan','Pro'],['Shopify plan','Basic'],['Installed','12 Sep'],['Admin link','Open account ↗']]),
  'visitor-cart':()=>window('In Alex’s cart',`<div class="fv-cart"><img src="/assets/orca-cap.webp" width="80" height="72" loading="lazy" alt=""><div><strong>Forest cap</strong><span>Quantity: 1</span><b>€48.00</b></div></div>`),
  'analytics':()=>bars('Conversations this week',['M','T','W','T','F','S','S'],[45,64,52,88,74,35,24]),
  'satisfaction':()=>window('How did we do?',`<div class="fv-rating"><span>😕</span><span>😐</span><strong>😊</strong></div><div class="fv-feedback fv-arrive">“Really helpful. Thank you!”</div>`),
  'team-reports':()=>bars('Response times · by teammate',['Emma','Theo','Jules'],[58,38,72]),
  'help-center':()=>article('How can we help?','Find the answer before you start a chat.',`<div class="fv-help-search">⌕ Search for an answer</div>`),
  'multilingual-help':()=>window('Make everyone feel at home',`<div class="fv-language-grid"><span>🇬🇧 Hello</span><span>🇫🇷 Bonjour</span><span>🇪🇸 Hola</span><span>🇩🇪 Hallo</span></div><div class="fv-footnote">One help center. Their language.</div>`),
  'help-domain':()=>settings('Your home for helpful answers','YOUR DOMAIN','help.yourbrand.com'),
  'help-import':()=>sources('Bring your existing articles',['Crisp','GitBook','Intercom','Gleap'],'Knowledge, together'),
  'help-markdown':()=>window('Write it. Preview it.',`<div class="fv-editor"><div><span># Getting started</span><span>**Connect your store**</span><span>- Add the widget</span></div><div><strong>Getting started</strong><b>Connect your store</b><span>• Add the widget</span></div></div>`),
  'help-collections':()=>list('A little structure helps',['▤ Getting started','▤ Your account','▤ Billing & plans']),
  'help-auto-translation':()=>window('One article. More languages.',`<div class="fv-language-source">🇬🇧 Getting started</div><div class="fv-translation-routes"><span>🇫🇷 Bien démarrer <b>✓</b></span><span>🇪🇸 Primeros pasos <b>✓</b></span></div>`),
  'help-translation-review':()=>window('Keep translations in step',row('English · source',chip('Updated'))+row('French',chip('Review needed','warm'))+row('Spanish',chip('Up to date'))),
  'help-widget':()=>widget('Help, inside your widget',`<span class="fv-help-search">⌕ Search help</span><span class="fv-widget-article">Getting started ↗</span><span class="fv-widget-article">Change your plan ↗</span>`),
  'help-ai':()=>sources('Good answers start here',['Published articles','Your help center'],'Ready for a helpful answer'),
  'help-publishing':()=>window('Publish when you’re ready',row('Getting started',chip('Published'))+row('Your new feature',chip('Draft','warm'))+`<div class="fv-actions"><span>Preview</span><strong>Publish article ↗</strong></div>`),
  'help-insights':()=>window('Learn what helps',`<div class="fv-insights"><div><span>Article views</span><strong>128</strong></div><div><span>Helpful reactions</span><strong>😊 24</strong></div></div><div class="fv-meter"><i></i></div>`),
  'help-seo':()=>keyValues('Ready to be found',[['URL','/getting-started'],['Title','Getting started | Your brand'],['Description','Everything you need to begin.']]),
  'help-branding':()=>article('Welcome to Coast & Co.','Answers from the people behind your brand.',`<div class="fv-palette"><i></i><i></i><i></i><i></i></div>`),
  'online-away':()=>window('Set the right expectation',`<div class="fv-status-pair"><div><i></i><strong>Available</strong><span>Come say hello</span></div><div class="away"><i></i><strong>Away</strong><span>Back a little later</span></div></div>`),
  'reply-time':()=>widget('Before they say hello',`<strong>Chat with us</strong><span class="fv-reply-estimate">◷ Usually replies in a few minutes</span>`),
  'night-banner':()=>banner('night','The humans are asleep','Leave a message. We’ll be back.'),
  'break-banner':()=>banner('day','Taking a little break','Back tomorrow. Thanks for your patience.'),
  'panic-banner':()=>banner('alert','A little heads-up','Replies may take longer today.'),
  'offline-form':()=>window('Away, but still reachable',`<div class="fv-offline"><strong>Leave us a message</strong><span class="fv-input">Your email</span><span class="fv-input">How can we help?</span><span class="fv-form-send">Send message ↗</span></div>`),
  'business-hours':()=>window('Room for life outside work',`<div class="fv-hours"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span class="off">SAT</span><span class="off">SUN</span></div>${row('Monday – Friday','09:00 – 18:00')}${row('Weekend',chip('Away','warm'))}`),
  'announcement-banner':()=>banner('day','Something new is here','Your next update, right in the widget.'),
  'widget-brand':()=>widget('Make it feel like you',`<strong>Hello from Coast & Co.</strong><div class="fv-palette"><i></i><i></i><i></i></div><span class="fv-form-send">Start a conversation ↗</span>`),
  'widget-layouts':()=>window('Dozens of ways to say hello',`<div class="fv-layouts"><div>${avatar('Emma')}${lines}<b>Let’s chat ↗</b></div><div><strong>Hi there 👋</strong>${lines}<b>Ask us anything</b></div><div>${icon}<strong>Here to help</strong><b>Send a message</b></div></div>`),
  'seasonal-themes':()=>window('The same crew. A seasonal hello.',`<div class="fv-seasons"><div><span>🎄</span><strong>A little festive</strong>${bubble('Happy holidays!')}</div><div><span>🎃</span><strong>A little spooky</strong>${bubble('Boo! Need a hand?')}</div></div>`),
  'remove-branding':()=>widget('Your name, all the way',`<strong>Coast & Co. support</strong><span>Welcome. How can we help?</span><span class="fv-own-brand">COAST & CO.</span>`),
  'installation':()=>window('At home on your website',`<div class="fv-platforms"><span>Shopify</span><span>WordPress</span><span>Webflow</span><span>Your SaaS</span></div><div class="fv-install-result fv-arrive"><img src="/assets/orka-logo.svg" width="26" height="24" alt=""><strong>One widget. Your kind of website.</strong></div>`),
  'simple-setup':()=>window('From hello to helpful',`<div class="fv-steps"><span><b>1</b>Create a project</span><span><b>2</b>Copy your snippet</span><span><b>3</b>Add it to your site</span></div>`),
  'sdk':()=>window('The context your team needs',`<div class="fv-code"><span class="fv-code-comment">// Example visitor attributes</span><span>{ <b>plan</b>: <em>"pro"</em>,</span><span>  <b>shopify_plan</b>: <em>"basic"</em>,</span><span>  <b>installed_at</b>: <em>"2026-09-12"</em> }</span></div><div class="fv-footnote">Your data → the visitor profile</div>`),
  'mobile':()=>`<div class="fv-phone"><div class="fv-phone-screen"><span class="fv-phone-clock">9:41</span><div class="fv-notification fv-arrive"><img src="/assets/orka-logo.svg" width="24" height="23" alt=""><div><strong>Orka · New message</strong><span>Alex · Your store</span><b>Does this come in green?</b></div></div><div class="fv-phone-home"></div></div><span class="fv-phone-caption">Your inbox.<br><strong>In your pocket.</strong><small>iOS & Android</small></span></div>`,
  'lightweight':()=>window('A little widget. Its own space.',`<div class="fv-isolated"><span>Your website</span><div>${lines}<div><strong>Orka</strong><small>iframe</small></div></div></div><div class="fv-footnote">Loads asynchronously · Isolated styles</div>`),
  'blocking':()=>keyValues('Your chat. Your boundaries.',[['IP address','192.0.2.42'],['Access','Blocked'],['Country rules','You choose']]),
  'api-limits':()=>window('More room for your integrations',`<div class="fv-api-flow"><span>Your app</span><b>→</b><span>Orka API</span></div><div class="fv-meter"><i></i></div><div class="fv-footnote">Higher rate limits with Max</div>`)
};

export const illustratedFeatureIds = Object.keys(previews);
export function featureVisual(id, category) {
  if (!previews[id]) return '';
  return `<!-- FEATURE_PREVIEW_START --><div class="feature-visual fv-${category}" data-feature-visual data-nosnippet aria-hidden="true">${previews[id]()}</div><!-- FEATURE_PREVIEW_END -->`;
}
