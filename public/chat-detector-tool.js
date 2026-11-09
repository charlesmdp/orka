const panel = document.querySelector('[data-chat-detector]');
const form = panel.querySelector('form');
const field = form.elements.url;
const submit = form.querySelector('[type="submit"]');
const submitLabel = submit.querySelector('span');
const output = panel.querySelector('[data-scan-result]');
const status = panel.querySelector('[role=status]');
const logos = new Map(Array.from(panel.querySelectorAll('[data-provider]'), row => [row.dataset.provider, row.querySelector('img')]));
let pending;

function website(value) {
  const text = value.trim();
  if (!text || text.includes(' ') || text.startsWith('//')) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : 'https://' + text;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')) return null;
    url.hash = '';
    return url;
  } catch { return null; }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function showStatus(message, error=false) {
  status.textContent = message;
  status.classList.toggle('cd-status-error', error);
}

function setBusy(busy) {
  submit.disabled = busy;
  submitLabel.textContent = busy ? 'Scanning…' : 'Scan website';
  panel.classList.toggle('cd-scanning',busy);
  output.setAttribute('aria-busy',String(busy));
}

function clearScan() {
  pending?.abort();
  pending = undefined;
  setBusy(false);
  output.hidden = true;
  output.replaceChildren();
  showStatus('');
  field.removeAttribute('aria-invalid');
}

function resultDetails(label, value) {
  const pair = element('div','cd-detail');
  pair.append(element('dt','',label),element('dd','',value));
  return pair;
}

function renderScan(scan) {
  output.replaceChildren();
  const found = scan.matches.length > 0;
  const title = found
    ? scan.matches.map(match=>match.name).join(' + ')
    : scan.partial ? 'Scan incomplete' : 'No supported widget identified';
  const titleText = element('h2','cd-result-title',title);
  titleText.tabIndex = -1;
  const header = element('div','cd-result-header');
  if (found) {
    const marks = element('div','cd-result-marks');
    for (const match of scan.matches) {
      const logo = logos.get(match.name);
      if (logo) marks.append(logo.cloneNode(true));
    }
    if (marks.childElementCount) header.append(marks);
  }
  const heading = element('div','cd-heading');
  heading.append(element('span','cd-result-label',found ? 'Widget detected' : 'Detection result'),titleText);
  header.append(heading);
  output.append(header);

  const details = element('dl','cd-details');
  details.append(resultDetails('Page scanned',scan.url));
  for (const match of scan.matches) {
    const label = scan.matches.length > 1 ? match.name + ' evidence' : 'Evidence';
    details.append(resultDetails(label,match.evidence));
    if (match.source && match.source !== scan.url) {
      details.append(resultDetails('Found in',match.source));
    }
  }
  output.append(details);
  const externalCount = scan.scriptsChecked;
  const scope = externalCount
    ? 'Checked the page and ' + externalCount + ' linked script' + (externalCount === 1 ? '.' : 's.')
    : 'Checked the page source.';
  output.append(element('p','cd-scope',scope));
  if (!found || scan.partial) {
    const note = scan.partial
      ? 'Part of the page or its scripts could not be checked. Try the exact page where the chat appears.'
      : 'A widget that appears after a sign-in, consent choice or click can be missed. Try the exact page where you see it.';
    output.append(element('p','cd-note',note));
  }
  const copy = element('button','cd-copy','Copy result');
  copy.type = 'button';
  const lines = [title,...Array.from(details.children,row=>row.firstElementChild.textContent+': '+row.lastElementChild.textContent),scope];
  const note = output.querySelector('.cd-note');
  if (note) lines.push(note.textContent);
  copy.addEventListener('click',async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showStatus('Result copied.');
    } catch { showStatus('Select the result text to copy it.'); }
  });
  output.append(copy);
  output.hidden = false;
  titleText.focus({preventScroll:true});
}

async function runScan() {
  clearScan();
  const url = website(field.value);
  if (!url) {
    field.setAttribute('aria-invalid','true');
    showStatus('Enter a public domain or HTTPS address, such as example.com.',true);
    field.focus();
    return;
  }
  const request = new AbortController();
  pending = request;
  setBusy(true);
  showStatus('Checking ' + url.hostname + '…');
  try {
    const response = await fetch('/api/support-site-tool',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'detect',url:url.href}),signal:request.signal
    });
    const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
    if (request.signal.aborted) return;
    if (!response.ok || !Array.isArray(data.scan?.matches)) {
      throw new Error(data.error || 'The scanner is unavailable. Try again in a moment.');
    }
    showStatus('');
    renderScan(data.scan);
  } catch (error) {
    if (request.signal.aborted) return;
    const reason = error instanceof TypeError ? 'Check your connection and try again.' : error.message;
    showStatus('Scan failed. ' + reason,true);
  } finally {
    if (pending === request) {
      pending = undefined;
      setBusy(false);
    }
  }
}

field.addEventListener('input',clearScan);
form.addEventListener('submit',event=>{
  event.preventDefault();
  runScan();
});
for (const example of panel.querySelectorAll('[data-scan-example]')) {
  example.addEventListener('click',()=>{
    field.value = example.dataset.scanExample;
    form.requestSubmit();
  });
}
setBusy(false);
