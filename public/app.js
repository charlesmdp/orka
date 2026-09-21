const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.documentElement.dataset.brandTheme = 'green';
try { localStorage.removeItem('orka-brand-theme'); } catch {}

const menuButton = $('.mobile-menu');
const mobileNav = $('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menuButton.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
  mobileNav.hidden = !willOpen;
});
$$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const orkySampleReply = "Absolutely! Open a meal and choose Save meal. It will be ready to add again from your saved meals.";
const draftMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let draftTimer, draftWords = [], draftPosition = 0, draftVisible = false, draftStarted = false;
function stopDraftWriting() {
  clearTimeout(draftTimer);
  draftTimer = null;
  draftWords = [];
  $('#orky-draft').setAttribute('aria-busy', 'false');
}
function finishDraftWriting() {
  stopDraftWriting();
  $('#orky-draft-badge').textContent = 'NOT SENT';
  $('[data-orky-send]').disabled = !$('#orky-draft').value.trim();
  $('#copilot-status').textContent = 'Your draft is ready. Review it, then send.';
}
function writeNextDraftWord() {
  draftTimer = null;
  if (!draftWords.length || !draftVisible || document.hidden) return;
  draftPosition++;
  $('#orky-draft').value = draftWords.slice(0, draftPosition).join(' ');
  if (draftPosition >= draftWords.length) finishDraftWriting();
  else draftTimer = setTimeout(writeNextDraftWord, 95);
}
function resetCopilot() {
  stopDraftWriting();
  draftStarted = true;
  $('#orky-composer').hidden = false;
  $('#copilot-sent').hidden = true;
  if (draftMotion.matches) {
    $('#orky-draft').value = orkySampleReply;
    finishDraftWriting();
    return;
  }
  $('#orky-draft').value = '';
  $('#orky-draft').setAttribute('aria-busy', 'true');
  $('#orky-draft-badge').textContent = 'WRITING…';
  $('[data-orky-send]').disabled = true;
  $('#copilot-status').textContent = 'Orky is writing a draft for you…';
  draftWords = orkySampleReply.split(' ');
  draftPosition = 0;
  writeNextDraftWord();
}
function syncDraftWriting() {
  clearTimeout(draftTimer);
  draftTimer = null;
  if (!draftVisible || document.hidden) return;
  if (!draftStarted) resetCopilot();
  else if (draftWords.length) writeNextDraftWord();
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    draftVisible = entries[0].isIntersecting;
    syncDraftWriting();
  }, {threshold:.3}).observe($('.copilot-surface'));
} else {
  draftVisible = true;
  resetCopilot();
}
document.addEventListener('visibilitychange', syncDraftWriting);
draftMotion.addEventListener('change', () => {
  if (draftMotion.matches && draftWords.length) {
    $('#orky-draft').value = orkySampleReply;
    finishDraftWriting();
  }
});
$('[data-copilot-reset]').addEventListener('click', resetCopilot);
$('[data-copilot-suggest]').addEventListener('click', resetCopilot);
$('[data-orky-clear]').addEventListener('click', () => {
  stopDraftWriting();
  $('#orky-draft').value = '';
  $('#orky-draft').placeholder = 'Your words. Your reply.';
  $('#orky-draft').focus();
  $('#orky-draft-badge').textContent = 'YOUR DRAFT · NOT SENT';
  $('#copilot-status').textContent = 'Start fresh. Write your own reply.';
  $('[data-orky-send]').disabled = true;
});
$('#orky-draft').addEventListener('input', event => {
  stopDraftWriting();
  $('[data-orky-send]').disabled = !event.currentTarget.value.trim();
  $('#orky-draft-badge').textContent = 'YOUR EDIT · NOT SENT';
  $('#copilot-status').textContent = 'Your words. Your final say.';
});
$('[data-orky-send]').addEventListener('click', () => {
  const reply = $('#orky-draft').value.trim();
  if (!reply || $('[data-orky-send]').disabled) return;
  stopDraftWriting();
  $('#copilot-sent-copy').textContent = reply;
  $('#copilot-sent').hidden = false;
  $('#orky-composer').hidden = true;
  $('#copilot-status').textContent = 'Your reply is now visible to Amy in this demo.';
});
function setAutopilot(enabled) {
  $('[data-autopilot-toggle]').setAttribute('aria-checked', String(enabled));
  $('.autopilot-surface').dataset.autopilotState = enabled ? 'ai' : 'human';
  $('#auto-handoff').hidden = !enabled;
  $('#human-takeover').hidden = enabled;
  $('#takeover-sent').hidden = true;
  $('[data-takeover-send]').disabled = false;
  $('#takeover-reply').value = 'Hey Theo, Emma here. Let me look at your order and see what we can do.';
  $('#autopilot-status').textContent = enabled ? 'Orky replies. You step in when it matters.' : 'You’re in charge. Orky won’t send another message.';
}
$('[data-autopilot-toggle]').addEventListener('click', event => setAutopilot(event.currentTarget.getAttribute('aria-checked') !== 'true'));
$('[data-autopilot-takeover]').addEventListener('click', () => setAutopilot(false));
$('#takeover-reply').addEventListener('input', event => $('[data-takeover-send]').disabled = !event.currentTarget.value.trim());
$('[data-takeover-send]').addEventListener('click', () => {
  const reply = $('#takeover-reply').value.trim();
  if (!reply) return;
  $('#takeover-sent-copy').textContent = reply;
  $('#takeover-sent').hidden = false;
  $('#human-takeover').hidden = true;
  $('#autopilot-status').textContent = 'Human handover complete. Emma replied in this demo.';
});
const urgencyExamples = {
  low: {label:'Easy life', icon:'🐠', count:1, message:'Can I switch between grams and ounces?'},
  normal: {label:'Starting to sting', icon:'🐡', count:1, message:'Can I save a meal to log it again?'},
  high: {label:'That really stings', icon:'🪼', count:2, message:'My saved meals have disappeared.'},
  critical: {label:'They want blood', icon:'🦈', count:3, message:'The app is down. I can’t sign in.'}
};
$$('[data-urgency]').forEach(button => button.addEventListener('click', () => {
  const level = button.dataset.urgency;
  const example = urgencyExamples[level];
  $$('[data-urgency]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('#urgency-inbox-sharks').innerHTML = `<span class="shark-set ${level}" aria-hidden="true">${`<span class="shark-icon">${example.icon}</span>`.repeat(example.count)}</span>`;
  $('#urgency-example-message').textContent = example.message;
  $('#urgency-current-label').textContent = example.label;
}));

const themes = {
  everyday: { greeting: 'Talk to our team', crew: 'Meet your support crew.', subtitle: 'Real people, ready to help.', online: '4 people online', date: '365 DAYS A YEAR', eyebrow: 'A FAMILIAR FACE IN THE CORNER.', headline: 'Real people.<br>One click away.', description: 'A proper hello, with your team up front.' },
  halloween: { greeting: 'Boo! Need a hand?', crew: 'Your friendly support spirits.', subtitle: 'No tricks. Just helpful humans.', online: '4 spirits online', date: 'OCTOBER 31', eyebrow: 'SCARY GOOD AT BEING HELPFUL.', headline: 'No tricks.<br>Just great support.', description: 'A costume for your chat. The same lovely humans inside.' },
  christmas: { greeting: 'A little festive help?', crew: 'Meet your merry support crew.', subtitle: 'Good tidings. Helpful humans.', online: '4 elves online', date: 'THE HOLIDAY SEASON', eyebrow: 'GOOD TIDINGS. GREAT CONVERSATIONS.', headline: 'A warmer welcome.<br>Even in December.', description: 'Your team is here to help. Festive jumper optional.' }
};
$$('button[data-theme]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.theme;
    const theme = themes[key];
    $$('button[data-theme]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('.widget-studio').dataset.widgetTheme = key;
    $('.seasonal-greeting').textContent = theme.greeting;
    $('.seasonal-crew').textContent = theme.crew;
    $('.seasonal-subtitle').textContent = theme.subtitle;
    $$('.seasonal-online').forEach(el => el.textContent = theme.online);
    $('#theme-date').textContent = theme.date;
    $('#theme-eyebrow').textContent = theme.eyebrow;
    $('#theme-headline').innerHTML = theme.headline;
    $('#theme-description').textContent = theme.description;
  });
});

