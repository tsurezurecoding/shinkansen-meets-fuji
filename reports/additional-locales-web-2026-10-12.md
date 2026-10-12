# Web edition parity: de / es / zh-Hans / ko

Base: `52edc480b84d90c263b3f4ddb7d61994a3088655` (main, PR95). Branch: `codex/locales-parity-1012-task3`. The earlier checkpoint based on PR94 was rebased onto PR95. PR95's window-trip entrance, ALL initial selection and zukan hero are retained. This is a local review candidate; no push, PR, merge, publication or Play submission is part of this work.

## Supported routes

The source of truth is `locales.js`, consumed by browser code and `scripts/shared/locales.mjs`. All eight editions (ja / en / zh-Hant / fr / de / es / zh-Hans / ko) share these 25 active routes:

- `index.html`, `start.html`, `live/index.html`, `zukan.html`, `contact.html`, `mieru.html`, `journal.html`, `guide.html`
- `castles.html`
- `spots/edo-castle-fujimi-yagura.html`, `spots/odawara-castle.html`, `spots/kakegawa.html`, `spots/kiyosu.html`, `spots/gifu-castle.html`, `spots/hikone-castle.html`, `spots/sawayama-castle.html`, `spots/kannonji-castle.html`, `spots/himeji-castle.html`, `spots/okayama-castle.html`, `spots/fukuyama-castle.html`, `spots/odawara.html`, `spots/nagoya-station-skyline.html`, `spots/toji.html`, `spots/hamanako.html`
- `sparkling-dreams.html` and its calculator

Each new edition adds 24 HTML pages and updates its existing guide: 96 new HTML outputs in total. `zh-Hant/besides-fuji.html` remains a historical canonicalized entrance, not a 26th active route. Arabic remains guide-only. Other articles retain the existing Japanese/English boundary.

## Sources and generation

The 12 new dictionaries are `scripts/locales/{utility,castle,sparkling}-{de,es,zh-Hans,ko}.json`. Each edition has 1981 / 1125 / 343 entries respectively (2746 unique keys across the three dictionaries). German, Spanish and Korean candidates were reviewed for complete content, shared-key consistency, placeholders, markup, numbers, train names, station IDs and A/B/C/E seats. Korean cardinal numbers and month names use conventional digits in 54 reviewed entries while preserving all literal source numbers. Simplified Chinese was adapted from the complete traditional edition, with script conversion and mainland wording reviewed.

`npm run extract:locales` refreshes source keys while retaining reviewed entries. New untranslated keys remain blank; generators reject missing/empty translations. `node scripts/extract-locale-dictionaries.mjs --check` checks source coverage without writing. The page generators share the edition/route contract, so dictionaries can follow English source changes without separate page edits. Entry headings can already vary through each edition's dictionary. Current photographs and source credits remain shared.

Registry script insertion runs after the base URL and before synchronous language routing. Menus preserve queries/fragments and current train state. Japanese destinations explicitly retain `lang=ja`; a Japanese source URL also pins its language before a switch so Back/reload works after another preference is saved. `zh`, `zh-CN`, `zh-SG`, `zh-Hans` resolve to simplified Chinese; `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant` resolve to traditional Chinese. Browser language alone does not redirect.

## Validation and native boundary

Final execution results and the exact delivery commit are recorded in the task's `ANDROID-WEB-HANDOFF.md`. Browser QA uses local HTTP, blocked external traffic, analytics disabled before scripts run, and deterministic weather fixtures. It covers all 25 new-edition pages plus the seven existing utility pages at 320 / 390 / 1440px (384 layouts), and eight edition journeys in both train directions. QA also covers dropdown bounds, image availability, runtime errors, guide entry, selected train/station/direction, all calculated spot clocks, switches, Back/reload, legacy TOP queries/fragments, zukan gallery links and live demo direction changes. Repository verify checks metadata, credits, placeholders, calculator equivalence, forecasts, narration text, sitemap, manifest, syntax and existing tests.

Text/subtitles use the selected edition. Recordings remain the existing Japanese/English packs: Japanese uses Japanese; other editions use English recordings. No new audio files are produced. Physical GPS, background notifications, Android speech engines and signed Android packages need the Android owner's separate validation.

The Android owner should derive its locale set and paths from `locales.js`, include that asset before routing, copy new utility/sparkling payloads and the new promo copy, and retain the current mobile candidate/voice fallback. Review native bundling's fixed `['zh-Hant','fr']` list and top-level file allowlist, including `locales.js` and PR95's `zukan-hero.css`. Web content-manifest coverage follows the existing contract: utility/castle/calculator outputs are included; guide HTML remains outside that manifest and needs the native guide-copy policy checked separately.

## Separate cultural expansion

`drinks.html`, `foods.html`, `beer-on-shinkansen.html` have no existing fr/zh-Hant equivalents. Extending them across fr / zh-Hant plus the four new editions means 18 additional HTML outputs, three dictionary families/source snapshots, internal links, metadata/sitemap/manifest and visual validation. Adding the same-language Everyday Japan hub means six more outputs (24 total). The drinks article's real package labels, photographs and credits should remain intact while search titles, headings and descriptions are translated. This work needs its own source review and scope decision; it is not included in the 25-page parity candidate. Countryside, all independent spot prose, Arabic expansion and new audio remain outside scope.

An existing Kiyosu article's Southbound/Northbound wording is retained from its source; a geographic wording correction should be a separate source change rather than silently changing only these translations.

On Windows, PR95's window-trip template could reintroduce CRLF after version synchronization. Its generator now normalizes template line endings so final build, hash manifest and preflight agree.
