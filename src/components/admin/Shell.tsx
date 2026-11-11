'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { signOut } from './api';
import { FeedbackProvider } from './Feedback';

const ICONS: Record<string, ReactNode> = {
  overview: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c1.8.8 3 2.6 3 5.6" />
    </>
  ),
  groups: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    </>
  ),
  subs: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  release: <path d="M12 3v12m0 0-4-4m4 4 4-4M5 20h14" />,
  ios: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="3" />
      <path d="M11 18h2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  megaphone: <path d="M4 10v4h3l7 4V6L7 10H4Zm13-2a5 5 0 0 1 0 8" />,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  admins: (
    <>
      <path d="M12 3 4 6v6c0 4.4 3.2 7.8 8 9 4.8-1.2 8-4.6 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

const NAV: { href: string; label: string; icon: string; exact?: boolean; group?: string }[] = [
  { href: '/admin', label: 'Overview', icon: 'overview', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'users', group: 'Manage' },
  { href: '/admin/groups', label: 'Groups', icon: 'groups' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: 'subs' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'megaphone', group: 'Reach out' },
  { href: '/admin/mail', label: 'Send email', icon: 'mail' },
  { href: '/admin/emails', label: 'Email queue', icon: 'mail' },
  { href: '/admin/ios-waitlist', label: 'iOS waitlist', icon: 'ios' },
  { href: '/admin/app-versions', label: 'App releases', icon: 'release', group: 'System' },
  { href: '/admin/activity', label: 'Activity log', icon: 'activity' },
  { href: '/admin/admins', label: 'Admins', icon: 'admins' },
];

function NavIcon({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

/** On phones, tables turn into cards; each cell is labelled with its column heading. */
function useCardTables(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const label = () => {
      element.querySelectorAll('table.adm-table').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
        table.querySelectorAll('tbody tr').forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (!cell.hasAttribute('data-label')) cell.setAttribute('data-label', heads[index] ?? '');
          });
        });
      });
    };
    label();
    const observer = new MutationObserver(label);
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [root]);
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const content = useRef<HTMLElement>(null);
  useCardTables(content);

  // Close the drawer after navigating, and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  let lastGroup = '';
  return (
    <FeedbackProvider>
      <div className="adm">
        <aside id="adm-drawer" className={`adm-side${open ? ' is-open' : ''}`}>
          <Link href="/admin" className="adm-brand">
            <BrandLogo size={32} />
            <span>
              SplitEase <small>Admin</small>
            </span>
          </Link>
          <nav aria-label="Admin">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const heading = item.group && item.group !== lastGroup ? item.group : null;
              if (item.group) lastGroup = item.group;
              return (
                <div key={item.href} className="adm-nav-item">
                  {heading && <p className="adm-nav-group">{heading}</p>}
                  <Link href={item.href} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </nav>
          <button type="button" className="adm-signout" onClick={() => void signOut()}>
            Sign out
          </button>
        </aside>
        {open && <div className="adm-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
        <div className="adm-main">
          <div className="adm-topbar">
            <button
              type="button"
              className="adm-icon-btn"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="adm-drawer"
              onClick={() => setOpen((value) => !value)}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <strong>SplitEase Admin</strong>
          </div>
          <main className="adm-content" ref={content}>
            {children}
          </main>
        </div>
      </div>
    </FeedbackProvider>
  );
}
