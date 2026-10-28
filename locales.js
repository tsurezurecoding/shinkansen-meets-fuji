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
    it: { label: 'Italiano', prompt: 'Scegli la lingua', og: 'it_IT', map: 'it' },
    th: { label: 'ไทย', prompt: 'เลือกภาษา', og: 'th_TH', map: 'th' },
    ar: { label: 'العربية', prompt: 'اختر اللغة', og: 'ar_AR', map: 'ar' }
  };
  var languages = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko'];
  var coreLanguages = languages.slice();
  var starter = ['it', 'th'];
  var starterRoutes = ['index.html', 'guide.html', 'start.html', 'spots/fuji.html', 'zukan.html', 'live/index.html'];
  languages = languages.concat(starter);
  var translated = coreLanguages.filter(function (lang) { return lang !== 'ja' && lang !== 'en'; });
  var jaOnly = ["sudoori/index.html","sudoori/stories/tanna.html","sudoori/stories/nishio.html","sudoori/stories/sekigahara.html","sudoori/stories/shimamoto.html","sudoori/stories/aisho.html","sudoori/stories/koura.html"];
  var utility = ['start.html', 'live/index.html', 'zukan.html', 'contact.html', 'mieru.html', 'index.html', 'journal.html'];
  var castleIds = ['edo-castle-fujimi-yagura', 'odawara-castle', 'kakegawa', 'kiyosu', 'gifu-castle', 'hikone-castle', 'sawayama-castle', 'kannonji-castle', 'himeji-castle', 'okayama-castle', 'fukuyama-castle', 'odawara', 'nagoya-station-skyline', 'toji', 'hamanako'];
  var castles = ['castles.html'].concat(castleIds.map(function (id) { return 'spots/' + id + '.html'; }));
  var extra = ['sparkling-dreams.html'];
  var routes = utility.concat(castles, extra, ['guide.html']);
  var enOnly = ['drinks.html', 'beer-on-shinkansen.html'];
  var episodes = {"spots/fuji.html":translated.slice(),"yakei.html":translated.slice(),"spots/fujitec-big-wing.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/pocari-fukuroi.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/fujikawa-bridge.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/fuji-paper-mills.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/ibuki.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/ibuki-seat-a.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"spots/yamazaki-distillery.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"drinks.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"beer-on-shinkansen.html":["zh-Hant","fr","de","es","zh-Hans","ko"],"foods.html":translated.slice(),"countryside.html":translated.slice(),"spots/gamagori-greenhouses.html":translated.slice()};
  var pattern = languages.filter(function (lang) { return lang !== 'ja'; }).concat(['ar']).join('|');
  function normalize(value) {
    var code = String(value || '').trim().replace(/_/g, '-').toLowerCase();
    if (/^zh(?:-|$)/.test(code)) return /(?:^|-)hant(?:-|$)|^zh-(?:tw|hk|mo)(?:-|$)/.test(code) ? 'zh-Hant' : 'zh-Hans';
    return languages.concat(['ar']).find(function (lang) { return code === lang.toLowerCase() || code.indexOf(lang.toLowerCase() + '-') === 0; }) || 'en';
  }
  function stripEdition(route) { return String(route).replace(new RegExp('^(?:' + pattern + ')/', 'i'), ''); }
  function canonicalRoute(route) { return stripEdition(route).split(/[?#]/)[0].replace(/^live\/$/, 'live/index.html') || 'index.html'; }
  function supported(route) { var key = canonicalRoute(route); if (starterRoutes.indexOf(key) >= 0) return languages.concat(key === 'guide.html' ? ['ar'] : []); return jaOnly.indexOf(key) >= 0 ? ['ja'] : enOnly.indexOf(key) >= 0 ? ['en'].concat(translated) : key === 'guide.html' ? coreLanguages.concat(['ar']) : routes.indexOf(key) >= 0 ? coreLanguages.slice() : ['ja', 'en'].concat(episodes[key] || []); }
  function routeLanguage(path) {
    var match = String(path).match(new RegExp('/(' + pattern + ')(?:/|$)', 'i'));
    return match ? normalize(match[1]) : null;
  }
  function recognized(value) { return /^(?:ja|en|zh|fr|de|es|ko|ar|it|th)(?:-|_|$)/i.test(String(value || '')); }
  var api = { starter: starter, starterRoutes: starterRoutes, coreLanguages: coreLanguages, jaOnly: jaOnly, enOnly: enOnly, episodes: episodes, editions: editions, languages: languages, translated: translated, utility: utility, castleIds: castleIds, castles: castles, extra: extra, routes: routes, pattern: pattern, normalize: normalize, recognized: recognized, stripEdition: stripEdition, canonicalRoute: canonicalRoute, supported: supported, routeLanguage: routeLanguage };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MADO_LOCALES = api;
}(typeof window === 'object' ? window : null));
