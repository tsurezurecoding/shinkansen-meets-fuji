import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'parse5';
import { onlyLocaleScriptVersions, summarizeHtmlChanges, formatHtmlSummary } from './release-html-summary.mjs';

const tag = '<script defer src="../locales.js?v=1234abcd"></script>';
const router = "<script src='../language-router.js?v=1234abcd'></script>";
const update = text => text.replaceAll('1234abcd', 'deadbeef');
const versions = (before, after = update(before), file = 'en/guide.html') => onlyLocaleScriptVersions(file, before, after, parse);

test('only eight hash digits in actual site-root script sources can be grouped', () => {
  assert(versions(tag + router + '<p>車窓</p>'));
  assert(versions('<base href="../">' + tag.replace('../', './')));
  assert(versions(tag.replace('../', '/')));
  for (const before of [
    '<!--' + tag + '-->', '<textarea>' + tag + '</textarea>', '<template>' + tag + '</template>',
    '<script>const example = ' + JSON.stringify(tag.replace('</script>', '')) + ';</script>',
    '<p>../locales.js?v=1234abcd</p>', tag.replace(' src=', ' data-src='), tag.replace('src=', 'title='),
    tag.replace('../', '//outside.example/'), tag.replace('../', 'https://outside.example/'),
    '<base href="https://outside.example/en/">' + tag, tag.replace('../', './'),
    tag.replace('locales.js', 'articles.js'), tag.replace('1234abcd', '1234abcd9'), tag.replace('1234abcd', '1234abcd&b=1'),
    tag + '<p>本文にも ../locales.js?v=1234abcd が入る</p>',
    tag + '<script>const url = "../language-router.js?v=1234abcd";</script>',
  ]) assert.equal(versions(before), false, before);
  for (const after of [tag, update(tag).replace('defer', 'async'), update(tag) + '\n',
    update(tag).replace('deadbeef', ''), update(tag).replace('locales.js', 'language-router.js')])
    assert.equal(versions(tag, after), false, after);
});

test('a real Git diff lists additions, deletions and renames separately from the two modification groups', async t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'mado-html-review-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8' }).trim();
  const write = (file, content) => fs.writeFileSync(path.join(cwd, file), content);
  git('init', '--quiet');
  const files = { 'edit.html': '<p>old</p>', 'nested.html': tag.replace('../', ''), 'old.html': 'rename me',
    'remove.html': 'delete this', 'text.txt': 'not a page', 'invalid.html': Buffer.from([0xff, 0xfe]) };
  for (const [file, content] of Object.entries(files)) write(file, content);
  git('add', '--', ...Object.keys(files));
  const before = git('write-tree');
  git('mv', '--', 'old.html', 'moved.html');
  fs.unlinkSync(path.join(cwd, 'remove.html'));
  git('add', '-u', '--', 'remove.html');
  write('new.html', '<p>added</p>'); write('edit.html', '<p>new</p>');
  write('nested.html', update(files['nested.html'])); write('text.txt', 'still not a page');
  write('invalid.html', Buffer.from([0xff, 0xff]));
  git('add', '--', 'new.html', 'edit.html', 'nested.html', 'text.txt', 'invalid.html');
  const summary = await summarizeHtmlChanges(before, git('write-tree'), cwd);
  assert.deepEqual(summary, { added: ['new.html'], deleted: ['remove.html'], renamed: ['old.html → moved.html'],
    changed: ['edit.html', 'invalid.html'], versions: ['nested.html'] });
  const markdown = formatHtmlSummary(summary);
  assert.match(markdown, /HTMLの変更（6件）/);
  assert.match(markdown, /言語スクリプトの版番号のみ \| 1/);
  assert(markdown.includes('<code>edit.html</code>'));
  assert(!markdown.includes('nested.html'));
  assert.match(formatHtmlSummary(await summarizeHtmlChanges(before, before, cwd)), /HTMLの変更（0件）/);
});

test('the review summary escapes filenames and bounds the expanded path list', () => {
  const paths = ['<img>&.html', ...Array.from({ length: 106 }, (_, i) => i + '.html')];
  const summary = formatHtmlSummary({ added: paths, deleted: [], renamed: [], changed: [], versions: [] });
  assert.match(summary, /&lt;img&gt;&amp;\.html/);
  assert.match(summary, /残り7件/);
  assert.equal(summary.split('<code>').length - 1, 100);
});
