# JA列車選択の路線図・車窓

非公開v6の車窓体験を、製品main `96252cb250428954955142ef761671083360abf0`（PR105）へローカル統合した候補です。公開・push・PR作成・Android更新は未実施です。

## 範囲

- JA `start.html`だけに、左の列車選択 → 路線図 → 車窓、右の常時timelineを追加。注意文はtimelineの一覧末尾、富士山ガイドは富士山選択時の関連詳細に配置。
- 初期は既存の東京起点のぞみ基準の経過分（上りは新大阪起点）。実便選択後は既存journeyの時刻を使用し、計算を複製しない。
- 元TOPの窓枠・写真フェード/移動・架線柱・路線描画・移動ノブを再利用。路線操作で手動固定、任意再開、reduced-motionと背景停止に対応。ネイティブ詳細の開閉を観測して巡回を一時停止し、詳細と景色の競合を防ぐ。
- 製品の保存列車復元・ライブ案内・通常リンク・canonical/robots・言語UIを維持。試作専用のGA停止、noindex、リンク差し替えは持ち込まない。
- JA専用マーカーは英語start生成前に除外。7言語startと公開TOP、既存計算5ファイルは基準mainとbyte一致を確認。

## 生成・配布

`scripts/generate-train-window-geometry.mjs`が現在のdata.js/track.jsから17駅・58景色の表示メタ情報を生成します。旧試作の写真URLや時刻表をコピーしません。写真・権利表示は製品runtimeの既存選択処理を使用します。

Web依存は`train-window-geometry.js`、`train-window-stage.js`、`train-window-preview.js`、`train-window-preview.css`。content-manifest生成元へ登録済み。hashは既存sync-asset-versionsで更新します。build/checkとJA限定境界のテストも既存コマンドへ登録しました。

Androidは未変更です。次回同梱する際にはmobile/scripts/sync-capacitor-web.mjsのtopLevelFiles等へ上記4依存を追加し、同期・参照欠落・www/native・配布物の照合が必要です。現在の公開/候補APKへ反映したとは扱いません。

## 検証

320/390/899/900/1024/1280/1440px × 通常/reduced-motionの14条件で配置、経過分/実時刻、A/E、巡回/手動固定、注意文、保存列車復元、詳細から戻る/取消を確認しました。

追加で動的motion変更、縦タッチ、詳細表示中の景色とhashの一致・巡回停止、既存Fuji focus回答、背景復帰時の手動維持、英語列車検索を確認。確認用URLには`?ga=off`を使用し、実GPS・自動音声・GA送信・欠落asset・JSエラーは0です。実機Android・Safariは未確認です。

ローカルでHTTPサーバーを起動して`start.html?ga=off`を開いてください。公開前には最新main（並行する富士川記事改修を含む）との競合を再照合し、必要なCI/公開承認を受けてください。v6のLibrary転送はPC側公式prepared操作が利用不可のため別途保留中です。