const referenceDialog = $('.reference-dialog');
const references = {
  widgets: {
    heading: 'A welcome for every kind of website.',
    src: 'assets/widget-collection.webp',
    width: 2030,
    height: 1578,
    alt: 'Nine Orka widget layouts: People, Team dock, Emma, Welcome crew, Duo, Night shift, The Pod, Concierge, and Messenger.'
  }
};
$$('[data-open-reference]').forEach(button => button.addEventListener('click', () => {
  const reference = references[button.dataset.openReference];
  $('#reference-heading').textContent = reference.heading;
  const preview = $('img', referenceDialog);
  preview.src = reference.src;
  preview.width = reference.width;
  preview.height = reference.height;
  preview.alt = reference.alt;
  referenceDialog.showModal();
}));
$('[data-close-reference]').addEventListener('click', () => referenceDialog.close());
referenceDialog.addEventListener('click', event => {
  if (event.target === referenceDialog) {
    const rect = referenceDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) referenceDialog.close();
  }
});

$('#year').textContent = new Date().getFullYear();

const bannerExamples = {
  night: {
    icon:'moon',
    message:"It’s <strong>11:49 PM</strong> here. Our humans are asleep. Orky is still here to help.",
    title:'Orky · AI agent',
    body:'Hi! The team is asleep, but I’m here to help. What do you need?',
    status:'Answer within an hour',
    caption:'Actual humans. Occasionally horizontal.'
  },
  break: {
    icon:'coffee',
    message:"<strong>It’s our day off.</strong> We’re taking a little break today. Leave a message and we’ll get back to you tomorrow.",
    title:'Orky · AI agent',
    body:'The team is taking today off. I can help while they recharge. What’s your question?',
    status:'Answer within an hour',
    caption:'A day off is allowed. Yes, even for founders.'
  },
  panic: {
    icon:'alert',
    message:'I’m a one-person team, and I had to take my dog to the vet. I’ll be back as soon as I can. Sorry!',
    title:'Orky · AI agent',
    body:'Thanks for your patience. Leave your message and the team will get back to you as soon as they can.',
    status:'Replies may take longer',
    caption:'Life happens. Your visitors can understand that.'
  }
};
$$('button[data-banner]').forEach(button => {
  button.addEventListener('click', () => {
    const example = bannerExamples[button.dataset.banner];
    $$('button[data-banner]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('#availability-preview').dataset.bannerState = button.dataset.banner;
    $('#availability-icon').innerHTML = `<use href="#i-${example.icon}"/>`;
    $('#availability-message').innerHTML = example.message;
    $('#availability-title').textContent = example.title;
    $('#availability-body-copy').innerHTML = example.body;
    $('#availability-status').textContent = example.status;
    $('#availability-caption').innerHTML = example.caption;
    $('#availability-caption').hidden = !example.caption;
  });
});

// Each illustration starts with one project. Growth is optional and replayable.
const growthCaptions = {
  1: 'ONE PROJECT. EVERYTHING YOU NEED.',
  2: 'A NEW IDEA. THE SAME INBOX.',
  3: 'THREE IDEAS. ONE PLACE TO REPLY.',
  4: 'YOUR NEXT LAUNCH IS ALREADY INCLUDED.',
  5: 'MORE PROJECTS. SAME CALM INBOX.',
  6: 'SIX PROJECTS. STILL ONE SUBSCRIPTION.',
  7: 'ANOTHER BUSINESS. ALREADY INCLUDED.',
  8: 'EIGHT PROJECTS. STILL ONE SUBSCRIPTION.'
};
const growthTimers = new WeakMap();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// A steady-width word swap, only while the hero is visible.
const heroProjectWord = $('#hero-project-word');
const heroProjectTypes = ['website.', 'iOS app.', 'web app.', 'ecom store.', 'SaaS.'];
let heroProjectIndex = 0;
let heroProjectTimer;
let heroProjectVisible = false;
function rotateHeroProject() {
  heroProjectIndex = (heroProjectIndex + 1) % heroProjectTypes.length;
  heroProjectWord.textContent = heroProjectTypes[heroProjectIndex];
  if (heroProjectWord.animate && !reduceMotion.matches) heroProjectWord.animate(
    [{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],
    {duration:360,easing:'ease-out'}
  );
}
function syncHeroProjectCycle() {
  clearInterval(heroProjectTimer);
  if (heroProjectWord && heroProjectVisible && !document.hidden && !reduceMotion.matches) heroProjectTimer = setInterval(rotateHeroProject, 2600);
}
if (heroProjectWord && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    heroProjectVisible = entries[0].isIntersecting;
    syncHeroProjectCycle();
  }, {threshold:.1}).observe($('.hero-copy'));
} else if (heroProjectWord) {
  heroProjectVisible = true;
  syncHeroProjectCycle();
}
document.addEventListener('visibilitychange', syncHeroProjectCycle);
reduceMotion.addEventListener('change', syncHeroProjectCycle);

