'use client';

import Icon from '@/components/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, formatDate, formatMoney, useApi } from '@/components/admin/api';
import { Modal, useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, PageHeader, Stat, Status } from '@/components/admin/ui';

interface UserDetail {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  emailVerifiedAt: string | null;
  disabledAt: string | null;
  disabledReason: string | null;
  google: boolean;
  upiId: string | null;
  upiVerifiedAt: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  phoneVerification: 'DEFAULT' | 'REQUIRED' | 'NOT_REQUIRED';
  isContact: boolean;
  contact: { email: string | null; phone: string | null; addedBy: string | null } | null;
  claimsMade: number;
  claimsReceived: number;
  templates: number;
  balances: { currency: string; owed: string; owes: string }[];
  expensesPaid: number;
  friends: number;
  activeSessions: number;
  groups: { id: string; name: string; currency: string; role: string; joinedAt: string }[];
  subscriptions: { id: string; plan: string; status: string; provider: string; startsAt: string; expiresAt: string }[];
}

type Dialog = 'rename' | 'notify' | 'suspend' | null;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<UserDetail>(`users/${id}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');

  const act = async (work: () => Promise<unknown>, done: string) => {
    if (await run(work, done)) {
      setDialog(null);
      await reload();
    }
  };

  async function submit(event: FormEvent, work: () => Promise<unknown>, done: string) {
    event.preventDefault();
    await act(work, done);
  }

  if (!data) {
    return (
      <>
        <p className="adm-crumb">
          <Link href="/admin/users"><Icon name="back" size={14} inline />Users</Link>
        </p>
        <Status loading={loading} error={error} onRetry={reload} />
      </>
    );
  }

  const suspended = !!data.disabledAt;

  return (
    <>
      <p className="adm-crumb">
        <Link href="/admin/users"><Icon name="back" size={14} inline />Users</Link>
      </p>
      <PageHeader
        title={data.displayName}
        subtitle={data.email || data.contact?.phone || (data.isContact ? 'Added from contacts' : '')}
        actions={
          <>
            {data.isContact && <Badge tone="warn">Contact · not on SplitEase</Badge>}
            {suspended && <Badge tone="bad">Suspended</Badge>}
          </>
        }
      />

      {suspended && (
        <div className="adm-alert" role="status">
          Suspended {formatDate(data.disabledAt, true)}
          {data.disabledReason ? ` — ${data.disabledReason}` : ''}. They cannot sign in.
        </div>
      )}

      <div className="adm-stats">
        <Stat label="Joined" value={formatDate(data.createdAt)} />
        <Stat
          label="Email"
          value={<Badge tone={data.emailVerifiedAt ? 'good' : 'warn'}>{data.emailVerifiedAt ? 'Verified' : 'Unverified'}</Badge>}
          hint={data.emailVerifiedAt ? formatDate(data.emailVerifiedAt) : undefined}
        />
        <Stat label="Expenses paid" value={data.expensesPaid} />
        <Stat label="Friends" value={data.friends} />
        <Stat label="Signed-in devices" value={data.activeSessions} />
        <Stat label="Sign-in" value={data.isContact ? 'None (contact)' : data.google ? 'Google' : 'Email'} />
        <Stat
          label="UPI ID"
          value={data.upiId ?? '—'}
          hint={data.upiId ? (data.upiVerifiedAt ? `verified ${formatDate(data.upiVerifiedAt)}` : 'not verified') : undefined}
        />
        {data.balances.map((b) => (
          <Stat
            key={b.currency}
            label={`Is owed / owes (${b.currency})`}
            value={`${formatMoney(b.owed, b.currency)} / ${formatMoney(b.owes, b.currency)}`}
            hint="still unpaid, all groups"
          />
        ))}
        <Stat
          label="Phone"
          value={data.phone ?? '—'}
          hint={data.phone ? (data.phoneVerifiedAt ? `verified ${formatDate(data.phoneVerifiedAt)}` : 'not verified') : undefined}
        />
        <Stat label="Payment claims" value={`${data.claimsMade} made`} hint={`${data.claimsReceived} received · ${data.templates} templates`} />
      </div>

      {data.contact && (
        <section className="adm-card">
          <h2>Contact details</h2>
          <p className="adm-muted">
            Added to a group from someone&apos;s phone contacts. They have no login until they accept an invitation.
          </p>
          <ul className="adm-list">
            <li>
              <span>Email</span>
              <strong>{data.contact.email ?? '—'}</strong>
            </li>
            <li>
              <span>Phone</span>
              <strong>{data.contact.phone ?? '—'}</strong>
            </li>
            {data.contact.addedBy && (
              <li>
                <span>Added by</span>
                <Link href={`/admin/users/${data.contact.addedBy}`}>View user</Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="adm-card">
        <h2>Phone number verification</h2>
        <p className="adm-muted">
          Whether this person must confirm their number with an SMS code. &quot;Follow the app setting&quot; uses the switch
          under Settings.
        </p>
        <select
          value={data.phoneVerification}
          disabled={busy}
          onChange={(e) =>
            act(() => api(`users/${data.id}/phone-verification`, { method: 'PATCH', body: { mode: e.target.value } }), 'Saved')
          }
        >
          <option value="DEFAULT">Follow the app setting</option>
          <option value="REQUIRED">Always require a code</option>
          <option value="NOT_REQUIRED">Never require a code</option>
        </select>
      </section>

      <section className="adm-card">
        <h2>Actions</h2>
        <div className="adm-actions">
          <button type="button" className="adm-btn" onClick={() => { setName(data.displayName); setDialog('rename'); }}>
            Edit name
          </button>
          <button type="button" className="adm-btn" onClick={() => { setTitle(''); setMessage(''); setDialog('notify'); }}>
            Send notification
          </button>
          {data.email && (
          <Link
            className="adm-btn"
            href={`/admin/mail?user=${data.id}&name=${encodeURIComponent(data.displayName)}&email=${encodeURIComponent(data.email)}`}
          >
            Send email
          </Link>
          )}
          {!data.emailVerifiedAt && (
            <>
              <button
                type="button"
                className="adm-btn"
                disabled={busy}
                onClick={() => void act(() => api(`users/${id}/resend-verification`, { method: 'POST' }), 'Verification email is on its way')}
              >
                Resend verification
              </button>
              <button
                type="button"
                className="adm-btn"
                disabled={busy}
                onClick={() => void act(() => api(`users/${id}/verify-email`, { method: 'POST' }), 'Email marked as verified')}
              >
                Mark email verified
              </button>
            </>
          )}
          <button
            type="button"
            className="adm-btn"
            disabled={busy || data.activeSessions === 0}
            onClick={async () => {
              if (!(await confirm({ title: 'Sign out everywhere?', body: `${data.displayName} will be signed out of all devices and must sign in again.`, confirmLabel: 'Sign out' }))) return;
              await act(async () => {
                const r = await api<{ revoked: number }>(`users/${id}/revoke-sessions`, { method: 'POST' });
                return r;
              }, 'Signed out of all devices');
            }}
          >
            Sign out of devices
          </button>
          {suspended ? (
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              disabled={busy}
              onClick={() => void act(() => api(`users/${id}/restore`, { method: 'POST' }), 'Account restored')}
            >
              Restore account
            </button>
          ) : (
            <button type="button" className="adm-btn adm-btn-warn" onClick={() => { setReason(''); setDialog('suspend'); }}>
              Suspend account
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn-danger-outline"
            disabled={busy}
            onClick={async () => {
              if (
                !(await confirm({
                  title: 'Delete this account?',
                  body: 'This permanently removes the account. It only works for accounts that never joined a group or expense; otherwise suspend instead. This cannot be undone.',
                  confirmLabel: 'Delete account',
                  danger: true,
                  requireText: data.email,
                }))
              )
                return;
              if (await run(() => api(`users/${id}/delete`, { method: 'POST' }), 'Account deleted')) {
                router.push('/admin/users');
              }
            }}
          >
            Delete account
          </button>
        </div>
      </section>

      <section className="adm-card">
        <h2>Groups ({data.groups.length})</h2>
        {data.groups.length === 0 ? (
          <p className="adm-muted">Not in any group.</p>
        ) : (
          <ul className="adm-list">
            {data.groups.map((g) => (
              <li key={g.id}>
                <Link href={`/admin/groups/${g.id}`}>{g.name}</Link>
                <span className="adm-muted">
                  {g.role.toLowerCase()} · {g.currency} · joined {formatDate(g.joinedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adm-card">
        <h2>Subscriptions ({data.subscriptions.length})</h2>
        {data.subscriptions.length === 0 ? (
          <p className="adm-muted">None. <Link href="/admin/subscriptions">Grant one</Link> from the Subscriptions page.</p>
        ) : (
          <ul className="adm-list">
            {data.subscriptions.map((s) => (
              <li key={s.id}>
                <span>
                  {s.plan}{' '}
                  <Badge tone={s.status === 'ACTIVE' && new Date(s.expiresAt) > new Date() ? 'good' : 'neutral'}>{s.status}</Badge>
                </span>
                <span className="adm-muted">
                  {s.provider} · {formatDate(s.startsAt)} – {formatDate(s.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog === 'rename' && (
        <Modal title="Edit name" onClose={() => setDialog(null)}>
          <form onSubmit={(e) => submit(e, () => api(`users/${id}`, { method: 'PATCH', body: { displayName: name.trim() } }), 'Name updated')}>
            <label className="adm-field">
              Display name
              <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setDialog(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Save</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === 'notify' && (
        <Modal title={`Notify ${data.displayName}`} onClose={() => setDialog(null)}>
          <form onSubmit={(e) => submit(e, () => api(`users/${id}/notify`, { method: 'POST', body: { title: title.trim(), message: message.trim() } }), 'Notification sent')}>
            <label className="adm-field">
              Title
              <input required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="adm-field">
              Message
              <textarea required rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <p className="adm-muted">Appears in their in-app notification inbox.</p>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setDialog(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Send</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === 'suspend' && (
        <Modal title="Suspend account" onClose={() => setDialog(null)}>
          <form onSubmit={(e) => submit(e, () => api(`users/${id}/suspend`, { method: 'POST', body: { reason: reason.trim() } }), 'Account suspended')}>
            <p className="adm-modal-text">
              {data.displayName} will be signed out everywhere and blocked from signing in. Their data is kept, and you can restore the account any time.
            </p>
            <label className="adm-field">
              Reason (internal, optional)
              <input maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setDialog(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-danger" disabled={busy}>Suspend</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
