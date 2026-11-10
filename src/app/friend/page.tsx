import type { Metadata } from 'next';
import JoinClient from '@/components/JoinClient';

export const metadata: Metadata = {
  title: 'Friend invitation',
  description: 'Open SplitEase to accept your friend invitation.',
  robots: { index: false },
};

export default function FriendPage() {
  return (
    <main className="narrow">
      <JoinClient host="friend" />
      <noscript>
        <p className="note">Turn on JavaScript to open your invitation in the SplitEase app.</p>
      </noscript>
    </main>
  );
}
