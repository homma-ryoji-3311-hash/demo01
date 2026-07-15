---
slice: slice-01-auth
approved: true
---

## AC-1 許可ドメインのアカウントでログインすると認証済みセッションが確立する

- source: PM
- 理由: reference-mock(`spec.md` §3.1)は「Google OAuth 2.0・許可ドメインでのログイン」を要件とするのみで、
  具体的なエンドポイント・レスポンス形式は未定義。本物の Google OAuth を実HTTP/Playwrightで自動化するのは
  非現実的なため、**テスト専用のログインバイパスAPI**を新規決定（本番では無効化する）。
- **Given** 許可ドメインに属するテストユーザー（`email: staff@allowed.example.com`）
- **When** `POST /test-auth/login` に `email` を送る
- **Then** `200` とセッションCookie（またはトークン）が返り、以後のリクエストで認証済み扱いになる

## AC-2 許可ドメイン外のアカウントはログインを拒否される

- source: PM
- 理由: reference-mock(`spec.md` §3.1・§6.1)は「許可ドメインまたは招待制のホワイトリスト」を要件とするが、
  拒否時のステータスコードは未定義。API として扱い `403` を返す方針を PM が決定（グリルで確認済み）。
- **Given** 許可ドメイン外のメールアドレス（`email: staff@blocked.example.com`）
- **When** `POST /test-auth/login` に `email` を送る
- **Then** `403` が返り、セッションは確立しない

## AC-3 未ログイン状態で保護APIを呼ぶと401になる

- source: PM
- 理由: reference-mock(`spec.md` §3.1)「アクセス境界はバックエンドで強制する」の原則を、未認証リクエストへの
  具体的な応答として定義（reference-mock 自体はステータスコードを定めていない）。
- **Given** セッションが無い状態
- **When** `GET /me` を呼ぶ
- **Then** `401` が返る

## AC-4 ログイン済みユーザーは自分のユーザー情報を取得できる

- source: reference-mock
- **Given** AC-1 でログイン済みのユーザー
- **When** `GET /me` を呼ぶ
- **Then** `200` とユーザー情報（`email, name, role, group_id`）が返る。フィールドは
  `spec.md` §4 データモデル `USERS(id, email, name, role, group_id, timezone)` の書き起こし

---

## 合成フィクスチャ（PM 所有）

**本番/実データは一切入れない**（憲法 §1-6）。迷ったら厳しい側（上位）に倒す。

| フィールド | 階層 | 例 | 備考 |
|---|---|---|---|
| email（許可ドメイン） | L1 | "staff@allowed.example.com" | スタッフ本人 PII（合成） |
| email（許可ドメイン外） | L1 | "staff@blocked.example.com" | 拒否ケース用の合成 PII |
| name | L1 | "山田 太郎" | スタッフ本人 PII（合成） |
| role | L0 | "staff" | 非個人データ |
| group_id | L0 | "eng-team" | 非個人データ |

---

## 画面要件（あれば）

- 対象画面: **テスト用ログイン画面（`/login`）を追加する（2026-07-15 改訂）**。
- source: PM
- 理由: アプリ全体を手動確認するには最低限ログイン導線が必要。Google OAuth はプロバイダ標準UIのため
  「本物のOAuth画面」自体は引き続き対象外。ここでの画面は`POST /test-auth/login`を呼ぶだけの
  テスト専用バイパスUIであり、本番では無効化する前提（AC-1/AC-2と同じ位置づけ）。
- golden撮影は引き続き対象外（reference-mockが文書ベースのため。他スライスと同じ恒久プロセス）。
- ログイン後のリダイレクト先画面（報告入力画面等）の golden は slice-02 以降で撮る

---

## スコープ外（明示する）

- `/login` 画面の自動検証（受け入れテストはAPIのみで不変。既存のPlaywright browser E2Eインフラが無いため、
  今回は新規構築せず手動確認のみで受け入れる。PM承認・2026-07-15）
- 招待制によるホワイトリスト管理（許可ドメイン方式のみ実装。招待制は Phase 2 以降）
- 管理者ロールの担当グループ横断アクセス（Phase 1 は「スタッフは自分のみ」の権限境界のみ）
- 他人の `report` への `403`（`reports` リソースが存在しないため、対応する AC は slice-02 へ移す）
- 本物の Google OAuth フローの E2E 自動化（テストはバイパスAPI経由。実OAuth結線の手動確認は別途）
