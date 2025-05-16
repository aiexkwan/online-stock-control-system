"use client";
import React from 'react';
// 使用路徑別名導入
import { testServerActionReceivesCookie } from '@/app/actions/simpleTestAction'; 

export default function PrintGrnLabelPage() {
  const handleTestClick = async () => {
    console.log('[Client] Calling testServerActionReceivesCookie...');
    try {
      const result = await testServerActionReceivesCookie();
      console.log('[Client] Result from testServerActionReceivesCookie:', result);
      alert(`Server Action Result: ${JSON.stringify(result)}`);
    } catch (err) {
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error('[Client] Error calling testServerActionReceivesCookie:', err);
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>GRN Label Page (Cookie Test)</h1>
      <p>This page is for testing cookie propagation from Middleware to Server Action.</p>
      <button 
        onClick={handleTestClick} 
        style={{ 
          padding: '10px 15px', 
          backgroundColor: 'green', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}
      >
        Test Server Action Cookie Button
      </button>
    </div>
  );
} 