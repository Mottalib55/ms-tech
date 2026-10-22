'use client';
import { useQuery } from '@tanstack/react-query';
import { MonthlyBudget } from '@/types';
import { mockBudgetData } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useBudget() {
  return useQuery<MonthlyBudget[]>({
    queryKey: ['budget'],
    queryFn: async () => {
      if (isDemo()) return mockBudgetData;
      const res = await fetch('/api/budget');
      if (!res.ok) throw new Error('Failed to fetch budget');
      return res.json();
    },
    placeholderData: mockBudgetData,
  });
}
