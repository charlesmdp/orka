import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Each illustration pairs a recognizable object with a detail specific to the tool.
// Coordinates share a 144px artboard so the images also work as small directory icons.
const palettes = {
  sea: ['#e3f2e7', '#98d9ad', '#4f9b77', '#1b5a49'],
  sky: ['#e6f2ff', '#98cef5', '#528cc2', '#264f78'],
  plum: ['#efebfc', '#c7b2f2', '#9378ce', '#574581'],
  peach: ['#fff0e2', '#ffc297', '#d79165', '#8c5642'],
  gold: ['#faf3d8', '#f8d16e', '#c69c46', '#725a31']
};
const toolsArt = {
  'live-chat-detector': ['plum','browser','magnifier'],
  'chat-widget-preview': ['sky','browser','bubble'],
  'chat-welcome-message-generator': ['peach','bubble','hello'],
  'help-center-to-markdown-converter': ['sky','book','markdown'],
  'help-center-migration-checker': ['sea','folder','check'],
  'help-center-redirect-map-generator': ['peach','signpost','route'],
  'help-center-broken-link-checker': ['gold','chain','crack'],
  'support-tickets-to-faq-generator': ['plum','papers','question'],
  'live-chat-staffing-calculator': ['sea','roster','people'],
  'cost-per-support-ticket-calculator': ['gold','calculator','coin'],
  'support-backlog-calculator': ['plum','tray','clock'],
  'first-response-time-calculator': ['sky','stopwatch','bubble'],
  'wismo-calculator': ['peach','box','pin'],
  'black-friday-support-forecast': ['plum','calendar','chart'],
  'ecommerce-contact-rate-calculator': ['sea','bag','percent'],
  'ai-support-cost-calculator': ['sky','chip','coin'],
  'shopify-faq-generator': ['sea','bag','question'],
  'support-conversation-anonymizer': ['plum','bubble','mask'],
  'support-translation-checker': ['sky','papers','translate'],
  'chat-transcript-to-bug-report': ['peach','clipboard','bug']
};

