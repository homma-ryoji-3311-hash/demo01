# hook 欠陥記録: slice ブランチ判定パターンが広すぎる（2026-07-13）

> ステータス: **修正適用済み（2026-07-13・PM 承認済み）**。回帰テスト緑:
> slice-branch-pattern.test.sh 15/15・unborn-branch.test.sh 4/4。
> unborn-branch（2026-07-12）と同じく hook 自身の欠陥のポストモーテム。CLAUDE.md 昇格候補ではない。

## 症状

リポジトリ初期化作業で便宜的に切った `feature/slice-bootstrap` ブランチが、
hooks の slice 作業ブランチ判定（glob `feature/slice-*`）に一致してしまい、

1. `stop-gate.sh` が「受け入れテスト未実行」としてターン終了をブロックした
   （実際には `acceptance/` も `backend/` も存在しない段階で、実行可能なテストが無い）。
2. 逆に `pre-tool-use-bash.sh` はこのブランチを正規の作業ブランチとみなし、
   commit / push を**許可**した（本来 slice 作業でないものに作業ブランチの権限が付いた）。

## 根本原因（5 Whys）

1. なぜ誤発動したか → `feature/slice-bootstrap` が `feature/slice-*` に glob 一致した。
2. なぜ一致したか → 判定パターンが「`slice-` の後ろに**番号があること**」を要求していない。
3. なぜ番号なしの名前が生まれたか → main への commit をブロックする hook を通すために、
   commit が許可される唯一のパターン `feature/slice-*` に**寄せて**ブランチを命名した
   （＝広いパターンが、意図しない命名を誘導する側に働いた）。
4. なぜ設計時に想定されなかったか → ブランチ名は `/pickup` が `feature/slice-NN` 形式で
   機械的に切る前提で、人間・エージェントが手で任意の名前を付ける経路が検証外だった。
5. なぜ検証外の経路が発生したか → 初回ブートストラップ（コミット0件からの git 初期化）が
   playbook 上の誰の作業にも割り当てられていなかった（unborn-branch 欠陥と同根のエッジケース）。

## イディオムの一般化された欠陥

ブランチ名が hooks/CI のディスパッチキーとして負荷を持つ設計では、判定パターンは
「採番規約と同じ厳しさ」で書く。glob `prefix-*` は『prefix に似た何か』を全部拾う。
`/board` の採番（番号必須）と判定パターン（番号不問）の間に緩みがあると、
その緩みに合わせた命名が発生する（Hyrum の法則のブランチ名版）。

## 影響範囲（横展開）

| ファイル | 現在のパターン | 実害 |
|---|---|---|
| pre-tool-use-bash.sh:18 | `feature/slice-*\|spec/slice-*`（case glob） | 番号なしブランチに commit/push 権限が付く（fail-open） |
| stop-gate.sh:14 | `feature/slice-*`（bash glob） | 非 slice 作業で Stop ゲート誤発動（今回の事象） |
| protect-paths.sh:43,69 | `spec/slice-*` / `feature/slice-*`（case glob） | 番号なしブランチに spec/feature 層の書込権が付く（fail-open） |
| statusline.sh:28 | `^(feature\|spec)/slice-0*([0-9]+)`（番号必須） | 影響なし。正しい実装の参照例が既存だった（unborn-branch と同じ内部不整合パターン） |

## 修正案（PM 承認後に適用）

方針: 判定を lib.sh の共通関数に一元化し、statusline.sh と同じ「番号必須」に統一する。
許容形式は `feature/slice-NN` / `spec/slice-NN`（`NN` = `/board` 採番の数字、先頭0可）と、
statusline が既に許容している説明サフィックス付き `feature/slice-NN-<slug>`。

### 1. lib.sh に共通判定を追加

```bash
# slice_branch_layer <branch> : 正規の slice 作業ブランチなら層名（feature|spec）を返す。
#   一致: feature/slice-01, spec/slice-2, feature/slice-0012-login-form
#   不一致（空文字を返す）: feature/slice-bootstrap, feature/slice-, main, ""（unborn/detached）
#   採番規約（/board・ADR-0013）と同じ厳しさで判定する。番号のない slice- は作業ブランチではない。
slice_branch_layer() {
  if [[ "${1:-}" =~ ^(feature|spec)/slice-0*[0-9]+(-[A-Za-z0-9-]+)?$ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
  fi
}
```

### 2. pre-tool-use-bash.sh（L16-19）

```diff
 WORK_BRANCH=0
-case "$BRANCH" in
-  feature/slice-*|spec/slice-*) WORK_BRANCH=1 ;;
-esac
+[[ -n "$(slice_branch_layer "$BRANCH")" ]] && WORK_BRANCH=1
```

### 3. stop-gate.sh（L14）

```diff
-[[ "$BRANCH" == feature/slice-* ]] || exit 0
+[[ "$(slice_branch_layer "$BRANCH")" == "feature" ]] || exit 0
```

### 4. protect-paths.sh（L42,43,69）

```diff
+LAYER="$(slice_branch_layer "$BRANCH")"   # feature / spec / 空文字
-case "$BRANCH" in
-  spec/slice-*)
+case "${LAYER:-$BRANCH}" in
+  spec)
     ...
-  feature/slice-*)
+  feature)
     ...
```

`main|master)` と fail-closed の `*)` はそのまま。`SLICE="${BRANCH#spec/}"` も変更不要。
番号なしの `feature/slice-bootstrap` は今後 `*)` に落ち、層管理対象への書込が
fail-closed でブロックされる（unborn-branch 修正で入れた default-deny がそのまま効く）。

### 5. 回帰テスト追加

`.claude/hooks/tests/slice-branch-pattern.test.sh`（unborn-branch.test.sh と同形式・依存なし）:

- `feature/slice-01` / `spec/slice-2` / `feature/slice-0012-login-form` → 作業ブランチ（commit allow）
- `feature/slice-bootstrap` / `feature/slice-` / `chore/init` → 非作業ブランチ（commit block・stop-gate skip）
- 空文字（detached） → 非作業ブランチ

## 意図的な挙動変更（承認時に確認すべき点）

- **番号なしブランチはエージェントから commit / push とも不可になる。** ブートストラップ級の
  git 初期化作業は今後エージェントに担わせず、統合役が Windows 側の手作業で行う
  （2026-07-13 の教訓: Cowork の VM から git 運用は成立しない。この運用と整合）。
- 例外パターン（`chore/*` 等をエージェントに許可する）は今回**追加しない**。
  必要になったらそれが2回目のストライク＝その時に設計する。

## 教訓（次に活かす）

- ブランチ名がディスパッチキーになる場合、判定パターンは採番規約と同じ厳しさで書く
  （glob の `*` に英数字以外の意味的制約を担わせない）。
- 同じ判定を複数 hook に散らさない。lib.sh に一元化する（unborn-branch の教訓の再適用）。
- 「hook を通すための命名」が観察されたら、それはパターンの緩みのシグナル。
