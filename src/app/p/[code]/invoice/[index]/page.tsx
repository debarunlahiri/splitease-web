import type { Metadata } from 'next';
import InvoiceClient from '@/components/InvoiceClient';

export const metadata: Metadata = {
  title: 'Invoice',
  description: 'Your payment invoice.',
  robots: { index: false },
  referrer: 'no-referrer',
};

export default async function InvoicePage({ params }: { params: Promise<{ code: string; index: string }> }) {
  const { code, index } = await params;
  return (
    <main className="narrow invoice-page">
      <InvoiceClient code={code} index={index} />
    </main>
  );
}
