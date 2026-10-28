import {launchPromo} from '../config/launch-promo.mjs';

export function launchAnnouncement(config = launchPromo) {
  if (!config.enabled) return '';
  const remaining = Math.max(0, Math.min(config.customerTarget, Math.floor(config.remainingCustomers)));
  const gauge = 100 * remaining / config.customerTarget;
  return `<aside class="launch-banner" aria-label="Orka on Uneed" data-launch-banner data-launch-campaign="${config.campaignId}">
    <div class="launch-banner-inner">
      <a class="launch-uneed-link" href="${config.uneedUrl}" target="_blank" rel="noopener noreferrer" aria-label="Upvote Orka on Uneed"><svg class="launch-uneed-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 8h-5v10H9V11H4z"/></svg><span class="launch-banner-label">Live on Uneed</span><span class="launch-banner-label-short" aria-hidden="true">Uneed</span></a>
      <p class="launch-banner-offer"><span class="launch-banner-desktop">Upvote us, then say hi for </span><strong>$5/mo off.</strong></p>
      <button class="launch-chat-cta" type="button" data-launch-chat>Claim $5 off <span aria-hidden="true">↗</span></button>
      <button class="launch-banner-close" type="button" data-dismiss-banner aria-label="Dismiss Uneed announcement">×</button>
      <p class="launch-chat-status" role="status" hidden></p>
    </div>
  </aside>${remaining > 0 ? `<aside class="launch-price-card" aria-labelledby="launch-price-title" data-launch-card data-launch-campaign="${config.campaignId}" hidden>
    <button class="launch-card-close" type="button" data-dismiss-launch aria-label="Close pricing announcement">×</button>
    <h2 id="launch-price-title">Still <strong>${remaining}</strong> customers at early-bird prices.</h2>
    <p class="launch-price-copy"><a href="#pricing" data-launch-plans>Subscribe before we increase.</a></p>
    <div class="launch-gauge" role="meter" aria-label="Customers remaining at early-bird prices" aria-valuenow="${remaining}" aria-valuemin="0" aria-valuemax="${config.customerTarget}" aria-valuetext="${remaining} customers remaining"><span class="launch-gauge-fill" style="--launch-remaining:${gauge}%" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
  </aside>` : ''}`;
}

export function addLaunchAnnouncement(html, {stylesheet, script}, config = launchPromo) {
  if (!config.enabled) return html;
  return html.replace('<header class="site-header">', launchAnnouncement(config) + '<header class="site-header">')
    .replace('</head>', `<link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script></head>`);
}
