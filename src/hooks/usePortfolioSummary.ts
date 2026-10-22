'use client';
import { useMemo } from 'react';
import { useAccounts } from './useAccounts';
import { useHoldings } from './useHoldings';

export function usePortfolioSummary() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();

  const summary = useMemo(() => {
    const totalPatrimoine = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0;
    const accountCount = accounts?.length ?? 0;
    const holdingsCount = holdings?.length ?? 0;
    return { totalPatrimoine, accountCount, holdingsCount };
  }, [accounts, holdings]);

  return {
    ...summary,
    isLoading: accountsLoading || holdingsLoading,
  };
}
