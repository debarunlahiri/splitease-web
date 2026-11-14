import type { Metadata } from 'next';
import PayClient from '@/components/PayClient';

export const metadata: Metadata = {
  title: 'Pay your share',
  description: 'See what you owe for a shared split and pay by UPI.',
  robots: { index: false },
  referrer: 'no-referrer',
};

export default async function ShortPayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="narrow">
      <PayClient code={code} />
    </main>
  );
}
