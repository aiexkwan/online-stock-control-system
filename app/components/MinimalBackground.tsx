'use client';

import React from 'react';

// Phase 1 緊急修復：使用內聯樣式確保背景一定顯示
export function MinimalBackground() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        minHeight: '100vh',
        minWidth: '100vw'
      }}
      className="fixed inset-0"
    />
  );
}