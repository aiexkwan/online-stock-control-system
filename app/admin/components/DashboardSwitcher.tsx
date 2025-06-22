'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export function DashboardSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const isGridstack = pathname.includes('gridstack');

  const handleSwitch = () => {
    if (isGridstack) {
      router.push('/admin');
    } else {
      router.push('/admin/page-gridstack');
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
      <span className="text-sm text-gray-400">Layout Engine:</span>
      <Button
        onClick={handleSwitch}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
      >
        {isGridstack ? (
          <>
            <ToggleRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Gridstack</span>
          </>
        ) : (
          <>
            <ToggleLeft className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500">React Grid Layout</span>
          </>
        )}
      </Button>
      <span className="text-xs text-gray-500">
        {isGridstack ? '(No height limits)' : '(Has height limits)'}
      </span>
    </div>
  );
}