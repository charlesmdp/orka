import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {projectHelp} from './pricing-explainers.mjs';
import {mosaicDashboard,applyMosaicArtwork} from './new2-mosaic.mjs';

const variants = [
  {slug:'new',style:'pixel',name:'Pixel cove',asset:'hero-pixel-cove-front.jpg'},
  {slug:'new2',style:'mosaic',name:'Ceramic mosaic',asset:'hero-ceramic-mosaic.jpg'},
  {slug:'new3',style:'mosaic',name:'Aerial ocean mosaic',asset:'hero-ocean-mosaic.jpg',aerial:true},
  {slug:'new4',style:'mosaic',name:'Orky’s message mosaic',asset:'hero-mosaic-chat-source.jpg',chatSource:true}
];
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

function notifications() {
  const messages=[['orca-cap.webp','My cap store','Emma','Does this cap come in green?'],['cowlendar-official-home.png','My booking app','Alex','Can I move my booking?'],['calorie-app.svg','My calorie tracker','Sam','How do I upgrade my plan?']];
  return `<div class="seascape-notifications" aria-label="Example message notifications from different projects">
    <div class="seascape-note-stack">${messages.map(([icon,project,name,message],i)=>`<article class="seascape-note" data-slot="${i}"><div class="seascape-note-surface"><div class="seascape-note-app"><img src="/assets/orka-logo.svg" width="18" height="17" alt=""><span>ORKA <b>· NEW MESSAGE</b></span><small>now</small></div><div class="seascape-note-body"><img data-note-icon src="/assets/${icon}" width="38" height="38" alt=""><div><strong><span data-note-name>${name}</span><span class="seascape-note-project" data-note-project>${project}</span></strong><p data-note-message>${message}</p></div><span class="seascape-unread" aria-label="Unread"></span></div></div></article>`).join('')}</div>
    <div class="seascape-caught"><img src="/assets/orka-logo.svg" alt="" width="23" height="22"><span>All caught. <strong>One inbox.</strong></span><span class="seascape-online-dot" role="img" aria-label="Online"></span></div>
  </div>`;
}

const sceneTools = `<div class="seascape-scene-tools" role="group" aria-label="Scene settings"><button class="seascape-night-toggle" type="button" role="switch" aria-checked="false" aria-label="Night mode" data-night-toggle><span class="seascape-toggle-track" aria-hidden="true"><span>☀</span><span>☾</span><i></i></span><span data-night-label>Night mode</span></button></div>`;

function hero(variant, mascot) {
  return `<section class="seascape-hero seascape-${variant.style}${variant.aerial?' seascape-aerial':''}${variant.chatSource?' seascape-chat-source':''}" aria-labelledby="hero-title">
    <img class="seascape-art" src="/assets/${variant.asset}" width="1672" height="941" alt="" fetchpriority="high" decoding="async">
    <img class="seascape-art seascape-art-night" data-night-art data-src="/assets/${variant.asset.replace('.jpg','-night.jpg')}" width="1672" height="941" alt="" decoding="async">
    <div class="seascape-wash" aria-hidden="true"></div>
    <div class="seascape-sparkles" aria-hidden="true">${Array.from({length:7},(_,i)=>`<i style="--spark:${i}"></i>`).join('')}</div>
    <div class="seascape-content">
      <p class="seascape-eyebrow"><span aria-hidden="true"></span>One Live Chat for Multiple Products</p>
      <h1 id="hero-title">Every product you run.<br><em>One support inbox.</em></h1>
      <p class="seascape-lead">Add Orka to every SaaS, app and store you own. Talk to customers yourself, let Orky draft replies, or let it cover you when you’re offline.</p>
      <div class="seascape-actions"><a class="seascape-primary" href="http://dashboard.orka.chat/signup">Start free <span>· No card required</span>${arrow}</a><button class="seascape-secondary" type="button" data-open-site-preview>See it on your website <span aria-hidden="true">↗</span></button></div>
      <div class="seascape-trust"><span>Unlimited projects.</span>${projectHelp()}<span>Real humans. Helpful AI.</span></div>
    </div>
    ${notifications()}
    <div class="seascape-mascot" data-mascot><button class="seascape-mascot-handle" type="button" data-mascot-handle aria-label="Orky the orca. Drag to play" aria-describedby="mascot-instructions"><span class="seascape-mascot-swimmer">${mascot}<span class="seascape-mascot-bubbles" aria-hidden="true"><i></i><i></i><i></i></span></span></button><span class="seascape-mascot-hint" aria-hidden="true" data-mascot-hint>Make me swim</span></div><p id="mascot-instructions" class="sr-only">Drag Orky with your mouse or finger and release. Or use the arrow keys to move, Enter to make a splash, and Escape to return home.</p><span class="sr-only" role="status" data-mascot-status></span>
  </section>`;
}

// Share the homepage content, with an explicitly scoped mosaic treatment for /new2.
export async function generateHeroExperiments(directory, stylesheet, script, mosaicStylesheet) {
  const mascot = (await readFile(path.join(directory,'assets/orky-swim-mascot.svg'),'utf8')).replace('<svg ', '<svg class="seascape-mascot-drawing" aria-hidden="true" ');
  const home = await readFile(path.join(directory,'index.html'),'utf8');
  const originalHero = home.match(/<section class="hero\b[^>]*>[\s\S]*?<\/section>/)?.[0];
  if (!originalHero) throw new Error('Homepage hero was not found; refusing to create incomplete previews.');
  for (const variant of variants) {
    const isMosaicPage = variant.slug === 'new2';
    let page = home.replace(originalHero,hero(variant,mascot)+(isMosaicPage?mosaicDashboard(originalHero):''))
      .replace('<div class="nav-actions">','<div class="nav-actions">'+sceneTools)
      .replace('<body>',`<body class="hero-experiment experiment-${variant.style}${isMosaicPage?' new2-mosaic':''}"${isMosaicPage?' data-mosaic-hero-visible="true"':''}>`)
      .replace(/<title>[^<]*<\/title>/,`<title>Orka · ${variant.name} hero preview</title>`)
      .replace('</head>',`<meta name="robots" content="noindex, follow"><link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script><link rel="preload" as="image" href="/assets/${variant.asset}"></head>`);
    if (isMosaicPage) page = applyMosaicArtwork(page).replace('</head>',`<link rel="stylesheet" href="${mosaicStylesheet}"></head>`);
    await writeFile(path.join(directory,variant.slug+'.html'),page);
  }
}
