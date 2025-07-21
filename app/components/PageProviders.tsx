'use client';

import React from 'react';
import { Toaster } from 'sonner';

// 只包含 Toaster，俾需要既頁面單獨 import
export function PageToaster() {
  return (
    <Toaster
      position='top-right'
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: 'rgb(30, 41, 59)',
          border: '1px solid rgb(51, 65, 85)',
          color: 'rgb(248, 250, 252)',
        },
      }}
    />
  );
}