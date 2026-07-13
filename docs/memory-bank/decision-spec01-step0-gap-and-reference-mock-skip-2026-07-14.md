# 運用決定記録: 工程0未完了への対応（reference-mock緑確認の省略・backend/frontend零状態の後付け作成）（2026-07-14）

> ステータス: **決定・記録済み（`/spec 01` 実行中に発覚・ユーザー本人＝PM相当がその場で判断）**。
> CLAUDE.md 本体への昇格は未実施（単発の運用判断のため。工程0手順自体の恒久的な見直しは別途検討）。

## 背景

`/spec 01`（slice-01-auth）の Phase B を実行したところ、`docs/playbook.md` の Step 0（リポジトリ準備）が
実際には完了していないことが発覚した。

1. `reference-mock/` は `spec.md`・`phase1-plan.md`・`phase2-design.md`・`report-quality-design.md` の
   4本の設計ドキュメント（`.md`）のみで構成されており、**実行可能な参照モック（FastAPI 等）が vendor されていない**
   （playbook.md Step 0 #2 が未完了）。
2. `backend/` `frontend/` ディレクトリ自体が存在せず、`test-harness.runtime.json` もどこにも無い
   （Step 0 #4 が未完了）。

この2点は工程1（基本設計）を書き起こす際にも `docs/design/overview.md` §2 で既に一度指摘済みの構造的欠落
（API定義がreference-mockに無い件）と同根で、根本原因は同じ：**この検証用リポジトリでは Step 0 が
ドキュメント作成止まりで終わっており、実行可能な資材の準備までは行われていなかった**。

## 決定

Phase B をブロックしたまま止めるのではなく、ユーザー（PM相当）の都度判断で以下の2点を実施し、
`/spec` の意図（「テストが赤いことを機械的に証明してから下流に渡す」）を別経路で満たした。

### 1. 参照モックでの緑確認ステップを省略

- 「参照モックで緑を確認する」（Phase B 手順4）は、実行対象が存在しないため技術的に不可能。
- 省略し、翻訳（`acceptance/tests/slice-01-auth.spec.ts`）の正しさは「PMが受入基準を読んで妥当性を判断する」
  ことで代替する。将来 reference-mock が実行可能になった場合はこのステップを復活させる。

### 2. backend/frontend の零状態スキャフォルドを `/spec` 実行中に作成

- 本来 Step 0（担当: AIアーキ・一度きり）で用意されているべきものだが、無いと Phase B 手順6
  「backendで赤を確認する」が実行できないため、その場で作成した。
- ブランチの都合上（`spec/*` から `backend/` `frontend/` は書けない・ADR-0004）、
  別ブランチ `feature/slice-01` を切って零状態（`GET /health` のみ実装・認証系ルートは未実装）を作成し、
  そこで `harness_start` → `acceptance/`（`spec/slice-01` 側の内容を `git worktree` で一時的に参照）→
  全4件赤（404）を確認した。
- `feature/slice-01` はこの時点では PR 化していない。零状態スキャフォルドは次の `/implement`（工程6）の
  土台としてそのまま使う想定。

## 影響範囲

- 今後の他スライス（slice-02〜05）でも同じ2点（reference-mock不在・backend/frontend不在は解消済みだが
  test-harness.runtime.json の場所や規約）に注意する必要がある。ただし backend/frontend の零状態は
  本記録により今後のスライスでは既に存在するため、この特定の欠落は slice-01 限りの一度きりの対応。
- `reference-mock` 緑確認の省略は、reference-mock が実行可能になるまで全スライスに継続適用される可能性が高い。
  再発時にこの記録を都度参照するのではなく、2回目が発生した時点で `docs/playbook.md` 自体の恒久的な
  改訂（Phase B の手順4を「reference-mockが実行可能な場合のみ」と条件付ける等）を検討する
  （CLAUDE.md §10 の2ストライクルール）。

## 教訓（次に活かす）

- Step 0 の完了は「ドキュメントがある」では確認できない。**実行できるか**（`harness_start` が通るか）を
  Step 0 完了の判定基準にすべきだった。今回のように下流工程（`/spec` Phase B）で初めて発覚するのは遅い。
- `/board` の初回採番時に一度立ち止まって Step 0 の実行可能性チェックリストを確認していれば、
  `/spec` の途中で分岐判断を挟まずに済んだ可能性が高い（[[hook-defect-slice-pattern-too-broad-2026-07-13]]
  でも「検証外の経路が発生した根本原因は、初回ブートストラップが誰の作業割当にもなっていなかったこと」
  という同型のパターンが出ている）。
