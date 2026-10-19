import {portfolioVendors,portfolioRow,formatPortfolioCost,portfolioCsv} from './portfolio-pricing.js';

const tool=document.querySelector('[data-portfolio-pricing]');
if(tool){
 const input=tool.querySelector('[data-portfolio-seats]');
 const status=tool.querySelector('[data-portfolio-status]');
 const selectedPlans=()=>Object.fromEntries([...tool.querySelectorAll('[data-portfolio-plan]')].map(select=>[select.dataset.portfolioPlan,Number(select.value)]));
 function update(){
  const seats=Number(input.value);
  if(!Number.isInteger(seats)||seats<1||seats>20){input.setCustomValidity('Choose between 1 and 20 people.');status.textContent='Enter a whole number from 1 to 20.';return;}
  input.setCustomValidity('');
  for(const vendor of portfolioVendors){
   const result=portfolioRow(vendor,seats,selectedPlans()[vendor.id]??vendor.plan),row=tool.querySelector(`[data-portfolio-vendor="${vendor.id}"]`);
   const planLabel=row.querySelector('[data-plan-name]');
   if(planLabel)planLabel.textContent=result.planName;
   row.querySelectorAll('[data-project-price]').forEach((cell,i)=>{cell.textContent=formatPortfolioCost(result.totals[i],result.currency);cell.classList.toggle('plan-limit',result.totals[i]===null);});
  }
  status.textContent=`Base subscription estimates for ${seats} ${seats===1?'person':'people'}, with the same team on every project. AI and usage stay separate.`;
 }
 input.addEventListener('input',update);
 for(const select of tool.querySelectorAll('[data-portfolio-plan]'))select.addEventListener('change',update);
 tool.querySelector('[data-download-portfolio]').addEventListener('click',()=>{
  if(!input.reportValidity())return;
  const link=document.createElement('a'),url=URL.createObjectURL(new Blob([portfolioCsv(Number(input.value),selectedPlans())],{type:'text/csv;charset=utf-8'}));
  link.href=url;link.download='live-chat-project-costs-2026.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 update();
}
