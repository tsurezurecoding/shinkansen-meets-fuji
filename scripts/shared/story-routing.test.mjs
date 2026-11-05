import test from 'node:test';
import assert from 'node:assert/strict';
import {languages, routes, supported} from './locales.mjs';
import {STORY_ROUTES, STORY_SLUGS, localizedStoryRoute} from './story-window.mjs';

test('story inventory is derived from the shared locale route registry', () => {
  assert.deepEqual(STORY_ROUTES, routes.filter(route => route.startsWith('stories/')));
  assert.deepEqual(STORY_ROUTES, ['stories/index.html', ...STORY_SLUGS.map(slug => `stories/${slug}.html`)]);
  assert.deepEqual(supported('stories/godzilla.html'), languages);
});

test('localized story route resolves Japanese, English and translated editions', () => {
  assert.equal(localizedStoryRoute('stories/godzilla.html', 'ja'), 'stories/godzilla.html');
  assert.equal(localizedStoryRoute('stories/godzilla.html', 'en'), 'en/stories/godzilla.html');
  assert.equal(localizedStoryRoute('stories/godzilla.html', 'fr'), 'fr/stories/godzilla.html');
});

test('unsupported edition falls back to English and keeps query and fragment', () => {
  assert.equal(localizedStoryRoute('stories/godzilla.html?from=bridge#chapter-2', 'ar'), 'en/stories/godzilla.html?from=bridge#chapter-2');
});

test('Japanese-only route falls back to its first supported edition', () => {
  assert.deepEqual(supported('sudoori/stories/tanna.html'), ['ja']);
  assert.equal(localizedStoryRoute('sudoori/stories/tanna.html', 'fr'), 'sudoori/stories/tanna.html');
});

test('edition-prefixed routes canonicalize before resolving', () => {
  assert.equal(localizedStoryRoute('fr/stories/godzilla.html?x=1#top', 'fr'), 'fr/stories/godzilla.html?x=1#top');
});
