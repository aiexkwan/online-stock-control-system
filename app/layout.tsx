import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
  robots: 'index, follow',
  other: {
    'X-UA-Compatible': 'IE=edge',
    'format-detection': 'telephone=no',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// 極簡 Root Layout - 每個 route group 自行處理 providers
export default function RootLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  // 動態獲取 Supabase URL（避免硬編碼）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  return (
    <html lang='en' className={lato.variable}>
      <head>
        {supabaseUrl && (
          <>
            <link rel='dns-prefetch' href={supabaseUrl} />
            <link rel='preconnect' href={supabaseUrl} crossOrigin='anonymous' />
          </>
        )}
        <link rel='preload' href='/images/logo.png' as='image' type='image/png' />
      </head>
      <body className={`${lato.className} font-lato`}>
        {safeChildren}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
