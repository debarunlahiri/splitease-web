'use client';

import FlowCard from '@/components/FlowCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TOKEN_PATTERN } from '@/lib/links';
import OpenInApp from './OpenInApp';

/**
 * Invite links look like /join#TOKEN. The token is in the fragment, so it is never sent to a
 * server or written to a log; only this page's script reads it.
 */
export default function JoinClient({ host = 'join' }: { host?: 'join' | 'friend' }) {
  // undefined = not read yet, null = missing or malformed
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const fromFragment = window.location.hash.slice(1);
    const fromQuery = new URLSearchParams(window.location.search).get('token') ?? '';
    const candidate = fromFragment || fromQuery;
    setToken(TOKEN_PATTERN.test(candidate) ? candidate : null);
  }, []);

  if (token === undefined) {
    return <FlowCard icon="link" label="Invitation" title="Opening your invitation…"></FlowCard>;
  }

  if (token === null) {
    return (
      <FlowCard icon="warning" label="Invitation" title="This invite link is incomplete">
        <p className="lead">Ask your friend to share the invitation again.</p>
        <div className="actions">
          <Link className="btn btn-ghost" href="/">
            Back to SplitEase
          </Link>
        </div>
      </FlowCard>
    );
  }

  return (
    <OpenInApp
      host={host}
      token={token}
      autoOpen
      heading={host === 'friend' ? "You're invited to connect" : "You're invited to join a group"}
      body={
        host === 'friend'
          ? 'Open SplitEase and sign in to accept your friend invitation.'
          : "Open SplitEase and sign in to join your friend's group. If you're new, signing in with Google creates your account."
      }
      buttonLabel="Open SplitEase"
    />
  );
}
