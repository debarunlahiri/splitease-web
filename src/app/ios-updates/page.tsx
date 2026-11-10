import FlowCard from '@/components/FlowCard';
import type { Metadata } from 'next';
import IosUpdates from '@/components/IosUpdates';

export const metadata: Metadata = {
  title: 'iOS launch updates',
  description: 'Get an email when SplitEase launches for iPhone and iPad.',
};

export default function IosUpdatesPage() {
  return (
    <main className="narrow">
      <FlowCard icon="mail" label="Launch updates" title="SplitEase for iOS">
        <IosUpdates allowConfirmation />
      </FlowCard>
    </main>
  );
}
