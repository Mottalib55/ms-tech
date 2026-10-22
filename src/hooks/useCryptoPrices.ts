'use client';
import { useQuery } from '@tanstack/react-query';

export function useCryptoPrices() {
  return useQuery<Record<string, { usd: number; eur: number }>>({
    queryKey: ['cryptoPrices'],
    queryFn: async () => {
      const res = await fetch('/api/crypto/prices');
      if (!res.ok) throw new Error('Failed to fetch crypto prices');
      return res.json();
    },
    refetchInterval: 60000,
  });
}
