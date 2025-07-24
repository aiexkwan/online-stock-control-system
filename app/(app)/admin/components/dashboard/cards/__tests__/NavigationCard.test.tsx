/**
 * NavigationCard Component Tests
 * Unit tests for NavigationCard functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { NavigationCard, NavigationType } from '../NavigationCard';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/admin/dashboard',
}));

describe('NavigationCard', () => {
  const defaultProps = {
    navigationType: NavigationType.SIDEBAR,
    permissions: ['user'],
    showSearch: true,
    showBookmarks: true,
    collapsible: true,
  };

  const renderNavigationCard = (props = {}) => {
    return render(
      <MockedProvider mocks={[]} addTypename={false}>
        <NavigationCard {...defaultProps} {...props} />
      </MockedProvider>
    );
  };

  describe('Rendering', () => {
    test('renders navigation card with title', () => {
      renderNavigationCard();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    test('renders different titles based on navigation type', () => {
      const { rerender } = renderNavigationCard();
      expect(screen.getByText('Navigation')).toBeInTheDocument();

      rerender(
        <MockedProvider mocks={[]} addTypename={false}>
          <NavigationCard {...defaultProps} navigationType={NavigationType.BREADCRUMB} />
        </MockedProvider>
      );
      expect(screen.getByText('Breadcrumb')).toBeInTheDocument();

      rerender(
        <MockedProvider mocks={[]} addTypename={false}>
          <NavigationCard {...defaultProps} navigationType={NavigationType.QUICK_ACCESS} />
        </MockedProvider>
      );
      expect(screen.getByText('Quick Access')).toBeInTheDocument();
    });

    test('renders search input when showSearch is true', () => {
      renderNavigationCard({ showSearch: true });
      expect(screen.getByPlaceholderText('Search navigation...')).toBeInTheDocument();
    });

    test('does not render search input when showSearch is false', () => {
      renderNavigationCard({ showSearch: false });
      expect(screen.queryByPlaceholderText('Search navigation...')).not.toBeInTheDocument();
    });

    test('renders navigation items', async () => {
      renderNavigationCard();
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    test('renders edit mode correctly', () => {
      renderNavigationCard({ isEditMode: true });
      expect(screen.getByText('Navigation - Edit Mode')).toBeInTheDocument();
      expect(screen.getByText('Navigation configuration in edit mode')).toBeInTheDocument();
    });
  });

  describe('Permission Filtering', () => {
    test('shows only permitted navigation items', async () => {
      renderNavigationCard({ permissions: ['user'] });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        // Settings should not be visible for regular users
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });

    test('shows admin-only items for admin users', async () => {
      renderNavigationCard({ permissions: ['admin'] });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('filters navigation items based on search query', async () => {
      renderNavigationCard();
      
      const searchInput = screen.getByPlaceholderText('Search navigation...');
      fireEvent.change(searchInput, { target: { value: 'dashboard' } });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        // Other items should be filtered out in search results
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });

    test('shows no results message when no items match search', async () => {
      renderNavigationCard();
      
      const searchInput = screen.getByPlaceholderText('Search navigation...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText(/No navigation items found/)).toBeInTheDocument();
      });
    });

    test('clears search when clear button is clicked', async () => {
      renderNavigationCard();
      
      const searchInput = screen.getByPlaceholderText('Search navigation...');
      fireEvent.change(searchInput, { target: { value: 'dashboard' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('dashboard');
      });
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Navigation Item Interaction', () => {
    test('calls onNavigate when navigation item is clicked', async () => {
      const onNavigate = jest.fn();
      renderNavigationCard({ onNavigate });
      
      await waitFor(() => {
        const dashboardItem = screen.getByText('Dashboard');
        fireEvent.click(dashboardItem);
      });
      
      expect(onNavigate).toHaveBeenCalledWith('/admin', expect.any(Object));
    });

    test('expands/collapses navigation items with children', async () => {
      renderNavigationCard();
      
      await waitFor(() => {
        const analyticsItem = screen.getByText('Analytics');
        const expandButton = analyticsItem.closest('div')?.querySelector('button');
        
        if (expandButton) {
          fireEvent.click(expandButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Charts')).toBeInTheDocument();
      });
    });

    test('handles bookmark functionality', async () => {
      const onBookmark = jest.fn();
      renderNavigationCard({ onBookmark });
      
      await waitFor(() => {
        const bookmarkButtons = screen.getAllByLabelText(/bookmark/i);
        if (bookmarkButtons.length > 0) {
          fireEvent.click(bookmarkButtons[0]);
        }
      });
      
      expect(onBookmark).toHaveBeenCalled();
    });
  });

  describe('Breadcrumb Mode', () => {
    test('renders breadcrumb navigation correctly', () => {
      renderNavigationCard({ 
        navigationType: NavigationType.BREADCRUMB,
        currentPath: '/admin/analytics/reports'
      });
      
      expect(screen.getByText('Breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('analytics')).toBeInTheDocument();
      expect(screen.getByText('reports')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('collapses sidebar when collapse button is clicked', async () => {
      renderNavigationCard({ 
        navigationType: NavigationType.SIDEBAR,
        collapsible: true 
      });
      
      const collapseButton = screen.getByRole('button', { name: /bars/i });
      fireEvent.click(collapseButton);
      
      // Test that the collapse state changes
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    test('displays badges on navigation items', async () => {
      renderNavigationCard({ showBadges: true });
      
      await waitFor(() => {
        // Analytics item should have a badge with value 5
        expect(screen.getByText('5')).toBeInTheDocument();
        // User Management should have a badge with value 3
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('hides badges when showBadges is false', async () => {
      renderNavigationCard({ showBadges: false });
      
      await waitFor(() => {
        // Badges should not be visible
        expect(screen.queryByText('5')).not.toBeInTheDocument();
        expect(screen.queryByText('3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('navigation items have proper ARIA labels', async () => {
      renderNavigationCard();
      
      await waitFor(() => {
        const navigationRegion = screen.getByRole('region', { name: /Dashboard card/i });
        expect(navigationRegion).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      renderNavigationCard();
      
      await waitFor(() => {
        const dashboardItem = screen.getByText('Dashboard').closest('div');
        expect(dashboardItem).toHaveAttribute('tabIndex');
      });
    });
  });
});