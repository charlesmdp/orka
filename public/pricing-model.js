// USD, standard synchronous API rates checked 18 September 2026.
export const AI_MODELS = {
  'gpt-5-mini': {name:'GPT-5 mini', provider:'OpenAI', input:0.25, output:2, source:'https://developers.openai.com/api/docs/models/gpt-5-mini'},
  'claude-haiku-4-5': {name:'Claude Haiku 4.5', provider:'Anthropic', input:1, output:5, source:'https://platform.claude.com/docs/en/about-claude/pricing'}
};
export const AI_MARKUP = 2;
export function aiCost(model, input, output, ownKey=false) {
  const rates = AI_MODELS[model];
  if (!rates || !Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) return null;
  return (rates.input * input + rates.output * output) / 1e6 * (ownKey ? 1 : AI_MARKUP);
}
export function orkaPlan(seats) {
  if (!Number.isSafeInteger(seats) || seats < 1) return null;
  if (seats === 1) return {name:'Free',price:0,seats:1};
  if (seats === 2) return {name:'Light',price:9,seats:2};
  if (seats === 3) return {name:'Pro',price:29,seats:3};
  return {name:'Max',price:99 + Math.max(0,seats-12)*8,seats:Math.max(12,seats)};
}
export const VENDOR_PLANS = {
  gleap: [{name:'Starter · 1 seat, 1 project',base:35,seats:1,maxProjects:1},{name:'Team · unlimited seats & projects',base:179},{name:'Pro · unlimited seats & projects',base:359}],
  helpscout: [{name:'Free · 100 contacts, 1 Docs site',base:0,seats:5,maxProjects:1},{name:'Standard · 2 inboxes & 2 Docs sites',base:30,perSeat:true,maxSeats:25,inboxes:2,docs:2,maxProjects:5},{name:'Plus · 5 inboxes & 3 Docs sites',base:54,perSeat:true,maxSeats:50,inboxes:5,docs:3,maxProjects:50},{name:'Pro · minimum 10 paid users',base:90,perSeat:true,minSeats:10,inboxes:10,docs:5}],
  freshchat: [{name:'Free · up to 10 agents',base:0,seats:10},{name:'Growth',base:23,perSeat:true},{name:'Pro',base:59,perSeat:true},{name:'Enterprise',base:95,perSeat:true}],
  zendesk: [{name:'Suite Team · 1 brand',base:69,perSeat:true,maxProjects:1},{name:'Suite Professional · up to 5 brands',base:149,perSeat:true,maxProjects:5},{name:'Enterprise · your complete quote',quote:true}],
  chatwoot: [{name:'Cloud Hacker · 2 agents, 500 conversations',base:0,seats:2},{name:'Cloud Startups · published rate',base:19,perSeat:true},{name:'Cloud Business · published rate',base:39,perSeat:true},{name:'Cloud Enterprise · published rate',base:99,perSeat:true}],
  intercom: [{name:'Essential',base:39,perSeat:true},{name:'Advanced',base:99,perSeat:true},{name:'Expert',base:139,perSeat:true}],
  tidio: [{name:'Free · 50 handled conversations',base:0,seats:10},{name:'Starter · 100 handled conversations',base:29,seats:10},{name:'Growth · entry allowance',base:59,seats:10}],
  rocketchat: [{name:'Your license + hosting estimate',quote:true}],
  crisp: [{name:'Free',base:0,seats:2},{name:'Mini',base:45,seats:4},{name:'Essentials · help center included',base:95,seats:10},{name:'Plus',base:295,seats:20,extra:10}],
  chatra: [{name:'Free · 5 chats/month',base:0,seats:1},{name:'Essential',base:31,perSeat:true},{name:'Pro',base:41,perSeat:true}],
  willdesk: [{name:'Free · 20 conversations',base:0},{name:'Basic · 100 conversations',base:16.90},{name:'Pro · 1,000 conversations',base:89.90}],
  chatway: [{name:'Free · 50 conversations',base:0,seats:1},{name:'Business · 200 conversations',base:39,seats:2,extra:19},{name:'Plus · multiple widgets & inboxes',base:199,seats:10,extra:19}],
  gorgias: [{name:'Your actual helpdesk quote',quote:true}],
  tawk: [{name:'Free core product',base:0},{name:'Core + Whitelabel · one property',base:29}],
  bestchat: [{name:'Free · 80 AI chats',base:0,seats:1},{name:'Starter · 300 AI chats',base:10,seats:1},{name:'Basic · 1,000 AI chats',base:30,seats:3},{name:'Growth · 3,000 AI chats',base:60,seats:6}],
  commslayer: [{name:'Free · 300 billable conversations',base:0},{name:'Plus · starting at 800 conversations',base:39},{name:'Scale · starting at 6,000 conversations',base:299}]
};
// Projects mean distinct product setups, with the same answering team on each.
// A shared widget installed on several domains is not several paid workspaces.
export const PROJECT_BILLING = {
  gleap: {mode:'plan',note:'Starter covers one seat and one project. Team and Pro include unlimited seats and projects in one subscription; AI usage and other metered services are additional.',source:'https://www.gleap.ai/pricing'},
  helpscout: {mode:'addons',note:'One account can contain several inboxes and Docs sites. This estimate allocates one inbox, one Docs site and one Beacon to each project: extra inboxes are $12/month and extra Docs sites $24/month on monthly billing. Sharing them lowers that cost. Standard allows five Beacons; Pro has a ten-user minimum.',source:'https://www.helpscout.com/pricing/'},
  freshchat: {mode:'included',note:'Freshworks documents one Freshchat account across several websites, with separate site IDs and multiple widgets. Seats and add-ons drive this estimate, not a subscription multiplied by every domain.',source:'https://crmsupport.freshworks.com/support/solutions/articles/50000004475-how-can-i-get-the-freshchat-messenger-across-all-my-websites-portals-products-'},
  zendesk: {mode:'plan',note:'Suite Team includes one brand; Suite Professional supports up to five brands in one account. Select a plan that covers your brands rather than multiplying the whole subscription by each website. Enterprise pricing needs a complete quote.',source:'https://support.zendesk.com/hc/en-us/articles/4408829476378-Setting-up-multiple-brands'},
  chatwoot: {mode:'included',note:'Several website inboxes can share one Chatwoot account, subject to its fair-use policy based on agents and plan. Cloud pricing is per agent, not per inbox. Published rates are a reference; confirm billing commitment and AI credits for your purchase. Self-hosting has separate infrastructure costs.',source:'https://app.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes'},
  intercom: {mode:'workspace',note:'Separate monthly workspaces are billed separately. Expert also offers multiple brands within one workspace; a shared setup or a negotiated contract can change the total.',source:'https://www.intercom.com/help/en/articles/8991894-how-to-see-and-manage-your-usage'},
  crisp: {mode:'workspace',note:'Each separate workspace has its own subscription. One shared widget on several domains can remain in one workspace. Catalogue totals exclude eligible multi-workspace discounts.',source:'https://help.crisp.chat/en/article/how-to-manage-multiple-workspaces-under-the-same-account-tkdu37/'},
  tidio: {mode:'workspace',note:'Paid subscriptions apply to each independently configured project. Reusing a single widget across domains is a different setup.',source:'https://help.tidio.com/hc/en-us/articles/5444671465756-Manage-multiple-projects'},
  chatra: {mode:'included',note:'Unlimited websites are listed in the plan. The subscription grows with agents, not website count.',source:'https://chatra.com/plans/'},
  commslayer: {mode:'included',note:'Multiple Shopify stores share one plan with no charge for connecting more stores. Conversation and AI usage still determine the bill.',source:'https://docs.commslayer.com/en/articles/1781796056-commslayer-pricing-explained'},
  chatway: {mode:'plan',note:'Separate widgets, inboxes and help centers are included on Plus. Reusing the same widget on several sites is also possible; do not multiply Plus by the number of sites.',source:'https://chatway.app/pricing'},
  willdesk: {mode:'plan',note:'Free includes one store; Basic includes three. Pro lists multiple stores without a numeric cap: confirm your portfolio and usage with WillDesk.',source:'https://apps.shopify.com/self-faq'},
  tawk: {mode:'property',note:'Core chat is free across properties. The optional Whitelabel subscription is charged for each property where you enable it.',source:'https://www.tawk.to/add-ons/'},
  gorgias: {mode:'quote',note:'Multiple stores can share the helpdesk. Enter a quote covering all stores and their total ticket volume, rather than multiplying it by store count.',source:'https://www.gorgias.com/product/multi-stores'},
  rocketchat: {mode:'quote',note:'Use an estimate for the complete deployment, including licensing, hosting and maintenance. A department is not automatically another paid workspace.',source:'https://docs.rocket.chat/our-plans'},
  bestchat: {mode:'confirm',note:'Published packages do not establish a price for several independently configured projects. Ask for the complete multi-site price before comparing.',source:'https://bestchat.com/pricing.html'}
};
export function vendorCost(vendor, planIndex, seats, quote=null, projects=1) {
  const plan=VENDOR_PLANS[vendor]?.[planIndex];
  if (!plan || !Number.isSafeInteger(seats) || seats < 1 || !Number.isSafeInteger(projects) || projects < 1) return null;
  if ((plan.maxSeats && seats>plan.maxSeats) || (plan.maxProjects && projects>plan.maxProjects)) return null;
  if (plan.quote) return Number.isFinite(quote) && quote >= 0 ? quote : null;
  if (projects>1 && (vendor==='bestchat' || (vendor==='chatway' && planIndex<2) || (vendor==='willdesk' && (planIndex!==1 || projects>3)))) return null;
  if (plan.seats && seats > plan.seats && !plan.extra) return null;
  const unit=plan.perSeat ? plan.base*Math.max(seats,plan.minSeats||0) : plan.base+Math.max(0,seats-(plan.seats||seats))*(plan.extra||0);
  const multiplied=PROJECT_BILLING[vendor].mode==='workspace' || vendor==='tawk';
  const projectExtras=vendor==='helpscout' && plan.perSeat ? Math.max(0,projects-plan.inboxes)*12+Math.max(0,projects-plan.docs)*24 : 0;
  return Math.round((unit*(multiplied?projects:1)+projectExtras)*100)/100;
}
export function projectCostSummary(vendor, planIndex, seats, projects, quote=null) {
  const total=vendorCost(vendor,planIndex,seats,quote,projects),billing=PROJECT_BILLING[vendor];
  if(total===null)return 'Choose a plan covering this team and all projects, or confirm the complete price with the vendor.';
  if(billing.mode==='quote'||VENDOR_PLANS[vendor][planIndex].quote)return 'Your complete portfolio estimate · no project multiplier added.';
  const unit=vendorCost(vendor,planIndex,seats,quote,1);
  if(vendor==='helpscout')return `${projects} inbox${projects===1?'':'es'} + ${projects} Docs site${projects===1?'':'s'} · $${unit.toFixed(2)} team base + $${(total-unit).toFixed(2)} project add-ons / month`;
  if(vendor==='zendesk')return `${projects} brand${projects===1?'':'s'} within the selected plan · $${total.toFixed(2)} / month`;
  if(vendor==='gleap')return `${projects} project${projects===1?'':'s'} · one subscription · $${total.toFixed(2)} / month`;
  if(vendor==='chatwoot')return `${projects} website inbox${projects===1?'':'es'} · one account · $${total.toFixed(2)} base at the published rate`;
  if(billing.mode==='workspace'||vendor==='tawk')return `${projects} ${vendor==='tawk'?'properties':vendor==='tidio'?'projects':'workspaces'} × $${unit.toFixed(2)} = $${total.toFixed(2)} / month`;
  return `${projects} ${vendor==='willdesk'||vendor==='commslayer'?'stores':'sites'} · one subscription · $${total.toFixed(2)} base total`;
}

// Planning examples, not measured averages. Ten visitor messages + ten AI replies.
export const CONVERSATION_PROFILES = {
  short: {name:'Short answers', turns:10, userTokens:30, replyTokens:60, contextTokens:500},
  typical: {name:'Everyday support', turns:10, userTokens:60, replyTokens:120, contextTokens:1500},
  detailed: {name:'Detailed support', turns:10, userTokens:120, replyTokens:300, contextTokens:4000}
};
export function conversationTokens(profile='typical',count=1){
 const p=CONVERSATION_PROFILES[profile];
 if(!p || !Number.isInteger(count) || count<0)return null;
 // Each reply sees the new question, preceding exchanges, instructions and knowledge.
 const n=p.turns;
 return {input:count*(n*p.contextTokens+p.userTokens*n*(n+1)/2+p.replyTokens*n*(n-1)/2),output:count*n*p.replyTokens};
}
