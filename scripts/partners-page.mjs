export const partnersUpdated = '2026-11-05';
export const partnersTitle = 'Orka partners · Good people. Useful software.';
export const partnersDescription = 'Meet the makers behind BIG Digital Downloads, Cowlendar, Adminmate, GoodAPI and Dharma Software, and explore their tools for merchants and small teams.';

const partners = [
  {
    id: 'big-digital-downloads', name: 'BIG Digital Downloads', category: 'Digital delivery',
    url: 'https://www.bigdigitaldownload.com/', logo: '/assets/app-logos/big-download.png',
    description: 'Sell ebooks, audio files and license keys on Shopify. Buyers get their downloads after checkout, so you can publish a new release without emailing each file by hand.'
  },
  {
    id: 'cowlendar', name: 'Cowlendar', category: 'Bookings & appointments',
    url: 'https://cowlendar.com/', logo: '/assets/app-logos/cowlendar.jpg',
    description: 'Turn a Shopify product page into a booking calendar. Customers pick a time for their class, appointment or rental based on your team’s availability, then receive a reminder.'
  },
  {
    id: 'adminmate', name: 'Adminmate', category: 'Internal tools',
    url: 'https://adminmate.io/', logo: '/assets/partners/adminmate-icon.svg',
    description: 'Give your team an admin panel for your existing database. Support can look up records, operations can update them, and you decide who has access.'
  },
  {
    id: 'goodapi', name: 'GoodAPI', category: 'Giving & sustainability',
    url: 'https://www.thegoodapi.com/', logo: '/assets/partners/goodapi-icon.svg',
    description: 'Connect Shopify orders to tree planting, plastic removal or charity donations. Show shoppers what their purchases helped fund with badges on your storefront.'
  }
];

function partnerCard(partner) {
  const domain = new URL(partner.url).hostname.replace(/^www\./, '');
  return `<article class="partners-profile" aria-labelledby="${partner.id}">
    <div class="partners-profile-heading"><img class="partners-profile-icon" src="${partner.logo}" alt="" width="60" height="60" loading="lazy"><div><span class="partners-eyebrow">${partner.category}</span><h2 id="${partner.id}">${partner.name}</h2></div></div>
    <p>${partner.description}</p>
    <a class="partners-profile-link" href="${partner.url}">${domain} <span aria-hidden="true">↗</span></a>
  </article>`;
}

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
      <div class="partners-hero-note"><p>Some of these tools come from our own studio. Others are built by friends. Here’s what they do and where to find them.</p><a class="partners-text-link" href="#partner-directory">Meet the partners <span aria-hidden="true">↓</span></a></div>
    </section>
    <section id="partner-directory" class="partners-directory partners-wrap" aria-label="Partner directory">
      <div class="partners-profiles">${partners.map(partnerCard).join('')}</div>
      <div class="partners-featured"><div class="partners-featured-title"><span class="partners-eyebrow">SHOPIFY SEARCH TOOLS</span><h2 id="dharma-software">Dharma Software<span aria-hidden="true">.</span></h2><a href="https://www.dharmasoftware.com/">dharmasoftware.com <span aria-hidden="true">↗</span></a></div><div class="partners-featured-copy"><p>Two apps for your store’s search presence.</p><p>Dharma Software makes Redirect Ninja to help visitors find their way past broken links, and Schema Ninja to make store content easier for shoppers and search engines to understand.</p></div></div>
      <div class="partners-apps">${apps.map(appCard).join('')}</div>
    </section>
    <section class="partners-contact partners-wrap" aria-labelledby="partners-contact-title"><div><span class="partners-eyebrow">SAY HELLO</span><h2 id="partners-contact-title">Building something useful?</h2><p>We like meeting the people behind good products. If you think there’s a fit with Orka, tell us what you’re working on.</p></div><a class="partners-contact-link" href="mailto:hello@orka.chat?subject=Hello%20from%20a%20potential%20Orka%20partner">Let’s talk <span aria-hidden="true">↗</span><small>hello@orka.chat</small></a></section>
  </div>`;
}
