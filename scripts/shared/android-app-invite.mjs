import fs from 'node:fs';
import {DISMISS_DAYS,UNKNOWN_STATUS_POLICY} from './android-app-invite-policy.mjs';
const runtime=fs.readFileSync(new URL('./android-app-invite-runtime.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./android-app-invite.css',import.meta.url),'utf8');
export function inviteRuntime(config){return runtime.replace('__INVITE_CONFIG__',JSON.stringify({dismissDays:DISMISS_DAYS,unknownPolicy:UNKNOWN_STATUS_POLICY,...config}));}
export function withAndroidAppInvite(html,language,pageContext){
 const block='<!-- ANDROID_APP_INVITE_START -->\n<style>'+css+'</style>\n<script>'+inviteRuntime({language,pageContext,assetPrefix:language==='en'&&!html.includes('<base ')?'../':''})+'</script>\n<!-- ANDROID_APP_INVITE_END -->';
 const pattern=/<!-- ANDROID_APP_INVITE_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_END -->/;
 // Runtime requires body; insert its script before </body>, CSS is scoped to the invitation.
 return pattern.test(html)?html.replace(pattern,()=>block):html.replace('</body>',block+'\n</body>');
}
