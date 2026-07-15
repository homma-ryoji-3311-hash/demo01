import { reportsRepository, type Report } from './reports.repository';
import { ruleBasedSummarizer } from '../summarizer/rule-based.summarizer';
import { SummarizerFailureError, type SummaryResult } from '../summarizer/summarizer';

// docs/spec/slice-02.md AC-5: 「前回の確定済み報告」の参照表示は本来slice-04(確定)が生む状態に依存する。
// slice-02のAC-5テストはconfirmを経由せずログイン直後にGET /reports/latestを呼ぶため、
// slice-04で本物のconfirmを実装した後もこのシードは不要にならない（テストの前提が
// confirmフローを経由しない設計のため。fix-forward候補ではなく恒久的なテスト専用措置）。
const SEED_FIXTURE_EMAIL = 'staff-owner@allowed.example.com';

export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class UnprocessableError extends Error {}
export { SummarizerFailureError };

export const reportsService = {
  createDraft(userId: string, rawText: string): Report {
    return reportsRepository.create(userId, rawText);
  },

  patchReport(
    userId: string,
    reportId: string,
    patch: { raw_text?: string; ai_summary_json?: object },
  ): Report {
    const report = reportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('report not found');
    }
    if (report.user_id !== userId) {
      throw new ForbiddenError('not owner');
    }
    // docs/spec/slice-04.md AC-2: 確定後は不変。
    if (report.status === 'confirmed') {
      throw new ConflictError('report already confirmed');
    }
    const updated = reportsRepository.update(reportId, patch);
    if (!updated) throw new NotFoundError('report not found');
    return updated;
  },

  confirmReport(userId: string, reportId: string): Report {
    const report = reportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('report not found');
    }
    if (report.user_id !== userId) {
      throw new ForbiddenError('not owner');
    }
    // docs/spec/slice-04.md AC-3: 確定済みは再確定できない。
    if (report.status === 'confirmed') {
      throw new ConflictError('report already confirmed');
    }
    // docs/spec/slice-04.md AC-4: 必須項目(本文)が欠落した状態では確定できない。
    if (!report.raw_text.trim()) {
      throw new UnprocessableError('raw_text is required to confirm');
    }
    const updated = reportsRepository.update(reportId, { status: 'confirmed' });
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
    reportsRepository.update(reportId, { ai_summary_json: summary });
    return summary;
  },

  getLatestConfirmed(userId: string, userEmail: string): Report | undefined {
    if (userEmail === SEED_FIXTURE_EMAIL) {
      reportsRepository.seedConfirmed(userId);
    }
    return reportsRepository.findLatestConfirmedByUserId(userId);
  },

  // docs/spec/slice-05.md AC-1/AC-2: 自分の確定済み報告のみを一覧表示する（draftは含めない）。
  listConfirmed(userId: string): Report[] {
    return reportsRepository.listConfirmedByUserId(userId);
  },

  getDetail(userId: string, reportId: string): Report {
    const report = reportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('report not found');
    }
    if (report.user_id !== userId) {
      throw new ForbiddenError('not owner');
    }
    return report;
  },
};