function stopGrowth(demo) {
  (growthTimers.get(demo) || []).forEach(clearTimeout);
  growthTimers.set(demo, []);
}
function setGrowth(demo, step) {
  demo.dataset.growth = String(step);
  if (demo.classList.contains('pod-growth')) requestAnimationFrame(updatePodConnectors);
  $$('[data-appear]', demo).forEach(item => {
    const visible = Number(item.dataset.appear) <= step;
    item.toggleAttribute('hidden', !visible);
  });
  $$('button[data-growth-step]', demo).forEach(button => {
    const active = Number(button.dataset.growthStep) === step;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  $$('[data-growth-caption]', demo).forEach(caption => {
    caption.textContent = demo.classList.contains('pod-growth')
      ? (step === 1 ? 'YOUR APP’S USERS. YOUR INBOX.' : `VISITORS FROM ${step} PROJECTS. ONE INBOX.`)
      : growthCaptions[step];
  });
  const count = $('[data-growth-count]', demo);
  if (count) count.textContent = String(step + 1);
  const filter = $('[data-growth-filter]', demo);
  if (filter) filter.textContent = step === 1 ? 'My calorie tracker' : 'All projects';
  const cluster = $('.project-cluster', demo);
  if (cluster) {
    const lastProject = $$('.project-pill', cluster).filter(item => !item.hidden).at(-1);
    const beyondEdge = lastProject && lastProject.offsetLeft + lastProject.offsetWidth > cluster.scrollLeft + cluster.clientWidth;
    if (step === 1 || beyondEdge) cluster.scrollTo({left:step === 1 ? 0 : cluster.scrollWidth,behavior:reduceMotion.matches ? 'auto' : 'smooth'});
  }
}
function playGrowth(demo, requested = false) {
  stopGrowth(demo);
  setGrowth(demo, 1);
  const maxProjects = Number(demo.dataset.growthMax) || 6;
  if (reduceMotion.matches && !requested) { setGrowth(demo, maxProjects); return; }
  growthTimers.set(demo, Array.from({length:maxProjects - 1}, (_, index) => {
    const step = index + 2;
    return setTimeout(() => setGrowth(demo, step), (step - 1) * 960);
  }));
}
$$('.growth-demo').forEach(demo => {
  $$('button[data-growth-step]', demo).forEach(button => button.addEventListener('click', () => {
    demo.dataset.growthManual = 'true';
    stopGrowth(demo);
    setGrowth(demo, Number(button.dataset.growthStep));
  }));
  $('[data-growth-replay]', demo)?.addEventListener('click', () => {
    demo.dataset.growthManual = 'true';
    playGrowth(demo, true);
  });
});
if ('IntersectionObserver' in window) {
  const growthObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!entry.target.dataset.growthManual) playGrowth(entry.target);
      growthObserver.unobserve(entry.target);
    });
  }, { threshold: 0.28 });
  $$('.growth-demo').forEach(demo => growthObserver.observe(demo));
}

