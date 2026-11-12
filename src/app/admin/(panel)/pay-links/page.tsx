'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, formatDate, formatMoney, useApi, type Page } from '@/components/admin/api';
import { useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface PayLink {
  id: string;
  prefix: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  creator: { id: string; name: string | null };
  description: string;
  currency: string;
  people: number;
  total: string;
  acceptsClaims: boolean;
}

export default function PayLinksPage() {
  const [state, setState] = useState('');
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (state) params.set('state', state);
  const { data, error, loading, reload } = useApi<Page<PayLink>>(`pay-links?${params}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader
        title="Pay links"
        subtitle="Short links people share so friends can pay by UPI, even without the app. Link codes are never shown here."
      />
      <div className="adm-filters">
        <select
          aria-label="Filter by state"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>No pay links.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th>Created by</th>
                    <th className="num">People</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.description || 'Shared expense'}
                        <div className="adm-muted">/p/{l.prefix}</div>
                      </td>
                      <td>
                        <Link href={`/admin/users/${l.creator.id}`}>{l.creator.name ?? 'Unknown'}</Link>
                      </td>
                      <td className="num">{l.people}</td>
                      <td className="num">{formatMoney(l.total, l.currency)}</td>
                      <td>
                        <Badge tone={l.active ? 'good' : 'neutral'}>{l.active ? 'active' : 'expired'}</Badge>{' '}
                        {l.acceptsClaims && <Badge tone="neutral">takes “I’ve paid”</Badge>}
                        <div className="adm-muted">expires {formatDate(l.expiresAt)}</div>
                      </td>
                      <td>{formatDate(l.createdAt, true)}</td>
                      <td className="adm-cell-actions">
                        {l.active && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-small adm-btn-danger-outline"
                            disabled={busy}
                            onClick={async () => {
                              if (
                                !(await confirm({
                                  title: 'Switch this link off?',
                                  body: 'Anyone opening it will see that it has expired. This cannot be undone.',
                                  confirmLabel: 'Switch off',
                                  danger: true,
                                }))
                              )
                                return;
                              if (await run(() => api(`pay-links/${l.id}/revoke`, { method: 'POST' }), 'Link switched off')) await reload();
                            }}
                          >
                            Switch off
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
