export function ownershipCost({hours,rate,maintenance,services,extras}) {
 const values=[hours,rate,maintenance,services,extras];
 if(values.some(v=>!Number.isFinite(v)||v<0))return null;
 return Math.round((hours*rate+12*(maintenance*rate+services)+extras)*100)/100;
}
if(typeof document!=='undefined')for(const form of document.querySelectorAll('[data-ownership-calculator]')){
 const currency=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('input',()=>{
  const values=Object.fromEntries([...form.querySelectorAll('input')].map(input=>[input.name,input.value===''?NaN:input.valueAsNumber]));
  const total=form.checkValidity()?ownershipCost(values):null;
  form.querySelector('[data-year-cost]').textContent=total===null?'Check your inputs':currency(total);
  form.querySelector('[data-cost-equation]').textContent=total===null?'Enter a non-negative amount in each field.':`${values.hours} h × ${currency(values.rate)} + 12 × (${values.maintenance} h × ${currency(values.rate)} + ${currency(values.services)}) + ${currency(values.extras)}`;
 });
}
