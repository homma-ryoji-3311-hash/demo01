# 基本設計（工程1）

> 正本。MVP 全体で1本。以降の更新は `/flywheel` 経由。
> 出典: `reference-mock/spec.md`（要件定義）・`reference-mock/phase1-plan.md`（Phase 1 タスク分解）・
> `reference-mock/phase2-design.md`（Phase 2 以降の権限方針）・`reference-mock/report-quality-design.md`（追加質問機能）。
> **これは設計ではなく answer key の書き起こし。** 参照モックに存在しない挙動には **★新規決定** を付け、理由を1行添える。

## 0. MVP スコープの選定（★新規決定）

- 理由: `reference-mock/spec.md` はフル機能（音声・突合・Excel生成・通知・グループ別設定・ウェルビーイング等）の要件定義であり、
  そのまま MVP にすると「第一目的＝再現可能な型の確立」（CLAUDE.md 冒頭）に反して初回スプリントが溶ける。
  `reference-mock/phase1-plan.md` が既に「認証 → テキスト報告入力 → AI要約・確認 → 確定・格納」を
  縦切り1本として明示しているため、**本 MVP は phase1-plan.md のスコープをそのまま採用する**。
- phase1-plan.md 自体は answer key（reference-mock 内の既存ドキュメント）なので、スコープ選定の中身自体は書き起こし。
  「これを MVP 境界として採用する」という決定だけが ★新規決定。
- Phase 2 以降（`phase2-design.md`）・追加質問機能（`report-quality-design.md`）は 4章で明示するとおり全てスコープ外。

## 1. 画面一覧

### MVP（Phase 1）— 本設計の対象

`reference-mock/phase1-plan.md` 記載のスコープに対応する画面。`reference-mock/spec.md` §7 の全画面一覧のうち、
Phase 1 に必要な3画面のみを対象とする。

| 画面 | 対象 | 概要 | 出典 |
|---|---|---|---|
| 報告入力 | スタッフ | 自由文のみ。下書き自動保存。前回本文・前回AI要約を参照表示（読み取り専用） | spec.md §3.2, phase1-plan.md #5 |
| AI要約 確認・編集 | スタッフ | 構造化結果（incidents/achievements/issues/skills）を確認・修正して確定。要確認フラグ | spec.md §3.3, phase1-plan.md #6-7 |
| 自分の報告一覧・詳細 | スタッフ | 自分の確定済み報告の一覧・閲覧（確認のみ） | phase1-plan.md #8 |

- ログイン画面（Google OAuth 起点）は Phase 1 に必須だが、`spec.md` §7 の画面一覧には独立行として無いため、
  OAuth リダイレクト画面として扱う（★新規決定・理由: 認証プロバイダ標準のリダイレクト画面であり、
  自前 UI を持たない前提のため一覧から省略されている可能性が高いが、実装上は必要なので明記する）。

### スコープ外（Phase 2 以降）— 参考として全画面を記録

`spec.md` §7 の原表（書き起こし。実装対象ではない）:

| 画面 | 対象 | 概要 |
|---|---|---|
| スキルシート閲覧 | スタッフ | 自身の生成済みシートのプレビュー・ダウンロード |
| 通知設定 | スタッフ | リマインド時刻・通知チャンネルの設定 |
| スタッフ一覧 | 管理者 | 状況・最新シート・操作の一覧（グループタブ） |
| 設問テンプレート編集 | 管理者 | グループ別の設問作成・役割タグ・バージョン管理 |
| Excelテンプレート管理 | 管理者 | アップロード・アンカー検証・有効版の切り替え |
| 一括ダウンロード | 管理者 | 全スタッフ分のZIP出力・絞り込み |
| 承認待ち | 管理者 | 新規スタッフの承認・担当紐付け（phase2-design.md §5） |
| 報告履歴・履行状況 | スタッフ | 未報告・欠勤等の履行状況閲覧（phase2-design.md §6.9） |
| 管理者ダッシュボード | 管理者 | 承認・担当紐付け（phase2-design.md §9 関連資料） |

