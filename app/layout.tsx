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

// Note: Global error handlers for originalFactory.call errors have been removed
// as they can interfere with proper error reporting and SSR

// Add runtime check for CSS loading issues
if (typeof window !== 'undefined') {
  // Monitor for CSS/JS MIME type conflicts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
              const href = element.getAttribute('href');
              if (href && href.includes('_next/static/css/')) {
                // Ensure CSS files are loaded with correct MIME type
                element.addEventListener('error', (e) => {
                  console.warn('CSS loading error detected:', href);
                });
              }
            }
          }
        });
      }
    });
  });
  
  // Start observing after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.head, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.head, { childList: true, subtree: true });
  }
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
