# 列車選択の日時・日照・Disneyを全8言語へ

2026-10-19。実装済み・未公開。親の公開判断用。製品push、main反映、タグ、Pages/Sites配信、Android変更は行わない。

## 原因と変更

公開PR115/bb447aebの機能は、日本語の路線図・車窓プレビューと同じ `JA-TRAIN-WINDOW` ブロック内にあった。翻訳生成時の `stripJaTrainWindow()` が日時入力、太陽計算、Disney予測のJS/CSSまで削除していた。既存テストも翻訳版での除外を合格としていた。

路線図・車窓プレビューは日本語の既存仕様を保持。日時/日照/Disneyの依存スクリプト、CSS、計算注記をブロック外へ出し、英語とそれを元にする6言語へ正規の生成経路で展開した。新しい実行資産は追加していない。

`journey-light-events.js` は8言語の自然な文言、アクセシビリティラベル、時刻接尾辞、駅名、日付表記、注意書きを持つ。日付は各言語の短い数値表記、時刻はJSTの24時間表記。日の出/日の入りとDisneyは時刻が先頭、日本語は「頃」。日中/夕方の文字ラベルは追加しない。太陽位置・Disney計算式と時刻表データは変更しない。

Disneyは `encounter` の時だけフィルタ下案内とカードを表示し、案内からカードへ移動、カードから各言語の既存Disney詳細へ遷移する。該当なし・運行未確定・自分がDisney列車・無効日付は説明やカードを出さない。既存の東西方向の座席側、日付URL保存、JST「現在」、翌日の便を自動追加しない仕様を維持する。

日本語の説明欄に残っていた「独立試作・本番多言語を変更していない」という実態と矛盾する文章を削除した。

生成物は8版start、utility辞書に追加した静的計算注記1文、6版utility-dataとそのhash参照、manifest。各言語の他ページは辞書hash参照のみ。SEO/index/canonical/hreflangは8版とも基準から同一。

## 検証

- 対象回帰テスト9件合格。
- 8言語 × 320/390/1440px × 6ケース = 144条件合格。日の出（10/31のぞみ1）、日の入り（10/17のぞみ191）、Disney西行/東行（のぞみ1/2）、該当なし、運行未確定。
- 全言語で日付変更、無効日付、時刻表以前の日付、JST現在へのリセットを確認。ブラウザのtimezoneはAmerica/Los_Angelesに設定し、JSTを維持することを確認。
- 全言語320pxの追加8条件で夕暮れ/夜の背景と3段階以上の連続色変化を確認。横はみ出し、対象領域の内部はみ出し、JS例外、ローカル404、日本語仮名残りは0。
- 全言語で案内→カードのフォーカス移動、各言語Disney詳細への実遷移、戻る操作での日付と列車の復元を確認（追加8条件）。
- utility検証: 56ページ、6辞書、12動的ページ、444ナレーション、予報6ケース合格。
- ブラウザ証跡は作業領域の `qa/full-results.json`、`qa/background-results.json`、`qa/link-results.json` と新規スクリーンショット80枚。外部通信を遮断したローカルEdgeで実施。日本語/英語/独語/繁体字/韓国語の320px画像を目視確認。実機Safariは未確認。
- 全体 `npm run verify` 合格（終了コード0）。構文・内容・言語・導線・時刻表・生成物再現性・manifest・全テスト・サイト監査・diff検査を通過。監査は0 errors / 既存5 warnings / 10 allowed。ログは作業領域の `verify.log`。

## 英語改善リリースとの境界

基準は `9f7927bf6bf26e13e52f8ffff26b120d7fddc34c`。別childの英語改善候補 `15bea11c0199b5d0e55f826e42e9d37729347b53` / PR120を読み取り確認。そちらは日時/日照/Disneyの実行JSを変更しない。

当方と候補の `start.html`、`scripts/generate-spot-pages.mjs` は基準を使った3方向merge検査で競合なし。6辞書の追加キーも意味上の競合なし。証跡 `compatibility/results.json`。

公開前の統合はPR120の**最終main SHA**を基準とし、今回の生成元・辞書・テストを載せて正規生成とverifyを行う。旧基準の生成HTML/utility-data/manifestを新リリースへ丸ごと上書きしない。今回のブランチを英語改善の本番公開へ混ぜない。

## 運営共有

専用作業票はprivate `michikusa-operations` の `codex/start-light-disney-locales-1019` へpush済み。Draft PR作成は自動承認レビューにより拒否された（特定PRを開く明示承認が不足との判断）。PRは作成されておらず、main共有は未了。再試行・別経路でのmain書込は行わない。ローカル最終報告と専用記録を親へ渡す。

## 追加依頼後の再開

上記は初回報告時点の履歴。親からユーザーの「結果はGitHub共有」「非公開ログのmain取り込みも都度質問不要」という新しい明示指示を受領し、未実行だったPR操作を一度だけ再試行して成功した。運営PR58は通常merge済み、main `105169c0b472937aa77d3eca4f9bf01e21d02571` を再読込し、元PC commitと報告SHA256を照合した。運営共有のブロッカーは解消。製品は未公開。

続いて英語PR120のPages公開成功を確認（main `50cdd3a1aedc0a7a22d4f1d41218d3f49899a5b9`、Pages `39273455728`）。元成果 `335a216f` を元ブランチに保持し、`codex/start-light-disney-locales-integrated-1019` へ当該公開mainから生成元・テストの差分だけを3方向適用、6辞書は追加キーだけ合流した。生成物を正規経路で再生成し、追加検証を実施する。追加検証の結果は運営作業票へ記録する。

追加検証は160条件すべて合格、新規画像80枚。公開英語改善の主要15ファイル、英語start補助文、全8版SEO、太陽/Disney計算本体の保持を照合した。新main上でも全体 `npm run verify` 合格、監査0 errors / 既存5 warnings / 10 allowed。証跡 `qa-integrated/`、`integrated-boundaries.json`、`integrated-qa-summary.json`、`integrated-verify.log`。製品は引き続き未公開。
