import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,   // 30s — keeps data fresh enough for class/role changes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Bridge React Query's focus manager to React Native's AppState so foregrounding
// the app re-checks any stale queries (admin assigns a class → teacher sees it on
// returning to the app).
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const appStateSubscription = AppState.addEventListener('change', onAppStateChange);
// keep reference so RN doesn't garbage-collect the listener on hot reload
(globalThis as any).__qcAppStateSub = appStateSubscription;
