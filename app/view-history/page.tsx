'use client';

import React from 'react';

export default function ViewHistoryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">View History</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="series" className="block text-sm font-medium">Series</label>
            <input
              id="series"
              type="text"
              placeholder="Please Use Scanner To Start"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
              // Add state and handlers as needed
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNum" className="block text-sm font-medium">Pallet Number</label>
            <input
              id="palletNum"
              type="text"
              placeholder="Please Type In Pallet Number"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
              // Add state and handlers as needed
            />
          </div>
        </div>
        {/* Placeholder for history results table */}
        {/* <div className="mt-8 w-full bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">History Results:</h2>
          <p className="text-center text-gray-400">Search to display history.</p>
        </div> */}
      </div>
    </div>
  );
} 