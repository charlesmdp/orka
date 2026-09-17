import test from 'node:test';
import assert from 'node:assert/strict';
import {expandVisitors,PROJECT_KEYS,clusterVisitors,clampView,zoomView,worldView,WORLD_SIZE,projectLocation} from '../public/map-model.js';

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
    for(const zoom of [1,2,4,8,16,32,64]){
      const groups=clusterVisitors(points,width/worldView(width,620).width*zoom,zoom>=32?18:36);
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
  assert.deepEqual(clampView({x:-100,y:5000,width:300,height:200}),{x:0,y:1848,width:300,height:200});
});


test('initial view fits the world on phones and desktops and can return after zooming',()=>{
  for(const [width,height] of [[280,470],[375,620],[800,620],[1200,480]]){
    const home=worldView(width,height);
    assert.ok(home.x<=0 && home.y<=0);
    assert.ok(home.x+home.width>=WORLD_SIZE && home.y+home.height>=WORLD_SIZE);
    assert.ok(Math.abs(home.width/home.height-width/height)<1e-9);
    let zoomed=zoomView(home,4,projectLocation(2.35,48.86));
    zoomed=zoomView(zoomed,.25);
    assert.deepEqual(zoomed,home);
  }
});

test('the world map includes visitors beyond North America without changing project totals',()=>{
  const points=expandVisitors();
  for(const city of ['New York','Paris','Tokyo','Sydney','Cape Town','São Paulo']) {
    assert.ok(points.some(p=>p.city===city),city+' should appear on the world map');
  }
  assert.ok(points.every(p=>p.x>=0 && p.x<=WORLD_SIZE && p.y>=0 && p.y<=WORLD_SIZE));
  assert.deepEqual(projectLocation(0,0),{x:1024,y:1024});
});
