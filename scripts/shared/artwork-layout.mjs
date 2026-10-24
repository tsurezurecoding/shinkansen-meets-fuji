import {withPageAndroidAppInvite} from './android-app-invite.mjs';
import fs from 'node:fs';
import path from 'node:path';
export const artworkIds = ['somato','sumie','window-trip','window-film'];
export function artworkAsset(file) {
  return /^(window-trip|window-film)(?:[-.]|$)/.test(file) && !file.endsWith('.html') ? 'artworks/'+file.match(/^(window-trip|window-film)/)[0]+'/'+file : file;
}
export function artworkRoute(route) {
  return route.replace(/^(en\/)?(somato|sumie|window-trip|window-film|memory-express)\.html$/, '$1artworks/$2/index.html');
}
export function artworkRedirect(route) {
  const target=route.replace(/^(en\/)?(.*)$/, '$2');
  const relative=artworkRoute(target);
  const canonical='https://www.michikusa-travel.com/'+artworkRoute(route);
  return `<!doctype html>\n<html lang="${route.startsWith('en/')?'en':'ja'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${relative}"><title>作品へ移動 / Open artwork</title><script>location.replace(${JSON.stringify(relative)}+location.search+location.hash);</script></head><body><a href="${relative}">作品を見る / Open artwork</a></body></html>\n`;
}
export function relocateArtwork(html, route) {
  const english=route.startsWith('en/');
  // Retain the existing document-relative data/photo/navigation contracts via base.
  const base=html.match(/<base\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  const href=base?'../../'+base[1]:'../../';
  html=base?html.replace(base[0],`<base href="${href}">`):html.replace(/<head>/i,`<head><base href="${href}">`);
  for(const id of artworkIds) {
    html=html.replaceAll(`https://www.michikusa-travel.com/en/${id}.html`,`https://www.michikusa-travel.com/en/artworks/${id}/index.html`)
      .replaceAll(`https://www.michikusa-travel.com/${id}.html`,`https://www.michikusa-travel.com/artworks/${id}/index.html`);
    html=html.replace(new RegExp(`(href=["'])(\\.\\./)?(en/)?${id}\\.html`,'g'),`$1$2$3artworks/${id}/index.html`);
  }
  // A fragment must stay on this document even with a base URL.
  const self=(base&&english?'en/':'')+'artworks/'+route.split('/').pop().replace('.html','')+'/index.html';
  html=html.replace(/href="#/g,`href="${self}#`);
  html=html.replace(/((?:src|href)=["'])(\.\.\/)?((?:window-trip|window-film)[a-z.-]*\.(?:js|css))/g,(_,a,b='',f)=>a+b+artworkAsset(f));
  return withPageAndroidAppInvite(html,artworkRoute(route));
}
export function writeArtwork(root, route, html, check=false) {
  for(const [file,body] of [[artworkRoute(route),relocateArtwork(html,route)],[route,artworkRedirect(route)]]) {
    const target=path.join(root,file);
    if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')===body)continue;
    if(check)throw Error(file+' is stale');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);
  }
}
