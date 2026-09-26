// Shared ceramic treatment for the homepage and its /new2 preview.
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
  html = decorateMosaicSections(html);
  // One decorative current connects the content, behind every card and heading.
  // Its mask repeats independently from the tiles so neither stretches on long pages.
  html = html.replace('<section class="section pod-section"', '<div class="mosaic-current"><div class="mosaic-current-ribbon" aria-hidden="true"></div><section class="section pod-section"');
  html = html.replace('<section class="closing-section dark-section">', '</div><section class="closing-section dark-section">');
  return html
    .replaceAll('assets/orca-dialogue-v11.png','assets/new2-mosaic-dialogue.jpg')
    .replaceAll('assets/trawler-dorsal-v14.png','assets/new2-mosaic-wide-net.jpg')
    .replaceAll('assets/orky-head-v2.svg','assets/orky-swim-mascot.svg')
    .replaceAll('assets/orca-swimming.svg','assets/orky-swim-mascot.svg');
}

function decorateMosaicSections(html) {
  for (const [tier,description] of [['solo','One orca finding its own current'],['pod','Three orcas swimming together'],['fleet','A whole family of orcas, moving as one']]) {
    html = html.replace(new RegExp('(<article class="price-card price-'+tier+'[^\"]*">)'),`$1<img class="mosaic-tier-art" src="/assets/mosaic-pricing-${tier}.jpg" alt="${description}, in ceramic mosaic" width="1000" height="666" loading="lazy" decoding="async">`);
  }
  html = html.replace('<article class="founder-letter">','<div class="mosaic-letter-frame"><article class="founder-letter"><div class="letter-postage" aria-hidden="true"><img src="/assets/mosaic-pricing-solo.jpg" alt="" width="110" height="80" loading="lazy"><span>FROM FRANCE, WITH CARE</span></div>');
  html = html.replace(/(<article class="founder-letter">[\s\S]*?<\/article>)/,'$1</div>');
  html = html.replace('<div class="closing-sonar" aria-hidden="true">','<div class="closing-sonar" aria-hidden="true"><img class="closing-mosaic-sea" src="/assets/hero-ocean-mosaic.jpg" alt="" width="1672" height="941" loading="lazy">');
  const start=html.indexOf('<article class="context-card real-livemap-card"');
  const end=html.indexOf('</article>',start)+10;
  let map=html.slice(start,end);
  map=map.replace('<div class="live-map-app">',`<div class="mosaic-map-fresco"><div class="mosaic-map-topbar"><span><img src="/assets/orka-logo.svg" width="24" height="23" alt=""> <b>orka.</b></span><span class="mosaic-map-available"><i></i> Available</span><span class="mosaic-map-team"><img src="/assets/portrait-founder-1.png" alt="" width="26" height="26"><img src="/assets/portrait-founder-2.png" alt="" width="26" height="26"><small>Your team, in sync</small></span></div><div class="live-map-app">`);
  map=map.replace('<strong>Visitors</strong><span class="mono">LIVE</span>','<strong>Livemap</strong><span class="map-online"><i></i> Online now</span>');
  map=map.replace('<div class="live-visitor-rows">','<label class="map-visitor-search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><input type="search" data-map-search placeholder="Search visitors" aria-label="Search example visitors by name, project or city"></label><div class="map-list-label"><span>All projects</span><span data-map-visible-count>214 visitors</span></div><div class="live-visitor-rows">');
  const cities={van:'Vancouver, Canada',sf:'San Francisco, United States',den:'Denver, United States',chi:'Chicago, United States',ny:'New York, United States',mia:'Miami, United States'};
  map=map.replace(/(<button class="live-visitor-row[^>]*data-visitor="([^"]+)"[\s\S]*?<small>[^<]*<\/small>)/g,(m,content,id)=>content+`<em class="map-visitor-city">${cities[id]}</em>`);
  map=map.replace('<div class="geographic-viewport">','<div class="geographic-viewport"><div class="map-total-badge"><i></i><strong data-map-total>214</strong><span>visitors online</span></div>');
  map=map.replace('assets/map/world-geography.svg','assets/map/world-geography-quiet.svg');
  map=map.replace('<span>Live visitors</span>','<span>All</span>').replace('<span>To-do app</span>','<span>Calorie tracker</span>').replace('<span>Social scheduler</span>','<span>TRUSTARR</span>').replace('<span>Design studio</span>','<span>inrank.so</span>');
  map=map.replace('Click a group to zoom · Drag to explore','Drag to explore · Click a location to see its visitors');
  map=map.replace('<div class="map-visitor-popup" hidden role="status"></div>','<div class="map-visitor-popup" hidden role="status"></div><aside class="map-location-panel" data-map-location hidden aria-label="Visitors at the selected location"><div class="map-location-heading"><div><strong data-map-location-title></strong><small data-map-location-count></small></div><button type="button" data-map-location-close aria-label="Close location details">×</button></div><div class="map-location-list" data-map-location-list></div><button type="button" class="map-location-zoom" data-map-location-zoom>Explore this location ↗</button></aside>');
  map=map.replace('</article>','</div></article>');
  return html.slice(0,start)+map+html.slice(end);
}
