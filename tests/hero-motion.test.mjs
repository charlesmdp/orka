import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainMascot,springStep} from '../public/hero-experiments.js';

test('dragging keeps Orky inside the hero on desktop and narrow screens',()=>{
 for(const bounds of [{left:-690,right:440,top:-410,bottom:60},{left:-210,right:20,top:-620,bottom:32}]){
  for(const [x,y] of [[-10000,-10000],[10000,10000],[12,-5],[0,0]]){
   const point=constrainMascot(x,y,bounds);
   assert.ok(point.x>=bounds.left&&point.x<=bounds.right);
   assert.ok(point.y>=bounds.top&&point.y<=bounds.bottom);
  }
 }
});

test('Orky settles back home across frame rates and resumes safely after a delayed frame',()=>{
 for(const dt of [1/120,1/60,1/30,3]){
  let state={position:{x:440,y:-500},velocity:{x:600,y:-600}};
  for(let i=0;i<1200;i++)state=springStep(state.position,state.velocity,dt);
  assert.ok(Math.hypot(state.position.x,state.position.y)<.1);
  assert.ok(Math.hypot(state.velocity.x,state.velocity.y)<.1);
 }
});
