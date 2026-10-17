import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {withPageAndroidAppInvite,invitePageConfig} from './shared/android-app-invite.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dirs=['','spots','live','sudoori',...['en','fr','de','es','ko','zh-Hant','zh-Hans'].flatMap(l=>[l,l+'/spots',l+'/live'])];
let count=0,changed=0;
for(const dir of dirs){
 const folder=path.join(root,dir);if(!fs.existsSync(folder))continue;
 for(const name of fs.readdirSync(folder)){
  if(!name.endsWith('.html'))continue;
  const file=dir?dir+'/'+name:name;if(!invitePageConfig(file))continue;
  const target=path.join(root,file),old=fs.readFileSync(target,'utf8');
  const html=withPageAndroidAppInvite(old,file);count++;
  if(html!==old){if(process.argv.includes('--check'))throw Error('Invitation stale: '+file);fs.writeFileSync(target,html);changed++;}
 }
}
console.log(`Android invitation: ${count} pages, ${changed} changed`);
