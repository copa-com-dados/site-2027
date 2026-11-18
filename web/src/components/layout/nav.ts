export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Início', icon: 'analytics' },
  { path: '/previsoes', label: 'Previsões', icon: 'grid_view' },
  { path: '/simulador', label: 'Simulador', icon: 'sports_soccer' },
  { path: '/metodologia', label: 'Metodologia', icon: 'biotech' },
];

export function isActive(itemPath: string, current: string): boolean {
  return itemPath === '/' ? current === '/' : current.startsWith(itemPath);
}
