# English guide / Kintetsu follow-up — 2026-10-19

## Scope

User review requested removal of the six blue links before FIVE VIEWS and English coverage of the two already-published Japanese Kintetsu topics. This follow-up stays on `codex/english-traveler-entry-1019`; no product push, production release or main merge.

## Six-link cause and change

The authored `.guide-reading-links` nav and its inline CSS came from `f9d530d4` (2026-09-20, “Show discovery and enjoyment in site entry copy”). The production HTML still contained both the nav and its own CSS when checked on 2026-10-19. Its CSS sets flex layout and underline offset but no link color. The blue underlines therefore were not caused by missing preview CSS. The earlier English implementation reordered this pre-existing nav.

Remove the English nav and its now-unused inline CSS. Keep all six destination sections, the hero's seat/train-time/weather buttons, the existing rail and contextual body links. No global CSS or other language page is changed.

## Kintetsu chapter

Add a separate chapter and hero anchor to English `arenani`, using the existing responsive embed-card design and the same two original X posts as Japanese:

- Heijo Palace: Kintetsu Nara Line, Yamato-Saidaiji–Shin-Omiya, Nara. Reconstructed Suzaku Gate / Daigokuden, directional description only for trains toward Kintetsu-Nara.
- Daikannonji / Louvre Sculpture Museum: Kintetsu Osaka Line, near Sakakibara-onsenguchi, Tsu, Mie. Golden 33m Kannon, outdoor sculptures, walkable visitor destinations; no invented side, timing or distance.

Reuse the existing original-post attribution, Japanese quoted post text and official links. No downloaded social images or new photos. The existing X lazy loader loads embeds near the viewport; direct original-post links remain available. English labels surround the original Japanese posts. The chapter explicitly distinguishes these conventional-line views from the Tokaido Shinkansen, and the next-step/about copy limits train timeline guidance to the Tokaido views.

Generator changes keep default Japanese output identical. Source data, seat labels, Japanese TOP/search, Disney/night prototype and national prototype are untouched. Regenerate the content manifest after the HTML changes.

## Preview boundary

The local full-text private-preview source has the same changes and retains all eight article bodies. Remote Site v2 is unchanged: automatic approval rejected sending its short-lived repository credential into the escalated helper process because that process was outside the managed network proxy. No alternative credential transfer or access-policy change was attempted. A managed, approved official Sites source-save path is required before distribution.
