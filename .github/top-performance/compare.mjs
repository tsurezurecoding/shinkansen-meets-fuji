// Diagnostic branch only: archived production bytes, no deploy and no GA events.
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import os from 'node:os';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import {summarize} from './stats.mjs';
import {createSnapshotServer} from './server.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const versionFile=process.env.TOP_COMPARE_VERSIONS||'versions.json';assert(['versions.json','historical-versions.json'].includes(versionFile));
const versions=JSON.parse(fs.readFileSync(path.join(here,versionFile),'utf8'));
const rounds=Number(process.env.TOP_COMPARE_ROUNDS||6),output=process.env.TOP_COMPARE_OUTPUT;
assert.equal(process.platform,'linux','Use the isolated Linux runner, not the user PC');
assert(Number.isInteger(rounds)&&rounds>=1&&rounds<=6);
assert(output&&path.isAbsolute(output));assert(!fs.existsSync(output),'Never overwrite prior evidence');
fs.mkdirSync(output,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:repo,maxBuffer:64*1024*1024});
const blobs=new Map(),files=new Map(),inventory=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
// Pull each original Git blob directly; builds and Windows CRLF cannot alter it.
for(const version of versions){
 const entries=git('ls-tree','-rz',version.sha).toString('utf8').split('\0').filter(Boolean);let bytes=0;
 for(const entry of entries){
  const [meta,name]=entry.split('\t'),[fileMode,type,oid]=meta.split(' ');
  assert.equal(type,'blob');assert(['100644','100755'].includes(fileMode));
  if(!blobs.has(oid)){
   const raw=git('cat-file','blob',oid);assert.equal(crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex'),oid);
   const gzip=/\.(html|css|js|mjs|json|svg|txt|xml)$/.test(name);
   blobs.set(oid,{body:gzip?zlib.gzipSync(raw):raw,gzip,rawBytes:raw.length});
  }
  bytes+=blobs.get(oid).rawBytes;files.set(version.id+'/'+name,{...blobs.get(oid),type:mime[path.extname(name)]||'application/octet-stream'});
 }
 inventory.push({...version,files:entries.length,bytes});
}
const chromePath=process.env.CHROME_PATH;assert(chromePath&&fs.existsSync(chromePath));
const chromeVersion=execFileSync(chromePath,['--version'],{encoding:'utf8'}).trim();
const jaFonts=['serif:lang=ja','sans-serif:lang=ja'].map(pattern=>{
 const [family,file]=execFileSync('fc-match',['-f','%{family}\n%{file}',pattern],{encoding:'utf8'}).trim().split('\n');
 assert(/CJK/.test(family),'Missing Japanese CJK font: '+family);
 return {pattern,family,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
});
const plan={startedAt:new Date().toISOString(),rounds,expectedRuns:rounds*18,inventory,uniqueBlobs:blobs.size,
 versionFile,jaFonts,fontPackage:execFileSync('dpkg-query',['-W','-f=${Version}','fonts-noto-cjk'],{encoding:'utf8'}).trim(),
 integrity:'Every original Git blob SHA1 validated; no generated or modified HTML/assets',
 platform:process.platform,release:os.release(),cpu:os.cpus()[0]?.model,cores:os.cpus().length,chromeVersion,
 environment:'Single GitHub-hosted Ubuntu 24.04 runner, sequential fresh Chrome; simulated Lighthouse default mobile and desktop. Not Google PSI; local HTTP, no production CDN.',
 conditions:['mobile/ga-on','mobile/ga-off','desktop/ga-on'],
 order:'6 permutations of A/B/C, condition order rotated/reversed across rounds, language order alternated',
 hostQualityRule:'Per language/form/GA/round, all 3 benchmarkIndex max/min <=1.15 is a sensitivity flag only; retain all runs',
 isolation:'Immutable per-run .test host binding, response version/run headers verified; Chrome close awaited before next run. Replaces unsafe mutable active-version server.',
 telemetry:'GA script runs in ga-on on browser-resolved .test hostname; collect/analytics endpoints blocked before navigation; do not send production events',
 limits:['Hosted runner has its own variable load; CPU checks do not guarantee dedicated CPU','Local HTTP/CDN and analytics transport differ from public PSI','External GA script/network and scheduling may vary','Small samples cannot establish public-site causality'],
 runId:process.env.GITHUB_RUN_ID,sourceSha:process.env.GITHUB_SHA};
const write=(name,x)=>fs.writeFileSync(path.join(output,name),JSON.stringify(x,null,2));write('plan.json',plan);
const missing=[],bindings=new Map();
const server=createSnapshotServer(files,bindings,missing);
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const permutations=[[0,1,2],[2,1,0],[1,0,2],[2,0,1],[0,2,1],[1,2,0]];
const conditions=[{form:'mobile',mode:'ga-on'},{form:'mobile',mode:'ga-off'},{form:'desktop',mode:'ga-on'}],rows=[];
const counters=()=>os.cpus().map(c=>c.times).reduce((a,t)=>({idle:a.idle+t.idle,total:a.total+Object.values(t).reduce((s,n)=>s+n,0)}),{idle:0,total:0});
const telemetry=url=>/collect|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googletagmanager\.com\/td/i.test(url);
try{
 for(let round=0;round<rounds;round++){
  const order=permutations[round%6];
  for(const conditionIndex of order)for(const lang of round%2?['en','ja']:['ja','en'])for(const index of order){
   const {form,mode}=conditions[conditionIndex],version=versions[index];
   const stem=`${form}-${mode}-${lang}-${round}-${version.id}`,host=`r${rows.length}.top-compare.test`;
   bindings.set(host,{version:version.id,run:stem});
   const cpuBefore=counters(),missingBefore=missing.length;
   const chrome=await launch({chromePath,chromeFlags:['--headless=new','--disable-gpu','--no-sandbox','--no-proxy-server','--host-resolver-rules=MAP *.top-compare.test 127.0.0.1'],logLevel:'silent'});
   try{
    const url=`http://${host}:${server.address().port}/${lang==='en'?'en/':''}${mode==='ga-off'?'?ga=off':''}`;
    const blockedUrlPatterns=['*collect*','*google-analytics.com*','*analytics.google.com*','*doubleclick.net*','*googletagmanager.com/td*'];
    if(mode==='ga-off')blockedUrlPatterns.push('*googletagmanager.com*');
    const {lhr,artifacts}=await lighthouse(url,{port:chrome.port,onlyCategories:['performance'],logLevel:'error',output:'json',blockedUrlPatterns},form==='desktop'?desktopConfig:undefined);
    write(stem+'.json',lhr);
    fs.writeFileSync(path.join(output,stem+'-trace.json.gz'),zlib.gzipSync(JSON.stringify(artifacts.Trace)));
    fs.writeFileSync(path.join(output,stem+'-network.json.gz'),zlib.gzipSync(JSON.stringify(artifacts.DevtoolsLog)));
    const network=artifacts.DevtoolsLog,metric=lhr.audits.metrics.details.items[0],cpuAfter=counters();
    const gaIds=new Set(network.filter(e=>e.method==='Network.requestWillBeSent'&&e.params.request.url.includes('googletagmanager.com/gtag/js')).map(e=>e.params.requestId));
    const gaLoaded=network.some(e=>e.method==='Network.responseReceived'&&gaIds.has(e.params.requestId)&&e.params.response.status===200);
    const transport=network.filter(e=>e.method==='Network.requestWillBeSent'&&telemetry(e.params.request.url)),ids=new Set(transport.map(e=>e.params.requestId));
    const responses=network.filter(e=>e.method==='Network.responseReceived'&&(ids.has(e.params.requestId)||telemetry(e.params.response.url)));
    const failures=network.filter(e=>e.method==='Network.loadingFailed'&&ids.has(e.params.requestId));
    const firstParty=network.filter(e=>e.method==='Network.responseReceived'&&new URL(e.params.response.url).hostname===host);
    const header=(r,key)=>Object.entries(r.headers).find(([k])=>k.toLowerCase()===key)?.[1];
    const mismatches=firstParty.filter(e=>e.params.response.status!==200||header(e.params.response,'x-top-compare-version')!==version.id||header(e.params.response,'x-top-compare-run')!==stem);
    const lcp=lhr.audits['lcp-breakdown-insight']?.details?.items||[];
    rows.push({round,lang,form,mode,version:version.id,sha:version.sha,fetchTime:lhr.fetchTime,lighthouseVersion:lhr.lighthouseVersion,
     benchmarkIndex:lhr.environment.benchmarkIndex,hostUserAgent:lhr.environment.hostUserAgent,config:lhr.configSettings,
     hostBusyFraction:1-(cpuAfter.idle-cpuBefore.idle)/(cpuAfter.total-cpuBefore.total),score:lhr.categories.performance.score,...metric,
     gaLoaded,telemetryRequests:transport.length,telemetryBlocked:failures.length,telemetryResponses:responses.length,
     lcpSelector:lcp.find(e=>e.type==='node')?.selector,observedLcpBreakdown:lcp.find(e=>e.type==='table')?.items,
     lighthouseCpuByUrl:lhr.audits['bootup-time']?.details?.items,
     firstPartyResponses:firstParty.length,firstPartyMismatches:mismatches.length,
     missing:missing.slice(missingBefore),warnings:lhr.runWarnings,runtimeError:lhr.runtimeError});write('rows.json',rows);
    console.log(JSON.stringify({round,lang,form,mode,version:version.id,score:Math.round(lhr.categories.performance.score*100),lcp:metric.largestContentfulPaint,tbt:metric.totalBlockingTime,benchmark:lhr.environment.benchmarkIndex,gaLoaded}));
    assert(!lhr.runtimeError);assert.equal(gaLoaded,mode==='ga-on','GA condition mismatch');assert.equal(responses.length,0,'Analytics response received');
    assert.equal(failures.length,transport.length,'Transport not blocked');assert(failures.every(e=>e.params.blockedReason==='inspector'));
    assert.equal(missing.length,missingBefore,'Missing original asset');assert.equal(lhr.runWarnings.length,0,'Measurement warnings');
    assert(firstParty.length>0);assert.equal(mismatches.length,0,'Wrong version/run response');
   }finally{
    const closed=chrome.process.exitCode!==null||chrome.process.signalCode!==null?Promise.resolve():once(chrome.process,'close');
    chrome.kill();await closed;await new Promise(resolve=>setImmediate(resolve));server.closeAllConnections();
   }
  }
 }
 assert.equal(rows.length,plan.expectedRuns);
 write('summary.json',summarize(rows));write('completed.json',{completedAt:new Date().toISOString(),runs:rows.length,telemetryResponses:rows.reduce((a,r)=>a+r.telemetryResponses,0)});
 if(process.env.GITHUB_STEP_SUMMARY){
  const result=summarize(rows);fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## Fixed-version diagnostic (not PSI)\n\n'+result.pairs.map(p=>`${p.form}/${p.mode}/${p.lang} ${p.baseline}→09: n=${p.n}, CPU subset=${p.stableN}, median paired LCP delta=${p.all.largestContentfulPaint.medianDelta}ms, TBT=${p.all.totalBlockingTime.medianDelta}ms, score=${Math.round(p.all.score.medianDelta*10000)/100} points`).join('\n\n')+'\n');
 }
}finally{write('rows.json',rows);await new Promise(resolve=>server.close(resolve));}
