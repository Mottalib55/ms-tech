'use client';
import { useQuery } from '@tanstack/react-query';
import { Holding } from '@/types';
import { mockHoldings } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useHoldings() {
  return useQuery<Holding[]>({
    queryKey: ['holdings'],
    queryFn: async () => {
      if (isDemo()) return mockHoldings;
      const res = await fetch('/api/holdings');
      if (!res.ok) throw new Error('Failed to fetch holdings');
      return res.json();
    },
    placeholderData: mockHoldings,
  });
}
