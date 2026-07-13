---
name: spec
description: 仕様表を PM との grill で作り（Phase A）、承認後に acceptance/ の受け入れテストと golden へ翻訳する（Phase B）。参照モックで緑・backend で赤を確認して PR を出す。spec/* ブランチ専用。叩くのは PM。Use when the PM runs /spec with a slice id.
disable-model-invocation: true
---

# /spec <slice>

## 禁止事項（最初に読む）

- **`feature/*` ブランチで叩かれたら即停止。** `acceptance/` を実装ブランチから触らせない（ADR-0004）。
- **Phase A の承認なしに Phase B へ進まない。** hook がブロックする。回避策を探さない。
- **grill の答えを AI が自分で埋めない。** 質問して、PM の返答を待つ。
- 実装（`backend/` `frontend/`）を書かない。ここは仕様ブランチ。
- main へ push しない。マージは統合役。

---

## Phase A：仕様表（`docs/spec/slice-NN.md` が無い、または `--regrill`）

**性質：判断業務。** 手順ではなくヒューリスティクス。PM に質問しながら進める。

1. `docs/design/overview.md` と `docs/slices/README.md` から**このスライスの範囲**を読む。
2. `reference-mock/` の該当箇所を読み、Given/When/Then の**下書き**を作る（read-only）。
3. `grill-with-docs` で **PM に質問する**。少なくとも次を潰す：
   - 受入基準はこれで過不足ないか（**≤3〜5**。超えたらスライス分割を提案する）
   - このステータスコードは**仕様か、モックの実装都合か**（例: 422 は仕様。500 は実装都合）
   - 合成フィクスチャの各フィールドは **L0 / L1 / L2** のどれか
   - `CONTEXT.md` の用語とズレていないか（ズレたら用語を先に直す）
   - **参照モックに無い挙動**が要るか（＝ここだけが本当の設計）

   > **PM が「未定」と答えたら、AI が埋めない。** 未定を残したまま `approved: true` にはしない。
4. `docs/spec/_template.md` を雛形に `docs/spec/slice-NN.md` を書く。**各受入基準に `source:` を必ず付ける。**

```markdown
---
slice: slice-01-report-create
approved: false        # ← PM が true にするまで Phase B に進めない
---

## AC-1 報告を1件保存できる
- source: reference-mock
- Given 空でない報告本文
- When  POST /api/reports に送る
- Then  201 と作成された report id が返る

## AC-2 空の本文を拒否する
- source: reference-mock
- Given 空の報告本文（""）
- When  POST /api/reports に送る
- Then  422 が返る

## 合成フィクスチャ
| フィールド | 階層 | 例 |
|---|---|---|
| body | L0 | "本日の報告" |
```

5. **停止して PM に提示する。**「`approved: true` に変えてから `/spec <slice>` を叩き直してください」と伝える。

> **`source: reference-mock` ばかりなら健全。`source: PM` の項目こそ重点レビュー対象**——それが唯一の「新しく決めたこと」だから。

---

## Phase B：翻訳（`approved: true` を確認してから）

**性質：壊れやすい操作。順序固定。フラグ追加禁止。**

1. `spec/slice-NN` ブランチを切る（無ければ）。
2. 仕様表を読む。`approved: true` でなければ**停止**。
3. AI が `acceptance/` へ翻訳する。接続先は必ず `process.env.ACCEPTANCE_BASE_URL` から取る。
   最新 API は Context7 に聞く。思い出しで書かない。
4. **参照モックで緑を確認する。** ← 翻訳が正しい証明
   `harness_start(app_dir="reference-mock")` → ready → `ACCEPTANCE_BASE_URL=http://localhost:8000` でテスト実行。
   **赤なら翻訳のバグ。実装のせいにしない。停止して報告する。**
5. **golden スクショを撮る。** 参照モックの画面を `acceptance/golden/` へ。**実装より先に撮る**（後で撮ると実装が仕様を定義する）。
6. **backend で赤を確認する。** ← 下流に渡せる証明
   `harness_start(app_dir="backend")` → `ACCEPTANCE_BASE_URL=http://localhost:3000` でテスト実行。
   **緑になったら停止。** 実装済みか、テストが何も検証していないかのどちらか。
7. `harness_stop` してから PR を作る（GitHub MCP）。`acceptance/` に触るので**常に重量ゲート**。

## 報告フォーマット（証拠ベース）

```
## Phase: A / B
## 受入基準: <n>個（source: PM <n>件 / reference-mock <n>件）

## 参照モックでの結果（Phase B）
$ ACCEPTANCE_BASE_URL=http://localhost:8000 npx playwright test ...
<生出力>  → 緑であること

## backend での結果（Phase B）
$ ACCEPTANCE_BASE_URL=http://localhost:3000 npx playwright test ...
<生出力>  → 赤であること

## golden
- acceptance/golden/<name>.png

## 次のアクション
PM: 重量ゲートで diff を読む → 統合役がマージ → /brief <slice>
```

次は `/brief <slice>`。
