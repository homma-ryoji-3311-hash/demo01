import { test, expect } from '@playwright/test';

// docs/spec/slice-05.md の書き起こし。source は各 AC を参照。
const OWNER_EMAIL = 'staff-owner@allowed.example.com';
const OTHER_EMAIL = 'staff-other@allowed.example.com';

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post('/test-auth/login', { data: { email } });
  expect(res.status()).toBe(200);
}

test.describe('slice-05-report-history', () => {
  test('AC-1: 自分の確定済み報告の一覧を取得できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: 'A社訪問。契約継続。' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/confirm`);

    const res = await request.get('/reports');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((r: { id: string }) => r.id === created.id)).toBe(true);
  });

  test('AC-2: draft状態の報告は一覧に含まれない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '編集途中の下書き' } });
    const created = await createRes.json();

    const res = await request.get('/reports');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((r: { id: string }) => r.id === created.id)).toBe(false);
  });

  test('AC-3: 自分の確定済み報告の詳細を取得できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: 'A社訪問。契約継続。' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/confirm`);

    const res = await request.get(`/reports/${created.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('raw_text');
    expect(body).toHaveProperty('ai_summary_json');
  });

  test('AC-4: 他人の報告は一覧にも詳細にも出ない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '所有者の本文' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/confirm`);

    await loginAs(request, OTHER_EMAIL);
    const detailRes = await request.get(`/reports/${created.id}`);
    expect(detailRes.status()).toBe(403);

    const listRes = await request.get('/reports');
    const listBody = await listRes.json();
    expect(listBody.some((r: { id: string }) => r.id === created.id)).toBe(false);
  });

  test('AC-5: 存在しない報告IDは404', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const res = await request.get('/reports/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });
});
