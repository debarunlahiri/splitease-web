'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate, useApi, type Page } from '@/components/admin/api';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Entry {
  id: string;
  admin: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: Record<string, unknown> | string | null;
  createdAt: string;
}

const FILTERS = [
  ['', 'Everything'],
  ['user', 'Users'],
  ['group', 'Groups'],
  ['subscription', 'Subscriptions'],
  ['plan', 'Plans'],
  ['announcement', 'Announcements'],
  ['email', 'Emails'],
  ['release', 'Releases'],
  ['admin', 'Admins'],
];

function link(entry: Entry): string | null {
  if (!entry.targetId) return null;
  if (entry.targetType === 'user') return `/admin/users/${entry.targetId}`;
  if (entry.targetType === 'group') return `/admin/groups/${entry.targetId}`;
  return null;
}

function summary(detail: Entry['detail']): string {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  return Object.entries(detail)
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(' · ');
}

export default function ActivityPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({ page: String(page), size: '25' });
  if (action) params.set('action', action);
  const { data, error, loading, reload } = useApi<Page<Entry>>(`audit?${params}`);

  return (
    <>
      <PageHeader title="Activity log" subtitle="Every change an admin has made, newest first." />
      <div className="adm-filters">
        <select
          aria-label="Filter activity"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
        >
          {FILTERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>No activity yet.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => {
                    const href = link(e);
                    return (
                      <tr key={e.id}>
                        <td>{formatDate(e.createdAt, true)}</td>
                        <td>{e.admin}</td>
                        <td>
                          <Badge>{e.action.replace('.', ' · ')}</Badge>
                        </td>
                        <td>
                          <span className="adm-muted adm-clamp">{summary(e.detail)}</span>
                          {href && <Link href={href}>Open</Link>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} />
          </>
        ))}
    </>
  );
}
