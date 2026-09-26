# CINEMA intro player

Integrated from the approved local HTML candidate on 2026-09-26. 49-second bilingual HTML/CSS film. Displayed from the TOP's “in a minute” link; assets load only after a click. Android is not promoted in the film.

Runtime source: `player.html`, `film.js/css`, `cinema.js/css`, `night-cut.js/css`, shared `pv-engine.js` and `pv-base.css`, `player.js/css`, `embed.js/css`, `scenes.js`, and `assets/`. These are the editable production sources. The earlier comparison prototypes are not runtime dependencies.

All photographs are michikusa's own. Captured product screens contain no third-party photographs; map attribution is retained. Lightweight source provenance and hashes are preserved in the operating repo at `.codex-local/previews/promo-pv-html-0926/assets-report.json` and `night-assets.json`. The source storyboard and inherited render history are documented there. Original synthesized audio only, no station melody.

Marketing count is `50+` in the film, its transcript and reduced-motion cards. TOP uses “50以上の景色” / “50+ views”. Adding a spot does not require edits. The source data remains authoritative for actual list totals. Night illumination/berthing footnotes are intentionally omitted from this introduction at the owner's request.

The player is a noindex utility iframe, not a new editorial landing route. The TOP determines language with `?film=ja|en`; no A/B edition switch is exposed. The end link goes to the language-matched field guide; the parent also offers a preview ride. Closing destroys the iframe and audio, restores page scroll and focus, and reopening starts again. Esc works even when focus is inside the player. No autoplay before a visitor requests playback; sound requires a second explicit gesture.

`intro_film_open/start/half/complete/close/browse` and `intro_film_cta` use the site's existing consent-aware gtag when available. Half/complete accumulate observed forward playback rather than treating a seek to the end as completion. They describe consumption, not satisfaction or causal effect.

Runtime files are registered by `scripts/generate-content-manifest.mjs`. Android bundling is a separate follow-up; do not synchronize the new TOP into mobile without registering the dependencies and checking the app's webview behavior.
