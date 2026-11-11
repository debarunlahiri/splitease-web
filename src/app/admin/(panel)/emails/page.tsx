'use client';

import { useState } from 'react';
import { api, formatDate, useApi, type Page } from '@/components/admin/api';
import { useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Mail {
  id: string;
  kind: string;
  to: string;
  subject: string;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  failedAt: string | null;
  lastError: string | null;
  status: 'sent' | 'failed' | 'pending';
}

const TONE = { sent: 'good', failed: 'bad', pending: 'warn' } as const;

export default function EmailsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (status) params.set('status', status);
  const { data, error, loading, reload } = useApi<Page<Mail>>(`emails?${params}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader title="Email queue" subtitle="Outgoing emails and their delivery state. Message bodies are never shown." />
      <div className="adm-filters">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All</option>
          <option value="pending">Waiting</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>No emails.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="num">Tries</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.to}
                        <div className="adm-muted adm-clamp">{m.subject}</div>
                        {m.lastError && m.status !== 'sent' && <div className="adm-bad adm-clamp">{m.lastError}</div>}
                      </td>
                      <td>{m.kind}</td>
                      <td>
                        <Badge tone={TONE[m.status]}>{m.status}</Badge>
                      </td>
                      <td className="num">{m.attempts}</td>
                      <td>{formatDate(m.createdAt, true)}</td>
                      <td className="adm-cell-actions">
                        {m.status === 'failed' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-small"
                            disabled={busy}
                            onClick={async () => {
                              if (await run(() => api(`emails/${m.id}/retry`, { method: 'POST' }), 'Queued for another try')) await reload();
                            }}
                          >
                            Retry
                          </button>
                        )}
                        {m.status !== 'sent' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-small adm-btn-danger-outline"
                            disabled={busy}
                            onClick={async () => {
                              if (!(await confirm({ title: 'Discard this email?', body: `It will never be sent to ${m.to}.`, confirmLabel: 'Discard', danger: true }))) return;
                              if (await run(() => api(`emails/${m.id}/discard`, { method: 'POST' }), 'Email discarded')) await reload();
                            }}
                          >
                            Discard
                          </button>
                        )}
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
