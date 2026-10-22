'use client';
import { useQuery } from '@tanstack/react-query';
import { Fee } from '@/types';
import { mockFees } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useFees() {
  return useQuery<Fee[]>({
    queryKey: ['fees'],
    queryFn: async () => {
      if (isDemo()) return mockFees;
      const res = await fetch('/api/fees');
      if (!res.ok) throw new Error('Failed to fetch fees');
      return res.json();
    },
    placeholderData: mockFees,
  });
}
