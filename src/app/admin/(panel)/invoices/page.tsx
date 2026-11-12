'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate, formatMoney, useApi, type Page } from '@/components/admin/api';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Invoice {
  number: string;
  status: 'PAID' | 'PARTIAL';
  currency: string;
  total: string;
  paid: string;
  paidAt: string;
  items: number;
  groupId: string;
  groupName: string | null;
  payee: { id: string; name: string | null };
  payer: { id: string; name: string | null };
}

export default function InvoicesPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (search) params.set('q', search);
  const { data, error, loading, reload } = useApi<Page<Invoice>>(`invoices?${params}`);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Every invoice and receipt issued when a payment was confirmed. Search by invoice number, name, group or item."
      />
      <form
        className="adm-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
          setPage(0);
        }}
      >
        <input
          type="search"
          aria-label="Search invoices"
          placeholder="e.g. SE-2026-000012"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="adm-btn">
          Search
        </button>
      </form>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>{search ? `No invoices match “${search}”.` : 'No invoices yet.'}</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Billed to</th>
                    <th>Paid to</th>
                    <th>Group</th>
                    <th className="num">Paid</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((i) => (
                    <tr key={i.number}>
                      <td>
                        <strong>{i.number}</strong>
                        <div className="adm-muted">{i.items} {i.items === 1 ? 'item' : 'items'}</div>
                      </td>
                      <td>
                        <Link href={`/admin/users/${i.payer.id}`}>{i.payer.name ?? 'Unknown'}</Link>
                      </td>
                      <td>
                        <Link href={`/admin/users/${i.payee.id}`}>{i.payee.name ?? 'Unknown'}</Link>
                      </td>
                      <td>
                        <Link href={`/admin/groups/${i.groupId}`}>{i.groupName ?? 'Group'}</Link>
                      </td>
                      <td className="num">
                        {formatMoney(i.paid, i.currency)}
                        {i.status === 'PARTIAL' && <div className="adm-muted">of {formatMoney(i.total, i.currency)}</div>}
                      </td>
                      <td>
                        <Badge tone={i.status === 'PAID' ? 'good' : 'warn'}>{i.status === 'PAID' ? 'paid' : 'part paid'}</Badge>
                      </td>
                      <td>{formatDate(i.paidAt, true)}</td>
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
