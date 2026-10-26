import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { INVITE_COPY, inviteCopy } from './shared/android-app-invite-copy.mjs';
import { DISMISS_DAYS, UNKNOWN_STATUS_POLICY } from './shared/android-app-invite-policy.mjs';

export const ANDROID_INVITE_ASSET = 'android-app-invite.js';
export const ANDROID_INVITE_BYTE_BUDGET = 32 * 1024;

// Pure source -> browser asset projection. Importing this module performs no I/O.
export function createAndroidAppInviteAsset({ runtime, css }) {
  if (typeof runtime !== 'string' || runtime.split('__INVITE_CONFIG__').length !== 2 ||
      typeof css !== 'string' || !css.trim()) throw new Error('Invitation runtime/CSS source is invalid');
  runtime = runtime.replace(/\r\n/g, '\n');
  css = css.replace(/\r\n/g, '\n');
  const copies = Object.fromEntries(Object.keys(INVITE_COPY).map(language => {
    const general = inviteCopy(language, true);
    return [language, { ...inviteCopy(language), generalTitle: general.title, generalBody: general.body }];
  }));
  const output = `/* Generated from scripts/shared/android-app-invite-* sources. Do not edit. */
(function () {
  'use strict';
  const copies = ${JSON.stringify(copies)};
  const css = ${JSON.stringify(css)};
  function readInviteConfig() {
    const element = document.getElementById('mado-android-invite-config');
    if (!element || element.getAttribute('type') !== 'application/json') return null;
    let page;
    try { page = JSON.parse(element.textContent); } catch (error) { return null; }
    if (!page || typeof page !== 'object' || Array.isArray(page) || Object.keys(page).length !== 4 ||
        typeof page.language !== 'string' || !Object.prototype.hasOwnProperty.call(copies, page.language) ||
        !['landing', 'fuji_guide', 'train_search', 'live', 'gallery', 'collection', 'spot', 'feature'].includes(page.pageContext) ||
        typeof page.assetPrefix !== 'string' || !/^(?:\\.\\.\\/)*$/.test(page.assetPrefix) ||
        typeof page.general !== 'boolean') return null;
    const localized = copies[page.language];
    return { language: page.language, pageContext: page.pageContext, assetPrefix: page.assetPrefix,
      dismissDays: ${DISMISS_DAYS}, unknownPolicy: ${JSON.stringify(UNKNOWN_STATUS_POLICY)}, css,
      copy: { ...localized, title: page.general ? localized.generalTitle : localized.title,
        body: page.general ? localized.generalBody : localized.body } };
  }
${runtime.replace('__INVITE_CONFIG__', 'readInviteConfig()').trimEnd()}
})();
`;
  if (Buffer.byteLength(output, 'utf8') > ANDROID_INVITE_BYTE_BUDGET) throw new Error('Invitation shared asset exceeds its byte budget');
  return output;
}

export async function generateAndroidAppInviteAssets({
  appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  check = false,
} = {}) {
  const sourceDir = path.join(appDir, 'scripts/shared');
  const [runtime, css] = await Promise.all([
    readFile(path.join(sourceDir, 'android-app-invite-runtime.js'), 'utf8'),
    readFile(path.join(sourceDir, 'android-app-invite.css'), 'utf8'),
  ]);
  const output = createAndroidAppInviteAsset({ runtime, css });
  const outputPath = path.join(appDir, ANDROID_INVITE_ASSET);
  const current = await readFile(outputPath, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  const changed = current !== output;
  if (changed && !check) await writeFile(outputPath, output, 'utf8');
  return { changed, outputPath, bytes: Buffer.byteLength(output, 'utf8') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const result = await generateAndroidAppInviteAssets({ check });
  console.log(`Android invitation asset: ${result.changed ? (check ? 'stale' : 'written') : 'unchanged'} (${result.bytes} bytes).`);
  if (check && result.changed) process.exitCode = 1;
}
