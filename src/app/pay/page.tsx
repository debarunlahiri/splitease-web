import type { Metadata } from 'next';
import PayClient from '@/components/PayClient';

export const metadata: Metadata = {
  title: 'Pay your share',
  description: 'See what you owe for a shared split and pay by UPI.',
  robots: { index: false },
  referrer: 'no-referrer',
};

export default function PayPage() {
  return (
    <main className="narrow">
      <PayClient />
      <noscript>
        <p className="note">Turn on JavaScript to see this split.</p>
      </noscript>
    </main>
  );
}
