import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import Script from 'next/script';

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
  manifest: '/manifest.json',
  robots: 'index, follow',
  other: {
    'X-UA-Compatible': 'IE=edge',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
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

  return (
    <html lang='en' className={lato.variable}>
      <head>
        <link rel='dns-prefetch' href='https://bbmkuiplnzvpudszrend.supabase.co' />
        <link
          rel='preconnect'
          href='https://bbmkuiplnzvpudszrend.supabase.co'
          crossOrigin='anonymous'
        />
        <link rel='preload' href='/images/logo.png' as='image' type='image/png' />
      </head>
      <body className={`${lato.className} font-lato`}>
        {safeChildren}

        {/* Service Worker Registration Script */}
        <Script
          id='sw-register'
          strategy='afterInteractive'
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
