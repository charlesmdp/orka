// Text entered into these tools is processed in the browser. These functions
// also run at build time with each tool's public, fictional example.
function readText(values, key, label, {optional = false, max = 40000} = {}) {
  const value = String(values[key] ?? '').trim();
  if (!value && !optional) throw new Error('Enter ' + label + ' to continue.');
  if (value.length > max) throw new Error('Shorten ' + label + ' to ' + max.toLocaleString('en-US') + ' characters.');
  return value;
}

function choose(values, key, choices) {
  const value = values[key];
  if (!Object.hasOwn(choices, value)) throw new Error('Choose a valid ' + key + '.');
  return choices[value];
}

function documentResult(headline, body, filename) {
  const type = filename.endsWith('.md') ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
  return {headline, body, download: {filename, text: body, type}};
}

const welcomeCopy = {
  en: {
    greeting: brand => 'Welcome to ' + brand + '!',
    home: 'What can we help you with today?', pricing: 'Which plan are you considering?',
    product: 'What would you like to know about this product?', checkout: 'Do you have a question before you place your order?',
    online: 'Our team is here to chat.', offline: 'Leave us a message and our team will get back to you.'
  },
  fr: {
    greeting: brand => 'Bienvenue chez ' + brand + ' !',
    home: 'Comment pouvons-nous vous aider ?', pricing: 'Quelle formule vous intéresse ?',
    product: 'Que souhaitez-vous savoir sur ce produit ?', checkout: 'Avez-vous une question avant de passer commande ?',
    online: 'Notre équipe est disponible pour en discuter.', offline: 'Laissez-nous un message et notre équipe vous répondra.'
  },
  es: {
    greeting: brand => '¡Te damos la bienvenida a ' + brand + '!',
    home: '¿Cómo podemos ayudarte hoy?', pricing: '¿Qué plan estás considerando?',
    product: '¿Qué te gustaría saber sobre este producto?', checkout: '¿Tienes alguna pregunta antes de hacer tu pedido?',
    online: 'Nuestro equipo está disponible para chatear.', offline: 'Déjanos un mensaje y nuestro equipo te responderá.'
  }
};

const welcome = {
  slug: 'chat-welcome-message-generator', name: 'Chat Welcome Message Generator',
  title: 'Free Live Chat Welcome Message Generator', category: 'Live chat',
  description: 'Write a website chat greeting for your homepage, pricing page, product page or checkout. Choose a language and show when your support team is available.',
  intro: 'Give visitors a question they can answer in one line. Pick the page they are on and whether someone is available to reply.',
  fields: [
    {key: 'brand', label: 'Business name', type: 'text', value: 'Harbor Goods'},
    {key: 'page', label: 'Where the greeting appears', type: 'select', value: 'product', options: [['home','Homepage'],['pricing','Pricing page'],['product','Product page'],['checkout','Checkout']]},
    {key: 'availability', label: 'Team availability', type: 'select', value: 'online', options: [['online','Online'],['offline','Away']]},
    {key: 'language', label: 'Greeting language', type: 'select', value: 'en', options: [['en','English'],['fr','French'],['es','Spanish']]}
  ],
  button: 'Generate welcome message',
  run(values) {
    const brand = readText(values, 'brand', 'your business name', {max: 100});
    const copy = choose(values, 'language', welcomeCopy);
    const question = choose(values, 'page', {home: copy.home, pricing: copy.pricing, product: copy.product, checkout: copy.checkout});
    const availability = choose(values, 'availability', {online: copy.online, offline: copy.offline});
    return documentResult('Your welcome message', [copy.greeting(brand), question, availability].join(' '), 'chat-welcome-message.txt');
  },
  method: 'A live chat greeting works best when the visitor can tell what to do next. This generator combines your business name, one question about the current page and one sentence about availability. Use the product greeting on item pages and the plan question on pricing pages.',
  example: 'Choose Harbor Goods, Product page, Online and English. The greeting asks “What would you like to know about this product?” Switch the page to Checkout and the question changes to “Do you have a question before you place your order?”',
  faqs: [
    ['What should a live chat welcome message say?', 'Greet the visitor, ask one question connected to the page and tell them whether a teammate is available. A shopper comparing plans can answer “Which plan are you considering?” immediately.'],
    ['How do I write a greeting for after business hours?', 'Choose Away. The greeting invites visitors to leave a message for your team. Add a specific reopening time only if your schedule supports it.'],
    ['Can I use different greetings for different languages?', 'Generate a separate English, French or Spanish version with the language selector. Paste each into the corresponding greeting in your chat settings.']
  ]
};

