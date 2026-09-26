// Static decorative artwork. Regenerate with: node scripts/mosaic-wall-mask.mjs
// Tile fragments follow an organic wall; this adds no browser JavaScript.
import { writeFileSync } from 'node:fs';

const W = 1440, H = 2240, TAU = Math.PI * 2;
const f = n => Math.round(n * 10) / 10;
const random = (row, salt) => {
  const n = Math.sin(((row % 160 + 160) % 160) * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function edges(y) {
  const t = TAU * (y - 1680) / H;
  const center = 720 + 710 * Math.cos(t) + 35 * Math.sin(3 * t);
  const slope = (-710 * Math.sin(t) + 105 * Math.cos(3 * t)) * TAU / H;
  const width = (170 + 24 * Math.sin(3 * t + 1)) * Math.sqrt(1 + slope * slope);
  return [center - width, center + width];
}
const sides = [[], []], fragments = [], missing = [];
function tile(x, y, w, h, r, salt) {
  // Hand-cut quadrilaterals rather than identical squares or a serrated outline.
  const skew = (random(r, salt) - .5) * 7;
  return `M${f(x)} ${f(y + skew)}l${f(w)} ${f(-skew * .5)} ${f(skew)} ${f(h)} ${f(-w + 1)} ${f(skew * .4)}Z`;
}
for (let r = -8; r <= 168; r++) {
  const y = r * 14;
  const bounds = edges(y);
  for (let side = 0; side < 2; side++) {
    const sign = side ? 1 : -1;
    const edge = bounds[side] + sign * (random(r, 11 + side) - .5) * 34;
    sides[side].push([f(edge), f(y)]);
    // Partly laid rows project beyond the filled wall, then break into islands.
    if (random(r, 25 + side) > .18) {
      const w = 10 + random(r, 30 + side) * 30;
      fragments.push(tile(edge + sign * (5 + random(r, 35 + side) * 17) - w / 2, y, w, 9 + random(r, 40 + side) * 16, r, 43 + side));
    }
    if (random(r, 45 + side) > .48) {
      const w = 7 + random(r, 50 + side) * 15;
      fragments.push(tile(edge + sign * (39 + random(r, 55 + side) * 53) - w / 2, y + 6, w, 7 + random(r, 60 + side) * 17, r, 63 + side));
    }
    // Empty joints and pockets remain visible inside the unfinished edge.
    if (random(r, 65 + side) > .4) {
      const w = 9 + random(r, 70 + side) * 25;
      missing.push(tile(edge - sign * (10 + random(r, 75 + side) * 44) - w / 2, y + 1, w, 7 + random(r, 80 + side) * 18, r, 83 + side));
    }
  }
}
const outline = [...sides[0], ...sides[1].reverse()].map(([x,y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('') + 'Z';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><mask id="wall" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" style="mask-type:luminance"><path fill="white" d="${outline}"/><path fill="white" d="${fragments.join('')}"/><path fill="black" d="${missing.join('')}"/></mask></defs><path fill="white" mask="url(#wall)" d="M0 0H${W}V${H}H0Z"/></svg>\n`;
writeFileSync(new URL('../public/assets/mosaic-unfinished-wall.svg', import.meta.url), svg);
