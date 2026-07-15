const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface User {
  email: string;
  name: string;
  role: string;
  group_id: string;
}

// reports関連の型・APIメソッドはslice-02以降がそれぞれ自分のスコープ分だけ追記する
// （backend/src/reports/*と同じ、スライスごとの漸進的拡張パターン。slice-01はauthのみ）。
export const api = {
  login: (email: string) => request<{ ok: true }>('/test-auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/me'),
};
