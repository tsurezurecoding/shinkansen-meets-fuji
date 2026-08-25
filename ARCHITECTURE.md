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

## Hand-written and generated files

Hand-written application shell includes root and language HTML templates, CSS, browser JavaScript, validators, and generators.

Generated output includes:

- `spot-page-shared-data.js`
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
