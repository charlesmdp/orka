import {uiIcon, person} from './dashboard-previews.mjs';

// Focused close-ups of the actual dashboard. The people, activity and cart are examples.
const frame=(kind,label,body)=>`<div class="product-feature-preview pfp-${kind}" role="group" aria-label="${label}. Preview with example data."><div class="pfp-stage">${body}</div></div>`;
const heading=(title,icon='users',extra='')=>`<header class="pfp-heading"><span class="pfp-heading-icon">${uiIcon(icon)}</span><strong>${title}</strong>${extra}</header>`;
const badge=(text,kind='')=>`<span class="pfp-badge ${kind}">${text}</span>`;
const teammate=(name,n,role='Agent')=>`<div class="pfp-teammate">${person(n)}<span><strong>${name}</strong><small>${role}</small></span><span class="pfp-available">● Available</span></div>`;
const grip='<svg class="dp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';

export function crewPreview(){
 return frame('crew','Team members and plan sizes',`<div class="pfp-panel">${heading('Team members','users',badge('Pro · 3 members'))}<div class="pfp-team-list">${teammate('Judy R',2,'Owner')}${teammate('Theo',3)}${teammate('Mateo',1)}</div><div class="pfp-plan-sizes">${[['Free','1'],['Light','2'],['Pro','3'],['Max','12']].map(([name,count])=>`<span class="${name==='Pro'?'selected':''}"><small>${name}</small><strong>${count} <small>${count==='1'?'member':'members'}</small></strong></span>`).join('')}</div></div><div class="pfp-footnote">${uiIcon('globe')} Unlimited projects, on every plan.</div>`);
}
export function extraMembersPreview(){
 return frame('members','Add a team member on Max',`<div class="pfp-panel">${heading('Team members','users',badge('Max'))}<div class="pfp-seat-summary"><span>${person(2)}${person(3)}${person(1)}<b>+9</b></span><div><strong>12 members included</strong><small>Ready for one more?</small></div></div><div class="pfp-invite"><strong>${uiIcon('users')} Invite a team member</strong><label>Email address<span class="pfp-input">sofia@example.com</span></label><div class="pfp-invite-role"><span>Role</span><strong>Agent ${uiIcon('down')}</strong></div><div class="pfp-invite-bottom"><span><b>+€8</b> / month<small>Per additional member on Max</small></span><span class="pfp-solid-button">${uiIcon('mail')} Send invitation</span></div></div></div>`);
}
export function activityPreview(){
 const pages=[['Forest cap','coast.example/products/forest-cap','Now'],['All caps','coast.example/collections/caps','4 minutes ago'],['Coast & Co.','coast.example','7 minutes ago']];
 return frame('activity','Last viewed page and recent activity',`<div class="pfp-panel">${heading('Last Viewed Page','eye',uiIcon('down'))}<ol class="pfp-timeline">${pages.map(([name,url,time],i)=>`<li class="${i===0?'current':''}"><span class="pfp-timeline-dot"></span><div><strong>${name}</strong>${i===0?badge('Current page'):''}<code>${url}</code><small>${uiIcon('clock')} ${time}</small></div></li>`).join('')}</ol></div>`);
}
export function cartPreview(){
 return frame('cart','Products in the visitor’s cart',`<div class="pfp-panel">${heading('Cart','data',badge('2 items'))}<div class="pfp-cart-product"><img src="/assets/orca-cap.webp" width="96" height="96" loading="lazy" alt="Forest green cap"><div><strong>Forest cap</strong><small>Color: Forest green</small><span>Quantity <b>2</b></span><small>€48.00 each</small></div><strong>€96.00</strong></div><div class="pfp-cart-total"><span>Cart subtotal</span><strong>€96.00</strong></div><div class="pfp-cart-context">${uiIcon('chat')}<span>“Does this come in another color?”</span></div></div><div class="pfp-footnote">${uiIcon('plug')} From your connected store’s cart data.</div>`);
}
const spark=(shape=0)=>`<svg class="pfp-spark" viewBox="0 0 160 52" preserveAspectRatio="none" aria-hidden="true"><path d="${shape===0?'M0 50Q15 4 30 10T60 25T90 18T125 12T160 37V52H0Z':shape===1?'M0 48Q18 3 35 18T65 29T95 22T125 10T160 40V52H0Z':'M0 48Q15 4 32 19T70 40T112 27T142 9L160 36V52H0Z'}" fill="#dceacf"/><path d="${shape===0?'M0 50Q15 4 30 10T60 25T90 18T125 12T160 37':shape===1?'M0 48Q18 3 35 18T65 29T95 22T125 10T160 40':'M0 48Q15 4 32 19T70 40T112 27T142 9L160 36'}" fill="none" stroke="#6a934f" stroke-width="2"/></svg>`;
export function analyticsPreview(){
 return frame('analytics','Conversation analytics',`<div class="pfp-analytics-filter"><span>Project ${uiIcon('down')}</span><span>Agent ${uiIcon('down')}</span><strong>Last 7 days</strong></div><div class="pfp-metrics">${[['Chats','209','chat'],['Messages','4,236','chat'],['Avg 1st response','1m','clock']].map(([label,value,icon],i)=>`<div><span>${uiIcon(icon)} ${label}</span><strong>${value}</strong><small>vs. previous 7 days</small>${spark(i)}</div>`).join('')}</div><div class="pfp-analytics-summary"><span class="pfp-heading-icon">${uiIcon('circleCheck')}</span><div><small>Solved chats</small><strong>4 <span>(2%)</span></strong></div><span class="pfp-trend">↗ 300%<small>vs. previous 7 days</small></span></div>`);
}
export function teamReportsPreview(){
 const rows=[['Judy R',2,'98','762','1'],['Mateo',1,'101','761','0'],['Theo',3,'100','758','3']];
 return frame('reports','Team member performance report',`<div class="pfp-panel">${heading('Team members statistics','users',badge('Last 7 days'))}<div class="pfp-report-table"><div class="pfp-report-labels"><span>Teammate</span><span>Chats</span><span>Messages</span><span>Solved</span></div>${rows.map(([name,n,chats,messages,solved],i)=>`<div class="pfp-report-row"><span><b>${i+1}</b>${person(n)}<strong>${name}<small>Agent</small></strong></span><strong>${chats}</strong><strong>${messages}</strong><strong>${solved}</strong></div>`).join('')}</div></div><div class="pfp-response-hours"><div><strong>${uiIcon('clock')} Average first answer time</strong><small>By day and hour</small></div><div class="pfp-heatmap" aria-label="Illustrative response time heatmap">${[1,2,0,3,1,0,2,2,1,3,2,0,1,3,0,2,1,3,2,1,0].map(level=>`<i class="level-${level}"></i>`).join('')}</div><small><i></i> Under 30 seconds</small></div>`);
}
export function multilingualHelpPreview(){
 return frame('languages','English source and French help center',`<div class="pfp-language-bar"><span>🇬🇧 English <small>Source</small></span><b>→</b><span>🇫🇷 Français ${badge('Translated')}</span></div><div class="pfp-help-window" lang="fr"><div class="pfp-help-nav"><span>${uiIcon('chat')} Messages</span><strong>${uiIcon('book')} Aide</strong></div><div class="pfp-help-body"><strong>Coast & Co.</strong><p>Tout ce dont vous avez besoin,<br>au même endroit.</p><div class="pfp-help-search">${uiIcon('search')} Rechercher un article…</div><small>COLLECTIONS</small><div class="pfp-help-collection"><span>🚀</span><strong>Guide de démarrage</strong><small>4</small>${uiIcon('down')}</div><div class="pfp-help-collection"><span>📦</span><strong>Commandes et livraison</strong><small>8</small>${uiIcon('down')}</div></div></div>`);
}
export function collectionsPreview(){
 const entries=[['🚀','Beginner’s Guide','4',false],['⚡','How To…','30',false],['⏰','Availability','13',true],['🔔','Notifications','8',true],['👥','Team Members','7',true]];
 return frame('collections','Help center collections and sections',`<div class="pfp-panel">${heading('Collections','book',`<span class="pfp-small-action">${uiIcon('plus')} New collection</span>`)}<div class="pfp-collection-labels"><span>Name</span><span>Articles</span><span>Translations</span></div><div class="pfp-collection-list">${entries.map(([icon,name,count,child])=>`<div class="pfp-collection-row ${child?'child':''}"><span>${grip}${child?'<b class="pfp-branch">↳</b>':''}<span>${icon}</span><strong>${name}</strong></span><small>${count} published</small><b class="pfp-translated">${uiIcon('check')}</b></div>`).join('')}</div><div class="pfp-collection-footer">${grip} Drag collections and sections to reorder.</div></div>`);
}
export const productFeaturePreviews={
 'team-size':crewPreview,'extra-members':extraMembersPreview,'browsing-context':activityPreview,
 'visitor-cart':cartPreview,'analytics':analyticsPreview,'team-reports':teamReportsPreview,
 'multilingual-help':multilingualHelpPreview,'help-collections':collectionsPreview
};

export function enrichProductFeaturePreviews(html){
 if(html.includes('help-hero')&&!html.includes('pfp-help-management')){
  const previews=`<!-- FEATURE_PREVIEW_START --><div class="pfp-help-management"><figure><figcaption>Collections, with room for sections.</figcaption>${collectionsPreview()}</figure><figure><figcaption>One source. A welcome in their language.</figcaption>${multilingualHelpPreview()}</figure></div><!-- FEATURE_PREVIEW_END -->`;
  html=html.replace('<div class="help-feature-grid">',`${previews}<div class="help-feature-grid">`);
 }
 return html;
}
