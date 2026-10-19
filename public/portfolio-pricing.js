import {orkaPlan,vendorCost,VENDOR_PLANS,PROJECT_BILLING} from './pricing-model.js';

// Deliberately named plans, not a claim that these packages have equivalent features.
export const portfolioVendors=[
 {id:'orka',name:'Orka',currency:'EUR',plan:null},
 {id:'crisp',name:'Crisp',currency:'USD',plan:2},
 {id:'intercom',name:'Intercom',currency:'USD',plan:1},
 {id:'gleap',name:'Gleap',currency:'USD',plan:1},
 {id:'helpscout',name:'Help Scout',currency:'USD',plan:1},
 {id:'chatra',name:'Chatra',currency:'USD',plan:1},
 {id:'commslayer',name:'Commslayer',currency:'USD',plan:1},
 {id:'tawk',name:'tawk.to',currency:'USD',plan:0}
];
export const projectCounts=[1,3,10];
export function portfolioRow(vendor,seats=3,planIndex=vendor.plan){
 const plan=vendor.id==='orka'?orkaPlan(seats):VENDOR_PLANS[vendor.id]?.[planIndex];
 if(!plan || !Number.isSafeInteger(seats) || seats<1)return null;
 return {...vendor,plan:planIndex,planName:plan.name,totals:projectCounts.map(projects=>vendor.id==='orka'?plan.price:vendorCost(vendor.id,planIndex,seats,null,projects)),
  source:vendor.id==='orka'?'https://orka.chat/pricing':PROJECT_BILLING[vendor.id].source,
  note:vendor.id==='orka'?'Unlimited projects. Plan chosen for the number of people. AI starts on Pro; usage is separate.':PROJECT_BILLING[vendor.id].note};
}
export function formatPortfolioCost(value,currency){return value===null?'Plan limit':new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(value);}
export function portfolioCsv(seats=3,selectedPlans={}){
 const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
 const rows=[['Provider','Named plan','People','Currency','1 project / month','3 projects / month','10 projects / month','Billing assumptions','Source','Price reference date'],...portfolioVendors.map(v=>{const r=portfolioRow(v,seats,selectedPlans[v.id]??v.plan);return [r.name,r.planName,seats,r.currency,...r.totals.map(n=>n===null?'Plan limit':n),r.note,r.source,'2026-10-18'];})];
 return rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}
