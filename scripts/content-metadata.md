# 公開・更新・代表画像の正本

`content-metadata.json` はページ単位・言語単位の明示メタデータ。`shared/content-metadata.mjs` を各生成器から呼ぶ。HTMLのheadやsitemapを直接編集しない。guide.htmlは本文が手書きの正本で、headのメタデータと既存レールを生成器で同期する。

- `published`: そのURLを初めて公開した日。記事の改稿・特集への作り直し・写真撮影・Git commit日時・mtimeだけでは公開を確定しない。
- `modified`: 本文・写真・事実・利用者に示す情報を実質的に更新した公開日。build、共通ナビ、CSS/asset hash、formatter、改行用chunkだけでは変更しない。
- 日付には `publishedEvidence` / `modifiedEvidence` を添える。証拠は運営OSの公開決定・成功Pages run。会長の2026-10-08指示により、古い公開runが残らない初公開は、Gitの初出・当時のmain履歴・ドメイン移行と運用記録を照合した日単位の推定も採用する。`publishedAccuracy: estimated-day` と `publishedEstimateNote` に精度・理由を明記し、build時にGit日時から自動算出しない。未公開の本文更新候補では日付を先取りせず、公開が確認できた時点で確定する。
- 不明な日付は `null` と `dateReview`。schemaでは省略する。modified不明のsitemapは既存値を維持し、その値を確定した記事更新日とみなさない。固定DEFAULT_LASTMODを今日へ更新しない。
- `article: true` は1本の読み物としての採用判断がある場合だけ。日付が不明ならその項目を省略し、Article追加自体を止めない。GoogleのArticle仕様は必須プロパティを設けていない。日付は根拠を得られた時だけ設定する（明示した日単位の推定を含む）。WebPage・TouristAttractionは維持する。collection・utilityを一括Article化しない。ArticleはDiscover掲載の必須条件ではない。2026-10-08確認の公式仕様: https://developers.google.com/search/docs/appearance/structured-data/article?hl=ja / https://developers.google.com/search/docs/appearance/google-discover 。headline/image/author等は推奨であり、本repoのvalidatorは今回の編集方針に沿う品質契約。Googleの必須条件と混同しない。
- author / publisherはサイトを編集・発行する「新幹線の窓」をOrganizationとして表す。写真撮影者と記事の著者を混同しない。架空の人物・撮影者名を著者として作らない。
- 独立ページの代表画像を明示する場合は `image`・`imageAlt`・`imageRights: own`・`imageEvidence` を記録する。第三者画像のOG許諾は今回実装していないため、自前画像だけを指定可能にしている。
- スポットは既存の明示 `spot.ogImage` → 自前主写真 → 自前補足写真 → 共通OGの順。明示画像は掲載creditから自前と確認する。自動選択はcreditとファイル名を照合し、同じ優先群の中で幅1200px以上・横長を先に選ぶ。低解像度しかなければ勝手に拡大せず、既存自前または共通OGを使う。
- 実寸はPNG/JPEG/WebPの資産ヘッダーから取得する。キャッシュは1回の生成プロセス内だけ。画像を差し替えても手書きのwidth/heightを更新する必要はない。オリジナルを破壊するcrop・サイズ変更は行わない。

検証は `audit:site` へ統合。18候補と既存スポットの日英ページを検査し、`npm run verify` で実行する。回帰テストは既存generator testへ追加し、未許諾画像の昇格・不正日付・一括日付更新・二重Articleを防ぐ。

横展開で左富士/guide/魚籃/248の初公開は7月1日のmain初出と7月2〜3日の公開運用記録に基づく推定日として記録。他の初公開・実質更新は公開決定とページ固有データの履歴を照合した。Big Wingはgit --followで類似ページのコピー元へ遡ることがあるため、対象パスの追加commitと公開決定を採用する。既存スポット英語はPhase 1の画像実寸/alt改善だけで、日本語日付・Article判断は自動転記しない。城一覧/山陽城の英語は同時公開の記録を確認し、英語Drinksは専用の公開記録を採用する。

城一覧はCollectionPageを維持。山陽3城は既存Articleを直接補強し、二重Articleを作らない。自前の主題写真がなく第三者OG許諾も確認できない場合、`representativeImage: false` と `imageReview` を正本に記録する。共通OGは維持し、主題を表さない共通画像はArticle.imageから除く。Googleのimageは推奨項目なので、架空の代表画像で埋めない。品質監査はこの明示判断だけを例外として検査する。本文掲載写真とcredit/sourceUrlは変更しない。
