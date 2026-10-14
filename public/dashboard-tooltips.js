// One accessible tooltip layer for every copy of a dashboard composer.
// Appending to the document/top layer keeps cards and preview overflow from clipping it.
const descriptions = {
  hi: ['Say Hi', 'Say hi, introduce yourself, and ask how you can help. A short, friendly introduction in your own name.', 'Hi Alex! Emma here — how can I help you today?'],
  bye: ['Say Bye', 'Wrap up warmly and remind them they can come back for help.', 'You’re very welcome! If anything else comes up, we’re right here. Have a lovely day!'],
  chat: ['Chit Chat', 'Start a short, friendly conversation using the visitor’s location. You can customize the tone and instructions.', 'How are things in London today?'],
  weather: ['Weather', 'Start a light conversation about the visitor’s local weather, using their location.', 'Hope you’re enjoying the sunshine in London today!'],
  answer: ['AI Answer', 'Draft an answer using the conversation and your connected knowledge. Review it, make it yours, then send.'],
  summary: ['Summarize', 'Create a concise recap using the conversation history. Catch up on the question, what has been tried, and what needs to happen next.'],
  assistance: ['Additional Assistance', 'Offer a little extra help with a friendly follow-up. Customize the wording to suit your team.'],
  time: ['Buy Time', 'Politely ask for a little more time while you prepare a helpful response.'],
  understanding: ['Confirm Understanding', 'Use the conversation context to repeat the key details and check you understood the visitor correctly.'],
  empathy: ['Express Empathy', 'Show understanding and care with a warm, empathetic message.'],
  apologize: ['Apologize Deeply', 'Draft a sincere apology. You choose the words before sending.'],
  email: ['Confirm Email', 'Ask the visitor to confirm their email address.'],
  review: ['Ask for a Review', 'Thank the visitor and ask for a review in a friendly, personal way.'],
  suggest: ['Suggest a reply', 'Writes a reply from the whole conversation and your knowledge base, to a question or a simple hello. You review it before sending.']
};
const labels = new Map(Object.entries(descriptions).map(([key, [label]]) => [label.toLowerCase(), key]));
labels.set('say hello', 'hi');
labels.set('say goodbye', 'bye');
labels.set('draft an answer', 'answer');
const sparkle = '<svg class="dashboard-ai-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3M20 2v4M18 4h4"/></svg>';
const selector = '[data-dashboard-tip],[data-copilot-shortcut],[data-quick-action],[data-copilot-suggest],[data-bento-suggest],.demo-suggest,.composer-suggestion,.composer-quick-actions>span,.dp-shortcuts .dp-pill,.fv-tags .fv-chip';

function decorate(root) {
  const controls = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  for (let control of controls) {
    if (control.dataset.dashboardTipReady) continue;
    const label = control.textContent.trim().replace(/^[^a-z]+/i, '').replace(/[↗↑]+$/, '').trim().toLowerCase();
    const key = control.dataset.dashboardTip || control.dataset.copilotShortcut || control.dataset.quickAction || (control.matches('[data-copilot-suggest],[data-bento-suggest],.demo-suggest,.composer-suggestion') ? 'suggest' : labels.get(label));
    if (!descriptions[key]) continue;
    // Static replicas become real focusable controls. Existing demo buttons retain handlers.
    if (!control.matches('button')) {
      const button = document.createElement('button');
      for (const attribute of control.attributes) button.setAttribute(attribute.name, attribute.value);
      button.type = 'button';
      button.append(...control.childNodes);
      control.replaceWith(button);
      control = button;
    }
    control.dataset.dashboardTip = key;
    control.dataset.dashboardTipReady = 'true';
    control.setAttribute('aria-description', descriptions[key][1]);
    if (control.getAttribute('aria-describedby') === 'copilot-bye-tooltip') control.removeAttribute('aria-describedby');
    if (key === 'suggest') {
      const glyph = control.querySelector('svg,.plain-ai-badge');
      if (glyph) glyph.outerHTML = sparkle;
      else control.insertAdjacentHTML('afterbegin', sparkle);
    }
    // A preview containing buttons is a labelled group, rather than an opaque image.
    control.closest('.product-preview[role="img"]')?.setAttribute('role', 'group');
  }
}

