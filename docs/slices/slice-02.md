# slice-02-report-draft

## 1. ゴール

報告の新規下書き作成と自動保存（PATCH）が動き、前回の本文・AI要約を参照表示できる。

## 2. 受け入れテスト（変更禁止・read-only）

- `acceptance/tests/slice-02-report-draft.spec.ts`
- golden: 撮影不可（reference-mockが文書ベースのため。手動確認に切替）
- 仕様表: `docs/spec/slice-02.md`

## 3. 触ってよいファイル範囲

- `backend/src/reports/` （`*.router.ts` / `*.service.ts` / `*.repository.ts` / `*.schema.ts`）
  - **本スライスで実装するエンドポイントのみ**：`POST /reports`・`PATCH /reports/:id`・`GET /reports/latest`
- `backend/src/app.ts`（reportsルーターの合成のみ）
- `frontend/app/report/new/**`（報告入力画面）
- 上記範囲の unit テスト

**範囲外**：`acceptance/` `reference-mock/` `docs/` `.claude/`、`auth`関連の実装（slice-01・マージ済み）、
`POST /reports/:id/summarize`・`POST /reports/:id/confirm`・`GET /reports`・`GET /reports/:id`（slice-03〜05）

## 4. 貼り付け用の枠（`/implement` が読む）

```
このリポジトリで slice-02-report-draft を実装します。
- 触ってよいのは指示書「3. ファイル範囲」のファイルのみ。範囲外は変更禁止。
- 「2. 受け入れテスト」を全て緑にするのがゴール。テストは既にあります。
  まず runner で現状の赤を確認し、実装して緑にしてください。
- commit / push / マイグレーションはしないこと。緑になったら停止して報告してください。
- 不明点はコードを推測で埋めず、リーダーに質問として出してください。
- バリデーション失敗は422を明示的に返すこと（Expressは自動で返さない）。
- `backend/src/reports/` は今後のスライス(summarize/confirm/一覧)でも拡張されるファイルです。
  本スライスで実装するのは上記3エンドポイントのみとし、他のエンドポイントの雛形を先回りして作らないこと。
```

## 5. 完了の定義（3つとも機械判定）

1. 受け入れテストが緑（生ログを提示）
2. golden との pixel 差分が閾値内（本スライスは撮影不可のため対象外・手動確認に委ねる）
3. シークレット・PII が出力・差分に無い

## 6. 禁止事項

- commit / push / DB マイグレーション（統合役・層境ゲート経由）
- 範囲外ファイルの変更
- `acceptance/` `reference-mock/` の変更（＝仕様と answer key）
- AI要約呼び出し・確定・一覧閲覧の実装に着手しないこと（slice-03〜05の領域）
