'use client';
import { useQuery } from '@tanstack/react-query';
import { ProviderConnectionInfo } from '@/types';

export function useConnections() {
  return useQuery<ProviderConnectionInfo[]>({
    queryKey: ['connections'],
    queryFn: async () => {
      const res = await fetch('/api/connections');
      if (!res.ok) throw new Error('Failed to fetch connections');
      return res.json();
    },
  });
}
