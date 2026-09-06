# Architecture and release contract

Updated: 2026-08-25

## Product boundary

This repository is the public Web application. `v0/` and `v1/` are preserved legacy releases: keep their URLs working, include them in syntax checks, and do not use them as the implementation base for current changes.

The current application is online-only. `app.js` does not register a Service Worker. `sw.js` remains temporarily as a retirement worker so previously registered clients can delete old prefixed caches and unregister safely; it must not intercept fetches or store responses.

## Sources of truth

- Spot facts and public copy: `data.js`
- Timetable facts: `data/timetable.js`
- Live narration: `live/narration.js`
- Shared generator domain helpers: `scripts/shared/`
- Generated content manifest inputs: `contentFiles` in `scripts/generate-content-manifest.mjs`
- Public route inventory: `sitemap.xml` plus generator and validator contracts

Do not edit generated output to change a fact. Change its source and regenerate it.

## Spot page payload split

A spot page loads two generated artifacts: the catalog every page shares, and its own body.

- `spot-page-shared-data.js` carries stations, the spot rail, the showcase and feature flags. It is schema v3 and must not contain page bodies.
- `data/spot-pages/<id>.<lang>.js` carries one page body, read by that page alone. The renderer refuses to draw a body whose id or language does not match the page.

The point is the per-visit transfer, not the total. `generate-spot-page-shared-data.mjs` and `validate-spot-page-shared.mjs` both enforce three budgets: 48 KB for the catalog, 32 KB per page body, and 64 KB for the worst case of catalog plus the largest body. The validator also fails a page that loads another spot's body, and an orphan body left in the payload directory after a spot leaves `data.js`.

Before the split, one artifact held all 47 spots in both languages at 903 KB, and every page downloaded all of it. Editing five words of one hook changed 120 files, because the cache buster is a content hash.

## Hand-written and generated files

Hand-written application shell includes root and language HTML templates, CSS, browser JavaScript, validators, and generators.

Generated output includes:

- `spot-page-shared-data.js` (catalog only)
- `data/spot-pages/<id>.<lang>.js` (one body per page, per language)
- Japanese and English files below `spots/` and `en/spots/`
- inbound tables embedded by `scripts/generate-inbound-tables.mjs`
- asset version query strings maintained by `scripts/sync-asset-versions.mjs`
- spot counts maintained by `scripts/validate-spot-counts.mjs --fix`
- `content-manifest.json`

`generatedAt` was removed from the tracked content manifest. A commit timestamp cannot be known before committing the file that contains it, so it created self-referential drift. `contentVersion` and file hashes are the deterministic provenance contract.

## Web to Android contract

Android consumes a frozen copy of selected Web assets described by `content-manifest.json`. Web work must not silently update the Android bundle. The Android repository owns its copied assets, version, AAB, and release checks.

As of 2026-08-25 Android is under production-access review and new Android releases are frozen. Web release-gate work must not edit, copy, build, upload, or publish Android artifacts.

## Required local checks

```text
npm ci
npm run verify
```

`verify` performs validators, generator drift checks, deterministic manifest comparison, syntax checks for all first-party JavaScript including legacy, Node tests, the severity-aware site audit, and Git whitespace checks.

After editing a source that has generated consumers, run `npm run build`, then run `npm run verify`. A second build must produce no diff.

## Publication path

```text
working branch -> pull request -> quality-gate -> main
main + approved exact SHA -> manual deploy-pages workflow -> GitHub Pages
```

Normal pushes must never deploy. The deploy workflow accepts an exact 40-character SHA, proves it is on `origin/main`, reruns `verify`, checks deterministic build output, enforces the release interval, and then uploads the static site. Publication still requires the chair's explicit approval.