// One sender per project. Update a visible conversation at a time, without moving the diagram.
const projectMessages = [
  [['Amy', 'AM', 'I’d like a refund, please.'], ['Jordan', 'JK', 'My payment went through twice.'], ['Nina', 'NP', 'Can I talk to a real person?']],
  [['Theo', 'TS', 'Can I cancel my order?'], ['Sam', 'SR', 'My package never arrived.'], ['Ava', 'AW', 'How do I return this cap?']],
  [['Lena', 'LM', 'I was charged twice.'], ['Omar', 'OA', 'Please cancel my plan.'], ['Sofia', 'SC', 'I need a human, please.']],
  [['Kai', 'KB', 'Can I speak to a human?'], ['Daniel', 'DC', 'Please refund my booking.'], ['Julie', 'JL', 'I need to cancel tomorrow.']],
  [['Mia', 'MN', 'Please cancel my subscription.'], ['Noah', 'NT', 'Where is my refund?'], ['Ella', 'EB', 'My post disappeared. Help!']],
  [['Alex', 'AR', 'My account is locked. Help?'], ['Hugo', 'HM', 'Can someone call me back?'], ['Zoe', 'ZC', 'I’d like to request a refund.']]
];
const podConversations = $$('[data-project-conversation]');
const conversationPositions = projectMessages.map(() => 0);
let conversationCursor = 0;
let conversationTimer;
let podIsVisible = false;
function rotateProjectMessage() {
  const visible = podConversations.filter(node => !node.closest('.diagram-project').hidden);
  if (!visible.length) return;
  const node = visible[conversationCursor++ % visible.length];
  const project = Number(node.dataset.projectConversation);
  conversationPositions[project] = (conversationPositions[project] + 1) % projectMessages[project].length;
  const [name, initials, message] = projectMessages[project][conversationPositions[project]];
  $('[data-project-avatar]', node).textContent = initials;
  $('[data-project-sender]', node).textContent = name;
  $('[data-project-message]', node).textContent = message;
  if (node.animate && !reduceMotion.matches) node.animate([{opacity:.25,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
}
function syncProjectMessages() {
  clearInterval(conversationTimer);
  if (podIsVisible && !document.hidden && !reduceMotion.matches) conversationTimer = setInterval(rotateProjectMessage, 2700);
}
const podDiagram = $('.pod-audience-diagram');
// Anchor every connector to the rendered cards and hub, including after fonts load.
function updatePodConnectors() {
  if (!podDiagram) return;
  const svg = $('.pod-lines', podDiagram);
  if (!svg.getClientRects().length) return;
  const diagram = podDiagram.getBoundingClientRect();
  const hub = $('.diagram-hub', podDiagram).getBoundingClientRect();
  const originX = diagram.left + podDiagram.clientLeft;
  const originY = diagram.top + podDiagram.clientTop;
  svg.setAttribute('viewBox', `0 0 ${podDiagram.clientWidth} ${podDiagram.clientHeight}`);
  const paths = $$('.pod-lines > g > path', podDiagram);
  $$('.diagram-project', podDiagram).forEach((node, index) => {
    if (node.hidden) return;
    const card = node.getBoundingClientRect();
    const fromLeft = index % 2 === 0;
    const direction = fromLeft ? 1 : -1;
    const row = Math.floor(index / 2);
    const startX = (fromLeft ? card.right : card.left) - originX;
    const startY = card.top + card.height / 2 - originY;
    const endX = (fromLeft ? hub.left - 7 : hub.right + 7) - originX;
    const endY = hub.top + hub.height * (row + 1) / 4 - originY;
    const bend = Math.max(12, Math.abs(endX - startX) * .55);
    paths[index].setAttribute('d', `M${startX} ${startY} C${startX + direction * bend} ${startY},${endX - direction * bend} ${endY},${endX} ${endY}`);
  });
}
if (podDiagram) {
  if ('ResizeObserver' in window) {
    const connectorObserver = new ResizeObserver(updatePodConnectors);
    [podDiagram, $('.diagram-hub', podDiagram), ...$$('.diagram-project', podDiagram)].forEach(node => connectorObserver.observe(node));
  } else {
    window.addEventListener('resize', updatePodConnectors);
  }
  document.fonts?.ready.then(updatePodConnectors);
  updatePodConnectors();
}

if (podDiagram && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    podIsVisible = entries[0].isIntersecting;
    syncProjectMessages();
  },{threshold:.25}).observe(podDiagram);
} else if (podDiagram) {
  podIsVisible = true;
  syncProjectMessages();
}
document.addEventListener('visibilitychange', syncProjectMessages);
reduceMotion.addEventListener('change', syncProjectMessages);

// Linked, fictional visitor examples illustrate the actual context fields.
const visitors = {
 van:{initials:'RK',name:'Orka #32938',location:'Vancouver, Canada',email:'visitor@example.com',domain:'calories.example',session:'1m 42s',page:'/food-log',previous:'/saved-meals',previousTime:'45 seconds ago',attributes:[['plan','Free'],['saved_meals','4'],['account','Personal']],admin:'admin.calories.example/visitors/32938'},
 sf:{initials:'LM',name:'Lena Miller',location:'San Francisco, United States',email:'lena@example.com',domain:'trustarr.example',session:'6m 14s',page:'/account',previous:'/pricing',previousTime:'1 minute ago',attributes:[['plan','Pro annual'],['account_status','Active'],['trial_ends','In 5 days']],admin:'admin.trustarr.example/customers/lena'},
 den:{initials:'MN',name:'Mia Nguyen',location:'Denver, United States',email:'mia@example.com',domain:'inrank.example',session:'2m 18s',page:'/editor',previous:'/posts',previousTime:'35 seconds ago',attributes:[['plan','Pro'],['published_posts','12'],['drafts','3']],admin:'admin.inrank.example/customers/mia'},
 chi:{initials:'RK',name:'Orka #32862',location:'Chicago, United States',email:'alex@example.com',domain:'outreach.example',session:'3m 05s',page:'/campaigns',previous:'/settings',previousTime:'2 minutes ago',attributes:[['plan','Pro'],['member_since','July 2025'],['account_status','Active']],admin:'admin.outreach.example/customers/32862'},
 ny:{initials:'AR',name:'Alex Rivera',location:'New York, United States',email:'alex@example.com',domain:'caps.example',session:'2m 08s',page:'/caps/forest',previous:'/collections/caps',previousTime:'45 seconds ago',attributes:[['customer_type','Returning'],['last_order','#1048'],['cart_value','$48.00']],admin:'admin.caps.example/customers/alex'},
 mia:{initials:'KB',name:'Kai Brooks',location:'Miami, United States',email:'kai@example.com',domain:'booking.example',session:'4m 19s',page:'/book/consultation',previous:'/services',previousTime:'3 minutes ago',attributes:[['service','Consultation'],['duration','30 minutes'],['timezone','America/New_York']],admin:'admin.booking.example/customers/kai'}
};
const visitorProfiles = {
  van:{flag:'🇨🇦',time:'06:30 (GMT−7)',ip:'192.0.2.38',logo:'calorie-app.svg',weather:'☁️',temperature:'15°C'},
  sf:{flag:'🇺🇸',time:'06:30 (GMT−7)',ip:'198.51.100.24',logo:'trustarr-mark.svg',weather:'☀️',temperature:'18°C'},
  den:{flag:'🇺🇸',time:'07:30 (GMT−6)',ip:'192.0.2.62',logo:'blogging-app.svg',weather:'☀️',temperature:'21°C'},
  chi:{flag:'🇺🇸',time:'08:30 (GMT−5)',ip:'198.51.100.86',logo:'outreach-app.svg',weather:'☁️',temperature:'17°C'},
  ny:{flag:'🇺🇸',time:'09:30 (GMT−4)',ip:'192.0.2.42',logo:'orca-cap.webp',weather:'☀️',temperature:'22°C'},
  mia:{flag:'🇺🇸',time:'09:30 (GMT−4)',ip:'203.0.113.19',logo:'cowlendar-official-home.png',weather:'☀️',temperature:'28°C'}
};
let selectedVisitor = 'ny';
$$('[data-visitor]').forEach(button => button.addEventListener('click', () => {
  selectedVisitor = button.dataset.visitor;
  const visitor = visitors[selectedVisitor];
  $$('[data-visitor]').forEach(item => {
    const active = item.dataset.visitor === selectedVisitor;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  ['initials','name','location','email','domain','page','previous'].forEach(key => $('#context-' + key).textContent = visitor[key]);
  const hasCart = selectedVisitor === 'ny';
  $('#context-cart').open = false;
  $('#context-cart-count').textContent = hasCart ? '1 item' : '0 items';
  $('#context-cart-item').hidden = !hasCart;
  $('#context-cart-empty').hidden = hasCart;
  const profile = visitorProfiles[selectedVisitor];
  $('#context-flag').textContent = profile.flag;
  $('#context-location').textContent = profile.flag + ' ' + visitor.location;
  $('[data-context-email-short]').textContent = visitor.email;
  $('#context-local-time').textContent = profile.time;
  $('#context-ip').textContent = profile.ip;
  $('#context-weather').textContent = profile.weather;
  $('#context-temperature').textContent = profile.temperature;
  $('#context-language').textContent = profile.flag + ' English';
  $('#context-project-logo').src = 'assets/' + profile.logo;
  $('#context-session').textContent = 'Session · ' + visitor.session;
  $('#context-previous-time').textContent = visitor.previousTime;
  $('#map-active-person').textContent = visitor.name + ' · ' + visitor.location.split(',')[0];
  $('#map-active-page').textContent = visitor.page;
  $('#context-attributes').innerHTML = visitor.attributes.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
  $('#admin-example').textContent = 'Example deep link: ' + visitor.admin;
  $('#admin-example').hidden = true;
  $('[data-show-admin]').setAttribute('aria-expanded', 'false');
}));
$('[data-show-admin]').setAttribute('aria-controls', 'admin-example');
$('[data-show-admin]').setAttribute('aria-expanded', 'false');
$('[data-show-admin]').addEventListener('click', event => {
  const show = $('#admin-example').hidden;
  $('#admin-example').hidden = !show;
  event.currentTarget.setAttribute('aria-expanded', String(show));
});
const translations = {
  fr: ['French', 'French (France)', '🇫🇷', 'Bonjour, je souhaite exporter mes réservations.', 'Bonjour ! Alex ici. Je peux vous aider 😊'],
  nl: ['Dutch', 'Dutch (Netherlands)', '🇳🇱', 'Hallo, ik wil graag mijn boekingen exporteren.', 'Hallo! Alex hier. Ik help je graag 😊'],
  es: ['Spanish', 'Spanish (Spain)', '🇪🇸', 'Hola, me gustaría exportar mis reservas.', '¡Hola! Soy Alex. Estoy aquí para ayudarte 😊']
};
$$('button[data-language]').forEach(button => button.addEventListener('click', () => {
  const code = button.dataset.language;
  const [language, locale, flag, incoming, outgoing] = translations[code];
  $$('button[data-language]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('#translation-in-label').textContent = language;
  $('#translation-out-language').textContent = locale;
  $$('[data-visitor-flag]').forEach(el => el.textContent = flag);
  $('#translation-in-original').textContent = incoming;
  $('#translation-in-original').lang = code;
  $('#translation-out-result').textContent = outgoing;
  $('#translation-out-result').lang = code;
}));
// Normalize a previously cached hero before the new typing styles run.
const legacyTyping = $('.workspace-live-preview');
if (legacyTyping) {
  legacyTyping.className = 'workspace-typing-row';
  legacyTyping.setAttribute('aria-label', 'Amy is typing. Her message has not been sent.');
  legacyTyping.innerHTML = '<span class="initial-avatar" aria-hidden="true">AM</span><div class="typing-bubble"><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span data-live-hero-text>Can I also change the portion size?</span></div>';
}
// An unsent message in a normal chat bubble, with gentle three-dot typing.
function liveTypingDemo(root, selector, message, replayButton) {
  const fields = $$(selector, root);
  let timer = null;
  let visible = false;
  const write = text => fields.forEach(field => field.textContent = text);
  const stop = () => { clearTimeout(timer); timer = null; root.classList.remove('typing-active'); };
  function play() {
    stop();
    if (!visible || document.hidden || reduceMotion.matches) { write(message); return; }
    root.classList.add('typing-active');
    let length = Math.min(9, message.length);
    write(message.slice(0, length));
    function tick() {
      length += 1;
      write(message.slice(0, length));
      if (length < message.length) timer = setTimeout(tick, message[length - 1] === ' ' ? 170 : 85);
      else timer = setTimeout(play, 4800);
    }
    timer = setTimeout(tick, 900);
  }
  if (replayButton) replayButton.addEventListener('click', play);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) play(); else { stop(); write(message); }
    }, {threshold:.35});
    observer.observe(root);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) play(); });
  reduceMotion.addEventListener('change', () => { stop(); if (reduceMotion.matches) write(message); else if (visible) play(); });
}
liveTypingDemo($('.workspace-typing-row'), '[data-live-hero-text]', 'Can I also change the portion size?');
liveTypingDemo($('.typing-card'), '[data-typed-agent]', 'I’m trying to upgrade our team to Pro.', $('[data-replay-typing]'));
const bentoSampleReply = 'Hi Daniel! I’ll check the booking settings. Could you share your shop URL and the service you’re trying to book?';
function resetBentoReply() {
  $('#bento-reply-editor').hidden = false;
  $('#bento-sent').hidden = true;
  $('[data-bento-reset]').hidden = true;
  $('#bento-ai-draft').value = bentoSampleReply;
  $('[data-bento-send]').disabled = false;
  $('.bento-draft-heading').hidden = false;
  $('#ai-demo-note').textContent = 'Only your team can see this draft.';
}
$('[data-bento-suggest]').addEventListener('click', resetBentoReply);
$('[data-bento-reset]').addEventListener('click', resetBentoReply);
$('[data-bento-discard]').addEventListener('click', () => {
  $('#bento-ai-draft').value = '';
  $('#bento-ai-draft').placeholder = 'Write a reply…';
  $('.bento-draft-heading').hidden = true;
  $('[data-bento-send]').disabled = true;
  $('#ai-demo-note').textContent = 'Suggestion discarded. Write your own reply, or ask Orky again.';
  $('#bento-ai-draft').focus();
});
$('#bento-ai-draft').addEventListener('input', event => {
  $('[data-bento-send]').disabled = !event.currentTarget.value.trim();
  $('#ai-demo-note').textContent = 'Your edit. Still private until you send.';
});
$('[data-bento-send]').addEventListener('click', () => {
  const reply = $('#bento-ai-draft').value.trim();
  if (!reply) return;
  $('#bento-sent').textContent = reply;
  $('#bento-sent').hidden = false;
  $('#bento-reply-editor').hidden = true;
  $('[data-bento-reset]').hidden = false;
  $('#ai-demo-note').textContent = 'Sent as Charles in this demo. Nothing is sent to a real customer.';
});
$('[data-bento-ai]').addEventListener('click', event => {
  const button = event.currentTarget;
  const enabled = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(enabled));
  $('#bento-auto-label').textContent = enabled ? 'On' : 'Off';
  $('#ai-demo-note').textContent = enabled ? 'Auto-reply is on for this example conversation.' : 'Auto-reply is off. You can still ask Orky for a draft.';
});

