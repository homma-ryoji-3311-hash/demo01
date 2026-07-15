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

export interface Report {
  id: string;
  user_id: string;
  raw_text: string;
  ai_summary_json: {
    incidents: string[];
    achievements: string[];
    issues: string[];
    skills: string[];
    needs_review?: boolean;
    needs_review_reason?: string;
  } | null;
  status: 'draft' | 'confirmed';
  created_at: string;
}

export const api = {
  login: (email: string) => request<{ ok: true }>('/test-auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/me'),
  createReport: (rawText: string) => request<Report>('/reports', { method: 'POST', body: JSON.stringify({ raw_text: rawText }) }),
  patchReport: (id: string, patch: { raw_text?: string; ai_summary_json?: Report['ai_summary_json'] }) =>
    request<Report>(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  latestReport: () => request<Report | null>('/reports/latest'),
  summarize: (id: string) => request<NonNullable<Report['ai_summary_json']>>(`/reports/${id}/summarize`, { method: 'POST' }),
  confirmReport: (id: string) => request<Report>(`/reports/${id}/confirm`, { method: 'POST' }),
  listReports: () => request<Report[]>('/reports'),
  getReport: (id: string) => request<Report>(`/reports/${id}`),
};
