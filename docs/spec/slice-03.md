---
slice: slice-03-summary-review
approved: true
---

## AC-1 AI要約を呼び出すと構造化JSONが返る

- source: reference-mock
- **Given** 自分が作成したdraft状態の報告（本文あり）
- **When** `POST /reports/:id/summarize` を呼ぶ
- **Then** `200` と構造化JSON（`incidents/achievements/issues/skills`）が返る

## AC-2 AI要約が失敗しても下書きは保存できる（degrade）

- source: reference-mock
- 出典: report-quality-design.md §10.1「機能が落ちても報告は必ず出せる」
- **Given** Summarizer呼び出しが失敗する状況
- **When** `POST /reports/:id/summarize` を呼ぶ
- **Then** `502` が返るが、その後の `PATCH /reports/:id` による本文保存は引き続き可能（確定はできないが下書きは失われない）

## AC-3 他人の報告の要約は呼び出せない

- source: reference-mock
- **Given** 他人が作成した報告
- **When** `POST /reports/:id/summarize` を呼ぶ
- **Then** `403` が返る

## AC-4 要約結果の全項目を編集できる

- source: reference-mock
- 出典: spec.md §3.3「すべての項目を編集可能とする」
- **Given** 要約済みの報告（`ai_summary_json`あり）
- **When** `PATCH /reports/:id` に編集後の`ai_summary_json`を送る
- **Then** `200` と編集後の内容が返り、保存される

## AC-5 不確実・不足箇所には要確認フラグが付く

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: spec.md §3.3は「不確実・不足箇所には要確認フラグ」を要件とするが、フラグの判定基準（何をもって不確実/不足とするか）は未定義。Phase 1ではSummarizer実装側の判断に委ね、API契約としては「フラグを含むJSONを返せること」のみを検証する（判定ロジック自体は実装詳細としてこのスライスでは規定しない）。
- **Given** 不足・不確実な内容を含む本文（例：数値指標が本文に無い）
- **When** `POST /reports/:id/summarize` を呼ぶ
- **Then** `200` が返り、レスポンスJSONの該当項目に要確認フラグ相当の情報が含まれる

---

## 合成フィクスチャ（PM 所有）

**本番/実データは一切入れない**（憲法 §1-6）。迷ったら厳しい側（上位）に倒す。

| フィールド | 階層 | 例 | 備考 |
|---|---|---|---|
| ai_summary_json.incidents | L0 | `[]` | 非個人データ（構造化結果） |
| ai_summary_json.achievements | L0 | `["A社案件を無事完了"]` | 非個人データ |
| 要確認フラグ | L0 | `true`/`false` | 非個人データ |

---

## 画面要件（あれば）

- 対象画面: AI要約 確認・編集画面（overview.md §1）
- golden: **撮影不可**（reference-mockが文書ベースのため。`docs/memory-bank/decision-reference-mock-document-based-process-2026-07-14.md`）。実装後の見た目は別途手動確認する。

---

## スコープ外（明示する）

- 確定（confirm）・確定後不変（409）（slice-04）
- 対応案件への紐づけ・突合（Phase 2以降・phase2-design.md）
- 追加質問機能（AI再質問）（report-quality-design.md。本MVPでは未実装・overview.md §5で明示済み）
