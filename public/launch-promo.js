import {openQuestionInChat} from './site-interactions.js';

// This is an owner-maintained customer milestone, never a time-based countdown.
const banner = document.querySelector('[data-launch-banner]');
const card = document.querySelector('[data-launch-card]');
const campaign = banner?.dataset.launchCampaign;
const key = part => `orka-${campaign}-${part}-dismissed`;
const wasDismissed = part => {try {return sessionStorage.getItem(key(part)) === '1';} catch {return false;}};
const remember = part => {try {sessionStorage.setItem(key(part), '1');} catch {}};
let dismissed = wasDismissed('price');
let openingChat = false;
let scheduled = false;
let observedWidget;

function widgetState() {
  const container = document.querySelector('.orka-container');
  const shadow = document.getElementById('orka-launcher')?.shadowRoot;
  const launcher = container?.querySelector('.orka-button') || shadow?.querySelector('.orka-button');
  const bounds = launcher?.getBoundingClientRect();
  const visible = bounds?.width && bounds?.height && getComputedStyle(launcher).visibility !== 'hidden';
  const chatVisible = container && getComputedStyle(container).display !== 'none' && getComputedStyle(container).visibility !== 'hidden' && container.getBoundingClientRect().height > 0;
  return {container, launcher, bounds:visible ? bounds : null, open:!!chatVisible && !container.classList.contains('orka-closed')};
}

function positionCard() {
  scheduled = false;
  if (!card) return;
  const widget = widgetState();
  if (widget.container && widget.container !== observedWidget) {
    observedWidget = widget.container;
    widgetObserver.observe(widget.container, {attributes:true, childList:true, subtree:true, attributeFilter:['class','style']});
    if (widget.launcher) resizeObserver?.observe(widget.launcher);
  }
  card.hidden = dismissed || openingChat || widget.open || !!document.querySelector('dialog[open]');
  if (card.hidden) return;
  const width = card.getBoundingClientRect().width;
  let center = window.innerWidth / 2;
  let bottom = 20;
  if (widget.bounds && center + width / 2 + 16 > widget.bounds.left) {
    const available = widget.bounds.left - 32;
    if (available >= width) center = Math.min(center, widget.bounds.left - 16 - width / 2);
    else bottom = window.innerHeight - widget.bounds.top + 16;
  }
  const left = Math.max(width / 2 + 12, center) + 'px';
  const offset = bottom + 'px';
  // Avoid mutation-observer loops when the desired placement is unchanged.
  if (card.style.getPropertyValue('--launch-left') !== left) card.style.setProperty('--launch-left', left);
  if (card.style.getPropertyValue('--launch-bottom') !== offset) card.style.setProperty('--launch-bottom', offset);
}
function schedulePosition() {if (!scheduled) {scheduled = true; requestAnimationFrame(positionCard);}}
const widgetObserver = new MutationObserver(schedulePosition);
const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedulePosition) : null;
if (banner) {
  banner.hidden = wasDismissed('banner');
  banner.querySelector('[data-dismiss-banner]')?.addEventListener('click', () => {
    banner.hidden = true; remember('banner');
    document.querySelector('.site-header a')?.focus({preventScroll:true});
  });
  banner.querySelector('[data-launch-chat]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const status = banner.querySelector('.launch-chat-status');
    button.disabled = true; openingChat = true; schedulePosition();
    status.hidden = false; status.textContent = 'Opening your chat…';
    try {
      await openQuestionInChat('Hi! I’m here for the Uneed launch offer. Can you help me claim the $5/month discount?');
      status.textContent = 'Your message is ready in the chat. Press Send when you’re ready.';
    } catch {
      status.textContent = 'Chat could not load. Please try again or email hello@orka.chat to claim your discount.';
    } finally {button.disabled = false; openingChat = false; schedulePosition();}
  });
}
if (card) {
  const dismiss = () => {dismissed = true; card.hidden = true; remember('price');};
  card.querySelector('[data-dismiss-launch]')?.addEventListener('click', () => {
    dismiss(); document.querySelector('.site-header a')?.focus({preventScroll:true});
  });
  card.querySelector('[data-launch-plans]')?.addEventListener('click', dismiss);
  card.addEventListener('keydown', event => {if (event.key === 'Escape') {dismiss(); document.querySelector('.site-header a')?.focus({preventScroll:true});}});
  // Discover the async widget and react to its open/closed state, without polling.
  widgetObserver.observe(document.body, {childList:true, attributes:true, attributeFilter:['class','data-mosaic-hero-visible']});
  document.querySelectorAll('dialog').forEach(dialog => widgetObserver.observe(dialog, {attributes:true, attributeFilter:['open']}));
  resizeObserver?.observe(card);
  window.addEventListener('resize', schedulePosition, {passive:true});
  window.addEventListener('scroll', schedulePosition, {passive:true});
  schedulePosition();
}
