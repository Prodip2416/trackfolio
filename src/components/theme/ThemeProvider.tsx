'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Suppress the React 19 false positive warning about script tags from next-themes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!(window as any).__REACT_19_SCRIPT_WARNING_SUPPRESSED) {
    (window as any).__REACT_19_SCRIPT_WARNING_SUPPRESSED = true;
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
        return;
      }
      originalError.apply(console, args);
    };
  }
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
