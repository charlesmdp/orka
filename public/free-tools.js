const libraries = {
  math: () => import('./tools-math.js').then(m => m.mathTools),
  writing: () => import('./tools-writing.js').then(m => m.writingTools),
  sites: () => import('./tools-sites.js').then(m => m.siteTools)
};

function widgetPreview(preview) {
  const site = document.createElement('div');
  site.className = 'ft-preview-site';
  const hasWebsite = preview.image?.startsWith('blob:');
  if (hasWebsite) {
    const image = document.createElement('img');
    image.src = preview.image;
    image.alt = 'Website preview';
    site.append(image);
  } else {
    site.classList.add('ft-sample-site');
    const product = document.createElement('img');
    product.src = '/assets/orca-cap.webp';
    product.alt = 'Cap on the example storefront';
    site.append(product);
  }
  const label = document.createElement('small');
  label.textContent = hasWebsite ? preview.website : 'Sample storefront';
  const bubble = document.createElement('div');
  bubble.className = 'ft-preview-bubble';
  if (/^#[0-9a-f]{6}$/i.test(preview.color)) site.style.setProperty('--bubble', preview.color);
  const name = document.createElement('strong');
  name.textContent = preview.brand;
  const message = document.createElement('span');
  message.textContent = preview.message;
  bubble.append(name, message);
  const launcher = document.createElement('span');
  launcher.className = 'ft-preview-launcher';
  launcher.setAttribute('aria-hidden','true');
  launcher.textContent = '•••';
  site.append(label, bubble, launcher);
  return site;
}

async function activate(panel) {
  const status = panel.querySelector('.ft-status');
  let tools;
  try {
    tools = await libraries[panel.dataset.family]();
  } catch {
    status.textContent = 'The tool could not load. Reload this page to try again.';
    return;
  }
  const tool = tools.find(item => item.slug === panel.dataset.tool);
  const form = panel.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const result = panel.querySelector('[data-result]');
  const headline = result.querySelector('[data-headline]');
  const body = result.querySelector('[data-body]');
  const preview = result.querySelector('[data-preview]');
  const download = result.querySelector('[data-download]');
  const example = panel.querySelector('[data-example]');
  let fileUrl;
  let revision = 0;
  function clearOutput() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = undefined;
    download.removeAttribute('href');
    download.hidden = true;
    result.hidden = true;
    example.hidden = false;
  }
  form.addEventListener('input', () => {
    revision++;
    clearOutput();
    status.textContent = '';
    status.removeAttribute('data-error');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const current = ++revision;
    clearOutput();
    submit.disabled = true;
    status.removeAttribute('data-error');
    status.textContent = 'Working…';
    try {
      const output = await tool.run(Object.fromEntries(new FormData(form)));
      if (current !== revision) return;
      headline.textContent = output.headline;
      body.textContent = output.body;
      preview.replaceChildren();
      preview.hidden = !output.preview;
      if (output.preview) preview.append(widgetPreview(output.preview));
      if (output.download) {
        fileUrl = URL.createObjectURL(new Blob([output.download.text], {type:output.download.type}));
        download.href = fileUrl;
        download.download = output.download.filename;
        download.textContent = 'Download ' + output.download.filename.split('.').pop().toUpperCase() + ' ↓';
        download.hidden = false;
      }
      result.hidden = false;
      example.hidden = true;
      status.textContent = '';
      headline.focus();
    } catch (err) {
      if (current !== revision) return;
      status.dataset.error = '';
      status.textContent = err.message || 'Unable to complete this request. Try again.';
    } finally {
      submit.disabled = false;
    }
  });
  result.querySelector('[data-copy]').addEventListener('click',async () => {
    try {
      await navigator.clipboard.writeText([headline.textContent, body.textContent].join('\n\n'));
      status.textContent = 'Result copied.';
    } catch {
      status.textContent = 'Select the result text and copy it with your browser.';
    }
  });
  form.querySelector('fieldset').disabled = false;
}
const panel = document.querySelector('[data-tool][data-family]');
if (panel) activate(panel);
