import './globals.css';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pennine庫存控制系統',
  description: '用於管理倉庫庫存的完整在線系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="pt-16"> {/* 為導航欄保留空間 */}
          {children}
        </main>
      </body>
    </html>
  )
}
