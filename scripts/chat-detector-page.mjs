const vendor = '/assets/vendor-logos/';
const providers = [
  ['Orka', '/assets/orka-logo.svg'], ['Crisp', vendor+'crisp.png'], ['Intercom', vendor+'intercom.png'],
  ['Zendesk', vendor+'zendesk.svg'], ['Gorgias', vendor+'gorgias.png'], ['Tidio', vendor+'tidio.svg'],
  ['tawk.to', vendor+'tawk.png'], ['Chatwoot', vendor+'chatwoot.png'], ['HubSpot', null], ['Drift', null],
  ['LiveChat', vendor+'livechat.png'], ['Help Scout', vendor+'helpscout.svg'], ['Gleap', vendor+'gleap.svg'],
  ['Freshchat', vendor+'freshchat.svg']
];

const globe = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';

export function chatDetectorWorkbench() {
  const providerRows = providers.map(([name,src])=>`<li data-provider="${name}">${src?`<img src="${src}" width="22" height="22" alt="" loading="lazy">`:''}<span>${name}</span></li>`).join('');
  const exampleButtons = ['crisp.chat','cowlendar.com','orka.chat/apps'].map(url=>`<button type="button" data-scan-example="https://${url}">${url}</button>`).join('');
  return `<section class="cd-tool" data-chat-detector data-tool="live-chat-detector" data-family="sites" aria-label="Scan a website for live chat">
    <form class="cd-form" method="post" autocomplete="off">
      <label for="cd-url">Website address</label>
      <div class="cd-entry"><div class="cd-address">${globe}<input id="cd-url" name="url" type="text" inputmode="url" placeholder="example.com" maxlength="2048" autocapitalize="none" spellcheck="false" required aria-describedby="cd-status"></div>
        <button class="cd-submit" type="submit" disabled><span>Scan website</span>${arrow}</button></div>
      <div class="cd-examples"><span>Try a site</span>${exampleButtons}</div>
      <noscript><p>Enable JavaScript to run a scan.</p></noscript>
    </form>
    <p id="cd-status" class="cd-status" role="status" aria-live="polite"></p>
    <section class="cd-result" data-scan-result aria-label="Scan result" hidden></section>
    <details class="cd-providers"><summary><span>Supported providers <small>${providers.length}</small></span><span class="cd-brand-strip" aria-hidden="true">${providers.slice(0,5).map(([,src])=>`<img width="20" height="20" src="${src}" alt="">`).join('')}</span><span class="cd-chevron" aria-hidden="true"></span></summary>
      <ul>${providerRows}</ul></details>
  </section>`;
}
