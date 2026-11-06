import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationOptions, selectNavigationPages } from './validate-site-navigation.mjs';

const editions = ['ja', 'en', 'zh-Hant', 'zh-Hans', 'fr', 'de', 'es', 'it', 'ko', 'th'];
const filesFor = route => editions.map(lang => lang === 'ja' ? route : `${lang}/${route}`);

test('a route selects every registered edition and no unrelated page', () => {
  const story = filesFor('stories/godzilla.html');
  const input = [...story, ...filesFor('spots/maruko-bridge.html'), 'privacy.html'];
  assert.deepEqual(new Set(selectNavigationPages(input, ['stories/godzilla.html'])), new Set(story));
  assert.equal(selectNavigationPages(input, []).length, input.length);
  assert.equal(selectNavigationPages(input, ['stories/godzilla.html', 'spots/maruko-bridge.html']).length, 20);
});

test('a missing edition or an unknown route cannot silently pass', () => {
  assert.throws(() => selectNavigationPages(filesFor('stories/godzilla.html').filter(f => !f.startsWith('th/')), ['stories/godzilla.html']), /th\/stories\/godzilla/);
  assert.throws(() => selectNavigationPages([], ['stories/typo.html']), /missing registered editions/);
});

test('scope arguments are explicit and cannot silently widen into the language suite', () => {
  assert.deepEqual(navigationOptions(['--route', 'stories/godzilla.html', '--route', 'stories/godzilla.html']).routes, ['stories/godzilla.html']);
  for (const args of [['--route'], ['--route', '../private.html'], ['--route', 'fr/stories/godzilla.html'], ['--routes'], ['--route', 'stories/godzilla.html', '--with-language-checks'], ['--route', 'stories/godzilla.html', '--language-only']])
    assert.throws(() => navigationOptions(args));
  assert.equal(navigationOptions(['--language-only']).languageOnly, true);
  assert.equal(navigationOptions(['--with-language-checks']).languageChecks, true);
});
