# Shinkansen Meets Fuji

日本語名: 新幹線 meets 富士山

東海道新幹線の乗車情報と座席から、富士山が見える目安時刻を案内する静的MVPです。GitHub Pagesでそのまま公開できます。

## MVP features

- 日本語 / English 切り替え
- 上り / 下りの切り替え
- 「Nozomi / Hikari / Kodama + 号数」の列車カード選択
- 一部列車番号の内蔵時刻表データによる出発時刻検索
- 選択した列車ごとの富士山側（進行方向の右側 / 左側）表示
- 主要駅ごとの富士山見どころ時間帯表示
- 新富士駅前後を中心としたアラート予定表示
- ページを開いている間の5分前 / 1分前アラート
- 対応ブラウザでの通知テスト
- PWA対応: ホーム画面追加、アプリシェルと時刻表データのキャッシュ

## Run locally

`index.html` をブラウザで開くだけでも動きます。PWAのService Workerを確認する場合は、GitHub Pagesまたはローカルサーバー経由で開いてください。GitHub Pagesでもそのまま公開できます。

## PWA

`manifest.json` と `sw.js` を追加しています。対応ブラウザではホーム画面に追加でき、アプリ本体、背景画像、時刻表データをキャッシュします。

ブラウザを完全に閉じた状態で指定時刻にPush通知を送るには、別途Push送信用のサーバーや保存先が必要です。このMVPでは、PWAの土台とオフライン/弱電波対策までを実装しています。

## Publish with GitHub Pages

1. GitHubにこのリポジトリを push
2. Repository settings を開く
3. Pages を選択
4. Source を `Deploy from a branch` に設定
5. Branch を `main`、folder を `/root` に設定

公開URLは通常、次の形式になります。

```text
https://YOUR_USER_NAME.github.io/shinkansen-meets-fuji/
```

## Notes

このMVPの時刻は簡易推定です。列車カードに表示される時刻は内蔵データに基づきます。アラートはページを開いている間だけ動作します。実サービス化では、正式な時刻表データ、遅延情報、天気API、PWA通知を段階的に追加する想定です。

富士山の見どころ時間帯は、三島〜新富士と新富士駅前後を中心に、列車または乗車駅の出発時刻から推定しています。下りは東京から約45分、品川から約38分、新横浜から約26分、上りは新大阪から約105分、京都から約90分、名古屋から約50分を目安にしています。

列車番号検索は、JR東海公式の基本時刻表と公開されている関連時刻表をもとにした内蔵データから始めています。基本時刻表に掲載されない臨時列車、運転日注意、季節変更、遅延は反映されません。

## Timetable data

時刻表データは `data/timetable.json` に保存しています。ブラウザで直接開いても動くように、同じ内容の `data/timetable.js` も用意しています。アプリ本体の `app.js` はこの保存済みデータを読み込み、列車カード、始発時刻、主要駅ごとの見どころ時間帯を表示します。

現在の保存データは、JR Eastの東京駅下り、品川駅下り/上り、新横浜駅下り/上りの時刻表リンクから取得した546列車、32駅分です。

データを更新したら、次の検証を実行できます。

```text
node scripts/validate-timetable.mjs
```

参考:

- [JR東海 Shinkansen Timetable 2026.3.14-](https://global.jr-central.co.jp/en/info/timetable/index.html)
- [JR East Tokyo Station Tokaido-Sanyo Shinkansen timetable](https://timetables.jreast.co.jp/en/2605/timetable/tt1039/1039010.html)
- [JR East Shinagawa Station Tokaido-Sanyo Shinkansen inbound timetable](https://timetables.jreast.co.jp/en/2605/timetable/tt0788/0788020.html)
- [JR East Shin-Yokohama Station Tokaido-Sanyo Shinkansen outbound timetable](https://timetables.jreast.co.jp/en/2605/timetable/tt0888/0888010.html)
- [JR East Shin-Yokohama Station Tokaido-Sanyo Shinkansen inbound timetable](https://timetables.jreast.co.jp/en/2605/timetable/tt0888/0888020.html)
- [JR東海ツアーズ 東海道新幹線の座席選び完全ガイド](https://travel.jr-central.co.jp/plan/tokushu/shinkansen/seat/)
- [新幹線から富士山が見える座席やタイミング](https://dash-dash-dash.jp/archives/37180.html)
- [JR東海 N700S車両で毎日運行する予定の列車](https://railway.jr-central.co.jp/pwd/_pdf/N700S-every.pdf)
- [JR西日本 東海道・山陽新幹線 車いす用フリースペース設置の列車](https://www.jr-odekake.net/railroad/service/barrierfree/pdf/wheelchair_space_shinkansen_260314.pdf)
