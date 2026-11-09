const libraries = {
  math: () => import('./tools-math.js').then(m => m.mathTools),
  writing: () => import('./tools-writing.js').then(m => m.writingTools),
  sites: () => import('./tools-sites.js').then(m => m.siteTools)
};

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
    example.hidden = true;
    status.textContent = 'Working…';
    try {
      const output = await tool.run(Object.fromEntries(new FormData(form)));
      if (current !== revision) return;
      headline.textContent = output.headline;
      body.textContent = output.body;
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
