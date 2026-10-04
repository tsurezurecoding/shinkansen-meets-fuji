import http from 'node:http';

// Immutable host binding: queued requests can never read the next run's version.
export function createSnapshotServer(files,bindings,missing){
 return http.createServer((req,res)=>{
  const host=(req.headers.host||'').split(':')[0],binding=bindings.get(host);
  if(!binding){missing.push({host,name:req.url,reason:'unknown host'});res.writeHead(400);res.end();return;}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400);res.end();return;}
  if(name.endsWith('/'))name+='index.html';
  const file=files.get(binding.version+name);
  if(!file){missing.push({host,version:binding.version,run:binding.run,name});res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':file.type,'Cache-Control':'no-store','X-Top-Compare-Version':binding.version,
   'X-Top-Compare-Run':binding.run,...(file.gzip?{'Content-Encoding':'gzip'}:{})});res.end(file.body);
 });
}
