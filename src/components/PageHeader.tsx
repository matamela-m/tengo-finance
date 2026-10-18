import type { ReactNode } from 'react';
import { usePageTitle } from '../lib/usePageTitle';

export function PageHeader({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  usePageTitle(title);
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-heading text-h1 text-ink">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-[15px] text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
