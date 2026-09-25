// Deterministic illustrative visitors: preserve project totals and the six named profiles.
export const WORLD_SIZE = 2048;
export const WORLD_BOUNDS = {x:0,y:0,width:WORLD_SIZE,height:WORLD_SIZE};
export function projectLocation(lon,lat) {
  const sine=Math.sin(Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180);
  return {x:(lon+180)/360*WORLD_SIZE,y:(.5-Math.log((1+sine)/(1-sine))/(4*Math.PI))*WORLD_SIZE};
}
export function worldView(width,height) {
  const ratio=Math.max(1,width)/Math.max(1,height);
  const w=WORLD_SIZE*Math.max(1,ratio),h=WORLD_SIZE*Math.max(1,1/ratio);
  return {x:(WORLD_SIZE-w)/2,y:(WORLD_SIZE-h)/2,width:w,height:h};
}
const GLOBAL_CITIES = [
  ["London",-.12,51.5],["Paris",2.35,48.86],["Berlin",13.4,52.52],
  ["Lisbon",-9.14,38.72],["Tokyo",139.69,35.69],["Singapore",103.82,1.35],
  ["Sydney",151.21,-33.87],["São Paulo",-46.63,-23.55],["Cape Town",18.42,-33.92],
  ["Mexico City",-99.13,19.43],["Dubai",55.27,25.2],["Mumbai",72.88,19.08]
].map(([city,lon,lat])=>({city,...projectLocation(lon,lat)}));
export const PROJECT_KEYS = ['calories', 'caps', 'trustarr', 'booking', 'blog', 'outreach'];
export const CITY_GROUPS = [{"key": "van", "city": "Vancouver", "x": 67.58, "y": 444.89, "counts": [8, 3, 12, 3, 6, 2]}, {"key": "sf", "city": "San Francisco", "x": 71.57, "y": 535.63, "counts": [5, 8, 4, 2, 6, 3]}, {"key": "den", "city": "Denver", "x": 170.72, "y": 521.26, "counts": [4, 3, 6, 4, 2, 2]}, {"key": "chi", "city": "Chicago", "x": 269.48, "y": 505.17, "counts": [9, 4, 7, 3, 4, 4]}, {"key": "ny", "city": "New York", "x": 346.97, "y": 514.03, "counts": [12, 7, 15, 4, 8, 6]}, {"key": "mia", "city": "Miami", "x": 311.81, "y": 616.25, "counts": [10, 11, 10, 6, 5, 6]}];
const PROFILE_PROJECT = {van:'calories', sf:'trustarr', den:'blog', chi:'outreach', ny:'caps', mia:'booking'};

export function expandVisitors(groups = CITY_GROUPS) {
  return groups.flatMap((group, groupIndex) => {
    let sequence = 0;
    return group.counts.flatMap((count, projectIndex) => Array.from({length:count}, (_, index) => {
      const slot = sequence++;
      const angle = slot * 2.399963229728653;
      const radius = 1.95 * Math.sqrt(slot);
      const project = PROJECT_KEYS[projectIndex];
      const profileId=index === 0 && PROFILE_PROJECT[group.key] === project ? group.key : null;
      const location=!profileId && slot%3!==0 ? GLOBAL_CITIES[(groupIndex*7+slot)%GLOBAL_CITIES.length] : {city:group.city,x:group.x+256,y:group.y+256};
      return {id:group.key + '-' + project + '-' + index, city:location.city, cityKey:group.key, project,
        x:location.x + Math.cos(angle)*radius, y:location.y + Math.sin(angle)*radius, profileId};
    }));
  });
}

// Cluster in screen space, so a closer view reveals separate visitors.
export function clusterVisitors(points, pixelsPerUnit, radius = 36) {
  const distance = radius / Math.max(.01, pixelsPerUnit);
  const groups = [];
  for (const point of points) {
    let nearest = null, nearestDistance = distance;
    for (const group of groups) {
      const d = Math.hypot(group.x - point.x, group.y - point.y);
      if (d < nearestDistance) { nearest = group; nearestDistance = d; }
    }
    if (!nearest) { groups.push({x:point.x, y:point.y, members:[point]}); continue; }
    const count = nearest.members.length;
    nearest.x = (nearest.x*count + point.x)/(count+1);
    nearest.y = (nearest.y*count + point.y)/(count+1);
    nearest.members.push(point);
  }
  return groups;
}

