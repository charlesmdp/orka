// Only an explicit click on the Mac download CTA supplies the one-use fragment.
(() => {
  const installer = document.querySelector('[data-mac-installer]');
  if (!installer || location.hash !== '#start') return;
  // A refresh or a return from another page must not request a second copy.
  history.replaceState(history.state, '', location.pathname + location.search);
  document.getElementById('o-app-download-title').textContent = 'Orka is downloading.';
  document.querySelector('[data-download-status]').textContent = 'Download didn’t start?';
  document.querySelector('[data-download-label]').textContent = 'Download again';
  // A blocked or unavailable download must not replace the confirmation page.
  const file = document.createElement('iframe');
  file.hidden = true;
  file.title = 'Download Orka for macOS';
  file.src = installer.href;
  document.body.append(file);
})();
