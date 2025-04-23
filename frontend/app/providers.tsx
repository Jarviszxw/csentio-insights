// app/providers.tsx
'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DateRangeProvider } from '@/components/date-range-context';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟缓存
      gcTime: 1000 * 60 * 10, // 10 分钟缓存
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DateRangeProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </DateRangeProvider>
    </QueryClientProvider>
  );
}