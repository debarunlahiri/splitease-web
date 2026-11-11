'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, formatDate, formatMoney, useApi } from '@/components/admin/api';
import { Modal, useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, PageHeader, Stat, Status } from '@/components/admin/ui';

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
}

interface ExpenseDetail {
  id: string;
  groupId: string;
  groupName: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  category: string | null;
  notes: string | null;
  splitType: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  paidBy: { id: string; name: string | null; email: string | null };
  shares: { userId: string; name: string | null; email: string | null; amount: string }[];
  attachments: Attachment[];
  history: { action: string; revision: number; actor: string | null; at: string }[];
}

const fileUrl = (id: string) => `/api/admin/proxy/attachments/${id}`;
const isImage = (type: string) => /^image\/(png|jpe?g|gif|webp)$/i.test(type);
const isPdf = (type: string) => type.toLowerCase() === 'application/pdf';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<ExpenseDetail>(`expenses/${id}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [viewing, setViewing] = useState<Attachment | null>(null);

  if (!data) {
    return (
      <>
        <p className="adm-crumb">
          <Link href="/admin/groups">← Groups</Link>
        </p>
        <Status loading={loading} error={error} onRetry={reload} />
      </>
    );
  }

  const deleted = !!data.deletedAt;

  return (
    <>
      <p className="adm-crumb">
        <Link href={`/admin/groups/${data.groupId}`}>← {data.groupName}</Link>
      </p>
      <PageHeader
        title={data.description}
        subtitle={`${formatMoney(data.amount, data.currency)} · ${data.date}`}
        actions={deleted ? <Badge tone="bad">Deleted</Badge> : undefined}
      />

      <div className="adm-stats">
        <Stat label="Paid by" value={data.paidBy.name ?? '—'} hint={data.paidBy.email ?? undefined} />
        <Stat label="Category" value={data.category ?? '—'} />
        <Stat label="Split" value={data.splitType.toLowerCase().replace('_', ' ')} />
        <Stat label="Added" value={formatDate(data.createdAt)} hint={data.updatedAt ? `edited ${formatDate(data.updatedAt)}` : undefined} />
      </div>

      {data.notes && (
        <section className="adm-card">
          <h2>Notes</h2>
          <p className="adm-pre">{data.notes}</p>
        </section>
      )}

      <section className="adm-card">
        <h2>Attachments ({data.attachments.length})</h2>
        {data.attachments.length === 0 ? (
          <p className="adm-muted">No attachments.{deleted && ' Attachments are removed when an expense is deleted.'}</p>
        ) : (
          <ul className="adm-files">
            {data.attachments.map((a) => (
              <li key={a.id} className="adm-file">
                {isImage(a.contentType) ? (
                  <button type="button" className="adm-thumb" onClick={() => setViewing(a)} aria-label={`View ${a.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(a.id)} alt="" loading="lazy" />
                  </button>
                ) : (
                  <div className="adm-thumb adm-thumb-doc" aria-hidden="true">
                    {isPdf(a.contentType) ? 'PDF' : (a.name.split('.').pop() ?? 'FILE').slice(0, 4).toUpperCase()}
                  </div>
                )}
                <div className="adm-file-meta">
                  <strong>{a.name}</strong>
                  <span className="adm-muted">
                    {formatSize(a.size)} · {a.contentType}
                  </span>
                </div>
                <div className="adm-cell-actions">
                  {isImage(a.contentType) ? (
                    <button type="button" className="adm-btn adm-btn-small" onClick={() => setViewing(a)}>
                      View
                    </button>
                  ) : (
                    <a className="adm-btn adm-btn-small" href={fileUrl(a.id)} target="_blank" rel="noopener noreferrer">
                      {isPdf(a.contentType) ? 'Open' : 'Download'}
                    </a>
                  )}
                  <button
                    type="button"
                    className="adm-btn adm-btn-small adm-btn-danger-outline"
                    disabled={busy}
                    onClick={async () => {
                      if (!(await confirm({ title: 'Remove this attachment?', body: `${a.name} is deleted permanently. The expense stays.`, confirmLabel: 'Remove', danger: true }))) return;
                      if (await run(() => api(`attachments/${a.id}/remove`, { method: 'POST' }), 'Attachment removed')) await reload();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adm-card">
        <h2>Who owes what</h2>
        <ul className="adm-list">
          {data.shares.map((s) => (
            <li key={s.userId}>
              <span>
                <Link href={`/admin/users/${s.userId}`}>{s.name ?? s.userId}</Link>{' '}
                <span className="adm-muted">{s.email}</span>
              </span>
              <strong>{formatMoney(s.amount, data.currency)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="adm-card">
        <h2>History</h2>
        {data.history.length === 0 ? (
          <p className="adm-muted">No history recorded.</p>
        ) : (
          <ul className="adm-list">
            {data.history.map((h) => (
              <li key={h.revision}>
                <span>
                  <Badge tone={h.action === 'DELETED' ? 'bad' : h.action === 'CREATED' ? 'good' : 'neutral'}>{h.action.toLowerCase()}</Badge>{' '}
                  <span className="adm-muted">by {h.actor ?? 'unknown'}</span>
                </span>
                <span className="adm-muted">{formatDate(h.at, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!deleted && (
        <section className="adm-card">
          <h2>Actions</h2>
          <div className="adm-actions">
            <button
              type="button"
              className="adm-btn adm-btn-danger-outline"
              disabled={busy}
              onClick={async () => {
                if (
                  !(await confirm({
                    title: 'Delete this expense?',
                    body: `"${data.description}" is removed for everyone in ${data.groupName} and its balances are reversed. Its attachments are deleted. Members see it as deleted by ${data.paidBy.name ?? 'the payer'}.`,
                    confirmLabel: 'Delete expense',
                    danger: true,
                  }))
                )
                  return;
                if (await run(() => api(`expenses/${id}/delete`, { method: 'POST' }), 'Expense deleted')) {
                  router.push(`/admin/groups/${data.groupId}`);
                }
              }}
            >
              Delete expense
            </button>
          </div>
        </section>
      )}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <div className="adm-viewer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(viewing.id)} alt={viewing.name} />
          </div>
          <div className="adm-modal-actions">
            <a className="adm-btn" href={fileUrl(viewing.id)} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
