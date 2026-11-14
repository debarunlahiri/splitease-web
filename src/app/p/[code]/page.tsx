import type { Metadata } from 'next';
import PayClient from '@/components/PayClient';
import { formatMoney } from '@/lib/pay';
import { loadPayment } from '@/lib/pay-server';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ p?: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const { p } = await searchParams;
  const payment = await loadPayment(code);
  const person = payment && p !== undefined && /^\d{1,2}$/.test(p) ? payment.t[Number(p)] : undefined;
  const image = `/api/pay/${encodeURIComponent(code)}/preview${person ? `?p=${Number(p)}` : ''}`;
  const title = payment ? payment.d : 'Pay your share';
  const description = person
    ? `${person.n}, you owe ${formatMoney(person.l ?? person.a, payment!.c)} to ${payment!.n}. Tap to see the split and pay.`
    : payment
      ? `Paid by ${payment.n}. Tap to see what everyone owes and pay your share.`
      : 'See what you owe for a shared split and pay by UPI.';
  return {
    title,
    description,
    robots: { index: false },
    referrer: 'no-referrer',
    openGraph: { type: 'website', title, description, images: [{ url: image, width: 1200, height: 630, alt: `Bill for ${title}` }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ShortPayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="narrow">
      <PayClient code={code} />
    </main>
  );
}
