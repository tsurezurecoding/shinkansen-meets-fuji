export const median=values=>quantile(values,0.5);
export function quantile(values,p){
 if(!values.length)return null;
 const sorted=values.toSorted((a,b)=>a-b),index=(sorted.length-1)*p,low=Math.floor(index),high=Math.ceil(index);
 return sorted[low]+(sorted[high]-sorted[low])*(index-low);
}
export function interval(values){
 if(!values.length)return null;
 let seed=20261004;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const samples=Array.from({length:10000},()=>median(values.map(()=>values[Math.floor(random()*values.length)])));
 return [quantile(samples,0.025),quantile(samples,0.975)];
}
const metrics=['score','firstContentfulPaint','largestContentfulPaint','totalBlockingTime','cumulativeLayoutShift','speedIndex'];
export function summarize(rows){
 const groups=[],pairs=[];
 for(const form of ['mobile','desktop'])for(const mode of ['ga-on','ga-off'])for(const lang of ['ja','en']){
  const selected=rows.filter(r=>r.form===form&&r.mode===mode&&r.lang===lang&&!r.runtimeError);
  if(!selected.length)continue;
  const versionIds=[...new Set(selected.map(r=>r.version))];
  for(const version of versionIds){
   const runs=selected.filter(r=>r.version===version);
   groups.push({form,mode,lang,version,n:runs.length,metrics:Object.fromEntries(metrics.map(k=>{const v=runs.map(r=>r[k]);return [k,{median:median(v),min:Math.min(...v),max:Math.max(...v),p25:quantile(v,0.25),p75:quantile(v,0.75)}];}))});
  }
  for(const baseline of versionIds.filter(v=>v!=='09dde5ff')){
   const matched=[];
   for(const round of new Set(selected.map(r=>r.round))){
    const block=selected.filter(r=>r.round===round),a=block.find(r=>r.version===baseline),b=block.find(r=>r.version==='09dde5ff');
    if(!a||!b)continue;
    const cpu=block.map(r=>r.benchmarkIndex),ratio=Math.max(...cpu)/Math.min(...cpu);
    matched.push({round,benchmarkRatio:ratio,withinThreshold:block.length===3&&ratio<=1.15,delta:Object.fromEntries(metrics.map(k=>[k,b[k]-a[k]]))});
   }
   const aggregate=subset=>Object.fromEntries(metrics.map(k=>{const v=subset.map(r=>r.delta[k]);return [k,{medianDelta:median(v),bootstrapMedianInterval:interval(v),negative:v.filter(x=>x<0).length,positive:v.filter(x=>x>0).length}];}));
   const stable=matched.filter(r=>r.withinThreshold);
   pairs.push({form,mode,lang,baseline,candidate:'09dde5ff',n:matched.length,stableN:stable.length,all:aggregate(matched),withinCpuThreshold:aggregate(stable),matched});
  }
 }
 return {meaning:'Candidate minus baseline; positive times slower, positive score higher. Small-sample bootstrap conditional on these runner measurements, not Google PSI/public-site causal confidence.',groups,pairs};
}
