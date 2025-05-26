import React from 'react';

export const dynamic = 'force-dynamic';

export default async function AccessDashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome</h1>
        <p className="text-xl text-gray-300">Please use the sidebar navigation to access system features</p>
      </div>
    </div>
  );
} 