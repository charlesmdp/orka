// The user's selected “Orka original” set, retrieved from their Avatar Studio.
// Source URLs and original-file hashes live beside the unchanged PNG files.
const originals = {
  sailfish: ['souriante', '#269cdb'],
  beluga: ['amusee', '#df65ac'],
  'sea-lion': ['curieuse', '#27b8aa'],
  barracuda: ['complice', '#9b70d8'],
  mackerel: ['zen', '#eb9a48'],
  jellyfish: ['accueillante', '#269cdb'],
  manta: ['attentive', '#27b8aa'],
  turtle: ['rassurante', '#df65ac']
};

// Applied only to the homepage inbox. Mapping by identity also updates the
// selected visitor's messages and profile, without changing teammate photos.
export function useOriginalAvatars(markup) {
  return markup.replace(/<span class="dp-animal" style="--animal-color:[^"]+"><img class="dp-animal-art" src="\/assets\/dashboard\/animals\/([^"/]+)\.png"/g,
    (match, animal) => {
      const original = originals[animal];
      if (!original) return match;
      const [expression, color] = original;
      return `<span class="dp-animal dp-original-avatar" style="--animal-color:${color}"><img class="dp-animal-art" src="/assets/orka-original/${expression}.png"`;
    });
}
