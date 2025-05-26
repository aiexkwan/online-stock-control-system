'use client';

import React from 'react';
import { PerformanceOptimizedForm, ErrorBoundary, ErrorStats } from '../qc-label-form';

export default function QcLabelFormWrapper() {
  return (
    <ErrorBoundary context={{ component: 'QcLabelFormWrapper', action: 'render' }}>
      <div className="relative">
        <PerformanceOptimizedForm />
        <ErrorStats />
      </div>
    </ErrorBoundary>
  );
} 