import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme';
import { PremiumDialogProvider } from '../components/premium/PremiumDialogProvider';
import { trackTestQueryClient } from './queryCleanup';

type WrapperProps = {
  children: ReactNode;
};

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  trackTestQueryClient(client);
  return client;
}

type RenderWithProvidersOptions = RenderOptions & {
  queryClient?: QueryClient;
};

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions,
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  trackTestQueryClient(queryClient);
  const { queryClient: _ignored, ...renderOptions } = options ?? {};

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PremiumDialogProvider>{children}</PremiumDialogProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
