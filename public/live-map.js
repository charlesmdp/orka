import {expandVisitors, clusterVisitors, clampView, zoomView, worldView, WORLD_LABELS, CITY_LABELS} from './map-model.js';

const svg = document.querySelector('.live-geographic-map');
const layer = svg.querySelector('.live-map-markers');
const labelLayer = svg.querySelector('.live-map-labels');
const popup = document.querySelector('.map-visitor-popup');
const viewport = document.querySelector('.geographic-viewport');
const projectButtons = [...document.querySelectorAll('[data-map-project]')];
const rows = [...document.querySelectorAll('.live-visitor-row')];
const points = expandVisitors();
const projectNames = Object.fromEntries(projectButtons.map(button => [button.dataset.mapProject, button.querySelector('span:nth-child(2)').textContent]));
const maxZoom = 64;
let project = 'all', zoom = 1, selectedId = null, view, drag, suppressClick = false;

function homeView() { return worldView(viewport.clientWidth,viewport.clientHeight); }
function renderLabels(scale) {
  const labels=document.createDocumentFragment(), placed=[];
  for (const country of [...CITY_LABELS,...WORLD_LABELS]) {
    if (zoom<country.minZoom || country.x<view.x || country.x>view.x+view.width || country.y<view.y || country.y>view.y+view.height) continue;
    const w=country.name.length*5.6+12;
    if(placed.some(p=>Math.abs(p.x-country.x)*scale<(p.w+w)/2 && Math.abs(p.y-country.y)*scale<19))continue;
    const group=element('g',{transform:`translate(${country.x} ${country.y}) scale(${1/scale})`});
    group.append(element('text',{'text-anchor':'middle',class:country.kind==='city'?'map-city-label':'map-country-label'},country.name));
    labels.append(group);placed.push({...country,w});
  }
  labelLayer.replaceChildren(labels);
}
function element(name, attributes, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key,value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}
function render() {
  if (!view || !viewport.clientWidth) return;
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
  const scale = Math.min(viewport.clientWidth/view.width,viewport.clientHeight/view.height);
  const filtered = points.filter(point => project === 'all' || point.project === project);
  const clusters = clusterVisitors(filtered, scale, zoom>=32?18:36);
  renderLabels(scale);
  const fragment = document.createDocumentFragment();
  for (const cluster of clusters) {
    const margin = 28/scale;
    if(cluster.x<view.x-margin||cluster.x>view.x+view.width+margin||cluster.y<view.y-margin||cluster.y>view.y+view.height+margin)continue;
    const count = cluster.members.length;
    const cities = [...new Set(cluster.members.map(point => point.city))];
    const point = cluster.members[0];
    const active = cluster.members.some(point => point.id === selectedId);
    const label = count === 1 ? `1 visitor · ${projectNames[point.project]} · ${point.city}` : `${count} visitors near ${cities.join(' and ')}. Zoom in to separate them.`;
    const marker = element('g', {class:`live-map-marker${active?' active':''}`,transform:`translate(${cluster.x} ${cluster.y}) scale(${1/scale})`,role:'button',tabindex:'0','aria-label':label,'aria-pressed':String(active)});
    marker.append(element('title',{},label));
    marker.append(element('circle',{class:'marker-halo',r:count>1?26:16}));
    marker.append(element('circle',{class:'marker-core',r:count>1?19:10}));
    if (count>1) marker.append(element('text',{dy:'.35em'},count));
    const activate = () => {
      if (suppressClick) return;
      if (count>1 && zoom<maxZoom) {
        const next = Math.min(maxZoom,zoom*2);
        const width = homeView().width/next, height = view.height*width/view.width;
        zoom = next;
        view = clampView({x:cluster.x-width/2,y:cluster.y-height/2,width,height});
        popup.hidden = true;
        render();
        svg.focus({preventScroll:true});
      } else {
        selectedId = point.id;
        if (point.profileId) rows.find(row=>row.dataset.visitor===point.profileId)?.click();
        popup.replaceChildren();
        const title = document.createElement('strong');
        title.textContent = `${count === 1 ? '1 live visitor' : count+' live visitors'} · ${projectNames[point.project]}`;
        popup.append(title,document.createTextNode(point.city));
        popup.hidden = false;
        // Keep focus on the activated marker; selection does not rebuild the map.
        layer.querySelectorAll('[aria-pressed]').forEach(node=>{node.classList.toggle('active',node===marker);node.setAttribute('aria-pressed',String(node===marker));});
      }
    };
    marker.addEventListener('click',activate);
    marker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();activate();}});
    fragment.append(marker);
  }
  layer.replaceChildren(fragment);
  document.querySelector('[data-map-zoom="out"]').disabled = zoom <= 1;
  document.querySelector('[data-map-zoom="in"]').disabled = zoom >= maxZoom;
  document.querySelector('.map-zoom-level').textContent = zoom === 1 ? 'World' : `${Number(zoom.toFixed(1))}×`;
  const status = `${filtered.length} example visitors. ${clusters.length} map markers at ${Number(zoom.toFixed(1))} times zoom.`;
  const output = document.querySelector('#map-cluster-status');
  if(output.textContent!==status)output.textContent=status;
}
function changeZoom(factor, anchor) {
  const next = Math.max(1, Math.min(maxZoom,zoom*factor));
  if (next === zoom) return;
  view = next === 1 ? homeView() : zoomView(view,next/zoom,anchor);
  zoom = next;
  popup.hidden = true;
  render();
}
function localPoint(event) {
  return new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
}
projectButtons.forEach(button=>button.addEventListener('click',()=>{
  project = button.dataset.mapProject;
  projectButtons.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  rows.forEach(row=>row.hidden=project!=='all'&&row.dataset.visitorProject!==project);
  document.querySelector('#map-project-summary').textContent = project==='all'?'6 projects. One live view.':projectNames[project]+' · live visitors';
  zoom=1;view=homeView();selectedId=null;popup.hidden=true;
  rows.find(row=>!row.hidden)?.click();
  render();
}));
rows.forEach(row=>row.addEventListener('click',()=>{
  const next=points.find(point=>point.profileId===row.dataset.visitor)?.id || null;
  if(selectedId===next)return;
  selectedId=next;
  const selected=points.find(point=>point.id===next);
  if(selected && zoom>1)view=clampView({...view,x:selected.x-view.width/2,y:selected.y-view.height/2});
  popup.hidden=true;
  render();
}));
document.querySelectorAll('[data-map-zoom]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.mapZoom==='reset'){zoom=1;view=homeView();popup.hidden=true;render();}
  else changeZoom(button.dataset.mapZoom==='in'?1.6:1/1.6);
}));
svg.addEventListener('dblclick',event=>{if(event.target.closest('.live-map-marker'))return;event.preventDefault();changeZoom(2,localPoint(event));});
svg.addEventListener('wheel',event=>{
  if(!event.ctrlKey&&!event.metaKey)return;
  event.preventDefault();changeZoom(event.deltaY<0?1.25:1/1.25,localPoint(event));
},{passive:false});
svg.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('.live-map-marker'))return;
  const point=localPoint(event);drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:point.x,y:point.y,view:{...view}};
  suppressClick=false;svg.setPointerCapture(event.pointerId);svg.classList.add('is-dragging');popup.hidden=true;
});
svg.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const scale=svg.getScreenCTM().a;
  const dx=(event.clientX-drag.startX)/scale,dy=(event.clientY-drag.startY)/scale;
  if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4)suppressClick=true;
  view=clampView({...drag.view,x:drag.view.x-dx,y:drag.view.y-dy});render();
});
function endDrag(event){if(!drag||drag.id!==event.pointerId)return;drag=null;svg.classList.remove('is-dragging');if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);setTimeout(()=>{suppressClick=false;},0);}
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
svg.addEventListener('keydown',event=>{
  if(event.target!==svg)return;
  const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(moves[event.key]){event.preventDefault();const [x,y]=moves[event.key];view=clampView({...view,x:view.x+x*view.width*.15,y:view.y+y*view.height*.15});render();}
  else if(['+','=','-'].includes(event.key)){event.preventDefault();changeZoom(event.key==='-'?1/1.6:1.6);}
  else if(event.key==='Home'){event.preventDefault();zoom=1;view=homeView();render();}
  else if(event.key==='Escape')popup.hidden=true;
});
function resize(){
  const base=homeView();
  if(!view||zoom===1)view=base;
  else {const width=base.width/zoom,height=base.height/zoom;view=clampView({x:view.x+(view.width-width)/2,y:view.y+(view.height-height)/2,width,height});}
  render();
}
if('ResizeObserver'in window)new ResizeObserver(resize).observe(viewport);
else window.addEventListener('resize',resize);
resize();
