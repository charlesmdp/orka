// Advance this date only after a substantive editorial review. URLs stay evergreen.
export const editorialYear = '2026';
export const editorialUpdated = '2026-10-19';
export const editorialDate = '19 October 2026';
export const pricingReferenceDate = '18 October 2026';

export function comparisonMetadata(item, kind) {
 const name=item.name;
 if(kind==='alternatives')return {
  title:`Best ${name} Alternatives in ${editorialYear}: Pricing & Fit`,
  description:`Compare five ${name} alternatives for your budget, team and websites. See project fees, free options, AI costs and which tool fits each support workflow.`
 };
 if(kind==='review')return {
  title:`${name} Review (${editorialYear}): Pricing & ${item.id==='commslayer'?'Shopify Fit':'Trade-offs'}`,
  description:item.id==='commslayer'?'Commslayer Free, Plus and Scale explained: conversation allowances, AI overages and multiple Shopify stores. A sourced review by Orka, with alternatives.':`Is ${name} right for your support team? Examine its documented strengths, subscription costs, project limits and trade-offs before starting a trial.`
 };
 return {title:`Orka vs ${name} (${editorialYear}): Pricing & Projects`,description:`Compare Orka and ${name} for one or several websites. Calculate your team and project costs, compare help centers and AI, and plan your next steps.`};
}

export function migrationPath(id){
 const sources={crisp:'crisp',intercom:'intercom',helpscout:'help-scout',gleap:'gleap',gorgias:'gorgias',tawk:'tawk'};
 return sources[id]?`/migrate-${sources[id]}-help-center-to-orka`:'/help-center-migration';
}

export function nextSteps(item){
 const supported=['crisp','intercom','helpscout','gleap','gorgias','tawk'].includes(item.id);
 return `<section class="ed-wrap resource-next"><span class="ed-kicker">FROM SHORTLIST TO FIRST CONVERSATION</span><h2>Ready to try it with your own product?</h2><div><a href="/live-chat-pricing"><strong>01 / Check the complete budget</strong><span>Compare 1, 3 and 10 projects, with the same team and explicit plan limits.</span></a><a href="${migrationPath(item.id)}"><strong>02 / ${supported?'Bring your '+item.name+' articles':'Check help-center import support'}</strong><span>${supported?'Paste the public help-center link during signup or in Help center. Orka imports the articles automatically.':'See supported sources and what an article import includes before planning your move.'}</span></a><a href="/installation"><strong>03 / Install on one real site</strong><span>Choose your platform, add the widget and send a test conversation before switching the rest.</span></a></div></section>`;
}
