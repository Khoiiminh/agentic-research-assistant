'use client';

import React from 'react';

/**
 * RootProvider combines all app-level providers
 * - ThemeProvider: for design tokens and styling
 * - ContextProviders: for global state (Search, Auth, etc)
 * - QueryProvider: for data fetching (if using TanStack Query)
 * - StoreProvider: for Redux/Zustand state management (if needed)
 */
export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <>{/* Add providers here */}{children}</>
  );
}
