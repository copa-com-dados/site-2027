import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface SectionHeaderProps {
  icon?: string;
  iconClassName?: string;
  title: string;
  aside?: ReactNode;
}

export function SectionHeader({ icon, iconClassName = 'text-secondary', title, aside }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon && <Icon name={icon} className={`${iconClassName} text-[18px]`} />}
        <h2 className="font-title-lg text-[20px] font-semibold text-on-surface">{title}</h2>
      </div>
      {aside}
    </div>
  );
}
