// A local, prepared example: no message or translation request leaves this page.
const demo=document.querySelector('[data-translation-demo]');
if(demo){
 const active=new Set(['en']);
 const names={en:'English',fr:'French',pt:'Portuguese'};
 const update=(message)=>{
  demo.querySelectorAll('[data-translation-language]').forEach(row=>row.hidden=!active.has(row.dataset.translationLanguage));
  demo.querySelectorAll('[data-active-language]').forEach(row=>row.hidden=!active.has(row.dataset.activeLanguage));
  demo.querySelector('[data-translation-status]').textContent=message;
  demo.querySelector('[data-translations-state]').textContent=active.size?'Translations active':'Translations off';
  demo.querySelectorAll('.dp-translations').forEach(group=>{
   const rows=[...group.querySelectorAll('p')];
   group.hidden=rows.every(row=>row.hidden);
  });
 };
 demo.querySelector('[data-add-language]').addEventListener('click',()=>{
  const language=demo.querySelector('select').value;
  const existed=active.has(language);active.add(language);
  update(names[language]+(existed?' is already enabled in this example.':' added. The original message stays visible.'));
 });
 demo.querySelectorAll('[data-stop-language]').forEach(button=>button.addEventListener('click',()=>{
  const language=button.dataset.stopLanguage;active.delete(language);
  update(names[language]+' translation stopped in this example.');
 }));
}
