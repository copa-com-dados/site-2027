import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS, isActive } from './nav';

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="lg:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(15,23,42,0.04)]"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-16 px-space-xs">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path, pathname);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-space-xs py-1 transition-colors ${
                active ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
