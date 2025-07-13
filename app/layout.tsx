import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientLayout from './components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
  icons: {
    icon: '/images/logo.png', // 使用現有的圖片作為 favicon
  },
};

// Global error handler for originalFactory.call errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('originalFactory.call') || 
        message.includes('undefined is not an object')) {
      console.warn('[Global Error Handler] Detected originalFactory.call error, this might be a dynamic import issue');
      // Don't spam the console with these errors
      return;
    }
    originalConsoleError(...args);
  };

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;
      if (message.includes('originalFactory.call') || 
          message.includes('undefined is not an object')) {
        console.warn('[Global Promise Handler] Caught originalFactory.call error in promise');
        event.preventDefault(); // Prevent the error from being logged
        return;
      }
    }
  });
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='font-lato'>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
