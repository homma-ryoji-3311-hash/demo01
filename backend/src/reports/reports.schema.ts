import { z } from 'zod';

export const createReportSchema = z.object({
  raw_text: z.string().min(1),
});

export const patchReportSchema = z.object({
  // 空文字を許可する（下書き自動保存は「全消し」も正当な状態。空文字の拒否は
  // 確定(confirm)時の必須項目チェックの責務。docs/spec/slice-04.md AC-4）。
  raw_text: z.string().optional(),
  // docs/spec/slice-03.md AC-4: 要約結果の全項目を編集できる。
  ai_summary_json: z
    .object({
      incidents: z.array(z.string()),
      achievements: z.array(z.string()),
      issues: z.array(z.string()),
      skills: z.array(z.string()),
    })
    .passthrough()
    .optional(),
});
