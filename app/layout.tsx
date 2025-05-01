import './globals.css';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
}
