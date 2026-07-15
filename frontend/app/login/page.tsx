'use client';

import { useState } from 'react';
import { api, ApiError } from '../../lib/api';

// テスト専用ログインバイパス(docs/spec/slice-01.md AC-1/AC-2)のUI。
// 本物のGoogle OAuth結線は範囲外（overview.md §1、実装後の手動確認事項）。
// ログイン後の遷移先(報告入力画面)はslice-02の領域のため、ここでは参照しない。
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login(email);
      setLoggedIn(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('許可されていないドメインのメールアドレスです。');
      } else {
        setError('ログインに失敗しました。');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loggedIn) {
    return (
      <main>
        <p role="status">ログインしました。</p>
      </main>
    );
  }

  return (
    <main>
      <h1>ログイン（テスト用）</h1>
      <p>本物のGoogle OAuthは未結線です。許可ドメインのメールアドレスで疑似ログインします。</p>
      <form onSubmit={handleSubmit}>
        <label>
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          ログイン
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
