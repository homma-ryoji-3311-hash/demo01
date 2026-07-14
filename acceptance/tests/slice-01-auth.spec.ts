import { test, expect } from '@playwright/test';

// docs/spec/slice-01.md の書き起こし。source は各 AC を参照。
const ALLOWED_EMAIL = 'staff@allowed.example.com';
const BLOCKED_EMAIL = 'staff@blocked.example.com';

test.describe('slice-01-auth', () => {
  test('AC-1: 許可ドメインのアカウントでログインすると認証済みセッションが確立する', async ({ request }) => {
    const res = await request.post('/test-auth/login', { data: { email: ALLOWED_EMAIL } });
    expect(res.status()).toBe(200);
  });

  test('AC-2: 許可ドメイン外のアカウントはログインを拒否される', async ({ request }) => {
    const res = await request.post('/test-auth/login', { data: { email: BLOCKED_EMAIL } });
    expect(res.status()).toBe(403);
  });

  test('AC-3: 未ログイン状態で保護APIを呼ぶと401になる', async ({ request }) => {
    const res = await request.get('/me');
    expect(res.status()).toBe(401);
  });

  test('AC-4: ログイン済みユーザーは自分のユーザー情報を取得できる', async ({ request }) => {
    const loginRes = await request.post('/test-auth/login', { data: { email: ALLOWED_EMAIL } });
    expect(loginRes.status()).toBe(200);

    const meRes = await request.get('/me');
    expect(meRes.status()).toBe(200);

    const body = await meRes.json();
    expect(body).toHaveProperty('email', ALLOWED_EMAIL);
    expect(body).toHaveProperty('role');
    expect(body).toHaveProperty('group_id');
  });
});
