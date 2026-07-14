import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth/auth.router';
import { createReportSchema, patchReportSchema } from './reports.schema';
import { reportsService, ForbiddenError, NotFoundError } from './reports.service';

export const reportsRouter = Router();

reportsRouter.post('/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'invalid raw_text' });
    return;
  }
  const report = reportsService.createDraft(req.user!.id, parsed.data.raw_text);
  res.status(201).json(report);
});

reportsRouter.patch('/reports/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parsed = patchReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'invalid patch body' });
    return;
  }
  try {
    const report = reportsService.patchReport(req.user!.id, req.params.id, parsed.data);
    res.status(200).json(report);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    throw err;
  }
});

// docs/spec/slice-02.md AC-5/AC-6: /reports より前に定義し、:id ルートに 'latest' が食われないようにする。
reportsRouter.get('/reports/latest', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const latest = reportsService.getLatestConfirmed(req.user!.id, req.user!.email);
  res.status(200).json(latest ?? null);
});
