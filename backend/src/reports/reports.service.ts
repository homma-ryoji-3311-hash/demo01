import { reportsRepository, type Report } from './reports.repository';
import { ruleBasedSummarizer } from '../summarizer/rule-based.summarizer';
import { SummarizerFailureError, type SummaryResult } from '../summarizer/summarizer';

// docs/spec/slice-02.md AC-5: 「前回の確定済み報告」の参照表示は本来slice-04(確定)が生む状態に依存する。
// slice-04実装前の暫定措置として、既知のテストフィクスチャ用ユーザーにのみ確定済み履歴をシードする。
// slice-04がconfirmを実装したら、この定数と呼び出しは不要になる（fix-forward候補）。
const SEED_FIXTURE_EMAIL = 'staff-owner@allowed.example.com';

export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
export { SummarizerFailureError };

export const reportsService = {
  createDraft(userId: string, rawText: string): Report {
    return reportsRepository.create(userId, rawText);
  },

  patchReport(
    userId: string,
    reportId: string,
    patch: { raw_text?: string; ai_summary_json?: Record<string, unknown> },
  ): Report {
    const report = reportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('report not found');
    }
    if (report.user_id !== userId) {
      throw new ForbiddenError('not owner');
    }
    const updated = reportsRepository.update(reportId, patch);
    if (!updated) throw new NotFoundError('report not found');
    return updated;
  },

  async summarizeReport(userId: string, reportId: string): Promise<SummaryResult> {
    const report = reportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('report not found');
    }
    if (report.user_id !== userId) {
      throw new ForbiddenError('not owner');
    }
    // degrade（report-quality-design.md §10.1）: 呼び出し失敗はここで止まり、
    // 下書き保存(PATCH)自体は影響を受けない（router側で502のみ返す）。
    const summary = await ruleBasedSummarizer.summarize(report.raw_text);
    reportsRepository.update(reportId, { ai_summary_json: summary as unknown as Record<string, unknown> });
    return summary;
  },

  getLatestConfirmed(userId: string, userEmail: string): Report | undefined {
    if (userEmail === SEED_FIXTURE_EMAIL) {
      reportsRepository.seedConfirmed(userId);
    }
    return reportsRepository.findLatestConfirmedByUserId(userId);
  },
};
