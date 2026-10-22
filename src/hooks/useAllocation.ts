'use client';
import { useQuery } from '@tanstack/react-query';
import { AllocationItem } from '@/types';
import { mockAllocation } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function useAllocation() {
  return useQuery<AllocationItem[]>({
    queryKey: ['allocation'],
    queryFn: async () => {
      if (isDemo()) return mockAllocation;
      const res = await fetch('/api/allocation');
      if (!res.ok) throw new Error('Failed to fetch allocation');
      return res.json();
    },
    placeholderData: mockAllocation,
  });
}
