import fs from 'node:fs';
import path from 'node:path';
import { collectSparklingEnglish, SPARKLING_LOCALES } from './shared/sparkling-localization.mjs';
const root=process.cwd(),keys=collectSparklingEnglish(root);
for(const lang of SPARKLING_LOCALES){const utility=JSON.parse(fs.readFileSync(path.join(root,'scripts/locales/utility-'+lang+'.json'),'utf8'));const target=path.join(root,'scripts/locales/sparkling-'+lang+'.json');const old=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{};fs.writeFileSync(target,JSON.stringify(Object.fromEntries(keys.map(key=>[key,old[key]||utility[key]||''])),null,2)+'\n');}
console.log(keys.length+' Disney keys');
