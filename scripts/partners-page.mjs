export const partnersUpdated = '2026-10-29';
export const partnersTitle = 'Orka partners · Good people. Useful software.';
export const partnersDescription = 'Meet Dharma Software, the makers of Redirect Ninja and Schema Ninja: Shopify apps for broken links, redirects, FAQs and structured data.';

const apps = [
  {
    id: 'redirect-ninja',
    name: 'Redirect Ninja',
    category: 'BROKEN LINKS & REDIRECTS',
    logo: 'redirect-ninja-logo.webp',
    screenshot: 'redirect-ninja-dashboard.png',
    width: 1680,
    height: 2100,
    alt: 'Redirect Ninja report showing broken URLs, migration recovery and a list of redirects with example traffic figures',
    description: 'Give broken links a useful destination. Redirect Ninja tracks 404 errors, uses Google Search Console history to find lost URLs, and suggests matching pages with AI. Review the suggestions, apply redirects in batches, or use wildcard rules when whole groups of URLs move.',
    url: 'https://www.dharmasoftware.com/apps/redirect-ninja',
    shopify: 'https://apps.shopify.com/redirect-ninja-404'
  },
  {
    id: 'schema-ninja',
    name: 'Schema Ninja',
    category: 'FAQS & STRUCTURED DATA',
    logo: 'schema-ninja-logo.png',
    screenshot: 'schema-ninja-dashboard.webp',
    width: 1027,
    height: 771,
    alt: 'Schema Ninja dashboard with store, blog, breadcrumb, loyalty program and return policy schema settings',
    description: 'Help shoppers and search engines understand your store. Schema Ninja generates product and collection FAQs from store data, displays them on your pages, and adds JSON-LD structured data. Its schema scanner also checks live pages for errors, duplicates and conflicts with your theme.',
    url: 'https://www.dharmasoftware.com/apps/schema-ninja-json-ld-seo',
    shopify: 'https://apps.shopify.com/schema-ninja-json-ld'
  }
];

function appCard(app) {
  const asset = '/assets/partners/';
  return `<article class="partners-app" aria-labelledby="${app.id}-title">
    <div class="partners-app-copy">
      <div class="partners-app-heading"><img class="partners-app-logo" src="${asset}${app.logo}" alt="" width="64" height="64" loading="lazy"><div><span class="partners-eyebrow">${app.category}</span><h3 id="${app.id}-title">${app.name}</h3></div></div>
      <p>${app.description}</p>
      <div class="partners-app-links"><a class="partners-button" href="${app.url}" target="_blank" rel="noopener noreferrer">Explore ${app.name} <span aria-hidden="true">↗</span></a><a class="partners-store-link" href="${app.shopify}" target="_blank" rel="noopener noreferrer" aria-label="${app.name} on the Shopify App Store">Shopify App Store <span aria-hidden="true">↗</span></a></div>
    </div>
    <figure class="partners-product-figure"><a class="partners-screenshot" href="${asset}${app.screenshot}" target="_blank" rel="noopener" aria-label="View the full ${app.name} screenshot"><img src="${asset}${app.screenshot}" alt="${app.alt}" width="${app.width}" height="${app.height}" loading="lazy"><span class="partners-screenshot-hint" aria-hidden="true">View full image ↗</span></a><figcaption>Product screenshot from Dharma Software</figcaption></figure>
  </article>`;
}

export function partnersBody() {
  return `<div class="partners-page">
    <section class="partners-hero partners-wrap" aria-labelledby="partners-title">
      <div><span class="partners-eyebrow partners-hero-eyebrow"><span aria-hidden="true"></span> FRIENDS OF ORKA</span><h1 id="partners-title">Good people.<br><em>Useful software.</em></h1></div>
      <div class="partners-hero-note"><p>A little space for the makers around us. Discover our partners and the products they’re building to make everyday work a bit easier.</p><a class="partners-text-link" href="#dharma-software">Meet our featured partner <span aria-hidden="true">↓</span></a></div>
    </section>
    <section class="partners-directory partners-wrap" aria-labelledby="dharma-software">
      <div class="partners-featured"><div class="partners-featured-title"><span class="partners-eyebrow">FEATURED PARTNER</span><h2 id="dharma-software">Dharma Software<span aria-hidden="true">.</span></h2><a href="https://www.dharmasoftware.com/" target="_blank" rel="noopener noreferrer">dharmasoftware.com <span aria-hidden="true">↗</span></a></div><div class="partners-featured-copy"><p>Thoughtful tools for Shopify stores.</p><p>Dharma Software builds apps that help merchants manage their store’s search presence. Its two products tackle different parts of the job: getting visitors past broken links, and making store content easier to understand.</p></div></div>
      <div class="partners-apps">${apps.map(appCard).join('')}</div>
    </section>
    <section class="partners-contact partners-wrap" aria-labelledby="partners-contact-title"><div><span class="partners-eyebrow">SAY HELLO</span><h2 id="partners-contact-title">Building something useful?</h2><p>We like meeting the people behind good products. If you think there’s a fit with Orka, tell us what you’re working on.</p></div><a class="partners-contact-link" href="mailto:hello@orka.chat?subject=Hello%20from%20a%20potential%20Orka%20partner">Let’s talk <span aria-hidden="true">↗</span><small>hello@orka.chat</small></a></section>
  </div>`;
}
