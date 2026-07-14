import { authRepository, type User } from './auth.repository';

// docs/spec/slice-01.md AC-1/AC-2: 許可ドメインでのログインのみ許可する（テストバイパスAPI）。
const ALLOWED_DOMAIN = 'allowed.example.com';

const sessions = new Map<string, string>(); // token -> userId

function randomToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export const authService = {
  isAllowedDomain(email: string): boolean {
    return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
  },

  login(email: string): { user: User; token: string } {
    const user = authRepository.upsertByEmail(email);
    const token = randomToken();
    sessions.set(token, user.id);
    return { user, token };
  },

  logout(token: string | undefined): void {
    if (token) sessions.delete(token);
  },

  getUserByToken(token: string | undefined): User | undefined {
    if (!token) return undefined;
    const userId = sessions.get(token);
    if (!userId) return undefined;
    return authRepository.findById(userId);
  },
};
