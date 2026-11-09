import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writingTools} from '../public/tools-writing.js';

const bySlug = new Map(writingTools.map(tool => [tool.slug,tool]));
const defaults = tool => Object.fromEntries(tool.fields.map(field => [field.key,field.value]));
function run(slug, overrides) {
  const tool = bySlug.get(slug);
  return tool.run({...defaults(tool), ...overrides});
}

test('all six tools work from their published examples, with text output and honest downloads', () => {
  assert.equal(bySlug.size,6);
  for (const tool of writingTools) {
    const result = tool.run(defaults(tool));
    assert.equal(typeof result.headline,'string');
    assert.ok(result.body.length > 20);
    if (result.download) assert.equal(result.download.text,result.body);
    assert.ok(tool.faqs.length >= 3);
  }
});

test('greetings use the chosen language, availability, page and business name', () => {
  const slug = 'chat-welcome-message-generator';
  const result = run(slug,{language:'fr',availability:'offline',page:'pricing',brand:'Port'});
  assert.match(result.body,/Bienvenue chez Port/);
  assert.match(result.body,/formule/);
  assert.match(result.body,/Laissez-nous un message/);
  assert.throws(() => run(slug,{language:'__proto__'}),/valid language/);
  assert.throws(() => run(slug,{brand:'   '}),/business name/);
});

test('ticket grouping counts recurring subjects and preserves conflicting approved answers', () => {
  const slug = 'support-tickets-to-faq-generator';
  const result = run(slug,{tickets:'Need help updating the name?\nWhere is my order? | See your email.\nHow can I track my package? | Visit the tracking page.\n  \n'});
  assert.equal(result.headline,'2 FAQ topics from 3 tickets');
  assert.ok(result.body.startsWith('## Where is my order?\n2 tickets'));
  assert.match(result.body,/Review these different answers/);
  assert.match(result.body,/See your email\./);
  assert.match(result.body,/Visit the tracking page\./);
  assert.match(result.body,/Add a verified answer/);
  assert.throws(() => run(slug,{tickets:'| orphan answer'}),/question before/);
  assert.throws(() => run(slug,{tickets:Array(201).fill('How do I reset?').join('\n')}),/200/);
});

test('a store FAQ includes only supplied sections and preserves all policy conditions', () => {
  const slug = 'shopify-faq-generator';
  const empty = {shipping:'',delivery:'',returns:'',tracking:'',contact:''};
  assert.throws(() => run(slug,empty),/at least one/);
  const result = run(slug,{...empty, store:'Reef', returns:'Unopened items only. Contact us within 12 days.'});
  assert.equal(result.headline,'1 FAQ entry');
  assert.equal(result.body,'# Reef FAQ\n\n## How do I request a return?\n\nUnopened items only. Contact us within 12 days.');
});

test('redactor masks emails, references, IPs, phone, query URL and exact custom terms', () => {
  const result = run('support-conversation-anonymizer',{
    transcript:'Jo (J.M.) senta@example.eu senta@example.eu order number is AB-3124. Call +1 (415) 555-0199. IP 203.0.113.4 / 2001:db8::1. Open https://example.org/?id=private. Date 2026-11-09.',
    extra:'Jo\nJ.M.'
  });
  for(const secret of ['Jo','J.M.','senta@','AB-3124','555-0199','203.0.113.4','2001:db8::1','?id=private']) assert.ok(!result.body.includes(secret),secret);
  assert.match(result.body,/\[EMAIL 1\] \[EMAIL 1\]/);
  assert.match(result.body,/\[IP 2\]/);
  assert.match(result.body,/Date 2026-11-09/);
  assert.match(result.body,/\[LINK 1\]\./);
});

test('translation QA compares localized currencies, multiplicity, exact references and dates', () => {
  const slug = 'support-translation-checker';
  const original = 'HG-2048 due 2026-11-10, €1,249.50. Link https://example.org/x.';
  assert.equal(run(slug,{source:original,translation:'Le 2026-11-10, HG-2048 coûte 1\u202f249,50 EUR. https://example.org/x'}).headline,'All recognized details matched');
  const result = run(slug,{source:'USD 15.00 USD 15.00 #1234',translation:'$15.00 #1234'});
  assert.match(result.body,/USD 15\.00 × 2/);
  assert.match(result.body,/\$ 15\.00/);
  assert.match(run(slug,{source:'Credit -€12.50',translation:'Crédit 12,50 €'}).body,/EUR -12\.50/);
  assert.equal(run(slug,{source:'hello',translation:'bonjour'}).headline,'No supported details found');
});

test('bug report attributes suggestions to agents, preserves missing information and respects explicit expectation', () => {
  const slug = 'chat-transcript-to-bug-report';
  const result = run(slug,{transcript:'[09:15] Customer: I tap Pay.\nThe page is blank.\nAgent: Try a different card.\nReload?',environment:'Mobile Safari',expected:'Payment confirmation.'});
  const sections = result.body.split('## Agent notes and suggestions');
  assert.match(sections[0],/I tap Pay\./);
  assert.match(sections[0],/The page is blank\./);
  assert.match(sections[0],/Mobile Safari/);
  assert.match(sections[0],/Payment confirmation/);
  assert.doesNotMatch(sections[0],/Try a different card|Reload\?/);
  assert.match(sections[1],/Try a different card/);
  assert.match(sections[1],/Reload\?/);
  const sparse = run(slug,{transcript:'Customer: Please help me',environment:'',expected:''}).body;
  assert.match(sparse,/Confirm what should have happened/);
  assert.match(sparse,/Ask the reporter for the steps/);
});

test('translation QA ignores surrounding prose punctuation and preserves literal parentheses in URL paths', () => {
  const slug = 'support-translation-checker';
  const source = 'See (https://example.com/help_a_(feature)).';
  for (const translation of [
    'Voir «https://example.com/help_a_(feature)».',
    'Voir https://example.com/help_a_(feature).',
    '詳しくは（https://example.com/help_a_(feature)）。ご参照ください。'
  ]) assert.equal(run(slug,{source,translation}).headline,'All recognized details matched');
  assert.equal(run(slug,{source,translation:'See https://example.com/help_a_feature.'}).headline,'Review changed details');
});

test('translation QA understands Swiss franc grouping and localized order references', () => {
  const slug = 'support-translation-checker';
  const source = 'Order number 02048, invoice #ABC2049, total CHF 1,249.50';
  const translated = 'Commande n° 02048, facture #ABC2049, total 1’249,50 CHF';
  assert.equal(run(slug,{source,translation:translated}).headline,'All recognized details matched');
  const spanish = run(slug,{source:'Order ID #02048',translation:'Pedido nº 02049'});
  assert.match(spanish.body,/Missing from the translation\nReference · 02048/);
  assert.match(spanish.body,/Appears only in the translation\nReference · 02049/);
  assert.equal(run(slug,{source:'#ABC2048',translation:'#ABC2049'}).headline,'Review changed details');
});
