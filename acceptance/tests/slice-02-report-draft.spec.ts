import { test, expect } from '@playwright/test';

// docs/spec/slice-02.md の書き起こし。source は各 AC を参照。
const OWNER_EMAIL = 'staff-owner@allowed.example.com';
const OTHER_EMAIL = 'staff-other@allowed.example.com';

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post('/test-auth/login', { data: { email } });
  expect(res.status()).toBe(200);
}

test.describe('slice-02-report-draft', () => {
  test('AC-1: 新規の下書きを作成できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const res = await request.post('/reports', { data: { raw_text: '本日の報告本文' } });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'draft');
  });

  test('AC-2: 空本文の下書き作成を拒否する', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const res = await request.post('/reports', { data: { raw_text: '' } });
    expect(res.status()).toBe(422);
  });

  test('AC-3: 下書きを自動保存できる（PATCH）', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '最初の本文' } });
    const created = await createRes.json();

    const patchRes = await request.patch(`/reports/${created.id}`, {
      data: { raw_text: '更新後の本文' },
    });
    expect(patchRes.status()).toBe(200);
    const body = await patchRes.json();
    expect(body).toHaveProperty('raw_text', '更新後の本文');
  });

  test('AC-4: 他人の下書きは自動保存できない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '所有者の本文' } });
    const created = await createRes.json();

    await loginAs(request, OTHER_EMAIL);
    const patchRes = await request.patch(`/reports/${created.id}`, {
      data: { raw_text: '横取りしようとする更新' },
    });
    expect(patchRes.status()).toBe(403);
  });

  test('AC-5: 前回の本文・AI要約を参照表示できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const res = await request.get('/reports/latest');
    expect(res.status()).toBe(200);
    // 過去に確定済みの報告がある前提のフィクスチャは実装側で用意する
    const body = await res.json();
    expect(body).toHaveProperty('raw_text');
    expect(body).toHaveProperty('ai_summary_json');
  });

  test('AC-6: 過去の確定済み報告が無ければ参照はnull相当', async ({ request }) => {
    await loginAs(request, OTHER_EMAIL);
    const res = await request.get('/reports/latest');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});