const tip = document.createElement('div');
tip.className = 'dashboard-action-tooltip';
tip.id = 'dashboard-action-tooltip';
tip.setAttribute('role', 'tooltip');
tip.setAttribute('popover', 'manual');
tip.hidden = true;
document.body.append(tip);
document.documentElement.dataset.dashboardTooltips = 'ready';
decorate(document);
new MutationObserver(records => {
  for (const record of records) for (const node of record.addedNodes) {
    if (node.nodeType === 1 && node !== tip && !tip.contains(node)) decorate(node);
  }
}).observe(document.body, {childList:true, subtree:true});

let current = null;
let pinned = null;
let closeTimer;
function clearClose() { window.clearTimeout(closeTimer); }
function hide() {
  clearClose();
  if (current) {
    const ids = (current.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== tip.id);
    if (ids.length) current.setAttribute('aria-describedby', ids.join(' '));
    else current.removeAttribute('aria-describedby');
  }
  if (tip.matches(':popover-open')) tip.hidePopover();
  tip.hidden = true;
  current = pinned = null;
}
function place() {
  if (!current) return;
  const target = current.getBoundingClientRect();
  const box = tip.getBoundingClientRect();
  const margin = 12;
  const left = Math.max(margin, Math.min(innerWidth - box.width - margin, target.left + target.width / 2 - box.width / 2));
  const above = target.top - box.height - 10;
  const top = above >= margin ? above : Math.min(innerHeight - box.height - margin, target.bottom + 10);
  tip.style.left = `${left}px`;
  tip.style.top = `${Math.max(margin, top)}px`;
}
function show(control) {
  clearClose();
  if (current === control && !tip.hidden) return;
  hide();
  current = control;
  const key = control.dataset.dashboardTip;
  const [title, description, example] = descriptions[key];
  tip.dataset.kind = key;
  tip.replaceChildren();
  if (key !== 'suggest') {
    const heading = document.createElement('div');
    heading.className = 'dashboard-tip-heading';
    const glyph = control.querySelector('svg');
    if (glyph) {
      const icon = document.createElement('span');
      icon.className = 'dashboard-tip-icon';
      icon.append(glyph.cloneNode(true));
      heading.append(icon);
    }
    const strong = document.createElement('strong');
    strong.textContent = title;
    const badge = document.createElement('span');
    badge.className = 'dashboard-tip-badge';
    badge.textContent = key === 'summary' ? 'Private summary' : 'AI draft';
    heading.append(strong, badge);
    tip.append(heading);
  }
  const copy = document.createElement('p');
  copy.textContent = description;
  tip.append(copy);
  if (example) {
    const block = document.createElement('blockquote');
    const label = document.createElement('span');
    label.textContent = 'Example';
    const text = document.createElement('p');
    text.textContent = example;
    block.append(label, text);
    tip.append(block);
  }
  if (key !== 'suggest') {
    const foot = document.createElement('small');
    foot.textContent = key === 'summary' ? 'A private recap. Only your team can see it.' : 'Creates a draft. You review and send as yourself.';
    tip.append(foot);
  }
  const ids = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  ids.add(tip.id);
  control.setAttribute('aria-describedby', [...ids].join(' '));
  tip.hidden = false;
  if (typeof tip.showPopover === 'function') tip.showPopover();
  place();
}
function trigger(event) { return event.target.closest?.('[data-dashboard-tip-ready]'); }
document.addEventListener('pointerover', event => {
  if (event.pointerType === 'touch') return;
  const control = trigger(event);
  if (control) show(control);
  if (tip.contains(event.target)) clearClose();
});
document.addEventListener('pointerout', event => {
  if (pinned || tip.contains(event.relatedTarget) || current?.contains(event.relatedTarget)) return;
  if (trigger(event) || tip.contains(event.target)) closeTimer = window.setTimeout(hide, 120);
});
document.addEventListener('focusin', event => { const control = trigger(event); if (control) show(control); });
document.addEventListener('focusout', event => {
  if (!pinned && trigger(event)) closeTimer = window.setTimeout(hide, 120);
});
document.addEventListener('click', event => {
  const control = trigger(event);
  if (control) {
    if (pinned === control) hide();
    else { show(control); pinned = control; }
  } else if (!tip.contains(event.target)) hide();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
window.addEventListener('resize', place);
window.addEventListener('scroll', event => { if (!tip.contains(event.target)) hide(); }, true);
