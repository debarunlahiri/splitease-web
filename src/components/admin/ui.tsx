'use client';

import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="adm-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-head-actions">{actions}</div>}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'good' | 'bad' | 'warn' | 'neutral';
  children: ReactNode;
}) {
  return <span className={`adm-badge adm-badge-${tone}`}>{children}</span>;
}

export function Status({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  if (error) {
    return (
      <div className="adm-alert" role="alert">
        {error}
        {onRetry && (
          <button type="button" className="adm-btn adm-btn-small" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }
  if (loading) return <p className="adm-muted" role="status">Loading…</p>;
  return null;
}

export function Pager({
  page,
  totalPages,
  totalItems,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="adm-pager">
      <span className="adm-muted">{totalItems.toLocaleString()} total</span>
      <div>
        <button type="button" className="adm-btn adm-btn-small" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="adm-muted">
          Page {Math.min(page + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="adm-btn adm-btn-small"
          disabled={page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="adm-stat">
      <span className="adm-muted">{label}</span>
      <strong>{value}</strong>
      {hint && <small className="adm-muted">{hint}</small>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="adm-empty">{children}</p>;
}
