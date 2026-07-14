---
slice: slice-02-report-draft
approved: true
---

## AC-1 新規の下書きを作成できる

- source: reference-mock
- **Given** ログイン済みユーザー
- **When** `POST /reports` に本文を送る
- **Then** `201` と作成された report（`status: draft`）が返る

## AC-2 空本文の下書き作成を拒否する

- source: PM        # ★参照モックに無い新規決定。理由を1行:
- 理由: reference-mock（spec.md §3.2）は「入力は常時下書き自動保存」とするのみで、空文字の扱いは未定義。CLAUDE.md §6の原則（バリデーション失敗は422）に沿って新規決定。
- **Given** ログイン済みユーザー
- **When** `POST /reports` に空文字（`""`）の本文を送る
- **Then** `422` が返る

## AC-3 下書きを自動保存できる（PATCH）

- source: reference-mock
- **Given** 自分が作成したdraft状態の報告
- **When** `PATCH /reports/:id` に更新後の本文を送る
- **Then** `200` と更新後の内容が返る

## AC-4 他人の下書きは自動保存できない

- source: reference-mock
- **Given** 他人が作成したdraft状態の報告
- **When** `PATCH /reports/:id` に本文を送る
- **Then** `403` が返る（phase1-plan.md #3 DoDの権限境界の延長）

## AC-5 前回の本文・AI要約を参照表示できる

- source: reference-mock
- **Given** 過去に確定済みの報告が1件以上ある
- **When** `GET /reports/latest` を呼ぶ
- **Then** `200` と前回の本文・AI要約が返る

## AC-6 過去の確定済み報告が無ければ参照はnull相当

- source: reference-mock
- **Given** 過去に確定済みの報告が無い
- **When** `GET /reports/latest` を呼ぶ
- **Then** `200` と null相当（前回参照なし）が返る

---

## 合成フィクスチャ（PM 所有）

**本番/実データは一切入れない**（憲法 §1-6）。迷ったら厳しい側（上位）に倒す。

| フィールド | 階層 | 例 | 備考 |
|---|---|---|---|
| raw_text | L0 | "本日はA社訪問。特に問題なし。" | フィールド自体は非個人データ扱い。中身の秘匿は運用でカバー（grill済み・PM決定） |
| status | L0 | "draft" | 非個人データ |

---

## 画面要件（あれば）

- 対象画面: 報告入力画面（overview.md §1）
- golden: `acceptance/golden/slice-02-report-input.png`（Phase B で実装より先に撮る）
- マスクする要素: Phase B の golden 撮影時に確定（日時・可変IDが画面に出る場合はマスク対象）

---

## スコープ外（明示する）

- AI要約の呼び出し・確認編集（slice-03）
- 確定（confirm）・確定後不変（409）（slice-04）
- 自分の確定済み報告の一覧・詳細（slice-05）
