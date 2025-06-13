'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, MapPin, Hash, TrendingUp } from 'lucide-react';
import { SearchSuggestion } from '../services/searchSuggestionsService';

interface SearchSuggestionsDropdownProps {
  isOpen: boolean;
  suggestions: SearchSuggestion[];
  popularSearches?: SearchSuggestion[];
  onSelect: (value: string) => void;
  onClose: () => void;
  loading?: boolean;
  currentValue: string;
}

export function SearchSuggestionsDropdown({
  isOpen,
  suggestions,
  popularSearches = [],
  onSelect,
  onClose,
  loading = false,
  currentValue
}: SearchSuggestionsDropdownProps) {
  if (!isOpen) return null;

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product_code':
        return <Package className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'pallet_num':
        return <Hash className="h-4 w-4" />;
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  // Show suggestions if available, otherwise show popular searches
  const showSuggestions = suggestions.length > 0 || (popularSearches.length > 0 && !currentValue);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading suggestions...</span>
            </div>
          </div>
        ) : showSuggestions ? (
          <div className="max-h-80 overflow-y-auto">
            {/* Current search suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-900/50">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    onClick={() => handleSelect(suggestion.value)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">
                        {getIcon(suggestion.type)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-white">{suggestion.value}</div>
                        <div className="text-xs text-slate-400">{suggestion.label}</div>
                      </div>
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-slate-500">
                        {suggestion.count} items
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Popular searches (when no input) */}
            {!currentValue && popularSearches.length > 0 && suggestions.length === 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-900/50 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular Searches
                </div>
                {popularSearches.map((search, index) => (
                  <button
                    key={`popular-${search.value}-${index}`}
                    onClick={() => handleSelect(search.value)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">
                        {getIcon(search.type)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-white">{search.value}</div>
                        <div className="text-xs text-slate-400">{search.label}</div>
                      </div>
                    </div>
                    {search.count && (
                      <span className="text-xs text-slate-500">
                        {search.count} items
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-slate-400">
            {currentValue ? 'No suggestions found' : 'Start typing to see suggestions'}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}