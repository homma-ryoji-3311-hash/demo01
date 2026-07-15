import { z } from 'zod';

export const createReportSchema = z.object({
  raw_text: z.string().min(1),
});

export const patchReportSchema = z.object({
  raw_text: z.string().min(1).optional(),
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
