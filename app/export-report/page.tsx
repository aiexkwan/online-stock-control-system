'use client';

import React from 'react';
import { exportAcoReport } from '../../lib/exportReport';

export default function ExportReportPage() {
  const handleExport = async (reportType: string) => {
    if (reportType === 'ACO Order Report') {
      await exportAcoReport();
    } else {
      // Placeholder for other export functionalities
      alert(`Exporting ${reportType}...`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">Export Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => handleExport('ACO Order Report')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          ACO Order Report
        </button>
        <button
          onClick={() => handleExport('Slate Report')}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          Slate Report
        </button>
        <button
          onClick={() => handleExport('GRN Report')}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          GRN Report
        </button>
        <button
          onClick={() => handleExport('Transaction Report')}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          Transaction Report
        </button>
      </div>
    </div>
  );
} 