function artwork(slug) {
  const [tone, object, detail] = toolsArt[slug];
  const [wash, light, mid, ink] = palettes[tone];
  const line = (d, width=3) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rect = (x,y,w,h,r,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const circle = (x,y,r,fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const shape = (d,fill) => `<path d="${d}" fill="${fill}"/>`;
  const paper = '#fffdf5';
  const objects = {
    browser: rect(21,31,96,74,11,mid)+rect(21,26,96,74,11,light)+rect(27,44,84,50,5,paper)+[31,38,45].map(x=>circle(x,36,2.1,ink)).join('')+rect(34,51,24,34,3,wash)+rect(64,53,35,5,2,light)+rect(64,65,25,4,2,light)+rect(64,75,30,4,2,light),
    book: shape('M18 32q25-8 49 3 24-11 48-4v70q-23-7-48 3-26-10-49-2Z',mid)+shape('M20 26q25-8 47 5v66q-23-11-47-5Z',paper)+shape('M67 31q26-12 46-5v66q-22-5-46 5Z',light)+line('M67 33v62M30 42q13-3 24 2m-24 9q14-2 23 3m22-13q15-6 27-4',2.4),
    folder: shape('M19 39q0-7 7-7h27l8 10h47q8 0 8 8v49q0 8-8 8H27q-8 0-8-8Z',mid)+rect(28,39,75,53,5,paper)+rect(33,46,67,50,5,wash)+shape('M20 53h96l-5 42q-1 9-10 9H32q-9 0-10-9Z',light)+rect(33,65,24,5,2,paper),
    signpost: rect(58,18,10,91,4,mid)+shape('M28 26h65l13 12-13 12H28Z',light)+shape('M80 58H32L18 70l14 12h48Z',mid)+line('M43 37h40m-41 32h21',3)+circle(64,38,2,ink)+circle(64,70,2,ink),
    chain: '<g transform="rotate(-38 65 63)">'+`<rect x="29" y="33" width="45" height="31" rx="14" stroke="${mid}" stroke-width="10" fill="none"/><rect x="61" y="57" width="45" height="31" rx="14" stroke="${light}" stroke-width="10" fill="none"/>`+'</g>',
    bubble: shape('M20 43q0-15 16-15h62q17 0 17 17v35q0 15-16 15H56l-24 16 4-17q-16-1-16-16Z',mid)+shape('M19 38q0-15 16-15h62q17 0 17 17v35q0 15-16 15H54l-23 16 4-17q-16-1-16-16Z',light)+[43,61,79].map(x=>circle(x,54,4,paper)).join(''),
    papers: '<g transform="rotate(-9 60 65)">'+rect(23,26,69,78,6,mid)+'</g>'+rect(35,19,68,83,7,light)+rect(40,23,58,71,4,paper)+rect(47,33,29,6,2,mid)+line('M47 48h40m-40 10h32m-32 11h36m-36 10h19',2),
    roster: rect(22,30,88,74,9,mid)+rect(22,25,88,73,9,paper)+rect(22,25,88,17,6,light)+[54,69,84].map(y=>circle(35,y,4,mid)+rect(46,y-2,27,4,2,light)+rect(80,y-4,15,8,3,wash)).join(''),
    calculator: rect(30,23,65,86,11,mid)+rect(28,17,65,86,11,light)+rect(36,26,48,20,4,ink)+[54,68,82].map(y=>[37,53,69].map(x=>rect(x,y,11,9,3,paper)).join('')).join('')+rect(57,33,18,4,2,'#d5f7c0'),
    tray: rect(37,25,56,62,4,mid)+rect(30,32,57,63,4,light)+rect(23,40,57,60,4,paper)+line('M32 51h36m-36 10h23',2)+shape('M16 71h30l8 11h21l9-11h25v27q0 8-9 8H25q-9 0-9-9Z',mid)+shape('M16 71h29l8 10h22l9-10h25l-3 8H89l-9 11H47l-8-11H18Z',light),
    stopwatch: rect(56,14,18,12,3,mid)+rect(53,11,23,6,2,ink)+circle(63,66,42,mid)+circle(62,61,41,light)+circle(62,61,31,paper)+line('M62 35v4m0 44v4M36 61h4m44 0h4M62 61l14-16m-14 16-10-6')+circle(62,61,4,ink),
    box: shape('m20 42 45-18 47 17-46 22Z',light)+shape('m20 42 45 21v45L20 85Z',mid)+shape('m65 63 47-22v45l-47 22Z',light)+shape('m36 35 11-4 50 17-12 6Z',paper)+shape('m85 54 12-6v14l-12 5Z',wash)+line('m28 73 14 6',2),
    calendar: rect(24,27,86,77,9,mid)+rect(23,22,86,76,9,paper)+rect(23,22,86,20,8,light)+line('M43 16v14m43-14v14',5)+[50,65,80].map(y=>[33,49,65,81].map(x=>rect(x,y,9,7,2,wash)).join('')).join(''),
    bag: shape('M29 38h64l9 66H18Z',mid)+shape('M30 34h58l7 65H22Z',light)+line('M43 45V32c0-23 32-23 32 0v13',4)+line('M28 91h61',2),
    chip: [36,51,66,81].map(v=>line(`M${v} 20v11m0 60v12M16 ${v}h12m63 0h12`,4)).join('')+rect(24,26,74,70,12,mid)+rect(23,22,73,68,12,light)+rect(34,32,51,47,7,ink)+shape('m60 38 4 12 12 5-12 5-5 13-4-13-12-5 12-5Z',paper),
    clipboard: rect(27,26,71,82,8,mid)+rect(26,22,71,81,8,light)+rect(32,28,59,68,4,paper)+rect(44,17,34,14,6,ink)+line('m39 45 3 3 7-8m-10 23 3 3 7-8m-10 23 3 3 7-8M56 45h24m-24 17h24m-24 17h13',2.4)
  };
  const badges = {
    magnifier: circle(98,86,18,paper)+circle(98,86,14,mid)+circle(98,86,10,wash)+line('m109 98 13 15',8),
    bubble: shape('M79 74q0-7 8-7h30q8 0 8 8v18q0 8-8 8h-13l-12 9v-10q-13 0-13-8Z',ink)+[90,101,112].map(x=>circle(x,84,2,paper)).join(''),
    hello: shape('M85 91q-5-6-2-9t9 1l-3-16q0-5 4-4l5 17-1-20q1-5 5-2l3 20 1-17q2-4 5 0l1 18 3-12q3-4 6 0l-3 26q-2 16-15 17-10 0-18-11Z','#f6c06f')+line('M80 65l-4-6m41 0 4-5',2.4),
    markdown: rect(72,75,54,29,5,ink)+`<path d="M79 96V83l6 7 6-7v13m16-15v13m-6-5 6 7 6-7" fill="none" stroke="${paper}" stroke-width="3" stroke-linejoin="round"/>`,
    check: circle(100,88,20,ink)+`<path d="m90 88 7 7 14-16" fill="none" stroke="${paper}" stroke-width="4" stroke-linecap="round"/>`,
    route: line('M73 98h13q7 0 7-7v-8q0-7 8-7h15m-6-6 6 6-6 6')+circle(72,98,4,paper),
    crack: shape('m88 62-12 20 12-2-5 17 23-26-14 2 8-14Z',ink),
    question: circle(101,88,21,ink)+`<path d="M94 83c0-10 18-10 15 0-1 5-8 5-8 11" fill="none" stroke="${paper}" stroke-width="3.5" stroke-linecap="round"/>`+circle(101,100,2,paper),
    people: circle(96,79,9,ink)+circle(116,81,6,mid)+shape('M81 106q0-18 15-18t16 18Z',ink)+shape('M110 94q12-8 17 9h-13Z',mid),
    coin: circle(102,89,20,mid)+circle(99,86,20,'#f4c45b')+circle(99,86,14,'#ffde88')+line('M104 79c-12-6-17 6-5 7 12 2 6 12-6 8m6-19v23',2.7),
    clock: circle(100,88,21,ink)+circle(100,88,16,paper)+line('M100 77v11l8 5',3),
    pin: shape('M80 78c0-24 38-24 38 0 0 12-19 32-19 32S80 89 80 78Z',ink)+circle(99,77,7,paper),
    chart: rect(76,73,48,32,6,ink)+`<path d="m83 96 9-10 7 4 17-12m-7 0h7v7" fill="none" stroke="${paper}" stroke-width="2.7" stroke-linejoin="round"/>`,
    percent: circle(98,87,20,ink)+`<g fill="none" stroke="${paper}" stroke-width="2.8"><circle cx="92" cy="80" r="3"/><circle cx="104" cy="94" r="3"/><path d="m106 77-16 20"/></g>`,
    mask: rect(72,76,54,24,9,ink)+[86,109].map(x=>shape(`m${x-6} 83 13 3q-5 8-13-3Z`,paper)).join(''),
    translate: rect(76,70,47,33,7,ink)+`<path d="m83 95 6-18 7 18m-11-6h9m5-9h17m-8-4v4m3 2q-3 10-11 13m4-11q4 7 12 10" fill="none" stroke="${paper}" stroke-width="2.2" stroke-linecap="round"/>`,
    bug: circle(101,88,21,ink)+`<g fill="none" stroke="${paper}" stroke-width="2.4" stroke-linecap="round"><rect x="95" y="81" width="12" height="16" rx="6"/><path d="M98 81l-3-5m9 5 3-5m-13 10-5-3m5 8h-5m6 5-4 4m17-14 5-3m-5 8h5m-6 5 4 4M101 83v11"/></g>`
  };
  const svg = `<ellipse cx="70" cy="114" rx="43" ry="5" fill="${ink}" opacity=".09"/><g transform="rotate(-6 66 62)">${objects[object]}</g><g transform="rotate(5 99 88)">${badges[detail]}</g>`;
  return {svg,wash,ink};
}

const wrapSvg = art => `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="136" viewBox="0 0 144 136">${art}</svg>`;
const xml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function socialTitle(title) {
  const lines = [''];
  for (const word of title.split(' ')) {
    const previous = lines.at(-1);
    if (previous && (previous+' '+word).length > 21) lines.push(word);
    else lines[lines.length-1] = (previous+' '+word).trim();
  }
  return lines.map((line,index)=>`<tspan x="75" dy="${index?70:0}">${xml(line)}</tspan>`).join('');
}
export async function writeToolImages(output,tools) {
  const directory = path.join(output,'assets','free-tools');
  await mkdir(directory,{recursive:true});
  for (const tool of [...tools,{slug:'free-tools',name:'Free customer support tools'}]) {
    const {svg,wash,ink} = artwork(tool.slug === 'free-tools' ? 'live-chat-detector' : tool.slug);
    await writeFile(path.join(directory,tool.slug+'.svg'),wrapSvg(svg));
    const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f7f8f0"/><rect x="747" y="55" width="400" height="520" rx="155" fill="${wash}"/><g transform="translate(760 141) scale(2.65)">${svg}</g><g font-family="DejaVu Sans, sans-serif" fill="#193a2e"><text x="75" y="100" font-size="38" font-weight="bold">orka.</text><text x="75" y="250" font-size="54" font-weight="bold">${socialTitle(tool.name)}</text><text x="75" y="542" font-size="25" fill="${ink}">orka.chat / free tools</text></g></svg>`;
    await sharp(Buffer.from(social)).jpeg({quality:88}).toFile(path.join(directory,tool.slug+'-share.jpg'));
  }
}
