'use client';

import { useState } from 'react';
import { debugVoidReportIssue } from '@/app/void-pallet/services/voidReportService';

export default function TestVoidReportPage() {
  const [debugging, setDebugging] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const runDebug = async () => {
    setDebugging(true);
    setOutput(['Starting debug...']);
    
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = 'ERROR: ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalError(...args);
    };
    
    try {
      await debugVoidReportIssue();
      setOutput(logs);
    } catch (error) {
      logs.push(`Exception: ${error}`);
      setOutput(logs);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setDebugging(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Void Report Debug Page</h1>
      
      <button
        onClick={runDebug}
        disabled={debugging}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {debugging ? 'Running Debug...' : 'Run Debug'}
      </button>
      
      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Output:</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {output.join('\n')}
        </pre>
      </div>
    </div>
  );
}