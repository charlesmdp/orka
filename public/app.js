const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setBrandTheme(theme) {
  const chosen = theme === 'blue' ? 'blue' : 'green';
  document.documentElement.dataset.brandTheme = chosen;
  $$('button[data-brand-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.brandTheme === chosen)));
  $('meta[name="theme-color"]').setAttribute('content', chosen === 'blue' ? '#0B2347' : '#14211D');
  try { localStorage.setItem('orka-brand-theme', chosen); } catch {}
}
let savedBrandTheme = 'green';
try { savedBrandTheme = localStorage.getItem('orka-brand-theme') || 'green'; } catch {}
setBrandTheme(savedBrandTheme);
$$('button[data-brand-theme]').forEach(button => button.addEventListener('click', () => setBrandTheme(button.dataset.brandTheme)));


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
function resetCopilot() {
  $('#orky-composer').hidden = false;
  $('#copilot-sent').hidden = true;
  $('#orky-draft').value = orkySampleReply;
  $('#orky-draft-badge').textContent = 'NOT SENT';
  $('[data-orky-send]').disabled = false;
  $('#copilot-status').textContent = 'Orky suggests. You send.';
}
$('[data-copilot-reset]').addEventListener('click', resetCopilot);
$('[data-orky-clear]').addEventListener('click', () => {
  $('#orky-draft').value = '';
  $('#orky-draft').placeholder = 'Your words. Your reply.';
  $('#orky-draft').focus();
  $('[data-orky-send]').disabled = true;
});
$('#orky-draft').addEventListener('input', event => {
  $('[data-orky-send]').disabled = !event.currentTarget.value.trim();
  $('#orky-draft-badge').textContent = 'YOUR EDIT · NOT SENT';
});
$('[data-orky-send]').addEventListener('click', () => {
  const reply = $('#orky-draft').value.trim();
  if (!reply) return;
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
  low: {label:'Low', count:1, message:'Can I switch between grams and ounces?'},
  normal: {label:'Normal', count:1, message:'Can I save a meal to log it again?'},
  high: {label:'High', count:2, message:'My saved meals have disappeared.'},
  critical: {label:'Critical', count:3, message:'The app is down. I can’t sign in.'}
};
$$('[data-urgency]').forEach(button => button.addEventListener('click', () => {
  const level = button.dataset.urgency;
  const example = urgencyExamples[level];
  $$('[data-urgency]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('#urgency-inbox-sharks').innerHTML = `<span class="shark-set ${level}" aria-hidden="true">${'<span class="shark-icon">🦈</span>'.repeat(example.count)}</span>`;
  $('#urgency-example-message').textContent = example.message;
  $('#urgency-current-label').textContent = example.label + ' urgency';
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
    message:"It's <strong>11:49 PM</strong> for the Orka team. Our humans are asleep. A reply may take a little while.",
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
  if (reduceMotion.matches && !requested) return;
  const maxProjects = Number(demo.dataset.growthMax) || 6;
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
  $('[data-growth-replay]', demo).addEventListener('click', () => {
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
  [['Amy', 'AM', 'Can I save a meal?'], ['Jordan', 'JK', 'Can I edit a portion?'], ['Nina', 'NP', 'Where are my saved meals?']],
  [['Theo', 'TS', 'Is this cap in stock?'], ['Sam', 'SR', 'Do you ship to Canada?'], ['Ava', 'AW', 'Does it come in green?']],
  [['Lena', 'LM', 'Can I change my plan?'], ['Omar', 'OA', 'How do I get started?'], ['Sofia', 'SC', 'Can I update my email?']],
  [['Kai', 'KB', 'Can I move my booking?'], ['Daniel', 'DC', 'Any slots on Monday?'], ['Julie', 'JL', 'Where is my booking?']],
  [['Mia', 'MN', 'How do I publish this?'], ['Noah', 'NT', 'Can I add a cover image?'], ['Ella', 'EB', 'Can I schedule a post?']],
  [['Alex', 'AR', 'Can I connect my account?'], ['Hugo', 'HM', 'How do I find conversations?'], ['Zoe', 'ZC', 'Can I invite a teammate?']]
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
  nl: ['Dutch', '🇳🇱','Kan ik een collega uitnodigen?','Natuurlijk! Open je lijst en klik op Delen.'],
  fr: ['French', '🇫🇷','Est-ce que je peux inviter un collègue ?','Bien sûr ! Ouvrez votre liste et cliquez sur Partager.'],
  es: ['Spanish', '🇪🇸','¿Puedo invitar a un compañero?','¡Claro! Abre tu lista y haz clic en Compartir.']
};
$$('button[data-language]').forEach(button => button.addEventListener('click', () => {
  const [language, flag, incoming, outgoing] = translations[button.dataset.language];
  $$('button[data-language]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('#translation-in-label').textContent = language;
  $('#translation-out-language').textContent = language;
  $$('[data-visitor-flag]').forEach(el => el.textContent = flag);
  $('#translation-in-original').textContent = incoming;
  $('#translation-out-result').textContent = outgoing;
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

$$('.geo-cluster').forEach(cluster => cluster.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cluster.dispatchEvent(new Event('click')); }
}));
const mapProjects = ['calories','caps','trustarr','booking','blog','outreach'];
$$('[data-map-project]').forEach(button => button.addEventListener('click', () => {
  const project = button.dataset.mapProject;
  $$('[data-map-project]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $$('.live-visitor-row').forEach(row => row.hidden = project !== 'all' && row.dataset.visitorProject !== project);
  $$('.geo-cluster').forEach(cluster => {
    const counts = cluster.dataset.clusterCounts.split(',').map(Number);
    const count = project === 'all' ? counts.reduce((total,n) => total+n,0) : counts[mapProjects.indexOf(project)];
    $('.cluster-count', cluster).textContent = count;
    cluster.setAttribute('aria-label', count + ' example visitors in ' + $('title', cluster).textContent);
  });
  $('#map-project-summary').textContent = project === 'all' ? '6 projects. One live view.' : $('span:nth-child(2)', button).textContent + ' · live visitors';
  const first = $('.live-visitor-row:not([hidden])');
  if (first) first.click();
}));
let mapZoom = 1;
$$('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
  mapZoom = button.dataset.mapZoom === 'reset' ? 1 : Math.max(1, Math.min(1.8, mapZoom + (button.dataset.mapZoom === 'in' ? .2 : -.2)));
  const width = 768/mapZoom, height = 590/mapZoom;
  $('.live-geographic-map').setAttribute('viewBox', `${384-width/2} ${575-height/2} ${width} ${height}`);
  $('[data-map-zoom="out"]').disabled = mapZoom === 1;
  $('[data-map-zoom="in"]').disabled = mapZoom >= 1.8;
}));
$('[data-map-zoom="out"]').disabled = true;
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
  $('#preview-domain').textContent = url.hostname;
  // Loading the website must not depend on the metadata request succeeding.
  setPreviewMode('live');
  $$('.preview-sent-message', previewChat).forEach(message => message.remove());
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
  $$('.hero, .real-livemap-card, .story-echoes, .urgency-card').forEach(section => sonarObserver.observe(section));
  document.addEventListener('visibilitychange', () => {
    $$('.hero, .real-livemap-card, .story-echoes, .urgency-card').forEach(section => {
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
