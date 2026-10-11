/* Explicit Disney locales reuse the English calculator and translated utility picker. */
(function () {
 'use strict';
 var payload=window.MADO_SPARKLING_PAYLOAD;
 if(!payload)return;
 window.MADO_SPARKLING_LOCALE={lang:payload.lang,t:function(value){return typeof value==='string' && payload.translations[value.trim()] ? value.replace(value.trim(),function(){return payload.translations[value.trim()];}) : value;}};
}());
