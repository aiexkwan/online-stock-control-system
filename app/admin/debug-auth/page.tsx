'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { createClient } from '@/app/utils/supabase/client';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, loading, isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        setDebugInfo({
          hasSession: !!session,
          sessionUser: session?.user?.email || null,
          sessionError: error?.message || null,
          hookUser: user?.email || null,
          hookLoading: loading,
          hookAuthenticated: isAuthenticated,
          hookUserRole: userRole,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    };

    checkAuthStatus();

    // 每秒更新一次
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [user, loading, isAuthenticated, userRole]);

  return (
    <div className='min-h-screen bg-slate-900 p-8 text-white'>
      <h1 className='mb-4 text-2xl font-bold text-orange-500'>Auth Debug Page</h1>
      <div className='rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-lg font-semibold'>Authentication Status</h2>
        <pre className='overflow-auto text-sm text-green-400'>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className='mt-6 rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-lg font-semibold'>useAuth Hook Status</h2>
        <div className='space-y-2 text-sm'>
          <div>Loading: {loading ? 'true' : 'false'}</div>
          <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
          <div>User Email: {user?.email || 'null'}</div>
          <div>User Role Type: {userRole?.type || 'null'}</div>
        </div>
      </div>

      <div className='mt-6'>
        <button
          onClick={() => (window.location.href = '/admin/operations-monitoring')}
          className='rounded bg-orange-500 px-4 py-2 text-white'
        >
          Go to Operations Monitoring
        </button>
      </div>
    </div>
  );
}
