import {AI_MODELS,AI_MARKUP,aiCost,orkaPlan,vendorCost,VENDOR_PLANS} from './pricing-model.js';
import {helpArticles} from './help-demo-data.js';
const money=(n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const number=(n)=>new Intl.NumberFormat('en-US').format(n);
const set=(root,selector,text)=>{const node=root.querySelector(selector);if(node)node.textContent=text;};
export function searchHelp(query,language='en') {
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return helpArticles.filter(a=>words.every(w=>normalize(language==='fr'?a.frTitle+' '+a.frBody:a.title+' '+a.body+' '+a.collection).includes(w)));
}
if(typeof document!=='undefined'){
 for(const tool of document.querySelectorAll('[data-cost-tool]')){
  const seats=tool.querySelector('[data-seats]'),plan=tool.querySelector('[data-vendor-plan]'),quote=tool.querySelector('[data-quote]');
  const update=()=>{
   const count=Number(seats.value),index=Number(plan.value),ours=orkaPlan(count),theirs=vendorCost(tool.dataset.vendor,index,count,quote?.value.trim()?Number(quote.value):null);
   set(tool,'[data-seat-label]',String(count));set(tool,'[data-orka-plan]',ours?.name||'Ask us');set(tool,'[data-orka-price]',ours?money(ours.price):'Ask us');
   set(tool,'[data-vendor-price]',theirs===null?'Quote needed':money(theirs));
   const chosen=VENDOR_PLANS[tool.dataset.vendor][index];
   set(tool,'[data-plan-limit]',theirs===null?(chosen.quote?'Enter a valid amount from your own quote or estimate.':'This plan does not cover the selected team size. Choose another plan or ask the vendor.'):'Selected plan covers this team size. Usage and feature limits still apply.');
   const max=Math.max(ours?.price||0,theirs||0,1);
   tool.querySelector('[data-orka-bar]').style.width=`${(ours?.price||0)/max*100}%`;
   tool.querySelector('[data-vendor-bar]').style.width=`${(theirs||0)/max*100}%`;
  };
  tool.addEventListener('input',update);tool.addEventListener('change',update);update();
 }
 for(const tool of document.querySelectorAll('[data-ai-budget]')){
  const update=()=>{
   const id=tool.querySelector('[data-ai-model]').value,input=Number(tool.querySelector('[data-ai-input]').value),output=Number(tool.querySelector('[data-ai-output]').value),own=tool.querySelector('[data-own-key]').checked,model=AI_MODELS[id],multiplier=own?1:AI_MARKUP;
   set(tool,'[data-input-label]',number(input));set(tool,'[data-output-label]',number(output));set(tool,'[data-ai-total]',money(aiCost(id,input,output,own)));
   set(tool,'[data-ai-billing]',own?'Estimated provider bill · Orka markup $0':'Estimated managed AI usage');
   set(tool,'[data-ai-equation]',`${number(input)} input × ${money(model.input*multiplier)}/M + ${number(output)} output × ${money(model.output*multiplier)}/M`);
  };tool.addEventListener('input',update);tool.addEventListener('change',update);update();
 }
 for(const demo of document.querySelectorAll('[data-help-demo]')){
  let selected=null;
  const lang=demo.querySelector('[data-help-language]'),search=demo.querySelector('[data-help-search]'),list=demo.querySelector('[data-help-results]'),reader=demo.querySelector('[data-help-reader]'),empty=demo.querySelector('[data-help-empty]');
  const showArticle=(article)=>{
   const fr=lang.value==='fr',title=fr?article.frTitle:article.title,body=fr?article.frBody:article.body;
   set(demo,'[data-help-title]',title);set(demo,'[data-help-body]',body);set(demo,'[data-widget-title]',title);set(demo,'[data-widget-body]',body);
   set(demo,'[data-help-back]',fr?'← Tous les articles':'← All articles');set(demo,'[data-reaction-status]','');demo.querySelectorAll('[data-reaction]').forEach(b=>b.setAttribute('aria-pressed','false'));
  };
  const render=()=>{
   const fr=lang.value==='fr';search.placeholder=fr?'Rechercher une réponse…':'Search for an answer…';
   if(selected){list.hidden=true;reader.hidden=false;empty.hidden=true;showArticle(selected);return;}
   reader.hidden=true;list.hidden=false;
   const visible=new Set(searchHelp(search.value,lang.value).map(a=>a.id));
   for(const button of list.querySelectorAll('[data-help-article]')){
    const article=helpArticles.find(a=>a.id===button.dataset.helpArticle);button.hidden=!visible.has(article.id);button.querySelector('strong').textContent=fr?article.frTitle:article.title;
    button.querySelector('small').textContent=fr?'Guide Orka':article.collection;
   }
   empty.hidden=visible.size>0;empty.textContent=fr?'Aucun résultat. Essayez une autre recherche.':'No matching articles. Try another search.';showArticle(helpArticles[0]);
  };
  lang.addEventListener('change',render);search.addEventListener('input',()=>{selected=null;render();});
  demo.addEventListener('click',event=>{
   const button=event.target.closest('[data-help-article]');
   if(button){selected=helpArticles.find(a=>a.id===button.dataset.helpArticle);render();reader.querySelector('button').focus();}
   if(event.target.closest('[data-help-back]')){selected=null;render();search.focus();}
   const reaction=event.target.closest('[data-reaction]');if(reaction){demo.querySelectorAll('[data-reaction]').forEach(b=>b.setAttribute('aria-pressed',String(b===reaction)));set(demo,'[data-reaction-status]',lang.value==='fr'?'Merci ! Exemple uniquement, rien n’est enregistré.':'Thank you! Demo only; nothing is stored.');}
  });render();
 }
}
