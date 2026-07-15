'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, type Report } from '../../lib/api';

// docs/spec/slice-05.md: 自分の確定済み報告の一覧。draft状態は含まない。
export default function ReportsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.me();
        const list = await api.listReports();
        if (!cancelled) setReports(list);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <main>読み込み中...</main>;

  return (
    <main>
      <h1>自分の確定済み報告</h1>
      {reports.length === 0 && <p>確定済みの報告はまだありません。</p>}
      <ul>
        {reports.map((r) => (
          <li key={r.id}>
            <Link href={`/reports/${r.id}`}>{r.created_at}: {r.raw_text.slice(0, 30)}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
