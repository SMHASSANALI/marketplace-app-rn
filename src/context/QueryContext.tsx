/**
 * React Query (TanStack Query) provider.
 *
 * Configures a global QueryClient and wraps the app so all hooks using
 * useQuery / useMutation have access to the cache.
 *
 * Configuration:
 *  - staleTime: 30 s — cached data stays fresh for 30 seconds before
 *    background re-fetch is triggered.
 *  - retry: 2 — failed requests retry twice before surfacing an error.
 *  - refetchOnWindowFocus: false — avoids unnecessary refetches when the
 *    user switches apps (common on mobile).
 */

import React        from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30 * 1000, // 30 seconds
      retry:                2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0, // never auto-retry mutations
    },
  },
});

/**
 * Provides the React Query client to the entire component tree.
 * Nest this alongside <AuthProvider> in app/_layout.tsx.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
