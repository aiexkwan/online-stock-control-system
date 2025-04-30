'use client';

import './globals.css';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from './ClientLayout'
import ErrorBoundary from './components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pennine庫存控制系統',
  description: '用於管理倉庫庫存的完整在線系統',
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Navigation />
      <main className="pt-16"> {/* 為導航欄保留空間 */}
        {children}
      </main>
    </ErrorBoundary>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
