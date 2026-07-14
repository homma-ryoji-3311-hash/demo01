import { Router, type Request, type Response, type NextFunction } from 'express';
import { loginSchema } from './auth.schema';
import { authService } from './auth.service';
import type { User } from './auth.repository';

const SESSION_COOKIE = 'session_token';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function getSessionToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE];
}

export const authRouter = Router();

// docs/spec/slice-01.md AC-1/AC-2: 本物のOAuthは実HTTP/Playwrightで自動化できないため、
// テスト専用のログインバイパスAPI（本番では無効化する）。
authRouter.post('/test-auth/login', (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'invalid email' });
    return;
  }
  const { email } = parsed.data;
  if (!authService.isAllowedDomain(email)) {
    res.status(403).json({ error: 'domain not allowed' });
    return;
  }
  const { token } = authService.login(email);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/`);
  res.status(200).json({ ok: true });
});

authRouter.post('/auth/logout', (req: Request, res: Response) => {
  authService.logout(getSessionToken(req));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
  res.status(204).send();
});

authRouter.get('/me', (req: Request, res: Response) => {
  const user = authService.getUserByToken(getSessionToken(req));
  if (!user) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  res.status(200).json({ email: user.email, name: user.name, role: user.role, group_id: user.group_id });
});

// reports等の保護APIから使う認可ミドルウェア（phase1-plan.md #3）。
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = authService.getUserByToken(getSessionToken(req));
  if (!user) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  req.user = user;
  next();
}
