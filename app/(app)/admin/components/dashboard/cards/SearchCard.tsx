'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  History,
  Loader2,
  X,
  ArrowRight,
  Package,
  Layers,
  FileText,
  Users,
  ShoppingCart,
  Settings2,
  ChevronDown,
  Clock,
  Star,
  Zap,
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  SearchCardInput,
  SearchCardData,
  SearchMode,
  SearchType,
  SearchableEntity,
  SearchResultItem,
  SuggestionType,
} from '@/types/generated/search-types';

// GraphQL Query
const SEARCH_CARD_QUERY = gql`
  query SearchCard($input: SearchCardInput!) {
    searchCard(input: $input) {
      searchMeta {
        query
        processedQuery
        searchMode
        searchType
        entities
        totalResults
        searchTime
        hasMore
      }
      results {
        items {
          id
          entity
          title
          subtitle
          description
          relevanceScore
          matchedFields
          data {
            ... on ProductSearchResult {
              code
              description
              colour
              type
              totalStock
              totalPallets
              lastUpdated
            }
            ... on PalletSearchResult {
              pltNum
              series
              productCode
              productQty
              generateTime
              isAvailable
            }
            ... on InventorySearchResult {
              id
              productCode
              totalStock
              pltNum
              lastUpdated
            }
          }
          actions {
            id
            label
            icon
            url
            action
            requiresAuth
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
        }
      }
      suggestions {
        text
        type
        entity
        count
        score
        metadata
      }
    }
  }
`;

const SEARCH_SUGGESTIONS_QUERY = gql`
  query SearchSuggestions($query: String!, $entity: SearchableEntity, $limit: Int) {
    searchSuggestions(query: $query, entity: $entity, limit: $limit) {
      text
      type
      entity
      count
      score
      metadata
    }
  }
`;

interface SearchCardProps {
  className?: string;
  placeholder?: string;
  defaultQuery?: string;
  defaultMode?: SearchMode;
  defaultEntities?: SearchableEntity[];
  onResultSelect?: (result: SearchResultItem) => void;
  onSearch?: (query: string, results: SearchCardData) => void;
}

// Entity Icons Mapping
const entityIcons = {
  [SearchableEntity.Product]: Package,
  [SearchableEntity.Pallet]: Layers,
  [SearchableEntity.Inventory]: Package,
  [SearchableEntity.Order]: ShoppingCart,
  [SearchableEntity.Grn]: FileText,
  [SearchableEntity.User]: Users,
  [SearchableEntity.Supplier]: Users,
  [SearchableEntity.History]: Clock,
  [SearchableEntity.Transfer]: ArrowRight,
  [SearchableEntity.File]: FileText,
};

// Entity Colors
const entityColors = {
  [SearchableEntity.Product]: 'bg-blue-500',
  [SearchableEntity.Pallet]: 'bg-green-500',
  [SearchableEntity.Inventory]: 'bg-purple-500',
  [SearchableEntity.Order]: 'bg-orange-500',
  [SearchableEntity.Grn]: 'bg-cyan-500',
  [SearchableEntity.User]: 'bg-indigo-500',
  [SearchableEntity.Supplier]: 'bg-yellow-500',
  [SearchableEntity.History]: 'bg-gray-500',
  [SearchableEntity.Transfer]: 'bg-red-500',
  [SearchableEntity.File]: 'bg-pink-500',
};

