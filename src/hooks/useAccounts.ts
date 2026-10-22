'use client';
import { useQuery } from '@tanstack/react-query';
import { Account } from '@/types';
import { mockAccounts } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (isDemo()) return mockAccounts;
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    placeholderData: mockAccounts,
  });
}
