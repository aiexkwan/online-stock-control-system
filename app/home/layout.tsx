import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pennine Stock Control - Access',
  description: 'Stock control system for Pennine',
};

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        {children}
      </div>
    </div>
  );
} 