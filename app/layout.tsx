import './globals.css';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from './components/ClientLayout'
import { Toaster } from 'sonner';

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
      <body className="font-lato">
        <ClientLayout>{children}</ClientLayout>
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: {
              transform: 'scale(1.5)',
              transformOrigin: 'top center',
            },
          }}
        />
      </body>
    </html>
  )
}
