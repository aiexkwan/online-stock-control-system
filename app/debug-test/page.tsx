'use client';
import { useState } from 'react';
import { testWriteThenReadAction, testJustReadAction } from '@/app/actions/testActions'; 

export default function DebugPage() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userIdToTest = 5942; 

  const handleTest = async () => {
    setIsLoading(true);
    setResults("Running test...");
    try {
      const writeReadRes = await testWriteThenReadAction(userIdToTest);
      console.log("Client: WriteReadAction Response:", writeReadRes);
      
      // Optional: add a small client-side delay, e.g., 500ms or 1s
      // await new Promise(resolve => setTimeout(resolve, 500)); 

      const justReadRes = await testJustReadAction(userIdToTest);
      console.log("Client: JustReadAction Response:", justReadRes);
      setResults({ writeReadRes, justReadRes });
    } catch (error) {
      console.error("Client: Error during test execution:", error);
      setResults({ error: 'Test execution failed. Check console.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Consistency Debug Page</h1>
      <button 
        onClick={handleTest} 
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Running Test...' : `Run Consistency Test for User ${userIdToTest}`}
      </button>
      {results && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 class="text-xl font-semibold mb-2">Test Results:</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 