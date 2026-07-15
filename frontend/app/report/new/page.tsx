'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type Report } from '../../../lib/api';

// docs/spec/slice-02.md: 報告入力画面。下書き自動保存(PATCH)・前回本文/要約の参照表示。
export default function ReportNewPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [previous, setPrevious] = useState<Report | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.me();
        const latest = await api.latestReport();
        if (!cancelled) setPrevious(latest);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSave() {
    setStatus('saving');
    try {
      if (!reportId) {
        const created = await api.createReport(rawText);
        setReportId(created.id);
      } else {
        await api.patchReport(reportId, { raw_text: rawText });
      }
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  if (loading) return <main>読み込み中...</main>;

  return (
    <main>
      <h1>報告入力</h1>
      {previous && (
        <section aria-label="前回参照">
          <h2>前回の報告（参照・編集不可）</h2>
          <p>{previous.raw_text}</p>
        </section>
      )}
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        onBlur={handleSave}
        rows={10}
        placeholder="本日の業務報告を自由文で入力してください"
      />
      <p>
        {status === 'saving' && '保存中...'}
        {status === 'saved' && '保存しました'}
        {status === 'error' && '保存に失敗しました'}
      </p>
      <button type="button" onClick={handleSave} disabled={!rawText}>
        保存
      </button>
      {reportId && (
        <button type="button" onClick={() => router.push(`/report/${reportId}/review`)}>
          AI要約へ進む
        </button>
      )}
    </main>
  );
}
