# slice-04-report-confirm

## 1. ゴール

報告を確定（confirmed化）でき、確定後は不変になる（編集・再確定とも409）。必須項目（本文）が欠落した状態では確定できない（422）。

## 2. 受け入れテスト（変更禁止・read-only）

- `acceptance/tests/slice-04-report-confirm.spec.ts`
- golden: 撮影不可（reference-mockが文書ベースのため。手動確認に切替）
- 仕様表: `docs/spec/slice-04.md`

## 3. 触ってよいファイル範囲

- `backend/src/reports/` （`*.router.ts` / `*.service.ts` / `*.repository.ts` / `*.schema.ts`）
  - **本スライスで実装するエンドポイントのみ**：`POST /reports/:id/confirm`、および`PATCH /reports/:id`の確定後409ガード
- `backend/src/app.ts`（ルーターの合成のみ）
- `frontend/app/report/[id]/review/**`（slice-03と同一画面への「確定」ボタン追加のみ。画面自体の新規作成はしない）
- 上記範囲の unit テスト

**範囲外**：`acceptance/` `reference-mock/` `docs/` `.claude/`、下書き作成・AI要約呼び出し本体（slice-02〜03・マージ済み）、
`GET /reports`・`GET /reports/:id`（slice-05）

## 4. 貼り付け用の枠（`/implement` が読む）

```
このリポジトリで slice-04-report-confirm を実装します。
- 触ってよいのは指示書「3. ファイル範囲」のファイルのみ。範囲外は変更禁止。
- 「2. 受け入れテスト」を全て緑にするのがゴール。テストは既にあります。
  まず runner で現状の赤を確認し、実装して緑にしてください。
- commit / push / マイグレーションはしないこと。緑になったら停止して報告してください。
- 不明点はコードを推測で埋めず、リーダーに質問として出してください。
- 確定後の編集・再確定はいずれも409。必須項目（本文）欠落は422（slice-02のPOST時422とは別経路として実装すること）。
```

## 5. 完了の定義（3つとも機械判定）

1. 受け入れテストが緑（生ログを提示）
2. golden との pixel 差分が閾値内（本スライスは撮影不可のため対象外・手動確認に委ねる）
3. シークレット・PII が出力・差分に無い

## 6. 禁止事項

- commit / push / DB マイグレーション（統合役・層境ゲート経由）
- 範囲外ファイルの変更
- `acceptance/` `reference-mock/` の変更（＝仕様と answer key）
- 報告一覧・詳細閲覧の実装に着手しないこと（slice-05の領域）
