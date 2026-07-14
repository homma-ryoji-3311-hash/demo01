---
slice: slice-04-report-confirm
approved: true
---

## AC-1 報告を確定できる

- source: reference-mock
- 出典: phase1-plan.md #7「『確定』でstatus=confirmedとしてREPORTSに格納」
- **Given** 自分が作成したdraft状態の報告（必須項目が揃っている）
- **When** `POST /reports/:id/confirm` を呼ぶ
- **Then** `200` と`status: confirmed`になった報告が返る

## AC-2 確定後は不変（編集不可）

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: reference-mock（phase1-plan.md #7 DoD「確定後は不変として保存される」）は不変を要件とするが、違反時のAPIステータスコードは未定義。CONTEXT.mdの「確定後不変」原則をAPIレベルで守るため409を新規決定。
- **Given** confirmed状態の報告
- **When** `PATCH /reports/:id` で本文を更新しようとする
- **Then** `409` が返り、内容は変更されない

## AC-3 確定済みの報告は再確定できない

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: AC-2と同根（確定は一方向の状態遷移）。二重確定を防ぐため409を新規決定。
- **Given** confirmed状態の報告
- **When** `POST /reports/:id/confirm` を再度呼ぶ
- **Then** `409` が返る

## AC-4 必須項目が欠落した状態では確定できない

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: reference-mockは「必須項目」の具体的な定義を持たない。Phase 1では本文（raw_text）が空のまま確定しようとするケースを必須項目欠落として扱う（CLAUDE.md §6のバリデーション原則に沿い422）。
- **Given** 本文が空のdraft状態の報告
- **When** `POST /reports/:id/confirm` を呼ぶ
- **Then** `422` が返り、confirmedにならない

## AC-5 他人の報告は確定できない

- source: reference-mock
- **Given** 他人が作成した報告
- **When** `POST /reports/:id/confirm` を呼ぶ
- **Then** `403` が返る

---

## 合成フィクスチャ（PM 所有）

**本番/実データは一切入れない**（憲法 §1-6）。迷ったら厳しい側（上位）に倒す。

| フィールド | 階層 | 例 | 備考 |
|---|---|---|---|
| status | L0 | "confirmed" | 非個人データ |

---

## 画面要件（あれば）

- 対象画面: AI要約 確認・編集画面の「確定」操作（slice-03と同一画面。golden差分はボタン押下後の確定表示のみ）
- golden: **撮影不可**（reference-mockが文書ベースのため。`docs/memory-bank/decision-reference-mock-document-based-process-2026-07-14.md`）。実装後の見た目は別途手動確認する。

---

## スコープ外（明示する）

- 自分の確定済み報告の一覧・詳細閲覧（slice-05）
- 報告サイクル・締切・未報告管理（Phase 2以降・phase2-design.md）
