import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {widgetBody, widgetPreview} from '../scripts/dashboard-previews.mjs';

const interactionSource = await readFile(new URL('../public/widget-help.js', import.meta.url), 'utf8');

test('widget help actions remain isolated from the surrounding public help-center demo', () => {
  // The help-center page nests the widget inside an independently interactive
  // article browser. Its delegated listeners own data-help-article/back/search.
  for (const content of [widgetBody({help: true}), interactionSource]) {
    assert.doesNotMatch(content, /\bdata-help-(?:article|back|search|results|collection)\b/);
    assert.match(content, /data-widget-help-search/);
    assert.match(content, /data-widget-help-collection/);
  }
  assert.match(interactionSource, /dataset\.widgetHelpArticle/);
  assert.match(interactionSource, /dataset\.widgetHelpBack/);
});

test('opening Help never removes the configured message mode or banner', () => {
  for (const [options, expected] of [
    [{}, 'Hello, how can we help you?'],
    [{offline: true}, 'Leave us a message'],
    [{banner: 'night'}, '11:49 PM'],
    [{banner: 'break'}, 'having a break'],
    [{banner: 'panic'}, 'A little emergency needs our attention.'],
    [{help: true}, 'Hello, how can we help you?']
  ]) {
    const html = widgetBody(options);
    assert.ok(html.includes(expected));
    assert.equal((html.match(/role="tab"/g) || []).length, 2);
    assert.equal((html.match(/role="tabpanel"/g) || []).length, 2);
    assert.match(html, /data-widget-panel="messages"/);
    assert.match(html, /data-widget-panel="help"/);
    assert.match(html, /data-widget-help-chat/);
    assert.doesNotMatch(html, /<form\b|type="submit"/);
    // IDs are assigned per instance by the enhancer, avoiding duplicates when
    // the same widget is used in the catalogue, tour and website dialog.
    assert.doesNotMatch(html, /\bid="/);
  }
  assert.match(widgetPreview({help: true}), /role="group"/);
});
