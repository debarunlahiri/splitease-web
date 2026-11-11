'use client';

import { useState, type FormEvent } from 'react';
import { api, formatDate, useApi } from '@/components/admin/api';
import { useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Status } from '@/components/admin/ui';

interface Version {
  id: string;
  versionCode: number;
  versionName: string;
  minSupportedVersionCode: number;
  apkUrl: string;
  apkSha256: string | null;
  releaseNotes: string;
  published: boolean;
  createdAt: string;
}

const DEFAULT_URL = 'https://appverse.bitknob.com/android/splitease';

const EMPTY = { versionCode: '', versionName: '', minSupportedVersionCode: '0', apkUrl: DEFAULT_URL, apkSha256: '', releaseNotes: '' };

export default function AppVersionsPage() {
  const { data, error, loading, reload } = useApi<Version[]>('app-versions');
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const { confirm, toast } = useFeedback();

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function publish(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api('app-versions', {
        method: 'POST',
        body: {
          versionCode: Number(form.versionCode),
          versionName: form.versionName.trim(),
          minSupportedVersionCode: Number(form.minSupportedVersionCode || 0),
          apkUrl: form.apkUrl.trim(),
          apkSha256: form.apkSha256.trim() || null,
          releaseNotes: form.releaseNotes.trim(),
        },
      });
      setForm(EMPTY);
      setMessage({ tone: 'ok', text: 'Release published. The app will offer it to users.' });
      await reload();
    } catch (e) {
      setMessage({ tone: 'bad', text: e instanceof Error ? e.message : 'Could not publish' });
    } finally {
      setBusy(false);
    }
  }

  async function setPublished(v: Version, published: boolean) {
    setMessage(null);
    try {
      await api(`app-versions/${v.id}`, { method: 'PATCH', body: { published } });
      await reload();
    } catch (e) {
      setMessage({ tone: 'bad', text: e instanceof Error ? e.message : 'Could not update' });
    }
  }

  return (
    <>
      <PageHeader title="App releases" subtitle="Android builds the app is told to update to. The newest published one wins." />

      <section className="adm-card">
        <h2>Publish a release</h2>
        <form className="adm-form" onSubmit={publish}>
          <label>
            Version code
            <input type="number" min={1} required value={form.versionCode} onChange={set('versionCode')} />
          </label>
          <label>
            Version name
            <input required maxLength={40} placeholder="1.2.0" value={form.versionName} onChange={set('versionName')} />
          </label>
          <label>
            Minimum supported code
            <input type="number" min={0} value={form.minSupportedVersionCode} onChange={set('minSupportedVersionCode')} />
            <small className="adm-muted">Installed versions below this must update.</small>
          </label>
          <label className="wide">
            Download address
            <input type="url" required placeholder={DEFAULT_URL} value={form.apkUrl} onChange={set('apkUrl')} />
            <small className="adm-muted">The Appverse page, or a direct APK file if you have one.</small>
          </label>
          <label className="wide">
            APK SHA-256 (optional)
            <input
              pattern="[0-9a-fA-F]{64}"
              placeholder="Only for a direct APK file: 64 hex characters"
              value={form.apkSha256}
              onChange={set('apkSha256')}
            />
          </label>
          <label className="wide">
            Release notes
            <textarea rows={4} maxLength={5000} value={form.releaseNotes} onChange={set('releaseNotes')} />
          </label>
          <div className="wide">
            <button className="adm-btn adm-btn-primary" type="submit" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish release'}
            </button>
          </div>
        </form>
        {message && (
          <p className={message.tone === 'bad' ? 'adm-alert' : 'adm-note'} role={message.tone === 'bad' ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}
      </section>

      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data &&
        (data.length === 0 ? (
          <Empty>No releases yet.</Empty>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th className="num">Min</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v, i) => (
                  <tr key={v.id}>
                    <td>
                      {v.versionName} <span className="adm-muted">(code {v.versionCode})</span>
                      {v.releaseNotes && <div className="adm-muted adm-clamp">{v.releaseNotes}</div>}
                      <a href={v.apkUrl} target="_blank" rel="noopener noreferrer" className="adm-muted">
                        Open download
                      </a>
                    </td>
                    <td className="num">{v.minSupportedVersionCode}</td>
                    <td>
                      <Badge tone={v.published ? 'good' : 'neutral'}>{v.published ? (i === 0 || data.slice(0, i).every((x) => !x.published) ? 'Live' : 'Published') : 'Withdrawn'}</Badge>
                    </td>
                    <td>{formatDate(v.createdAt)}</td>
                    <td className="num">
                      <div className="adm-cell-actions">
                        <button
                          type="button"
                          className="adm-btn adm-btn-small"
                          onClick={async () => {
                            if (v.published && !(await confirm({ title: `Withdraw ${v.versionName}?`, body: 'The app will stop offering this version as an update.', confirmLabel: 'Withdraw' }))) return;
                            await setPublished(v, !v.published);
                            toast(v.published ? 'Release withdrawn' : 'Release published');
                          }}
                        >
                          {v.published ? 'Withdraw' : 'Publish again'}
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-small adm-btn-danger-outline"
                          onClick={async () => {
                            if (!(await confirm({ title: `Delete ${v.versionName}?`, body: 'This removes the release record permanently.', confirmLabel: 'Delete', danger: true }))) return;
                            try {
                              await api(`app-versions/${v.id}/delete`, { method: 'POST' });
                              toast('Release deleted');
                              await reload();
                            } catch (e) {
                              toast(e instanceof Error ? e.message : 'Could not delete', 'bad');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </>
  );
}
