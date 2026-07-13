# hook 欠陥記録: unborn branch でブランチ判定が壊れる（2026-07-12）

> これは **CLAUDE.md 昇格候補（pending-*）ではない**。hook 自身の欠陥のポストモーテムで、
> Harness-Keeper の棚卸し対象。CLAUDE.md §10「破られ続けるルールは hook へ昇格」の**逆**
> ＝「hook そのものの欠陥」を記録し、再発を防ぐためのもの。修正は適用済み・回帰テスト緑。

## 症状

ハーネス試走の初回ブートストラップ（リポジトリにコミットが1件も無い状態）で、
実際は `feature/slice-00` にいるのに `pre-tool-use-bash.sh` が「作業ブランチではない」と
誤判定し、`git commit` をブロックした。

## 根本原因（5 Whys）

1. なぜブロックされたか → `BRANCH` 変数が `feature/slice-00` ではなく `"HEAD\nunknown"`
   という壊れた2行の値になっていた。
2. なぜ壊れたか → ブランチ判定に `$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')`
   を使っていた。
3. なぜ壊れるか → `git rev-parse --abbrev-ref HEAD` は unborn branch（コミット0件）では
   **stdout に `HEAD` を出力した上で exit 128** する、という git の癖がある（git 2.34.1 で再現）。
4. なぜ `||` 後段が混入するか → 直前が exit 128 なので `|| echo 'unknown'` が発火し、
   `HEAD`（1コマンド目の stdout）と `unknown`（2コマンド目の stdout）が両方
   `$(...)` に取り込まれ2行に連結される。case のどの節にもマッチせず `WORK_BRANCH=0`。
5. なぜ設計時に想定されなかったか → 「ブランチが存在する状態」を前提にテスト・設計され、
   「コミット0件のリポジトリの初回ブートストラップ」というエッジケースが検証対象外だった。

## イディオムの一般化された欠陥

`$(cmd 2>/dev/null || echo 'fallback')` は「**stdout を出しつつ非ゼロ終了するコマンド**」に対して
壊れる。フォールバックが上書きではなく追記になる。`git branch --show-current` は unborn で
正しいブランチ名を返し、失敗/detached では**何も出さず**空文字になるため、この地雷を踏まない。

## 影響範囲（横展開）

| ファイル | 旧フォールバック | unborn での実害 |
|---|---|---|
| pre-tool-use-bash.sh | `echo 'unknown'` | commit/push 全面ブロック（今回の事象） |
| protect-paths.sh | `echo 'unknown'` | ブランチ別書込制限（ADR-0004）が素通り = **fail-open** |
| stop-gate.sh | `echo ''` | Stop ゲート無効化（安全側だが意図外） |
| statusline.sh | （`branch --show-current` 使用） | 影響なし。正しい実装の参照例が既存だった（内部不整合） |

発生条件は「リポジトリ全体でコミットが1件も無い瞬間」だけと狭いが、初期ブートストラップで必ず踏む。

## 適用した修正

1. `lib.sh` に共通関数 `current_branch()`（`git branch --show-current`）を追加。
2. 上記3 hook の `rev-parse --abbrev-ref HEAD` を `current_branch()` に統一（statusline.sh と実装を揃えた）。
3. `protect-paths.sh` のブランチ層 `case` に **default-deny の `*)` 節**を追加。
   detached HEAD 等で空文字になったとき `backend/ frontend/ acceptance/ docs/spec/` への
   書込を fail-closed でブロックし、`show-current` 化だけでは残る detached HEAD の fail-open を封鎖。
4. 回帰テスト追加: `.claude/hooks/tests/unborn-branch.test.sh`（依存なし・4ケース緑）。

## 教訓（次に活かす）

- hook のブランチ判定は `git branch --show-current` に統一する（`rev-parse --abbrev-ref HEAD` を使わない）。
- ポリシー強制の分岐は「認識できない値＝fail-closed」を既定にする（`case` に必ず `*)` を置く）。
- hook の新規/改修時は unborn・detached・通常の3状態を回帰テストで踏む。
