// Static model choices demonstrate the dashboard without accepting credentials.
const models={OpenAI:['gpt-5.4-mini (recommended)','gpt-5.4'],Anthropic:['Claude Sonnet','Claude Haiku'],OpenRouter:['Choose an OpenRouter model','Search the model catalogue…']};
document.querySelectorAll('[data-aip-provider-demo]').forEach(demo=>{
  demo.querySelectorAll('[data-aip-provider]').forEach(button=>button.addEventListener('click',()=>{
    const provider=button.dataset.aipProvider;
    if(!models[provider])return;
    demo.querySelectorAll('[data-aip-provider]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    demo.querySelectorAll('[data-aip-provider-name]').forEach(item=>item.textContent=provider);
    const select=demo.querySelector('[data-aip-model]');
    select.replaceChildren(...models[provider].map(label=>new Option(label,label)));
  }));
});
