import React from 'react';

export default function PrintGrnLabelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-6">Print GRN Label</h2>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">GRN Number</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter GRN Number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Material Supplier</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Material Supplier"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Code</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Product Code"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Gross Weight/Qty</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Gross Weight or Quantity"
            />
          </div>
        </form>
      </div>
    </div>
  );
} 