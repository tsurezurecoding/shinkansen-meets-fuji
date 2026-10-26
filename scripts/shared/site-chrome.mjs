import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parse, serializeOuter } from 'parse5';
import { withSiteRuntimeLoader } from './site-runtime-html.mjs';
import { assetVersion } from './asset-version.mjs';

const ORIGIN = 'https://site-chrome.invalid';
const ROOT_TOKEN = '__MADO_ROOT__';
const LANGS = new Set(['ja','en','fr','de','es','ko','zh-hant','zh-hans','it','th','ar']);
const sourceDirectory = 'scripts/templates/site-source';
const partDirectory = 'scripts/templates/site-chrome';
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
function setAttr(node, name, value) { const found = node.attrs.find(item => item.name === name); if (found) found.value = value; else node.attrs.push({ name, value }); }
function removeAttr(node, name) { node.attrs = node.attrs.filter(item => item.name !== name); }
function walk(node, visit) { visit(node); for (const child of node.childNodes || []) walk(child, visit); }
function find(node, predicate) { let result; walk(node, candidate => { if (!result && predicate(candidate)) result = candidate; }); return result; }
function replaceNode(node, replacement) { const siblings = node.parentNode.childNodes; siblings.splice(siblings.indexOf(node), 1, replacement); replacement.parentNode = node.parentNode; }
const comment = data => ({ nodeName: '#comment', data, parentNode: null });
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
export function siteChromeAsset(lang) { const normalized = String(lang).toLowerCase(); if (!LANGS.has(normalized)) return null; return `shared-ui/${normalized}.shell.js`; }
export function sourceTemplatePath(appDir, file) { return path.join(appDir, sourceDirectory, `${file}.tpl`); }
function partPath(appDir, asset, key, menu = false) { return path.join(appDir, partDirectory, path.basename(asset, '.js'), `${menu ? 'menu-' : ''}${key}.html.tpl`); }
export function readSiteChromePayload(appDir, asset) {
  if (!/^shared-ui\/[a-z0-9-]+\.[a-z0-9-]+\.js$/.test(asset)) throw new Error('Invalid shared UI asset');
  const filename = path.join(appDir, asset); if (!fs.existsSync(filename)) return null;
  const context = {}; context.window = context; vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  const payload = context.MADO_SHARED_UI;
  if (!payload || payload.version !== 1) throw new Error(`Invalid shared UI payload: ${asset}`);
  for (const [kind, menu] of [['components', false], ['menus', true]]) for (const key of Object.keys(payload[kind])) {
    const source = partPath(appDir, asset, key, menu);
    if (fs.existsSync(source)) payload[kind][key] = fs.readFileSync(source, 'utf8');
  }
  return payload;
}
export function readSiteChromePayloads(appDir, lang, assets) {
  const directory=path.join(appDir,'shared-ui');
  const files=assets || (fs.existsSync(directory)?fs.readdirSync(directory).filter(name=>name.startsWith(String(lang).toLowerCase()+'.')&&name.endsWith('.js')).map(name=>'shared-ui/'+name):[]);
  const merged={version:1,components:{},menus:{},origins:{},componentAssets:{},menuAssets:{}};
  for(const asset of files){const payload=readSiteChromePayload(appDir,asset);if(!payload)throw Error(`Missing shared UI asset: ${asset}`);for(const kind of ['components','menus','origins'])Object.assign(merged[kind],payload[kind]||{});for(const key of Object.keys(payload.components))merged.componentAssets[key]=asset;for(const key of Object.keys(payload.menus))merged.menuAssets[key]=asset;}
  return merged;
}
function renderer(appDir) { const context = {}; context.window = context; vm.runInNewContext(fs.readFileSync(path.join(appDir, 'site-chrome.js'), 'utf8'), context); return context.MADO_SITE_CHROME_RENDER; }
function parseDocument(html, file) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const htmlNode = find(document, n => n.tagName === 'html');
  const baseNode = find(document, n => n.tagName === 'base');
  const base = new URL(baseNode ? attr(baseNode, 'href') : '.', `${ORIGIN}/${file}`);
  const depth = base.pathname.split('/').filter(Boolean).length;
  return { document, lang: attr(htmlNode, 'lang') || '', base: base.href, root: '../'.repeat(depth) };
}
function applyReplacements(html, replacements) { for (const edit of [...replacements].sort((a,b) => b.start - a.start)) html = html.slice(0,edit.start) + edit.text + html.slice(edit.end); return html; }
export function expandSiteChrome(html, file, appDir) {
  const parsed = parseDocument(html, file), configNode = find(parsed.document, n => attr(n, 'id') === 'mado-shared-ui-config');
  if (!configNode) return html;
  const config = JSON.parse(configNode.childNodes.map(n => n.value || '').join(''));
  const payload = readSiteChromePayloads(appDir,config.lang,config.assets||[config.asset]);
  const render = renderer(appDir), replacements = [];
  for (const mount of config.mounts) {
    const host = find(parsed.document, n => attr(n, 'data-site-chrome-host') === mount.host);
    if (!host?.sourceCodeLocation) throw new Error(`Missing source host: ${file}/${mount.host}`);
    replacements.push({ start: host.sourceCodeLocation.startOffset, end: host.sourceCodeLocation.endOffset, text: render(payload, config, mount) });
  }
  replacements.push({ start: configNode.sourceCodeLocation.startOffset, end: configNode.sourceCodeLocation.endOffset, text: '' });
  walk(parsed.document, n => { if (n.tagName === 'script' && /(?:^|\/)site-runtime-loader\.js(?:\?|$)/.test(attr(n,'src') || '')) replacements.push({ start:n.sourceCodeLocation.startOffset,end:n.sourceCodeLocation.endOffset,text:'' }); });
  return applyReplacements(html, replacements).replace(/(?:\r?\n[\t ]*){2,}(?=<\/body\s*>)/i,'\n');
}
export function readSiteSource(appDir, file) {
  const template = sourceTemplatePath(appDir, file);
  const html=expandSiteChrome(fs.readFileSync(fs.existsSync(template) ? template : path.join(appDir, file), 'utf8'), file, appDir);
  const {base}=parseDocument(html,file);
  return html.replace(/(["'])((?:\.\.\/)*[A-Za-z0-9._\-/]+\.(?:js|css|mjs))\?v=([A-Za-z0-9._-]+)/g,(whole,quote,ref)=>{
    const relative=new URL(ref,base).pathname.slice(1);if(!fs.existsSync(path.join(appDir,relative)))return whole;
    return `${quote}${ref}?v=${assetVersion(relative,true)}`;
  });
}
function signature(node) {
  if (node.nodeName === '#text') return node.value.trim() ? node.value.replace(/\s+/g,' ') : '';
  if (node.nodeName === '#comment') return `<!--${node.data}-->`;
  if (!node.tagName) return '';
  const attrs = (node.attrs || []).map(a => [a.name, a.name === 'class' ? a.value.split(/\s+/).filter(Boolean).sort().join(' ') : a.value]).sort((a,b) => a[0].localeCompare(b[0]));
  return node.tagName + JSON.stringify(attrs) + (node.childNodes || []).map(signature).join('') + '/' + node.tagName;
}
function mainHeaderLinks(node, normalize = false) {
  if(!hasClass(node,'topbar') || !find(node,n=>attr(n,'data-i18n')==='brandName') || !find(node,n=>attr(n,'data-i18n')==='navStart'))return [];
  const links=[];let index=0;
  walk(node,n=>{if(n.tagName!=='a')return;const linkIndex=index++;const key=attr(n,'data-i18n');if(!hasClass(n,'brand')&&!/^nav[A-Z]/.test(key||''))return;
    const link={index:linkIndex,href:attr(n,'href')||''};
    if(key&&(n.childNodes||[]).every(child=>child.nodeName==='#text'))link.text=n.childNodes.map(child=>child.value).join('');
    links.push(link);
    if(normalize){setAttr(n,'href',`__MADO_MAIN_HREF_${linkIndex}__`);if(link.text!==undefined)n.childNodes=[{nodeName:'#text',value:`__MADO_MAIN_TEXT_${linkIndex}__`,parentNode:n}];}
  });return links;
}
function componentSignature(node) {
  if(!mainHeaderLinks(node).length)return signature(node);
  const clone=find(parse(serializeOuter(node)),n=>n.tagName===node.tagName&&hasClass(n,'topbar'));mainHeaderLinks(clone,true);return signature(clone);
}
export function templateSignature(template) { const body=find(parse(template), n => n.tagName === 'body');return (body.childNodes||[]).filter(n=>n.tagName).map(componentSignature).join(''); }
function headerFallback(node, lang) {
  const brand=find(node,n=>hasClass(n,'brand')),nav=find(node,n=>hasClass(n,'top-nav'));
  if(!brand||!nav)return '';
  const links=(nav.childNodes||[]).filter(n=>n.tagName==='a'&&!hasClass(n,'top-nav-stamp')&&!hasClass(n,'top-nav-overflow')).slice(0,3);
  if(!links.length)return '';
  const compact=n=>serializeOuter(n).replace(/>\s+</g,'><').trim();
  const label=attr(nav,'aria-label');
  const menu=find(node,n=>hasClass(n,'lang-switch')||hasClass(n,'guide-lang-menu'));
  let language='';
  if(menu){
    const summary=find(menu,n=>n.tagName==='summary');
    if(summary)language=`<details class="${escape(attr(menu,'class')||'guide-lang-menu')}" inert aria-hidden="true">${compact(summary).replace('<summary','<summary tabindex="-1"')}</details>`;
    else {
      const choices=(menu.childNodes||[]).filter(n=>n.tagName==='a'||n.tagName==='button');
      const choice=choices.find(n=>attr(n,'lang')===lang||attr(n,'data-lang')===lang||attr(n,'aria-current')==='page')||choices[0];
      if(choice)language=`<div class="lang-switch" inert aria-hidden="true">${compact(choice)}</div>`;
    }
  }
  // Reuse the existing responsive brand/nav/menu grid. A single text-only nav
  // cannot reserve its two mobile rows or the brand's desktop height.
  return compact(brand)+`<nav class="top-nav"${label?` aria-label="${escape(label)}"`:''} data-site-chrome-fallback>${links.map(compact).join('')}</nav>`+language;
}
export function collectSiteChrome(html, file) {
  const parsed = parseDocument(html, file), { document, base, root, lang } = parsed;
  const asset = siteChromeAsset(lang); if (!asset) return { ...parsed, asset:null, records:[] };
  const records = [];
  function part(node) {
    if (hasClass(node,'topbar')) return 'header';
    if (hasClass(node,'footer')) return 'footer';
    if (hasClass(node,'content-rail-section')) return 'content';
    if (hasClass(node,'spot-page-rail')) return 'rail';
    if (hasClass(node,'spot-page-showcase')) return 'showcase';
    if (hasClass(node,'tools-grid') && hasClass(node.parentNode || {},'spot-compact-guide')) return 'tools';
    if (hasClass(node,'spot-reading-related')) return 'collection';
    return null;
  }
  const nodes = []; walk(document,n => { const type=part(n); if(type && n.sourceCodeLocation) nodes.push({node:n,type}); });
  for (const {node,type} of nodes) {
    if (nodes.some(other => other.node !== node && other.node.sourceCodeLocation.startOffset < node.sourceCodeLocation.startOffset && other.node.sourceCodeLocation.endOffset > node.sourceCodeLocation.endOffset)) continue;
    const location=node.sourceCodeLocation, params={}; let menuTemplate='',menuRoute='';
    // Work on a detached parse so locations in the original document stay unchanged.
    const fragment=parse(html.slice(location.startOffset,location.endOffset)), copy=find(fragment,n=>n.tagName===node.tagName && (type==='tools'?hasClass(n,'tools-grid'):part(n)===type));
    if (!copy) continue;
    walk(copy,n => { for(const item of n.attrs || []) if(['href','src'].includes(item.name) && !/^(?:https?:|\/\/|mailto:|tel:|data:|#)/.test(item.value)) { const url=new URL(item.value,base); if(url.origin===ORIGIN) item.value=ROOT_TOKEN+url.pathname.slice(1)+url.search+url.hash; } });
    const headerPlaceholder=type==='header'?headerFallback(copy,lang).split(ROOT_TOKEN).join(root):'';
    if(type==='header') {
      const brand=find(copy,n=>hasClass(n,'brand')),mark=find(copy,n=>hasClass(n,'brand-mark'));
      if(brand&&attr(brand,'aria-label')){params.brandLabel=attr(brand,'aria-label');removeAttr(brand,'aria-label');}
      if(mark&&attr(mark,'aria-hidden')){params.brandMarkHidden=attr(mark,'aria-hidden');removeAttr(mark,'aria-hidden');}
      const menu=find(copy,n=>hasClass(n,'lang-switch')||hasClass(n,'guide-lang-menu'));
      if(menu) {
        const canonical=find(document,n=>n.tagName==='link'&&attr(n,'rel')==='canonical');
        const canonicalPath=canonical ? new URL(attr(canonical,'href')).pathname.slice(1) : file;
        menuRoute=canonicalPath.replace(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//,'') || 'index.html';
        walk(menu,n=>{ const href=attr(n,'href');if(!href?.startsWith(ROOT_TOKEN))return; const url=new URL(href.slice(ROOT_TOKEN.length),ORIGIN+'/');const target=url.pathname.slice(1).replace(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//,'')||'index.html';if(target===menuRoute || (target==='index.html'&&menuRoute==='index.html')){const edition=url.pathname.slice(1).match(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//)?.[0]||'';setAttr(n,'href',ROOT_TOKEN+edition+'__MADO_MENU_ROUTE__'+url.search+url.hash);}});
        menuTemplate=serializeOuter(menu);replaceNode(menu,comment('SITE_CHROME_MENU'));
      }
      let index=0; const tracking=[],currentAnchors=[];
      walk(copy,n=>{if(n.tagName!=='a')return;const attributes={};for(const a of n.attrs||[])if(a.name==='data-lp-cta')attributes[a.name]=a.value;if(Object.keys(attributes).length){tracking.push({index,attributes});removeAttr(n,'data-lp-cta');}if(attr(n,'aria-current')){currentAnchors.push({index,value:attr(n,'aria-current')});removeAttr(n,'aria-current');}index++;});
      if(tracking.length)params.tracking=tracking;
      if(currentAnchors.length)params.currentAnchors=currentAnchors;
    }
    if(type==='rail') {
      const now=find(copy,n=>hasClass(n,'spot-page-rail-now'));
      if(now){params.currentHTML=serializeOuter(now);replaceNode(now,comment('SITE_CHROME_CURRENT'));}
      walk(copy,n=>{if(n.tagName!=='li')return;const link=find(n,a=>a.tagName==='a');if(!link)return;const route=(attr(link,'href')||'').replace(ROOT_TOKEN,'');setAttr(n,'data-site-chrome-item',route);if(hasClass(n,'is-current'))params.currentRoute=route;setAttr(n,'class',(attr(n,'class')||'').split(/\s+/).filter(x=>x!=='is-current').join(' '));removeAttr(link,'aria-current');});
    }
    const template=serializeOuter(copy), key=componentSignature(copy), mainLinks=type==='header'?mainHeaderLinks(copy):[];
    const fallbackLinks=[];walk(copy,n=>{if(n.tagName==='a'&&fallbackLinks.length<3){let text='';walk(n,x=>{if(x.nodeName==='#text')text+=x.value;});if(text.trim())fallbackLinks.push(`<a href="${escape((attr(n,'href')||'').split(ROOT_TOKEN).join(root))}">${escape(text.trim().replace(/\s+/g,' '))}</a>`);}});
    const fallback=type==='header'?(headerPlaceholder||`<nav data-site-chrome-fallback>${fallbackLinks.join(' · ')}</nav>`):type==='footer'?`<nav data-site-chrome-fallback>${fallbackLinks.join(' · ')}</nav>`:'';
    records.push({ type,template,key,menuTemplate,menuRoute,params,mainLinks,location,tag:node.tagName,attributes:node.attrs||[],fallback });
  }
  return {...parsed,asset,records};
}
function payloadLookup(payload) { return new Map(Object.entries(payload.components).map(([id,template])=>[templateSignature(template),id])); }
export function finalizeSiteChrome(html, file, appDir) {
  const expanded=expandSiteChrome(html,file,appDir), page=collectSiteChrome(expanded,file);if(!page.asset)return expanded;
  const payload=readSiteChromePayloads(appDir,page.lang);if(!Object.keys(payload.components).length)return expanded;
  return emitSiteChrome(expanded,file,page,payload,payloadLookup(payload));
}
export function emitSiteChrome(html,file,page,payload,lookup) {
  const mounts=[],edits=[];
  for(const record of page.records){const component=lookup.get(record.key);if(!component)continue;const host='chrome-'+mounts.length;const mount={host,component,kind:record.type,...record.params};if(record.menuTemplate){const menu=Object.entries(payload.menus).find(([,template])=>templateSignature(template)===templateSignature(record.menuTemplate))?.[0];if(!menu)continue;mount.menu=menu;mount.menuRoute=record.menuRoute;}
    if(record.mainLinks.length){const baseline=mainHeaderLinks(find(parse(payload.components[component]),n=>hasClass(n,'topbar')));const overrides=record.mainLinks.flatMap(link=>{const base=baseline.find(item=>item.index===link.index),delta={index:link.index};for(const field of ['href','text'])if(link[field]!==undefined&&link[field]!==base?.[field])delta[field]=link[field];return Object.keys(delta).length>1?[delta]:[];});if(overrides.length)mount.mainLinks=overrides;}
    const attributes=record.attributes.map(item=>` ${item.name}="${escape(item.value)}"`).join('');
    mounts.push(mount);edits.push({start:record.location.startOffset,end:record.location.endOffset,text:`<${record.tag}${attributes} data-site-chrome-host="${host}">${record.fallback}</${record.tag}>`});}
  if(!mounts.length)return html;
  const route=file.replace(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//,'');
  const assets=[...new Set(mounts.flatMap(mount=>[payload.componentAssets[mount.component],mount.menu&&payload.menuAssets[mount.menu]].filter(Boolean)))].sort((a,b)=>{const rank=v=>v.includes('.shell.')?0:v.includes('.rail-')?1:2;return rank(a)-rank(b)||a.localeCompare(b);});
  const config={assets,root:page.root,lang:page.lang,route,mounts};
  const json=JSON.stringify(config).replace(/</g,'\\u003c');
  return withSiteRuntimeLoader(applyReplacements(html,edits).replace(/[\t \r\n]*<\/body\s*>/i,`\n<script id="mado-shared-ui-config" type="application/json">${json}</script>\n</body>`),page.root);
}
export function persistSourceParts(appDir,payload,config) {
  for(const mount of config.mounts)for(const [key,menu] of [[mount.component,false],[mount.menu,true]]){if(!key)continue;const asset=payload[menu?'menuAssets':'componentAssets'][key];const filename=partPath(appDir,asset,key,menu);fs.mkdirSync(path.dirname(filename),{recursive:true});if(!fs.existsSync(filename))fs.writeFileSync(filename,payload[menu?'menus':'components'][key],'utf8');}
}
