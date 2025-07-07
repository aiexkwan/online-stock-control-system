import React, { useState, useEffect } from 'react';
import { FeatureFlag, FeatureFlagStatus } from '../types';
import { featureFlagManager } from '../FeatureFlagManager';
import { useAllFeatureFlags } from '../hooks/useFeatureFlag';

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

  // 只在開發環境顯示
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  useEffect(() => {
    loadFlags();
  }, []);

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
  const allTags = Array.from(
    new Set(flags.flatMap(f => f.tags || []))
  );

  // 過濾 flags
  const filteredFlags = flags.filter(flag => {
    const matchesSearch = !searchTerm || 
      flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => flag.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Feature Flags"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Feature Flags</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <input
            type="text"
            placeholder="Search flags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-4">
          {filteredFlags.map(flag => {
            const evaluation = evaluations[flag.key];
            const isEnabled = evaluation?.enabled || false;

            return (
              <div key={flag.key} className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{flag.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{flag.key}</p>
                    {flag.description && (
                      <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                    )}
                    {flag.tags && flag.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {flag.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleToggle(flag.key)}
                    className={`ml-4 px-4 py-2 rounded-md transition-colors ${
                      isEnabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                    }`}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Status Selector */}
                <div className="mt-3 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={flag.status}
                    onChange={(e) => handleStatusChange(flag.key, e.target.value as FeatureFlagStatus)}
                    className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={FeatureFlagStatus.ENABLED}>Enabled</option>
                    <option value={FeatureFlagStatus.DISABLED}>Disabled</option>
                    <option value={FeatureFlagStatus.PARTIAL}>Partial</option>
                  </select>
                </div>

                {/* Rollout Percentage */}
                {flag.status === FeatureFlagStatus.PARTIAL && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">
                      Rollout: {flag.rolloutPercentage || 0}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rolloutPercentage || 0}
                      onChange={(e) => handlePercentageChange(flag.key, parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                )}

                {/* Variants */}
                {flag.type === 'variant' && flag.variants && flag.variants.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Variants:</p>
                    <div className="flex gap-2">
                      {flag.variants.map(variant => (
                        <span
                          key={variant.key}
                          className={`px-2 py-1 text-xs rounded ${
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
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Reason: {evaluation.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <p>💡 Development panel only. Not visible in production.</p>
        </div>
      </div>
    </div>
  );
};