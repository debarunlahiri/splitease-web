'use client';

import { useState } from 'react';
import { api, formatDate, useApi, useDebounced, type Page } from '@/components/admin/api';
import { useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Row {
  email: string;
  requestedAt: string;
  confirmedAt: string | null;
}

export default function IosWaitlistPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const search = useDebounced(q);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (search.trim()) params.set('q', search.trim());
  const { data, error, loading, reload } = useApi<Page<Row>>(`ios-waitlist?${params}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();

  async function exportCsv() {
    await run(async () => {
      const rows = await api<Row[]>('ios-waitlist/export');
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csv = ['email,requested_at,confirmed_at', ...rows.map((r) => [esc(r.email), r.requestedAt, r.confirmedAt ?? ''].join(','))].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ios-waitlist.csv';
      link.click();
      URL.revokeObjectURL(url);
      return rows.length;
    }, (n) => `Exported ${n} emails`);
  }

  return (
    <>
      <PageHeader
        title="iOS waitlist"
        subtitle="People who asked to be emailed when SplitEase launches on iPhone."
        actions={
          <button type="button" className="adm-btn" disabled={busy} onClick={() => void exportCsv()}>
            Export CSV
          </button>
        }
      />
      <div className="adm-filters">
        <input
          type="search"
          placeholder="Search email"
          aria-label="Search waitlist"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>Nobody on the waitlist yet.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.email}>
                      <td>{r.email}</td>
                      <td>
                        <Badge tone={r.confirmedAt ? 'good' : 'warn'}>{r.confirmedAt ? 'Confirmed' : 'Unconfirmed'}</Badge>
                      </td>
                      <td>{formatDate(r.requestedAt, true)}</td>
                      <td className="adm-cell-actions">
                        <button
                          type="button"
                          className="adm-btn adm-btn-small adm-btn-danger-outline"
                          disabled={busy}
                          onClick={async () => {
                            if (!(await confirm({ title: 'Remove from waitlist?', body: r.email, confirmLabel: 'Remove', danger: true }))) return;
                            if (await run(() => api(`ios-waitlist/${encodeURIComponent(r.email)}/remove`, { method: 'POST' }), 'Removed')) await reload();
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} />
          </>
        ))}
    </>
  );
}
