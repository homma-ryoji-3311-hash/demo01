# slice-03-summary-review

## 1. ゴール

AI要約（Summarizer抽象化層）を呼び出し、構造化結果を確認・編集できる。要約呼び出しが失敗しても下書きは保存できる（degrade）。

## 2. 受け入れテスト（変更禁止・read-only）

- `acceptance/tests/slice-03-summary-review.spec.ts`
- golden: 撮影不可（reference-mockが文書ベースのため。手動確認に切替）
- 仕様表: `docs/spec/slice-03.md`

## 3. 触ってよいファイル範囲

- `backend/src/summarizer/`（`Summarizer`抽象化層。プロバイダ固有のSDK・モデル名はここに閉じ込める）
- `backend/src/reports/` （`*.router.ts` / `*.service.ts` / `*.repository.ts` / `*.schema.ts`）
  - **本スライスで実装するエンドポイントのみ**：`POST /reports/:id/summarize`、および同エンドポイントからの`ai_summary_json`編集用PATCH連携
- `backend/src/app.ts`（ルーターの合成のみ）
- `frontend/app/report/[id]/review/**`（AI要約 確認・編集画面）
- 上記範囲の unit テスト

**範囲外**：`acceptance/` `reference-mock/` `docs/` `.claude/`、`POST /reports`・`PATCH /reports/:id`本文保存（slice-02・マージ済み）、
`POST /reports/:id/confirm`（slice-04）、`GET /reports`・`GET /reports/:id`（slice-05）

## 4. 貼り付け用の枠（`/implement` が読む）

```
このリポジトリで slice-03-summary-review を実装します。
- 触ってよいのは指示書「3. ファイル範囲」のファイルのみ。範囲外は変更禁止。
- 「2. 受け入れテスト」を全て緑にするのがゴール。テストは既にあります。
  まず runner で現状の赤を確認し、実装して緑にしてください。
- commit / push / マイグレーションはしないこと。緑になったら停止して報告してください。
- 不明点はコードを推測で埋めず、リーダーに質問として出してください。
- AI呼び出しの失敗は502として扱い、その後もPATCHでの下書き保存は継続できること（degrade。CLAUDE.md原則2のSummarizer抽象化層を必ず経由する）。
- 要確認フラグの判定基準は実装側の裁量（docs/spec/slice-03.md AC-5）。フラグを含むJSONを返せれば良い。
```

## 5. 完了の定義（3つとも機械判定）

1. 受け入れテストが緑（生ログを提示）
2. golden との pixel 差分が閾値内（本スライスは撮影不可のため対象外・手動確認に委ねる）
3. シークレット・PII が出力・差分に無い

## 6. 禁止事項

- commit / push / DB マイグレーション（統合役・層境ゲート経由）
- 範囲外ファイルの変更
- `acceptance/` `reference-mock/` の変更（＝仕様と answer key）
- 確定・一覧閲覧の実装に着手しないこと（slice-04〜05の領域）
