// The preview is local to each marketing illustration; it never edits an article.
document.querySelectorAll('[data-article-preview]').forEach(demo=>{
 demo.querySelectorAll('[data-editor-mode]').forEach(button=>button.addEventListener('click',()=>{
  const preview=button.dataset.editorMode==='preview';
  demo.querySelector('[data-editor-write]').hidden=preview;
  demo.querySelector('[data-editor-preview]').hidden=!preview;
  demo.querySelectorAll('[data-editor-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 }));
});
