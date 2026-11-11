'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api, formatDate, useApi, useDebounced, type Page } from '@/components/admin/api';
import { useAction, useFeedback } from '@/components/admin/Feedback';
import { PageHeader, Status } from '@/components/admin/ui';

type Audience = 'user' | 'all' | 'verified' | 'premium' | 'ios-waitlist' | 'admins';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  audience: Audience;
  subject: string;
  heading: string;
  body: string;
  buttonLabel: string | null;
  buttonUrl: string | null;
  footer: string | null;
}
interface Audiences {
  sizes: Record<string, number>;
  smtpConfigured: boolean;
}
interface Draft {
  subject: string;
  heading: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}
interface HistoryEntry {
  id: string;
  admin: string;
  createdAt: string;
  detail: { subject?: string; audience?: string; recipients?: number; template?: string } | null;
}
interface UserHit {
  id: string;
  email: string;
  displayName: string;
}

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'user', label: 'One user' },
  { value: 'all', label: 'All users' },
  { value: 'verified', label: 'Verified users' },
  { value: 'premium', label: 'Premium users' },
  { value: 'ios-waitlist', label: 'iOS waitlist (confirmed)' },
  { value: 'admins', label: 'Admins' },
];

const EMPTY: Draft = { subject: '', heading: '', body: '', buttonLabel: '', buttonUrl: '', footer: '' };

