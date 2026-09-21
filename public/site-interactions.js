export function questionEmail(question,page){
 const text=String(question).trim().slice(0,2000);
 if(!text)return null;
 return `mailto:hello@orka.chat?subject=${encodeURIComponent('A question about Orka')}&body=${encodeURIComponent(text+'\n\nPage: '+page)}`;
}
if(typeof document!=='undefined'){
 document.querySelectorAll('[data-faq-ask]').forEach(form=>{
  form.querySelector('input').addEventListener('input',event=>event.target.setCustomValidity(''));
  form.addEventListener('submit',event=>{
  event.preventDefault();
  const input=form.querySelector('input'),url=questionEmail(input.value,location.origin+location.pathname);
  if(!url){input.setCustomValidity('Please enter your question.');input.reportValidity();return;}
  input.setCustomValidity('');location.href=url;
 });});
 document.querySelectorAll('[data-copy-snippet]').forEach(button=>button.addEventListener('click',async()=>{
  const snippet=document.getElementById(button.dataset.copySnippet);
  try{await navigator.clipboard.writeText(snippet.textContent);button.textContent='Copied · replace YOUR_PROJECT_ID';}
  catch{button.textContent='Select and copy the code below';snippet.focus();}
 }));
}
