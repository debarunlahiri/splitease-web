'use client';

import FlowCard from '@/components/FlowCard';
import Icon from '@/components/Icon';
import IosUpdates from '@/components/IosUpdates';
import { useEffect, useState } from 'react';
import { APK_URL } from '@/lib/config';
import { detectPlatform, isInAppBrowser, type Platform } from '@/lib/device';
import { type AppHost, androidIntentLink, customSchemeLink } from '@/lib/links';

interface Props {
  /** Which screen of the app to open. */
  host: AppHost;
  /** Invite token, for host "join". */
  token?: string;
  heading: string;
  body: string;
  buttonLabel: string;
  /** Try to open the app by itself as soon as the page loads (Android only). */
  autoOpen?: boolean;
  verified?: boolean;
  invitation?: boolean;
}

/**
 * Sends the visitor into the SplitEase app.
 *  - Android: attempts the handoff on arrival when enabled and offers a button for browsers
 *    that require a tap. The install page is available from the button and the install link.
 *  - iPhone / iPad: the app is Android-only for now, so it says so.
 *  - Desktop: asks the visitor to open the link on their Android phone.
 */
export default function OpenInApp({
  host,
  token,
  heading,
  body,
  buttonLabel,
  autoOpen,
  verified,
  invitation,
}: Props) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [intentUrl, setIntentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const agent = navigator.userAgent;
    const detected = detectPlatform(agent);
    setPlatform(detected);
    setInAppBrowser(isInAppBrowser(agent));
    if (detected !== 'android') return;

    // Without the app installed, Chrome goes to the download page (never the Play Store).
    const intent = androidIntentLink(host, APK_URL, token);
    setIntentUrl(intent);
    if (!autoOpen) return;

    // Try once per visit so coming back from the app does not bounce straight into it again.
    const key = `splitease-opened:${host}:${token?.slice(0, 8) ?? ''}`;
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(key) === '1';
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be blocked; the button still works.
    }
    if (alreadyTried) return;
    // If the app is missing, the browser continues to the download page.
    window.location.assign(intent);
  }, [host, token, autoOpen]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be denied; the address bar still has the link.
    }
  }

  const isInvitation = host !== 'open' || invitation;

  return (
    <FlowCard
      icon={verified ? 'check' : isInvitation ? 'link' : 'phone'}
      label={verified ? 'Account setup' : isInvitation ? 'Invitation' : 'Continue in the app'}
      title={heading}
    >
      {platform !== 'ios' && <p className="lead">{body}</p>}

      {platform === 'android' && intentUrl && (
        <>
          <div className="actions">
            <a className="btn btn-primary" href={intentUrl}>
              {buttonLabel} <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn-ghost" href={customSchemeLink(host, token)}>
              Try another way
            </a>
          </div>
          {inAppBrowser && (
            <p className="note">
              Nothing happening? This page is open inside another app. Use the menu and choose{' '}
              <strong>Open in browser</strong> (Chrome), then try again.
            </p>
          )}
          <p className="note">
            Don&apos;t have SplitEase yet? <a href={APK_URL}>Get the app</a>, then open
            this link again.
          </p>
        </>
      )}

      {platform === 'ios' && <IosUpdates />}

      {platform === 'desktop' && (
        <>
          <p className="note">
            SplitEase runs on Android. Open this link on your Android phone, or copy it and send it
            to yourself.
          </p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={copyLink}>
              <Icon name={copied ? 'check' : 'copy'} size={18} />
              <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
            </button>
          </div>
        </>
      )}
    </FlowCard>
  );
}
