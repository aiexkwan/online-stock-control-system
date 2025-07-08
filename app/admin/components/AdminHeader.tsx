'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className='border-b border-slate-700 bg-slate-800 px-6 py-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Pennine Stock Control System</h1>
          <p className='text-sm text-gray-400'>Admin Dashboard</p>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleRefresh}
            variant='outline'
            size='sm'
            className='border-slate-600 text-white hover:bg-slate-700'
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>

          <Button
            onClick={handleLogout}
            variant='outline'
            size='sm'
            className='border-slate-600 text-white hover:bg-slate-700'
          >
            <LogOut className='mr-2 h-4 w-4' />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
