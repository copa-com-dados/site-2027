import { Link, useLocation } from 'react-router-dom';
import { BRAND_LOGO } from '../../config/brand';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS, isActive } from './nav';

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-gutter-mobile lg:px-gutter max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label={`${BRAND_LOGO.alt} — início`}>
          <img
            src={BRAND_LOGO.src}
            alt={BRAND_LOGO.alt}
            width={BRAND_LOGO.width}
            height={BRAND_LOGO.height}
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, pathname);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-md text-[14px] transition-colors ${
                  active
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