$('.live-visitor-row[data-visitor="ny"]').click();

// A local preview only: never inject code into, or alter, the visitor's website.
function normalizePreviewUrl(value) {
  const input = String(value).trim();
  if (!input || /[\s\\]/.test(input)) throw new Error('Enter a website address, like example.com.');
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input)) {
    throw new Error('Use a website address, like https://example.com.');
  }
  let url;
  try { url = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input); }
  catch { throw new Error('That address doesn’t look right. Try example.com.'); }
  if (url.protocol !== 'https:') throw new Error('Please use the secure https:// address for your website.');
  if (url.username || url.password || !url.hostname.includes('.') || url.hostname.endsWith('.')) {
    throw new Error('Enter a full website address, without a username or password.');
  }
  return url;
}
const sitePreviewDialog = $('#site-preview-dialog');
const sitePreviewFrame = $('#website-preview-frame');
const previewSample = $('#preview-sample');
const previewChat = $('#preview-chat');
const previewChatLauncher = $('[data-open-preview-chat]');
const previewThemes = {
  normal: {greeting:'Hey there! 👋', question:'How can we help?'},
  christmas: {greeting:'Happy holidays! 🎄', question:'Need a little holiday help?'},
  halloween: {greeting:'Boo! 👻', question:'Need a hand? We don’t bite.'}
};
let previewTheme = 'normal';
let previewBrandName = '';
let previewReturnFocus = null;
let previewWebsite = null;
let previewRequest = null;
let previewRequestId = 0;
let previewModeIntent = 'auto';
function updatePreviewWelcome() {
  const theme = previewThemes[previewTheme];
  $('#preview-welcome').textContent = theme.greeting + (previewBrandName ? ' Welcome to ' + previewBrandName + '.' : ' ' + theme.question);
  $('#preview-welcome-question').textContent = theme.question;
}
function setPreviewTheme(theme) {
  if (!Object.hasOwn(previewThemes, theme)) return;
  previewTheme = theme;
  sitePreviewDialog.dataset.previewTheme = theme;
  $$('button[data-preview-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewTheme === theme)));
  updatePreviewWelcome();
}
$$('button[data-preview-theme]').forEach(button => button.addEventListener('click', () => setPreviewTheme(button.dataset.previewTheme)));
function setPreviewChat(open) {
  sitePreviewDialog.classList.toggle('preview-minimized', !open);
  previewChat.hidden = !open;
  previewChatLauncher.hidden = open;
}
function setPreviewMode(mode) {
  const live = mode === 'live' && previewWebsite;
  sitePreviewFrame.hidden = !live;
  sitePreviewFrame.src = live ? previewWebsite.href : 'about:blank';
  previewSample.hidden = !!live;
  $('#preview-embed-notice').hidden = !live;
  $('#preview-foot-note').textContent = live ? 'Try the chat on your website. Nothing is installed.' : 'A sample website, personalized with your site details.';
  $$('[data-preview-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewMode === (live ? 'live' : 'brand'))));
}
function setPreviewFavicon(src) {
  $$('[data-preview-favicon]').forEach(img => {
    const monogram = $('[data-preview-monogram]', img.parentElement);
    img.hidden = true;
    monogram.hidden = false;
    img.onload = () => { img.hidden = false; monogram.hidden = true; };
    img.onerror = () => { img.hidden = true; monogram.hidden = false; };
    if (src && /^https:\/\//.test(src)) img.src = src;
    else img.removeAttribute('src');
  });
}
function applyPreviewIdentity(details, loading = false) {
  const name = String(details.siteName || details.hostname || 'Your brand').slice(0, 90);
  const description = String(details.description || '').slice(0, 230);
  $$('[data-preview-name]').forEach(el => el.textContent = name);
  $$('[data-preview-monogram]').forEach(el => el.textContent = name.charAt(0).toUpperCase());
  $('#preview-brand-domain').textContent = details.hostname || 'yourwebsite.com';
  $('#preview-brand-description').textContent = description || 'Big ideas. Small beginnings. Whatever you’re building, a good conversation goes a long way.';
  $('#preview-agent-name').textContent = 'Emma · ' + name;
  previewBrandName = name;
  updatePreviewWelcome();
  $('#preview-welcome-description').textContent = description;
  $('#preview-welcome-description').hidden = !description;
  $('#preview-welcome-question').hidden = false;
  setPreviewFavicon(details.favicon);
  const liveButton = $('[data-preview-mode="live"]');
  liveButton.disabled = !previewWebsite || details.canEmbed === false;
  liveButton.textContent = details.canEmbed === false ? 'Embedding blocked by this site' : 'Your live website';
  liveButton.title = details.canEmbed === false ? 'This website does not allow embedded previews.' : '';
  if (details.canEmbed === false && !sitePreviewFrame.hidden) setPreviewMode('brand');
  $('#preview-details-status').textContent = loading
    ? 'Finding your website’s name, logo and description…'
    : details.canEmbed === false
      ? 'This site blocks embedding. Try Orka on your personalized sample instead.'
      : details.status === 'ready'
        ? 'Your name, logo and welcome message are ready. Try the chat.'
        : 'Try the chat. If the website won’t load, switch to the sample.';
}
$('[data-open-site-preview]').addEventListener('click', event => {
  previewReturnFocus = event.currentTarget;
  setPreviewMode('brand');
  $('#preview-url-error').hidden = true;
  $('#site-preview-url').removeAttribute('aria-invalid');
  setPreviewChat(true);
  sitePreviewDialog.showModal();
  document.body.classList.add('site-preview-open');
  $('#site-preview-url').focus();
});
$('#site-preview-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#site-preview-url');
  const error = $('#preview-url-error');
  let url;
  try { url = normalizePreviewUrl(input.value); }
  catch (problem) {
    error.textContent = problem.message;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  error.hidden = true;
  input.removeAttribute('aria-invalid');
  previewRequest?.abort();
  previewRequest = new AbortController();
  const requestId = ++previewRequestId;
  const request = previewRequest;
  previewWebsite = url;
  previewModeIntent = 'auto';
  // Loading the website must not depend on the metadata request succeeding.
  setPreviewMode('live');
  $$('.preview-sent-message:not(.preview-example-message)', previewChat).forEach(message => message.remove());
  $('#preview-chat-input').value = '';
  setPreviewChat(true);
  const fallback = {siteName:url.hostname.replace(/^www\./,''), hostname:url.hostname, favicon:'', status:'unavailable'};
  applyPreviewIdentity(fallback, true);
  $('#preview-submit').setAttribute('aria-busy', 'true');
  const timeout = setTimeout(() => request.abort(), 12000);
  try {
    const response = await fetch('/api/website-preview', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:url.origin}), signal:request.signal});
    if (!response.ok) throw new Error('Preview details unavailable');
    const details = await response.json();
    if (requestId !== previewRequestId || !sitePreviewDialog.open) return;
    applyPreviewIdentity({...fallback, ...details});
  } catch {
    if (requestId === previewRequestId && sitePreviewDialog.open) applyPreviewIdentity(fallback);
  } finally {
    clearTimeout(timeout);
    if (requestId === previewRequestId) $('#preview-submit').removeAttribute('aria-busy');
  }
});
$('#site-preview-url').addEventListener('input', event => {
  $('#preview-url-error').hidden = true;
  event.currentTarget.removeAttribute('aria-invalid');
});
$$('[data-preview-mode]').forEach(button => button.addEventListener('click', () => {
  previewModeIntent = button.dataset.previewMode;
  setPreviewMode(previewModeIntent);
}));
$('[data-preview-fallback]').addEventListener('click', () => {
  previewModeIntent = 'brand';
  setPreviewMode('brand');
});
$('[data-close-site-preview]').addEventListener('click', () => sitePreviewDialog.close());
sitePreviewDialog.addEventListener('close', () => {
  ++previewRequestId;
  previewRequest?.abort();
  $('#preview-submit').removeAttribute('aria-busy');
  sitePreviewFrame.src = 'about:blank';
  document.body.classList.remove('site-preview-open');
  if (previewReturnFocus instanceof HTMLElement) previewReturnFocus.focus();
});
sitePreviewDialog.addEventListener('click', event => {
  if (event.target !== sitePreviewDialog) return;
  const rect = sitePreviewDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sitePreviewDialog.close();
});
$('[data-minimize-preview-chat]').addEventListener('click', () => { setPreviewChat(false); previewChatLauncher.focus(); });
previewChatLauncher.addEventListener('click', () => { setPreviewChat(true); $('#preview-chat-input').focus(); });
$('#preview-chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#preview-chat-input');
  const text = input.value.trim();
  if (!text) return;
  const message = document.createElement('p');
  message.className = 'preview-sent-message';
  message.textContent = text;
  const messages = $('#preview-chat-messages');
  messages.appendChild(message);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
  input.focus();
});

