// Interactions are local examples; they never send a message or change a project.
const closestPreview = element => element.closest('[data-conversation-preview]');
const setText = (root, selector, text) => root.querySelectorAll(selector).forEach(node => { node.textContent = text; });
function addTag(root) {
 const input = root.querySelector('[data-cfp-add-tag]');
 const value = input.value.trim();
 if (!value) return;
 const list = root.querySelector('[data-cfp-tag-list]');
 if (![...list.children].some(tag => tag.textContent.toLowerCase() === value.toLowerCase())) {
  const tag = document.createElement('span'); tag.textContent = value; list.append(tag);
 }
 input.value = '';
}
function saveReminder(root, time) {
 root.querySelector('[data-cfp-reminder-dialog]').hidden = true;
 root.querySelector('[data-cfp-reminder-saved]').hidden = false;
 setText(root, '[data-cfp-reminder-copy]', `You left a reminder to be sent ${time}`);
 root.querySelector('[data-cfp-change-reminder]').focus();
}
document.addEventListener('click', event => {
 const control = event.target.closest('button');
 if (!control) return;
 const root = closestPreview(control);
 if (!root) return;
 if (control.hasAttribute('data-cfp-add-tag-button')) addTag(root);
 if (control.hasAttribute('data-cfp-urgency')) {
  root.querySelectorAll('[data-cfp-urgency]').forEach(item => item.setAttribute('aria-pressed', String(item===control)));
 }
 if (control.hasAttribute('data-cfp-filter')) {
  root.querySelectorAll('[data-cfp-filter]').forEach(item => item.setAttribute('aria-pressed', String(item===control)));
  setText(root,'[data-cfp-filter-name]', control.dataset.cfpFilter);
  setText(root,'[data-cfp-filter-result]', control.dataset.cfpFilter === 'All' ? 'All conversations' : `${control.dataset.cfpFilter} conversations`);
 }
 if (control.hasAttribute('data-cfp-resolve')) {
  const resolution = root.querySelector('[data-cfp-resolution]');
  const isResolved = !resolution.hidden;
  resolution.hidden = isResolved;
  control.lastChild.textContent = isResolved ? ' Mark as resolved' : ' Reopen conversation';
 }
 if (control.hasAttribute('data-cfp-remind')) {
  const time = control.dataset.cfpRemind;
  if (time==='Custom time') {
   root.querySelector('.cfp-reminder-options').hidden = true;
   root.querySelector('.cfp-custom-reminder').hidden = false;
   root.querySelector('[data-cfp-reminder-date]').focus();
  } else saveReminder(root, `in ${time}`);
 }
 if (control.hasAttribute('data-cfp-set-custom')) {
  const input = root.querySelector('[data-cfp-reminder-date]');
  if (!input.value) { input.focus(); return; }
  const date = new Date(input.value);
  if (Number.isNaN(date.getTime())) return;
  saveReminder(root, `on ${new Intl.DateTimeFormat('en',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date)}`);
 }
 if (control.hasAttribute('data-cfp-change-reminder')) {
  root.querySelector('[data-cfp-reminder-dialog]').hidden = false;
  root.querySelector('[data-cfp-reminder-saved]').hidden = true;
  root.querySelector('.cfp-reminder-options').hidden = false;
  root.querySelector('.cfp-custom-reminder').hidden = true;
  root.querySelector('[data-cfp-remind]').focus();
 }
 if (control.hasAttribute('data-cfp-refresh-summary')) {
  root.querySelector('[data-cfp-summary-saved]').hidden = true;
  root.querySelector('[data-cfp-save-summary]').disabled = false;
  const summary = root.querySelector('.cfp-summary-scroll > p');
  summary.textContent = 'Jamie asked to change the delivery address for order #1048. Judy confirmed it with the warehouse before shipping. The team is waiting for Jamie’s confirmation.';
 }
 if (control.hasAttribute('data-cfp-save-summary')) {
  root.querySelector('[data-cfp-summary-saved]').hidden = false;
  control.disabled = true;
 }
 if (control.hasAttribute('data-cfp-saved-reply')) {
  root.querySelectorAll('[data-cfp-saved-reply]').forEach(item => item.setAttribute('aria-pressed', String(item===control)));
  setText(root,'[data-cfp-draft]',control.dataset.cfpSavedReply);
 }
 if (control.hasAttribute('data-cfp-assign')) {
  root.querySelectorAll('[data-cfp-assign]').forEach(item => item.setAttribute('aria-pressed', String(item===control)));
  setText(root, '[data-cfp-assignee]', control.dataset.cfpAssign);
  const photo = control.querySelector('img').cloneNode(true);
  root.querySelector('.cfp-current-agent img').replaceWith(photo);
 }
 if (control.hasAttribute('data-cfp-assignment-resolve')) {
  control.lastChild.textContent = ' Resolved';
  control.disabled = true;
 }
 if (control.hasAttribute('data-cfp-takeover')) {
  root.querySelector('.cfp-ai-composer').hidden = true;
  root.querySelector('[data-cfp-human-composer]').hidden = false;
  root.querySelector('[data-cfp-human-composer] .cfp-composer').focus();
 }
});
document.addEventListener('keydown', event => {
 if (event.key === 'Enter' && event.target.matches('[data-cfp-add-tag]')) { event.preventDefault(); addTag(closestPreview(event.target)); }
 if (!event.target.closest('.cfp-shortcut-panel')) return;
 const root = closestPreview(event.target);
 const replies = [...root.querySelectorAll('[data-cfp-saved-reply]')].filter(reply => !reply.hidden);
 if (!replies.length) return;
 if (['ArrowDown','ArrowUp'].includes(event.key)) {
  event.preventDefault();
  const currentIndex = replies.indexOf(event.target.closest('[data-cfp-saved-reply]'));
  const nextIndex = currentIndex < 0 ? (event.key==='ArrowDown' ? 0 : replies.length-1) : (currentIndex + (event.key==='ArrowDown' ? 1 : -1) + replies.length) % replies.length;
  root.querySelectorAll('[data-cfp-saved-reply]').forEach(reply => reply.setAttribute('aria-pressed', String(reply === replies[nextIndex])));
  replies[nextIndex].focus();
 }
 if (event.key==='Enter' && event.target.matches('[data-cfp-shortcut-search]')) {
  event.preventDefault();
  (replies.find(reply => reply.getAttribute('aria-pressed')==='true') || replies[0]).click();
 }
});

document.addEventListener('input', event => {
 if (event.target.matches('[data-cfp-shortcut-search]')) {
  const root = closestPreview(event.target);
  const query = event.target.value.trim().toLowerCase().replace(/^\//,'');
  const replies = [...root.querySelectorAll('[data-cfp-saved-reply]')];
  replies.forEach(reply => { reply.hidden = !reply.textContent.toLowerCase().includes(query); reply.setAttribute('aria-pressed','false'); });
  const first = replies.find(reply => !reply.hidden);
  if (first) first.setAttribute('aria-pressed','true');
  root.querySelector('[data-cfp-shortcuts-empty]').hidden = Boolean(first);
  return;
 }
 if (!event.target.matches('[data-cfp-search]')) return;
 const root = closestPreview(event.target);
 const query = event.target.value.trim().toLowerCase();
 let count = 0;
 root.querySelectorAll('[data-cfp-search-result]').forEach(result => { result.hidden = !result.textContent.toLowerCase().includes(query); if (!result.hidden) count++; });
 setText(root, '[data-cfp-search-count]', `${count} conversation${count === 1 ? '' : 's'}`);
});
