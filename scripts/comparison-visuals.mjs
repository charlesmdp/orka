import {detailPreview, widgetPreview} from './dashboard-previews.mjs';
import {vendorMark} from './vendor-marks.mjs';

// Product examples use the same components as the feature catalogue, not a
// fabricated competitor screenshot. Keep the product and example-data label.
export function workflowVisual(kind='portfolio') {
 const copy={
  portfolio:['INSIDE ORKA','Every project. <br>The same place to answer.','See which product a question belongs to, keep your team together and add the next project without another subscription.','/features','Explore the shared inbox'],
  handoff:['INSIDE ORKA','The next person <br>gets the whole story.','Leave a private note, mention a teammate and keep the conversation in one place. Your customer can carry on where they left off.','/features','See how the team works together'],
  knowledge:['INSIDE ORKA','An answer. <br>Before another message.','Your published articles are searchable inside the chat widget. The same knowledge can help Orky answer when you enable AI.','/help-center','Explore the help center']
 }[kind];
 const preview=kind==='knowledge'?widgetPreview({help:true}):detailPreview(kind==='handoff'?'notes':'inbox');
 return `<section class="ed-wrap c-product-evidence c-evidence-${kind}"><div class="c-evidence-copy"><span class="ed-kicker">${copy[0]}</span><h2>${copy[1]}</h2><p>${copy[2]}</p><a href="${copy[3]}">${copy[4]} ↗</a></div><!-- FEATURE_PREVIEW_START --><figure><div class="c-evidence-label">${vendorMark({id:'orka',name:'Orka'},24)}<strong>Orka</strong><span>Product preview · example data</span></div>${preview}<figcaption>${kind==='knowledge'?'The visitor’s Help tab':kind==='handoff'?'Private notes in the shared conversation':'The team’s inbox, filtered by project when needed'}</figcaption></figure><!-- FEATURE_PREVIEW_END --></section>`;
}

export function brandBoard(vendor,alternatives) {
 return `<div class="c-brand-board" aria-label="${vendor.name} and the alternatives in this guide"><div class="c-board-primary">${vendorMark(vendor,72)}<strong>${vendor.name}</strong></div><span class="c-board-caption">A different fit for your team</span><div class="c-board-options">${alternatives.map(c=>`<div>${vendorMark(c,38)}<span>${c.name}</span></div>`).join('')}</div></div>`;
}
