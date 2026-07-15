export interface Report {
  id: string;
  user_id: string;
  raw_text: string;
  // Summarizerの出力(SummaryResult)を含む、要約結果の構造化JSON。
  ai_summary_json: object | null;
  status: 'draft' | 'confirmed';
  created_at: string;
}

// Phase 1 は永続化なしのインメモリストア（DBマイグレーションは範囲外）。
const reportsById = new Map<string, Report>();
let nextId = 1;

export const reportsRepository = {
  create(userId: string, rawText: string): Report {
    const report: Report = {
      id: String(nextId++),
      user_id: userId,
      raw_text: rawText,
      ai_summary_json: null,
      status: 'draft',
      created_at: new Date().toISOString(),
    };
    reportsById.set(report.id, report);
    return report;
  },

  findById(id: string): Report | undefined {
    return reportsById.get(id);
  },

  update(id: string, patch: Partial<Pick<Report, 'raw_text' | 'ai_summary_json' | 'status'>>): Report | undefined {
    const existing = reportsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    reportsById.set(id, updated);
    return updated;
  },

  findLatestConfirmedByUserId(userId: string): Report | undefined {
    let latest: Report | undefined;
    for (const report of reportsById.values()) {
      if (report.user_id !== userId || report.status !== 'confirmed') continue;
      if (!latest || report.created_at > latest.created_at) latest = report;
    }
    return latest;
  },

  listConfirmedByUserId(userId: string): Report[] {
    return [...reportsById.values()].filter((r) => r.user_id === userId && r.status === 'confirmed');
  },

  // 「前回の確定済み報告」の参照表示(docs/spec/slice-02.md AC-5)を検証可能にするための
  // テスト専用フィクスチャ。呼び出し側（service）が対象ユーザーを限定する。
  // slice-02のAC-5テストはconfirmを経由しない設計のため恒久的に必要（reports.service.tsのコメント参照）。
  seedConfirmed(userId: string): void {
    const alreadyConfirmed = [...reportsById.values()].some(
      (r) => r.user_id === userId && r.status === 'confirmed',
    );
    if (alreadyConfirmed) return;
    const report: Report = {
      id: String(nextId++),
      user_id: userId,
      raw_text: '前回の業務報告（シード）',
      ai_summary_json: { incidents: [], achievements: ['前回分の実績'], issues: [], skills: [] },
      status: 'confirmed',
      created_at: new Date(0).toISOString(),
    };
    reportsById.set(report.id, report);
  },
};
