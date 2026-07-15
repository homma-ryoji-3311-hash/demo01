import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth/auth.router';
import { createReportSchema, patchReportSchema } from './reports.schema';
import {
  reportsService,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
  SummarizerFailureError,
} from './reports.service';

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

// docs/spec/slice-05.md AC-1/AC-2: 自分の確定済み報告一覧（draftは含めない）。
reportsRouter.get('/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reports = reportsService.listConfirmed(req.user!.id);
  res.status(200).json(reports);
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
    if (err instanceof ConflictError) {
      res.status(409).json({ error: 'report already confirmed' });
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

reportsRouter.post('/reports/:id/summarize', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await reportsService.summarizeReport(req.user!.id, req.params.id);
    res.status(200).json(summary);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (err instanceof SummarizerFailureError) {
      // degrade（report-quality-design.md §10.1）: 失敗を502で返すのみ。下書き保存(PATCH)は別経路で継続可能。
      res.status(502).json({ error: 'summarizer failed' });
      return;
    }
    throw err;
  }
});

reportsRouter.post('/reports/:id/confirm', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = reportsService.confirmReport(req.user!.id, req.params.id);
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
    if (err instanceof ConflictError) {
      res.status(409).json({ error: 'report already confirmed' });
      return;
    }
    if (err instanceof UnprocessableError) {
      res.status(422).json({ error: 'raw_text is required' });
      return;
    }
    throw err;
  }
});

// docs/spec/slice-05.md AC-3/AC-4/AC-5: /reports/latest より後に定義する
// （'/reports/latest' は既に上で定義済みなので 'latest' がこの :id に食われることはない）。
reportsRouter.get('/reports/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = reportsService.getDetail(req.user!.id, req.params.id);
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
