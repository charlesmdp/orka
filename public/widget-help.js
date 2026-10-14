/* Independent, local-only help-center examples for every marketing widget. */
(() => {
  const collections = [
    {id: 'start', icon: '🚀', title: 'Getting started'},
    {id: 'orders', icon: '📦', title: 'Orders & delivery'},
    {id: 'trouble', icon: '🔧', title: 'Troubleshooting'},
    {id: 'account', icon: '✅', title: 'Your account'}
  ];
  const articles = [
    {id: 'welcome', collection: 'start', title: 'Welcome to Coast & Co.', intro: 'A little help finding your way around.', paragraphs: ['Browse the collection, choose your favourite colour and check the size guide before you order.', 'Need a hand? Open Messages to talk to our team. We’ll be happy to help.']},
    {id: 'size', collection: 'start', title: 'Find the right size', intro: 'A comfortable fit starts here.', paragraphs: ['Open the size guide on the product page and compare the measurements with an item you already own.', 'If you are between two sizes, send our team a message with the item you have in mind.']},
    {id: 'tracking', collection: 'orders', title: 'Where is my order?', intro: 'Follow your parcel from our door to yours.', paragraphs: ['Open the shipping confirmation email and choose Track my order. You can also find the tracking link in your account.', 'Tracking can take a little time to update after a parcel leaves us. If anything looks wrong, send us your order number in Messages.']},
    {id: 'address', collection: 'orders', title: 'Change a delivery address', intro: 'Let us know before your parcel leaves.', paragraphs: ['Send our team your order number and the correct delivery address as soon as possible.', 'We’ll check whether the order can still be updated and confirm the next step with you.']},
    {id: 'confirmation', collection: 'trouble', title: 'I can’t find my confirmation email', intro: 'A few places to check first.', paragraphs: ['Check your spam or promotions folder and search for Coast & Co.', 'If you still cannot find the email, contact our team with the email address you used at checkout.']},
    {id: 'checkout', collection: 'trouble', title: 'Something went wrong at checkout', intro: 'Let’s get you back on track.', paragraphs: ['Check that your delivery details are complete, then refresh the checkout page.', 'If the problem continues, tell us what happened in Messages. A screenshot of the error can help us understand it.']},
    {id: 'password', collection: 'account', title: 'Reset your password', intro: 'Get back into your account.', paragraphs: ['Choose Forgot password on the sign-in page and enter the email address you used to create your account.', 'Follow the link in the reset email to choose a new password. Never share your password with anyone, including our team.']},
    {id: 'details', collection: 'account', title: 'Update your account details', intro: 'Keep your information up to date.', paragraphs: ['Sign in to your account and open Account details to update your name or contact information.', 'Changing a saved address does not change an order that is already being prepared. Contact our team if you need help with an existing order.']}
  ];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = kind => `<svg class="dp-icon wh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${kind === 'search' ? 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6' : 'M21 11a8 8 0 0 1-8 8H7l-5 3 1-6a8 8 0 1 1 18-5Z'}"/></svg>`;
  const helpMarkup = () => `<div class="wh-help"><div class="wh-help-content"><div data-widget-help-home><h3>Coast &amp; Co.</h3><p>Find answers about your order, your account and all things Coast &amp; Co.</p><label class="wh-search">${icon('search')}<input type="search" data-widget-help-search placeholder="Search for articles…" aria-label="Search help articles" autocomplete="off"></label><div data-widget-help-collections><small>COLLECTIONS</small><div class="wh-collections">${collections.map(c => `<button type="button" data-widget-help-collection="${c.id}"><span aria-hidden="true">${c.icon}</span><strong>${c.title}</strong><small>2</small><b aria-hidden="true">›</b></button>`).join('')}</div></div><div data-widget-help-results hidden></div></div><div data-widget-help-detail hidden></div></div><div class="wh-help-footer"><p>Still need help?</p><button type="button" data-widget-help-chat>${icon('chat')} Chat with us</button></div></div>`;

  // Older home previews retain their original nodes and event handlers. Only a
  // display:contents panel is added around the message view when enhancing them.
  document.querySelectorAll('.sr-widget, .preview-chat').forEach(widget => {
    if (widget.hasAttribute('data-widget-help')) return;
    const navigation = widget.querySelector('.sr-widget-nav, .preview-widget-tabs');
    const tablist = navigation?.firstElementChild;
    if (!tablist || tablist.children.length !== 2) return;
    const messages = document.createElement('div');
    messages.className = 'wh-messages-panel';
    messages.dataset.widgetPanel = 'messages';
    messages.setAttribute('role', 'tabpanel');
    const contents = [...widget.children].filter(child => child !== navigation && !child.classList.contains('preview-season-ribbon'));
    contents.forEach(child => messages.append(child));
    widget.append(messages);
    const help = document.createElement('div');
    help.className = 'wh-help-panel';
    help.dataset.widgetPanel = 'help';
    help.setAttribute('role', 'tabpanel');
    help.hidden = true;
    help.innerHTML = helpMarkup();
    widget.append(help);
    [...tablist.children].forEach((old, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = old.innerHTML;
      button.className = index === 0 ? 'active selected' : '';
      button.dataset.widgetTab = index === 0 ? 'messages' : 'help';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(index === 0));
      button.tabIndex = index === 0 ? 0 : -1;
      old.replaceWith(button);
    });
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Widget content');
    widget.setAttribute('data-widget-help', '');
  });

  let sequence = 0;
  document.querySelectorAll('[data-widget-help]').forEach(widget => {
    if (widget.dataset.helpReady) return;
    widget.dataset.helpReady = 'true';
    const tabs = [...widget.querySelectorAll('[data-widget-tab]')];
    const panels = [...widget.querySelectorAll('[data-widget-panel]')];
    const help = widget.querySelector('.wh-help');
    const home = help?.querySelector('[data-widget-help-home]');
    const detail = help?.querySelector('[data-widget-help-detail]');
    const search = help?.querySelector('[data-widget-help-search]');
    const results = help?.querySelector('[data-widget-help-results]');
    const collectionList = help?.querySelector('[data-widget-help-collections]');
    if (!home || !detail || !search || !results || !collectionList) return;
    // An image role would hide its descendants from assistive technology.
    widget.closest('[role="img"]')?.setAttribute('role', 'group');
    const prefix = `widget-help-${++sequence}`;
    tabs.forEach(tab => {
      const name = tab.dataset.widgetTab;
      tab.id = `${prefix}-tab-${name}`;
      tab.setAttribute('aria-controls', `${prefix}-panel-${name}`);
      const panel = panels.find(p => p.dataset.widgetPanel === name);
      panel.id = `${prefix}-panel-${name}`;
      panel.setAttribute('aria-labelledby', tab.id);
    });
    const activate = (name, focus = false) => {
      tabs.forEach(tab => {
        const selected = tab.dataset.widgetTab === name;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle('active', selected);
        tab.classList.toggle('selected', selected);
        if (selected && focus) tab.focus({preventScroll: true});
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.widgetPanel !== name; });
      widget.dataset.widgetView = name;
    };
    activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.dataset.widgetTab || 'messages');
    const articleList = items => `<div class="wh-article-list">${items.map(article => `<button type="button" data-widget-help-article="${article.id}"><span><strong>${escape(article.title)}</strong><small>${escape(article.intro)}</small></span><b aria-hidden="true">›</b></button>`).join('')}</div>`;
    let selectedCollection = null;
    let returnToSearch = false;
    const focusHeading = () => {
      // Collection/article navigation starts at the heading even after the user
      // has scrolled the previous view, without moving the marketing page.
      help.querySelector('.wh-help-content').scrollTop = 0;
      help.closest('.wh-help-panel').scrollTop = 0;
      detail.querySelector('h3')?.focus({preventScroll: true});
    };
    const openCollection = id => {
      const collection = collections.find(c => c.id === id);
      if (!collection) return;
      selectedCollection = id;
      returnToSearch = false;
      home.hidden = true;
      detail.hidden = false;
      detail.innerHTML = `<button type="button" class="wh-back" data-widget-help-back="home">‹ All collections</button><h3 tabindex="-1"><span aria-hidden="true">${collection.icon}</span> ${escape(collection.title)}</h3><p>Find the answer you need.</p>${articleList(articles.filter(a => a.collection === id))}`;
      focusHeading();
    };
    const openHome = () => {
      detail.hidden = true;
      home.hidden = false;
      const target = returnToSearch ? search : home.querySelector(`[data-widget-help-collection="${selectedCollection || 'start'}"]`);
      target?.focus({preventScroll: true});
    };
    widget.addEventListener('click', event => {
      const tab = event.target.closest('[data-widget-tab]');
      if (tab) { activate(tab.dataset.widgetTab); return; }
      if (event.target.closest('[data-widget-help-chat]')) { activate('messages', true); return; }
      const collection = event.target.closest('[data-widget-help-collection]');
      if (collection) { openCollection(collection.dataset.widgetHelpCollection); return; }
      const articleButton = event.target.closest('[data-widget-help-article]');
      if (articleButton) {
        const article = articles.find(a => a.id === articleButton.dataset.widgetHelpArticle);
        if (!article) return;
        returnToSearch = !home.hidden && search.value.trim().length > 0;
        if (!returnToSearch) selectedCollection = article.collection;
        home.hidden = true;
        detail.hidden = false;
        detail.innerHTML = `<button type="button" class="wh-back" data-widget-help-back="${returnToSearch ? 'search' : 'collection'}">‹ ${returnToSearch ? 'Search results' : escape(collections.find(c => c.id === article.collection).title)}</button><article class="wh-article"><small>COAST &amp; CO. HELP CENTER</small><h3 tabindex="-1">${escape(article.title)}</h3><p class="wh-article-intro">${escape(article.intro)}</p>${article.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</article>`;
        focusHeading();
        return;
      }
      const back = event.target.closest('[data-widget-help-back]');
      if (back) {
        if (back.dataset.widgetHelpBack === 'collection') openCollection(selectedCollection);
        else openHome();
      }
    });
    widget.addEventListener('keydown', event => {
      if (!event.target.matches('[data-widget-tab]')) return;
      const index = tabs.indexOf(event.target);
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); activate(tabs[next].dataset.widgetTab, true); }
    });
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      collectionList.hidden = Boolean(query);
      results.hidden = !query;
      if (!query) { results.innerHTML = ''; return; }
      const matches = articles.filter(article => `${article.title} ${article.intro} ${article.paragraphs.join(' ')}`.toLowerCase().includes(query));
      results.innerHTML = `<p class="wh-result-count" role="status">${matches.length ? `${matches.length} article${matches.length > 1 ? 's' : ''} found` : 'No articles found. Try another search or chat with us.'}</p>${articleList(matches)}`;
    });
  });
})();
