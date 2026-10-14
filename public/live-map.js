import {expandVisitors, clusterVisitors, clampView, zoomView, worldView, WORLD_LABELS, CITY_LABELS, inhabitedWorldView, filterMapVisitors} from './map-model.js';

const svg = document.querySelector('.live-geographic-map');
const layer = svg.querySelector('.live-map-markers');
const labelLayer = svg.querySelector('.live-map-labels');
const popup = document.querySelector('.map-visitor-popup');
const viewport = document.querySelector('.geographic-viewport');
const projectButtons = [...document.querySelectorAll('[data-map-project]')];
const rows = [...document.querySelectorAll('.live-visitor-row')];
const points = expandVisitors();
const projectNames = Object.fromEntries(projectButtons.map(button => [button.dataset.mapProject, button.querySelector('span:nth-child(2)').textContent]));
const mosaic = document.body.classList.contains('new2-mosaic');
const search = document.querySelector('[data-map-search]');
const locationPanel = document.querySelector('[data-map-location]');
const profileNames = Object.fromEntries(rows.map(row=>[row.dataset.visitor,row.querySelector('strong').textContent.trim()]));
// The same marine avatars and navigation glyphs used by the real dashboard.
const mapDashboardNav = {
  "/analytics": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8.61919 6.50053C9.18999 6.11913 9.78933 5.78834 10.4103 5.51024C12.1717 4.72141 13.0525 4.327 14.2241 5.08607C15.3958 5.84515 15.3958 7.09033 15.3958 9.58068V11.5066C15.3958 13.9276 15.3958 15.1382 16.1479 15.8903C16.9 16.6424 18.1105 16.6424 20.5316 16.6424H22.4575C24.9479 16.6424 26.193 16.6424 26.9521 17.8141C27.7112 18.9857 27.3168 19.8664 26.5279 21.6279C26.2498 22.2489 25.919 22.8482 25.5377 23.419C24.1974 25.4249 22.2924 26.9882 20.0636 27.9115C17.8348 28.8347 15.3822 29.0762 13.0162 28.6056C10.6501 28.1349 8.47668 26.9732 6.77082 25.2674C5.06497 23.5615 3.90326 21.3881 3.43262 19.022C2.96198 16.6559 3.20353 14.2034 4.12673 11.9746C5.04993 9.7458 6.61332 7.84081 8.61919 6.50053Z\" class=\"svg-bg fill-shell-icon\"></path><path d=\"M28.1658 9.66902C27.1235 7.02319 25.0146 4.91427 22.3687 3.87195C20.3895 3.09222 18.6055 4.88522 18.6055 7.01254V12.1483C18.6055 12.8574 19.1803 13.4323 19.8894 13.4323H25.0252C27.1525 13.4323 28.9455 11.6483 28.1658 9.66902Z\" class=\"svg-bg fill-shell-icon-muted\"></path></svg>",
  "/live": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" viewBox=\"0 0 86 86\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"M43 86C66.7482 86 86 66.7482 86 43C86 19.2518 66.7482 0 43 0C19.2518 0 0 19.2518 0 43C0 66.7482 19.2518 86 43 86Z\" class=\"svg-bg fill-shell-icon\"></path><g><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M68.6024 34.3726C78.8755 23.1381 95.5684 15.5541 105.725 22.8275C112.497 27.6765 112.875 40.7824 106.86 62.1452L96.2483 58.1243C93.9716 56.6196 91.9519 55.6166 90.1893 55.1154C82.4557 52.9164 74.6831 51.4877 72.5976 49.3408C69.1449 45.7866 65.5116 37.7527 68.6024 34.3726Z\" class=\"svg-land fill-shell-land\"></path></g><g><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M-19.35 -24.725H36.0125C37.3132 -15.6241 38.4573 -9.2873 39.4449 -5.71464C41.4548 1.55658 45.1092 7.02769 45.1092 10.7007C45.1092 14.5433 42.1843 14.5433 40.7323 18.431C39.5406 21.6218 51.7573 35.4698 34.7694 31.3714C32.447 30.8111 28.147 33.7292 31.6637 38.0345C32.2177 38.7127 37.2891 42.5445 42.1214 43C46.1131 43.3763 49.7669 42.181 51.3854 42.181C54.9633 42.181 65.0402 46.2264 56.7063 57.5066C54.8452 60.0255 49.8962 62.1202 48.7776 64.3922C46.3792 69.2638 47.4857 73.5499 42.1214 74.1392C37.2813 74.6708 38.2097 68.3288 37.0189 63.3405C36.2744 60.2218 33.109 58.1528 32.102 57.0173C30.1499 54.8162 33.4641 47.6881 31.0178 45.0497C25.6805 39.2933 20.4285 43.4808 12.7955 38.0345C7.23985 34.0703 5.05702 25.2406 -1.12299 23.5853C-6.01244 22.2757 -12.0881 24.4473 -19.35 30.1V-24.725Z\" class=\"svg-land fill-shell-land\"></path></g></g></svg>",
  "/rooms": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" viewBox=\"0 0 767.12 710\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><path d=\"M364.071185,0 C376.693372,0 389.315558,0 401.937744,0 C499.294245,1.56854383 583.444783,35.2935478 654.38147,101.175 C658.945179,105.539922 663.284055,110.076033 667.398099,114.783333 C619.461402,111.387956 571.469483,110.270494 523.426287,111.430556 C488.636386,112.656489 454.189651,116.732283 420.082137,123.658333 C375.769585,132.551083 334.484781,148.854656 296.226934,172.569444 C276.275596,185.6721 257.933982,200.858211 241.202091,218.127778 C230.961948,230.077867 220.575072,241.9112 210.041068,253.627778 C183.312011,282.610372 153.66289,307.920294 121.0941,329.558333 C96.9873015,345.160583 71.2167416,357.388361 43.7832086,366.241667 C29.4519783,370.62 14.8575755,373.709683 0,375.511111 C0,368.279761 0,361.048017 0,353.816667 C6.26585049,255.644967 44.264035,172.219967 113.99412,103.541667 C184.094981,37.7945622 267.454266,3.28068122 364.071185,0 Z\" class=\"svg-bg fill-shell-icon\"></path><path d=\"M667.398099,114.783333 C718.61262,169.0936 750.365307,233.388044 762.656161,307.666667 C767.941702,341.51 768.533367,375.432222 764.431156,409.433333 C740.318836,439.064 709.816534,459.377889 672.920306,470.375 C648.717263,477.522333 624.001445,481.596944 598.764961,482.602778 C568.116715,483.794 537.610469,482.216222 507.254111,477.869444 C493.645816,476.0195 480.100633,473.783 466.626449,471.163889 C436.956422,464.651611 407.243007,458.3405 377.482258,452.230556 C327.139457,442.483833 276.387618,435.908444 225.227136,432.508333 C177.552744,429.187111 130.088196,431.029167 82.8330974,438.030556 C58.5247389,441.840889 34.7266716,447.6905 11.4388563,455.583333 C5.01447905,432.421556 1.20154536,408.885056 0,384.977778 C0,381.822222 0,378.666667 0,375.511111 C14.8575755,373.709683 29.2909546,369.378333 43.6221849,365 C71.0557179,356.146694 96.0153869,342.10225 120.122185,326.5 C152.690975,304.861961 181.393128,279.482594 208.122185,250.5 C218.656188,238.783422 229.882042,226.450089 240.122185,214.5 C256.854076,197.230433 276.170847,181.102656 296.122185,168 C334.380031,144.285211 376.809633,128.39275 421.122185,119.5 C455.229699,112.57395 488.832284,108.225933 523.622185,107 C571.665381,105.839939 619.461402,111.387956 667.398099,114.783333 Z\" class=\"svg-bg fill-shell-icon\"></path><g transform=\"translate(180, 320)\" class=\"svg-eyes fill-shell\"><ellipse cx=\"222.178218\" cy=\"42.8571429\" rx=\"43.5643564\" ry=\"42.8571429\"></ellipse><ellipse cx=\"43.5643564\" cy=\"42.8571429\" rx=\"43.5643564\" ry=\"42.8571429\"></ellipse><ellipse cx=\"396.435644\" cy=\"47.1428571\" rx=\"43.5643564\" ry=\"42.8571429\"></ellipse></g><path d=\"M764.431156,409.433333 C750.897806,502.459111 707.773317,578.2595 635.053747,636.830556 C577.181023,681.525056 511.573265,705.913556 438.22653,710 C297.410264,710 156.593998,710 15.7777328,710 C52.9070771,694.987444 71.3145636,667.309278 70.9997978,626.969444 C70.8116483,607.3695 67.3275305,588.369111 60.5470498,569.972222 C57.9401739,563.203556 55.1790706,556.498 52.26374,549.855556 C43.1079217,531.281167 34.1671932,512.612111 25.4415942,493.844444 C20.1063933,481.332667 15.4388271,468.580278 11.4388563,455.583333 C34.7266716,447.6905 58.8138263,436.310333 83.1221849,432.5 C130.377284,425.498611 175.947793,425.678778 223.622185,429 C274.782667,432.400111 327.779384,439.253278 378.122185,449 C407.882933,455.109944 481.990259,471.130556 507.622185,475 C537.978543,479.346778 568.973939,479.191222 599.622185,478 C624.858669,476.994167 650.419143,472.647333 674.622185,465.5 C711.518413,454.502889 740.318836,439.064 764.431156,409.433333 Z\" class=\"svg-bg fill-shell-icon\"></path></g></svg>",
  "/settings/account/info": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"></path><circle cx=\"12\" cy=\"12\" r=\"3\"></circle></svg>",
  "/team": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 3H26C28.8 3 31 5.2 31 8V20C31 22.8 28.8 25 26 25H14L8 30.2C7.4 30.7 6.5 30.3 6.5 29.5V25H6C3.2 25 1 22.8 1 20V8C1 5.2 3.2 3 6 3Z\" class=\"svg-bg fill-shell-icon\"></path><g class=\"svg-eyes fill-shell\"><circle cx=\"12.5\" cy=\"10.5\" r=\"3\"></circle><path d=\"M6.5 20C6.5 16.8 9.2 14.8 12.5 14.8C15.8 14.8 18.5 16.8 18.5 20Z\"></path><circle cx=\"20.5\" cy=\"11\" r=\"2.5\"></circle><path d=\"M19.6 15.1C23 14.8 25.6 16.6 25.6 19.5V20H20.3C20.3 18 20.1 16.4 19.6 15.1Z\"></path></g></svg>",
  "/users": "<svg class=\"map-dashboard-nav-icon\" aria-hidden=\"true\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20.6663 10.0002C20.6663 12.5775 18.577 14.6668 15.9997 14.6668C13.4223 14.6668 11.333 12.5775 11.333 10.0002C11.333 7.42283 13.4223 5.3335 15.9997 5.3335C18.577 5.3335 20.6663 7.42283 20.6663 10.0002Z\" class=\"svg-bg fill-shell-icon\"></path><path d=\"M24 22.0002C24 24.5775 20.4183 26.6668 16 26.6668C11.5817 26.6668 8 24.5775 8 22.0002C8 19.4228 11.5817 17.3335 16 17.3335C20.4183 17.3335 24 19.4228 24 22.0002Z\" class=\"svg-bg fill-shell-icon\"></path><path d=\"M9.49639 6.6665C9.73301 6.6665 9.964 6.68972 10.1871 6.73392C9.64365 7.69911 9.33366 8.81327 9.33366 9.99984C9.33366 11.1575 9.62874 12.2463 10.1478 13.195C9.93692 13.2343 9.71915 13.2549 9.49639 13.2549C7.6105 13.2549 6.08169 11.78 6.08169 9.96068C6.08169 8.14136 7.6105 6.6665 9.49639 6.6665Z\" class=\"svg-bg fill-shell-icon-muted\"></path><path d=\"M7.26344 25.3145C6.50622 24.4093 6.00033 23.2985 6.00033 21.9998C6.00033 20.7409 6.47576 19.6585 7.1947 18.7688C4.65512 18.9658 2.66699 20.3548 2.66699 22.039C2.66699 23.7391 4.69006 25.1383 7.26344 25.3145Z\" class=\"svg-bg fill-shell-icon-muted\"></path><path d=\"M22.6669 9.99984C22.6669 11.1575 22.3718 12.2463 21.8528 13.195C22.0636 13.2343 22.2814 13.2549 22.5041 13.2549C24.39 13.2549 25.9188 11.78 25.9188 9.96068C25.9188 8.14136 24.39 6.6665 22.5041 6.6665C22.2675 6.6665 22.0365 6.68972 21.8135 6.73392C22.3569 7.69911 22.6669 8.81327 22.6669 9.99984Z\" class=\"svg-bg fill-shell-icon-muted\"></path><path d=\"M24.7371 25.3145C27.3105 25.1383 29.3335 23.7391 29.3335 22.039C29.3335 20.3548 27.3454 18.9658 24.8058 18.7688C25.5248 19.6585 26.0002 20.7409 26.0002 21.9998C26.0002 23.2985 25.4943 24.4093 24.7371 25.3145Z\" class=\"svg-bg fill-shell-icon-muted\"></path></svg>"
};
const mapAnimalStyles = [
  ['manta','#30353d'], ['beluga','#dc5b9e'], ['sea-lion','#293c6e'],
  ['barracuda','#dc4740'], ['sailfish','#dc9b18'], ['jellyfish','#49a8ca'],
  ['turtle','#bb2948'], ['mackerel','#6ca72d']
];
const mapProfileAnimals = {van:0,sf:1,den:2,chi:3,ny:4,mia:5};
const mapCityFlags = {Vancouver:'🇨🇦','San Francisco':'🇺🇸',Denver:'🇺🇸',Chicago:'🇺🇸','New York':'🇺🇸',Miami:'🇺🇸',London:'🇬🇧',Paris:'🇫🇷',Berlin:'🇩🇪',Lisbon:'🇵🇹',Tokyo:'🇯🇵',Singapore:'🇸🇬',Sydney:'🇦🇺','São Paulo':'🇧🇷','Cape Town':'🇿🇦','Mexico City':'🇲🇽',Dubai:'🇦🇪',Mumbai:'🇮🇳'};
function mapAnimalStyle(profileId,seed='') {
  const index=mapProfileAnimals[profileId] ?? [...seed].reduce((total,char)=>total+char.charCodeAt(0),0)%mapAnimalStyles.length;
  return mapAnimalStyles[index];
}
function marineAvatar(profileId,seed='',city='') {
  const [animal,color]=mapAnimalStyle(profileId,seed);
  const avatar=document.createElement('span');avatar.className='map-marine-avatar';avatar.style.setProperty('--marine-color',color);
  const image=document.createElement('img');image.src='/assets/dashboard/animals/'+animal+'.png';image.alt='';image.width=40;image.height=40;image.decoding='async';
  const flag=document.createElement('span');flag.className='map-marine-flag';flag.setAttribute('aria-hidden','true');flag.textContent=mapCityFlags[city]||'';
  const online=document.createElement('i');online.setAttribute('aria-hidden','true');
  avatar.append(image,flag,online);return avatar;
}
rows.forEach(row=>{
  const previous=row.querySelector('.live-visitor-avatar');
  if(!previous)return;
  const point=points.find(item=>item.profileId===row.dataset.visitor);
  const avatar=marineAvatar(row.dataset.visitor,row.dataset.visitor,point?.city);
  avatar.classList.add('live-visitor-avatar');previous.replaceWith(avatar);
});
function updateContactAnimal(profileId) {
  const target=document.getElementById('context-initials');
  if(!target)return;
  const [animal,color]=mapAnimalStyle(profileId,profileId);
  const image=document.createElement('img');image.src='/assets/dashboard/animals/'+animal+'.png';image.alt='';image.width=44;image.height=44;
  target.replaceChildren(image);target.classList.add('map-context-animal');target.style.setProperty('--marine-color',color);
}
rows.forEach(row=>row.addEventListener('click',()=>updateContactAnimal(row.dataset.visitor)));
updateContactAnimal(rows.find(row=>row.classList.contains('active'))?.dataset.visitor||'ny');
const mapRail=document.querySelector('.map-app-rail');
if(mapRail){
  const entries=[['/rooms',''],['/live','selected'],['/analytics',''],['/users',''],['/team','']];
  mapRail.innerHTML=entries.map(([key,className])=>'<span class="'+className+'">'+mapDashboardNav[key]+(key==='/live'?'<b>'+points.length+'</b>':'')+'</span>').join('')+
    '<span class="map-rail-palette"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg><i></i></span><span class="rail-settings">'+mapDashboardNav['/settings/account/info']+'</span>';
}

