import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';

export default function FlowCard({
  icon,
  label,
  title,
  children,
}: {
  icon: IconName;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="card">
      <div className="flow-icon">
        <Icon name={icon} size={25} />
      </div>
      <p className="kicker">{label}</p>
      <h1>{title}</h1>
      {children}
    </section>
  );
}
