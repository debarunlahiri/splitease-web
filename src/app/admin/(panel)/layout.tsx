import type { ReactNode } from 'react';
import Shell from '@/components/admin/Shell';
import '../admin.css';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
