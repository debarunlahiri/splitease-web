import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { GET_APP_HREF, SITE_URL } from '@/lib/config';
import Icon from '@/components/Icon';
import SiteShell from '@/components/SiteShell';
import { BrandLogo, BRAND_LOGO_SRC } from '@/components/BrandLogo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SplitEase: split costs with friends',
    template: '%s | SplitEase',
  },
  description:
    'SplitEase keeps track of who paid and who owes, and shows the simplest way to pay everyone back. Perfect for trips, flatmates and shared costs.',
  icons: {
    icon: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
  openGraph: {
    type: 'website',
    siteName: 'SplitEase',
    title: 'SplitEase: split costs with friends',
    description: 'Share costs with friends, see who owes what and pay back with the fewest payments.',
    images: [{ url: BRAND_LOGO_SRC, width: 512, height: 512, alt: 'SplitEase logo' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#f8f9f4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the admin theme script sets data-adm-theme on <html> before React loads.
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteShell
          header={
        <header className="site-header">
          <div className="container header-row">
            <Link href="/" className="brand" aria-label="SplitEase home">
              <BrandLogo size={38} />
              SplitEase
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#features">Features</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/#faq">FAQ</Link>
              <a className="btn btn-primary btn-small" href={GET_APP_HREF}>
                Get the app <Icon name="arrow" size={16} />
              </a>
            </nav>
          </div>
        </header>
          }
          footer={
        <footer className="site-footer">
          <div className="container footer-row">
            <div className="footer-brand">
              <Link href="/" className="brand">
                <BrandLogo size={32} />
                SplitEase
              </Link>
              <p>&copy; {new Date().getFullYear()} SplitEase</p>
            </div>
            <nav className="footer-links" aria-label="Legal">
              <Link href="/privacy">Privacy policy</Link>
            </nav>
            <p>
              Powered by{' '}
              <a href="https://lambrk.com" rel="noopener">
                Lambrk
              </a>
            </p>
          </div>
        </footer>
          }
        >
          {children}
        </SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
