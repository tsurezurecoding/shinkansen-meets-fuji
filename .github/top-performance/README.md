# TOP fixed-version runner diagnostic

This branch-only workflow does not merge main, deploy Pages, alter production assets, or send GA events. It runs only on pushes to codex/top-compare-1004 touching these diagnostic files. Do not add it to routine production builds or release manifests.

One Ubuntu24.04/Chrome runner compares every original Git blob of 17135799, b87eeb52 and 09dde5ff; no generation, rewriting or latest-asset substitution. Versions contain existing published public assets only. Original production HTML and GA runtime remain unchanged; only analytics transports are blocked in the measurement browser.

Preregistered: 6 rounds × 3 versions × JA/EN × (mobile GA-on, mobile GA-off, desktop GA-on) = 108 sequential runs. A/B/C and condition order each cover all six permutations, language order alternates, Chrome context is fresh every time. Benchmark max/min≤1.15 within each complete triple is a sensitivity flag, not proof of dedicated CPUs. Keep all results and the flagged subset; do not rerun until a preferred answer appears.

This removes the user's PC/Windows/fonts from the experiment but not hosted-runner variability, external GA variability or localHTTP-vs-CDN differences. The scores are not Google PSI. Infer neither causality nor equivalence from a crossing-zero exploratory bootstrap interval. Primary contrast is b87→09 (idle change), 171→09 includes LP cleanup. GA-off isolates the first-party page and is not the public GA-on condition.

Lighthouse13.5.0 and chrome-launcher1.2.2 are pinned via a separate lockfile, without changes to app package.json/package-lock.json. Chrome/OS/CPU/Lighthouse/config and all raw LHR/trace/network outputs are recorded. Anonymous PSI API quota and a public diagnostic URL are not required. Chrome is supplied by the hosted runner; execution fails instead of installing a new browser on the user's PC. Output must be outside the repo and must not exist already.

```sh
npm ci --ignore-scripts --prefix .github/top-performance
node --test .github/top-performance/stats.test.mjs
CHROME_PATH=/usr/bin/google-chrome TOP_COMPARE_ROUNDS=6 TOP_COMPARE_OUTPUT=/absolute/new-output node .github/top-performance/compare.mjs
```

Actions artifacts expire after 7 days; save the complete results locally and commit a compact evidence/analysis record to the operating repository before expiry. No tokens, secrets, account files or user data are passed to browsers or uploaded.

References: https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md and https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push
