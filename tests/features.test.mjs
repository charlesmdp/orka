import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matchesFeature} from '../public/features.js';

const html = await readFile(new URL('../public/features.html', import.meta.url), 'utf8');

test('feature search combines category and all search words, ignoring case and accents', () => {
  assert.equal(matchesFeature('Two-way translation for cafés', 'ai', ' CAFÉ translation ', 'all'), true);
  assert.equal(matchesFeature('Two-way translation', 'ai', 'translation', 'context'), false);
  assert.equal(matchesFeature('Two-way translation', 'ai', 'translation visitor', 'ai'), false);
  assert.equal(matchesFeature('Live visitor map', 'context', '  ', 'context'), true);
});

test('the catalogue covers the original feature inventory and every audience recommendation resolves', () => {
  const covered = new Set([...html.matchAll(/data-source-features="([^"]*)"/g)].flatMap(match => match[1].split(' ').filter(Boolean)));
  for (let number = 1; number <= 38; number++) assert.ok(covered.has(String(number)), `Missing original feature ${number}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Page anchors must be unique');
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Broken anchor ${match[1]}`);
  for (const audience of ['solo', 'team', 'legal', 'shop', 'saas', 'agency']) {
    assert.ok(html.includes(`data-audience="${audience}"`));
    assert.ok(html.includes(`data-audience-story="${audience}"`));
  }
  for (const feature of ['help-center', 'multilingual-help', 'custom-orky', 'visitor-cart', 'ai-shortcuts']) {
    assert.ok(ids.includes(`feature-${feature}`), `Missing additional feature ${feature}`);
  }
});

test('all account calls to action use the requested signup and login destinations', async () => {
  for (const page of ['index', 'features', 'terms', 'privacy', 'cookies']) {
    const source = await readFile(new URL(`../public/${page}.html`, import.meta.url), 'utf8');
    const links = [...source.matchAll(/<a\b[^>]*href="([^"]*(?:dashboard|app)\.orka\.chat[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.ok(links.length >= 2, `${page} needs account navigation`);
    for (const [, href, label] of links) {
      assert.equal(href, /log\s*in/i.test(label) ? 'http://dashboard.orka.chat/' : 'http://dashboard.orka.chat/signup', `${page}: ${label}`);
    }
  }
});
