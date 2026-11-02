import { CalendarDays, Calculator, LayoutDashboard, Link2, PieChart, Receipt, Settings, TrendingUp, Wallet, Wallet2, type LucideIcon } from 'lucide-react';

/** `label` and group titles are keys of messages/<locale>/nav.json. */
export interface NavItem { href: string; label: string; icon: LucideIcon }

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'groupWealth', items: [
    { href: '/dashboard', label: 'overview', icon: LayoutDashboard },
    { href: '/dashboard/accounts', label: 'accounts', icon: Wallet },
    { href: '/dashboard/portfolio', label: 'portfolio', icon: PieChart },
    { href: '/dashboard/connections', label: 'connections', icon: Link2 },
  ] },
  { title: 'groupAnalysis', items: [
    { href: '/dashboard/budget', label: 'budget', icon: Wallet2 },
    { href: '/dashboard/dividends', label: 'dividends', icon: CalendarDays },
    { href: '/dashboard/fees', label: 'fees', icon: Receipt },
  ] },
  { title: 'groupProject', items: [
    { href: '/dashboard/predict', label: 'predict', icon: TrendingUp },
    { href: '/dashboard/simulators', label: 'simulators', icon: Calculator },
  ] },
];

export const SETTINGS_ITEM: NavItem = { href: '/dashboard/settings', label: 'settings', icon: Settings };
export const ALL_NAV: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

/** Four destinations plus "Plus": what a thumb reaches most, in the order of use. */
export const TAB_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'home', icon: LayoutDashboard },
  { href: '/dashboard/accounts', label: 'accounts', icon: Wallet },
  { href: '/dashboard/portfolio', label: 'portfolio', icon: PieChart },
  { href: '/dashboard/budget', label: 'budget', icon: Wallet2 },
];

export const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
