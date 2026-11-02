import { CalendarDays, Calculator, LayoutDashboard, Link2, PieChart, Receipt, Settings, TrendingUp, Wallet, Wallet2, type LucideIcon } from 'lucide-react';

export interface NavItem { href: string; label: string; icon: LucideIcon }

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'Patrimoine', items: [
    { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { href: '/dashboard/accounts', label: 'Comptes', icon: Wallet },
    { href: '/dashboard/portfolio', label: 'Portefeuille', icon: PieChart },
    { href: '/dashboard/connections', label: 'Connexions', icon: Link2 },
  ] },
  { title: 'Analyse', items: [
    { href: '/dashboard/budget', label: 'Budget', icon: Wallet2 },
    { href: '/dashboard/dividends', label: 'Dividendes', icon: CalendarDays },
    { href: '/dashboard/fees', label: 'Frais', icon: Receipt },
  ] },
  { title: 'Projeter', items: [
    { href: '/dashboard/predict', label: 'Projections', icon: TrendingUp },
    { href: '/dashboard/simulators', label: 'Simulateurs', icon: Calculator },
  ] },
];

export const SETTINGS_ITEM: NavItem = { href: '/dashboard/settings', label: 'Paramètres', icon: Settings };
export const ALL_NAV: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

/** Four destinations plus "Plus": what a thumb reaches most, in the order of use. */
export const TAB_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/accounts', label: 'Comptes', icon: Wallet },
  { href: '/dashboard/portfolio', label: 'Portefeuille', icon: PieChart },
  { href: '/dashboard/budget', label: 'Budget', icon: Wallet2 },
];

export const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
