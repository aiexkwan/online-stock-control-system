'use client';

import { Timeline } from '@/components/ui/timeline';
import { ClockIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function TestTimelinePage() {
  const testItems = [
    {
      date: new Date().toISOString(),
      title: 'QC Done By John',
      description: '5 pallets',
      icon: <CheckCircleIcon className="h-3 w-3" />,
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      title: 'Transfer Done By Mary',
      description: 'PLT: A001 • To: Warehouse B',
      icon: <TruckIcon className="h-3 w-3" />,
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      title: 'QC Done By Peter',
      description: '3 pallets',
      icon: <CheckCircleIcon className="h-3 w-3" />,
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      title: 'Transfer Done By Alice',
      description: 'PLT: B002 • To: Warehouse A',
      icon: <TruckIcon className="h-3 w-3" />,
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      title: 'Time Check',
      description: 'System update',
      icon: <ClockIcon className="h-3 w-3" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">Timeline Test Page</h1>
      
      <div className="mb-8 text-center text-slate-400">
        <p>Desktop view should show left-right alternating layout</p>
        <p>Current screen width: check if you see the alternating pattern</p>
      </div>

      <div className="rounded-lg bg-slate-800 p-6">
        <Timeline
          items={testItems}
          initialCount={10}
          showAnimation={true}
          dotClassName="bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-slate-800"
          lineClassName="border-slate-600"
          titleClassName="text-slate-200 text-sm font-medium"
          descriptionClassName="text-slate-400 text-xs"
          dateClassName="text-slate-500 text-xs"
        />
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Index 0 (first item) should be on the LEFT</p>
        <p>Index 1 (second item) should be on the RIGHT</p>
        <p>Index 2 (third item) should be on the LEFT</p>
        <p>And so on...</p>
      </div>
    </div>
  );
}