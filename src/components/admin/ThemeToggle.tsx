'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';

const KEY = 'adm-theme';
const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

/** Puts the resolved theme on <html>; admin styles read it. */
function apply(mode: Mode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-adm-theme', dark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    let saved: Mode = 'system';
    try {
      const value = localStorage.getItem(KEY);
      if (value === 'light' || value === 'dark') saved = value;
    } catch {
      // Storage can be blocked; the system preference is used.
    }
    setMode(saved);
    apply(saved);
  }, []);

  // In Auto mode, follow the phone or computer when its appearance changes.
  useEffect(() => {
    if (mode !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode]);

  function choose(next: Mode) {
    setMode(next);
    apply(next);
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // Not saved, but it still applies for this visit.
    }
  }

  return (
    <div className="adm-theme" role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => choose(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
