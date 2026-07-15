// CLAUDE.md 原則2: AI呼び出しは必ずこの抽象化層を経由する（プロバイダー非依存）。
// service層はこのインターフェースのみに依存し、プロバイダ固有のSDK・モデル名を知らない（overview.md §4）。

export interface SummaryResult {
  incidents: string[];
  achievements: string[];
  issues: string[];
  skills: string[];
  needs_review: boolean;
  needs_review_reason?: string;
}

export class SummarizerFailureError extends Error {}

export interface Summarizer {
  summarize(rawText: string): Promise<SummaryResult>;
}
