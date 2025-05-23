import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
// import OpenAccessNav from '@/app/components/open-access-nav'; 
import Navigation from '@/app/components/Navigation'; // 改為引入 Navigation

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pennine Stock Control - Open Access',
  description: 'Stock control system for Pennine',
};

export default function OpenAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* <OpenAccessNav /> */}
      <Navigation /> {/* 改為使用 Navigation 組件 */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
} 