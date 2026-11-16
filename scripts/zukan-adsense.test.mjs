import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {chooseReleaseScope} from './release-scope.mjs';
const html=fs.readFileSync('zukan.html','utf8');
const marker=/<!-- ZUKAN_ADSENSE_JA_START -->[\s\S]*?<!-- ZUKAN_ADSENSE_JA_END -->/;
const block=html.match(marker)[0];
const code=block.match(/<script>([\s\S]*?)<\/script>/)[1];
test('one ad stays between themes and gallery; source agrees',()=>{
 assert.equal((html.match(/data-ad-slot=/g)||[]).length,1);
 assert.ok(html.indexOf('zukanIntentsTitle')<html.indexOf('ZUKAN_ADSENSE_JA_START'));
 assert.ok(html.indexOf('ZUKAN_ADSENSE_JA_END')<html.indexOf('id="gallery"'));
 assert.equal(fs.readFileSync('scripts/templates/site-source/zukan.html.tpl','utf8').match(marker)[0],block);
 for(const lang of ['en','fr','de','es','it','ko','th','zh-Hans','zh-Hant'])assert.ok(!fs.readFileSync(lang+'/zukan.html','utf8').includes('6441368309'));
 assert.ok(fs.readFileSync('scripts/generate-language-mirrors.mjs','utf8').includes('ZUKAN_ADSENSE_JA_START'));
});
test('requests ads only once on production Japanese route',()=>{
 for(const [protocol,hostname,pathname,expected] of [['http:','127.0.0.1','/zukan.html',0],['file:','','/zukan.html',0],['https:','www.michikusa-travel.com','/en/zukan.html',0],['https:','www.michikusa-travel.com','/zukan.html',1],['https:','michikusa-travel.com','/zukan.html',1]]){
 const scripts=[];const window={};vm.runInNewContext(code,{location:{protocol,hostname,pathname},window,document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}});
 assert.equal(scripts.length,expected);assert.equal(window.adsbygoogle?.length||0,expected);
 }
});
test('narrow release contract selects this dependency set',()=>{
 const files=['zukan.html','privacy.html','scripts/templates/site-source/zukan.html.tpl','scripts/templates/site-source/privacy.html.tpl','scripts/generate-language-mirrors.mjs','scripts/release-scope.mjs','scripts/zukan-adsense.test.mjs'];
 assert.equal(chooseReleaseScope(files.map(path=>({path,status:'M'}))).scope,'zukan-adsense');
 assert.notEqual(chooseReleaseScope([...files,'app.js'].map(path=>({path,status:'M'}))).scope,'zukan-adsense');
});
