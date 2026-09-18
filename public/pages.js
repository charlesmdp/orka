const clearPreference = document.querySelector('[data-clear-preference]');
clearPreference?.addEventListener('click', () => {
  try {
    localStorage.removeItem('orka-brand-theme');
    document.querySelector('#preference-status').textContent = 'Your saved color preference has been removed for this website.';
  } catch {
    document.querySelector('#preference-status').textContent = 'Your browser blocked storage access. You can clear this website’s data in your browser settings.';
  }
});
