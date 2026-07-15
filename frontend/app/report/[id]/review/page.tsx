'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type Report } from '../../../../lib/api';

// docs/spec/slice-03.md: AI要約 確認・編集画面。
// 「確定」ボタンはslice-04で追加される（このスライスでは着手しない。指示書「4」参照）。
function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ReportReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [fields, setFields] = useState({ incidents: '', achievements: '', issues: '', skills: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.me();
        const r = await api.getReport(params.id);
        if (cancelled) return;
        setReport(r);
        if (r.ai_summary_json) {
          setFields({
            incidents: r.ai_summary_json.incidents.join('\n'),
            achievements: r.ai_summary_json.achievements.join('\n'),
            issues: r.ai_summary_json.issues.join('\n'),
            skills: r.ai_summary_json.skills.join('\n'),
          });
        }
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
  }, [params.id, router]);

  async function handleSummarize() {
    setSummarizing(true);
    setMessage(null);
    try {
      const summary = await api.summarize(params.id);
      setFields({
        incidents: summary.incidents.join('\n'),
        achievements: summary.achievements.join('\n'),
        issues: summary.issues.join('\n'),
        skills: summary.skills.join('\n'),
      });
      if (summary.needs_review) {
        setMessage(`要確認: ${summary.needs_review_reason ?? '内容を見直してください'}`);
      }
    } catch (err) {
      // degrade（report-quality-design.md §10.1）: 要約失敗でも下書きは保存済みのまま。
      if (err instanceof ApiError && err.status === 502) {
        setMessage('AI要約の呼び出しに失敗しました。本文は保存されています。時間をおいて再度お試しください。');
      } else {
        setMessage('要約に失敗しました。');
      }
    } finally {
      setSummarizing(false);
    }
  }

  async function handleSaveEdits() {
    const updated = await api.patchReport(params.id, {
      ai_summary_json: {
        incidents: linesToArray(fields.incidents),
        achievements: linesToArray(fields.achievements),
        issues: linesToArray(fields.issues),
        skills: linesToArray(fields.skills),
      },
    });
    setReport(updated);
    setMessage('編集内容を保存しました');
  }

  if (loading) return <main>読み込み中...</main>;
  if (!report) return <main>報告が見つかりません。</main>;

  return (
    <main>
      <h1>AI要約 確認・編集</h1>
      <p>本文: {report.raw_text}</p>

      {!report.ai_summary_json && (
        <button type="button" onClick={handleSummarize} disabled={summarizing}>
          {summarizing ? '要約中...' : 'AI要約する'}
        </button>
      )}

      {report.ai_summary_json && (
        <>
          <label>
            インシデント（1行1件）
            <textarea
              value={fields.incidents}
              onChange={(e) => setFields((f) => ({ ...f, incidents: e.target.value }))}
            />
          </label>
          <label>
            成果（1行1件）
            <textarea
              value={fields.achievements}
              onChange={(e) => setFields((f) => ({ ...f, achievements: e.target.value }))}
            />
          </label>
          <label>
            課題（1行1件）
            <textarea
              value={fields.issues}
              onChange={(e) => setFields((f) => ({ ...f, issues: e.target.value }))}
            />
          </label>
          <label>
            抽出スキル（1行1件）
            <textarea
              value={fields.skills}
              onChange={(e) => setFields((f) => ({ ...f, skills: e.target.value }))}
            />
          </label>
          <button type="button" onClick={handleSaveEdits}>
            編集を保存
          </button>
        </>
      )}

      {message && <p role="alert">{message}</p>}
    </main>
  );
}
