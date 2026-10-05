# Androidブラウザ向けアプリ案内（レビュー中・本番未公開）

JA/EN TOP・富士山ガイドの既存ヒーロー直後に小さな閉じられる案内を配置。本文に入る流れで公開中アプリの利点を伝える。固定バナー・モーダル・自動遷移は使わない。既存記事、title、canonical、構造化データを維持し、main PR63のE席訂正も含む。

## 公開版と紹介内容

運営正本 reports/2026-10-04_android-production-release.md / root 4a134a7 に、Android 1.0.21-vc24を10/4 22:40 JST、178国・地域へ公開した記録がある。公開mobile 9d3374f、紹介ページ、live説明、既存foreground service検証を照合。紹介は「画面を消しても乗車中の音声案内が続く」「無料・登録不要」に限定し、未公開PUSH機能は含めない。Console記録に基づく確認で、全端末のストア反映・インストール済み判別は保証しない。

## 表示と抑制

- Androidの既知通常ブラウザのみ。既知bot、WebView、SNS内ブラウザ、native/embedded marker、iframe、明示的standalone等を除外。matchMediaのbrowser=false単独はインストール済みの証拠ではないため除外理由にしない。UA/APIはbest effort。
- 初期read/write・quota・破損状態・IntersectionObserverなしは非表示。localStorageが使えない訪問で繰り返す案内を出さない。保存可能かの短命probeで確認し、読み込みだけでは期間を開始しない。
- 可視タブで案内の50%以上がviewportに入った時点から7日間抑制。解析同意とは独立。Web Locksで同originの閲覧確保を直列化し、非対応環境は再読込/write/token照合によるbest effort。同時表示を完全保証しない。
- 「閉じる / 30日間」「Later / 30 days」は閉じた時点から30日間、同originの全ページ/タブで抑制。期限ちょうどで再表示可能。通常の再訪には空枠を作らない。旧版のstop:true保存は期限なし抑制として引き続き尊重する。
- Playクリック後は期限なしのstop:true、reason:play。ストア往復で繰り返し勧誘しない。ブラウザ保存データを消すと抑制も消える。インストール完了を検知した状態ではない。
- 直接「閉じる」を押した文書ではカードと余白をdisplay:noneで消す。次の本文h2にpreventScrollでフォーカス移動。明示的操作による縮みと初期/非操作CLSを区別する。他タブのstorage通知・BFCacheの状態反映ではその文書の高さを保ち、操作中の本文が不意に動くのを防ぐ。次の読み込みでは空枠なし。
- 保存失敗時も現在のカードは閉じる。閲覧済み7日間が残る場合はそれを維持。保存不能時のブラウザをまたぐ永続性は保証できない。

## 画像・速度・アクセシビリティ

公式Google PlayバッジJA/ENと既存承認済みapp-icon-192.webpを使用。バッジ646×250の元PNGを変更せず、176px幅で比率維持。画像自身にある周囲余白をクロップしない。アイコン48×48、バッジの寸法をHTML/CSSで先に確保。画像ロード失敗時もGoogle Play文字リンクが表示され、リンクのaria-labelは常時提供する。closeは44px以上、focus-visible、装飾画像alt空、キーボード操作可、print非表示。

画像のsrcは対象者だけDOMContentLoadedで設定し、非Android/抑制中には案内画像の要求を追加しない。対象Androidのみ低優先度の画像2件（JAバッジ40,674B / EN 4,904B、アイコン5,594B）を追加する。新規SDK/JS/CSSリクエスト/追跡/PWA・service-worker変更はなし。画像を除く小さな同期判定/インラインCSSはHTML増分がある。既存manifest生成器で再生成する。Web資産追加が将来Androidへ同期される場合は既存mobile側資産ゲートで確認するが、今回はAPK/Playの変更対象ではない。

公式根拠: [Android marketing tools](https://developer.android.com/distribute/marketing-tools/brand-guidelines)、[Google Play badge guidelines](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/)。公式公開配布の[JA画像](https://play.google.com/intl/en_us/badges/static/images/badges/ja_badge_web_generic.png) / [EN画像](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)を取得。最低バッジ高1/4のclear space、言語整合、コントラスト、非変形/非切抜きを確認。サインインが必要な最新download hubとの版一致・Googleによる個別ブランド審査を完了したとは主張しない。

## 計測

既存MADO_ANALYTICS_DISABLED===falseかつgtagが存在するときのみ、android_app_invite_view（50%可視・文書1回）、android_app_invite_dismiss、既存android_install_clickを記録。language/page_context/cta_id/entry_sourceで区別。**Playクリックはインストール完了ではない**。解析を初期化しない、保存token/位置/個人情報を送らない。Playリンクは既存固定公開UTM source=shinkansen_window_web、medium=android_browser_inline、campaign=android_app_invite。Install Referrer SDKは追加しない。

## 検証と公開範囲

最新の実行結果・スクリーンショットは同じowner-only private preview成果物に保存。npm run build / verify、unit 12群、JA/EN 4ページ×320/390/1440、初期CLS、閉じた後の余白消失/次h2フォーカス、30日境界/再訪、Play永続抑制、別ページ/タブ・戻る、非Android/WebView/storage失敗、画像取得失敗のリンク継続、既存本文/metadataを確認。EdgeでAndroid UAを指定したブラウザ検証であり、最新画像付き変更をPixel実機/TalkBackで検証済みとは主張しない。

ローカルLCP/CLS比較はbadge-invite-browser-results.json。LCPは端末/回線/キャッシュでばらつく測定でフィールド回帰ゼロを保証しない。Googleの[低侵襲案内の方針](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)に沿う通常フローのリンクだがSEO影響ゼロを保証しない。

Git保存・draft PR62と既存owner-only Site確認まで。本番main merge/deploy、APK作成/Play提出は未承認・未実施。
