import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { NAV_ITEMS, isActive } from './nav';

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const item = NAV_ITEMS.find((i) => isActive(i.path, pathname));
    document.title =
      item && item.path !== '/' ? `${item.label} · Copa com Dados 2027` : 'Copa com Dados 2027';
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main
        id="conteudo"
        className="flex-1 flex flex-col relative w-full max-w-6xl mx-auto pt-16 pb-24 lg:pt-24 lg:pb-12 bg-surface px-gutter-mobile lg:px-gutter"
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
