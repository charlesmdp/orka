import { readFileSync } from 'node:fs';
import { replaceProductElement, uiIcon, person } from './dashboard-previews.mjs';

// The homepage source owns the three launcher designs and their seasonal trims.
// Do not replace them with the dashboard's design-settings screen: the theme
// switcher changes these actual launcher elements, not a settings illustration.
const homepageSource = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
let seasonalLaunchers = '';
replaceProductElement(homepageSource, 'widget-replicas', old => {
  seasonalLaunchers = old.replace('class="widget-replicas"', 'class="widget-replicas seasonal-restored"');
  return old;
});
if (!seasonalLaunchers) throw new Error('The homepage seasonal launcher source is missing.');

const brand = '<img src="/assets/orka-logo.svg" width="20" height="19" alt="">';
const faces = `<span class="sr-team-faces" aria-hidden="true">${[1, 2, 3].map(person).join('')}</span>`;
const tabs = `<div class="sr-widget-nav"><div><span class="selected">${uiIcon('chat')} Messages</span><span>${uiIcon('book')} Help</span></div>${uiIcon('more')}${uiIcon('close')}</div>`;
const bannerCopy = {
  night: ['moon', 'It’s <strong>11:49 PM</strong> for the Coast &amp; Co. team. Please note it might take some time to get a response.'],
  break: ['coffee', 'The Coast &amp; Co. team is having a break. Please note it might take some time to get a response.'],
  panic: ['alert', 'I’m a one-person team, and I had to take my dog to the vet. I’ll be back as soon as I can. Sorry!']
};

function bannerWidget({ interactive = false, mode = 'night', compact = false } = {}) {
  const [icon, copy] = bannerCopy[mode] || bannerCopy.night;
  const title = interactive ? '<span id="availability-title" hidden></span>' : '';
  const bubble = interactive ? '<span id="availability-body-copy">Hello, how can we help you?</span>' : 'Hello, how can we help you?';
  return `<div class="sr-widget ${compact ? 'sr-widget-compact' : ''}" data-banner-state="${mode}">
    ${tabs}
    <div class="sr-widget-team">${faces}<div><strong>The Coast &amp; Co. team</strong><span><i></i> <span${interactive ? ' id="availability-status"' : ''}>3 people online</span></span></div></div>
    <div class="sr-widget-thread">
      <div class="sr-widget-banner">${interactive ? '<svg class="icon" id="availability-icon" aria-hidden="true"><use href="#i-moon"/></svg>' : uiIcon(icon)}<p${interactive ? ' id="availability-message"' : ''}>${copy}</p></div>
      ${compact ? '' : `<div class="sr-widget-conversation"><div class="sr-widget-received">${title}${bubble}</div><div class="sr-widget-sent">Hi! I have a question.</div></div>`}
    </div>
    ${compact ? `<div class="sr-widget-compact-compose">Write your message… ${uiIcon('arrow')}</div>` : `<div class="sr-widget-composer"><span>Write your message…</span><div>${uiIcon('smile')}<b>GIF</b>${uiIcon('clip')}<span>${uiIcon('arrow')}</span></div></div>`}
    <div class="sr-widget-credit">with ${brand} <strong>Orka</strong></div>
  </div>`;
}

/** Apply after refreshProductPreviews, before image optimization. */
export function repairSeasonalPreviews(html) {
  html = replaceProductElement(html, 'widget-replicas', seasonalLaunchers);
  html = replaceProductElement(html, 'availability-preview', `<div class="availability-preview sr-banner-preview" id="availability-preview" data-banner-state="night" aria-live="polite">${bannerWidget({ interactive: true })}</div>`);
  html = replaceProductElement(html, 'boundary-widget-examples', `<div class="boundary-widget-examples sr-banner-examples"><div><span class="sr-preview-label">Emergency banner</span>${bannerWidget({ mode: 'panic', compact: true })}</div><div><span class="sr-preview-label">Night banner</span>${bannerWidget({ mode: 'night', compact: true })}</div></div>`);
  return html;
}
