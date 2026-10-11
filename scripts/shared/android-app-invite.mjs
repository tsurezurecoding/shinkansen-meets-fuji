import fs from 'node:fs';
import {DISMISS_DAYS,UNKNOWN_STATUS_POLICY} from './android-app-invite-policy.mjs';
const runtime=fs.readFileSync(new URL('./android-app-invite-runtime.js',import.meta.url),'utf8');
const reset=fs.readFileSync(new URL('./android-app-invite-reset.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./android-app-invite.css',import.meta.url),'utf8');
export function inviteRuntime(config){return runtime.replace('__INVITE_CONFIG__',JSON.stringify({dismissDays:DISMISS_DAYS,unknownPolicy:UNKNOWN_STATUS_POLICY,...config}));}
export function withAndroidAppInvite(html,language,pageContext){
 const resetBlock='<!-- ANDROID_APP_INVITE_RESET_START -->\n<script>'+reset+'</script>\n<!-- ANDROID_APP_INVITE_RESET_END -->\n';
 const resetPattern=/<!-- ANDROID_APP_INVITE_RESET_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_RESET_END -->\n/;
 const analyticsStart=/<script>\s*\(function \(\) \{\s*if \(window\.MADO_EMBEDDED_WEB\) return;/;
 if(resetPattern.test(html))html=html.replace(resetPattern,()=>resetBlock);
 else if(analyticsStart.test(html))html=html.replace(analyticsStart,match=>resetBlock+match);
 else throw Error('Invitation reset requires the existing head analytics initializer');
 html=html.replace('window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;', 'window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut || window.MADO_ANDROID_INVITE_TEST_GA_DISABLED === true;');
 const block='<!-- ANDROID_APP_INVITE_START -->\n<style>'+css+'</style>\n<script>'+inviteRuntime({language,pageContext,assetPrefix:language==='en'&&!html.includes('<base ')?'../':''})+'</script>\n<!-- ANDROID_APP_INVITE_END -->';
 const pattern=/<!-- ANDROID_APP_INVITE_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_END -->/;
 // Runtime requires body; insert its script before </body>, CSS is scoped to the invitation.
 return pattern.test(html)?html.replace(pattern,()=>block):html.replace('</body>',block+'\n</body>');
}
