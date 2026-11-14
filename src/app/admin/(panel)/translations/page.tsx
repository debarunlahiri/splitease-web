'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, useApi } from '@/components/admin/api';
import { useFeedback } from '@/components/admin/Feedback';
import { Badge, PageHeader, Status } from '@/components/admin/ui';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
}
interface Row {
  key: string;
  value: string | null;
}
interface Strings {
  items: Row[];
  total: number;
  translated: number;
}

/** The app's wording in each language. The English text is the key; a blank translation means "show English". */
export default function TranslationsPage() {
  const languages = useApi<Language[]>('languages');
  const [lang, setLang] = useState('hi');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [missing, setMissing] = useState(false);
  const params = new URLSearchParams({ lang, ...(search ? { q: search } : {}), ...(missing ? { missing: 'true' } : {}) });
  const strings = useApi<Strings>(`strings?${params.toString()}`);
  const { toast } = useFeedback();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Search as you type, after a short pause.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => setDrafts({}), [lang, search, missing]);

  const current = languages.data?.find((l) => l.code === lang);
  const others = (languages.data ?? []).filter((l) => l.code !== 'en');

  async function save(key: string, value: string) {
    try {
      await api('strings', { method: 'POST', body: { lang, key, value } });
      setDrafts((d) => {
        const { [key]: _gone, ...rest } = d;
        return rest;
      });
      toast('Saved');
      await strings.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save');
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!newKey.trim()) return;
    await save(newKey.trim(), newValue);
    setNewKey('');
    setNewValue('');
  }

  async function remove(key: string) {
    if (!window.confirm(`Remove "${key}" from every language?`)) return;
    try {
      await api('strings/delete', { method: 'POST', body: { key } });
      toast('Removed');
      await strings.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not remove');
    }
  }

  async function toggle(language: Language) {
    try {
      await api(`languages/${language.code}`, { method: 'PATCH', body: { enabled: !language.enabled } });
      await languages.reload();
      toast(language.enabled ? `${language.name} hidden in the app` : `${language.name} shown in the app`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update');
    }
  }

  return (
    <>
      <PageHeader
        title="Translations"
        subtitle="What the app says in each language. Changes reach the app the next time it opens; anything left blank shows in English."
      />

      <section className="adm-card">
        <h2>Languages</h2>
        <ul className="adm-list">
          <li>
            <span>
              <strong>English</strong> <span className="adm-muted">· always on</span>
            </span>
            <Badge tone="good">On</Badge>
          </li>
          {others.map((l) => (
            <li key={l.code}>
              <span>
                <strong>{l.name}</strong> <span className="adm-muted">· {l.nativeName}</span>
              </span>
              <button type="button" className="adm-btn adm-btn-small" onClick={() => toggle(l)}>
                {l.enabled ? 'Hide in app' : 'Show in app'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="adm-card">
        <h2>Add or change wording</h2>
        <form className="adm-stack" onSubmit={add}>
          <label className="adm-field">
            English text (exactly as the app shows it)
            <input value={newKey} onChange={(e) => setNewKey(e.target.value)} maxLength={500} placeholder="e.g. Add split" />
          </label>
          <label className="adm-field">
            {current?.name ?? 'Translation'}
            <input value={newValue} onChange={(e) => setNewValue(e.target.value)} maxLength={1000} />
          </label>
          <div>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={!newKey.trim()}>
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="adm-card">
        <div className="adm-head" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>
            Wording{' '}
            {strings.data && (
              <span className="adm-muted">
                · {strings.data.translated} of {strings.data.total} translated
              </span>
            )}
          </h2>
          <div className="adm-head-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {others.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className="adm-check">
              <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} /> Only missing
            </label>
          </div>
        </div>
        <Status loading={strings.loading} error={strings.error} onRetry={strings.reload} />
        {strings.data && strings.data.items.length === 0 && <p className="adm-muted">Nothing matches.</p>}
        <table className="adm-table">
          <thead>
            <tr>
              <th>English</th>
              <th>{current?.name ?? 'Translation'}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {strings.data?.items.map((row) => {
              const draft = drafts[row.key] ?? row.value ?? '';
              const changed = draft !== (row.value ?? '');
              return (
                <tr key={row.key}>
                  <td data-label="English">{row.key}</td>
                  <td data-label={current?.name ?? 'Translation'}>
                    <input
                      style={{ width: '100%' }}
                      value={draft}
                      maxLength={1000}
                      onChange={(e) => setDrafts((d) => ({ ...d, [row.key]: e.target.value }))}
                      placeholder={row.value === null ? 'Not translated yet' : ''}
                    />
                  </td>
                  <td data-label="">
                    <button type="button" className="adm-btn adm-btn-small adm-btn-primary" disabled={!changed} onClick={() => save(row.key, draft)}>
                      Save
                    </button>{' '}
                    <button type="button" className="adm-btn adm-btn-small" onClick={() => remove(row.key)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
