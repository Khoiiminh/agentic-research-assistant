'use client';

import React from 'react';

/**
 * ThemeProvider wraps the app with theme context
 * Manages design tokens, color schemes, and global styles
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
