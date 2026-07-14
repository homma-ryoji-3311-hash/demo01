import { test, expect } from '@playwright/test';

// docs/spec/slice-04.md の書き起こし。source は各 AC を参照。
const OWNER_EMAIL = 'staff-owner@allowed.example.com';
const OTHER_EMAIL = 'staff-other@allowed.example.com';

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post('/test-auth/login', { data: { email } });
  expect(res.status()).toBe(200);
}

test.describe('slice-04-report-confirm', () => {
  test('AC-1: 報告を確定できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: 'A社訪問。契約継続。' } });
    const created = await createRes.json();

    const res = await request.post(`/reports/${created.id}/confirm`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'confirmed');
  });

  test('AC-2: 確定後は不変（編集不可）', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '確定予定の本文' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/confirm`);

    const patchRes = await request.patch(`/reports/${created.id}`, {
      data: { raw_text: '確定後に変更しようとする本文' },
    });
    expect(patchRes.status()).toBe(409);
  });

  test('AC-3: 確定済みの報告は再確定できない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '確定予定の本文' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/confirm`);

    const res = await request.post(`/reports/${created.id}/confirm`);
    expect(res.status()).toBe(409);
  });

  test('AC-4: 必須項目が欠落した状態では確定できない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '本文をあとで空にする' } });
    const created = await createRes.json();

    // slice-02 AC-2 によりPOST作成時の空本文は422で拒否されるため、
    // 「本文が空のdraft」はPATCHで空に更新した状態として再現する。
    await request.patch(`/reports/${created.id}`, { data: { raw_text: '' } });

    const res = await request.post(`/reports/${created.id}/confirm`);
    expect(res.status()).toBe(422);
  });

  test('AC-5: 他人の報告は確定できない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '所有者の本文' } });
    const created = await createRes.json();

    await loginAs(request, OTHER_EMAIL);
    const res = await request.post(`/reports/${created.id}/confirm`);
    expect(res.status()).toBe(403);
  });
});