const topicRules = [
  ['tracking', /\b(track(?:ing)?|order status|where(?:'s| is) my (?:order|package|parcel)|has my order shipped)\b/i],
  ['refund timing', /\b(?:where(?:'s| is) my refund|refund (?:time|status)|(?:when|how long).*refund)\b/i],
  ['delivery time', /\b(?:when.*(?:arrive|deliver)|(?:delivery|shipping) (?:times?|speed)|how long.*(?:ship|deliver))\b/i],
  ['password reset', /\b(?:(?:reset|forgot|recover|lost).*password|password reset)\b/i],
  ['invoice download', /\b(?:(?:download|find|get|copy of).*invoice|invoice.*(?:download|find))\b/i],
  ['return request', /\b(?:how (?:do|can) i return|start a return|return (?:an|my|this) (?:item|order))\b/i],
  ['cancel subscription', /\b(?:cancel.*(?:plan|subscription)|unsubscribe)\b/i]
];
const questionStopwords = new Set('a an the how can could i my me do does we you is are to for of it please what where when get'.split(' '));

function ticketWords(question) {
  return new Set((question.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => !questionStopwords.has(word)));
}

function nearQuestion(left, right) {
  let shared = 0;
  for (const term of left) if (right.has(term)) shared++;
  return shared >= 2 && shared / (left.size + right.size - shared) >= 0.6;
}

function ticketsToFaq(values) {
  const text = readText(values, 'tickets', 'at least one ticket subject or question');
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length > 200) throw new Error('Use up to 200 ticket lines per batch.');
  const groups = [];
  for (const line of lines) {
    const divider = line.indexOf('|');
    const question = (divider < 0 ? line : line.slice(0, divider)).trim();
    const answer = divider < 0 ? '' : line.slice(divider + 1).trim();
    if (!question) throw new Error('Add a question before the answer separator on every line.');
    const topic = topicRules.find(([, pattern]) => pattern.test(question))?.[0];
    const words = ticketWords(question);
    let group = groups.find(g => g.question.toLowerCase() === question.toLowerCase() || (topic && g.topic === topic) || (!topic && !g.topic && nearQuestion(g.words, words)));
    if (!group) {
      group = {question, topic, words, count: 0, answers: new Set()};
      groups.push(group);
    }
    group.count++;
    if (answer) group.answers.add(answer);
  }
  groups.sort((a, b) => b.count - a.count);
  const body = groups.map(group => {
    let answer = 'Add a verified answer before publishing.';
    if (group.answers.size === 1) answer = [...group.answers][0];
    if (group.answers.size > 1) answer = 'Review these different answers before publishing:\n' + [...group.answers].map(text => '- ' + text).join('\n');
    return '## ' + group.question + '\n' + group.count + (group.count === 1 ? ' ticket' : ' tickets') + '\n\n' + answer;
  }).join('\n\n');
  return documentResult(groups.length + (groups.length === 1 ? ' FAQ topic' : ' FAQ topics') + ' from ' + lines.length + (lines.length === 1 ? ' ticket' : ' tickets'), body, 'support-ticket-faq.md');
}

const ticketsFaq = {
  slug: 'support-tickets-to-faq-generator', name: 'Support Tickets to FAQ Generator',
  title: 'Free Support Tickets to FAQ Generator', category: 'Knowledge base',
  description: 'Turn support questions into a ranked FAQ draft. Group repeated ticket subjects, count each topic and carry verified answers into a downloadable Markdown file.',
  intro: 'Find the questions worth answering in your help center. Paste one ticket per line and optionally attach an answer your team has already verified.',
  fields: [{key:'tickets',label:'Ticket questions and optional answers',type:'textarea',value:'Where is my order? | Open the tracking link in your dispatch email.\nHow can I track my package?\nHow do I reset my password? | Select Forgot password on the sign-in page.',hint:'One ticket per line, up to 200. Separate a question and its approved answer with |.'}],
  button: 'Build FAQ draft', run: ticketsToFaq,
  method: 'Each nonempty line counts as one ticket. The tool groups exact matches, common English support intents and closely overlapping phrases, then orders topics by frequency. Each heading uses the first question in its group. A group with conflicting answers shows every supplied version for editorial review.',
  example: 'Paste “Where is my order?”, “How can I track my package?” and “How do I reset my password?” on separate lines. The output puts the two tracking tickets first and lists the password ticket separately. Add an approved tracking answer after a vertical bar to include it under the first heading.',
  faqs: [
    ['What is the best input for a ticket-to-FAQ generator?', 'Use one short customer question or ticket subject per line. Remove signatures, customer names and conversation history. Enter separate questions on separate lines.'],
    ['How does the tool decide which question comes first?', 'It counts tickets assigned to each group, then displays the largest group first. Groups with equal counts keep the order in which they first appeared.'],
    ['Where do the FAQ answers come from?', 'Answers come from the text you provide after the vertical bar. An unanswered topic includes a reminder to write a verified answer. Use the ticket counts to decide which topic to write first.'],
    ['Can I publish the file in a help center?', 'Download the Markdown draft, check the grouping and conflicting answers, then remove the internal ticket counts before publishing.']
  ]
};

const policySections = [
  ['shipping', 'When will my order ship?'],
  ['delivery', 'How long does delivery take?'],
  ['returns', 'How do I request a return?'],
  ['tracking', 'How can I track my order?'],
  ['contact', 'How can I contact the store?']
];
const shopifyFaq = {
  slug: 'shopify-faq-generator', name: 'Shopify FAQ Generator', title: 'Free Shopify Store FAQ Generator',
  category: 'Ecommerce', description: 'Generate a Shopify FAQ page from your own shipping, delivery, return, tracking and contact details. Copy the answers or download the FAQ as Markdown.',
  intro: 'Turn your store policies into a customer-facing FAQ. Enter the exact timing, conditions and contact instructions you want customers to see.',
  fields: [
    {key:'store',label:'Store name',type:'text',value:'Harbor Goods'},
    {key:'shipping',label:'Processing and dispatch policy',type:'textarea',value:'We pack orders within two business days.',optional:true},
    {key:'delivery',label:'Delivery estimates by destination',type:'textarea',value:'Standard shipping within France takes 3–5 business days after dispatch.',optional:true},
    {key:'returns',label:'Return terms and how to request one',type:'textarea',value:'Email us within 30 days of delivery with your order number. Items must be unused.',optional:true},
    {key:'tracking',label:'Tracking instructions',type:'textarea',value:'Your dispatch email includes a tracking link.',optional:true},
    {key:'contact',label:'Customer support contact',type:'text',value:'Write to support@example.com and include your order number.',optional:true}
  ],
  button: 'Generate store FAQ',
  run(values) {
    const store = readText(values, 'store', 'your store name', {max:100});
    const sections = policySections.flatMap(([key, heading]) => {
      const answer = readText(values, key, 'the ' + key + ' instructions', {optional:true, max:4000});
      return answer ? ['## ' + heading + '\n\n' + answer] : [];
    });
    if (!sections.length) throw new Error('Enter at least one store policy or contact instruction.');
    return documentResult(sections.length + (sections.length === 1 ? ' FAQ entry' : ' FAQ entries'), '# ' + store + ' FAQ\n\n' + sections.join('\n\n'), 'shopify-store-faq.md');
  },
  method: 'Processing time measures the interval before dispatch. Delivery time measures the interval after dispatch. Keeping the two in separate answers helps shoppers work out when a parcel could arrive. Each completed policy field becomes one question and preserves the conditions exactly as entered.',
  example: 'A store packs orders within two business days and its carrier quotes three to five business days in transit. Enter the packing estimate under processing and the carrier estimate under delivery. The resulting FAQ explains both stages separately.',
  faqs: [
    ['Which policies belong in a Shopify store FAQ?', 'Start with dispatch, delivery, returns and tracking. Include relevant destinations, product exceptions and the channel shoppers should use when they need help.'],
    ['Can I leave a policy field empty?', 'Yes. Enter a store name and at least one policy or contact detail. Only completed topics appear in the downloaded FAQ.'],
    ['How do I put the FAQ on my Shopify store?', 'Create a page in your storefront and copy the questions and answers into its editor. Add a link from the store menu or footer so customers can find it.']
  ]
};

function escapePattern(value) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
}

function anonymize(values) {
  const original = readText(values, 'transcript', 'a conversation');
  const extraTerms = readText(values, 'extra', 'extra terms', {optional:true, max:3000});
  const replacements = new Map();
  let count = 0;
  function token(type, value) {
    let ids = replacements.get(type);
    if (!ids) replacements.set(type, ids = new Map());
    const key = value.toLowerCase();
    if (!ids.has(key)) ids.set(key, ids.size + 1);
    count++;
    return '[' + type + ' ' + ids.get(key) + ']';
  }

  let result = original.replace(/https?:\/\/[^\s<>"']+/gi, value => {
    const url = value.replace(/[.,;!?]+$/, '');
    return token('LINK', url) + value.slice(url.length);
  });
  result = result.replace(/(?<![\p{L}\p{N}._%+'-])[\p{L}\p{N}._%+'-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu, value => token('EMAIL', value));
  result = result.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, value => value.split('.').every(n => Number(n) <= 255) ? token('IP', value) : value);
  result = result.replace(/(?<![\w:])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?![\w:])/gi, value => {
    if (value.length < 2 || /^\d{1,2}:\d{2}:\d{2}$/.test(value)) return value;
    try {
      new URL('http://[' + value + ']/');
      return token('IP', value);
    } catch { return value; }
  });
  result = result.replace(/(\b(?:order|ticket|invoice|reference)\s*(?:(?:number|no\.?|id)\s*)?(?:is\s+)?(?:[:#]\s*)?|#)((?=[a-z\d-]*\d)[a-z\d][a-z\d-]*)\b/gi,
    (match, prefix, id) => id.length >= 3 ? prefix + token('REFERENCE', id) : match);
  result = result.replace(/(?<![\w#])(?:\+?\d|\(\d)[\d() .-]{5,}(?:\d)(?!\w)/g, value => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15 || /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return token('PHONE', value);
  });
  // Match each user-supplied term literally. Longest first preserves multiword names.
  const terms = [...new Set(extraTerms.split(/[\n,]/).map(value => value.trim()).filter(Boolean))].sort((a,b) => b.length-a.length);
  if (terms.length) {
    const pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + terms.map(escapePattern).join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
    // Keep labels inserted by the earlier passes intact.
    result = result.split(/(\[(?:LINK|EMAIL|IP|REFERENCE|PHONE) \d+\])/).map((part, index) => index % 2 ? part : part.replace(pattern, value => token('TERM', value))).join('');
  }
  return documentResult(count + (count === 1 ? ' replacement' : ' replacements') + ' · review before sharing', result, 'redacted-conversation.txt');
}

const anonymizer = {
  slug:'support-conversation-anonymizer', name:'Support Conversation Anonymizer', title:'Free Support Chat Anonymizer & Transcript Redactor',
  category:'AI & writing', description:'Redact emails, web links, common phone numbers, IP addresses and order references in a chat transcript. Add names or addresses and review the result locally.',
  intro:'Prepare a chat excerpt for a bug report or training session. Paste the transcript and add any identifying names or details that should disappear.',
  fields:[
    {key:'transcript',label:'Chat transcript',type:'textarea',value:'Maya: My order #HG2048 went to jo@example.com. Could you help?'},
    {key:'extra',label:'Names and other exact terms to mask',type:'textarea',value:'Maya',optional:true,hint:'One term per line or separated by commas. Include company names, street addresses and unusual account IDs.'}
  ],
  button:'Redact conversation', run:anonymize,
  method:'The redactor looks for common identifier patterns and replaces each match with a numbered label. Repeated matches of the same kind get the same label, so you can follow the exchange. Add names, street addresses and company-specific identifiers yourself, then read the entire result for indirect identifiers before sharing.',
  example:'Paste “Maya: My order #HG2048 went to jo@example.com” and add Maya under extra terms. The name becomes [TERM 1], HG2048 becomes [REFERENCE 1] and the email becomes [EMAIL 1]. A second appearance of that email reuses [EMAIL 1].',
  faqs:[
    ['Does the redactor upload my conversation?', 'The redaction runs in your browser. The tool reads the pasted text to build the result locally and generates the text download on your device.'],
    ['How do I redact a name or a street address?', 'Enter the exact phrase under extra terms. Matching ignores case and treats punctuation literally. Add alternative spellings separately.'],
    ['Is automatic redaction enough to share a conversation publicly?', 'Review the result first. A rare incident, employer, exact date or unusual account reference can identify someone through context even after their email and name have been removed.']
  ]
};

// Match the same numeric notation before and after the currency.
const moneyNumber = String.raw`\d+(?:[.,]\d+|[ '’\u00a0\u202f]\d{3}(?!\d))*`;
const moneyUnit = String.raw`(?:US\$|CA\$|A\$|NZ\$|USD|EUR|GBP|CAD|AUD|NZD|CHF|[$€£])`;
const signedNumber = '(?:[−-]\\s*)?' + moneyNumber;
const moneyPattern = new RegExp('(?<![\\w.,])(?:[−-]?' + moneyUnit + '\\s*' + signedNumber + '|' + signedNumber + '\\s*' + moneyUnit + ')', 'gi');
const currencyAliases = {'€':'EUR','£':'GBP','US$':'USD','CA$':'CAD','A$':'AUD','NZ$':'NZD'};

function normalizeMoney(value) {
  const match = value.match(new RegExp(moneyUnit, 'i'))[0].toUpperCase();
  const sign = /[−-]/.test(value) ? '-' : '';
  const number = value.replace(new RegExp(moneyUnit,'i'),'').replace(/[\s'’−-]/gu, '');
  const last = Math.max(number.lastIndexOf('.'), number.lastIndexOf(','));
  // Supported currencies use cents. One or two trailing digits are fractional.
  const hasCents = last >= 0 && number.length - last <= 3;
  const whole = (hasCents ? number.slice(0,last) : number).replace(/[.,]/g,'').replace(/^0+(?=\d)/,'');
  const cents = hasCents ? number.slice(last + 1).padEnd(2, '0') : '00';
  return (currencyAliases[match] || match) + ' ' + sign + whole + '.' + cents;
}

function linkInProse(value) {
  const link = value.replace(/[.,;!?]+$/, '');
  const opens = (link.match(/\(/g) || []).length;
  const closes = (link.match(/\)/g) || []).length;
  const trailing = link.match(/\)+$/)?.[0].length || 0;
  const extra = Math.min(trailing, Math.max(0, closes - opens));
  return extra ? link.slice(0, -extra) : link;
}

function protectedDetails(text) {
  const items = new Map();
  function collect(regex, kind, normalize = value => value) {
    text = text.replace(regex, match => {
      const display = normalize(match);
      const key = kind + '\n' + display;
      const entry = items.get(key) || {kind, display, count:0};
      entry.count++;
      items.set(key, entry);
      return ' ';
    });
  }
  collect(/https?:\/\/[^\s<>"'“”‘’«»。、，；！？【】（）]+/gi, 'URL', linkInProse);
  collect(/(?<![\p{L}\p{N}._%+'-])[\p{L}\p{N}._%+'-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu,'Email');
  collect(/\b\d{4}-\d{2}-\d{2}\b/g,'ISO date');
  collect(moneyPattern,'Amount', normalizeMoney);
  collect(/\b(?:order|commande|pedido|bestellung)\s+(?:id|number|no\.?|n[°º]|numéro|número|nr\.?)\s*:?\s*#?\d+\b/gi,
    'Reference', value => value.match(/\d+$/)[0]);
  collect(/#[a-zA-Z\d-]*\d[a-zA-Z\d-]*\b|\b[A-Z]{2,8}-[A-Z0-9-]*\d[A-Z0-9-]*\b|\b(?:SKU|INV|ORD|REF)\d[\dA-Z-]*\b/g,
    'Reference', value => value.replace(/^#/, ''));
  return items;
}

function checkTranslation(values) {
  const source = protectedDetails(readText(values, 'source', 'the original message'));
  const target = protectedDetails(readText(values, 'translation', 'the translation'));
  if (!source.size && !target.size) return {headline:'No supported details found',body:'The texts contain no recognized amounts, URLs, emails, references or ISO dates. Read the translated prose separately to check its meaning and tone.'};
  const missing = [];
  const added = [];
  let preserved = 0;
  for (const key of new Set([...source.keys(), ...target.keys()])) {
    const originalCount = source.get(key)?.count || 0;
    const translatedCount = target.get(key)?.count || 0;
    const item = source.get(key) || target.get(key);
    const delta = originalCount - translatedCount;
    const summary = item.kind + ' · ' + item.display + (Math.abs(delta) > 1 ? ' × ' + Math.abs(delta) : '');
    if (delta > 0) missing.push(summary);
    if (delta < 0) added.push(summary);
    preserved += Math.min(originalCount, translatedCount);
  }
  const sections = [preserved + ' matching ' + (preserved === 1 ? 'detail' : 'details') + ' across both texts.'];
  if (missing.length) sections.push('Missing from the translation\n' + missing.join('\n'));
  if (added.length) sections.push('Appears only in the translation\n' + added.join('\n'));
  return {headline: missing.length || added.length ? 'Review changed details' : 'All recognized details matched', body:sections.join('\n\n')};
}

const translation = {
  slug:'support-translation-checker', name:'Support Translation Checker', title:'Free Customer Support Translation Checker',
  category:'AI & writing', description:'Compare an original support reply with a translation for changed prices, links, order references, email addresses and ISO dates. See each missing or added detail.',
  intro:'Check the details a translation should preserve before sending a support reply. Paste both versions to compare amounts, links, references and dates side by side.',
  fields:[
    {key:'source',label:'Original support reply',type:'textarea',value:'Order HG-2048 costs €49.90. Track it at https://example.com/track/HG-2048.'},
    {key:'translation',label:'Translated reply',type:'textarea',value:'La commande HG-2048 coûte 49,09 €. Suivez-la sur https://example.com/track/HG-2048.'}
  ],
  button:'Compare details', run:checkTranslation,
  method:'The checker counts recognized values in each version, including repeats. It normalizes decimal commas, thousands separators and supported currency symbols before matching prices. It compares the spelling of links, email addresses, order codes and YYYY-MM-DD dates literally.',
  example:'An original reply says “Order HG-2048 costs €49.90.” A French draft says “La commande HG-2048 coûte 49,09 €.” The reference matches, but the tool reports EUR 49.90 missing and EUR 49.09 added. Correcting the amount to 49,90 € clears the discrepancy.',
  faqs:[
    ['Does it check whether a translation is fluent?', 'It checks specific values that should survive translation. Ask a fluent reviewer to assess tone, grammar and whether the reply still communicates the intended meaning.'],
    ['Can it match a price written with a decimal comma?', 'Yes. For example, €1,249.50 and 1 249,50 EUR match. Supported currencies include EUR, USD, GBP, CAD, AUD, NZD and CHF. A bare dollar sign stays distinct from a named currency because several countries use it.'],
    ['Which order numbers and dates can it detect?', 'It recognizes common forms such as #2048, HG-2048 and SKU2048, numeric references labeled “order number”, “commande n°” or “pedido nº”, and dates written as YYYY-MM-DD. Unlabeled numbers and dates written out in words need a manual check.']
  ]
};

function bugReport(values) {
  const raw = readText(values, 'transcript', 'the chat transcript');
  const suppliedContext = readText(values, 'environment', 'environment details', {optional:true,max:1000});
  const suppliedExpected = readText(values, 'expected', 'the expected behavior', {optional:true,max:2000});
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const customerLines = [];
  const agentLines = [];
  let speaker = 'customer';
  for (let line of lines) {
    line = line.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s+/, '');
    const label = line.match(/^(agent|support|teammate|customer|client|reporter|user|visitor)\s*:\s*/i);
    if (label) {
      speaker = /^(agent|support|teammate)$/i.test(label[1]) ? 'agent' : 'customer';
      line = line.slice(label[0].length).trim();
    }
    if (line) (speaker === 'agent' ? agentLines : customerLines).push(line);
  }
  const reporterText = customerLines.flatMap(line => line.split(/(?<=[.!?])\s+(?=[A-Z])/));
  const symptoms = reporterText.filter(line => /\b(?:error|crash(?:es|ed)?|fail(?:ed|s|ure)?|blank|frozen|freez(?:e|es)|stuck|spinning|hangs|missing|disappear(?:s|ed)?|instead|unexpected|nothing happens|incorrect|wrong|unable|cannot|can't|won't|doesn't|not working|never|didn't)\b/i.test(line));
  const actions = reporterText.filter(line => /\b(?:open(?:ed)?|click(?:ed)?|tap(?:ped)?|select(?:ed)?|press(?:ed)?|typ(?:e|ed)|cho(?:ose|se)|sign(?:ed)? in|reload(?:ed)?|submit(?:ted)?|swip(?:e|ed)|drag(?:ged)?|refresh(?:ed)?|upload(?:ed)?|add(?:ed)?|attach(?:ed)?)\b/i.test(line) && !/\?\s*$/.test(line));
  const environments = reporterText.filter(line => /\b(?:iOS|Android|Safari|Chrome|Firefox|Edge|Windows|macOS|Linux|iPad|iPhone|Pixel|version\s+\d)\b/i.test(line));
  const expectations = reporterText.filter(line => /\b(?:expected?|should|supposed to)\b/i.test(line));
  const unique = input => [...new Set(input)];
  const list = (input, empty) => input.length ? unique(input).map(item => '- ' + item).join('\n') : empty;
  let title = symptoms[0] || 'Customer-reported issue';
  if (title.length > 105) title = title.slice(0,102).trimEnd() + '…';
  const report = [
    '# ' + title,
    '## Environment\n' + list([suppliedContext, ...environments].filter(Boolean), 'Confirm the device, browser or app version.'),
    '## Reported actions, in conversation order\n' + list(actions, 'Ask the reporter for the steps that led to the issue.'),
    '## Observed behavior\n' + list(symptoms, customerLines.length ? 'Review the reporter’s first statement: ' + customerLines[0] : 'Ask the reporter what they saw.'),
    '## Expected behavior\n' + list(suppliedExpected ? [suppliedExpected] : expectations, 'Confirm what should have happened.'),
  ];
  if (agentLines.length) report.push('## Agent notes and suggestions\n' + list(agentLines, ''));
  return documentResult('Bug report draft', report.join('\n\n'), 'support-bug-report.md');
}

const bug = {
  slug:'chat-transcript-to-bug-report',name:'Chat Transcript to Bug Report',title:'Free Chat Transcript to Bug Report Generator',
  category:'AI & writing',description:'Turn a customer support conversation into a Markdown bug report with quoted actions, observed behavior, environment and expected results for GitHub or Linear.',
  intro:'Hand engineering the evidence already in a support chat. Label customer and agent lines, then review the extracted steps and the details that still need confirmation.',
  fields:[
    {key:'transcript',label:'Support conversation',type:'textarea',value:'Customer: I am using Safari on iOS 18.\nCustomer: I open the cart and tap Checkout.\nCustomer: The page stays blank.\nAgent: Could you try a private window?',hint:'Put each message on its own line. Use Customer: and Agent: so suggestions are attributed correctly.'},
    {key:'environment',label:'Confirmed device or app version',type:'text',value:'',optional:true,hint:'Add information your team confirmed outside the chat.'},
    {key:'expected',label:'Confirmed expected result',type:'text',value:'The payment screen should open.',optional:true}
  ],
  button:'Draft bug report',run:bugReport,
  method:'The tool scans reporter statements for common English action verbs, symptoms and environment terms. It quotes matching statements in their original order and keeps agent suggestions in a separate section. If you supply an expected result, that takes precedence over expectations inferred from the conversation.',
  example:'A customer writes “I open the cart and tap Checkout” and “The page stays blank.” The generated report puts the first quote under reported actions and the second under observed behavior. An agent’s suggestion to try a private window appears under agent notes until someone confirms the outcome.',
  faqs:[
    ['Which transcript format works best?', 'Use one English message per line, beginning with Customer: or Agent:. Visitor:, User:, Reporter:, Teammate: and Support: are recognized too. Each unlabeled continuation follows the preceding speaker.'],
    ['Does it confirm that a bug can be reproduced?', 'The draft records the steps reported in the chat. An engineer can repeat those actions and add the actual reproduction result to the issue.'],
    ['How do I use the result in GitHub or Linear?', 'Copy the Markdown into the issue description or download the .md file. Check the quotes, remove customer identifiers and fill the outstanding questions before assigning the issue.']
  ]
};

export const writingTools = [welcome, ticketsFaq, shopifyFaq, anonymizer, translation, bug];
