'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, formatDate, formatMoney, useApi } from '@/components/admin/api';
import { Modal, useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Pager, Stat, Status } from '@/components/admin/ui';
import type { Page } from '@/components/admin/api';

interface GroupDetail {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  settlements: number;
  members: { id: string; displayName: string; email: string; role: string; joinedAt: string }[];
  totals: { currency: string; count: number; total: string }[];
  recentExpenses: {
    id: string;
    description: string;
    amount: string;
    currency: string;
    date: string;
    category: string | null;
    paidBy: string | null;
  }[];
}

interface ExpenseRow {
  id: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  category: string | null;
  paidBy: string | null;
  attachments: number;
  deleted: boolean;
}

function GroupExpenses({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(0);
  const [deleted, setDeleted] = useState(false);
  const { data, error, loading, reload } = useApi<Page<ExpenseRow>>(
    `groups/${groupId}/expenses?page=${page}&size=15${deleted ? '&deleted=yes' : ''}`,
  );
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Expenses</h2>
        <label className="adm-check">
          <input
            type="checkbox"
            checked={deleted}
            onChange={(e) => {
              setDeleted(e.target.checked);
              setPage(0);
            }}
          />
          Show deleted
        </label>
      </div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.items.length === 0 ? (
          <Empty>No expenses.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Paid by</th>
                    <th>Date</th>
                    <th>Files</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr key={e.id} className={e.deleted ? 'is-deleted' : undefined}>
                      <td>
                        <Link href={`/admin/expenses/${e.id}`}>{e.description}</Link>{' '}
                        {e.deleted && <Badge tone="bad">Deleted</Badge>}
                        {e.category && <div className="adm-muted">{e.category}</div>}
                      </td>
                      <td>{e.paidBy ?? '—'}</td>
                      <td>{e.date}</td>
                      <td>{e.attachments > 0 ? `📎 ${e.attachments}` : '—'}</td>
                      <td className="num">{formatMoney(e.amount, e.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} />
          </>
        ))}
    </section>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<GroupDetail>(`groups/${id}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  return (
    <>
      <p className="adm-crumb">
        <Link href="/admin/groups">← Groups</Link>
      </p>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <>
          <PageHeader title={data.name} subtitle={`${data.currency} · created ${formatDate(data.createdAt)}`} />
          <section className="adm-card">
            <h2>Actions</h2>
            <div className="adm-actions">
              <button type="button" className="adm-btn" onClick={() => { setName(data.name); setRenaming(true); }}>
                Rename group
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger-outline"
                disabled={busy}
                onClick={async () => {
                  if (!(await confirm({
                    title: 'Delete this group?',
                    body: `This permanently deletes "${data.name}" with all of its expenses, settlements and balances for every member. This cannot be undone.`,
                    confirmLabel: 'Delete group',
                    danger: true,
                    requireText: data.name,
                  }))) return;
                  if (await run(() => api(`groups/${id}/delete`, { method: 'POST' }), 'Group deleted')) router.push('/admin/groups');
                }}
              >
                Delete group
              </button>
            </div>
          </section>

          <div className="adm-stats">
            <Stat label="Members" value={data.members.length} />
            <Stat label="Settlements" value={data.settlements} />
            {data.totals.map((t) => (
              <Stat key={t.currency} label={`Spent (${t.currency})`} value={formatMoney(t.total, t.currency)} hint={`${t.count} expenses`} />
            ))}
          </div>

          <section className="adm-card">
            <h2>Members</h2>
            <ul className="adm-list">
              {data.members.map((m) => (
                <li key={m.id}>
                  <span>
                    <Link href={`/admin/users/${m.id}`}>{m.displayName}</Link>{' '}
                    <span className="adm-muted">{m.email}</span>
                  </span>
                  <span className="adm-muted">
                    {m.role.toLowerCase()} · joined {formatDate(m.joinedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <GroupExpenses groupId={id} />
        </>
      )}
    {renaming && (
        <Modal title="Rename group" onClose={() => setRenaming(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => api(`groups/${id}`, { method: 'PATCH', body: { name: name.trim() } }), 'Group renamed')) {
                setRenaming(false);
                await reload();
              }
            }}
          >
            <label className="adm-field">
              Group name
              <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setRenaming(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
