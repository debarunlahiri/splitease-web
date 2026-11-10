import FlowCard from '@/components/FlowCard';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailClient from '@/components/VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Confirm your email address for SplitEase.',
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <main className="narrow">
      <Suspense fallback={<FlowCard icon="mail" label="Account setup" title="Verify your email" />}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}
