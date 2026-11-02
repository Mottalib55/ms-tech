'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type {
  Account, AccountDetail, Alert, Connection, Dividend, Fee, Holding, Me, MonthlyBudget, PerformancePoint, Provider, Summary,
} from '@/types';

const q = <T,>(key: string) => ({ queryKey: [key], queryFn: () => api<T>(`/api/${key}`) });

export const useSummary = () => useQuery(q<Summary>('summary'));
export const useAccounts = () => useQuery(q<Account[]>('accounts'));
export const useHoldings = () => useQuery(q<Holding[]>('holdings'));
export const useFees = () => useQuery(q<Fee[]>('fees'));
export const useDividends = () => useQuery(q<Dividend[]>('dividends'));
export const useBudget = () => useQuery(q<MonthlyBudget[]>('budget'));
export const usePerformance = () => useQuery(q<PerformancePoint[]>('performance'));
export const useAlerts = () => useQuery({ ...q<Alert[]>('alerts'), refetchInterval: 5 * 60_000 });
export const useMe = () => useQuery(q<Me>('me'));
export const useConnections = () => useQuery(q<{ connections: Connection[]; providers: Provider[] }>('connections'));
export const useAccount = (id: string) =>
  useQuery({ queryKey: ['accounts', id], queryFn: () => api<AccountDetail>(`/api/accounts/${id}`) });

/**
 * Any write: one busy flag, the server's own message on failure, and every
 * figure on screen refreshed on success. Nothing here reports a success the
 * server did not confirm.
 */
export function useAction<V = void, R = unknown>(
  run: (vars: V) => Promise<R>,
  opts?: { success?: string | ((r: R) => string); onSuccess?: (r: R) => void | Promise<unknown>; onError?: (e: Error) => void; refetch?: boolean },
) {
  const client = useQueryClient();
  return useMutation<R, Error, V>({
    mutationFn: run,
    onSuccess: async (r) => {
      // In this order: changing a password renews the session in onSuccess. Saying "done" or
      // refetching before that would send the old session and bounce the user to the login page.
      await opts?.onSuccess?.(r);
      const m = typeof opts?.success === 'function' ? opts.success(r) : opts?.success;
      if (m) toast(m, 'success');
      if (opts?.refetch !== false) client.invalidateQueries();
    },
    onError: (e) => {
      if (opts?.onError) opts.onError(e);
      else toast(e.message, 'error');
    },
  });
}