## 2. API 一覧（パス・メソッド・ステータスコード）★新規決定

- 理由: `reference-mock/` にはこの全ドキュメント群を通じて **具体的な REST エンドポイント定義が一切無い**
  （spec.md は要件定義、phase1-plan.md はデータモデルとステップのみ）。したがって本章は全体が新規決定。
  ADR-0011（Express・router→service→repository の一方向）と CLAUDE.md §6（バリデーション失敗は422を明示的に返す）
  に整合する形で設計した。
- 認可: 全エンドポイントで「リクエストユーザー＝対象データの所有者か」をミドルウェアで検証する
  （phase1-plan.md #3 のDoD「他人のreport_idへのアクセスが403になる」を反映）。

| メソッド | パス | 概要 | 成功 | 主な失敗 |
|---|---|---|---|---|
| GET | `/health` | ヘルスチェック（phase1-plan.md #2 DoD） | 200 | — |
| GET | `/auth/google/login` | Google OAuth 開始（リダイレクト） | 302 | — |
| GET | `/auth/google/callback` | OAuth コールバック。ホワイトリスト外ドメインは拒否 | 302（セッション確立） | 403（許可ドメイン外） |
| POST | `/auth/logout` | セッション破棄 | 204 | — |
| GET | `/reports` | 自分の確定済み報告一覧（phase1-plan.md #8） | 200 | 401（未ログイン） |
| GET | `/reports/latest` | 前回入力・前回AI要約の参照表示用（phase1-plan.md #5） | 200（無ければ null 相当） | 401 |
| GET | `/reports/:id` | 報告詳細。所有者以外は拒否 | 200 | 401 / 403（他人のreport） / 404 |
| POST | `/reports` | 新規下書き作成 | 201 | 401 / 422（バリデーション） |
| PATCH | `/reports/:id` | 下書き自動保存（本文・要約編集）。confirmed 後は不可 | 200 | 401 / 403 / 404 / 409（confirmed済み） / 422 |
| POST | `/reports/:id/summarize` | Summarizer 抽象化層を呼び、構造化JSONを返す（保存は別途 PATCH） | 200 | 401 / 403 / 404 / 502（AI呼び出し失敗） |
| POST | `/reports/:id/confirm` | 確定（status: draft→confirmed）。以後不変 | 200 | 401 / 403 / 404 / 409（既に確定済み） / 422（必須項目欠落） |

- 409 の使用は ★新規決定（reference-mock に明示なし）。「確定後不変」（CONTEXT.md）を API レベルで守るための選択。
- 502 は Summarizer 呼び出し失敗時の扱い。report-quality-design.md §10.1「機能が落ちても報告は必ず出せる」の
  degrade 思想に倣い、`/reports/:id/summarize` が失敗しても下書き自体は `PATCH` で保存できる設計とする（★新規決定）。

## 3. データモデル

### MVP（Phase 1）— `phase1-plan.md` の書き起こし

```
users(id, google_sub, email, name, role, created_at)
reports(id, user_id, report_date, raw_text, ai_summary_json, status, created_at)
```

- `status`: `draft` / `confirmed`
- `ai_summary_json`: `{ incidents[], achievements[], issues[], skills[] }`（Phase 1 は表示・保存のみ）
- `role`: `staff` / `manager`（phase1-plan.md 冒頭のスコープに明記。権限境界の強制はスタッフ＝自分のみ）

### 将来スコープ（Phase 2 以降）— `spec.md` §4 の書き起こし（参考・実装対象外）

