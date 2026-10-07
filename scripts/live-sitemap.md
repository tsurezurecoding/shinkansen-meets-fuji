# live sitemap lastmod

日英liveの重要更新日は `live-sitemap-state.json` の `lastmod` を正本にし、
`generate-spot-pages.mjs` がsitemapへ反映する。ビルド日・commit日を自動転記しない。
初期値2026-10-07はPR #68 / 1b7f3c7dの案内台本・音源とガイド動作修正の公開日。

`npm run check:live-sitemap`（通常の `check` / `verify` にも含む）は、本文・主要メタデータと
日英の案内台本を、前回の確認記録と照合する。変更したままlastmodの確認を忘れると失敗する。
CSS、共通ナビ、資産バージョン、durationだけの変更、JS制御処理は対象外。
すべてのJS差分を重要更新扱いしない。音源だけの修復・機能だけの重要変更・JS内のみのコピーは
この検知範囲外なので、担当者が差分の意味を判断し、必要な時に同じ手順で記録する。

1. いつもの生成手順で日英live HTML・台本を揃える。重要な本文・案内内容・機能変更か確認する。
2. 実際の重要更新日（JSTの日付）と理由を明示して確認記録を更新する。
   `npm run check:live-sitemap -- --record YYYY-MM-DD --reason "対象の変更内容・根拠"`
   日英の更新が異なる場合は `--lang ja` または `--lang en` で該当言語だけを記録する。
   変更が軽微なら日付を維持し、理由にその判断を書く。日付を自動で今日にしない。
3. `node scripts/generate-spot-pages.mjs` を実行し、sitemapを生成する。
4. `npm run check:live-sitemap`。差分が日英liveの2項目だけか確認する。
   公開バッチでは通常の `npm run verify` を行う。

日付は公開予定ではなく、確認した重要更新の履歴に基づける。確認記録を更新すること自体は
公開承認ではない。lastmodの不整合をGoogle未登録の直接原因とは断定しない。
