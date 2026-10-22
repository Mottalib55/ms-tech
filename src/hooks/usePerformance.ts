'use client';
import { useQuery } from '@tanstack/react-query';
import { PerformancePoint } from '@/types';
import { mockPerformanceData } from '@/data/mock';

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('ms-tech-demo') === 'true';
}

export function usePerformance() {
  return useQuery<PerformancePoint[]>({
    queryKey: ['performance'],
    queryFn: async () => {
      if (isDemo()) return mockPerformanceData;
      const res = await fetch('/api/performance');
      if (!res.ok) throw new Error('Failed to fetch performance');
      return res.json();
    },
    placeholderData: mockPerformanceData,
  });
}
