'use client';

import { useTranslations } from 'next-intl';

/** Names of asset classes and account types in the page's language; the API sends keys and French fallbacks. */
export function useFinanceLabels() {
  const t = useTranslations('finance');
  return {
    assetClass: (key: string, fallback?: string) => (t.has(`assetClass.${key}`) ? t(`assetClass.${key}`) : fallback ?? key),
    accountType: (key: string, fallback?: string) => (t.has(`accountType.${key}`) ? t(`accountType.${key}`) : fallback ?? key),
    // Stored as neutral keys when we write them; what a user typed is shown as typed.
    sector: (value: string) => (t.has(`sector.${value}`) ? t(`sector.${value}`) : value),
    region: (value: string) => (t.has(`region.${value}`) ? t(`region.${value}`) : value),
    period: (key: string) => (t.has(`period.${key}`) ? t(`period.${key}`) : key),
  };
}
