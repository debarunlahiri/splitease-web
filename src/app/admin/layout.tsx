import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | SplitEase Admin' },
  robots: { index: false, follow: false },
};

// Runs before the page paints, so a saved or system dark theme never flashes light first.
const THEME_SCRIPT = `try{var t=localStorage.getItem('adm-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-adm-theme',d?'dark':'light')}catch(e){}`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </>
  );
}
