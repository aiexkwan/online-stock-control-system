import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
  robots: 'index, follow',
  other: {
    'X-UA-Compatible': 'IE=edge',
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// 極簡 Root Layout - 專為登入頁面優化
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <link rel='dns-prefetch' href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
      </head>
      <body>{children}</body>
    </html>
  );
}
