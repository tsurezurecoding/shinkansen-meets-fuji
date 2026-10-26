import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectSiteChrome, expandSiteChrome, readSiteSource, readSiteChromePayloads, emitSiteChrome, templateSignature, sourceTemplatePath, persistSourceParts } from './shared/site-chrome.mjs';
import { withPageAndroidAppInvite } from './shared/android-app-invite.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authoredRoots = ['index.html','start.html','zukan.html','live/index.html','journal.html','en/journal.html','guide.html','en/guide.html','references.html','en/references.html','privacy.html','en/privacy.html','contact.html','en/contact.html','android-app.html','en/android-app.html','reflections.html','en/reflections.html','en/jr-pass-fuji.html','en/besides-fuji.html','zh-Hant/besides-fuji.html'];
const authoredSources = new Set([...authoredRoots, ...['fr','de','es','ko','zh-Hant','zh-Hans','it','th','ar'].map(lang => `${lang}/guide.html`)]);
const excludedDirectories = new Set(['v0','v1','node_modules','scripts','data','shared-ui','promo','buildingfinder','traingraph']);
const excludedFiles = new Set(['promo.html','google00ff4d27915d01c3.html','navercdb86f56126e5063178bc29b07c50ca0.html']);
function htmlFiles(root, directory = root) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || excludedDirectories.has(entry.name)) return [];
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(root, full);
    const relative = path.relative(root, full).replaceAll('\\', '/');
    return entry.name.endsWith('.html') && !excludedFiles.has(relative) ? [relative] : [];
  }).sort();
}
function routeKey(file) { return file.replace(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//, '').replace(/\.html$/, '').replace(/\/index$/, '').replaceAll('/', '-').replace(/[^a-z0-9-]/gi, '-').toLowerCase(); }
const preferred = ['start','index','zukan','journal','spots-fuji','castles','guide','references','drinks','sparkling-dreams','window-quiz'];
function priority(file) { const index = preferred.indexOf(routeKey(file)); return index < 0 ? 100 : index; }
function exemplar(group) { return [...group].sort((a,b) => priority(a.file)-priority(b.file) || a.file.localeCompare(b.file))[0]; }
function assetFor(lang, kind, id) { return `shared-ui/${lang.toLowerCase()}.${kind === 'rail' ? 'rail-' + id.slice(5) : ['header','footer','content'].includes(kind) ? 'shell' : 'cards'}.js`; }
function writeIfChanged(file, text, check, changes) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (old === text) return;
  if (!check) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8'); }
  changes.push(file);
}
export function materializeSiteSources({ appDir = appRoot, check = false } = {}) {
  const changes = [];
  for (const file of authoredSources) if (fs.existsSync(sourceTemplatePath(appDir, file))) writeIfChanged(path.join(appDir,file), readSiteSource(appDir,file), check, changes);
  return changes.map(file => path.relative(appDir,file).replaceAll('\\','/'));
}
export function generateSiteChrome({ appDir = appRoot, check = false, initializeSources = false } = {}) {
  // Resolve old source identities before payloads are replaced or pruned.
  const sources=new Map([...authoredSources].filter(file=>fs.existsSync(sourceTemplatePath(appDir,file))).map(file=>[file,expandSiteChrome(fs.readFileSync(sourceTemplatePath(appDir,file),'utf8'),file,appDir)]));
  // Final pass consumes the preceding generators' outputs, never an older body template.
  const pages = htmlFiles(appDir).map(file => {
    const html = expandSiteChrome(fs.readFileSync(path.join(appDir,file),'utf8'), file, appDir);
    return { file, html, page: collectSiteChrome(html,file) };
  });
  const byLanguage = new Map();
  for (const entry of pages) for (const record of entry.page.records) {
    if (!entry.page.asset) continue;
    let groups = byLanguage.get(entry.page.lang);
    if (!groups) { groups = new Map(); byLanguage.set(entry.page.lang,groups); }
    const group = groups.get(record.key) || [];
    group.push({ file: entry.file, record }); groups.set(record.key,group);
  }
  const registries = new Map(), lookups = new Map(), outputs = new Map(), changes = [], references = new Map();
  function referenceOutput(html,registry) {
    const match=html.match(/<script id="mado-shared-ui-config" type="application\/json">([\s\S]*?)<\/script>/);if(!match)return;
    for(const mount of JSON.parse(match[1]).mounts)for(const [key,menu] of [[mount.component,false],[mount.menu,true]]){if(!key)continue;const asset=registry[menu?'menuAssets':'componentAssets'][key],used=references.get(asset)||{components:new Set(),menus:new Set()};used[menu?'menus':'components'].add(key);references.set(asset,used);}
  }
  const report = { pages:pages.length, sharedPages:0, components:0, assets:[], standalone:[], runtimeOnly:[] };
  for (const [lang,groups] of byLanguage) {
    const previous = readSiteChromePayloads(appDir,lang);
    const registry = { version:1, components:{}, menus:{}, origins:{}, componentAssets:{}, menuAssets:{} };
    const lookup = new Map(), used = new Set();
    for (const [key,group] of groups) {
      const same = Object.entries(previous.components).find(([,value]) => templateSignature(value) === key)?.[0];
      const origin = Object.entries(previous.origins).find(([,value]) => group.some(item => item.file === value.file && item.record.type === value.kind))?.[0];
      if (group.length < 2 && !same && !origin) continue;
      const sample = exemplar(group), id = same || origin || `${sample.record.type}-${routeKey(sample.file)}`;
      if (used.has(id)) throw Error(`Shared UI profile conflict: ${lang}/${id}`);
      used.add(id);
      const asset = previous.componentAssets[id] || assetFor(lang,sample.record.type,id);
      registry.components[id] = sample.record.template;
      registry.origins[id] = previous.origins[id] || { file:sample.file, kind:sample.record.type };
      registry.componentAssets[id] = asset;
      lookup.set(key,id);
      for (const {record} of group) if (record.menuTemplate) {
        let menu = Object.entries(registry.menus).find(([,value]) => templateSignature(value) === templateSignature(record.menuTemplate))?.[0];
        if (!menu) {
          menu = Object.entries(previous.menus).find(([,value]) => templateSignature(value) === templateSignature(record.menuTemplate))?.[0] || `${id}-menu`;
          let suffix = 2; const base = menu;
          while (registry.menus[menu]) menu = `${base}-${suffix++}`;
          registry.menus[menu] = record.menuTemplate; registry.menuAssets[menu] = assetFor(lang,'header',id);
        }
      }
    }
    // Preserve source identities when an old component loses a generated peer.
    for (const [id,value] of Object.entries(previous.components)) if (!registry.components[id]) {
      registry.components[id]=value; registry.origins[id]=previous.origins[id]; registry.componentAssets[id]=previous.componentAssets[id];
    }
    for (const [id,value] of Object.entries(previous.menus)) if (!registry.menus[id]) { registry.menus[id]=value; registry.menuAssets[id]=previous.menuAssets[id]; }
    registries.set(lang,registry); lookups.set(lang,lookup);
    report.components += used.size;
    for (const [id,template] of Object.entries(registry.components)) {
      const asset=registry.componentAssets[id]; const payload=outputs.get(asset)||{version:1,components:{},menus:{},origins:{}};
      payload.components[id]=template;if(registry.origins[id])payload.origins[id]=registry.origins[id];outputs.set(asset,payload);
    }
    for (const [id,template] of Object.entries(registry.menus)) { const asset=registry.menuAssets[id];const payload=outputs.get(asset)||{version:1,components:{},menus:{},origins:{}};payload.menus[id]=template;outputs.set(asset,payload); }
  }
  for (const entry of pages) {
    const registry=registries.get(entry.page.lang);
    const output=registry?emitSiteChrome(entry.html,entry.file,entry.page,registry,lookups.get(entry.page.lang)):entry.html;
    if(output.includes('id="mado-shared-ui-config"'))report.sharedPages++;
    else if(entry.html.includes('data-spot-page-shared-module'))report.runtimeOnly.push(entry.file);
    else report.standalone.push(entry.file);
    referenceOutput(output,registry);
    if (initializeSources && authoredSources.has(entry.file) && !fs.existsSync(sourceTemplatePath(appDir,entry.file))) {
      if(check)throw Error('Source initialization cannot run in check mode');
      const match=output.match(/<script id="mado-shared-ui-config" type="application\/json">([\s\S]*?)<\/script>/);
      if(match)persistSourceParts(appDir,registry,JSON.parse(match[1]));
      const template=sourceTemplatePath(appDir,entry.file);fs.mkdirSync(path.dirname(template),{recursive:true});fs.writeFileSync(template,withPageAndroidAppInvite(output,entry.file),'utf8');
    }
    writeIfChanged(path.join(appDir,entry.file),output,check,changes);
  }
  // Rebind source mounts when parameterization makes two former profiles equal.
  // This updates only the source's own chrome; generated body changes stay in output.
  for (const [file,expanded] of sources) {
    const template=sourceTemplatePath(appDir,file),page=collectSiteChrome(expanded,file), registry=registries.get(page.lang);if(!registry)continue;
    const output=withPageAndroidAppInvite(emitSiteChrome(expanded,file,page,registry,lookups.get(page.lang)),file);
    const match=output.match(/<script id="mado-shared-ui-config" type="application\/json">([\s\S]*?)<\/script>/);
    if(match&&!check)persistSourceParts(appDir,registry,JSON.parse(match[1]));
    referenceOutput(output,registry);
    writeIfChanged(template,output,check,changes);
  }
  report.components=0;
  for (const [asset,payload] of outputs) {
    const used=references.get(asset);
    if(!used){const target=path.join(appDir,asset);if(fs.existsSync(target)){if(!check)fs.unlinkSync(target);changes.push(target);}continue;}
    for(const key of Object.keys(payload.components))if(!used.components.has(key)){delete payload.components[key];delete payload.origins[key];}
    for(const key of Object.keys(payload.menus))if(!used.menus.has(key))delete payload.menus[key];
    report.components+=Object.keys(payload.components).length;
    const serialized = `/* Generated shared UI; edit source parts or the owning page generator. */\n(function(root){var data=${JSON.stringify(payload).replace(/</g,'\\u003c')};var target=root.MADO_SHARED_UI||(root.MADO_SHARED_UI={version:1,components:{},menus:{},origins:{}});for(var key of ['components','menus','origins'])Object.assign(target[key],data[key]);}(typeof window==='undefined'?globalThis:window));\n`;
    writeIfChanged(path.join(appDir,asset),serialized,check,changes); report.assets.push(asset);
  }
  return {...report,changes:changes.map(file=>path.relative(appDir,file).replaceAll('\\','/'))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const check=process.argv.includes('--check');
  const report=process.argv.includes('--materialize-sources')?{changes:materializeSiteSources({check})}:generateSiteChrome({check,initializeSources:process.argv.includes('--initialize-sources')});
  console.log(JSON.stringify(report,null,2));if(check&&report.changes.length)process.exitCode=1;
}
