import { z } from 'zod';

export const createReportSchema = z.object({
  raw_text: z.string().min(1),
});

export const patchReportSchema = z.object({
  raw_text: z.string().min(1).optional(),
});
