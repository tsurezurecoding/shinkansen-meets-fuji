/* Shared Web/Android edition and route contract. No browser-language redirects. */
(function (root) {
  'use strict';
  var editions = {
    ja: { label: '日本語', prompt: '言語を選択', og: 'ja_JP', map: 'ja' },
    en: { label: 'English', prompt: 'Choose language', og: 'en_US', map: 'en' },
    'zh-Hant': { label: '繁體中文', prompt: '選擇語言', og: 'zh_TW', map: 'zh-TW' },
    fr: { label: 'Français', prompt: 'Choisir la langue', og: 'fr_FR', map: 'fr' },
    de: { label: 'Deutsch', prompt: 'Sprache wählen', og: 'de_DE', map: 'de' },
    es: { label: 'Español', prompt: 'Elegir idioma', og: 'es_ES', map: 'es' },
    'zh-Hans': { label: '简体中文', prompt: '选择语言', og: 'zh_CN', map: 'zh-CN' },
    ko: { label: '한국어', prompt: '언어 선택', og: 'ko_KR', map: 'ko' },
    ar: { label: 'العربية', prompt: 'اختر اللغة', og: 'ar_AR', map: 'ar' }
  };
  var languages = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko'];
  var translated = languages.filter(function (lang) { return lang !== 'ja' && lang !== 'en'; });
  var jaOnly = ["sudoori/index.html","sudoori/stories/tanna.html","sudoori/stories/nishio.html","sudoori/stories/sekigahara.html","sudoori/stories/shimamoto.html"];
  var utility = ['start.html', 'live/index.html', 'zukan.html', 'contact.html', 'mieru.html', 'index.html', 'journal.html'];
  var castleIds = ['edo-castle-fujimi-yagura', 'odawara-castle', 'kakegawa', 'kiyosu', 'gifu-castle', 'hikone-castle', 'sawayama-castle', 'kannonji-castle', 'himeji-castle', 'okayama-castle', 'fukuyama-castle', 'odawara', 'nagoya-station-skyline', 'toji', 'hamanako'];
  var castles = ['castles.html'].concat(castleIds.map(function (id) { return 'spots/' + id + '.html'; }));
  var extra = ['sparkling-dreams.html'];
  var routes = utility.concat(castles, extra, ['guide.html']);
  var episodes = { 'spots/fuji.html': ['de', 'fr'], 'spots/fujitec-big-wing.html': translated.slice(), 'spots/pocari-fukuroi.html': translated.slice() };
  var pattern = languages.filter(function (lang) { return lang !== 'ja'; }).concat(['ar']).join('|');
  function normalize(value) {
    var code = String(value || '').trim().replace(/_/g, '-').toLowerCase();
    if (/^zh(?:-|$)/.test(code)) return /(?:^|-)hant(?:-|$)|^zh-(?:tw|hk|mo)(?:-|$)/.test(code) ? 'zh-Hant' : 'zh-Hans';
    return languages.concat(['ar']).find(function (lang) { return code === lang.toLowerCase() || code.indexOf(lang.toLowerCase() + '-') === 0; }) || 'en';
  }
  function stripEdition(route) { return String(route).replace(new RegExp('^(?:' + pattern + ')/', 'i'), ''); }
  function canonicalRoute(route) { return stripEdition(route).split(/[?#]/)[0].replace(/^live\/$/, 'live/index.html') || 'index.html'; }
  function supported(route) { var key = canonicalRoute(route); return jaOnly.indexOf(key) >= 0 ? ['ja'] : key === 'guide.html' ? languages.concat(['ar']) : routes.indexOf(key) >= 0 ? languages.slice() : ['ja', 'en'].concat(episodes[key] || []); }
  function routeLanguage(path) {
    var match = String(path).match(new RegExp('/(' + pattern + ')(?:/|$)', 'i'));
    return match ? normalize(match[1]) : null;
  }
  function recognized(value) { return /^(?:ja|en|zh|fr|de|es|ko|ar)(?:-|_|$)/i.test(String(value || '')); }
  var api = { jaOnly: jaOnly, episodes: episodes, editions: editions, languages: languages, translated: translated, utility: utility, castleIds: castleIds, castles: castles, extra: extra, routes: routes, pattern: pattern, normalize: normalize, recognized: recognized, stripEdition: stripEdition, canonicalRoute: canonicalRoute, supported: supported, routeLanguage: routeLanguage };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MADO_LOCALES = api;
}(typeof window === 'object' ? window : null));
