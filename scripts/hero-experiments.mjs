import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const variants = [
  {slug:'new',style:'pixel',name:'Pixel cove',asset:'hero-pixel-cove.jpg'},
  {slug:'new2',style:'mosaic',name:'Ceramic mosaic',asset:'hero-ceramic-mosaic.jpg'}
];
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

function notifications() {
  return `<div class="seascape-notifications" aria-label="Example messages from different projects">
    <div class="seascape-note"><img src="/assets/orca-cap.webp" width="40" height="40" alt=""><div><span>Your store <small>JUST NOW</small></span><p>“Does this cap come in green?”</p></div><i aria-hidden="true"></i></div>
    <div class="seascape-note"><img src="/assets/cowlendar-official-home.png" width="40" height="40" alt=""><div><span>Your SaaS <small>JUST NOW</small></span><p>“Can I move my booking?”</p></div><i aria-hidden="true"></i></div>
    <div class="seascape-note"><img src="/assets/calorie-app.svg" width="40" height="40" alt=""><div><span>Your next app <small>JUST NOW</small></span><p>“How do I upgrade my plan?”</p></div><i aria-hidden="true"></i></div>
    <div class="seascape-caught"><img src="/assets/orka-logo.svg" alt="" width="23" height="22"><span>All caught. <strong>One inbox.</strong></span><span aria-hidden="true">✓</span></div>
    <span class="seascape-demo-label">ILLUSTRATIVE CONVERSATIONS</span>
  </div>`;
}

function hero(variant) {
  return `<section class="seascape-hero seascape-${variant.style}" aria-labelledby="hero-title">
    <img class="seascape-art" src="/assets/${variant.asset}" width="1672" height="941" alt="" fetchpriority="high" decoding="async">
    <div class="seascape-wash" aria-hidden="true"></div>
    <div class="seascape-content">
      <p class="seascape-eyebrow"><span aria-hidden="true"></span>One Live Chat for Multiple Products</p>
      <h1 id="hero-title">Every product you run.<br><em>One support inbox.</em></h1>
      <p class="seascape-lead">Add Orka to every SaaS, app and store you own. Talk to customers yourself, let Orky draft replies, or let it cover you when you’re offline.</p>
      <div class="seascape-actions"><a class="seascape-primary" href="http://dashboard.orka.chat/signup">Start free <span>· No card required</span>${arrow}</a><button class="seascape-secondary" type="button" data-open-site-preview>See it on your website <span aria-hidden="true">↗</span></button></div>
      <p class="seascape-trust"><span>Unlimited projects.</span><span>Real humans. Helpful AI.</span></p>
    </div>
    ${notifications()}
    <div class="seascape-bottom"><p><span aria-hidden="true">↳</span> A little less support chaos.<br><strong>A little more room to breathe.</strong></p><a href="#pod-heading">Meet your shared inbox <span aria-hidden="true">↓</span></a></div>
    <nav class="seascape-versions" aria-label="Hero design previews"><span>EXPLORE THE LOOK</span><a href="/new"${variant.slug==='new'?' aria-current="page"':''}>01 <span>Pixel</span></a><a href="/new2"${variant.slug==='new2'?' aria-current="page"':''}>02 <span>Mosaic</span></a><a href="/">Current home ↗</a></nav>
  </section>`;
}

// Clone the final homepage so everything after its first section stays identical.
export async function generateHeroExperiments(directory, stylesheet) {
  const home = await readFile(path.join(directory,'index.html'),'utf8');
  const originalHero = home.match(/<section class="hero\b[^>]*>[\s\S]*?<\/section>/)?.[0];
  if (!originalHero) throw new Error('Homepage hero was not found; refusing to create incomplete previews.');
  for (const variant of variants) {
    const page = home.replace(originalHero,hero(variant))
      .replace('<body>',`<body class="hero-experiment experiment-${variant.style}">`)
      .replace(/<title>[^<]*<\/title>/,`<title>Orka · ${variant.name} hero preview</title>`)
      .replace('</head>',`<meta name="robots" content="noindex, follow"><link rel="stylesheet" href="${stylesheet}"><link rel="preload" as="image" href="/assets/${variant.asset}"></head>`);
    await writeFile(path.join(directory,variant.slug+'.html'),page);
  }
}