// Pause ambient waves and sonar outside the viewport. CSS also honors reduced motion.
if ('IntersectionObserver' in window) {
  const sonarObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('motion-visible', entry.isIntersecting && !document.hidden));
  }, {threshold:.2});
  $$('.hero, .real-livemap-card, .story-echoes, .story-knowledge, .urgency-card').forEach(section => sonarObserver.observe(section));
  document.addEventListener('visibilitychange', () => {
    $$('.hero, .real-livemap-card, .story-echoes, .story-knowledge, .urgency-card').forEach(section => {
      if (document.hidden) section.classList.remove('motion-visible');
      else {
        const box = section.getBoundingClientRect();
        section.classList.toggle('motion-visible', box.bottom > 0 && box.top < window.innerHeight);
      }
    });
  });
}

// Start the footer sweep on its very first visible pixel, at a visible angle.
const closingSection = $('.closing-section');
if ('IntersectionObserver' in window) {
  let closingVisible = false;
  const syncClosingMotion = () => closingSection.classList.toggle('motion-visible', closingVisible && !document.hidden);
  new IntersectionObserver(entries => {
    closingVisible = entries[0].isIntersecting;
    syncClosingMotion();
  }, {threshold:0}).observe(closingSection);
  document.addEventListener('visibilitychange', syncClosingMotion);
}

