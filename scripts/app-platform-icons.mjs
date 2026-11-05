// Original platform illustrations for the app picker. They sit beside a text
// label, so keep them decorative and self-contained (no shared SVG IDs).
const drawings = {
  mac: `
    <g transform="rotate(-5 56 56)">
      <rect x="15" y="16" width="82" height="82" rx="20" fill="#27618f"/>
      <rect x="15" y="12" width="82" height="82" rx="20" fill="#54b5fa"/>
      <path d="M35 12h23c-5 12-8 27-8 41h12c0 13 2 28 6 41H35a20 20 0 0 1-20-20V32a20 20 0 0 1 20-20Z" fill="#338ff0"/>
      <path d="M59 12h18a20 20 0 0 1 20 20v42a20 20 0 0 1-20 20H63c-4-13-5-25-5-37H46c0-16 5-33 13-45Z" fill="#a5ddff"/>
      <path d="M59 12h18a20 20 0 0 1 20 20v6C84 31 71 27 53 27c1-5 4-11 6-15Z" fill="#c8edff"/>
      <path d="M35 15h16c-8 4-14 8-20 14-5 5-9 11-13 17V33c0-10 7-18 17-18Z" fill="#65c3ff"/>
      <path d="M35 40v6m39-6v6" stroke="#153950" stroke-width="4.3" stroke-linecap="round"/>
      <path d="M34 65c11 11 31 12 45-1" fill="none" stroke="#153950" stroke-width="4.3" stroke-linecap="round"/>
    </g>`,
  iphone: `
    <g transform="rotate(8 56 56)">
      <rect x="33" y="9" width="49" height="95" rx="13" fill="#965466"/>
      <rect x="30" y="7" width="49" height="95" rx="13" fill="#373342"/>
      <rect x="33" y="10" width="43" height="89" rx="10" fill="#ffc09c"/>
      <path d="M33 68c5-24 14-33 28-35 6-1 11-1 15-5v61a10 10 0 0 1-10 10H43a10 10 0 0 1-10-10Z" fill="#fc8c86"/>
      <path d="M33 83c9-16 13-39 28-44 6-2 12-4 15-9v14c-13 7-20 16-25 32-3 9-7 16-12 22a10 10 0 0 1-6-9Z" fill="#f97981"/>
      <path d="M43 99c12-10 15-25 24-36 2-4 6-7 9-9v35a10 10 0 0 1-10 10Z" fill="#db5b85"/>
      <rect x="47" y="14" width="16" height="4.5" rx="2.25" fill="#362d39"/>
      <path d="M48 94h13" stroke="#fff2eb" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M30 28v5m0 5v9m49-10v13" stroke="#786b77" stroke-width="1.8" stroke-linecap="round"/>
    </g>`,
  android: `
    <g transform="rotate(-5 56 56)">
      <path d="m34 32-7-11m51 11 7-11" fill="none" stroke="#39845c" stroke-width="5" stroke-linecap="round"/>
      <path d="m33 31-6-10m50 10 7-10" fill="none" stroke="#7bdb91" stroke-width="3.3" stroke-linecap="round"/>
      <rect x="14" y="58" width="10" height="24" rx="5" fill="#6ac481"/>
      <rect x="88" y="58" width="10" height="24" rx="5" fill="#3d9e69"/>
      <rect x="35" y="79" width="12" height="19" rx="5" fill="#469e69"/>
      <rect x="68" y="79" width="12" height="19" rx="5" fill="#37875e"/>
      <path d="M27 57h58v20c0 7-5 12-12 12H39c-7 0-12-5-12-12Z" fill="#62c881"/>
      <path d="M27 57h58v20c0 7-5 12-12 12H39c17-4 30-14 36-28H27Z" fill="#47ae72"/>
      <path d="M23 53c1-17 14-31 33-31s33 14 34 31Z" fill="#79db94"/>
      <path d="M31 43c4-10 14-17 26-17" fill="none" stroke="#aae9b5" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M23 53h67c0-6-2-11-5-16 0 6-4 12-11 13H24Z" fill="#59bd7d"/>
      <g fill="#205d43"><circle cx="40" cy="42" r="2.8"/><circle cx="72" cy="42" r="2.8"/></g>
    </g>`,
  web: `
    <g transform="rotate(-12 54 54)">
      <circle cx="53.5" cy="54" r="40" fill="#6763bb"/>
      <circle cx="52" cy="51" r="39" fill="#9d9be9"/>
      <path d="M20 48c0-17 13-31 30-32 4 0 9 0 13 1-10 4-14 10-21 20-8 10-14 17-22 19Z" fill="#bdbaf4"/>
      <path d="M17 69c8 13 21 21 35 21 21 0 38-16 39-37-9 16-22 26-42 26-12 0-23-4-32-10Z" fill="#8683de"/>
      <g fill="none" stroke="#535398" stroke-linecap="round" stroke-width="2.4">
        <circle cx="52" cy="51" r="39"/><ellipse cx="52" cy="51" rx="17" ry="39"/>
        <path d="M13 51h78M20 29c15 7 45 7 64 0M20 73c15-7 45-7 64 0"/>
      </g>
    </g>
    <path d="m70 63 28 17-13 4 8 11-7 5-8-12-8 10Z" fill="#6566a2" opacity=".28"/>
    <path d="m70 60 28 17-13 4 8 11-7 5-8-12-8 10Z" fill="#fffdf7" stroke="#414566" stroke-width="3" stroke-linejoin="round"/>`
};

export function platformIcon(key) {
  const art = Object.hasOwn(drawings, key) ? drawings[key] : '';
  if (!art) return '';
  return `<svg class="app-platform-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="112" height="112" aria-hidden="true" focusable="false"><ellipse cx="56" cy="101" rx="32" ry="4" fill="#25392e" opacity=".07"/>${art}</svg>`;
}
