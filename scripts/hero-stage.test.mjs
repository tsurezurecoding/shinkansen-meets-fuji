import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const script=fs.readFileSync(new URL('../promo/hero-stage.js',import.meta.url),'utf8');
async function harness(){
 const dom=new JSDOM('<div id="frame"><div id="stage"><div id="bg"></div></div></div>',{url:'https://www.michikusa-travel.com/promo/hero-stage.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,jobs=new Map(),messages=[];let now=0,id=0,hidden=false,renders=0,prepares=0,styleReads=0;
 Object.defineProperty(w.performance,'now',{value:()=>now});Object.defineProperty(w.document,'hidden',{get:()=>hidden});
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLImageElement.prototype.decode=async()=>{};
 const parent={postMessage:m=>messages.push({...m,at:now})};Object.defineProperty(w,'parent',{value:parent});
 w.setTimeout=(fn,ms)=>{jobs.set(++id,{at:now+ms,fn,type:'timer'});return id;};w.clearTimeout=n=>jobs.delete(n);
 w.requestAnimationFrame=fn=>{jobs.set(++id,{at:now+1000/60,fn,type:'raf'});return id;};w.cancelAnimationFrame=n=>jobs.delete(n);
 w.getComputedStyle=()=>{styleReads++;return {backgroundColor:'#123456'};};
 w.PV_SCENES=[{id:'first',start:0,end:3},{id:'final',start:3,end:5}];
 w.PV_FILM={lang:'ja',ready:Promise.resolve(),prepare:async()=>{prepares++;},render:f=>{renders++;w.document.getElementById('bg').style.backgroundColor='rgb(8, 21, 33)';w.document.getElementById('stage').dataset.cinemaFinale=String(f>=90);}};
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
 w.eval(script);await flush();
 const send=async(action,extra={})=>{w.dispatchEvent(new w.MessageEvent('message',{source:parent,origin:w.location.origin,data:{type:'hero-film',action,...extra}}));await flush();};
 const advance=async ms=>{
  const end=now+ms;let count=0;
  for(;;){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;
   if(++count>10000)throw Error('Scheduler did not settle');jobs.delete(next[0]);now=next[1].at;next[1].fn(now);await flush();
  }now=end;await flush();
 };
 return {send,advance,get state(){return w.HERO_STAGE.state;},get counts(){return {renders,prepares,styleReads,raf:[...jobs.values()].filter(j=>j.type==='raf').length,timers:[...jobs.values()].filter(j=>j.type==='timer').length};},messages,hide:async value=>{hidden=value;w.document.dispatchEvent(new w.Event('visibilitychange'));await flush();},pagehide:()=>w.dispatchEvent(new w.Event('pagehide')),close:()=>dom.window.close(),get background(){return w.document.body.style.backgroundColor;}};
}
test('initial wait is idle and starts automatically after the existing 1.2 seconds',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});const before=h.counts;assert.equal(before.raf,0);assert.equal(before.timers,1);await h.advance(1190);assert.deepEqual(h.counts,before);assert.equal(h.state.mode,'hero');await h.advance(50);assert.equal(h.state.mode,'auto');assert(h.counts.raf>0);}finally{h.close();}
});
test('offscreen and hidden-page waits preserve remaining visible time',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});await h.advance(400);await h.send('visibility',{visible:false});const before=h.counts;await h.advance(5000);assert.deepEqual(h.counts,before);await h.send('visibility',{visible:true});await h.advance(300);await h.hide(true);await h.advance(5000);assert.equal(h.state.mode,'hero');await h.hide(false);await h.advance(490);assert.equal(h.state.mode,'hero');await h.advance(50);assert.equal(h.state.mode,'auto');}finally{h.close();}
});
test('explicit pause cancels a pending start and manual play starts promptly',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});await h.advance(400);await h.send('pause');await h.advance(3000);assert.equal(h.state.playing,false);assert.equal(h.counts.timers,0);await h.send('play');await h.advance(50);assert.equal(h.state.mode,'auto');assert.equal(h.state.playing,true);}finally{h.close();}
});
test('chapter changes cancel the wait and preserve paused state',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});await h.send('pause');await h.send('go',{chapter:1});await h.advance(500);assert.equal(h.state.chapter,1);assert.equal(h.state.playing,false);assert.equal(h.counts.timers,0);await h.send('play');await h.advance(100);assert.equal(h.state.playing,true);}finally{h.close();}
});
test('repeat wait stays idle, repeats automatically and survives pagehide',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});await h.advance(9100);assert.equal(h.state.mode,'hero');assert(h.messages.some(m=>m.action==='complete'));const before=h.counts;assert.equal(before.raf,0);await h.advance(1000);assert.deepEqual(h.counts,before);h.pagehide();assert.equal(h.counts.timers,0);await h.advance(12000);assert.equal(h.state.mode,'hero');await h.send('visibility',{visible:true});await h.advance(8000);assert.equal(h.state.mode,'auto');}finally{h.close();}
});
test('letterbox preserves the CSS finale colour and avoids repeated computed-style reads',async()=>{
 const h=await harness();try{await h.send('visibility',{visible:true});await h.send('go',{chapter:1});await h.advance(500);assert.equal(h.background,'rgb(18, 52, 86)');const reads=h.counts.styleReads;await h.advance(500);assert.equal(h.counts.styleReads,reads);}finally{h.close();}
});
