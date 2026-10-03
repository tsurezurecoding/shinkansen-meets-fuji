import fs from 'node:fs';
import { sanyoGallery } from './shared/sanyo-discovery.mjs';
const file=new URL('../zukan.html',import.meta.url);
const source=fs.readFileSync(file,'utf8').replaceAll('\r','');
const section=/<!-- SANYO-GALLERY:START -->[\s\S]*?<!-- SANYO-GALLERY:END -->/;
const output=section.test(source)?source.replace(section,sanyoGallery('ja')):source.replace('  </main>',sanyoGallery('ja')+'\n  </main>');
if(process.argv.includes('--check')){if(output!==source)throw Error('Japanese Sanyo gallery is out of date');}else if(output!==source)fs.writeFileSync(file,output);
