'use client';

import React from 'react';
import { VisualSystemProvider, UnifiedBackground } from '@/app/components/visual-system';

export function ClientVisualSystemProvider({ children }: { children: React.ReactNode }) {
  return (
    <VisualSystemProvider>
      <UnifiedBackground />
      {children}
    </VisualSystemProvider>
  );
}
