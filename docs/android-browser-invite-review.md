# Androidブラウザ向けアプリ案内（未公開）

2026-10-04、`codex/android-browser-invite-1004`。基準main: `06f09a96`。

## 採用案と公開版の根拠

日英TOPと富士山ガイドの本文末に、通常フローの小さな閉じられる案内を1つ追加する。本文を読み終えたところで乗車中の利点を伝え、列車選択・ライブ操作を妨げず、既存のアプリ紹介カードと重複するstartやスポット共通枠は増やさない。上部挿入、固定表示、モーダル、自動遷移、ネイティブインストールプロンプトは使わない。

運営正本 `reports/2026-10-04_android-production-release.md` / root `4a134a7` は、1.0.21-vc24の製品版を10/4 22:40 JSTに178国・地域へ正式公開したと記録。公開コードはmobile `9d3374f`、固定Web `8e6cf8e9`＋`346c72bc`。公開中紹介ページ、同梱liveの「画面を消しても案内と音声が続きます」、foreground serviceの既存検証を照合した。紹介文は画面消灯中の乗車音声案内・無料・登録不要だけ。新着PUSHや後続未公開機能は訴求しない。Play配信反映は端末ごとに時間差があり得る。今回Playストアはブラウズツールから取得できず、上記の最新Console確認記録を根拠にした。

Playリンク: https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow&utm_source=shinkansen_window_web&utm_medium=android_browser_inline&utm_campaign=android_app_invite

