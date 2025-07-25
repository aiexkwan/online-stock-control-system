import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
  icons: {
    icon: '/images/logo.png',
  },
};

// 極簡 Root Layout - 每個 route group 自行處理 providers
export default function RootLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return (
    <html lang='en' className={lato.variable}>
      <body className={`${lato.className} font-lato`}>{safeChildren}</body>
    </html>
  );
}
