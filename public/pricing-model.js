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
  if (!Number.isInteger(seats) || seats < 1 || seats > 20) return null;
  return seats === 1 ? {name:'Solo',price:0,seats:1} : seats <= 3 ? {name:'Pod',price:29,seats:3} : {name:'Fleet',price:99,seats:20};
}
export const VENDOR_PLANS = {
  intercom: [{name:'Essential',base:39,perSeat:true},{name:'Advanced',base:99,perSeat:true},{name:'Expert',base:139,perSeat:true}],
  tidio: [{name:'Free · 50 handled conversations',base:0,seats:10},{name:'Starter · 100 handled conversations',base:29,seats:10},{name:'Growth · entry allowance',base:59,seats:10}],
  rocketchat: [{name:'Your license + hosting estimate',quote:true}],
  crisp: [{name:'Free',base:0,seats:2},{name:'Mini',base:45,seats:4},{name:'Essentials · help center included',base:95,seats:10},{name:'Plus',base:295,seats:20,extra:10}],
  chatra: [{name:'Free · 5 chats/month',base:0,seats:1},{name:'Essential',base:31,perSeat:true},{name:'Pro',base:41,perSeat:true}],
  willdesk: [{name:'Free · 20 conversations',base:0},{name:'Basic · 100 conversations',base:16.90},{name:'Pro · 1,000 conversations',base:89.90}],
  chatway: [{name:'Free',base:0,seats:1},{name:'Solo',base:29,seats:1,extra:19},{name:'Team · help center included',base:79,seats:4,extra:19},{name:'Plus',base:149,seats:10,extra:19}],
  gorgias: [{name:'Your actual helpdesk quote',quote:true}],
  tawk: [{name:'Free core product',base:0},{name:'Core + monthly Remove Branding',base:29}],
  bestchat: [{name:'Free · 80 AI chats',base:0,seats:1},{name:'Starter · 300 AI chats',base:10,seats:1},{name:'Basic · 1,000 AI chats',base:30,seats:3},{name:'Growth · 3,000 AI chats',base:60,seats:6}],
  commslayer: [{name:'Free · 300 billable conversations',base:0},{name:'Plus · starting at 800 conversations',base:39},{name:'Scale · starting at 6,000 conversations',base:299}]
};
export function vendorCost(vendor, planIndex, seats, quote=null) {
  const plan=VENDOR_PLANS[vendor]?.[planIndex];
  if (!plan || !Number.isInteger(seats) || seats < 1) return null;
  if (plan.quote) return Number.isFinite(quote) && quote >= 0 ? quote : null;
  if (plan.perSeat) return plan.base * seats;
  if (plan.seats && seats > plan.seats) return plan.extra ? plan.base + (seats - plan.seats)*plan.extra : null;
  return plan.base;
}
