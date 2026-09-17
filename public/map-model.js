// Deterministic illustrative visitors: retain the original city and project totals.
export const PROJECT_KEYS = ['calories', 'caps', 'trustarr', 'booking', 'blog', 'outreach'];
export const CITY_GROUPS = [{"key": "van", "city": "Vancouver", "x": 67.58, "y": 444.89, "counts": [8, 3, 12, 3, 6, 2]}, {"key": "sf", "city": "San Francisco", "x": 71.57, "y": 535.63, "counts": [5, 8, 4, 2, 6, 3]}, {"key": "den", "city": "Denver", "x": 170.72, "y": 521.26, "counts": [4, 3, 6, 4, 2, 2]}, {"key": "chi", "city": "Chicago", "x": 269.48, "y": 505.17, "counts": [9, 4, 7, 3, 4, 4]}, {"key": "ny", "city": "New York", "x": 346.97, "y": 514.03, "counts": [12, 7, 15, 4, 8, 6]}, {"key": "mia", "city": "Miami", "x": 311.81, "y": 616.25, "counts": [10, 11, 10, 6, 5, 6]}];
const PROFILE_PROJECT = {van:'calories', sf:'trustarr', den:'blog', chi:'outreach', ny:'caps', mia:'booking'};

export function expandVisitors(groups = CITY_GROUPS) {
  return groups.flatMap(group => {
    let sequence = 0;
    return group.counts.flatMap((count, projectIndex) => Array.from({length:count}, (_, index) => {
      const slot = sequence++;
      const angle = slot * 2.399963229728653;
      const radius = 1.95 * Math.sqrt(slot);
      const project = PROJECT_KEYS[projectIndex];
      return {id:group.key + '-' + project + '-' + index, city:group.city, cityKey:group.key, project,
        x:group.x + Math.cos(angle)*radius, y:group.y + Math.sin(angle)*radius,
        profileId:index === 0 && PROFILE_PROJECT[group.key] === project ? group.key : null};
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

export function clampView(view, bounds = {x:0,y:256,width:768,height:768}) {
  const width = Math.min(view.width, bounds.width), height = Math.min(view.height, bounds.height);
  return {x:Math.max(bounds.x,Math.min(bounds.x+bounds.width-width,view.x)),
    y:Math.max(bounds.y,Math.min(bounds.y+bounds.height-height,view.y)),width,height};
}

export function zoomView(view, factor, point = {x:view.x+view.width/2,y:view.y+view.height/2}) {
  return clampView({x:point.x-(point.x-view.x)/factor,y:point.y-(point.y-view.y)/factor,
    width:view.width/factor,height:view.height/factor});
}
