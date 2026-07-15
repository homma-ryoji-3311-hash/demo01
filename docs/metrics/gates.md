# 層境ゲート判定ログ

全 PR の層境ゲート判定（GO/NO-GO）の記録場所（ADR-0007・playbook 工程8）。
**代理判定（リーダー）は記録必須**——「仕様が PM の承認なしに main に入りうる」ため、PM が事後にこの表を確認する。
PM 本人の判定も1行残す（監査証跡の一貫性のため）。所有は Harness-Keeper（AIアーキ）。

## 記録フォーマット（1判定＝1行）

| PR | slice_id | 日付 | ゲート重量 | 判定 | 判定者 | PM事後確認 | 根拠（1行） |
|---|---|---|---|---|---|---|---|
| #3 | slice-01-auth | 2026-07-14 | 重量（`acceptance/`変更） | GO | PM | — | diff精読: AC-1〜4にsource/理由あり、範囲外変更なし、秘密混入なし。マージ自体はADR-0015自己承認ガードによりPM本人が手続き的分離で実行 |
| #4 | slice-02-report-draft | 2026-07-14 | 重量（`acceptance/`変更） | GO | PM | — | diff精読: AC-1〜6が仕様表と1:1対応、範囲外変更なし、秘密混入なし |
| #5 | slice-03-summary-review | 2026-07-14 | 重量（`acceptance/`変更） | GO | PM | — | diff精読: AC-1〜5が仕様表と1:1対応、範囲外変更なし、秘密混入なし |
| #6 | slice-04-report-confirm | 2026-07-14 | 重量（`acceptance/`変更） | GO | PM | — | diff精読: AC-1〜5が仕様表と1:1対応、範囲外変更なし、秘密混入なし |
| #7 | slice-05-report-history | 2026-07-14 | 重量（`acceptance/`変更） | GO | PM | — | diff精読: AC-1〜5が仕様表と1:1対応、範囲外変更なし、秘密混入なし |
| #8 | slice-01-auth | 2026-07-14 | 軽量（指示書のみ） | GO | PM | — | diff精読: docs/slices/slice-01.mdのみ、6項目とも整合 |
| #9 | slice-02-report-draft | 2026-07-14 | 軽量（指示書のみ） | GO | PM | — | diff精読: docs/slices/slice-02.mdのみ、6項目とも整合 |
| #10 | slice-03-summary-review | 2026-07-14 | 軽量（指示書のみ） | GO | PM | — | diff精読: docs/slices/slice-03.mdのみ、6項目とも整合 |
| #11 | slice-04-report-confirm | 2026-07-14 | 軽量（指示書のみ） | GO | PM | — | diff精読: docs/slices/slice-04.mdのみ、6項目とも整合 |
| #12 | slice-05-report-history | 2026-07-14 | 軽量（指示書のみ） | GO | PM | — | diff精読: docs/slices/slice-05.mdのみ、6項目とも整合 |
| #18 | (Step0残課題) | 2026-07-14 | 軽量（acceptance/設定のみ） | GO | PM | — | diff精読: Playwrightバージョンpin+閾値追加のみ。path-guard CI初合格を確認 |
| #20 | slice-01-auth | 2026-07-15 | 重量（認可コード） | GO | PM | — | 受け入れテスト4件緑・CI合格・Audit GO-WITH-FIXES（Major: package.json/tsconfig.jsonが許可リスト外だが実質zod追加1行のみ・是認）。秘密混入なし |
| #22 | slice-02-report-draft | 2026-07-15 | 重量（`backend/reports`新設・cross-slice依存あり） | GO | PM | — | 受け入れテスト10件緑(slice-01回帰含む)・CI合格・Audit GO-WITH-FIXES。未使用の先回りメソッド(slice-05領域)は削除済み。AC-5前提をテスト検知シードで作る回避策はfix-forward候補として明示的に受入(slice-04実装後に削除予定)。秘密混入なし |
| #24 | slice-03-summary-review | 2026-07-15 | 重量（Summarizer抽象化層新設） | GO | PM | — | 受け入れテスト15件緑(slice-01/02回帰含む)・CI合格・Audit GO-WITH-FIXES。Major2件(失敗トリガーが一般語と衝突/型キャスト握り潰し)は修正・再検証済み。秘密混入なし |
| #26 | slice-04-report-confirm | 2026-07-15 | 重量（確定・不変性ロジック） | GO | PM | — | 受け入れテスト20件緑(slice-01〜03回帰含む)・CI合格・Audit GO（クリーン、指摘なし）。秘密混入なし |
| #28 | slice-05-report-history | 2026-07-15 | 重量（最終スライス・MVP完走） | GO | PM | — | 受け入れテスト25件緑(MVP全体・slice-01〜05)・CI合格・Audit GO。getDetailがdraft詳細も所有者に返す設計は情報提供として受入（越権なし・禁止AC無し）。秘密混入なし |
| #31 | slice-01-auth（仕様改訂） | 2026-07-15 | 重量（approved仕様の実質改訂） | GO | PM | — | フロントエンド追加(PR#30)のNO-GO 2回を受け、正規経路(spec/*ブランチ)で画面要件を改訂。Audit GO-WITH-FIXES指摘3件(source欠落・approved再サイクル未実施・自動検証経路なし)すべて対応済み。/login自動検証は手動確認のみで受入とPM決定 |

- **ゲート重量**: `軽量`（Audit＋統合役の結果を読んで判定）／`重量`（`irreversible` ラベル。PM が diff を自分で読む）。
- **判定**: `GO` / `NO-GO`。NO-GO は差し戻し理由を「根拠」に書き、`docs/metrics/slices.md` の差し戻し理由とも整合させる。
- **判定者**: `PM` または `代理: リーダー`。**重量ゲートの代理も可**だが必ず記録する（ADR-0007）。
- **PM事後確認**: 代理判定のみ対象。PM が確認したら日付を入れる。空欄が残っている代理判定は未確認＝監査上の未決。
- **根拠**: 何を読んで判定したか（例: `Audit GO + 統合役再検証緑` / `diff 精読: 認可変更なし`）。
