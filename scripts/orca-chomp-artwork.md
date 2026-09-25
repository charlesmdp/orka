# Orky: chomp, crunch, plop

Created 25 September 2026 with the built-in imagegen tool (not the CLI).

## Saved assets

- `public/assets/orca-chomp-open.png`: generated open-jaw ceramic orca sprite.
- `public/assets/orca-chomp-closed.png`: aligned closed-jaw sprite.
- `public/assets/orca-chomp.mp4`: 960 × 600, 24 fps, silent 22.4-second loop, loaded only on activation.
- `public/assets/orca-chomp.gif`: 480 × 300, 8 fps fallback.
- `public/assets/orca-chomp-still.jpg`: reduced-motion poster.

Animation is composed with `scripts/render-orca-feast.cjs`. Each logo stays full-size between the teeth, reappears with a bite missing, and is swallowed at the second snap. Six small stone cubes emerge from the rear and bounce into a pile in the logo's main color. The seven brands are Crisp (cyan blue), Intercom (charcoal), tawk.to (green), Help Scout (royal blue), Zendesk (dark charcoal green), Chatway (blue), and Gorgias (coral).

The MP4/GIF replace the old, mild CSS-only mosaic easter egg. Normal homepage artwork and the draggable mascot are unaffected.

## Final prompt: open-jaw sprite

Use case: stylized-concept. Asset type: a single full-body character sprite for a humorous animated website easter egg. Reference 1 is the ceramic mosaic texture and jade/ivory palette; Reference 2 is only a pose and open-jaw reference. Create a MUCH more ferocious, carnivorous giant orca facing RIGHT in strict side profile, full body from tail on left to giant mouth on right. A very narrow angry squinting eye, strongly lowered brow, massive upper jaw and lower jaw open wide like an alligator at about 55 degrees, two unmistakable rows of big pointed ivory teeth, cavernous dark mouth. Aggressive muscular torpedo silhouette, dorsal fin, black-teal and ivory classic orca markings, fierce yet funny cartoon villain. Rich glossy ceramic tiles subtly cover the body, premium illustrated cutout with dimensional edges, not a flat mural. The visible small eye must look extremely angry, no smiling gentle face. Keep whole orca inside the image with padding, horizontal 3:2 canvas, occupies 90% width, dorsal fin top 10%, belly bottom 80%, mouth centered around 87% width and 53% height. Isolated on a genuinely transparent background, no scenery, no cast shadow on background, no logos, no text, no blood. Clean sprite edges. The jaw must be clearly able to clamp around a large logo.

References: `hero-ceramic-mosaic.jpg`, `orca-feast-open.png`.

## Final prompt: closed-jaw edit

Use case: precise-object-edit. Edit target is this exact orca animation sprite. Make a CLOSED-JAW bite frame: same furious ceramic mosaic orca in exactly the same position, same full body silhouette, upper head, dorsal fin, tail, eye, material, scale and image dimensions. Change ONLY the lower jaw and mouth: the lower jaw has snapped completely shut against the upper jaw, leaving a thin evil grin with a few jagged interlocking ivory teeth visible. Keep the squinting hostile eye and heavily lowered eyebrow. Close the jaw by lifting the lower jaw, do not shift the upper head or eye at all. Preserve the surrounding transparent background and all image framing exactly, no new scenery, no logos, no text. This must align with the open-mouth sprite for an immediate animated bite.

Edit target: the generated open-jaw sprite. Alpha preserved in both saved PNGs.
