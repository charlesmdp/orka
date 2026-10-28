import {launchPromo} from '../config/launch-promo.mjs';
import {plans} from './plan-copy.mjs';

export function launchAnnouncement(config = launchPromo) {
  if (!config.enabled) return '';
  const remaining = Math.max(0, Math.min(config.customerTarget, Math.floor(config.remainingCustomers)));
  const gauge = 100 * remaining / config.customerTarget;
  return `<aside class="launch-banner" aria-label="Orka on Uneed" data-launch-banner data-launch-campaign="${config.campaignId}">
    <div class="launch-banner-inner">
      <a class="launch-uneed-link" href="${config.uneedUrl}" target="_blank" rel="noopener noreferrer"><span class="launch-uneed-mark" aria-hidden="true">↑</span><span><strong>We’re live on Uneed!</strong><span class="launch-banner-detail">A little upvote. A little happy dance. ↗</span></span></a>
      <p>Upvote us, then say hi for <strong>$5/month off.</strong> Yes, really.</p>
      <button class="launch-chat-cta" type="button" data-launch-chat>Claim my $5 off <span aria-hidden="true">↗</span></button>
      <button class="launch-banner-close" type="button" data-dismiss-banner aria-label="Dismiss Uneed announcement">×</button>
      <p class="launch-chat-status product-contact-status" role="status" hidden></p>
    </div>
  </aside>${remaining > 0 ? `<aside class="launch-price-card" aria-labelledby="launch-price-title" data-launch-card data-launch-campaign="${config.campaignId}" hidden>
    <button class="launch-card-close" type="button" data-dismiss-launch aria-label="Close pricing announcement">×</button>
    <div class="launch-price-eyebrow"><span class="launch-live-dot" aria-hidden="true"></span>A LITTLE HEADS-UP</div>
    <h2 id="launch-price-title"><strong>${remaining}</strong> customers to go.</h2>
    <p class="launch-price-copy">Then our paid plans go up <strong>${config.plannedIncreasePercent}%.</strong></p>
    <div class="launch-gauge" role="meter" aria-label="Customers remaining before the planned price increase" aria-valuenow="${remaining}" aria-valuemin="0" aria-valuemax="${config.customerTarget}" aria-valuetext="${remaining} customers remaining"><span class="launch-gauge-fill" style="--launch-remaining:${gauge}%" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="launch-gauge-cap" style="left:calc(${gauge}% - 15px)" aria-hidden="true"></span></div>
    <div class="launch-plan-strip" aria-label="Current monthly prices in euros">${plans.map(p => `<span><small>${p.name}</small><strong>€${p.price}<small>/mo</small></strong></span>`).join('')}</div>
    <div class="launch-price-footer"><span>Unlimited projects.<br>AI billed separately.</span><a href="#pricing" data-launch-plans>Compare plans <span aria-hidden="true">↗</span></a></div>
  </aside>` : ''}`;
}

export function addLaunchAnnouncement(html, {stylesheet, script}, config = launchPromo) {
  if (!config.enabled) return html;
  return html.replace('<header class="site-header">', launchAnnouncement(config) + '<header class="site-header">')
    .replace('</head>', `<link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script></head>`);
}
