import FlowCard from '@/components/FlowCard';
import Icon from '@/components/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { IosAvailability } from '@/components/IosUpdates';
import { APK_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Get the app',
  description: 'Download SplitEase for your Android phone.',
};

/** Where visitors without the app end up. */
export default function GetAppPage() {
  return (
    <main className="narrow">
      <FlowCard icon="phone" label="Download" title="Get SplitEase">
        <IosAvailability>
          {APK_URL ? (
            <>
              <p className="lead">
                Download SplitEase for Android, install it, then open your link again.
              </p>
              <div className="actions">
                <a className="btn btn-primary" href={APK_URL} download>
                  Download for Android <Icon name="down" size={18} />
                </a>
              </div>
              <p className="note">
                When the download finishes, open the file. If Android asks, allow your browser to
                install apps. The app then keeps itself up to date and tells you when a new version
                is ready.
              </p>
            </>
          ) : (
            <>
              <p className="lead">
                The download isn&apos;t available yet. Once you have the app, open your invitation
                link again and you&apos;ll go straight in.
              </p>
              <div className="actions">
                <Link className="btn btn-ghost" href="/">
                  Learn more about SplitEase
                </Link>
              </div>
            </>
          )}
          <p className="note">SplitEase is available for Android phones.</p>
        </IosAvailability>
      </FlowCard>
    </main>
  );
}