// These shortcuts only edit this illustration's local draft.
const quickActions = {
  hi:{title:'👋 Say hi',description:'Start with a warm welcome, using the visitor’s name.',context:'Hi! I have a question about my booking.',draft:'Hi Jessy! 👋 Thanks for reaching out. What can I help you with today?'},
  bye:{title:'✋ Say goodbye',description:'Wrap up warmly and remind them they can come back for help.',context:'That worked, thank you!',draft:'You’re very welcome, Jessy! If anything else comes up with your bookings, we’re right here. Have a lovely day!'},
  chat:{title:'☕ Chit chat',description:'Keep the conversation human while you look into their question.',context:'Thanks for checking. I’m planning a birthday surprise!',draft:'A birthday surprise — lovely! 🎉 I’m checking those booking details for you now, Jessy.'},
  weather:{title:'☀️ Talk about the weather',description:'A little small talk while you help. No made-up forecast.',context:'Thanks! I’m taking a quick break while you check.',draft:'You’re welcome, Jessy! How’s the weather where you are? Hope you get a little sunshine on your break. ☀️'},
  answer:{title:'AI Answer',description:'Draft a useful answer from your own help docs and FAQs.',context:'How do I reschedule my appointment?',draft:'Hi Jessy! Open your confirmation email and choose Reschedule. You’ll be able to pick another available time. Let me know if you need a hand.'},
  summary:{title:'☷ Summarize',description:'Catch up on the conversation in a private note for your team.',context:'Perfect, I’ve moved my appointment to Friday. Thank you!',draft:'Jessy wanted to reschedule an appointment. We explained how to use the link in the confirmation email. The appointment is now on Friday and the visitor has confirmed everything is sorted.',private:true}
};
let selectedQuickAction = 'bye';
const quickSend = $('[data-quick-send]');
const quickDraft = $('#quick-action-draft');
function chooseQuickAction(key) {
  const action=quickActions[key];
  if (!action) return;
  selectedQuickAction=key;
  $$('[data-quick-action]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quickAction===key)));
  $('#quick-action-title').textContent=action.title;
  $('#quick-action-description').textContent=action.description;
  $('#quick-context-message').textContent=action.context;
  $('#quick-action-example').textContent=action.draft;
  $('#quick-action-kind').textContent=action.private?'Private summary':'AI draft';
  $('#quick-example-label').textContent=action.private?'Only visible to your team':'Example for Jessy';
  $('#quick-action-note').textContent=action.private?'A private recap. It is never sent to the visitor.':'Creates a draft. You review and send as Charles.';
  $('#quick-composer-mode').textContent=action.private?'🔒 Private note':'↩ Reply';
  $('#quick-action-status').textContent=action.private?'Private summary · Only your team can see it.':'Demo only · Nothing is sent to a real visitor.';
  quickDraft.value=action.draft;
  quickSend.textContent=action.private?'Save private note':'Send as Charles ↑';
  quickSend.disabled=false;
  $('#quick-sent-result')?.remove();
}
$$('[data-quick-action]').forEach(button=>button.addEventListener('click',()=>chooseQuickAction(button.dataset.quickAction)));
quickDraft.addEventListener('input',()=>{
  quickSend.disabled=!quickDraft.value.trim();
  $('#quick-action-status').textContent=quickActions[selectedQuickAction].private?'Your edit. This note stays private to your team.':'Your edit. Still private until you choose to send.';
});
quickSend.addEventListener('click',()=>{
  const draft=quickDraft.value.trim();if(!draft)return;
  const isPrivate=quickActions[selectedQuickAction].private;
  const result=document.createElement('div');result.id='quick-sent-result';result.className='quick-sent-result'+(isPrivate?' private':'');
  const label=document.createElement('small');label.textContent=isPrivate?'Private note · Charles':'Charles · Sent in this demo ✓✓';
  const body=document.createElement('p');body.textContent=draft;result.append(label,body);
  $('#quick-sent-result')?.remove();$('.quick-chat-context').after(result);
  $('#quick-action-status').textContent=isPrivate?'Private note saved in this example.':'Reply sent in this example. Pick another shortcut to try it.';
  quickSend.disabled=true;
});
