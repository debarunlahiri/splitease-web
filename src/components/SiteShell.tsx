'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Shows the public website header and footer everywhere except the admin dashboard. */
export default function SiteShell({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const admin = usePathname()?.startsWith('/admin') ?? false;
  if (admin) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
