// Keep essential navigation available without waiting for the optional page modules.
function initializeHeaderNavigation() {
  const button = document.querySelector('.ed-menu-toggle');
  const nav = document.querySelector('#ed-main-nav');
  if (!button || !nav) return;
  const close = () => {
    nav.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
  };
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      close();
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!button.closest('header').contains(event.target)) close();
  });
  window.matchMedia('(min-width:1251px)').addEventListener('change', close);
}

export const headerNavigationScript = `<script>(${initializeHeaderNavigation.toString()})();</script>`;
