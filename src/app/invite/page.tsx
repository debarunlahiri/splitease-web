import type { Metadata } from 'next';
import OpenInApp from '@/components/OpenInApp';

export const metadata: Metadata = {
  title: 'You have an invitation',
  description: 'Open SplitEase to see and accept your group invitation.',
  robots: { index: false },
};

/** Where the "you were invited" email points. */
export default function InvitePage() {
  return (
    <main className="narrow">
      <OpenInApp
        host="open"
        autoOpen
        invitation
        heading="You have a group invitation"
        body="Open SplitEase and sign in with the email address that received the invitation. You'll find it in your notifications, ready to accept."
        buttonLabel="Open SplitEase"
      />
    </main>
  );
}
