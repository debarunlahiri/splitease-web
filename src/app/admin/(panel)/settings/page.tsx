'use client';

import { api, useApi } from '@/components/admin/api';
import { useAction } from '@/components/admin/Feedback';
import { PageHeader, Status } from '@/components/admin/ui';

interface Settings {
  phoneVerificationRequired: boolean;
}

/** App-wide switches. Changes apply the next time someone opens the screen they affect. */
export default function SettingsPage() {
  const { data, error, loading, reload } = useApi<Settings>('settings');
  const { run, busy } = useAction();

  async function setRequired(required: boolean) {
    if (await run(() => api('settings', { method: 'PATCH', body: { phoneVerificationRequired: required } }), 'Saved')) {
      await reload();
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Switches that change how the app behaves for everyone." />
      <Status loading={loading} error={error} onRetry={reload} />
      {data && (
        <section className="adm-card">
          <h2>Phone number verification</h2>
          <p className="adm-muted">
            <strong>On:</strong> people must confirm their phone number with a code sent by SMS before it is saved.{' '}
            <strong>Off:</strong> any valid number with its country code is saved as typed. You can also override this
            for one person from their user page.
          </p>
          <label className="adm-check">
            <input
              type="checkbox"
              checked={data.phoneVerificationRequired}
              disabled={busy}
              onChange={(e) => setRequired(e.target.checked)}
            />{' '}
            Require an SMS code for everyone
          </label>
        </section>
      )}
    </>
  );
}
