// Only the ceramic preview gets this complete visual treatment.
const scenes = [
  ['A pod of three orcas swimming in a coordinated formation','pod','A ceramic mosaic of three orcas swimming together'],
  ['An orca swimming below the ocean surface while the moon shines above','night-shift','A watchful orca beneath the moon, in ceramic mosaic'],
  ['Close-up of an orca sending echolocation pulses toward visitor context signals','context','An orca sensing its surroundings in a jade ceramic mosaic'],
  ['A dancing orca learning from help guides and FAQs','learning','A dancing orca with help guides, made from ceramic tiles']
];

export function mosaicDashboard(originalHero) {
  const start = originalHero.indexOf('<div class="hero-product ');
  if (start < 0) throw new Error('The original inbox preview is missing.');
  const dashboard = originalHero.slice(start,originalHero.lastIndexOf('</section>'));
  return `<section class="mosaic-dashboard-section" aria-labelledby="mosaic-dashboard-title"><div class="mosaic-dashboard-heading"><span class="eyebrow">THE VIEW FROM YOUR SIDE</span><h2 id="mosaic-dashboard-title">Every conversation. <em>Right here.</em></h2><p>Your projects, your team and Orky. All in the same inbox.</p></div><div class="mosaic-dashboard-fresco">${dashboard}</div></section>`;
}

export function applyMosaicArtwork(html) {
  for (const [label,asset,alt] of scenes) {
    const pattern = new RegExp('<svg[^>]*aria-label="'+label+'"[^>]*>[\\s\\S]*?</svg>');
    if (!pattern.test(html)) throw new Error('Mosaic source illustration missing: '+asset);
    html = html.replace(pattern,`<img class="mosaic-story-image" src="/assets/new2-mosaic-${asset}.jpg" alt="${alt}" width="1200" height="800" loading="lazy" decoding="async">`);
  }
  return html
    .replaceAll('assets/orca-dialogue-v11.png','assets/new2-mosaic-dialogue.jpg')
    .replaceAll('assets/trawler-dorsal-v14.png','assets/new2-mosaic-wide-net.jpg')
    .replaceAll('assets/orky-head-v2.svg','assets/orky-swim-mascot.svg')
    .replaceAll('assets/orca-swimming.svg','assets/orky-swim-mascot.svg');
}
