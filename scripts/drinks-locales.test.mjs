import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {localizeYamazakiPayload,YAMAZAKI_LANGS} from './shared/yamazaki-locales.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const values=(h,key)=>[...h.matchAll(new RegExp('\\b'+key+'="([^"]*)"','g'))].map(m=>m[1]);
for(const slug of ['drinks','beer-on-shinkansen'])test(`${slug}: six editions retain assets, source links, Japanese labels and section destinations`,()=>{
 const en=read(`en/${slug}.html`);const photos=values(en,'src').filter(s=>/\.(?:jpg|webp|png)/.test(s));
 const external=values(en,'href').filter(s=>/^https?:/.test(s)&&!s.includes('michikusa-travel.com'));
 const labels=[...en.matchAll(/<[^>]+lang="ja"[^>]*>([^<]*)<\//g)].map(m=>m[1]);
 for(const lang of YAMAZAKI_LANGS){const h=read(`${lang}/${slug}.html`);assert.match(h,new RegExp(`<html lang="${lang}">`));assert.deepEqual(values(h,'src').filter(s=>/\.(?:jpg|webp|png)/.test(s)),photos);for(const u of external)assert.ok(h.includes(u),u);for(const label of labels)assert.ok(h.includes(label),label);for(const id of values(h,'href').filter(v=>v.startsWith('#')))assert.ok(h.includes(`id="${id.slice(1)}"`),id);assert.ok(h.includes(`/${lang}/${slug}.html`));assert.ok(values(h,'href').some(href=>new URL(href,`https://local/${lang}/${slug}.html`).pathname===`/${lang}/${slug==='drinks'?'beer-on-shinkansen':'spots/yamazaki-distillery'}.html`));assert.ok(!h.includes('Skip to the '));assert.ok(!h.includes('data-spot-page-shared-lang="en"'));if(slug==='beer-on-shinkansen'){const copy=JSON.parse(h.match(/id="beer-label-copy">([^<]+)</)[1]);assert.deepEqual(Object.keys(copy),['nama','dry','black']);assert.ok(!copy.black[1].includes('does not describe'));}}
});
test('Yamazaki translation keeps physical facts and ownership, while using correct two-way E side and local beer return',()=>{
 const c={};vm.runInNewContext(read('data/spot-pages/yamazaki-distillery.en.js'),c);const source=JSON.parse(JSON.stringify(c.MADO_SPOT_PAGE_DATA));const before=JSON.stringify(source);
 for(const lang of YAMAZAKI_LANGS){const p=localizeYamazakiPayload(source,lang);assert.equal(p.lang,lang);assert.equal(p.minutes,source.minutes);assert.equal(p.map.lat,source.map.lat);assert.deepEqual(p.photos.map(x=>[x.src,x.credit,x.date]),source.photos.map(x=>[x.src,x.credit,x.date]));assert.equal(p.chapters.at(-1).link.route,`${lang}/beer-on-shinkansen.html`);assert.ok(p.chapters[3].paragraphs[0]!==source.chapters[3].paragraphs[0]);assert.equal(p.guide.href,`../../${lang}/start.html#journey`);assert.equal(p.bodyLinks[0].href,source.bodyLinks[0].href);}
 assert.equal(JSON.stringify(source),before);
});
