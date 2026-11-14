'use client';

import Icon from '@/components/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { formatDate, useApi, useDebounced, type Page } from '@/components/admin/api';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string;
  createdAt: string;
  emailVerified: boolean;
  google: boolean;
  suspended: boolean;
  groups: number;
  premium: boolean;
  isContact: boolean;
  upiId: string | null;
  upiVerified: boolean;
}

export default function UsersPage() {
  const [q, setQ] = useState('');
  const [verified, setVerified] = useState('');
  const [page, setPage] = useState(0);
  const search = useDebounced(q);
  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (search.trim()) params.set('q', search.trim());
  if (verified) params.set('verified', verified);
  const { data, error, loading, reload } = useApi<Page<UserRow>>(`users?${params}`);

  return (
    <>
      <PageHeader title="Users" subtitle="Everyone who has signed up for the app." />
      <div className="adm-filters">
        <input
          type="search"
          placeholder="Search name or email"
          aria-label="Search users"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
        <select
          aria-label="Email verification"
          value={verified}
          onChange={(e) => {
            setVerified(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All users</option>
          <option value="yes">Verified</option>
          <option value="no">Not verified</option>
        </select>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <>
          {data.items.length === 0 ? (
            <Empty>No users match.</Empty>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th className="num">Groups</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link href={`/admin/users/${u.id}`}>{u.displayName}</Link>
                        <div className="adm-muted">{u.email}</div>
                      </td>
                      <td className="adm-badges">
                        <Badge tone={u.emailVerified ? 'good' : 'warn'}>{u.emailVerified ? 'Verified' : 'Unverified'}</Badge>
                        {u.suspended && <Badge tone="bad">Suspended</Badge>}
                        {u.premium && <Badge tone="good">Premium</Badge>}
                        {u.isContact && <Badge tone="warn">Contact</Badge>}
                        {u.upiId && <Badge tone={u.upiVerified ? 'good' : 'neutral'}>UPI {u.upiVerified && <Icon name="check" size={12} inline />}</Badge>}
                        {u.google && <Badge>Google</Badge>}
                      </td>
                      <td className="num">{u.groups}</td>
                      <td>{formatDate(u.createdAt)}</td>
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
