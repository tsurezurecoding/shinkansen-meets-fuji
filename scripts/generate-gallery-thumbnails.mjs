import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { responsivePhotoPlan, photoPython } from './shared/responsive-photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const indexPath = path.join(root, 'images/thumbs/gallery/index.json');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const previous = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
const sources = new Map();
for (const file of fs.readdirSync(path.join(root, 'data/spot-pages')).filter(file => /\.(ja|en)\.js$/.test(file))) {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/spot-pages', file), 'utf8'), context);
  for (const photo of context.MADO_SPOT_PAGE_DATA?.gallery || []) {
    if (photo.smallThumb && photo.smallThumb !== photo.thumb) sources.set(photo.smallThumb, photo.src);
  }
}
const pending = [];
const next = {};
for (const [target, source] of [...sources].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
  const sourceSha256 = sha(path.join(root, source));
  const old = previous[target];
  if (old?.source === source && old.sourceSha256 === sourceSha256 && old.width === 264 && old.height === 198 && old.quality === 72 && fs.existsSync(path.join(root, target)) && sha(path.join(root, target)) === old.sha256) {
    next[target] = old;
  } else {
    pending.push({ source, target });
    next[target] = { source, sourceSha256, width: 264, height: 198, quality: 72 };
  }
}
if (check && (pending.length || Object.keys(previous).length !== sources.size)) throw Error(`Gallery thumbnails stale: ${pending.length} images; run npm run build:gallery-thumbs`);
if (pending.length) {
  const python = process.env.MADO_PYTHON || (process.platform === 'win32' && fs.existsSync(path.join(process.env.USERPROFILE || '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'))
    ? path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe')
    : process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, ['-c', `
import json, sys
from pathlib import Path
from PIL import Image, ImageOps
root = Path(sys.argv[1])
for item in json.load(sys.stdin):
    target = root / item['target']
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(root / item['source']) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image = ImageOps.fit(image, (264, 198), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=72, method=6)
`, root], { input: JSON.stringify(pending), encoding: 'utf8' });
  if (result.error || result.status !== 0) throw Error(`Gallery thumbnail generation needs Python with Pillow (MADO_PYTHON can select it): ${result.error || result.stderr}`);
  for (const { target } of pending) next[target].sha256 = sha(path.join(root, target));
}
const serialized = JSON.stringify(next, null, 2) + '\n';
if (!check && (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf8') !== serialized)) {
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, serialized);
}
console.log(`Gallery thumbnails: ${sources.size} assets, ${pending.length} generated (${check ? 'check' : 'build'})`);

const selectedSpots = process.argv.filter(arg => arg.startsWith('--spot=')).map(arg => arg.slice(7));
const displayPhotos = [];
for (const file of fs.readdirSync(path.join(root, 'data/spot-pages')).filter(file => /\.(ja|en)\.js$/.test(file))) {
  if (selectedSpots.length && !selectedSpots.some(id => file === id + '.ja.js' || file === id + '.en.js')) continue;
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/spot-pages', file), 'utf8'), context);
  const page = context.MADO_SPOT_PAGE_DATA;
  displayPhotos.push(...page.photos, ...page.gallery, ...page.inline);
}
const displayPlan = responsivePhotoPlan(root, displayPhotos);
const displayIndexPath = path.join(root, 'images/thumbs/display/index.json');
const oldDisplayDocument = fs.existsSync(displayIndexPath) ? JSON.parse(fs.readFileSync(displayIndexPath, 'utf8')) : {};
const oldDisplay = oldDisplayDocument.files || oldDisplayDocument;
const nextDisplay = selectedSpots.length ? { ...oldDisplay } : {};
const displayPending = [];
for (const item of displayPlan.derivatives) {
  const old = oldDisplay[item.target];
  if (old && ['source', 'sourceSha256', 'width', 'height', 'quality'].every(key => old[key] === item[key]) && fs.existsSync(path.join(root, item.target)) && sha(path.join(root, item.target)) === old.sha256) nextDisplay[item.target] = old;
  else { displayPending.push(item); nextDisplay[item.target] = item; }
}
const displaySources = selectedSpots.length ? { ...oldDisplayDocument.sources, ...displayPlan.metadata } : displayPlan.metadata;
const sorted = value => Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b, 'en')));
if (check && (displayPending.length || Object.keys(oldDisplay).length !== Object.keys(nextDisplay).length || JSON.stringify(sorted(displaySources)) !== JSON.stringify(sorted(oldDisplayDocument.sources || {})))) throw Error('Responsive photos stale: ' + displayPending.length + '; run npm run build:gallery-thumbs');
if (displayPending.length) {
  const result = spawnSync(photoPython(), ['-c', `
import json, sys
from pathlib import Path
from PIL import Image, ImageOps
root = Path(sys.argv[1])
groups = {}
for item in json.load(sys.stdin):
    groups.setdefault(item['source'], []).append(item)
for source, items in groups.items():
    with Image.open(root / source) as original:
        profile = original.info.get('icc_profile')
        image = ImageOps.exif_transpose(original).convert('RGB')
        for item in items:
            target = root / item['target']
            target.parent.mkdir(parents=True, exist_ok=True)
            resized = image.resize((item['width'], item['height']), Image.Resampling.LANCZOS)
            options = {'quality': item['quality'], 'method': 4}
            if profile: options['icc_profile'] = profile
            resized.save(target, 'WEBP', **options)
`, root], { input: JSON.stringify(displayPending), encoding: 'utf8' });
  if (result.error || result.status !== 0) throw Error('Responsive photo generation failed: ' + (result.error || result.stderr));
  for (const item of displayPending) nextDisplay[item.target].sha256 = sha(path.join(root, item.target));
}
const displaySerialized = JSON.stringify({ version: 1, sources: sorted(displaySources), files: sorted(nextDisplay) }, null, 2) + '\n';
if (!check && (!fs.existsSync(displayIndexPath) || fs.readFileSync(displayIndexPath, 'utf8') !== displaySerialized)) {
  if (!selectedSpots.length) for (const file of Object.keys(oldDisplay)) {
    if (nextDisplay[file]) continue;
    if (!file.startsWith('images/thumbs/display/') || !path.resolve(root, file).startsWith(path.join(root, 'images/thumbs/display') + path.sep)) throw Error('Unsafe obsolete photo path');
    if (fs.existsSync(path.join(root, file))) fs.unlinkSync(path.join(root, file));
  }
  fs.mkdirSync(path.dirname(displayIndexPath), { recursive: true });
  fs.writeFileSync(displayIndexPath, displaySerialized);
}
console.log(`Responsive photos: ${displayPlan.derivatives.length} assets, ${displayPending.length} generated${selectedSpots.length ? ' (selected spots only)' : ''}`);