function MailComposer() {
  const params = useSearchParams();
  const templates = useApi<Template[]>('mail/templates');
  const audiences = useApi<Audiences>('mail/audiences');
  const history = useApi<Page<HistoryEntry>>('audit?action=email.send&size=8');
  const { confirm } = useFeedback();
  const { run, busy } = useAction();

  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState<Audience>(params.get('user') ? 'user' : 'all');
  const [user, setUser] = useState<UserHit | null>(
    params.get('user') ? { id: params.get('user') as string, email: params.get('email') ?? '', displayName: params.get('name') ?? '' } : null,
  );
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [html, setHtml] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const debouncedSearch = useDebounced(search);
  const hits = useApi<Page<UserHit>>(
    audience === 'user' && debouncedSearch.trim().length >= 2 ? `users?q=${encodeURIComponent(debouncedSearch.trim())}&size=5` : null,
  );

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.data?.find((x) => x.id === id);
    if (!t) return;
    setDraft({
      subject: t.subject,
      heading: t.heading,
      body: t.body,
      buttonLabel: t.buttonLabel ?? '',
      buttonUrl: t.buttonUrl ?? '',
      footer: t.footer ?? '',
    });
    if (!(audience === 'user' && user)) setAudience(t.audience);
  }

  const placeholders = useMemo(
    () => (Object.values(draft).join('\n').match(/\[\[[^\]]*\]\]/g) ?? []).length,
    [draft],
  );

  // Live preview, rendered by the server with the same layout real emails use.
  const debounced = useDebounced(draft, 500);
  useEffect(() => {
    if (!debounced.subject.trim() && !debounced.body.trim()) {
      setHtml('');
      return;
    }
    let cancelled = false;
    api<{ html: string }>('mail/preview', {
      method: 'POST',
      body: { ...debounced, heading: debounced.heading || debounced.subject || ' ', subject: debounced.subject || ' ', body: debounced.body || ' ' },
    })
      .then((r) => {
        if (!cancelled) {
          setHtml(r.html);
          setPreviewError(null);
        }
      })
      .catch((e) => !cancelled && setPreviewError(e instanceof Error ? e.message : 'Preview failed'));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const recipients = audience === 'user' ? (user ? 1 : 0) : (audiences.data?.sizes[audience] ?? 0);
  const body = () => ({
    ...draft,
    buttonLabel: draft.buttonLabel.trim() || null,
    buttonUrl: draft.buttonUrl.trim() || null,
    footer: draft.footer.trim() || null,
  });
  const ready = !!draft.subject.trim() && !!draft.heading.trim() && !!draft.body.trim() && placeholders === 0;

  async function sendTest() {
    await run(() => api('mail/test', { method: 'POST', body: body() }), 'Test email queued to your address');
  }

  async function send() {
    if (audience === 'user' && !user) return;
    const label = AUDIENCES.find((a) => a.value === audience)?.label.toLowerCase();
    const ok = await confirm({
      title: 'Send this email?',
      body: (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <strong>{draft.subject}</strong>
          </p>
          Goes to {audience === 'user' ? `${user?.displayName || user?.email}` : `${recipients.toLocaleString()} recipients (${label})`}. Emails can’t be recalled once sent.
        </>
      ),
      confirmLabel: `Send to ${recipients.toLocaleString()}`,
      danger: recipients > 50,
    });
    if (!ok) return;
    const done = await run(
      () => api<{ queued: number; smtpConfigured: boolean }>('mail/send', { method: 'POST', body: { ...body(), audience, userId: user?.id, templateId: templateId || undefined } }),
      (r) => (r.smtpConfigured ? `${r.queued.toLocaleString()} emails queued for delivery` : `${r.queued} emails written to the server log: SMTP is not configured, so nothing was sent`),
    );
    if (done) await history.reload();
  }

  return (
    <>
      <PageHeader title="Send email" subtitle="Promotions, warnings, notices and updates, sent from your SplitEase mailbox." />

      {audiences.data && !audiences.data.smtpConfigured && (
        <div className="adm-alert" role="status">
          Outgoing email (SMTP) is not configured on the server, so messages are only written to the server log. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD to send real email.
        </div>
      )}

      <div className="adm-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'edit'} onClick={() => setTab('edit')}>Write</button>
        <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
      </div>

      <div className="adm-compose">
        <div className={`adm-compose-form${tab === 'preview' ? ' is-hidden' : ''}`}>
          <section className="adm-card">
            <h2>1. Template</h2>
            <Status loading={templates.loading && !templates.data} error={templates.error} onRetry={templates.reload} />
            <div className="adm-templates">
              {templates.data?.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`adm-template${templateId === t.id ? ' is-selected' : ''}`}
                  onClick={() => applyTemplate(t.id)}
                  aria-pressed={templateId === t.id}
                >
                  <strong>{t.name}</strong>
                  <span className="adm-muted">{t.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="adm-card">
            <h2>2. Recipients</h2>
            <label className="adm-field">
              Send to
              <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                    {a.value !== 'user' && audiences.data ? ` (${(audiences.data.sizes[a.value] ?? 0).toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </label>
            {audience === 'user' && (
              <div className="adm-field">
                {user ? (
                  <div className="adm-picked">
                    <span>
                      <strong>{user.displayName}</strong> <span className="adm-muted">{user.email}</span>
                    </span>
                    <button type="button" className="adm-btn adm-btn-small" onClick={() => setUser(null)}>
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="user-search">Find a user</label>
                    <input id="user-search" type="search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
                    <ul className="adm-hits">
                      {hits.data?.items.map((h) => (
                        <li key={h.id}>
                          <button type="button" onClick={() => { setUser(h); setSearch(''); }}>
                            <strong>{h.displayName}</strong> <span className="adm-muted">{h.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="adm-card">
            <h2>3. Message</h2>
            <div className="adm-stack">
              <label className="adm-field">
                Subject
                <input value={draft.subject} maxLength={200} onChange={set('subject')} />
              </label>
              <label className="adm-field">
                Heading (shown at the top of the email)
                <input value={draft.heading} maxLength={200} onChange={set('heading')} />
              </label>
              <label className="adm-field">
                Message
                <textarea rows={14} value={draft.body} maxLength={10000} onChange={set('body')} />
                <small className="adm-muted">
                  Leave a blank line between paragraphs. Start lines with “- ” for bullets. <code>{'{{name}}'}</code> and <code>{'{{email}}'}</code> are replaced for each person.
                </small>
              </label>
              <div className="adm-two">
                <label className="adm-field">
                  Button label (optional)
                  <input value={draft.buttonLabel} maxLength={60} onChange={set('buttonLabel')} />
                </label>
                <label className="adm-field">
                  Button link
                  <input type="url" placeholder="https://…" value={draft.buttonUrl} onChange={set('buttonUrl')} />
                </label>
              </div>
              <label className="adm-field">
                Footer note (optional)
                <textarea rows={2} value={draft.footer} maxLength={500} onChange={set('footer')} />
              </label>
            </div>
            {placeholders > 0 && (
              <p className="adm-note" role="status">
                {placeholders} placeholder{placeholders > 1 ? 's' : ''} in [[double brackets]] still need to be filled in before you can send.
              </p>
            )}
            <div className="adm-actions" style={{ marginTop: 16 }}>
              <button type="button" className="adm-btn" disabled={busy || !ready} onClick={() => void sendTest()}>
                Send a test to me
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-primary"
                disabled={busy || !ready || recipients === 0}
                onClick={() => void send()}
              >
                Send to {recipients.toLocaleString()} {recipients === 1 ? 'person' : 'people'}
              </button>
            </div>
            <p className="adm-muted" style={{ marginTop: 12 }}>
              For promotions, only email people who have agreed to hear from you. Include a way to opt out (replying works), and honour requests to stop.
            </p>
          </section>
        </div>

        <div className={`adm-compose-preview${tab === 'edit' ? ' is-hidden' : ''}`}>
          <section className="adm-card">
            <h2>Preview</h2>
            {previewError && <div className="adm-alert" role="alert">{previewError}</div>}
            {html ? (
              <iframe title="Email preview" className="adm-preview" sandbox="" srcDoc={html} />
            ) : (
              <p className="adm-muted">Choose a template or start typing to see the email.</p>
            )}
          </section>
        </div>
      </div>

      <section className="adm-card">
        <h2>Recently sent</h2>
        <Status loading={history.loading && !history.data} error={history.error} onRetry={history.reload} />
        {history.data && history.data.items.length === 0 && <p className="adm-muted">Nothing sent yet.</p>}
        <ul className="adm-list">
          {history.data?.items.map((h) => (
            <li key={h.id}>
              <span>
                <strong>{h.detail?.subject ?? 'Email'}</strong>
                <div className="adm-muted">
                  {h.detail?.audience} · {(h.detail?.recipients ?? 0).toLocaleString()} recipients · by {h.admin}
                </div>
              </span>
              <span className="adm-muted">{formatDate(h.createdAt, true)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function MailPage() {
  return (
    <Suspense fallback={<p className="adm-muted">Loading…</p>}>
      <MailComposer />
    </Suspense>
  );
}