export function clampView(view, bounds = WORLD_BOUNDS) {
  // A complete world can need ocean margins on narrow or very wide screens.
  const width=view.width, height=view.height;
  return {x:width>=bounds.width ? bounds.x+(bounds.width-width)/2 : Math.max(bounds.x,Math.min(bounds.x+bounds.width-width,view.x)),
    y:height>=bounds.height ? bounds.y+(bounds.height-height)/2 : Math.max(bounds.y,Math.min(bounds.y+bounds.height-height,view.y)),width,height};
}

export function zoomView(view, factor, point = {x:view.x+view.width/2,y:view.y+view.height/2}) {
  return clampView({x:point.x-(point.x-view.x)/factor,y:point.y-(point.y-view.y)/factor,
    width:view.width/factor,height:view.height/factor});
}

// Country labels from Natural Earth, public domain.
export const WORLD_LABELS = [{"name":"Fiji","x":2036.48,"y":1127.09,"minZoom":2.0},{"name":"Tanzania","x":1222.88,"y":1058.49,"minZoom":2.0},{"name":"Western Sahara","x":952.15,"y":883.49,"minZoom":16.0},{"name":"Canada","x":444.24,"y":591.03,"minZoom":1},{"name":"United States","x":469.43,"y":778.75,"minZoom":1},{"name":"Kazakhstan","x":1414.74,"y":702.86,"minZoom":1.62},{"name":"Uzbekistan","x":1388.12,"y":762.59,"minZoom":2.0},{"name":"Papua New Guinea","x":1842.69,"y":1056.45,"minZoom":1.41},{"name":"Indonesia","x":1603.66,"y":1029.43,"minZoom":1},{"name":"Argentina","x":658.93,"y":1226.48,"minZoom":1},{"name":"Chile","x":612.59,"y":1259.12,"minZoom":1},{"name":"Democratic Republic of the Congo","x":1157.45,"y":1034.57,"minZoom":1},{"name":"Somalia","x":1281.09,"y":1003.68,"minZoom":4.0},{"name":"Kenya","x":1239.65,"y":1020.88,"minZoom":1},{"name":"Sudan","x":1190.46,"y":929.81,"minZoom":1.41},{"name":"Chad","x":1130.07,"y":936.83,"minZoom":2.0},{"name":"Haiti","x":613.13,"y":912.29,"minZoom":4.0},{"name":"Dominican Republic","x":622.06,"y":913.25,"minZoom":5.66},{"name":"Russia","x":1278.22,"y":614.15,"minZoom":1},{"name":"The Bahamas","x":585.12,"y":868.19,"minZoom":4.0},{"name":"Falkland Islands","x":689.84,"y":1367.92,"minZoom":5.66},{"name":"Norway","x":1079.07,"y":578.97,"minZoom":2.0},{"name":"Greenland","x":800.23,"y":377.75,"minZoom":1},{"name":"French Southern and Antarctic Lands","x":1417.23,"y":1347.31,"minZoom":4.0},{"name":"East Timor","x":1739.97,"y":1074.28,"minZoom":4.0},{"name":"South Africa","x":1158.63,"y":1201.14,"minZoom":1},{"name":"Lesotho","x":1184.69,"y":1199.64,"minZoom":4.0},{"name":"Mexico","x":442.09,"y":883.79,"minZoom":1},{"name":"Uruguay","x":705.61,"y":1222.8,"minZoom":2.0},{"name":"Brazil","x":742.06,"y":1093.35,"minZoom":1},{"name":"Bolivia","x":656.54,"y":1120.18,"minZoom":2.0},{"name":"Peru","x":609.28,"y":1098.46,"minZoom":1},{"name":"Colombia","x":607.72,"y":1004.8,"minZoom":2.0},{"name":"Panama","x":566.89,"y":974.19,"minZoom":4.0},{"name":"Costa Rica","x":545.69,"y":966.44,"minZoom":1.41},{"name":"Nicaragua","x":540.05,"y":951.32,"minZoom":4.0},{"name":"Honduras","x":529.71,"y":938.88,"minZoom":5.66},{"name":"El Salvador","x":518.31,"y":945.39,"minZoom":8.0},{"name":"Guatemala","x":509.17,"y":937.78,"minZoom":2.0},{"name":"Belize","x":519.32,"y":924.64,"minZoom":8.0},{"name":"Venezuela","x":656.5,"y":983.03,"minZoom":1.41},{"name":"Guyana","x":688.68,"y":994.81,"minZoom":4.0},{"name":"Suriname","x":705.93,"y":1000.4,"minZoom":4.0},{"name":"France","x":1038.52,"y":722.86,"minZoom":1},{"name":"Ecuador","x":579.2,"y":1031.16,"minZoom":2.0},{"name":"Puerto Rico","x":645.8,"y":918.47,"minZoom":2.0},{"name":"Jamaica","x":584.14,"y":919.05,"minZoom":4.0},{"name":"Cuba","x":580.4,"y":899.73,"minZoom":1.62},{"name":"Zimbabwe","x":1194.24,"y":1133.59,"minZoom":1.41},{"name":"Botswana","x":1161.55,"y":1152.98,"minZoom":4.0},{"name":"Namibia","x":1121.33,"y":1143.65,"minZoom":2.0},{"name":"Senegal","x":939.93,"y":936.86,"minZoom":1.62},{"name":"Mali","x":1012.4,"y":915.72,"minZoom":2.0},{"name":"Mauritania","x":968.59,"y":910.34,"minZoom":2.0},{"name":"Benin","x":1037.38,"y":964.94,"minZoom":4.0},{"name":"Niger","x":1078.07,"y":923.18,"minZoom":2.0},{"name":"Nigeria","x":1066.68,"y":970.05,"minZoom":1},{"name":"Cameroon","x":1094.96,"y":997.89,"minZoom":2.0},{"name":"Togo","x":1030.02,"y":973.7,"minZoom":8.0},{"name":"Ghana","x":1018.1,"y":979.96,"minZoom":1.62},{"name":"Ivory Coast","x":992.32,"y":981.26,"minZoom":1.41},{"name":"Guinea","x":967.02,"y":963.24,"minZoom":2.0},{"name":"Guinea-Bissau","x":941.37,"y":954.28,"minZoom":8.0},{"name":"Liberia","x":970.18,"y":987.25,"minZoom":4.0},{"name":"Sierra Leone","x":957.08,"y":974.79,"minZoom":4.0},{"name":"Burkina Faso","x":1016.24,"y":951.31,"minZoom":2.0},{"name":"Central African Republic","x":1142.94,"y":984.14,"minZoom":4.0},{"name":"Republic of the Congo","x":1114.46,"y":1023.19,"minZoom":4.0},{"name":"Gabon","x":1091.33,"y":1026.49,"minZoom":2.0},{"name":"Equatorial Guinea","x":1075.14,"y":1010.72,"minZoom":4.0},{"name":"Zambia","x":1174.16,"y":1108.33,"minZoom":2.0},{"name":"Malawi","x":1215.19,"y":1100.86,"minZoom":4.0},{"name":"Mozambique","x":1239.26,"y":1104.12,"minZoom":2.0},{"name":"Eswatini","x":1203.01,"y":1180.65,"minZoom":4.0},{"name":"Angola","x":1126.31,"y":1093.83,"minZoom":2.0},{"name":"Burundi","x":1194.19,"y":1042.97,"minZoom":4.0},{"name":"Israel","x":1222.25,"y":838.94,"minZoom":2.0},{"name":"Lebanon","x":1228.76,"y":817.2,"minZoom":4.0},{"name":"Madagascar","x":1289.7,"y":1131.89,"minZoom":1.62},{"name":"Palestine","x":1224.77,"y":831.36,"minZoom":5.66},{"name":"The Gambia","x":938.68,"y":945.65,"minZoom":8.0},{"name":"Tunisia","x":1075.24,"y":820.25,"minZoom":2.0},{"name":"Algeria","x":1039.98,"y":861.84,"minZoom":1.41},{"name":"Jordan","x":1230.94,"y":839.64,"minZoom":4.0},{"name":"United Arab Emirates","x":1334.31,"y":886.61,"minZoom":4.0},{"name":"Qatar","x":1314.95,"y":875.55,"minZoom":4.0},{"name":"Kuwait","x":1293.16,"y":848.79,"minZoom":8.0},{"name":"Iraq","x":1270.11,"y":824.3,"minZoom":2.0},{"name":"Oman","x":1350.18,"y":894.91,"minZoom":4.0},{"name":"Vanuatu","x":1973.53,"y":1112.52,"minZoom":4.0},{"name":"Cambodia","x":1618.52,"y":951.46,"minZoom":2.0},{"name":"Thailand","x":1598.99,"y":934.96,"minZoom":1.62},{"name":"Laos","x":1607.3,"y":911.27,"minZoom":4.0},{"name":"Myanmar","x":1569.02,"y":898.26,"minZoom":2.0},{"name":"Vietnam","x":1623.54,"y":897.39,"minZoom":1},{"name":"North Korea","x":1743.33,"y":776.18,"minZoom":2.0},{"name":"South Korea","x":1752.91,"y":801.51,"minZoom":1.41},{"name":"Mongolia","x":1616.5,"y":728.62,"minZoom":2.0},{"name":"India","x":1475.46,"y":891.43,"minZoom":1},{"name":"Bangladesh","x":1534.21,"y":881.95,"minZoom":2.0},{"name":"Bhutan","x":1536.23,"y":860.94,"minZoom":4.0},{"name":"Nepal","x":1499.82,"y":856.04,"minZoom":2.0},{"name":"Pakistan","x":1413.95,"y":849.35,"minZoom":1.62},{"name":"Afghanistan","x":1402.29,"y":816.98,"minZoom":2.0},{"name":"Tajikistan","x":1436.94,"y":788.53,"minZoom":4.0},{"name":"Kyrgyzstan","x":1448.01,"y":762.78,"minZoom":2.0},{"name":"Turkmenistan","x":1357.8,"y":776.4,"minZoom":2.0},{"name":"Iran","x":1336.5,"y":830.56,"minZoom":1.41},{"name":"Syria","x":1241.76,"y":811.16,"minZoom":2.0},{"name":"Armenia","x":1278.87,"y":771.91,"minZoom":8.0},{"name":"Sweden","x":1132.19,"y":521.22,"minZoom":1},{"name":"Belarus","x":1185.67,"y":659.3,"minZoom":2.0},{"name":"Ukraine","x":1206.85,"y":697,"minZoom":1.62},{"name":"Poland","x":1134.88,"y":676.57,"minZoom":1.41},{"name":"Austria","x":1104.39,"y":715.99,"minZoom":2.0},{"name":"Hungary","x":1134.64,"y":719.61,"minZoom":4.0},{"name":"Moldova","x":1186.06,"y":716.69,"minZoom":8.0},{"name":"Romania","x":1166.07,"y":730.78,"minZoom":2.0},{"name":"Lithuania","x":1161.04,"y":646.75,"minZoom":4.0},{"name":"Latvia","x":1168.83,"y":626.73,"minZoom":4.0},{"name":"Estonia","x":1171.16,"y":608.98,"minZoom":2.0},{"name":"Germany","x":1079.06,"y":685.97,"minZoom":1},{"name":"Bulgaria","x":1167.12,"y":756.34,"minZoom":4.0},{"name":"Greece","x":1147.59,"y":779.08,"minZoom":1.62},{"name":"Turkey","x":1220.31,"y":780.17,"minZoom":1},{"name":"Albania","x":1138.43,"y":770.44,"minZoom":8.0},{"name":"Croatia","x":1117.14,"y":730.19,"minZoom":4.0},{"name":"Switzerland","x":1066.46,"y":722.67,"minZoom":4.0},{"name":"Luxembourg","x":1058.57,"y":696.92,"minZoom":13.0},{"name":"Belgium","x":1051.31,"y":687.56,"minZoom":4.0},{"name":"Netherlands","x":1055.92,"y":672.57,"minZoom":4.0},{"name":"Portugal","x":976.94,"y":778.24,"minZoom":2.0},{"name":"Spain","x":1004.29,"y":774.65,"minZoom":1},{"name":"Ireland","x":979.63,"y":666.39,"minZoom":2.0},{"name":"New Caledonia","x":1963.14,"y":1146.63,"minZoom":6.06},{"name":"Solomon Islands","x":1929.5,"y":1069.83,"minZoom":2.0},{"name":"New Zealand","x":2006.97,"y":1270.88,"minZoom":1},{"name":"Australia","x":1786.59,"y":1165.52,"minZoom":1},{"name":"Sri Lanka","x":1483.12,"y":980.75,"minZoom":2.0},{"name":"People's Republic of China","x":1628.94,"y":828.33,"minZoom":1},{"name":"Taiwan","x":1711.61,"y":885.45,"minZoom":5.66},{"name":"Italy","x":1087.02,"y":738.86,"minZoom":1},{"name":"Denmark","x":1075.3,"y":638.07,"minZoom":2.0},{"name":"United Kingdom","x":1011.96,"y":653.66,"minZoom":1},{"name":"Iceland","x":917.77,"y":535.93,"minZoom":1},{"name":"Azerbaijan","x":1292.58,"y":772.33,"minZoom":4.0},{"name":"Georgia","x":1272.81,"y":761.25,"minZoom":4.0},{"name":"Philippines","x":1720.69,"y":959.89,"minZoom":1.41},{"name":"Malaysia","x":1671.61,"y":1009.61,"minZoom":2.0},{"name":"Brunei","x":1675.67,"y":998.67,"minZoom":4.0},{"name":"Slovenia","x":1108.85,"y":728.1,"minZoom":8.0},{"name":"Finland","x":1179.17,"y":555.76,"minZoom":2.0},{"name":"Slovakia","x":1132.37,"y":705.63,"minZoom":4.0},{"name":"Czech Republic","x":1111.48,"y":695.61,"minZoom":4.0},{"name":"Eritrea","x":1241.8,"y":933.03,"minZoom":4.0},{"name":"Japan","x":1811.58,"y":803.22,"minZoom":1},{"name":"Paraguay","x":681.83,"y":1150.35,"minZoom":2.0},{"name":"Yemen","x":1284.97,"y":935.74,"minZoom":2.0},{"name":"Saudi Arabia","x":1278.29,"y":884.49,"minZoom":1},{"name":"Antarctica","x":1228.15,"y":1813,"minZoom":4.0},{"name":"Turkish Republic of Northern Cyprus","x":1215.67,"y":809.71,"minZoom":16.0},{"name":"Cyprus","x":1212.21,"y":811.81,"minZoom":5.66},{"name":"Morocco","x":983.11,"y":834.02,"minZoom":1.62},{"name":"Egypt","x":1191.51,"y":869.56,"minZoom":1},{"name":"Libya","x":1126.46,"y":866.68,"minZoom":2.0},{"name":"Ethiopia","x":1246.37,"y":978.15,"minZoom":1},{"name":"Djibouti","x":1265.77,"y":955.37,"minZoom":4.0},{"name":"Somaliland","x":1289.85,"y":970.03,"minZoom":5.66},{"name":"Uganda","x":1211.44,"y":1012.78,"minZoom":2.0},{"name":"Rwanda","x":1195.26,"y":1034.79,"minZoom":2.0},{"name":"Bosnia and Herzegovina","x":1126.79,"y":743.97,"minZoom":5.66},{"name":"North Macedonia","x":1146.63,"y":763.62,"minZoom":8.0},{"name":"Serbia","x":1142.26,"y":743.19,"minZoom":4.0},{"name":"Montenegro","x":1132.91,"y":754.07,"minZoom":8.0},{"name":"Kosovo","x":1142.67,"y":755.69,"minZoom":8.0},{"name":"Trinidad and Tobago","x":677.44,"y":961.04,"minZoom":5.66},{"name":"South Sudan","x":1196.89,"y":982.76,"minZoom":2.0}];
export const CITY_LABELS = [...CITY_GROUPS.map(city=>({name:city.city,x:city.x+256,y:city.y+256})),...GLOBAL_CITIES.map(city=>({name:city.city,x:city.x,y:city.y}))].map(city=>({...city,minZoom:4,kind:"city"}));

// Fit the world's inhabited latitudes without making polar water dominate the demo.
export function inhabitedWorldView(width,height) {
  const ratio=Math.max(1,width)/Math.max(1,height);
  const w=Math.max(WORLD_SIZE,1330*ratio),h=w/ratio;
  return {x:(WORLD_SIZE-w)/2,y:885-h/2,width:w,height:h};
}
export function filterMapVisitors(points,project,query,projectNames={},profiles={}) {
  const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return points.filter(point=>{
    if(project!=='all'&&point.project!==project)return false;
    const haystack=[point.city,projectNames[point.project],profiles[point.profileId],point.id].filter(Boolean).join(' ').toLocaleLowerCase();
    return words.every(word=>haystack.includes(word));
  });
}
