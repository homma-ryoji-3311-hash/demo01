---
slice: slice-05-report-history
approved: true
---

## AC-1 自分の確定済み報告の一覧を取得できる

- source: reference-mock
- 出典: phase1-plan.md #8「自分の過去報告一覧と詳細（確認のみ）」
- **Given** confirmed状態の報告を複数件持つユーザー
- **When** `GET /reports` を呼ぶ
- **Then** `200` と自分のconfirmed状態の報告一覧が返る

## AC-2 draft状態の報告は一覧に含まれない

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: phase1-plan.md #8は「確定済み」を要件とするが、draft状態の扱いは明記なし。「自分の報告一覧」を確定済みのみに限定することを新規決定（下書きは編集途中のため履歴閲覧の対象外とする）。
- **Given** draft状態の報告とconfirmed状態の報告を両方持つユーザー
- **When** `GET /reports` を呼ぶ
- **Then** `200` が返り、一覧にはconfirmed状態の報告のみ含まれる

## AC-3 自分の確定済み報告の詳細を取得できる

- source: reference-mock
- **Given** 自分のconfirmed状態の報告
- **When** `GET /reports/:id` を呼ぶ
- **Then** `200` と報告の詳細（本文・AI要約）が返る

## AC-4 他人の報告は一覧にも詳細にも出ない

- source: reference-mock
- 出典: phase1-plan.md #8 DoD「自分の確定済み報告だけが一覧・閲覧できる」
- **Given** 他人が作成した報告
- **When** `GET /reports/:id` を呼ぶ
- **Then** `403` が返る（一覧`GET /reports`にも含まれない）

## AC-5 存在しない報告IDは404

- source: reference-mock
- **Given** 存在しないreport_id
- **When** `GET /reports/:id` を呼ぶ
- **Then** `404` が返る

---

## 合成フィクスチャ（PM 所有）

**本番/実データは一切入れない**（憲法 §1-6）。迷ったら厳しい側（上位）に倒す。

| フィールド | 階層 | 例 | 備考 |
|---|---|---|---|
| report_date | L0 | "2026-07-01" | 非個人データ |

---

## 画面要件（あれば）

- 対象画面: 自分の報告一覧・詳細画面（overview.md §1）
- golden: **撮影不可**（reference-mockが文書ベースのため。`docs/memory-bank/decision-reference-mock-document-based-process-2026-07-14.md`）。実装後の見た目は別途手動確認する。

---

## スコープ外（明示する）

- 報告履歴・履行状況（未報告・欠勤等）（Phase 2以降・phase2-design.md §6.9）
- 一括ダウンロード・スキルシート閲覧（Phase 2以降・spec.md §7）