export default function SearchCard({
  className = '',
  placeholder = 'Search products, pallets, orders...',
  defaultQuery = '',
  defaultMode = SearchMode.Global,
  defaultEntities,
  onResultSelect,
  onSearch,
}: SearchCardProps) {
  // State
  const [query, setQuery] = useState(defaultQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(defaultMode);
  const [selectedEntities, setSelectedEntities] = useState<SearchableEntity[]>(
    defaultEntities || [SearchableEntity.Product, SearchableEntity.Pallet]
  );
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search input
  const searchInput: SearchCardInput = useMemo(
    () => ({
      query: debouncedQuery,
      mode: selectedMode,
      type: SearchType.Text, // Auto-detect in resolver
      entities: selectedEntities,
      pagination: {
        limit: 20,
        offset: 0,
      },
    }),
    [debouncedQuery, selectedMode, selectedEntities]
  );

  // GraphQL Query
  const { data, loading, error } = useQuery<{ searchCard: SearchCardData }>(SEARCH_CARD_QUERY, {
    variables: { input: searchInput },
    skip: !debouncedQuery || debouncedQuery.length < 2,
    onCompleted: data => {
      if (onSearch && data.searchCard) {
        onSearch(debouncedQuery, data.searchCard);
      }
    },
  });

  // Handle search input focus
  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handle search input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if clicking within the search container
    if (searchContainerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResultItem) => {
      setQuery(result.title);
      setIsOpen(false);

      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [result.title, ...prev.filter(s => s !== result.title)];
        return updated.slice(0, 5); // Keep only 5 recent searches
      });

      if (onResultSelect) {
        onResultSelect(result);
      }
    },
    [onResultSelect]
  );

  // Handle entity filter toggle
  const handleEntityToggle = useCallback((entity: SearchableEntity) => {
    setSelectedEntities(prev => {
      if (prev.includes(entity)) {
        return prev.filter(e => e !== entity);
      } else {
        return [...prev, entity];
      }
    });
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    searchInputRef.current?.focus();
  }, []);

  // Suggestion type icons
  const getSuggestionIcon = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.PopularSearch:
        return Star;
      case SuggestionType.RecentSearch:
        return Clock;
      case SuggestionType.SpellingCorrection:
        return Zap;
      case SuggestionType.Autocomplete:
        return Search;
      case SuggestionType.RelatedSearch:
        return ArrowRight;
      default:
        return Search;
    }
  };

  const searchResults = data?.searchCard;
  const hasResults = (searchResults?.results?.items?.length ?? 0) > 0;
  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0);

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      {/* Search Input */}
      <div className='relative'>
        <div className='relative flex items-center'>
          <Search className='absolute left-3 h-4 w-4 text-gray-400' />
          <input
            ref={searchInputRef}
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className='w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-20 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
          />

          {/* Loading indicator */}
          {loading && <Loader2 className='absolute right-12 h-4 w-4 animate-spin text-gray-400' />}

          {/* Clear button */}
          {query && (
            <button
              onClick={handleClearSearch}
              className='absolute right-12 h-4 w-4 text-gray-400 hover:text-gray-600'
            >
              <X className='h-4 w-4' />
            </button>
          )}

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 rounded p-1 transition-colors ${
              showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter className='h-4 w-4' />
          </button>
        </div>

        {/* Search Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg'
            >
              <div className='space-y-4'>
                {/* Search Mode */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Search Mode
                  </label>
                  <div className='flex space-x-2'>
                    {Object.values(SearchMode).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          selectedMode === mode
                            ? 'border-blue-200 bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity Filters */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Search In</label>
                  <div className='grid grid-cols-3 gap-2'>
                    {Object.values(SearchableEntity).map(entity => {
                      const Icon = entityIcons[entity];
                      const isSelected = selectedEntities.includes(entity);

                      return (
                        <button
                          key={entity}
                          onClick={() => handleEntityToggle(entity)}
                          className={`flex items-center space-x-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            isSelected
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className='h-3 w-3' />
                          <span className='capitalize'>{entity.toLowerCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg'
          >
            {/* Search Results */}
            {hasResults && searchResults && (
              <div className='p-2'>
                {/* Search Meta */}
                <div className='border-b border-gray-100 px-3 py-2 text-xs text-gray-500'>
                  Found {searchResults.searchMeta.totalResults} results in{' '}
                  {searchResults.searchMeta.searchTime.toFixed(2)}ms
                </div>

                {/* Results */}
                <div className='mt-2 space-y-1'>
                  {searchResults.results.items.map(item => {
                    const Icon = entityIcons[item.entity];
                    const entityColor = entityColors[item.entity];

                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleResultSelect(item)}
                        whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                        className='flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50'
                      >
                        {/* Entity Icon */}
                        <div
                          className={`h-8 w-8 flex-shrink-0 ${entityColor} flex items-center justify-center rounded-lg`}
                        >
                          <Icon className='h-4 w-4 text-white' />
                        </div>

                        {/* Content */}
                        <div className='min-w-0 flex-1'>
                          <div className='truncate font-medium text-gray-900'>{item.title}</div>
                          {item.subtitle && (
                            <div className='truncate text-sm text-gray-500'>{item.subtitle}</div>
                          )}
                          {item.description && (
                            <div className='mt-1 truncate text-xs text-gray-400'>
                              {item.description}
                            </div>
                          )}
                        </div>

                        {/* Relevance Score */}
                        <div className='flex-shrink-0 text-xs text-gray-400'>
                          {Math.round(item.relevanceScore)}%
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Load More */}
                {searchResults.searchMeta.hasMore && (
                  <div className='mt-2 border-t border-gray-100 px-3 py-2'>
                    <button className='text-sm font-medium text-blue-600 hover:text-blue-700'>
                      Load more results
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
              <div className='border-t border-gray-100 p-2'>
                <div className='px-3 py-2 text-xs font-medium text-gray-700'>Suggestions</div>
                <div className='space-y-1'>
                  {searchResults.suggestions.slice(0, 5).map((suggestion, index) => {
                    const Icon = getSuggestionIcon(suggestion.type);

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(suggestion.text);
                          setDebouncedQuery(suggestion.text);
                        }}
                        className='flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50'
                      >
                        <Icon className='h-4 w-4 text-gray-400' />
                        <span className='flex-1 text-sm text-gray-700'>{suggestion.text}</span>
                        {suggestion.count && (
                          <span className='text-xs text-gray-400'>{suggestion.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!hasResults && recentSearches.length > 0 && query.length < 2 && (
              <div className='p-2'>
                <div className='px-3 py-2 text-xs font-medium text-gray-700'>Recent Searches</div>
                <div className='space-y-1'>
                  {recentSearches.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(recentQuery);
                        setDebouncedQuery(recentQuery);
                      }}
                      className='flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50'
                    >
                      <History className='h-4 w-4 text-gray-400' />
                      <span className='flex-1 text-sm text-gray-700'>{recentQuery}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query.length >= 2 && !loading && !hasResults && !error && (
              <div className='p-6 text-center'>
                <Search className='mx-auto mb-3 h-12 w-12 text-gray-300' />
                <div className='mb-1 text-sm font-medium text-gray-900'>No results found</div>
                <div className='text-xs text-gray-500'>
                  Try adjusting your search terms or filters
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className='p-6 text-center'>
                <div className='mb-1 text-sm font-medium text-red-600'>Search Error</div>
                <div className='text-xs text-gray-500'>{error.message}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SearchCard };
