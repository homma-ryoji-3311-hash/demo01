# スライスレジストリ

`/board` が所有する全スライスの索引（採番・依存順・現在地）。**正本はこのファイル**（`docs/slices/README.md`）。

- **番号は不変・append-only**（ADR-0013）。一度採った `slice-NN` は振り直さない。分割・回帰で生じる新スライスは末尾に append する。
- **状態は書き込まない。** 「今どの工程か」は `/board` が git ブランチ・`approved: true`・指示書/PR の有無・gh から**推論して表示**する（このファイルには状態列を持たない）。
- 採番は工程2（`to-tickets` の縦切り分解 → `/board` 採番）で行う。
- 1スライスの受け渡しパケット（スライス指示書）は `docs/slices/slice-NN.md`。**このレジストリとは別物**（前者は全体の索引、後者は1スライス）。

| slice_id | slug | 依存 | 概要 | 由来 |
|---|---|---|---|---|
| slice-01 | auth | なし | Google OAuth ログイン・許可ドメイン検証・権限境界の強制（他人のreportへ403） | overview |
| slice-02 | report-draft | slice-01 | 報告下書き作成・自動保存（PATCH）・前回本文/前回要約の参照表示 | overview |
| slice-03 | summary-review | slice-02 | AI要約呼び出し（Summarizer抽象化層）・確認編集画面・要確認フラグ・degrade（AI失敗時も下書き保存可） | overview |
| slice-04 | report-confirm | slice-03 | 確定（confirmed化）・確定後不変（409）・必須項目欠落時422 | overview |
| slice-05 | report-history | slice-04 | 自分の確定済み報告の一覧・詳細閲覧（他人の報告は不可視） | overview |

> 由来の値：`overview`（基本設計由来）／`split-of-slice-NN`（分割）／`regression-of-slice-NN`（回帰・ADR-0014）。
