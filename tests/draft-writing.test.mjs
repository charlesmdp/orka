import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('const orkySampleReply'),app.indexOf('function setAutopilot'));
function setup(reducedMotion=false){
  const nodes=new Map(),timers=new Map();let id=0,visibility;
  const get=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{value:'',textContent:'',disabled:false,hidden:false,attributes:{},handlers:{},
      setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.handlers[k]=v},focus(){}});
    return nodes.get(selector);
  };
  const document={hidden:false,addEventListener(k,v){this[k]=v}};
  const motion={matches:reducedMotion,addEventListener(){}};
  class Observer{constructor(callback){visibility=callback}observe(){}}
  vm.runInNewContext(source,{$:get,document,window:{matchMedia:()=>motion,IntersectionObserver:Observer},IntersectionObserver:Observer,
    setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(i){timers.delete(i)}});
  const step=()=>{const next=timers.entries().next().value;if(next){timers.delete(next[0]);next[1]();}};
  const finish=()=>{let safety=100;while(timers.size && safety--)step();assert.ok(safety>0)};
  return{get,timers,document,show:()=>visibility([{isIntersecting:true}]),hide:()=>visibility([{isIntersecting:false}]),step,finish,
    click:selector=>get(selector).handlers.click()};
}

test('a draft starts on arrival, grows progressively, and is ready before sending',()=>{
  const {get,show,step,finish,click}=setup();
  assert.equal(get('#orky-draft').value,'');
  show();const first=get('#orky-draft').value;
  assert.ok(first.length>0 && first.length<30);
  assert.equal(get('[data-orky-send]').disabled,true);
  step();assert.ok(get('#orky-draft').value.length>first.length);
  finish();assert.match(get('#orky-draft').value,/from your saved meals\.$/);
  assert.equal(get('[data-orky-send]').disabled,false);
  click('[data-orky-send]');
  assert.equal(get('#copilot-sent-copy').textContent,get('#orky-draft').value);
});

test('typing pauses offscreen and user edits or discard cancel the animation',()=>{
  const {get,show,hide,finish,timers,click}=setup();
  show();hide();const paused=get('#orky-draft').value;
  finish();assert.equal(get('#orky-draft').value,paused);
  show();assert.ok(get('#orky-draft').value.length>paused.length);
  get('#orky-draft').value='My own answer';
  get('#orky-draft').handlers.input({currentTarget:get('#orky-draft')});
  finish();hide();show();assert.equal(get('#orky-draft').value,'My own answer');
  assert.equal(timers.size,0);
  click('[data-copilot-suggest]');click('[data-orky-clear]');finish();
  assert.equal(get('#orky-draft').value,'');assert.equal(get('[data-orky-send]').disabled,true);
});

test('reduced motion delivers the complete editable draft immediately',()=>{
  const {get,show,timers}=setup(true);show();
  assert.match(get('#orky-draft').value,/from your saved meals\.$/);
  assert.equal(get('[data-orky-send]').disabled,false);
  assert.equal(timers.size,0);
});
