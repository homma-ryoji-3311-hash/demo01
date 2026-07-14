# slice-05-report-history

## 1. ゴール

自分の確定済み報告の一覧・詳細を閲覧できる（他人の報告は不可視）。

## 2. 受け入れテスト（変更禁止・read-only）

- `acceptance/tests/slice-05-report-history.spec.ts`
- golden: 撮影不可（reference-mockが文書ベースのため。手動確認に切替）
- 仕様表: `docs/spec/slice-05.md`

## 3. 触ってよいファイル範囲

- `backend/src/reports/` （`*.router.ts` / `*.service.ts` / `*.repository.ts` / `*.schema.ts`）
  - **本スライスで実装するエンドポイントのみ**：`GET /reports`・`GET /reports/:id`
- `backend/src/app.ts`（ルーターの合成のみ）
- `frontend/app/reports/**`（自分の報告一覧・詳細画面）
- 上記範囲の unit テスト

**範囲外**：`acceptance/` `reference-mock/` `docs/` `.claude/`、下書き作成・AI要約・確定の実装（slice-02〜04・マージ済み）

## 4. 貼り付け用の枠（`/implement` が読む）

```
このリポジトリで slice-05-report-history を実装します。
- 触ってよいのは指示書「3. ファイル範囲」のファイルのみ。範囲外は変更禁止。
- 「2. 受け入れテスト」を全て緑にするのがゴール。テストは既にあります。
  まず runner で現状の赤を確認し、実装して緑にしてください。
- commit / push / マイグレーションはしないこと。緑になったら停止して報告してください。
- 不明点はコードを推測で埋めず、リーダーに質問として出してください。
- 一覧にはconfirmed状態の報告のみを含めること（draft状態は含めない）。
```

## 5. 完了の定義（3つとも機械判定）

1. 受け入れテストが緑（生ログを提示）
2. golden との pixel 差分が閾値内（本スライスは撮影不可のため対象外・手動確認に委ねる）
3. シークレット・PII が出力・差分に無い

## 6. 禁止事項

- commit / push / DB マイグレーション（統合役・層境ゲート経由）
- 範囲外ファイルの変更
- `acceptance/` `reference-mock/` の変更（＝仕様と answer key）
- これが最後のMVPスライス。Phase 2以降（通知・突合・スキルシート等）には着手しないこと
