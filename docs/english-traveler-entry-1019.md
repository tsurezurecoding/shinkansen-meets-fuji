# 英語の旅行者入口の改善（未公開）

基点: PR118 / `bee3a9eb3ae543e379ec6232bcce2ad84c70c0c3`。2026-10-19にGitHub mainを読取照合。作業branchは `codex/english-traveler-entry-1019`。共有app/night-photos、山崎町記事、日本語TOP、Disney記事導線の未公開候補を変更しない。

## 変更の意図

| 対象 | 変更前に確認したもの | 今回の変更 |
|---|---|---|
| 富士山guide | heroに便/天気、本文navに席/時刻が既存 | heroの既存1リンクを席詳細へ。本文navは席/自分の便を先頭へ。リンク本数は増やさない |
| 英語start | 静的便一覧とguideへの1リンクが既存 | 既存guideリンクを席節へ具体化し、天気予報への1リンクだけ追加。計算・便一覧・SEO登録を維持 |
| 東寺 | 京都130分→東寺131分、viewpoint経度135.746690、京都駅より西の地点 | 下り京都発車後/上り到着前を方向別に記載。東側から到着前の視認を否定せず、建物で途切れる旨。歴史・文化本文は維持 |
| 727 | 英語collectionにサロン専売説明・写真/位置一覧が既存。英arenaniは日常景5題 | 末尾の既存次案内に自前727写真とcollectionへの1入口を追加。新規重複解説なし |
| 飲料/beer | drinksにラベル解説と茶畑/UCC/Pocari、beerに2醸造所/山崎/ワゴン史の導線が既存 | drinks章ナビをラベル/糖乳/味へ具体化し、beer比較への1リンク。beer章ナビには既存の乗車前購入節への1アンカー |

英語を源とする既存の6言語生成があるため、東寺の方向説明・startの補助文のみ翻訳辞書へ追記して再生成。中国語の唐/空海文脈、独語の姫路/Neuschwanstein文脈を変更しない。E席側の基本案内・城カードの席条件は変更しない。

`data.js`に伴うruntime/source hash・cache versionの更新が関連HTMLへ波及する。日本語TOP/検索の構造・本文・操作は変更しない。変更された日本語HTMLはasset versionのみ。生成物を他候補へ丸ごと重ねず、source差分を統合して対象基点で再生成する。

## 別試作

全国路線入口は独立 `codex/national-route-entry-prototype-1019`、`prototype/national-routes/`。4方面（東海道/東北/北陸/山陽）の行き先から路線を選択し、模式図、車窓と降車後の文化を分ける。東北/北陸は公式路線・文化案内へ。全国全便タイムラインを装わず、製品ナビ・manifest・sitemapへ接続しない。

## 確認根拠

- 東寺公式アクセス https://toji.or.jp/smp/access/ と既存SPOTSのmap/viewpoint、ROUTEの京都130分、東寺131分を照合。
- 全国の路線はJR Eastの英語Trains & Routesおよび東北/北陸路線ページ、JR Central Railway Mapを照合。文化はJNTOおよび東北公式観光サイトへ。
- 写真は既存掲載のmichikusa自前のみ。新規取得・未確認写真・未確認の車窓案内なし。
- 変更前18画面、変更後21画面、全国切替12画面（320/390/1440px）。横あふれ・JS例外0。24操作チェック合格。証跡はworkspaceの `evidence/`。
- `npm run build`成功。`npm run verify`のcheck/preflight/manifest/全JS構文/全テストは成功。auditで仮置きした全国英語試作が日本語ツリーと判定されたため、予定通り別worktreeへ分離し、audit/check:diffだけ再確認した。全体を無関係に再試行しない。確定結果は引継ぎ報告に記載。

## 未実施と境界

本番公開、製品remote push/PR、main merge、Android同期、SC再登録・SEO設定変更なし。近鉄2題は観察。英語startのInspectionは別担当で、完全URLで発見済み・未登録を確認したとの親共有を受領。原因を技術欠陥と断定しない。

本人限定Sitesは既存所有者限定（owner一人、共有group/外部visitorなし）の運用とprivate配信機能を読取確認。既存Site/権限を変更せず、親が既存確認面へ統合できるよう差分・試作・スクリーンショットを渡す。物理スマホ・Safari・実旅行者での理解は未確認。
