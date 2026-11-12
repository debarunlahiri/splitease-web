'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate, formatMoney, useApi, type Page } from '@/components/admin/api';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Claim {
  id: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  resolvedAt: string | null;
  expenseId: string;
  description: string;
  groupId: string;
  groupName: string;
  claimant: { id: string; name: string | null };
  payer: { id: string; name: string | null };
}

const TONE = { PENDING: 'warn', CONFIRMED: 'good', REJECTED: 'bad' } as const;
const LABEL = { PENDING: 'waiting for payer', CONFIRMED: 'confirmed', REJECTED: 'not received' } as const;

export default function ClaimsPage() {
  const initial = typeof window === 'undefined' ? '' : (new URLSearchParams(window.location.search).get('status') ?? '');
  const [status, setStatus] = useState(initial);
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (status) params.set('status', status);
  const { data, error, loading, reload } = useApi<Page<Claim>>(`claims?${params}`);

  return (
    <>
      <PageHeader
        title="Payment claims"
        subtitle="People who tapped “I’ve paid”, and whether the payer has confirmed the money arrived."
      />
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
          <option value="PENDING">Waiting for the payer</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Not received</option>
        </select>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>No claims.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Who paid</th>
                    <th>To</th>
                    <th>Expense</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                    <th>Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/users/${c.claimant.id}`}>{c.claimant.name ?? 'Unknown'}</Link>
                      </td>
                      <td>
                        <Link href={`/admin/users/${c.payer.id}`}>{c.payer.name ?? 'Unknown'}</Link>
                      </td>
                      <td>
                        <Link href={`/admin/expenses/${c.expenseId}`}>{c.description}</Link>
                        <div className="adm-muted">
                          <Link href={`/admin/groups/${c.groupId}`}>{c.groupName}</Link>
                        </div>
                      </td>
                      <td className="num">{formatMoney(c.amount, c.currency)}</td>
                      <td>
                        <Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge>
                      </td>
                      <td>
                        {formatDate(c.createdAt, true)}
                        {c.resolvedAt && <div className="adm-muted">resolved {formatDate(c.resolvedAt, true)}</div>}
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
