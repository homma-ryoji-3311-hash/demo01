# slice-01-auth

## 1. ゴール

Google OAuthログイン（テスト用バイパスAPI経由）と権限境界の強制が動く。許可ドメイン外は拒否され、未ログインの保護APIアクセスは401になる。

## 2. 受け入れテスト（変更禁止・read-only）

- `acceptance/tests/slice-01-auth.spec.ts`
- golden: 撮影不可（reference-mockが文書ベースのため。手動確認に切替）
- 仕様表: `docs/spec/slice-01.md`

## 3. 触ってよいファイル範囲

- `backend/src/auth/` （`*.router.ts` / `*.service.ts` / `*.repository.ts` / `*.schema.ts`）
- `backend/src/app.ts`（authルーターの合成のみ）
- `frontend/app/login/**`（テスト用ログイン画面。`docs/spec/slice-01.md`「画面要件」2026-07-15改訂で追加）
- `frontend/app/page.tsx`（ログインへの導線のみ）
- `frontend/lib/api.ts`（全スライス共通のAPIクライアント基盤。**このスライスでは`login`/`logout`/`me`のみ追加すること。`reports`関連のメソッド・型は追加しない**＝slice-02以降が自分のスコープ分だけ追記する漸進的拡張パターン）
- 上記範囲の unit テスト

**範囲外**：`acceptance/` `reference-mock/` `docs/`（本ファイル・`docs/spec/slice-01.md`の正規の改訂PRを除く） `.claude/`、`reports`関連の実装（slice-02以降）、DB マイグレーション

## 4. 貼り付け用の枠（`/implement` が読む）

```
このリポジトリで slice-01-auth を実装します。
- 触ってよいのは指示書「3. ファイル範囲」のファイルのみ。範囲外は変更禁止。
- 「2. 受け入れテスト」を全て緑にするのがゴール。テストは既にあります。
  まず runner で現状の赤を確認し、実装して緑にしてください。
- commit / push / マイグレーションはしないこと。緑になったら停止して報告してください。
- 不明点はコードを推測で埋めず、リーダーに質問として出してください。
- バリデーション失敗・権限エラーは422/401/403を明示的に返すこと（Expressは自動で返さない）。
- `POST /test-auth/login` は本番では無効化する前提のテスト専用エンドポイントです（本物のOAuth結線は別途）。
```

## 5. 完了の定義（3つとも機械判定）

1. 受け入れテストが緑（生ログを提示）
2. golden との pixel 差分が閾値内（本スライスは撮影不可のため対象外・手動確認に委ねる）
3. シークレット・PII が出力・差分に無い

## 6. 禁止事項

- commit / push / DB マイグレーション（統合役・層境ゲート経由）
- 範囲外ファイルの変更
- `acceptance/` `reference-mock/` の変更（＝仕様と answer key）
- `reports`関連の実装に着手しないこと（slice-02〜05の領域）
