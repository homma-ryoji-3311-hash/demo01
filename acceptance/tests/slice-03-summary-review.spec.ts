import { test, expect } from '@playwright/test';

// docs/spec/slice-03.md の書き起こし。source は各 AC を参照。
const OWNER_EMAIL = 'staff-owner@allowed.example.com';
const OTHER_EMAIL = 'staff-other@allowed.example.com';

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post('/test-auth/login', { data: { email } });
  expect(res.status()).toBe(200);
}

test.describe('slice-03-summary-review', () => {
  test('AC-1: AI要約を呼び出すと構造化JSONが返る', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: 'A社訪問。契約継続。' } });
    const created = await createRes.json();

    const res = await request.post(`/reports/${created.id}/summarize`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('incidents');
    expect(body).toHaveProperty('achievements');
    expect(body).toHaveProperty('issues');
    expect(body).toHaveProperty('skills');
  });

  test('AC-2: AI要約が失敗しても下書きは保存できる（degrade）', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '要約失敗を誘発する本文' } });
    const created = await createRes.json();

    const summarizeRes = await request.post(`/reports/${created.id}/summarize`);
    expect(summarizeRes.status()).toBe(502);

    const patchRes = await request.patch(`/reports/${created.id}`, {
      data: { raw_text: '要約失敗後も保存できる本文' },
    });
    expect(patchRes.status()).toBe(200);
  });

  test('AC-3: 他人の報告の要約は呼び出せない', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '所有者の本文' } });
    const created = await createRes.json();

    await loginAs(request, OTHER_EMAIL);
    const res = await request.post(`/reports/${created.id}/summarize`);
    expect(res.status()).toBe(403);
  });

  test('AC-4: 要約結果の全項目を編集できる', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: 'A社訪問。契約継続。' } });
    const created = await createRes.json();
    await request.post(`/reports/${created.id}/summarize`);

    const patchRes = await request.patch(`/reports/${created.id}`, {
      data: { ai_summary_json: { incidents: [], achievements: ['A社契約継続を確認'], issues: [], skills: [] } },
    });
    expect(patchRes.status()).toBe(200);
    const body = await patchRes.json();
    expect(body.ai_summary_json.achievements).toContain('A社契約継続を確認');
  });

  test('AC-5: 不確実・不足箇所には要確認フラグが付く', async ({ request }) => {
    await loginAs(request, OWNER_EMAIL);
    const createRes = await request.post('/reports', { data: { raw_text: '定量指標の無い曖昧な報告' } });
    const created = await createRes.json();

    const res = await request.post(`/reports/${created.id}/summarize`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // 判定基準自体は実装裁量（docs/spec/slice-03.md AC-5）。フィールドが存在することのみ検証する。
    expect(JSON.stringify(body)).toMatch(/要確認|needs_review/);
  });
});
