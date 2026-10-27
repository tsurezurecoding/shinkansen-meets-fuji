import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const PHOTO_QUALITY = 86;
export function photoPython() {
  const bundled = path.join(process.env.USERPROFILE || '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
  return process.env.MADO_PYTHON || (process.platform === 'win32' && fs.existsSync(bundled) ? bundled : 'python3');
}

// A page carries only its own image candidates. The shared catalog stays small.
export function responsivePhotoPlan(root, photos) {
  const pairs = new Map();
  for (const photo of photos) {
    if (!photo?.src || !/\.(?:jpe?g|png|webp)$/i.test(photo.src)) continue;
    for (const file of [photo.src, photo.thumb]) {
      if (!/^images\//.test(file || '') || file.includes('..') || file.includes('\\') || /[?#]/.test(file)) throw Error('Unsafe photo path: ' + file);
    }
    pairs.set(photo.src, photo.thumb);
  }
  if (!pairs.size) return { sources: {}, derivatives: [], metadata: {} };
  const indexPath = path.join(root, 'images/thumbs/display/index.json');
  const cached = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')).sources || {} : {};
  const hashes = new Map(), dimensions = {}, needed = new Set();
  const fingerprint = file => {
    if (!hashes.has(file)) hashes.set(file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'));
    return hashes.get(file);
  };
  for (const [source, thumb] of pairs) {
    const old = cached[source];
    if (old && ['width', 'height', 'thumbWidth', 'thumbHeight'].every(key => Number.isInteger(old[key]) && old[key] > 0) && old.sha256 === fingerprint(source) && old.thumb === thumb && old.thumbSha256 === fingerprint(thumb)) {
      dimensions[source] = [old.width, old.height];
      dimensions[thumb] = [old.thumbWidth, old.thumbHeight];
    } else { needed.add(source); needed.add(thumb); }
  }
  if (needed.size) {
    const result = spawnSync(photoPython(), ['-c', `
import json, sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
result = {}
for name in json.load(sys.stdin):
    with Image.open(root / name) as image:
        width, height = image.size
        if image.getexif().get(274) in (5, 6, 7, 8):
            width, height = height, width
        result[name] = [width, height]
print(json.dumps(result))
`, root], { input: JSON.stringify([...needed]), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw Error('New photo dimensions require Pillow: ' + (result.error || result.stderr));
    Object.assign(dimensions, JSON.parse(result.stdout));
  }
  const sources = {}, derivatives = [], metadata = {};
  for (const [source, thumb] of pairs) {
    const [width, height] = dimensions[source], [thumbWidth, thumbHeight] = dimensions[thumb];
    const sourceSha256 = fingerprint(source);
    metadata[source] = { sha256: sourceSha256, width, height, thumb, thumbSha256: fingerprint(thumb), thumbWidth, thumbHeight };
    const sameFrame = Math.abs(width / height - thumbWidth / thumbHeight) < 0.005;
    const candidates = new Map();
    if (sameFrame && thumbWidth <= width && thumbWidth <= 1920) candidates.set(thumbWidth, thumb);
    for (const requested of [640, 960, 1920]) {
      const targetWidth = Math.min(width, requested);
      if (candidates.has(targetWidth)) continue;
      // Already small originals preserve maximum detail; re-encoding their
      // native size can be larger without improving either quality or loading.
      if (targetWidth === width && width < 1920) { candidates.set(width, source); continue; }
      const target = 'images/thumbs/display/' + source.slice('images/'.length).replace(/\.[^.]+$/, '') + '-' + sourceSha256.slice(0, 8) + '-' + targetWidth + '.webp';
      candidates.set(targetWidth, target);
      derivatives.push({ source, sourceSha256, target, width: targetWidth, height: Math.max(1, Math.round(height * targetWidth / width)), quality: PHOTO_QUALITY });
    }
    sources[source] = [...candidates].sort((a, b) => a[0] - b[0]).map(([candidateWidth, file]) => [file, candidateWidth, file === thumb ? thumbHeight : Math.max(1, Math.round(height * candidateWidth / width))]);
  }
  return { sources, derivatives, metadata };
}
