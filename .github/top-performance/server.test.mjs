import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createSnapshotServer} from './server.mjs';
test('late requests stay bound to original version, not next active run',async()=>{
 const missing=[],bindings=new Map([['r0.top-compare.test',{version:'old',run:'0'}]]);
 const server=createSnapshotServer(new Map([['old/index.html',{body:'OLD',type:'text/html'}],['new/index.html',{body:'NEW',type:'text/html'}],['new/promo.js',{body:'PROMO',type:'text/javascript'}]]),bindings,missing);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const get=(host,name='/')=>new Promise((resolve,reject)=>{
  http.get({hostname:'127.0.0.1',port:server.address().port,path:name,headers:{host}},res=>{
   let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({body,status:res.statusCode,version:res.headers['x-top-compare-version']}));
  }).on('error',reject);
 });
 try{
  bindings.set('r1.top-compare.test',{version:'new',run:'1'});
  assert.deepEqual(await get('r1.top-compare.test'),{body:'NEW',status:200,version:'new'});
  assert.deepEqual(await get('r0.top-compare.test'),{body:'OLD',status:200,version:'old'});
  assert.equal((await get('r1.top-compare.test','/promo.js')).status,200);
  assert.equal((await get('r0.top-compare.test','/promo.js')).status,404);
  assert.deepEqual(missing,[{host:'r0.top-compare.test',version:'old',run:'0',name:'/promo.js'}]);
  assert.equal((await get('unknown.test')).status,400);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
