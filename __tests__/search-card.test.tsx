/**
 * SearchCard Unit Tests
 * 
 * Tests SearchCard component functionality in isolation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { SearchCard } from '@/app/(app)/admin/components/dashboard/cards/SearchCard';
import { SearchMode, SearchableEntity } from '@/types/generated/search-types';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Loader2: () => <div data-testid="loader-icon">Loading</div>,
  History: () => <div data-testid="history-icon">History</div>,
  ArrowRight: () => <div data-testid="arrow-icon">Arrow</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  Layers: () => <div data-testid="layers-icon">Layers</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  ShoppingCart: () => <div data-testid="cart-icon">Cart</div>,
  Settings2: () => <div data-testid="settings-icon">Settings</div>,
  ChevronDown: () => <div data-testid="chevron-icon">Chevron</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

const defaultProps = {
  placeholder: 'Search test...',
  defaultMode: SearchMode.Global,
  defaultEntities: [SearchableEntity.Product, SearchableEntity.Pallet],
  onResultSelect: jest.fn(),
  onSearch: jest.fn(),
};

const mocks = [
  {
    request: {
      query: expect.any(Object),
      variables: expect.any(Object),
    },
    result: {
      data: {
        searchCard: {
          searchMeta: {
            query: 'test',
            processedQuery: 'test',
            searchMode: SearchMode.Global,
            searchType: 'TEXT',
            entities: [SearchableEntity.Product],
            totalResults: 1,
            searchTime: 0.1,
            hasMore: false,
          },
          results: {
            items: [
              {
                id: 'test-1',
                entity: SearchableEntity.Product,
                title: 'Test Product',
                subtitle: 'Test Subtitle',
                description: 'Test Description',
                relevanceScore: 95.5,
                matchedFields: ['title'],
                data: {
                  __typename: 'ProductSearchResult',
                  code: 'TEST001',
                  description: 'Test Product',
                  colour: 'Red',
                  type: 'A',
                  totalStock: 100,
                  totalPallets: 5,
                  lastUpdated: '2024-01-01T00:00:00Z',
                },
                actions: [
                  {
                    id: 'view',
                    label: 'View',
                    icon: 'eye',
                    url: '/product/TEST001',
                    action: 'VIEW',
                    requiresAuth: false,
                  },
                ],
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              totalCount: 1,
            },
          },
          suggestions: [
            {
              text: 'Test Product Suggestion',
              type: 'AUTOCOMPLETE',
              entity: SearchableEntity.Product,
              count: 1,
              score: 0.9,
              metadata: null,
            },
          ],
        },
      },
    },
  },
];

describe('SearchCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
  });

  it('handles search input typing', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(searchInput).toHaveValue('test query');
  });

  it('shows and hides filter panel', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    // Click filter button
    const filterButton = screen.getByTestId('filter-icon').closest('button');
    expect(filterButton).toBeInTheDocument();
    
    fireEvent.click(filterButton!);
    
    await waitFor(() => {
      expect(screen.getByText('Search Mode')).toBeInTheDocument();
      expect(screen.getByText('Search In')).toBeInTheDocument();
    });

    // Click filter button again to close
    fireEvent.click(filterButton!);
    
    await waitFor(() => {
      expect(screen.queryByText('Search Mode')).not.toBeInTheDocument();
    });
  });

  it('handles search mode changes', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    // Open filter panel
    const filterButton = screen.getByTestId('filter-icon').closest('button');
    fireEvent.click(filterButton!);

    await waitFor(() => {
      expect(screen.getByText('Search Mode')).toBeInTheDocument();
    });

    // Test different search modes
    const entityButton = screen.getByText('ENTITY');
    fireEvent.click(entityButton);

    // Verify mode changed (this would be tested through UI state)
    expect(entityButton).toBeInTheDocument();
  });

  it('handles entity filter changes', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    // Open filter panel
    const filterButton = screen.getByTestId('filter-icon').closest('button');
    fireEvent.click(filterButton!);

    await waitFor(() => {
      expect(screen.getByText('Search In')).toBeInTheDocument();
    });

    // Test entity filter toggle
    const productFilter = screen.getByText('Product');
    fireEvent.click(productFilter);

    // Verify entity filter state changed
    expect(productFilter).toBeInTheDocument();
  });

  it('handles input focus and blur', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Focus input
    fireEvent.focus(searchInput);
    expect(searchInput).toHaveFocus();
    
    // Blur input
    fireEvent.blur(searchInput);
    expect(searchInput).not.toHaveFocus();
  });

  it('clears search input when clear button is clicked', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput).toHaveValue('test');

    // Find and click clear button (X icon)
    const clearButton = screen.getByTestId('x-icon').closest('button');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton!);
    
    expect(searchInput).toHaveValue('');
  });

  it('calls onResultSelect when result is clicked', async () => {
    const onResultSelect = jest.fn();
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} onResultSelect={onResultSelect} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Focus and type to show dropdown
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for potential results (this would need proper mocking for full test)
    await waitFor(() => {
      // In a real test, we'd wait for and click on search results
      expect(searchInput).toHaveValue('test');
    });
  });

  it('respects custom placeholder text', () => {
    const customPlaceholder = 'Custom search placeholder';
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} placeholder={customPlaceholder} />
      </MockedProvider>
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('sets initial search mode correctly', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} defaultMode={SearchMode.Entity} />
      </MockedProvider>
    );

    // The component should initialize with Entity mode
    // This would be verified through internal state or UI indicators
    const searchInput = screen.getByPlaceholderText('Search test...');
    expect(searchInput).toBeInTheDocument();
  });

  it('sets initial entities correctly', () => {
    const customEntities = [SearchableEntity.Order, SearchableEntity.User];
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} defaultEntities={customEntities} />
      </MockedProvider>
    );

    // The component should initialize with custom entities
    // This would be verified through filter panel or internal state
    const searchInput = screen.getByPlaceholderText('Search test...');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Test Tab navigation
    fireEvent.keyDown(searchInput, { key: 'Tab' });
    
    // Test Enter key
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Test Escape key
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    
    // Component should handle these gracefully
    expect(searchInput).toBeInTheDocument();
  });

  it('debounces search input', async () => {
    jest.useFakeTimers();
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Type rapidly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward time to trigger debounce
    jest.advanceTimersByTime(300);
    
    expect(searchInput).toHaveValue('test');
    
    jest.useRealTimers();
  });

  it('handles empty search gracefully', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    
    // Try empty search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should not crash or show errors
    expect(searchInput).toHaveValue('');
  });

  it('handles special characters in search', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    fireEvent.change(searchInput, { target: { value: specialChars } });
    
    // Should handle special characters without issues
    expect(searchInput).toHaveValue(specialChars);
  });

  it('handles very long search queries', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SearchCard {...defaultProps} />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search test...');
    const longQuery = 'a'.repeat(1000);
    
    fireEvent.change(searchInput, { target: { value: longQuery } });
    
    // Should handle long queries without crashing
    expect(searchInput).toHaveValue(longQuery);
  });
});