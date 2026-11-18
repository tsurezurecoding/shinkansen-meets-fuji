import fs from 'node:fs';
import path from 'node:path';
import { isUtf8 } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.michikusa-travel.com';
const localScript = /^(?:\/|(?:\.\.?\/)*)(?:locales|language-router)\.js\?v=[0-9a-f]{8}$/;
const html = file => file.endsWith('.html');

// Read actual attribute locations; serializing a DOM would erase whitespace, entity and quoting changes.
export function onlyLocaleScriptVersions(file, before, after, parse) {
  if (before.length !== after.length || before === after) return false;
  const scrub = text => text.replace(/((?:locales|language-router)\.js\?v=)[a-f0-9]{8}/g, '$1#');
  if (scrub(before) !== scrub(after)) return false;
  const document = parse(before, { sourceCodeLocationInfo: true });
  const scripts = [];
  let baseHref;
  function visit(node) {
    if (node.namespaceURI === 'http://www.w3.org/1999/xhtml') {
      if (node.tagName === 'base' && baseHref === undefined) baseHref = node.attrs.find(a => a.name === 'href')?.value;
      if (node.tagName === 'script') scripts.push(node);
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(document);
  let base;
  try { base = new URL(baseHref ?? '', new URL('/' + file.split('/').map(encodeURIComponent).join('/'), origin)); }
  catch { return false; }
  const offsets = [];
  for (const script of scripts) {
    const src = script.attrs.find(attr => attr.name === 'src')?.value;
    if (!src || !localScript.test(src)) continue;
    let url;
    try { url = new URL(src, base); } catch { continue; }
    if (url.origin !== origin || !/^\/(?:locales|language-router)\.js$/.test(url.pathname)) continue;
    const loc = script.sourceCodeLocation.attrs.src;
    const raw = before.slice(loc.startOffset, loc.endOffset);
    const literal = raw.match(/^src\s*=\s*(["']?)([^"'\s>]+)\1$/i);
    if (literal?.[2] === src) offsets.push(loc.endOffset - literal[1].length - 8);
  }
  let cursor = 0;
  for (const start of offsets.sort((a, b) => a - b)) {
    if (before.slice(cursor, start) !== after.slice(cursor, start) || !/^[a-f0-9]{8}$/.test(after.slice(start, start + 8))) return false;
    cursor = start + 8;
  }
  return before.slice(cursor) === after.slice(cursor);
}

// Git reports modes and object IDs in one diff. Request blobs in batches capped by their actual byte sizes.
function* blobPairs(cwd, files) {
  const ids = files.flatMap(f => [f.oldId, f.newId]);
  if (!ids.length) return;
  const input = list => list.join('\n') + '\n';
  const sizes = execFileSync('git', ['cat-file', '--batch-check=%(objectsize)'], {
    cwd, input: input(ids), encoding: 'utf8', maxBuffer: 20 * ids.length + 1024,
  }).trimEnd().split('\n').map(Number);
  for (let first = 0; first < files.length;) {
    let end = first, bytes = 0;
    do {
      bytes += sizes[2 * end] + sizes[2 * end + 1] + 160; // two headers and delimiters
      end++;
    } while (end < files.length && bytes < 8 * 1024 * 1024);
    const batch = execFileSync('git', ['cat-file', '--batch'], {
      cwd, input: input(ids.slice(2 * first, 2 * end)), maxBuffer: bytes,
    });
    let pos = 0;
    function blob(i) {
      const headerEnd = batch.indexOf(10, pos);
      if (batch.toString('ascii', pos, headerEnd) !== ids[i] + ' blob ' + sizes[i]) throw new Error('Unexpected Git blob header');
      const start = headerEnd + 1;
      pos = start + sizes[i] + 1;
      return batch.subarray(start, pos - 1);
    }
    for (let i = first; i < end; i++) yield [files[i].path, blob(2 * i), blob(2 * i + 1)];
    first = end;
  }
}

export async function summarizeHtmlChanges(base, head, cwd = repo) {
  const fields = execFileSync('git', ['diff', '--raw', '--no-abbrev', '-z', '--find-renames', base, head, '--'], {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).split('\0');
  const summary = { added: [], deleted: [], renamed: [], changed: [], versions: [] };
  const candidates = [];
  for (let i = 0; fields[i];) {
    const [oldMode, newMode, oldId, newId, status] = fields[i++].slice(1).split(' ');
    const file = fields[i++];
    if (status.startsWith('R')) {
      const target = fields[i++];
      if (html(file) || html(target)) summary.renamed.push(file + ' → ' + target);
    } else if (html(file)) {
      if (status === 'A') summary.added.push(file);
      else if (status === 'D') summary.deleted.push(file);
      else if (status === 'M' && oldMode === newMode && oldMode.startsWith('100') && oldId !== newId) candidates.push({ path: file, oldId, newId });
      else summary.changed.push(file);
    }
  }
  if (candidates.length) {
    const { parse } = await import('parse5');
    for (const [file, before, after] of blobPairs(cwd, candidates)) {
      const versions = before.length === after.length && isUtf8(before) && isUtf8(after)
        && onlyLocaleScriptVersions(file, before.toString('utf8'), after.toString('utf8'), parse);
      (versions ? summary.versions : summary.changed).push(file);
    }
  }
  return summary;
}

export function formatHtmlSummary(summary) {
  const groups = [['added', '追加'], ['deleted', '削除'], ['renamed', '移動（Git判定）'], ['changed', '本文・構造などの変更'], ['versions', '言語スクリプトの版番号のみ']];
  const total = groups.reduce((count, [key]) => count + summary[key].length, 0);
  const lines = ['## HTMLの変更（' + total + '件）', ''];
  if (!total) return lines.join('\n') + '\n';
  lines.push('| 内訳 | 件数 |', '| --- | ---: |');
  for (const [key, label] of groups) lines.push('| ' + label + ' | ' + summary[key].length + ' |');
  const paths = groups.filter(([key]) => key !== 'versions').flatMap(([key, label]) => summary[key].map(file => [label, file]));
  if (paths.length) {
    lines.push('', '<details><summary>追加・削除・移動・本文などの対象ページ（' + paths.length + '件）</summary>', '');
    for (const [label, file] of paths.slice(0, 100)) {
      const safe = file.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '\\n').replaceAll('\r', '\\r');
      lines.push('- ' + label + ' <code>' + safe + '</code>');
    }
    if (paths.length > 100) lines.push('', '残り' + (paths.length - 100) + '件はPRの Files changed に表示されます。');
    lines.push('', '</details>');
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { base, head } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const markdown = formatHtmlSummary(await summarizeHtmlChanges(base, head));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  else process.stdout.write(markdown);
}
