'use client';

import Link from 'next/link';
import { formatMoney, formatNumber, useApi } from '@/components/admin/api';
import { PageHeader, Stat, Status } from '@/components/admin/ui';

interface Overview {
  totals: {
    users: number;
    verifiedUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    groups: number;
    expenses: number;
    settlements: number;
    activeSubscriptions: number;
    iosWaitlist: number;
    emailsPending: number;
    emailsFailed: number;
    claimsPending: number;
    claimsRejected30d: number;
    payLinksActive: number;
    usersWithUpi: number;
    usersUpiVerified: number;
    contactMembers: number;
    templates: number;
    overdueShares: number;
  };
  outstanding: { currency: string; pending: string; collected: string }[];
  signups: { day: string; count: number }[];
  expenseVolume: { currency: string; count: number; total: string }[];
  subscriptionRevenue: { currency: string; total: string; count: number }[];
}

function SignupChart({ data }: { data: Overview['signups'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 600;
  const height = 160;
  const gap = 4;
  const bar = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height + 20}`}
      role="img"
      aria-label={`New users per day over the last ${data.length} days. Most in one day: ${max}.`}
      className="adm-chart"
    >
      {data.map((d, i) => {
        const h = Math.max(d.count === 0 ? 2 : 6, (d.count / max) * height);
        return (
          <rect key={d.day} x={i * (bar + gap)} y={height - h} width={bar} height={h} rx={3} className="adm-bar">
            <title>{`${d.day}: ${d.count}`}</title>
          </rect>
        );
      })}
      <text x={0} y={height + 15} className="adm-axis">{data[0]?.day}</text>
      <text x={width} y={height + 15} textAnchor="end" className="adm-axis">{data[data.length - 1]?.day}</text>
    </svg>
  );
}

export default function OverviewPage() {
  const { data, error, loading, reload } = useApi<Overview>('overview');
  const t = data?.totals;

  return (
    <>
      <PageHeader title="Overview" subtitle="How SplitEase is doing right now." />
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {data && t && (
        <>
          <div className="adm-stats">
            <Stat label="Users" value={formatNumber(t.users)} hint={`${formatNumber(t.verifiedUsers)} verified`} />
            <Stat label="New (7 days)" value={formatNumber(t.newUsers7d)} hint={`${formatNumber(t.newUsers30d)} in 30 days`} />
            <Stat label="Groups" value={formatNumber(t.groups)} />
            <Stat label="Expenses" value={formatNumber(t.expenses)} hint={`${formatNumber(t.settlements)} settlements`} />
            <Stat label="Active subscriptions" value={formatNumber(t.activeSubscriptions)} />
            <Stat label="iOS waitlist" value={formatNumber(t.iosWaitlist)} />
            <Stat label="Claims to confirm" value={formatNumber(t.claimsPending)} hint={`${formatNumber(t.claimsRejected30d)} not received (30 days)`} />
            <Stat label="Overdue payments" value={formatNumber(t.overdueShares)} />
            <Stat label="UPI IDs" value={formatNumber(t.usersWithUpi)} hint={`${formatNumber(t.usersUpiVerified)} verified`} />
            <Stat label="Active pay links" value={formatNumber(t.payLinksActive)} />
            <Stat label="Contacts added" value={formatNumber(t.contactMembers)} hint="not on SplitEase yet" />
            <Stat label="Saved templates" value={formatNumber(t.templates)} />
          </div>

          <div className="adm-grid-2">
            <section className="adm-card">
              <h2>New users, last 30 days</h2>
              <SignupChart data={data.signups} />
            </section>

            <section className="adm-card">
              <h2>Needs attention</h2>
              <ul className="adm-list">
                <li>
                  <Link href="/admin/emails">Emails waiting to send</Link>
                  <strong>{t.emailsPending}</strong>
                </li>
                <li>
                  <Link href="/admin/emails">Emails that failed</Link>
                  <strong className={t.emailsFailed > 0 ? 'adm-bad' : undefined}>{t.emailsFailed}</strong>
                </li>
                <li>
                  <Link href="/admin/claims?status=PENDING">Payment claims waiting for the payer</Link>
                  <strong className={t.claimsPending > 0 ? 'adm-bad' : undefined}>{t.claimsPending}</strong>
                </li>
                <li>
                  <Link href="/admin/users?verified=no">Unverified users</Link>
                  <strong>{formatNumber(t.users - t.verifiedUsers)}</strong>
                </li>
              </ul>
            </section>

            <section className="adm-card">
              <h2>Expenses by currency</h2>
              {data.expenseVolume.length === 0 ? (
                <p className="adm-muted">No expenses yet.</p>
              ) : (
                <ul className="adm-list">
                  {data.expenseVolume.map((row) => (
                    <li key={row.currency}>
                      <span>
                        {row.currency} <span className="adm-muted">({formatNumber(row.count)} expenses)</span>
                      </span>
                      <strong>{formatMoney(row.total, row.currency)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="adm-card">
              <h2>Money still to settle</h2>
              {data.outstanding.length === 0 ? (
                <p className="adm-muted">Nothing outstanding.</p>
              ) : (
                <ul className="adm-list">
                  {data.outstanding.map((row) => (
                    <li key={row.currency}>
                      <span>
                        {row.currency} <span className="adm-muted">({formatMoney(row.collected, row.currency)} paid back)</span>
                      </span>
                      <strong>{formatMoney(row.pending, row.currency)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <p className="adm-note">What people still owe whoever paid, across every group.</p>
            </section>

            <section className="adm-card">
              <h2>Subscription sales</h2>
              {data.subscriptionRevenue.length === 0 ? (
                <p className="adm-muted">No subscriptions yet.</p>
              ) : (
                <ul className="adm-list">
                  {data.subscriptionRevenue.map((row) => (
                    <li key={row.currency}>
                      <span>
                        {row.currency} <span className="adm-muted">({formatNumber(row.count)} purchases)</span>
                      </span>
                      <strong>{formatMoney(row.total, row.currency)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <p className="adm-note">List price of each purchase; store fees, refunds and renewals are not included.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
