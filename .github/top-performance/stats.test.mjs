import {test} from 'node:test';
import assert from 'node:assert/strict';
import {median,interval,summarize} from './stats.mjs';
test('median preserves inputs and handles empty/odd/even',()=>{const x=[4,1,3,2];assert.equal(median(x),2.5);assert.deepEqual(x,[4,1,3,2]);assert.equal(median([2,8,5]),5);assert.equal(median([]),null);});
test('bootstrap deterministic with constant differences',()=>{assert.deepEqual(interval([3,3,3]),[3,3]);assert.deepEqual(interval([1,2,8]),interval([1,2,8]));});
test('condition matching and CPU flags retain all runs',()=>{
 const rows=[];
 for(const mode of ['ga-on','ga-off'])for(let round=0;round<2;round++)for(const [i,version] of ['17135799','b87eeb52','09dde5ff'].entries())rows.push({form:'mobile',mode,lang:'ja',round,version,benchmarkIndex:round===1&&i===2?500:1000,score:0.9-i/100,firstContentfulPaint:100+i,largestContentfulPaint:200+i,totalBlockingTime:20+i,cumulativeLayoutShift:0,speedIndex:300+i});
 const result=summarize(rows);assert.equal(result.pairs.length,4);
 for(const p of result.pairs){assert.equal(p.n,2);assert.equal(p.stableN,1);assert.equal(p.matched[1].withinThreshold,false);}
 const missingFirst=rows.filter(r=>r.version!=='17135799');assert.equal(summarize(missingFirst).pairs.find(p=>p.baseline==='b87eeb52').stableN,0);
 const historical=rows.map(r=>({...r,version:r.version==='17135799'?'058278c3':r.version==='b87eeb52'?'8e6cf8e9':r.version}));
 const historySummary=summarize(historical);assert.equal(historySummary.groups.length,6);assert.equal(historySummary.pairs.length,4);assert.equal(historySummary.pairs[0].baseline,'058278c3');
});
