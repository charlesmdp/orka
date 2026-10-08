import {featureVisual} from './feature-visuals.mjs';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const symbols = {conversations:'◌',team:'◎',ai:'✧',context:'◉','help-center':'▤',boundaries:'◷',widget:'◒',setup:'↗'};
const links = {ai:['/ai#human-handoff','Explore Orky AI'], 'help-center':['/help-center','Explore the help center']};

// Use the same catalogue for the visible feature page, AI knowledge and product facts.
export function refreshFeatureCatalogue(html, catalogue) {
  for (const [category,title,description,number] of catalogue.categories) {
    const features = catalogue.features.filter(feature => feature[1] === category);
    const cards = features.map(([id,,name,copy,audiences,source,plan]) => {
      const more = id === 'sdk' || id === 'custom-data' || id === 'api-limits' ? ['/sdk','Explore the SDK'] : links[category];
      const extra = id === 'mobile' ? '<a href="/ios-app">Orka for iOS ↗</a> · <a href="/android-app">Orka for Android ↗</a>' : more ? `<a href="${more[0]}">${more[1]} ↗</a>` : '';
      const visual = featureVisual(id,category);
      return `<article class="catalogue-card" id="feature-${id}" data-feature-card data-category="${category}" data-audiences="${audiences}" data-source-features="${source}">${visual || `<span class="feature-card-symbol" aria-hidden="true">${symbols[category]}</span>`}<h4>${escape(name)}</h4><p>${escape(copy)}${extra?' '+extra:''}</p>${plan?`<span class="feature-plan">${escape(plan)}</span>`:''}<span class="feature-fit" hidden>Useful for your setup</span></article>`;
    }).join('');
    const group = `<section class="catalogue-group" data-feature-group="${category}" aria-labelledby="category-${category}"><div class="catalogue-group-title"><span>${number}</span><div><h3 id="category-${category}">${escape(title)}</h3><p>${escape(description)}</p></div></div><div class="feature-card-grid">${cards}</div></section>`;
    const pattern = new RegExp(`<section class="catalogue-group" data-feature-group="${category}"[\\s\\S]*?</section>`);
    if (!pattern.test(html)) throw new Error(`Missing feature group: ${category}`);
    html = html.replace(pattern, group);
    html = html.replace(new RegExp(`(data-category="${category}" aria-pressed="(?:true|false)">[^<]*<span>)\\d+(</span>)`), `$1${features.length}$2`);
  }
  if (!html.includes('href="feature-visuals.css"')) html=html.replace('</head>','<link rel="stylesheet" href="feature-visuals.css"></head>');
  return html.replace(/(id="feature-result-count"[^>]*>)\d+ features/, `$1${catalogue.features.length} features`).replace(/(data-category="all" aria-pressed="(?:true|false)">[^<]*<span>)\d+(<\/span>)/, `$1${catalogue.features.length}$2`);
}
