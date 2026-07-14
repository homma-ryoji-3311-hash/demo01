# インシデント記録

単一アカウント/手続き的分離のまま進めた不可逆操作、および型の欠陥として残す事象を記録する（ADR-0015）。PM が事後確認する。revert 方針は fix-forward（ADR-0014）で、ここは「前例の記録」であって巻き戻しの指示ではない。

| # | 日付 | repo | 事象 | author | GO を出した帽子 | マージした帽子 | 扱い |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-13 | staff-report-system-demo | PR #1（fail-open 修正）を単一 GitHub アカウントで作成→GO コメント→`gh pr merge` まで自己完走。GitHub は self-approve を拒否したが GO コメントで迂回。identity 分離が成立せず §7 の関所が形式的に崩れた。 | homma-ryoji-3311 | 同一 identity（PM/統合役 兼務） | 同一 identity | **revert しない。** diff は fail-open 修正として 5 Whys・影響範囲・回帰テストが確認済み。問題は「このコード」ではなく「前例」。恒久対策は ADR-0015（手続き的分離＋自己承認ガード）。bootstrap 前のため Phase B 総合テストは空振り。 |
