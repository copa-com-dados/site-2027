import type { SiteContent } from '../../types/schema';
import { Icon } from './Icon';

export function SiteFooter({ site }: { site: SiteContent }) {
  return (
    <footer className="pt-2 pb-4 flex flex-col items-center text-center space-y-1">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon name="school" className="text-[15px]" />
        <p className="font-label-sm text-[11px]">{site.footer.line1}</p>
      </div>
      {site.footer.line2 && <p className="font-label-sm text-[11px] text-outline">{site.footer.line2}</p>}
    </footer>
  );
}
