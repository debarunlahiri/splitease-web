import type { Metadata } from 'next';
import JoinClient from '@/components/JoinClient';

export const metadata: Metadata = {
  title: 'Join a group',
  description: 'Open SplitEase to join your friend’s group.',
  robots: { index: false },
};

export default function JoinPage() {
  return (
    <main className="narrow">
      <JoinClient />
      <noscript>
        <p className="note">Turn on JavaScript to open your invitation in the SplitEase app.</p>
      </noscript>
    </main>
  );
}
