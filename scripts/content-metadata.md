# 公開・更新・代表画像の正本

`content-metadata.json` はページ単位・言語単位の明示メタデータ。`shared/content-metadata.mjs` を各生成器から呼ぶ。HTMLのheadやsitemapを直接編集しない。guide.htmlは本文が手書きの正本で、headのメタデータと既存レールを生成器で同期する。

- `published`: そのURLを初めて公開した日。記事の改稿・特集への作り直し・写真撮影・Git commit日時・mtimeは初回公開の証拠ではない。
- `modified`: 本文・写真・事実・利用者に示す情報を実質的に更新した公開日。build、共通ナビ、CSS/asset hash、formatter、改行用chunkだけでは変更しない。
- 日付には `publishedEvidence` / `modifiedEvidence` を添える。証拠は運営OSの公開決定・成功Pages run。未公開の本文更新候補では日付を先取りせず、公開が確認できた時点で確定する。
- 不明な日付は `null` と `dateReview`。schemaでは省略する。modified不明のsitemapは既存値を維持し、その値を確定した記事更新日とみなさない。固定DEFAULT_LASTMODを今日へ更新しない。
- `article: true` は1本の読み物としての採用判断と、確認済みの両日付がある場合だけ。WebPage・TouristAttractionは維持する。collection・utilityを一括Article化しない。ArticleはDiscover掲載の必須条件ではない。
- author / publisherはサイトを編集・発行する「新幹線の窓」をOrganizationとして表す。写真撮影者と記事の著者を混同しない。架空の人物・撮影者名を著者として作らない。
- 独立ページの代表画像を明示する場合は `image`・`imageAlt`・`imageRights: own`・`imageEvidence` を記録する。第三者画像のOG許諾は今回実装していないため、自前画像だけを指定可能にしている。
- スポットは既存の明示 `spot.ogImage` → 自前主写真 → 自前補足写真 → 共通OGの順。明示画像は掲載creditから自前と確認する。自動選択はcreditとファイル名を照合し、同じ優先群の中で幅1200px以上・横長を先に選ぶ。低解像度しかなければ勝手に拡大せず、既存自前または共通OGを使う。
- 実寸はPNG/JPEG/WebPの資産ヘッダーから取得する。キャッシュは1回の生成プロセス内だけ。画像を差し替えても手書きのwidth/heightを更新する必要はない。オリジナルを破壊するcrop・サイズ変更は行わない。

検証は `audit:site` へ統合。5候補と既存スポットの日英ページを検査し、`npm run verify` で実行する。回帰テストは既存generator testへ追加し、未許諾画像の昇格・不正日付・一括日付更新・二重Articleを防ぐ。

Phase 1で日付確認が残るページ: 左富士の初回公開/実質更新、guideの初回公開、arenaniの最新カード更新。これらを確かめるまで日付やArticleを補わない。英語は日英共通の画像実寸/alt改善だけ適用し、日本語の公開日・Article採用判断を自動転記しない。
