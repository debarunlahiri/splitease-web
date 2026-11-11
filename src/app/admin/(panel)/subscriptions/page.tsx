'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, formatDate, formatMoney, useApi, type Page } from '@/components/admin/api';
import { Modal, useAction, useFeedback } from '@/components/admin/Feedback';
import { Badge, Empty, PageHeader, Pager, Status } from '@/components/admin/ui';

interface Plan {
  id: string;
  code: string;
  name: string;
  price: string;
  currency: string;
  durationDays: number;
  removesAds: boolean;
  active: boolean;
  googleProductId: string | null;
  appleProductId: string | null;
  activeSubscribers: number;
}

interface Sub {
  id: string;
  status: string;
  plan: string;
  price: string;
  currency: string;
  provider: string;
  startsAt: string;
  expiresAt: string;
  userId: string | null;
  email: string | null;
}

interface PlanForm {
  id: string | null;
  code: string;
  name: string;
  price: string;
  currency: string;
  durationDays: string;
  removesAds: boolean;
  active: boolean;
  googleProductId: string;
  appleProductId: string;
}

const NEW_PLAN: PlanForm = {
  id: null,
  code: '',
  name: '',
  price: '',
  currency: 'INR',
  durationDays: '30',
  removesAds: true,
  active: false,
  googleProductId: '',
  appleProductId: '',
};

