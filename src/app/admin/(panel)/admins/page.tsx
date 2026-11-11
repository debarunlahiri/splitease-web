'use client';

import { useState, type FormEvent } from 'react';
import { api, formatDate, useApi } from '@/components/admin/api';
import { Modal, useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, PageHeader, Status } from '@/components/admin/ui';

interface Admin {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string | null;
  disabled: boolean;
}

export default function AdminsPage() {
  const { data, error, loading, reload } = useApi<Admin[]>('admins');
  const me = useApi<{ id: string }>('auth/me');
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [adding, setAdding] = useState(false);
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState({ email: '', displayName: '', password: '' });
  const [pw, setPw] = useState({ current: '', next: '' });

  async function add(event: FormEvent) {
    event.preventDefault();
    if (await run(() => api('admins', { method: 'POST', body: form }), 'Admin added')) {
      setAdding(false);
      await reload();
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (await run(() => api('auth/password', { method: 'POST', body: pw }), 'Password changed')) setChanging(false);
  }

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="People who can sign in to this dashboard."
        actions={
          <>
            <button type="button" className="adm-btn" onClick={() => { setPw({ current: '', next: '' }); setChanging(true); }}>
              Change my password
            </button>
            <button type="button" className="adm-btn adm-btn-primary" onClick={() => { setForm({ email: '', displayName: '', password: '' }); setAdding(true); }}>
              Add admin
            </button>
          </>
        }
      />
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.displayName} {me.data?.id === a.id && <span className="adm-muted">(you)</span>}
                    <div className="adm-muted">{a.email}</div>
                  </td>
                  <td>
                    <Badge tone={a.disabled ? 'bad' : 'good'}>{a.disabled ? 'Disabled' : 'Active'}</Badge>
                  </td>
                  <td>{formatDate(a.lastLoginAt, true)}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td className="adm-cell-actions">
                    {me.data?.id !== a.id &&
                      (a.disabled ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn-small"
                          disabled={busy}
                          onClick={async () => {
                            if (await run(() => api(`admins/${a.id}/enable`, { method: 'POST' }), 'Admin enabled')) await reload();
                          }}
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="adm-btn adm-btn-small adm-btn-danger-outline"
                          disabled={busy}
                          onClick={async () => {
                            if (!(await confirm({ title: `Disable ${a.displayName}?`, body: 'They are signed out and cannot sign in again until you enable them.', confirmLabel: 'Disable', danger: true }))) return;
                            if (await run(() => api(`admins/${a.id}/disable`, { method: 'POST' }), 'Admin disabled')) await reload();
                          }}
                        >
                          Disable
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <Modal title="Add admin" onClose={() => setAdding(false)}>
          <form onSubmit={add}>
            <label className="adm-field">
              Name
              <input required minLength={2} maxLength={100} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </label>
            <label className="adm-field">
              Email
              <input type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="adm-field">
              Temporary password
              <input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <small className="adm-muted">At least 10 characters. Share it securely.</small>
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Add admin</button>
            </div>
          </form>
        </Modal>
      )}

      {changing && (
        <Modal title="Change my password" onClose={() => setChanging(false)}>
          <form onSubmit={changePassword}>
            <label className="adm-field">
              Current password
              <input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </label>
            <label className="adm-field">
              New password
              <input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setChanging(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Change password</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
