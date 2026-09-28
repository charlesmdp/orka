const scene = document.querySelector('[data-rescue-scene]');
if (scene) {
  const tiles = [...document.querySelectorAll('[data-rescue-tile]')];
  const slots = [...document.querySelectorAll('[data-rescue-slot]')];
  const count = document.querySelector('[data-rescue-count]');
  const status = document.querySelector('[data-rescue-status]');
  const quote = document.querySelector('[data-orky-quote]');
  const reset = document.querySelector('[data-rescue-reset]');
  const confetti = document.querySelector('[data-rescue-confetti]');
  const found = new Set();
  const responses = [
    ['One down. Orky is pretending not to notice.', '“I was just… checking the links.”'],
    ['Two recovered. The evidence is piling up.', '“That one was already like that.”'],
    ['3 of 3! Certified page rescuer. The page is still missing, but you made an orca very happy.', '“Burp. You saw nothing.”']
  ];
  let cleanup;
  document.querySelectorAll('[data-rescue-intro], [data-rescue-tiles], [data-rescue-panel]').forEach(el => { el.hidden = false; });
  tiles.forEach(tile => tile.addEventListener('click', () => {
    const id = Number(tile.dataset.rescueTile);
    if (found.has(id)) return;
    found.add(id);
    tile.setAttribute('aria-disabled', 'true');
    tile.setAttribute('aria-label', 'Collected mosaic tile ' + (id + 1));
    slots[id].classList.add('is-found');
    count.textContent = found.size + ' / 3';
    [status.textContent, quote.textContent] = responses[found.size - 1];
    if (found.size !== tiles.length) return;
    reset.hidden = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const colors = ['#ddbd68', '#f8edc9', '#8fc8b6', '#de957b'];
      for (let i = 0; i < 28; i++) {
        const piece = document.createElement('i');
        piece.style.setProperty('--x', ((i * 37) % 100) + '%');
        piece.style.setProperty('--delay', (i % 7) * .08 + 's');
        piece.style.setProperty('--c', colors[i % colors.length]);
        confetti.append(piece);
      }
      cleanup = window.setTimeout(() => confetti.replaceChildren(), 3200);
    }
  }));
  reset.addEventListener('click', () => {
    found.clear();
    window.clearTimeout(cleanup);
    confetti.replaceChildren();
    slots.forEach(slot => slot.classList.remove('is-found'));
    tiles.forEach((tile, i) => {
      tile.removeAttribute('aria-disabled');
      tile.setAttribute('aria-label', ['Collect the first mosaic tile, 4', 'Collect the second mosaic tile, 0', 'Collect the third mosaic tile, 4'][i]);
    });
    count.textContent = '0 / 3';
    status.textContent = 'Three missing tiles. One suspiciously full orca.';
    quote.textContent = '“In my defense, it looked like a cookie.”';
    reset.hidden = true;
    tiles[0].focus({preventScroll:true});
  });
}
