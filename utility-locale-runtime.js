/* Only the explicitly localized utility pages load this dictionary adapter. */
(function () {
  'use strict';
  var payload = window.MADO_UTILITY_PAYLOAD;
  if (!payload) return;
  function t(value) {
    if (typeof value !== 'string') return value;
    var text = value.trim();
    var match = /^(Nozomi|Hikari|Kodama) \d+$/.exec(text) || /^([A-Za-z][A-Za-z-]+(?: [A-Za-z-]+)*) \d{2}:\d{2}$/.exec(text);
    var key = match ? match[1] : text;
    return payload.translations[key] ? value.replace(key, function () { return payload.translations[key]; }) : value;
  }
  function translate(value) {
    if (typeof value === 'string') return t(value);
    if (Array.isArray(value)) return value.map(translate);
    if (value && typeof value === 'object') {
      var result = {}; Object.keys(value).forEach(function (key) { result[key] = translate(value[key]); }); return result;
    }
    return value;
  }
  function extend(value, parentKey) {
    if (!value || typeof value !== 'object') return;
    // Author names and credit strings retain their supplied attribution.
    if (value.en != null && parentKey !== 'credit' && parentKey !== 'photoCredit') value[payload.lang] = translate(value.en);
    Object.keys(value).forEach(function (key) { if (key !== payload.lang) extend(value[key], key); });
  }
  [typeof SPOTS === 'undefined' ? null : SPOTS, typeof ROUTE === 'undefined' ? null : ROUTE,
    typeof BOARD_COLLECTION === 'undefined' ? null : BOARD_COLLECTION,
    typeof WHEEL_COLLECTION === 'undefined' ? null : WHEEL_COLLECTION].forEach(function (item) { extend(item); });
  var tables = {};
  Object.keys(payload.tables).forEach(function (name) {
    tables[name] = {};
    Object.keys(payload.tables[name]).forEach(function (key) {
      var value = payload.tables[name][key];
      tables[name][key] = value.args == null ? value.text : function () {
        var args = arguments; return value.text.replace(/\{(\d+)\}/g, function (_, i) { return args[Number(i)]; });
      };
    });
  });
  window.MADO_UTILITY_LOCALE = {
    lang: payload.lang, tables: tables, spots: payload.spots, narrations: payload.narrations,
    editorialNotes: payload.editorialNotes || {},
    t: t, stationName: t, forecast: payload.forecast,
    format: function (key) {
      var args = Array.prototype.slice.call(arguments, 1);
      return payload.forecast[key].replace(/\{(\d+)\}/g, function (_, i) { return args[Number(i)]; });
    },
    href: function (route) {
      route = window.MADO_LOCALES ? window.MADO_LOCALES.stripEdition(route) : route;
      var path = route.split(/[?#]/)[0].replace(/^live\/$/, 'live/index.html').replace(/^$/, 'index.html');
      return (payload.routes.indexOf(path) >= 0 ? payload.lang : 'en') + '/' + (route === 'index.html' ? '' : route);
    },
  };
}());
