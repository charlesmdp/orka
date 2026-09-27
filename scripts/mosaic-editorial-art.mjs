import {escapeHtml as e} from './site-chrome.mjs';

// One scene per competitor; its comparison, review and alternatives form a family.
export const comparisonArt = id => `/assets/mosaic-comparison-${id}.webp`;

const art = (file, alt, title, caption) => ({src:`/assets/${file}.webp`,alt,title,caption});
const stores = art('mosaic-audience-stores','Ceramic mosaic of an orca beside a coastal shop, with a parcel and a customer’s message boat.','Your shop. A real conversation.','Help shoppers while they are still with you.');
const portfolio = art('mosaic-page-features','Ceramic mosaic of several product islands connected by currents around one orca.','Different products. One support home.','Keep each project’s context in the same inbox.');
const mobile = art('mosaic-audience-mobile','Ceramic mosaic of an orca connecting a garden app and a fishing app on phone-shaped islands.','Small screens. The same support home.','Your mobile apps, website and next project, together.');
export const audienceArt = {
 'shopify-apps':art('mosaic-audience-shopify-apps','Ceramic mosaic of an orca linking booking, download and app-workshop islands.','Every app has its own story.','Bring the merchant context into one shared inbox.'),
 'vibe-coded-projects':art('mosaic-audience-vibe-coded-projects','Ceramic mosaic of an orca connecting a laptop, greenhouse, shop and rocket workshop on floating islands.','Vibe code the next thing.','Keep the same inbox for every idea you ship.'),
 'solo-founders':art('mosaic-audience-founders','Ceramic mosaic of a solo founder’s sailboat and an orca exploring a group of workshop islands.','A whole portfolio. Still your own crew.','One place to answer, even when you work solo.'),
 agencies:art('mosaic-audience-agencies','Ceramic mosaic of a pod of orcas connecting four distinct client islands.','Different clients. A shared crew.','Keep the right project attached to every conversation.'),
 shopify:stores, wordpress:stores, 'small-business':portfolio, 'multiple-websites':portfolio,
 saas:art('mosaic-page-sdk','Ceramic mosaic of an orca linking visitor-data cards with fine golden sonar lines.','Your product knows the context.','Bring it into the conversation with the Orka SDK.'),
 'ios-apps':mobile,'android-apps':mobile,'mobile-apps':mobile,
};

export function mosaicFigure(id,{className='',priority=true}={}) {
 const a=audienceArt[id];
 return `<figure class="editorial-mosaic ${e(className)}"><img src="${a.src}" width="1200" height="800" alt="${e(a.alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'}><figcaption><strong>${e(a.title)}</strong><span>${e(a.caption)}</span></figcaption></figure>`;
}

export function mosaicSocialForSlug(slug) {
 const id=slug.replace(/^best-live-chat-for-/, '');
 return audienceArt[id]?.src.slice('/assets/'.length);
}
