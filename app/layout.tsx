import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { AccessibilityProvider } from '@/lib/accessibility';

export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='font-lato'>
        <AccessibilityProvider>
          <div className='min-h-screen bg-slate-900'>{safeChildren}</div>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
