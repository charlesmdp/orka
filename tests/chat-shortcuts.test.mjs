import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Run the actual shortcut event handlers without opening a browser preview.
const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shortcutSource = source.split('// These shortcuts only edit')[1].split('// A floating messenger demo.')[0];
const keys = [...html.matchAll(/data-quick-action="([^"]+)"/g)].map(match => match[1]);
function element(dataset={}) {
  return {dataset, textContent:'', value:'', disabled:false, attributes:{}, handlers:{},
    addEventListener(type, fn){this.handlers[type]=fn;},
    setAttribute(name, value){this.attributes[name]=value;},
    append(...children){this.children=children;},
    after(child){this.result=child;}, remove(){}
  };
}
function setup() {
  const nodes = new Map();
  const buttons = keys.map(quickAction=>element({quickAction}));
  const get = selector => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  };
  vm.runInNewContext('// These shortcuts only edit'+shortcutSource, {
    $:get, $$:()=>buttons, document:{createElement:()=>element()}
  });
  return {get, click:key=>buttons.find(button=>button.dataset.quickAction===key).handlers.click()};
}

test('every visible shortcut updates the context and draft, including Weather', () => {
  const {get,click}=setup();
  const drafts = new Set();
  for (const key of keys) {
    assert.doesNotThrow(()=>click(key), `The ${key} button must be wired to a draft`);
    assert.ok(get('#quick-action-draft').value.trim());
    assert.ok(get('#quick-context-message').textContent.trim());
    drafts.add(get('#quick-action-draft').value);
  }
  assert.equal(drafts.size, keys.length);
  click('weather');
  assert.match(get('#quick-action-title').textContent, /weather/i);
  assert.match(get('#quick-action-draft').value, /weather where you are/i);
  assert.equal(get('[data-quick-send]').disabled, false);
  get('[data-quick-send]').handlers.click();
  assert.match(get('.quick-chat-context').result.children[1].textContent, /weather/i);
  assert.equal(get('[data-quick-send]').disabled, true);
});

test('editing a summary keeps it private and Weather switches back to a reply', () => {
  const {get,click}=setup();
  click('summary');
  get('#quick-action-draft').value='Edited private recap';
  get('#quick-action-draft').handlers.input();
  assert.match(get('#quick-action-status').textContent, /stays private/);
  get('[data-quick-send]').handlers.click();
  assert.match(get('.quick-chat-context').result.className, /private/);
  click('weather');
  assert.equal(get('#quick-composer-mode').textContent, '↩ Reply');
  assert.match(get('[data-quick-send]').textContent, /Send as Charles/);
});
