'use client';
import { useQuery } from '@tanstack/react-query';
import { Dividend } from '@/types';
import { mockDividends } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useDividends() {
  return useQuery<Dividend[]>({
    queryKey: ['dividends'],
    queryFn: async () => {
      if (isDemo()) return mockDividends;
      const res = await fetch('/api/dividends');
      if (!res.ok) throw new Error('Failed to fetch dividends');
      return res.json();
    },
    placeholderData: mockDividends,
  });
}
