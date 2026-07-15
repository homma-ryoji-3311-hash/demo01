'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type Report } from '../../../lib/api';

// docs/spec/slice-05.md: 自分の確定済み報告の詳細（確認のみ）。
export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.me();
        const r = await api.getReport(params.id);
        if (!cancelled) setReport(r);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
        } else if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          setErrorMessage('この報告は閲覧できません。');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  if (loading) return <main>読み込み中...</main>;
  if (errorMessage) return <main>{errorMessage}</main>;
  if (!report) return <main>報告が見つかりません。</main>;

  return (
    <main>
      <h1>報告詳細</h1>
      <p>報告日時: {report.created_at}</p>
      <section>
        <h2>本文</h2>
        <p>{report.raw_text}</p>
      </section>
      {report.ai_summary_json && (
        <section>
          <h2>AI要約</h2>
          <p>インシデント: {report.ai_summary_json.incidents.join(', ') || 'なし'}</p>
          <p>成果: {report.ai_summary_json.achievements.join(', ') || 'なし'}</p>
          <p>課題: {report.ai_summary_json.issues.join(', ') || 'なし'}</p>
          <p>抽出スキル: {report.ai_summary_json.skills.join(', ') || 'なし'}</p>
        </section>
      )}
    </main>
  );
}
