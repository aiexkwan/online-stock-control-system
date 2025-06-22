/**
 * Test Widget - 測試點擊問題
 */

'use client';

import React, { useState } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';

const TestClickWidget: React.FC<WidgetComponentProps> = ({ widget, isEditMode }) => {
  const [count, setCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isEditMode) {
    return (
      <div className="w-full h-full bg-slate-800 rounded-lg p-4 flex items-center justify-center">
        <span className="text-white/60">Test Widget (Edit Mode)</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-4 widget-content">
      <h3 className="text-white mb-4">Click Test Widget</h3>
      
      {/* Test 1: Simple button */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Test 1: Simple Button</p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Click me: {count}
        </button>
      </div>

      {/* Test 2: Button with preventDefault */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Test 2: Button with preventDefault</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCount(count + 1);
          }}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          Click with preventDefault: {count}
        </button>
      </div>

      {/* Test 3: Dropdown like time selector */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Test 3: Dropdown</p>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded"
          >
            Dropdown: {dropdownOpen ? 'Open' : 'Closed'}
          </button>
          {dropdownOpen && (
            <div className="absolute top-full mt-2 bg-slate-700 rounded p-2">
              <button
                onClick={() => {
                  alert('Option clicked!');
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-slate-600 rounded"
              >
                Option 1
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Test 4: Input field */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Test 4: Input</p>
        <input
          type="text"
          placeholder="Type here..."
          className="px-3 py-2 bg-slate-700 text-white rounded w-full"
        />
      </div>
    </div>
  );
};

TestClickWidget.displayName = 'TestClickWidget';

export default TestClickWidget;