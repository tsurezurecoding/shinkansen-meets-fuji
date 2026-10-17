import fs from 'node:fs';
import {DISMISS_DAYS,UNKNOWN_STATUS_POLICY} from './android-app-invite-policy.mjs';
import {inviteCopy} from './android-app-invite-copy.mjs';
const runtime=fs.readFileSync(new URL('./android-app-invite-runtime.js',import.meta.url),'utf8');
const reset=fs.readFileSync(new URL('./android-app-invite-reset.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./android-app-invite.css',import.meta.url),'utf8');
export function inviteRuntime(config){return runtime.replace('__INVITE_CONFIG__',JSON.stringify({dismissDays:DISMISS_DAYS,unknownPolicy:UNKNOWN_STATUS_POLICY,...config}));}
export function withAndroidAppInvite(html,language,pageContext,options={}){
 const resetBlock='<!-- ANDROID_APP_INVITE_RESET_START -->\n<script>'+reset+'</script>\n<!-- ANDROID_APP_INVITE_RESET_END -->\n';
 const resetPattern=/<!-- ANDROID_APP_INVITE_RESET_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_RESET_END -->\n/;
 const analyticsStart=/<script>\s*\(function \(\) \{\s*(?:if \(window\.MADO_EMBEDDED_WEB\) return;\s*)?var (?:measurementId|id) = "G-C2ESB694FV";/;
 if(resetPattern.test(html))html=html.replace(resetPattern,()=>resetBlock);
 else if(analyticsStart.test(html))html=html.replace(analyticsStart,match=>resetBlock+match);
 else throw Error('Invitation reset requires the existing head analytics initializer');
 html=html.replace('window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;', 'window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut || window.MADO_ANDROID_INVITE_TEST_GA_DISABLED === true;');
 html=html.replace('window.MADO_ANALYTICS_DISABLED = local || optedOut;', 'window.MADO_ANALYTICS_DISABLED = local || optedOut || window.MADO_ANDROID_INVITE_TEST_GA_DISABLED === true;');
 const assetPrefix=options.assetPrefix ?? (language==='en'&&!html.includes('<base ')?'../':'');
 if(!html.includes('rel="manifest"'))html=html.replace('</head>','  <link rel="manifest" href="'+assetPrefix+'manifest.json">\n</head>');
 const block='<!-- ANDROID_APP_INVITE_START -->\n<style>'+css+'</style>\n<script>'+inviteRuntime({language,pageContext,assetPrefix,copy:inviteCopy(language,options.general)})+'</script>\n<!-- ANDROID_APP_INVITE_END -->';
 const pattern=/<!-- ANDROID_APP_INVITE_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_END -->/;
 // Runtime requires body; insert its script before </body>, CSS is scoped to the invitation.
 return pattern.test(html)?html.replace(pattern,()=>block):html.replace('</body>',block+'\n</body>');
}

const FEATURES=new Set(['727-collection.html','zukan.html','mieru.html','castles.html','ferris-wheels.html','arenani.html','hanabi.html','yakei.html','window-moments.html','sparkling-dreams.html','countryside.html','everyday-japan.html','foods.html','travel-foods.html','beer-on-shinkansen.html','drinks.html','window-trip.html','window-film.html','window-artworks.html','reflections.html','somato.html','sumato.html','sumie.html','tokyo-kyoto-stations.html','sudoori.html','sudoori/index.html']);
export function invitePageConfig(file){
 const bits=file.replaceAll('\\','/').split('/');
 const language=bits.length>1&&['en','fr','de','es','ko','zh-Hant','zh-Hans'].includes(bits[0])?bits.shift():'ja';
 const route=bits.join('/');
 if(!['index.html','guide.html','start.html','live/index.html'].includes(route)&&!FEATURES.has(route)&&!/^spots\/[a-z0-9-]+\.html$/.test(route))return null;
 const pageContext=route==='index.html'?'landing':route==='guide.html'?'fuji_guide':route==='start.html'?'train_search':route==='live/index.html'?'live':route==='zukan.html'?'gallery':route==='727-collection.html'?'collection':route.startsWith('spots/')?'spot':'feature';
 const general=/spots\/(?:himeji-castle|fukuyama-castle|okayama-castle|akashi-castle|hiroshima-castle|iwakuni-castle)\.html$/.test(route);
 return {language,pageContext,general};
}
export function withPageAndroidAppInvite(html,file){
 const cfg=invitePageConfig(file);
 if(!cfg||!/var (?:measurementId|id) = "G-C2ESB694FV"/.test(html))return html;
 const assetPrefix=/<base\b/i.test(html)?'':'../'.repeat(file.split('/').length-1);
 return withAndroidAppInvite(html,cfg.language,cfg.pageContext,{assetPrefix,general:cfg.general});
}
