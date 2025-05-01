'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from '@/lib/supabase';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">載入中...</p>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let ignore = false;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!ignore) {
          // 如果在登入頁面但已經有會話，重定向到儀表板
          if (session && pathname === '/login') {
            router.replace('/dashboard');
            return;
          }
          
          // 如果在其他頁面但沒有會話，重定向到登入頁面
          if (!session && pathname !== '/login' && !pathname.startsWith('/auth')) {
            router.replace('/login');
            return;
          }
          
          setMounted(true);
        }
      } catch (err) {
        console.error('初始化錯誤:', err);
        if (!ignore) {
          setError(err instanceof Error ? err : new Error('初始化失敗'));
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        router.replace('/dashboard');
      }
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">初始化錯誤</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow pt-16">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
} 