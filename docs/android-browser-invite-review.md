# Androidブラウザ向けアプリ案内（未公開）

2026-10-04、`codex/android-browser-invite-1004`。基準main: `06f09a96`。

## 採用案と公開版の根拠

日英TOPと富士山ガイドの本文末に、通常フローの小さな閉じられる案内を1つ追加する。本文を読み終えたところで乗車中の利点を伝え、列車選択・ライブ操作を妨げず、既存のアプリ紹介カードと重複するstartやスポット共通枠は増やさない。上部挿入、固定表示、モーダル、自動遷移、ネイティブインストールプロンプトは使わない。

運営正本 `reports/2026-10-04_android-production-release.md` / root `4a134a7` は、1.0.21-vc24の製品版を10/4 22:40 JSTに178国・地域へ正式公開したと記録。公開コードはmobile `9d3374f`、固定Web `8e6cf8e9`＋`346c72bc`。公開中紹介ページ、同梱liveの「画面を消しても案内と音声が続きます」、foreground serviceの既存検証を照合した。紹介文は画面消灯中の乗車音声案内・無料・登録不要だけ。新着PUSHや後続未公開機能は訴求しない。Play配信反映は端末ごとに時間差があり得る。今回Playストアはブラウズツールから取得できず、上記の最新Console確認記録を根拠にした。

Playリンク: https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow

## 表示・頻度・操作

- Android UAかつ既知の通常ブラウザ、display-mode browser、トップレベルのページだけ。wv / Version 4.0、既知SNS内ブラウザ、Capacitor、embedded marker、iframe、standaloneを除外する。
- UA等はbest effort。インストール済みでも通常ブラウザを開けば表示し得る。未対応のinstalled-related-apps APIを未インストール確認済みと扱わない。双方向関連付けが必要なAPIやネイティブ側変更は追加していない。
- 初回描画前にlocalStorageを読み書きできた場合だけ、7日間の案内枠を確保する。頻度制御は案内を実際に見た回数ではなく対象ページを開いた回数で保守的に行う。見ないまま離れた場合も7日間抑える。
- 閉じる／Playクリック後は期限なしの抑止状態を保存し、同じoriginのJA/EN・複数ページ・タブ・再訪で共有。保存データが消去されれば抑止もリセットされる。閉じるボタンの読み上げは「今後表示しない」を明示。
- 初期read/write失敗・quota・破損状態は非表示。表示後にdismiss保存だけが失敗した場合もその文書は閉じたままで、保存済み7日間の抑止は残る。保存不能時にブラウザを跨ぐ永続抑止を保証することはできない。
- 閉じた直後・他タブの状態変更・BFCache復帰では同じ文書の高さを保持して不可視/inertにする。下の本文やリンクを動かさず誤タップを避け、閉じる操作後は既存フッターの最初のリンクへpreventScrollでフォーカスを移す。次のナビゲーションでは枠自体を表示しない。
- リンクは通常の同一タブPlay遷移。戻る操作で本文へ戻れる。タップ領域44px以上、自然な折返し、キーボード操作、focus-visible、print時非表示。

## SEO・速度・配布

本文main・title・canonical・meta・構造化データ・既存リンクは変更していない。新しい本文末asideだけを追加。JSなしと非対象端末では案内を表示しない。初期HTMLに存在し、遅延挿入しない。同期の小さな判定とCSS/ハンドラをビルド時にインライン化し、新しいJS/CSS/画像リクエスト・SDK・サービスワーカー変更を増やさない。

HTML増分は約6.0KB、gzip増分はJA TOP 2,150B、EN TOP 2,046B、JA guide 2,545B、EN guide 2,294B（ローカル圧縮比較、実配信量ではない）。案内の原本は `scripts/shared/android-invite.mjs` と `android-invite-runtime.js`。`generate-android-invite.mjs` がJA TOPと日英guideを同期、既存TOP生成器がENをローカライズする。build/checkへ登録済み。`content-manifest.json`は既存生成器で再生成し、新たな実行時依存ファイルはない。Androidへの次回Web同期にも新規asset登録は不要だが、実APKの今回は未変更・未検証。表示除外はWebView/Capacitor markerで検証した。

Googleの[低侵襲な案内の指針](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)に沿う小さなHTMLストア導線。SEOへの影響ゼロや実端末全条件の検出を保証しない。

## 計測

既存 `MADO_ANALYTICS_DISABLED === false` とgtagがある場合だけ記録し、解析を初期化しない。既存のlocal preview/GA optout設定を保持。保存トークン、位置情報、ユーザーIDはイベントへ送らない。

- `android_app_invite_view`: 50%以上がviewportへ入ったときに文書中1回。IntersectionObserver未対応なら表示計測を省く。
- `android_install_click`: 既存のPlayクリックイベントを利用。`entry_source=android_browser_inline`、`cta_id=android_browser_inline`、language、page_contextで区別。**クリックであってインストール完了ではない。**
- `android_app_invite_dismiss`: 閉じる操作。

効果の分母は対象Android通常ブラウザ・実表示・Playクリックを別々に扱う。既存GAの「Web」全sessionsはAndroid通常ブラウザ限定の母数ではない。クリックからinstall/first launchを推定しない。「installが少ない」は依頼者の現状認識であり、今回新たに計測したinstall数ではない。運営残件13の既存観察にこの導線のsourceを加えればよく、新規Install Referrerや別解析基盤は追加していない。

## 検証

`npm run verify`成功（既存generator 41件・narration 450項目・service worker 2件、追加inviteテスト6群。site auditは0 errors / 既存5 warnings / 8 allowed）。`npm run build`による対象差分の再生成も不変。

Edge Chromiumの実ブラウザで27シナリオと追加5シナリオを確認。AndroidのJA/EN×TOP/guide×320/390/1440px、横あふれなし、カード220px未満、44pxタップ領域、閉じる・再訪・複数ページ/タブ・戻る進む・期限切れ・他タブからstorage変更・BFCache・キーボード・Playクリック/表示計測・GA無効時の抑制・storage read/write failure・noJS・iPhone/PC/bot/WebView/Instagram/standalone/Capacitor/from markerの非表示を検証。初期・スクロール後・閉じた後の枠/フッター位置も確認。

390px・同じローカル配信/資産の変更前後比較:

| ページ | LCP変更前→後（ms） | CLS変更前→後 |
|---|---:|---:|
| JA TOP | 228→216 | 0→0 |
| EN TOP | 224→244 | 0→0 |
| JA guide | 480→496 | 0→0 |
| EN guide | 324→356 | 0→0 |

mainテキスト・title・canonical・mainの初期位置・リソース要求リストは4ページとも一致。追加リクエストなし。LCPはローカルの非スロットル単回比較で、回線/端末の実測改善や回帰ゼロの証明ではない。HTMLの小さな増分はある。新規レイアウトシフトは観測しなかった。実Android端末・TalkBack・実Play遷移/インストール・公開後SEO効果は未検証。

根拠と12スクリーンショットはPC workspace `C:/Users/kynr0/Documents/Codex/2026-10-04/task-5/evidence/`。再現スクリプトは同workspace `browser-qa.cjs`、`browser-supplement.cjs`。閲覧用 `review.html`。共有の運営台帳には他担当dirty差分があるため今回上書きしない。

この差分はdraft PRのレビューまで。merge・Pages公開・Androidビルド/Play提出は未実施。公開する場合は対象SHAの承認と既存公開バッチのゲートを通す。
