'use client';

import React from 'react';
import { BoltIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

interface StreamingModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const StreamingModeToggle: React.FC<StreamingModeToggleProps> = React.memo(({
  enabled,
  onToggle,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
      <div className="flex items-center gap-2">
        {enabled ? (
          <>
            <BoltIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Streaming Mode</span>
          </>
        ) : (
          <>
            <CloudArrowDownIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Batch Mode</span>
          </>
        )}
      </div>
      {enabled && (
        <div className="text-xs text-gray-500 ml-2">
          (Faster for multiple labels)
        </div>
      )}
    </div>
  );
});

StreamingModeToggle.displayName = 'StreamingModeToggle';