| エンティティ | 主な項目 | 役割 |
|---|---|---|
| PROJECTS | id, user_id, project_key, client_name, status, last_active_at | 案件マスター（突合キー） |
| REPORT_PROJECTS | report_id, project_id, contribution | 報告と案件の紐づけ |
| INCIDENTS | id, project_id, status, opened_by, resolved_by | インシデントの状態管理 |
| SKILLS | id, name, category | 専門用語マスター（名寄せ） |
| REPORT_SKILLS | report_id, skill_id | 報告からのスキル抽出 |
| MASTER_SUMMARIES | id, user_id, project_id, period, summary(JSON), reconciled_at | 突合済みマスター元データ |
| TEMPLATES | id, group_id, file_url, version, anchor_map | グループ別Excelテンプレート |
| QUESTION_SETS | id, group_id, version, questions(JSON＋役割タグ) | グループ別設問テンプレート |
| GENERATED_SHEETS | id, user_id, template_id, file_url, filename, generated_at | 生成済みスキルシート履歴 |
| NOTIFICATION_SETTINGS | id, user_id, remind_time, slack_enabled, email_enabled | 通知設定 |

Phase 2 以降は `phase2-design.md` の3軸権限モデル（操作権限レベル／担当範囲／機微情報アクセス）・
チャネル・主担当/副担当・報告サイクル管理（§6）が `users`/`reports` を拡張する前提（書き起こし・未実装）。

## 4. Summarizer の境界

`spec.md` §5・phase1-plan.md #6 の書き起こし。CLAUDE.md 原則2（提供元非依存の抽象化層）と一致。

- **提供元非依存**: 要約処理は `Summarizer` インターフェースの背後に置く。Phase 1 は1プロバイダ実装のみ
  （`AI_PROVIDER` 環境変数で `claude | gemini | vertex` を選択可能な形にする。実際の呼び出し先はどれか1つ）。
- **認証と要約は別系統**: Google OAuth は本人確認・認可のみ。要約AIの呼び出しは組織側で集約し、
  個人のGoogleアカウントのAIプラン等に依存しない。
- **構造化出力**: 出力は固定 JSON スキーマ（`incidents/achievements/issues/skills`）。自由文を解釈しない。
- **創作の禁止**: マスター（本文）に無い数値・事実を AI に創作させない。不足は空欄のまま。
- **境界線**: ドメイン層（service）に Gemini/Claude/Vertex 固有の SDK・モデル名を書かない
  （プロバイダ固有の制約はプロバイダ実装側で吸収。report-quality-design.md §8.2 の教訓と同じ方針）。
- ルーター層マッピング（★新規決定・ADR-0011 に基づく）: `router`（HTTP）→ `service`（Summarizer 呼び出し・
  ビジネスルール）→ `repository`（DB永続化）。Summarizer 自体は `service` 層から呼ばれる独立インターフェースとし、
  `repository` からは呼ばない。

## 5. スコープ外の明示

### Phase 1（本 MVP）に含まない — `phase1-plan.md` の書き起こし

- 音声入力 / STT
- 通知（Slack・メール）
- 突合・マスター元データ（⑤）
- スキルシート（Excel）生成
- 設問テンプレート
- グループ別設定
- ウェルビーイング設問

### Phase 2 以降 — `phase2-design.md` の書き起こし（本 MVP では一切実装しない）

- 3軸権限モデル（system admin / super admin / manager / staff の段階、担当範囲、機微情報アクセス）
- メンタルケア担当（独立役割）
- チャネル・主担当/副担当
- 承認・deny-by-defaultの登録フロー
- 報告サイクル・締切・未報告/報告漏れ管理・退勤連動
- 遅延提出の累積換算

### 追加質問機能（AI再質問） — `report-quality-design.md` の書き起こし（設計のみ・本 MVP では未実装）

- 要約後の粒度判定（ルール＋Gemini補助）→ 一度だけの追加質問 → 本文追記 → 要約再生成
- この機能は `report-quality-design.md` 内でも「設計のみ、実装はまだ行わない」と明記されている文書であり、
  本 overview.md の MVP スコープにも含めない。

## 6. 未決事項（PM レビュー時に確認）

`spec.md` §9・`phase2-design.md` §8 に列挙された未決事項は、Phase 1 の実装には影響しないため本設計では踏み込まない。
Phase 2 以降の基本設計を書き起こす際に改めて参照する。
