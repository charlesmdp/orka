import { apple, play, storeLinks } from './integration-guides.mjs';

export const appsUpdated = '2026-11-05';
export const appsTitle = 'Orka apps for Mac, iPhone, Android and the web';
export const appsDescription = 'Download Orka for macOS, get the mobile app for iPhone or Android, or open your team inbox in a browser.';
export const downloadMacTitle = 'Download Orka for Mac';
export const downloadMacDescription = 'Download the Orka desktop app for macOS and sign in to your team inbox.';
export const macDownloadUrl = 'https://orka-chat.fra1.digitaloceanspaces.com/desktop/Orka.dmg';
const dashboard = 'https://dashboard.orka.chat/';
const macStart = '/download-mac#start';

const symbols = {
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
  browser: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.6"/><path d="M3 9h18M6 6.8h.1m2 .0h.1"/>',
  iphone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3.5 14h3"/>',
  android: '<path d="m7.8 7.5-1.5-2.8m9.9 2.8 1.5-2.8M3 15a9 9 0 0 1 18 0v2H3z"/><circle cx="8.3" cy="12.1" r=".65" fill="currentColor"/><circle cx="15.7" cy="12.1" r=".65" fill="currentColor"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  back: '<path d="m10 6-6 6 6 6m-6-6h16"/>'
};
function icon(key) {
  return `<svg class="o-app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbols[key]}</svg>`;
}

function platformCard(key, label, description, action, detail = '') {
  return `<article class="o-app-platform">
    <div class="o-app-platform-head"><span class="o-app-platform-symbol">${icon(key)}</span><h3>${label}</h3></div>
    <p>${description}</p>
    <div class="o-app-platform-actions">${action}${detail}</div>
  </article>`;
}

export function appsBody() {
  return `<div class="o-apps-page"><div class="o-apps-wrap">
    <header class="o-apps-intro"><p class="o-apps-eyebrow">ORKA APPS</p><h1>Your inbox, <em>on your devices.</em></h1><p>Reply at your desk or pick up a conversation on your phone. Choose where to open Orka.</p>
      <nav class="o-app-shortcuts" aria-label="Download Orka or open the web app">
        <a href="${macStart}">${icon('download')} Download for Mac</a>
        <a href="${apple}">${icon('iphone')} iPhone App Store</a>
        <a href="${play}">${icon('android')} Google Play</a>
        <a href="${dashboard}">${icon('browser')} Open web app</a>
      </nav>
    </header>
    <section class="o-app-mac" aria-labelledby="o-app-mac-title">
      <div class="o-app-mac-copy"><p class="o-apps-eyebrow">DESKTOP APP</p><h2 id="o-app-mac-title">Orka for Mac.</h2>
        <p>Give your team inbox its own window. Read conversations, leave a private note or reply without looking for the right browser tab.</p>
        <a class="o-app-button o-app-download" href="${macStart}">${icon('download')} Download for macOS</a>
        <small>Orka.dmg · Direct download</small>
      </div>
      <figure class="o-app-mac-photo"><img src="/assets/mobile-apps/orka-macos-inbox.webp" width="1814" height="1133" alt="The Orka Mac app with a project inbox, a conversation and its reply composer."><figcaption>Inside Orka for macOS <span>· Customer details and messages anonymized</span></figcaption></figure>
    </section>
    <section class="o-app-options" aria-labelledby="o-app-options-title"><h2 id="o-app-options-title">More ways to open Orka.</h2>
      <div class="o-app-platforms">
        ${platformCard('iphone', 'iPhone', 'Read incoming chats and send a reply from your iPhone.', storeLinks('ios'), '<a class="o-app-detail" href="/ios-app">Inside the iOS app <span aria-hidden="true">→</span></a>')}
        ${platformCard('android', 'Android', 'Get notified about new conversations and reply from your Android phone.', storeLinks('android'), '<a class="o-app-detail" href="/android-app">Inside the Android app <span aria-hidden="true">→</span></a>')}
        ${platformCard('browser', 'Web browser', 'On Windows, Linux or a shared computer? Sign in to your workspace without installing an app.', `<a class="o-app-button o-app-web" href="${dashboard}">Open web app ${icon('external')}</a>`)}
      </div>
    </section>
  </div></div>`;
}

export function downloadMacBody() {
  return `<div class="o-apps-page o-app-download-page"><div class="o-apps-wrap">
    <a class="o-app-back" href="/apps">${icon('back')} All Orka apps</a>
    <section class="o-app-download-card" aria-labelledby="o-app-download-title">
      <div class="o-app-file-icon" aria-hidden="true"><img src="/assets/orka-logo.svg" alt="" width="53" height="49"><span>${icon('download')}</span></div>
      <p class="o-apps-eyebrow">ORKA FOR MACOS</p>
      <h1 id="o-app-download-title">Download Orka for Mac.</h1>
      <p class="o-app-file-help">Open <strong>Orka.dmg</strong> from your Downloads folder, then follow the instructions inside. Sign in with your Orka account to get back to your conversations.</p>
      <p class="o-app-fallback" data-download-status>Get the desktop app here:</p>
      <a class="o-app-button o-app-download" data-mac-installer href="${macDownloadUrl}">${icon('download')} <span data-download-label>Download Orka.dmg</span></a>
      <a class="o-app-detail" href="${dashboard}">Open Orka in your browser <span aria-hidden="true">↗</span></a>
    </section>
  </div></div>`;
}
