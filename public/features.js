export function matchesFeature(text, category, query, selectedCategory) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return (selectedCategory === 'all' || category === selectedCategory) && terms.every(term => normalize(text).includes(term));
}

if (typeof document !== 'undefined') {
  const cards = [...document.querySelectorAll('[data-feature-card]')];
  const groups = [...document.querySelectorAll('[data-feature-group]')];
  const categories = [...document.querySelectorAll('[data-category]:not([data-feature-card])')];
  const profiles = [...document.querySelectorAll('[data-audience]')];
  const search = document.querySelector('#feature-search');
  const status = document.querySelector('#feature-result-count');
  let category = 'all';
  function filterFeatures() {
    let count = 0;
    for (const card of cards) {
      const text = card.querySelector('h4').textContent + ' ' + card.querySelector('p').textContent;
      card.hidden = !matchesFeature(text, card.dataset.category, search.value, category);
      if (!card.hidden) count++;
    }
    groups.forEach(group => group.hidden = ![...group.querySelectorAll('[data-feature-card]')].some(card => !card.hidden));
    categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    status.textContent = `${count} of ${cards.length} features${category === 'all' && !search.value ? ' · the complete toolkit' : ''}`;
    document.querySelector('.feature-empty').hidden = count > 0;
    document.querySelector('.catalogue-status [data-reset-features]').hidden = category === 'all' && !search.value;
  }
  function resetFeatures() { category = 'all'; search.value = ''; filterFeatures(); }
  function chooseProfile(key, updateURL = true) {
    const selected = profiles.some(button => button.dataset.audience === key) ? key : 'all';
    profiles.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.audience === selected)));
    document.querySelectorAll('[data-audience-story]').forEach(story => story.hidden = story.dataset.audienceStory !== selected);
    cards.forEach(card => {
      const relevant = selected !== 'all' && card.dataset.audiences.split(' ').includes(selected);
      card.classList.toggle('is-relevant', relevant);
      card.querySelector('.feature-fit').hidden = !relevant;
    });
    if (updateURL) {
      const url = new URL(location.href);
      if (selected === 'all') url.searchParams.delete('for'); else url.searchParams.set('for', selected);
      history.replaceState(null, '', url);
    }
  }
  profiles.forEach(button => button.addEventListener('click', () => chooseProfile(button.dataset.audience)));
  categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.category; filterFeatures(); }));
  search.addEventListener('input', filterFeatures);
  document.querySelectorAll('[data-reset-features]').forEach(button => button.addEventListener('click', resetFeatures));
  document.querySelectorAll('.audience-picks a').forEach(link => link.addEventListener('click', resetFeatures));
  chooseProfile(new URL(location.href).searchParams.get('for'), false);
  window.addEventListener('popstate', () => chooseProfile(new URL(location.href).searchParams.get('for'), false));
  filterFeatures();
}
