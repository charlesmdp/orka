import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainMascot,springStep,returnStep,swimmingHeading} from '../public/hero-experiments.js';

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


test('Orky faces the direction of travel when dragged and when swimming home',()=>{
 assert.equal(swimmingHeading(24,0).facing,-1);
 assert.equal(swimmingHeading(-24,0).facing,1);
 assert.ok(swimmingHeading(24,-12).pitch<0);
 assert.ok(swimmingHeading(-24,-12).pitch>0);
 const right=swimmingHeading(24,0);
 assert.deepEqual(swimmingHeading(0,0,right),right);
 let state={position:{x:400,y:-180},velocity:{x:0,y:0}};
 const next=springStep(state.position,state.velocity,1/60);
 const home=swimmingHeading(next.position.x-state.position.x,next.position.y-state.position.y,right);
 assert.equal(home.facing,1);
 assert.ok(home.pitch<0);
});


test('the homeward swim takes three times as long and rests facing right',()=>{
 assert.equal(swimmingHeading(0,0).facing,-1);
 const duration=(step,dt)=>{
  let state={position:{x:400,y:-180},velocity:{x:0,y:0}},time=0;
  while(time<20){
   state=step(state.position,state.velocity,dt);time+=dt;
   if(Math.hypot(state.position.x,state.position.y)<.3&&Math.hypot(state.velocity.x,state.velocity.y)<2)return time;
  }
  throw new Error('Orky never reached home');
 };
 for(const dt of [1/120,1/60,1/30]){
  const ratio=duration(returnStep,dt)/duration(springStep,dt);
  assert.ok(ratio>2.7&&ratio<3.3,`Return duration ratio: ${ratio}`);
 }
});