let query='', locationCluster=null, locationTrigger=null;
const filteredPoints=()=>filterMapVisitors(points,project,query,projectNames,profileNames);
function dimensions(){return {width:svg.clientWidth || viewport.clientWidth,height:svg.clientHeight || viewport.clientHeight};}
function closeLocation(){if(locationPanel)locationPanel.hidden=true;}
function showLocation(members,trigger){
  if(!locationPanel)return;
  locationCluster=members;locationTrigger=trigger || null;
  const cities=[...new Set(members.map(p=>p.city))];
  document.querySelector('[data-map-location-title]').textContent=cities.length===1?cities[0]:cities.slice(0,2).join(' & ')+(cities.length>2?' + more':'');
  document.querySelector('[data-map-location-count]').textContent=members.length+' '+(members.length===1?'visitor':'visitors')+' at this location';
  const list=document.querySelector('[data-map-location-list]');list.replaceChildren();
  members.forEach(point=>{
    const row=document.createElement('div');row.className='map-location-person';
    const avatar=marineAvatar(point.profileId,point.id,point.city);
    const detail=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');
    name.textContent=profileNames[point.profileId]||'Visitor '+(points.indexOf(point)+1001);
    meta.textContent=projectNames[point.project]+' · '+point.city;
    detail.append(name,meta);row.append(avatar,detail);list.append(row);
  });
  document.querySelector('[data-map-location-zoom]').disabled=zoom>=maxZoom;
  locationPanel.hidden=false;
}
const maxZoom = 64;
let project = 'all', zoom = 1, selectedId = null, view, drag, suppressClick = false;

