import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import { PRIVACY_POLICY_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How SplitEase handles your information.',
};

/** The privacy policy, shown inside the site. It lives on the Lambrk site so there is only one copy to keep up to date. */
export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <div className="container">
        <div className="privacy-head">
          <h1>Privacy policy</h1>
          <a className="btn btn-ghost btn-small" href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
            Open in a new tab <Icon name="arrow" size={16} />
          </a>
        </div>
        <iframe className="privacy-frame" src={PRIVACY_POLICY_URL} title="SplitEase privacy policy" loading="lazy" />
        <noscript>
          <p>
            Read it at <a href={PRIVACY_POLICY_URL}>{PRIVACY_POLICY_URL}</a>.
          </p>
        </noscript>
      </div>
    </main>
  );
}
