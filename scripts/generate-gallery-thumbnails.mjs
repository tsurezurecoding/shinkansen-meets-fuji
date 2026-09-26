import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
