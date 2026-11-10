import type { Metadata } from 'next';
import OpenInApp from '@/components/OpenInApp';

export const metadata: Metadata = {
  title: 'Open SplitEase',
  description: 'Open the SplitEase app on your Android phone.',
  robots: { index: false },
};

/** A general-purpose link that opens the app, for emails and shared messages. */
export default function OpenPage() {
  return (
    <main className="narrow">
      <OpenInApp
        host="open"
        autoOpen
        heading="Open SplitEase"
        body="Continue in the SplitEase app on your phone."
        buttonLabel="Open SplitEase"
      />
    </main>
  );
}

