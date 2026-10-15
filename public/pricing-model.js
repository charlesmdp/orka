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
  if (plan.quote) return Number.isFinite(quote) && quote >= 0 ? quote : null;
  if (projects>1 && (vendor==='bestchat' || (vendor==='chatway' && planIndex<2) || (vendor==='willdesk' && (planIndex!==1 || projects>3)))) return null;
  if (plan.seats && seats > plan.seats && !plan.extra) return null;
  const unit=plan.perSeat ? plan.base*seats : plan.base+Math.max(0,seats-(plan.seats||seats))*(plan.extra||0);
  const multiplied=PROJECT_BILLING[vendor].mode==='workspace' || vendor==='tawk';
  return Math.round(unit*(multiplied?projects:1)*100)/100;
}
export function projectCostSummary(vendor, planIndex, seats, projects, quote=null) {
  const total=vendorCost(vendor,planIndex,seats,quote,projects),billing=PROJECT_BILLING[vendor];
  if(total===null)return 'Choose a plan covering this team and all projects, or confirm the complete price with the vendor.';
  if(billing.mode==='quote')return 'Your complete portfolio estimate · no project multiplier added.';
  const unit=vendorCost(vendor,planIndex,seats,quote,1);
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
