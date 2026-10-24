import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com/';
const routes=['somato','sumie','window-film','window-trip','memory-express'].flatMap(id=>
  ['window-trip','memory-express'].includes(id)?[id+'.html']:[id+'.html','en/'+id+'.html']);
test('retired artwork URLs preserve language, query and fragment on Web and file previews',()=>{
  for(const route of routes){
    const html=fs.readFileSync(path.join(root,route),'utf8');
    const target=route.replace(/([^/]+)\.html$/,'artworks/$1/index.html');
    for(const base of [new URL(route,origin),pathToFileURL(path.join(root,route))]){
      let destination;
      const location={search:'?lang=ja&source=bookmark',hash:'#cast',replace:url=>{destination=new URL(url,base);}};
      vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{location});
      assert.equal(destination.search,location.search);assert.equal(destination.hash,location.hash);
      assert.equal(destination.href,new URL(target+(location.search+location.hash),
        base.protocol==='file:'?pathToFileURL(root+path.sep):origin).href);
    }
    assert(fs.existsSync(path.join(root,target)));
  }
});
test('destination pages resolve classic scripts, styles and navigation in Web and file previews',()=>{
  for(const route of routes){
    const target=route.replace(/([^/]+)\.html$/,'artworks/$1/index.html');
    const html=fs.readFileSync(path.join(root,target),'utf8');
    for(const base of [new URL(target,origin),pathToFileURL(path.join(root,target))]){
      const dom=new JSDOM(html,{url:base.href});
      try{
        const doc=dom.window.document;
        assert.equal(doc.querySelector('link[rel=canonical]').href,new URL(target,origin).href);
        for(const el of doc.querySelectorAll('script[src],link[rel=stylesheet],a[href]')){
          const url=new URL(el.src||el.href,doc.baseURI);
          if(url.protocol==='file:')assert(fs.existsSync(fileURLToPath(url)),url.href);
          else if(url.origin===new URL(origin).origin){
            assert(fs.existsSync(path.join(root,decodeURIComponent(url.pathname),url.pathname.endsWith('/')?'index.html':'')),url.href);
          }
        }
      }finally{dom.window.close();}
    }
  }
});
