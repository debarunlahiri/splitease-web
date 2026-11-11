'use client';

import { useState, type FormEvent } from 'react';
import { api, formatDate, useApi, type Page } from '@/components/admin/api';
import { useAction, useFeedback } from '@/components/admin/Feedback';
import { PageHeader, Status } from '@/components/admin/ui';

interface Audience {
  all: number;
  verified: number;
  premium: number;
}
interface Entry {
  id: string;
  admin: string;
  createdAt: string;
  detail: { title?: string; audience?: string; push?: boolean; recipients?: number } | null;
}

const LABEL = { all: 'Everyone', verified: 'Verified users', premium: 'Premium users' } as const;

export default function AnnouncementsPage() {
  const audience = useApi<Audience>('announcements/audience');
  const history = useApi<Page<Entry>>('audit?action=announcement&size=10');
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' as keyof typeof LABEL, push: false });

  async function send(event: FormEvent) {
    event.preventDefault();
    const count = audience.data?.[form.audience] ?? 0;
    if (
      !(await confirm({
        title: 'Send this announcement?',
        body: `It goes to ${count.toLocaleString()} ${LABEL[form.audience].toLowerCase()} right now and cannot be recalled.`,
        confirmLabel: 'Send now',
      }))
    )
      return;
    const ok = await run(
      () => api<{ recipients: number }>('announcements', { method: 'POST', body: { ...form, title: form.title.trim(), message: form.message.trim() } }),
      (r) => `Sent to ${r.recipients.toLocaleString()} people`,
    );
    if (ok) {
      setForm({ ...form, title: '', message: '' });
      await history.reload();
    }
  }

  return (
    <>
      <PageHeader title="Announcements" subtitle="Send a message to every user’s in-app notification inbox." />
      <div className="adm-grid-2">
        <section className="adm-card">
          <h2>New announcement</h2>
          <form onSubmit={send} className="adm-stack">
            <label className="adm-field">
              Send to
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as keyof typeof LABEL })}>
                {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((key) => (
                  <option key={key} value={key}>
                    {LABEL[key]}
                    {audience.data ? ` (${audience.data[key].toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              Title
              <input required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="adm-field">
              Message
              <textarea required rows={5} maxLength={500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <small className="adm-muted">{form.message.length}/500</small>
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={form.push} onChange={(e) => setForm({ ...form, push: e.target.checked })} />
              Also send a push notification (to people who turned push on)
            </label>
            <div>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send announcement'}
              </button>
            </div>
          </form>
        </section>

        <section className="adm-card">
          <h2>Recently sent</h2>
          <Status loading={history.loading && !history.data} error={history.error} onRetry={history.reload} />
          {history.data && history.data.items.length === 0 && <p className="adm-muted">Nothing sent yet.</p>}
          <ul className="adm-list">
            {history.data?.items.map((e) => (
              <li key={e.id}>
                <span>
                  <strong>{e.detail?.title ?? 'Announcement'}</strong>
                  <div className="adm-muted">
                    {e.detail?.audience ? LABEL[e.detail.audience as keyof typeof LABEL] ?? e.detail.audience : ''} ·{' '}
                    {(e.detail?.recipients ?? 0).toLocaleString()} recipients · by {e.admin}
                  </div>
                </span>
                <span className="adm-muted">{formatDate(e.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
