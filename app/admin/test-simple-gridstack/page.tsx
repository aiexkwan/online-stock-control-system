'use client';

import { SimpleGridstack } from '../components/dashboard/SimpleGridstack';

export default function TestSimpleGridstackPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-[1600px] mx-auto">
        <SimpleGridstack />
      </div>
    </div>
  );
}