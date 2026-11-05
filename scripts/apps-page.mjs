import { apple, play } from './integration-guides.mjs';
import { platformIcon } from './app-platform-icons.mjs';

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
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  back: '<path d="m10 6-6 6 6 6m-6-6h16"/>'
};
function icon(key) {
  return `<svg class="o-app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbols[key]}</svg>`;
}

const platforms = [
  { key: 'web', name: 'Web', action: 'Open web app', href: dashboard, arrow: 'external' },
  { key: 'mac', name: 'macOS', action: 'Download for Mac', href: macStart, arrow: 'download' },
  { key: 'iphone', name: 'iPhone', action: 'App Store', href: apple, arrow: 'external' },
  { key: 'android', name: 'Android', action: 'Google Play', href: play, arrow: 'external' }
];

export function appsBody() {
  const choices = platforms.map(({ key, name, action, href, arrow }) => `
    <li><a class="o-app-choice o-choice-${key}" href="${href}">
      <span class="o-choice-art">${platformIcon(key)}</span>
      <strong class="o-choice-name">${name}</strong>
      <span class="o-choice-action">${action} ${icon(arrow)}</span>
    </a></li>`).join('');
  return `<div class="o-apps-page o-apps-hub"><div class="o-apps-wrap">
    <header class="o-apps-intro"><h1>Orka for <em>every screen.</em></h1>
      <p>Open your inbox in a browser or download the app for your device.</p>
    </header>
    <nav class="o-app-picker" aria-label="Choose your Orka app"><ul>${choices}</ul></nav>
    <figure class="o-app-preview">
      <figcaption>Inside the Orka inbox <span>macOS</span></figcaption>
      <img src="/assets/mobile-apps/orka-macos-inbox.webp" width="1814" height="1133" loading="lazy" alt="Orka on Mac showing the conversation list, a private note and the reply composer.">
    </figure>
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