function homeView() { const {width,height}=dimensions();return mosaic?inhabitedWorldView(width,height):worldView(width,height); }
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
  const {width,height}=dimensions();
  const scale = Math.min(width/view.width,height/view.height);
  const filtered = filteredPoints();
  if(mosaic){document.querySelector('[data-map-total]').textContent=filtered.length;document.querySelector('[data-map-visible-count]').textContent=filtered.length+' visitors';}
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
      if(mosaic){selectedId=point.id;showLocation(cluster.members,marker);layer.querySelectorAll('[aria-pressed]').forEach(node=>{node.classList.toggle('active',node===marker);node.setAttribute('aria-pressed',String(node===marker));});return;}
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
  closeLocation();
  const matched=new Set(filteredPoints().map(point=>point.profileId));
  rows.forEach(row=>row.hidden=!matched.has(row.dataset.visitor));
  document.querySelector('#map-project-summary').textContent = project==='all'?'Visitors across your projects':projectNames[project]+' · live visitors';
  zoom=1;view=homeView();selectedId=null;popup.hidden=true;
  rows.find(row=>!row.hidden)?.click();
  render();
}));
rows.forEach(row=>row.addEventListener('click',()=>{
  const next=points.find(point=>point.profileId===row.dataset.visitor)?.id || null;
  if(selectedId===next){if(mosaic){const point=points.find(p=>p.id===next);if(point)showLocation(filteredPoints().filter(p=>p.city===point.city),row);}return;}
  selectedId=next;
  const selected=points.find(point=>point.id===next);
  if(selected && zoom>1)view=clampView({...view,x:selected.x-view.width/2,y:selected.y-view.height/2});
  popup.hidden=true;
  if(mosaic&&selected)showLocation(filteredPoints().filter(point=>point.city===selected.city),row);
  render();
}));
document.querySelectorAll('[data-map-zoom]').forEach(button=>button.addEventListener('click',()=>{
  closeLocation();
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
  else if(event.key==='Escape'){popup.hidden=true;closeLocation();}
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

if(search)search.addEventListener('input',()=>{
  query=search.value;closeLocation();
  const matched=new Set(filteredPoints().map(point=>point.profileId));
  rows.forEach(row=>row.hidden=!matched.has(row.dataset.visitor));
  zoom=1;view=homeView();selectedId=null;render();
});
document.querySelector('[data-map-location-close]')?.addEventListener('click',()=>{closeLocation();locationTrigger?.focus({preventScroll:true});});
document.querySelector('[data-map-location-zoom]')?.addEventListener('click',()=>{
  if(!locationCluster?.length)return;
  const x=locationCluster.reduce((sum,p)=>sum+p.x,0)/locationCluster.length,y=locationCluster.reduce((sum,p)=>sum+p.y,0)/locationCluster.length;
  const next=Math.min(maxZoom,zoom*2),base=homeView(),width=base.width/next,height=base.height/next;
  zoom=next;view=clampView({x:x-width/2,y:y-height/2,width,height});closeLocation();render();svg.focus({preventScroll:true});
});
locationPanel?.addEventListener('keydown',event=>{if(event.key==='Escape'){closeLocation();locationTrigger?.focus({preventScroll:true});}});
