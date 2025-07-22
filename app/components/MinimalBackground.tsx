'use client';

import React from 'react';

// 登入頁面的極簡背景 - 不使用複雜的 visual-system
export function MinimalBackground() {
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{ zIndex: -1 }}
    />
  );
}