固定のUTM source/medium/campaignを通常のストアURLに追加し、Play側にも公開キャンペーン情報を渡す。個人情報や位置、保存トークンは付けない。Play Consoleの[公式UTM source/campaign定義](https://support.google.com/googleplay/android-developer/answer/9859173?hl=en)に従う。Install Referrer SDKやfirst-launch帰属の実装は追加しない。

## 表示・頻度・操作

- Android UAかつ既知の通常ブラウザ、display-mode browser、トップレベルのページだけ。Android Chrome形式のGooglebotを含む既知crawler、wv / Version 4.0、既知SNS内ブラウザ、Capacitor、MADO_NATIVE_APP、embedded marker、iframe、standaloneを除外する。bot除外は案内だけで、主要本文は同一。
- UA等はbest effort。インストール済みでも通常ブラウザを開けば表示し得る。未対応のinstalled-related-apps APIを未インストール確認済みと扱わない。双方向関連付けが必要なAPIやネイティブ側変更は追加していない。
- 初回描画前は既存の抑止を読み、短命の別キーで保存可否だけ確認する。未閲覧のページ読み込み・再訪では7日間の抑止を記録しない。案内が可視タブのviewportに50%以上入った時点で7日間を開始し、表示イベントの閾値も同じにする。解析同意なしでもUIの抑止を保存する。IntersectionObserverが利用不能なら非表示。
- 対応ブラウザではWeb Locksで同じoriginの閲覧確保を直列化し、待機後にも状態と可視性を再確認する。先に閲覧したタブを残し、他タブはstorageイベントで高さを保って非表示にする。Web Locks非対応では保存直前の再読込・書込・token照合によるbest effortで、極めて同時の表示まで完全排除とは約束しない。
- 閉じる／Playクリック後は期限なしの抑止状態を保存し、同じoriginのJA/EN・複数ページ・タブ・再訪で共有。保存データが消去されれば抑止もリセットされる。閉じるボタンの読み上げは「今後表示しない」を明示。
- 初期read/write失敗・quota・破損状態、閲覧確保時の保存／lock失敗は非表示。閲覧後にdismiss保存だけが失敗した場合もその文書は閉じたままで、保存済み7日間の抑止は残る。保存不能時にブラウザを跨ぐ永続抑止を保証することはできない。
- 閉じた直後・他タブの状態変更・BFCache復帰では同じ文書の高さを保持して不可視/inertにする。下の本文やリンクを動かさず誤タップを避け、閉じる操作後は既存フッターの最初のリンクへpreventScrollでフォーカスを移す。次のナビゲーションでは枠自体を表示しない。
- リンクは通常の同一タブPlay遷移。戻る操作で本文へ戻れる。タップ領域44px以上、自然な折返し、キーボード操作、focus-visible、print時非表示。

## SEO・速度・配布

本文main・title・canonical・meta・構造化データ・既存リンクは変更していない。新しい本文末asideだけを追加。JSなしと非対象端末では案内を表示しない。初期HTMLに存在し、遅延挿入しない。同期の小さな判定とCSS/ハンドラをビルド時にインライン化し、新しいJS/CSS/画像リクエスト・SDK・サービスワーカー変更を増やさない。

従前34bea16時点のHTML増分は約6.3KB、gzip増分はJA TOP 2,261B、EN TOP 2,153B、JA guide 2,670B、EN guide 2,410B（従前候補のローカル圧縮比較、実配信量ではない）。案内の原本は `scripts/shared/android-invite.mjs` と `android-invite-runtime.js`。`generate-android-invite.mjs` がJA TOPと日英guideを同期、既存TOP生成器がENをローカライズする。build/checkへ登録済み。`content-manifest.json`は既存生成器で再生成し、新たな実行時依存ファイルはない。Androidへの次回Web同期にも新規asset登録は不要だが、実APKの今回は未変更・未検証。表示除外はWebView/Capacitor markerで検証した。

Googleの[低侵襲な案内の指針](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)に沿う小さなHTMLストア導線。SEOへの影響ゼロや実端末全条件の検出を保証しない。

## 計測

既存 `MADO_ANALYTICS_DISABLED === false` とgtagがある場合だけ記録し、解析を初期化しない。既存のlocal preview/GA optout設定を保持。保存トークン、位置情報、ユーザーIDはイベントへ送らない。

- `android_app_invite_view`: 50%以上がviewportへ入ったときに文書中1回。thresholdだけでなくintersectionRatio >= 0.5を明示し、微小交差では計測もobserver切断もしない。IntersectionObserver未対応なら表示計測を省く。
- `android_install_click`: 既存のPlayクリックイベントを利用。`entry_source=android_browser_inline`、`cta_id=android_browser_inline`、language、page_contextで区別。**クリックであってインストール完了ではない。**
- `android_app_invite_dismiss`: 閉じる操作。

効果の分母は対象Android通常ブラウザ・実表示・Playクリックを別々に扱う。既存GAの「Web」全sessionsはAndroid通常ブラウザ限定の母数ではない。クリックからinstall/first launchを推定しない。「installが少ない」は依頼者の現状認識であり、今回新たに計測したinstall数ではない。運営残件13の既存観察にこの導線のsourceを加えればよく、新規Install Referrerや別解析基盤は追加していない。

## 従前34bea16までの検証

`npm run verify`成功（既存generator 41件・narration 450項目・service worker 2件、最終inviteテスト7群。site auditは0 errors / 既存5 warnings / 8 allowed）。`npm run build`による対象差分の再生成も不変。レビュー追補で小交差→50%以上の計測、Android Chrome形式Googlebot、MADO_NATIVE_APP、固定UTMを4ページで再確認する。保存済みスクリーンショットの見た目はこの追補でも変わらず、撮り直していない。

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

## 2026-10-05 未閲覧抑制の修正

未閲覧の初回読込だけで7日間抑止されるUX欠陥を修正。可視タブで50%以上の閲覧時だけ保存し、初回描画の枠・本文・CSS・Play URLは維持する。短命probeで保存可否を確認し、閲覧時にも再読込・保存・token確認を行う。Web Locksで同時タブの閲覧確保を直列化する。解析gateはイベント送信だけを制御し、同意なしでも7日間の抑止が働く。

全体build/verify成功（既存audit 0 errors / 5 warnings / 8 allowed）。単体9群、Edge実ブラウザ9群：日英TOP/guideの未閲覧reload、実際の50%以上閲覧、7日後期限、dismiss、実際の50%未満、解析なしの保存、320px・CLS <0.01、複数タブ、lock拒否、storage quota、Playと戻るを確認。CSSとasideは変更なし。旧計測値・スクリーンショットは上記の従前候補の根拠として保持する。新証跡はPC workspace seen-cooldown-browser-results.json / evidence/seen-cooldown-320.png。実機Chrome・TalkBack・本番配信性能は未検証。
