'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const HEADERS = { 'x-splitease-admin': '1' };

/** Calls the admin API through the website's own proxy; a 401 sends you back to sign in. */
export async function api<T = unknown>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api/admin/proxy/${path}`, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? HEADERS : { ...HEADERS, 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });
  if (response.status === 401) {
    window.location.href = '/admin/login';
    throw new ApiError(401, 'Signed out');
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const body = data as { message?: string; fieldErrors?: Record<string, string> } | undefined;
    const detail = body?.fieldErrors ? Object.entries(body.fieldErrors).map(([k, v]) => `${k} ${v}`).join(', ') : '';
    throw new ApiError(response.status, detail || body?.message || `Request failed (${response.status})`);
  }
  return data as T;
}

export async function signOut(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST', headers: HEADERS });
  window.location.href = '/admin/login';
}

export { HEADERS as ADMIN_FETCH_HEADERS };

/** Loads `path` on mount and whenever it changes. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (path === null) return;
    const id = ++seq.current;
    setLoading(true);
    try {
      const result = await api<T>(path);
      if (id !== seq.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (id !== seq.current) return;
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export function formatDate(value: string | null | undefined, time = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(
    undefined,
    time
      ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

export function formatMoney(amount: string | number | null | undefined, currency: string): string {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);
