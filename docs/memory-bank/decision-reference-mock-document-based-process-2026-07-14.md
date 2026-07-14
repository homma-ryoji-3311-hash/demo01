# 運用決定記録: reference-mock が文書のみの場合の恒久プロセス（2026-07-14）

> ステータス: **決定・`/spec` スキルおよび `docs/playbook.md` へ反映済み（PM 承認済み）**。
> 2ストライク目（[[decision-spec01-step0-gap-and-reference-mock-skip-2026-07-14]] が1回目）のため、
> per-slice のメモではなく `.claude/skills/spec/SKILL.md` 本体・`docs/playbook.md` 本体を改訂した
> （CLAUDE.md §10「破られ続けるルールは hook/CI/正本ドキュメントへ昇格させる」）。

## 背景

このリポジトリの `reference-mock/` は、CLAUDE.md・ADR-0005 が前提とする「vendor 済みの実行可能な
参照モック（例: FastAPI、`:8000` で起動可能）」ではなく、**設計ドキュメント4本（`.md`）のみ**で構成されている。
確認の結果、**実行可能な Repo Base（`staff-report-system`）の実体はそもそも存在せず、この4ドキュメントが
事実上の answer key である**ことが確定した（ユーザー本人＝PM相当が確認）。

この事実は slice-01 の `/spec` Phase B 実行時に一度発覚し
（[[decision-spec01-step0-gap-and-reference-mock-skip-2026-07-14]]）、その場しのぎで
「PM判断によりPhase Bの参照モック緑確認ステップを省略する」という運用で対応した。しかし
同じ分岐判断を毎スライスその場で下すのは 2ストライクルール（CLAUDE.md §10）に反するため、
本記録をもって `/spec` スキル本体・`playbook.md` 本体を恒久的に改訂した。

## 決定：`/spec` Phase B の恒久的な分岐

`.claude/skills/spec/SKILL.md` Phase B 手順4・5 と `docs/playbook.md` 工程4 に、以下の分岐を追記した。

- **reference-mock が実行可能コードの場合**（本来の設計通り）: 従来通り `harness_start(app_dir="reference-mock")`
  → 緑確認 → golden 撮影。
- **reference-mock が設計ドキュメントのみ等、実行不可能な場合（「文書ベース確認」）**:
  - 緑確認ステップは技術的に実行できないため省略する。
  - 代わりに **PM が `docs/spec/slice-NN.md` の各受入基準を reference-mock の該当ドキュメント箇所と
    突き合わせて整合を確認したこと**を Phase B 報告に明記する。
  - golden は撮影不可。仕様表の「画面要件」に理由を明記し、実装後の見た目は別途手動確認する。
  - `docs/spec/slice-NN.md` の `source:` 判定には影響しない（reference-mock文書に書いてあれば
    引き続き `source: reference-mock`、無ければ `source: PM` のまま）。

## 検討した代替案（採用しなかった理由）

**「自分たちで最小の実行可能な reference-mock を実装する」案は採用しなかった。**
理由: reference-mock の信頼性は「既存の独立した正解実装」であることに由来する（ADR-0001の黒箱前提）。
自分たちで実装すると、その実装自体が正しいかを担保するものが無く、結局これから作る `backend/` と
同じものを二重に作ることになる（工数の割に answer key としての価値が薄い）。ドキュメントベースの
確認に正式に倒す方が、このリポジトリの実態（第一目的は方法論の確立であり機能前進ではない）に合う。

## 影響範囲

- 今後の全スライス（slice-02〜）で、この分岐がデフォルトの扱いになる。per-slice で再度グリルし直す必要はない。
- `reference-mock/` が将来 vendor される場合は、本項目の分岐条件（「実行可能コードかどうか」）により
  自動的に本来の緑確認フローへ戻る。スキル記述の変更は不要。

## 教訓（次に活かす）

- 「その場しのぎの省略」を2回目で正式なプロセス改訂に昇格させる 2ストライクルールが、今回もそのまま機能した
  （[[hook-defect-slice-pattern-too-broad-2026-07-13]] の hook 昇格と同型）。
- 前提（reference-mock が実行可能）の検証は、工程0またはそれ以前の段階で一度だけ確認しておくべきだった。
  下流の `/spec` 実行時に毎回発覚してから対応するのは遅い。
