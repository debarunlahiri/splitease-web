'use client';

import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { detectPlatform } from '@/lib/device';
import { TOKEN_PATTERN } from '@/lib/links';

export function IosAvailability({ children }: { children: ReactNode }) {
  const [isIos, setIsIos] = useState(false);
  useEffect(() => setIsIos(detectPlatform(navigator.userAgent) === 'ios'), []);
  return isIos ? <IosUpdates /> : children;
}

export default function IosUpdates({ allowConfirmation = false }: { allowConfirmation?: boolean }) {
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!allowConfirmation) return;
    const candidate = window.location.hash.slice(1);
    if (TOKEN_PATTERN.test(candidate)) setToken(candidate);
    else if (candidate) setError('This link is invalid. Request a new email below.');
  }, [allowConfirmation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/ios-updates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(token ? { token } : { email: email.trim() }),
      });
      if (response.ok) {
        setComplete(true);
        setMessage(
          token
            ? 'You’re subscribed for the iOS launch.'
            : 'Check your inbox to confirm your signup.',
        );
        if (token) window.history.replaceState(null, '', window.location.pathname);
      } else if (response.status === 400) {
        setError(
          token
            ? 'This link is invalid or expired. Request a new email below.'
            : 'Enter a valid email address.',
        );
        if (token) {
          setToken('');
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setError('Signup is temporarily unavailable. Please try again later.');
      }
    } catch {
      setError('Signup is temporarily unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ios-updates">
      <p>SplitEase for iPhone and iPad is in development.</p>
      {!complete && (
        <form className="ios-updates-form" onSubmit={submit}>
          {token ? (
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Confirm subscription
            </button>
          ) : (
            <>
              <label htmlFor={emailId}>Get an email when the iOS app launches</label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
              />
              <button className="btn btn-primary" type="submit" disabled={busy}>
                Subscribe
              </button>
            </>
          )}
        </form>
      )}
      {error && (
        <p className="note error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="note" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