export default function SubscriptionsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const plans = useApi<Plan[]>('plans');
  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (status) params.set('status', status);
  const subs = useApi<Page<Sub>>(`subscriptions?${params}`);
  const { confirm } = useFeedback();
  const { run, busy } = useAction();

  const [granting, setGranting] = useState(false);
  const [grant, setGrant] = useState({ user: '', planId: '', days: '' });
  const [planForm, setPlanForm] = useState<PlanForm | null>(null);
  const [extending, setExtending] = useState<Sub | null>(null);
  const [extraDays, setExtraDays] = useState('30');

  const refresh = async () => {
    await Promise.all([plans.reload(), subs.reload()]);
  };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Plans on sale and who has bought them."
        actions={
          <>
            <button type="button" className="adm-btn" onClick={() => setPlanForm({ ...NEW_PLAN })}>
              New plan
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={() => {
                setGrant({ user: '', planId: plans.data?.[0]?.id ?? '', days: '' });
                setGranting(true);
              }}
            >
              Grant a plan
            </button>
          </>
        }
      />

      <section className="adm-card">
        <h2>Plans</h2>
        <Status loading={plans.loading && !plans.data} error={plans.error} onRetry={plans.reload} />
        {plans.data && (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th className="num">Price</th>
                  <th className="num">Days</th>
                  <th className="num">Active</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <div className="adm-muted">{p.code}</div>
                    </td>
                    <td className="num">{formatMoney(p.price, p.currency)}</td>
                    <td className="num">{p.durationDays}</td>
                    <td className="num">{p.activeSubscribers}</td>
                    <td>
                      <Badge tone={p.active ? 'good' : 'neutral'}>{p.active ? 'On sale' : 'Hidden'}</Badge>
                    </td>
                    <td className="adm-cell-actions">
                      <button
                        type="button"
                        className="adm-btn adm-btn-small"
                        onClick={() =>
                          setPlanForm({
                            id: p.id,
                            code: p.code,
                            name: p.name,
                            price: String(Number(p.price)),
                            currency: p.currency,
                            durationDays: String(p.durationDays),
                            removesAds: p.removesAds,
                            active: p.active,
                            googleProductId: p.googleProductId ?? '',
                            appleProductId: p.appleProductId ?? '',
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-small"
                        disabled={busy}
                        onClick={async () => {
                          if (p.active && !(await confirm({ title: `Hide ${p.name}?`, body: 'It stops being offered to new buyers. Current subscribers keep their access.', confirmLabel: 'Hide plan' }))) return;
                          if (await run(() => api(`plans/${p.id}`, { method: 'PATCH', body: { active: !p.active } }), p.active ? 'Plan hidden' : 'Plan on sale')) await plans.reload();
                        }}
                      >
                        {p.active ? 'Hide' : 'Put on sale'}
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-small adm-btn-danger-outline"
                        disabled={busy}
                        onClick={async () => {
                          if (!(await confirm({ title: `Delete ${p.name}?`, body: 'Only plans nobody has ever subscribed to can be deleted. Otherwise hide it instead.', confirmLabel: 'Delete plan', danger: true }))) return;
                          if (await run(() => api(`plans/${p.id}/delete`, { method: 'POST' }), 'Plan deleted')) await plans.reload();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="adm-filters">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <Status loading={subs.loading && !subs.data} error={subs.error} onRetry={subs.reload} />
      {subs.data &&
        (subs.data.items.length === 0 ? (
          <Empty>No subscriptions.</Empty>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Period</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.data.items.map((s) => {
                    const live = s.status === 'ACTIVE' && new Date(s.expiresAt) > new Date();
                    return (
                      <tr key={s.id}>
                        <td>{s.userId ? <Link href={`/admin/users/${s.userId}`}>{s.email ?? s.userId}</Link> : '—'}</td>
                        <td>{s.plan}</td>
                        <td>
                          <Badge tone={live ? 'good' : 'neutral'}>{live ? 'Active' : s.status === 'ACTIVE' ? 'Expired' : s.status}</Badge>
                        </td>
                        <td>{s.provider === 'ADMIN' ? 'Granted by admin' : s.provider}</td>
                        <td>
                          {formatDate(s.startsAt)} – {formatDate(s.expiresAt)}
                        </td>
                        <td className="adm-cell-actions">
                          <button type="button" className="adm-btn adm-btn-small" onClick={() => { setExtraDays('30'); setExtending(s); }}>
                            Extend
                          </button>
                          {s.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              className="adm-btn adm-btn-small adm-btn-danger-outline"
                              disabled={busy}
                              onClick={async () => {
                                if (!(await confirm({ title: 'Cancel this subscription?', body: `${s.email ?? 'The user'} loses the benefits of ${s.plan} right away. A store subscription may renew and reactivate it.`, confirmLabel: 'Cancel subscription', danger: true }))) return;
                                if (await run(() => api(`subscriptions/${s.id}/cancel`, { method: 'POST' }), 'Subscription cancelled')) await refresh();
                              }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="adm-btn adm-btn-small"
                              disabled={busy}
                              onClick={async () => {
                                if (await run(() => api(`subscriptions/${s.id}/reactivate`, { method: 'POST' }), 'Subscription reactivated')) await refresh();
                              }}
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={subs.data.page} totalPages={subs.data.totalPages} totalItems={subs.data.totalItems} onPage={setPage} />
          </>
        ))}

      {planForm && (
        <Modal title={planForm.id ? `Edit ${planForm.name || 'plan'}` : 'New plan'} onClose={() => setPlanForm(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = {
                name: planForm.name.trim(),
                price: Number(planForm.price),
                currency: planForm.currency.trim(),
                durationDays: Number(planForm.durationDays),
                removesAds: planForm.removesAds,
                active: planForm.active,
                googleProductId: planForm.googleProductId.trim() || null,
                appleProductId: planForm.appleProductId.trim() || null,
              };
              const ok = await run(
                () =>
                  planForm.id
                    ? api(`plans/${planForm.id}`, { method: 'PATCH', body })
                    : api('plans', { method: 'POST', body: { ...body, code: planForm.code.trim().toUpperCase() } }),
                planForm.id ? 'Plan updated' : 'Plan created',
              );
              if (ok) {
                setPlanForm(null);
                await plans.reload();
              }
            }}
          >
            {!planForm.id && (
              <label className="adm-field">
                Code
                <input required pattern="[A-Za-z0-9_]{2,40}" placeholder="NO_ADS_QUARTERLY" value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} />
                <small className="adm-muted">Capitals, digits and _. Can’t be changed later.</small>
              </label>
            )}
            <label className="adm-field">
              Name
              <input required maxLength={80} value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
            </label>
            <div className="adm-two">
              <label className="adm-field">
                Price
                <input type="number" required min={0} step="0.01" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
              </label>
              <label className="adm-field">
                Currency
                <input required maxLength={3} minLength={3} value={planForm.currency} onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })} />
              </label>
            </div>
            <label className="adm-field">
              Length (days)
              <input type="number" required min={1} max={3650} value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })} />
            </label>
            <label className="adm-field">
              Google Play product ID
              <input maxLength={120} value={planForm.googleProductId} onChange={(e) => setPlanForm({ ...planForm, googleProductId: e.target.value })} />
            </label>
            <label className="adm-field">
              App Store product ID
              <input maxLength={120} value={planForm.appleProductId} onChange={(e) => setPlanForm({ ...planForm, appleProductId: e.target.value })} />
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={planForm.removesAds} onChange={(e) => setPlanForm({ ...planForm, removesAds: e.target.checked })} />
              Removes ads
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={planForm.active} onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })} />
              On sale
            </label>
            <p className="adm-muted">The price shown to buyers is set in the Play Console / App Store; this one is for your records and reports.</p>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setPlanForm(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{planForm.id ? 'Save changes' : 'Create plan'}</button>
            </div>
          </form>
        </Modal>
      )}

      {granting && (
        <Modal title="Grant a plan" onClose={() => setGranting(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run(
                () =>
                  api('subscriptions/grant', {
                    method: 'POST',
                    body: { user: grant.user.trim(), planId: grant.planId, days: grant.days ? Number(grant.days) : null },
                  }),
                'Plan granted',
              );
              if (ok) {
                setGranting(false);
                await refresh();
              }
            }}
          >
            <label className="adm-field">
              User email
              <input type="email" required autoComplete="off" value={grant.user} onChange={(e) => setGrant({ ...grant, user: e.target.value })} />
            </label>
            <label className="adm-field">
              Plan
              <select required value={grant.planId} onChange={(e) => setGrant({ ...grant, planId: e.target.value })}>
                {plans.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationDays} days)
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              Days (optional)
              <input type="number" min={1} max={3650} placeholder="Plan default" value={grant.days} onChange={(e) => setGrant({ ...grant, days: e.target.value })} />
            </label>
            <p className="adm-muted">Free of charge, no store purchase involved. Logged in the activity log.</p>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setGranting(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy || !grant.planId}>Grant</button>
            </div>
          </form>
        </Modal>
      )}

      {extending && (
        <Modal title="Extend subscription" onClose={() => setExtending(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => api(`subscriptions/${extending.id}/extend`, { method: 'POST', body: { days: Number(extraDays) } }), `Extended by ${extraDays} days`)) {
                setExtending(null);
                await refresh();
              }
            }}
          >
            <p className="adm-modal-text">
              {extending.email} · {extending.plan}, ends {formatDate(extending.expiresAt)}.
            </p>
            <label className="adm-field">
              Add days
              <input type="number" min={1} max={3650} required value={extraDays} onChange={(e) => setExtraDays(e.target.value)} />
            </label>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setExtending(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Extend</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
