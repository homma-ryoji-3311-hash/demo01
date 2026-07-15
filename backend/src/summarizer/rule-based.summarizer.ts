import type { Summarizer, SummaryResult } from './summarizer';
import { SummarizerFailureError } from './summarizer';

// 実プロバイダ（Claude/Gemini/Vertex。overview.md §4のAI_PROVIDER）結線は本デモの範囲外
// （第一目的は方法論の確立であり機能前進ではない。CLAUDE.md冒頭）。
// ルールベースの決定的な実装をSummarizerインターフェースの背後に置く。
// マスター（本文）に無い数値・事実を創作しない原則（overview.md §4）を守り、本文からの抽出のみ行う。
// テスト専用の呼び出し失敗トリガー。「失敗」単体は業務報告の一般語（例:「案件で失敗を経験したが挽回」）
// と衝突するため、より狭い複合語で判定する（Audit M-7指摘対応）。
const FAILURE_TRIGGER = '要約失敗を誘発する本文';

export const ruleBasedSummarizer: Summarizer = {
  async summarize(rawText: string): Promise<SummaryResult> {
    if (rawText.includes(FAILURE_TRIGGER)) {
      throw new SummarizerFailureError('summarizer call failed');
    }

    const hasQuantitative = /[0-9]/.test(rawText);

    return {
      incidents: [],
      achievements: rawText.trim() ? [rawText.trim().slice(0, 80)] : [],
      issues: [],
      skills: [],
      needs_review: !hasQuantitative,
      needs_review_reason: hasQuantitative ? undefined : '要確認: 本文に定量指標が見つかりません',
    };
  },
};
