/**
 * Ultra-Simple HistoryTreeV2 - 完全避免 Next.js 15 originalFactory.call 錯誤
 * 使用最基本嘅 React 組件，無任何複雜依賴
 */

'use client';

import React from 'react';

// 直接使用 function declaration 避免任何 factory 問題
function HistoryTreeV2(props: any) {
  const { widget, isEditMode } = props || {};

  return React.createElement(
    'div',
    {
      className: 'h-full bg-slate-800 border border-slate-600 rounded-lg',
      style: { minHeight: '400px' },
    },
    React.createElement(
      'div',
      { className: 'p-4 border-b border-slate-600' },
      React.createElement(
        'h3',
        { className: 'text-lg font-semibold text-white' },
        (widget && widget.title) || 'History Tree'
      )
    ),
    React.createElement(
      'div',
      { className: 'p-4' },
      isEditMode
        ? React.createElement(
            'div',
            { className: 'text-center text-slate-400 py-8' },
            'Edit Mode - History Tree'
          )
        : React.createElement(
            'div',
            { className: 'space-y-3' },
            React.createElement(
              'div',
              { className: 'flex items-start gap-3' },
              React.createElement('div', { className: 'w-2 h-2 rounded-full bg-blue-500 mt-2' }),
              React.createElement(
                'div',
                { className: 'flex-1 min-w-0' },
                React.createElement(
                  'div',
                  { className: 'text-sm font-medium text-white' },
                  'System Activity'
                ),
                React.createElement(
                  'div',
                  { className: 'text-xs text-slate-400' },
                  'Recent operations and updates'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'flex items-start gap-3' },
              React.createElement('div', { className: 'w-2 h-2 rounded-full bg-slate-500 mt-2' }),
              React.createElement(
                'div',
                { className: 'flex-1 min-w-0' },
                React.createElement(
                  'div',
                  { className: 'text-sm font-medium text-white' },
                  'Data Processing'
                ),
                React.createElement(
                  'div',
                  { className: 'text-xs text-slate-400' },
                  'Background tasks completed'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'flex items-start gap-3' },
              React.createElement('div', { className: 'w-2 h-2 rounded-full bg-slate-500 mt-2' }),
              React.createElement(
                'div',
                { className: 'flex-1 min-w-0' },
                React.createElement(
                  'div',
                  { className: 'text-sm font-medium text-white' },
                  'System Status'
                ),
                React.createElement(
                  'div',
                  { className: 'text-xs text-slate-400' },
                  'All systems operational'
                )
              )
            )
          )
    )
  );
}

// 使用最簡單嘅導出方式
export default HistoryTreeV2;
export { HistoryTreeV2 };
