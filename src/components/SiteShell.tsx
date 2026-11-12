'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';

/**
 * Shows the public website header and footer everywhere except the admin dashboard. The pay page
 * gets a slim header and footer instead, so the amount and the payment buttons stay in view.
 */
export default function SiteShell({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname() ?? '';
  if (path.startsWith('/admin')) return <>{children}</>;
  if (path.startsWith('/pay') || path.startsWith('/p/')) {
    return (
      <>
        <header className="pay-bar">
          <Link href="/" className="brand" aria-label="SplitEase home">
            <BrandLogo size={32} />
            SplitEase
          </Link>
        </header>
        {children}
        <p className="pay-powered">
          Powered by <a href="https://lambrk.com" rel="noopener">Lambrk</a>
        </p>
      </>
    );
  }
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
