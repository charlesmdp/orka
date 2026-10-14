import {readFileSync} from 'node:fs';
import {replaceProductElement, widgetPreview} from './dashboard-previews.mjs';

const vendorLogos = JSON.parse(readFileSync(new URL('./vendor-logos.json', import.meta.url), 'utf8'));
// Official marks, fetched from the providers' own sites on 14 October 2026.
// Local copies avoid runtime requests to third-party servers.
// Help Scout's color-scheme rule is removed because these marks sit on white cards.
const officialMarks = {
  Gleap: '/assets/competitors/gleap.svg',
  GitBook: '/assets/competitors/gitbook.png',
  'Help Scout': '/assets/competitors/helpscout.svg',
  Fernand: '/assets/competitors/fernand.png',
};
export const importLogoSources = {
  Gleap: 'https://www.gleap.ai/favicon.svg',
  GitBook: 'https://framerusercontent.com/images/93a6peqhbHQaWP67zttmrKDazq4.png',
  'Help Scout': 'https://www.helpscout.com/images/favicon/favicon.svg',
  Fernand: 'https://getfernand.com/images/favicon/favicon-32x32.png',
};
const marks = {
  ...officialMarks,
  Crisp: vendorLogos.crisp.path,
  'tawk.to': vendorLogos.tawk.path,
  Gorgias: vendorLogos.gorgias.path,
  Intercom: vendorLogos.intercom.path,
};
const logo = name => `<img class="import-provider-logo" src="${marks[name]}" width="28" height="28" alt="" loading="lazy" decoding="async">`;
const otherProvider = () => `<button type="button" class="import-provider import-provider-other" data-orka-draft="Hi! Could you add a one-click help center import from: " aria-label="Ask us to migrate another help center"><span class="import-other-icon" aria-hidden="true">+</span><span>Other</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></button><span class="product-contact-status import-contact-status" role="status"></span>`;
const provider = name => name === 'Other' ? otherProvider() : `<span class="import-provider">${logo(name)}<span>${name}</span></span>`;
const importNames = ['Gleap', 'Gorgias', 'Intercom', 'Crisp', 'GitBook', 'Help Scout', 'Fernand', 'tawk.to', 'Other'];

function compactDevices() {
  return `<div class="accurate-devices marketing-device-scene">
    <div class="accurate-browser-label"><span aria-hidden="true">● ● ●</span> your-website.com</div>
    <div class="marketing-device-canvas">
      <div class="marketing-device-site" aria-hidden="true">
        <strong>Coast &amp; Co.</strong><span>GOOD THINGS. MADE SIMPLY.</span>
        <b>A little<br>closer to<br>your people.</b>
        <div class="marketing-site-button">Explore the collection ↗</div>
        <div class="marketing-site-lines"><i></i><i></i></div>
      </div>
      ${widgetPreview()}
    </div>
    <div class="accurate-mobile-links">
      <div class="marketing-app-copy"><strong>Your team, on the go.</strong><span>Orka for iOS &amp; Android</span></div>
      <div class="marketing-app-badges">
        <a href="https://apps.apple.com/fr/app/orka-chat/id6473671891" aria-label="Get Orka for iOS"><img src="/assets/mobile-apps/app-store-badge.svg" width="120" height="40" alt="Download on the App Store" loading="lazy"></a>
        <a href="https://play.google.com/store/apps/details?id=com.orka.chat" aria-label="Get Orka for Android"><img src="/assets/mobile-apps/google-play-badge.png" width="136" height="53" alt="Get it on Google Play" loading="lazy"></a>
      </div>
    </div>
  </div>`;
}

// Run after refreshProductPreviews so these layout rules repair the final markup.
export function repairMarketingLayouts(html) {
  html = replaceProductElement(html, 'launch-providers',
    `<div class="launch-providers" aria-label="One-click import sources">${importNames.map(provider).join('')}</div>`);
  html = replaceProductElement(html, 'import-constellation', old =>
    old.replace(/<div>[\s\S]*?<\/div>/, `<div>${importNames.map(provider).join('')}</div>`));
  html = replaceProductElement(html, 'fv-source-grid', old => {
    // The same component is also used for Orky's knowledge sources, which must
    // retain their own illustrations. Only replace recognized vendor entries.
    if (old.includes('Gleap') && old.includes('Gorgias')) return `<div class="fv-source-grid help-import-grid">${importNames.map(provider).join('')}</div>`;
    return old.replace(/<span><b>[^<]*<\/b>([^<]+)<\/span>/g,
      (entry, name) => marks[name] ? provider(name) : entry);
  });
  html = replaceProductElement(html, 'accurate-devices', compactDevices);
  // The profile spans the two conversation examples. Show useful real data
  // in that space rather than stretching a mostly collapsed white panel.
  html = replaceProductElement(html, 'customer-context-card', old => old
    .replace('<details class="contact-extra contact-cart" id="context-cart">', '<details class="contact-extra contact-cart" id="context-cart" open>')
    .replace('<details class="contact-extra">', '<details class="contact-extra" open>'));

  // Google's supplied image includes a 41px transparent safe area on every
  // edge. A CSS viewport gives its visible badge the same height as Apple's.
  html = html.replace(/<img\b[^>]*src="[^"]*google-play-badge\.png"[^>]*>/g,
    image => `<span class="store-badge-art store-badge-google">${image}</span>`);
  return html;
}
