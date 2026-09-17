import test from 'node:test';
import assert from 'node:assert/strict';
import {expandVisitors,PROJECT_KEYS,clusterVisitors,clampView,zoomView} from '../public/map-model.js';

test('visitor expansion preserves all six project totals and named profiles',()=>{
  const points=expandVisitors();
  assert.equal(points.length,214);
  assert.equal(new Set(points.map(p=>p.id)).size,214);
  assert.deepEqual(PROJECT_KEYS.map(project=>points.filter(p=>p.project===project).length),[48,36,54,22,31,23]);
  assert.deepEqual(points.filter(p=>p.profileId).map(p=>p.profileId).sort(),['chi','den','mia','ny','sf','van']);
});

test('zoom separates visitors on narrow and wide maps without losing counts',()=>{
  const points=expandVisitors();
  for(const width of [280,375,800]){
    let previous=0;
    for(const zoom of [1,2,4,8,16]){
      const groups=clusterVisitors(points,width/470*zoom,zoom>=8?18:36);
      assert.equal(groups.reduce((sum,g)=>sum+g.members.length,0),214);
      assert.equal(new Set(groups.flatMap(g=>g.members.map(p=>p.id))).size,214);
      assert.ok(groups.length>=previous);
      previous=groups.length;
    }
    assert.equal(previous,214);
  }
});

test('project filtering preserves the subset through clustering',()=>{
  for(const project of PROJECT_KEYS){
    const subset=expandVisitors().filter(p=>p.project===project);
    for(const scale of [1,4,16]){
      const groups=clusterVisitors(subset,scale);
      assert.equal(groups.flatMap(g=>g.members).length,subset.length);
      assert.ok(groups.flatMap(g=>g.members).every(p=>p.project===project));
    }
  }
});

test('zoom remains anchored and panning stays within available geography',()=>{
  const view={x:80,y:400,width:300,height:200};
  const anchor={x:180,y:470};
  const zoomed=zoomView(view,2,anchor);
  assert.equal((anchor.x-zoomed.x)/zoomed.width,(anchor.x-view.x)/view.width);
  assert.equal((anchor.y-zoomed.y)/zoomed.height,(anchor.y-view.y)/view.height);
  assert.deepEqual(clampView({x:-100,y:5000,width:300,height:200}),{x:0,y:824,width:300,height:200});
});
