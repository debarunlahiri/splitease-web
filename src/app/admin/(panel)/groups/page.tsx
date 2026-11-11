'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate, useApi, useDebounced, type Page } from '@/components/admin/api';
import { Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface GroupRow {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  owner: string | null;
  members: number;
  expenses: number;
}

export default function GroupsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const search = useDebounced(q);
  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (search.trim()) params.set('q', search.trim());
  const { data, error, loading, reload } = useApi<Page<GroupRow>>(`groups?${params}`);

  return (
    <>
      <PageHeader title="Groups" subtitle="Expense groups created in the app." />
      <div className="adm-filters">
        <input
          type="search"
          placeholder="Search group name"
          aria-label="Search groups"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <>
          {data.items.length === 0 ? (
            <Empty>No groups match.</Empty>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Created by</th>
                    <th className="num">Members</th>
                    <th className="num">Expenses</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <Link href={`/admin/groups/${g.id}`}>{g.name}</Link>
                        <div className="adm-muted">{g.currency}</div>
                      </td>
                      <td>{g.owner ?? '—'}</td>
                      <td className="num">{g.members}</td>
                      <td className="num">{g.expenses}</td>
                      <td>{formatDate(g.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} />
        </>
      )}
    </>
  );
}
