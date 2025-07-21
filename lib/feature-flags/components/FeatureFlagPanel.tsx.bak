import React, { useState, useEffect } from 'react';
import { FeatureFlag, FeatureFlagStatus } from '../types';
import { featureFlagManager } from '../FeatureFlagManager';
import { useAllFeatureFlags } from '../hooks/useFeatureFlag';
import { isProduction } from '@/lib/utils/env';

/**
 * Feature Flag 開發面板
 * 僅在開發環境中顯示
 */
export const FeatureFlagPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { flags: evaluations, refresh } = useAllFeatureFlags();

  useEffect(() => {
    loadFlags();
  }, []);

  // 只在開發環境顯示
  if (isProduction()) {
    return null;
  }

  const loadFlags = async () => {
    const allFlags = await featureFlagManager.getAllFlags();
    setFlags(allFlags);
  };

  const handleToggle = async (key: string) => {
    try {
      await featureFlagManager.toggleFlag(key);
      await loadFlags();
      await refresh();
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleStatusChange = async (key: string, status: FeatureFlagStatus) => {
    try {
      await featureFlagManager.updateFlag(key, { status });
      await loadFlags();
      await refresh();
    } catch (error) {
      console.error('Failed to update flag status:', error);
    }
  };

  const handlePercentageChange = async (key: string, percentage: number) => {
    try {
      await featureFlagManager.updateFlag(key, { rolloutPercentage: percentage });
      await loadFlags();
      await refresh();
    } catch (error) {
      console.error('Failed to update rollout percentage:', error);
    }
  };

  // 獲取所有標籤
  const allTags = Array.from(new Set(flags.flatMap(f => f.tags || [])));

  // 過濾 flags
  const filteredFlags = flags.filter(flag => {
    const matchesSearch =
      !searchTerm ||
      flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 || selectedTags.every(tag => flag.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors hover:bg-blue-700'
        title='Open Feature Flags'
      >
        <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
          />
        </svg>
      </button>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50'>
      <div className='flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between bg-gray-900 p-4 text-white'>
          <h2 className='text-xl font-semibold'>Feature Flags</h2>
          <button
            onClick={() => setIsOpen(false)}
            className='rounded p-2 transition-colors hover:bg-gray-800'
          >
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className='border-b bg-gray-50 p-4'>
          <input
            type='text'
            placeholder='Search flags...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />

          {allTags.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flags List */}
        <div className='flex-1 overflow-y-auto p-4'>
          {filteredFlags.map(flag => {
            const evaluation = evaluations[flag.key];
            const isEnabled = evaluation?.enabled || false;

            return (
              <div key={flag.key} className='mb-4 rounded-lg border bg-white p-4 shadow-sm'>
                <div className='mb-2 flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold'>{flag.name}</h3>
                    <p className='font-mono text-sm text-gray-600'>{flag.key}</p>
                    {flag.description && (
                      <p className='mt-1 text-sm text-gray-500'>{flag.description}</p>
                    )}
                    {flag.tags && flag.tags.length > 0 && (
                      <div className='mt-2 flex gap-1'>
                        {flag.tags.map(tag => (
                          <span
                            key={tag}
                            className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-600'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(flag.key)}
                    className={`ml-4 rounded-md px-4 py-2 transition-colors ${
                      isEnabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Status Selector */}
                <div className='mt-3 flex items-center gap-4'>
                  <label className='text-sm font-medium text-gray-700'>Status:</label>
                  <select
                    value={flag.status}
                    onChange={e =>
                      handleStatusChange(flag.key, e.target.value as FeatureFlagStatus)
                    }
                    className='rounded border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value={FeatureFlagStatus.ENABLED}>Enabled</option>
                    <option value={FeatureFlagStatus.DISABLED}>Disabled</option>
                    <option value={FeatureFlagStatus.PARTIAL}>Partial</option>
                  </select>
                </div>

                {/* Rollout Percentage */}
                {flag.status === FeatureFlagStatus.PARTIAL && (
                  <div className='mt-3'>
                    <label className='text-sm font-medium text-gray-700'>
                      Rollout: {flag.rolloutPercentage || 0}%
                    </label>
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={flag.rolloutPercentage || 0}
                      onChange={e => handlePercentageChange(flag.key, parseInt(e.target.value))}
                      className='mt-1 w-full'
                    />
                  </div>
                )}

                {/* Variants */}
                {flag.type === 'variant' && flag.variants && flag.variants.length > 0 && (
                  <div className='mt-3'>
                    <p className='mb-1 text-sm font-medium text-gray-700'>Variants:</p>
                    <div className='flex gap-2'>
                      {flag.variants.map(variant => (
                        <span
                          key={variant.key}
                          className={`rounded px-2 py-1 text-xs ${
                            evaluation?.variant === variant.key
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {variant.name} ({variant.weight}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evaluation Info */}
                {evaluation && (
                  <div className='mt-3 text-xs text-gray-500'>
                    <p>Reason: {evaluation.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className='border-t bg-gray-50 p-4 text-sm text-gray-600'>
          <p>💡 Development panel only. Not visible in production.</p>
        </div>
      </div>
    </div>
  );
};
