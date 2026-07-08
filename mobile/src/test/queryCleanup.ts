import type { QueryClient } from '@tanstack/react-query';

const activeQueryClients = new Set<QueryClient>();

export function trackTestQueryClient(client: QueryClient) {
  activeQueryClients.add(client);
}

export function cleanupTestQueryClients() {
  for (const client of activeQueryClients) {
    client.clear();
  }
  activeQueryClients.clear();
}
