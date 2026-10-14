// All actions stay in the example composer. GIF search filters the local preview selection.
for (const preview of document.querySelectorAll('[data-media-preview]')) {
  const emojiSearch=preview.querySelector('[data-emoji-search]');
  const gifSearch=preview.querySelector('[data-gif-search]');
  let category='frequent';
  const updateEmoji=()=>{
    const query=emojiSearch.value.trim().toLocaleLowerCase();
    let visibleCount=0;
    for(const section of preview.querySelectorAll('[data-emoji-section]')){
      let matches=0;
      const visibleCategory=query ? section.dataset.emojiSection!=='frequent' : category==='frequent' ? ['frequent','faces'].includes(section.dataset.emojiSection) : section.dataset.emojiSection===category;
      for(const button of section.querySelectorAll('[data-pick-emoji]')){
        button.hidden= !visibleCategory || !!query && !`${button.dataset.emojiWords} ${button.dataset.pickEmoji}`.includes(query);
        if(!button.hidden) matches++;
      }
      section.hidden=matches===0;
      visibleCount+=matches;
    }
    preview.querySelector('[data-emoji-empty]').hidden=visibleCount>0;
  };
  const showMode=mode=>{
    preview.dataset.mediaMode=mode;
    for(const panel of preview.querySelectorAll('[data-media-panel]')) panel.hidden=panel.dataset.mediaPanel!==mode;
    for(const button of preview.querySelectorAll('[data-media-open]')) button.setAttribute('aria-pressed',String(button.dataset.mediaOpen===mode));
    if(mode==='gif') for(const image of preview.querySelectorAll('img[data-gif-src]')) if(!image.getAttribute('src')) image.src=image.dataset.gifSrc;
  };
  const draft=preview.querySelector('[data-media-draft]');
  const status=preview.querySelector('[data-media-status]');
  const reset=preview.querySelector('[data-media-reset]');
  preview.addEventListener('click',event=>{
    const mode=event.target.closest('[data-media-open]');
    if(mode){showMode(mode.dataset.mediaOpen);return;}
    const categoryButton=event.target.closest('[data-emoji-category]');
    if(categoryButton){
      category=categoryButton.dataset.emojiCategory;emojiSearch.value='';
      for(const button of preview.querySelectorAll('[data-emoji-category]')) button.setAttribute('aria-pressed',String(button===categoryButton));
      updateEmoji();preview.querySelector('.mp-emoji-scroll').scrollTop=0;return;
    }
    const emoji=event.target.closest('[data-pick-emoji]');
    const gif=event.target.closest('[data-pick-gif]');
    if(emoji || gif){
      if(!draft.dataset.hasSelection){draft.replaceChildren();draft.dataset.hasSelection='true';}
      if(emoji){const selection=document.createElement('span');selection.className='mp-selected-emoji';selection.textContent=emoji.dataset.pickEmoji;draft.append(selection);}
      if(gif){const selection=document.createElement('img');selection.src=gif.dataset.pickGif;selection.alt=gif.dataset.gifLabel;selection.className='mp-selected-gif';draft.replaceChildren(selection);}
      status.textContent='Added to your draft';reset.hidden=false;
    }
    if(event.target.closest('[data-media-reset]')){
      const placeholder=document.createElement('span');placeholder.textContent='Write a reply…';draft.replaceChildren(placeholder);delete draft.dataset.hasSelection;status.textContent='Choose an emoji or GIF';reset.hidden=true;
    }
  });
  emojiSearch.addEventListener('input',updateEmoji);
  gifSearch.addEventListener('input',()=>{
    let count=0;const query=gifSearch.value.trim().toLocaleLowerCase();
    for(const gif of preview.querySelectorAll('[data-pick-gif]')){gif.hidden=!!query && !`${gif.dataset.gifWords} ${gif.dataset.gifLabel.toLocaleLowerCase()}`.includes(query);if(!gif.hidden)count++;}
    preview.querySelector('[data-gif-empty]').hidden=count>0;
  });
  updateEmoji();showMode(preview.dataset.mediaMode);
}
