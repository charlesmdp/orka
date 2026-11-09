import { uiIcon, person } from './dashboard-previews.mjs';
import { escapeHtml as esc } from './site-chrome.mjs';
import { widgetDefaults } from '../public/tools-sites.js';

const people = () => '<span class="wp-people" aria-hidden="true">'+[1,2,3].map(person).join('')+'</span>';
const logo = '<img class="wp-logo" src="/assets/orka-logo.svg" width="23" height="22" alt="">';
const phone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18.5h4"/></svg>';
const sample = '/assets/widget-preview-orka-home.webp';

export function widgetPreviewWorkbench() {
  const {brand,color,message}=widgetDefaults;
  return `<section class="wp-studio" data-widget-studio data-layout="people" data-device="desktop" aria-label="Interactive chat widget preview">
    <div class="wp-controls"><h2>Widget settings</h2>
      <label class="wp-field" for="wp-brand">Team name<input id="wp-brand" maxlength="70" autocomplete="off" value="${esc(brand)}"></label>
      <label class="wp-field" for="wp-color">Accent color<span class="wp-color"><input id="wp-color" type="color" value="${color}"><span data-color-label>${color.toUpperCase()}</span></span></label>
      <label class="wp-field" for="wp-greeting">Welcome message<textarea id="wp-greeting" maxlength="240" rows="2">${esc(message)}</textarea></label>
      <fieldset class="wp-choices"><legend>Launcher</legend><div class="wp-segments">
        <button type="button" data-layout-option="people" aria-pressed="true">${uiIcon('users')} People</button>
        <button type="button" data-layout-option="classic" aria-pressed="false">${uiIcon('chat')} Classic</button>
      </div></fieldset>
      <fieldset class="wp-choices wp-background"><legend>Website background</legend><div class="wp-segments">
        <button type="button" data-source="sample" aria-pressed="true">Sample</button>
        <button type="button" data-source="website" aria-pressed="false">Website</button>
        <button type="button" data-source="upload" aria-pressed="false">Upload</button>
      </div></fieldset>
      <form class="wp-site-form" data-source-pane="website" hidden><label for="wp-url">Public homepage</label><div><input id="wp-url" type="text" inputmode="url" autocomplete="url" placeholder="yourwebsite.com" required><button type="submit" aria-label="Load homepage">Load</button></div></form>
      <div class="wp-upload" data-source-pane="upload" hidden><label for="wp-file">Screenshot from your device</label><input id="wp-file" type="file" accept="image/jpeg,image/png,image/webp"></div>
      <p class="wp-status" role="status" data-background-status></p>
      <button class="wp-copy" type="button" data-copy-settings>${uiIcon('note')} Copy settings</button><span class="wp-status" role="status" data-copy-status></span>
    </div>
    <div class="wp-preview"><div class="wp-toolbar"><h2>Live preview</h2><div class="wp-screen-switch" role="group" aria-label="Preview size">
      <button type="button" data-size="desktop" aria-label="Desktop preview" title="Desktop preview" aria-pressed="true">${uiIcon('laptop')}</button><button type="button" data-size="mobile" aria-label="Mobile preview" title="Mobile preview" aria-pressed="false">${phone}</button></div></div>
      <div class="wp-frame"><div class="wp-chrome"><span class="wp-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="wp-address">${uiIcon('globe')} <span data-preview-address>orka.chat</span></span></div>
        <div class="wp-stage"><img class="wp-stage-backdrop" data-background-image src="${sample}" width="1360" height="585" alt="Sample background showing the Orka homepage">
          <iframe class="wp-website-frame" title="Website preview background" sandbox="allow-scripts" referrerpolicy="no-referrer" credentialless tabindex="-1" inert hidden></iframe>
          <div class="wp-dock"><div class="wp-messenger" id="wp-messenger" role="region" aria-label="Demo conversation">
            <div class="wp-chatbar"><span>${uiIcon('chat')} Messages</span><button type="button" data-minimize aria-label="Minimize chat">${uiIcon('close')}</button></div>
            <div class="wp-team">${people()}<div><strong data-team-name>${esc(brand)}</strong><small><i></i> 3 people online</small></div></div>
            <div class="wp-history" role="log" aria-label="Preview messages" aria-live="polite"><div class="wp-msg wp-incoming" data-welcome>${esc(message)}</div></div>
            <form class="wp-composer"><input id="wp-test-message" aria-label="Test message" autocomplete="off" maxlength="500" placeholder="Write a test message…"><button type="submit" aria-label="Send test message">${uiIcon('send')}</button></form>
          </div>
          <button class="wp-launcher" type="button" data-launcher aria-label="Minimize chat" aria-expanded="true" aria-controls="wp-messenger">${people()}<span class="wp-launcher-words"><strong>Chat with us</strong><small><i></i> We’re online</small></span>${logo}</button></div>
        </div>
      </div>
      <p class="wp-local">${uiIcon('lock')} Test messages stay in this preview.</p>
    </div><noscript><p>Enable JavaScript to customize and try the widget.</p></noscript>
  </section>`;
}
