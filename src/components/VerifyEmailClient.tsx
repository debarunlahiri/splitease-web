'use client';

import FlowCard from '@/components/FlowCard';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import OpenInApp from './OpenInApp';

type State = 'idle' | 'working' | 'done' | 'invalid' | 'unavailable';

/**
 * The link in the verification email lands here. The token is only used when the visitor
 * presses the button, so mail scanners that open links ahead of time cannot use it up.
 */
export default function VerifyEmailClient() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<State>('idle');

  async function verify() {
    setState('working');
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { ok?: boolean; reason?: string };
      if (result.ok) setState('done');
      else setState(result.reason === 'invalid' ? 'invalid' : 'unavailable');
    } catch {
      setState('unavailable');
    }
  }

  if (!token) {
    return (
      <FlowCard icon="warning" label="Account setup" title="This verification link is incomplete">
        <p className="lead">
          Open the link from your email again, or request a new one in the app.
        </p>
        <div className="actions">
          <Link className="btn btn-ghost" href="/">
            Back to SplitEase
          </Link>
        </div>
      </FlowCard>
    );
  }

  if (state === 'done') {
    return (
      <OpenInApp
        host="open"
        heading="Your email is verified"
        body="You can now sign in to SplitEase."
        buttonLabel="Open SplitEase"
        verified
      />
    );
  }

  return (
    <FlowCard icon="mail" label="Account setup" title="Verify your email">
      <p className="lead">Confirm this is your email address to finish setting up SplitEase.</p>
      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={verify}
          disabled={state === 'working'}
        >
          {state === 'working' ? 'Verifying…' : 'Verify my email'}
        </button>
      </div>
      {state === 'invalid' && (
        <p className="note error" role="alert">
          This link has expired or was already used. Sign in to the app to request a new
          verification email.
        </p>
      )}
      {state === 'unavailable' && (
        <p className="note error" role="alert">
          We couldn&apos;t reach SplitEase just now. Please try again.
        </p>
      )}
    </FlowCard>
  );
}
