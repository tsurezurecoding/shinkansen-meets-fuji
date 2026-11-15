# Donburi / Everyday Japan

Accepted Japanese and English previews were adapted for ten existing site languages on 2026-11-15. These JSON files are the editorial sources; `scripts/generate-donburi-page.mjs` adds the current food-article layout, chrome, navigation, photo paths and metadata. Generated HTML is not the editing source.

The nine visitor-language editions are linked from the Taste Japan section of Everyday Japan and the food article's related stories. The Japanese companion is reachable through the language menu, uses an explicit `?lang=ja` override, is not promoted on Japanese entry pages, and is excluded from the sitemap and search indexing.

`main` retains the approved narrative, food and ordering explanations, accessible photo actions and photo credits. `marketNote` contains a short regional introduction with primary sources and the information date. Language is not treated as proof that a reader comes from one particular country. English includes one dated Japan/Singapore menu-price example, in each original currency, with its comparison limits; no universal saving or taste ranking is claimed.

The Tsukiji section introduces the Outer Market as a food neighbourhood and distinguishes it from the wholesale market that moved to Toyosu in 2018. Restaurant information and all regional claims use the linked official sources.

The 11 display assets and their permissions, original paths, photographers and licences are recorded in `data/donburi-photo-sources.json` (CP-0327–0337 in the private photo ledger). The Sukiya storefront retains its CC BY-SA 4.0 credit, source, licence link and modification notice in the caption and enlarged view. Original photographs are preserved outside this product source.

This is a local product integration, not a publication. The task's validation and unpublished status are recorded in the existing private operations report `2026-11-15_donburi-everyday.md`. Web build/preflight, the shared language registry, sitemap source and content manifest include this family. Android packaging is outside this task; a future Web-to-Android sync must include the new article family and its assets.
