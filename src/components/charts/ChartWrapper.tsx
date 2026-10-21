'use client';

import { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  children: ReactNode;
  height?: number;
}

export default function ChartWrapper({ children, height = 300 }: ChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
}
