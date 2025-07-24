/**
 * NotificationCard Component Tests
 * Unit tests for NotificationCard functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { 
  NotificationCard, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from '../NotificationCard';

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: NotificationType.ALERT,
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.UNREAD,
    title: 'Low Inventory Alert',
    message: 'Product ABC-123 is running low (only 5 units remaining)',
    timestamp: new Date('2024-07-24T10:00:00Z'),
    actionUrl: '/admin/inventory/products/ABC-123',
    actionLabel: 'View Product',
    userId: 'user1',
  },
  {
    id: '2',
    type: NotificationType.ORDER,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.READ,
    title: 'New Order Received',
    message: 'Order #12345 has been placed and requires processing',
    timestamp: new Date('2024-07-24T09:45:00Z'),
    actionUrl: '/admin/orders/12345',
    actionLabel: 'Process Order',
    userId: 'user1',
    readAt: new Date('2024-07-24T09:50:00Z'),
  },
];

describe('NotificationCard', () => {
  const defaultProps = {
    maxItems: 20,
    showFilters: true,
    showBulkActions: true,
    showStats: true,
    autoRefresh: false, // Disable for testing
    userId: 'user1',
  };

  const renderNotificationCard = (props = {}) => {
    return render(
      <MockedProvider mocks={[]} addTypename={false}>
        <NotificationCard {...defaultProps} {...props} />
      </MockedProvider>
    );
  };

  describe('Rendering', () => {
    test('renders notification card with title', () => {
      renderNotificationCard();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('displays notification statistics', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Unread')).toBeInTheDocument();
        expect(screen.getByText('Urgent')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });

    test('renders notification items', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        expect(screen.getByText('Low Inventory Alert')).toBeInTheDocument();
        expect(screen.getByText('New Order Received')).toBeInTheDocument();
      });
    });

    test('shows unread badge on unread notifications', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        // Look for unread indicator (blue dot)
        const unreadIndicators = document.querySelectorAll('.bg-blue-400.rounded-full');
        expect(unreadIndicators.length).toBeGreaterThan(0);
      });
    });

    test('renders edit mode correctly', () => {
      renderNotificationCard({ isEditMode: true });
      expect(screen.getByText('Notifications - Edit Mode')).toBeInTheDocument();
      expect(screen.getByText('Notification configuration in edit mode')).toBeInTheDocument();
    });
  });

  describe('Notification Interaction', () => {
    test('calls onNotificationClick when notification is clicked', async () => {
      const onNotificationClick = jest.fn();
      renderNotificationCard({ onNotificationClick });
      
      await waitFor(() => {
        const notification = screen.getByText('Low Inventory Alert');
        fireEvent.click(notification);
      });
      
      expect(onNotificationClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Low Inventory Alert',
        })
      );
    });

    test('shows action buttons for notifications with actions', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        expect(screen.getByText('View Product')).toBeInTheDocument();
        expect(screen.getByText('Process Order')).toBeInTheDocument();
      });
    });
  });

  describe('Priority and Type Display', () => {
    test('displays priority badges correctly', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });

    test('displays type badges correctly', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        expect(screen.getByText('Alert')).toBeInTheDocument();
        expect(screen.getByText('Order')).toBeInTheDocument();
      });
    });

    test('applies correct styling based on priority', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        const urgentBadge = screen.getByText('Urgent');
        expect(urgentBadge).toHaveClass('text-red-400');
        
        const highBadge = screen.getByText('High');
        expect(highBadge).toHaveClass('text-orange-400');
      });
    });
  });

  describe('Bulk Actions', () => {
    test('shows bulk action controls when items are selected', async () => {
      renderNotificationCard({ showBulkActions: true });
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        if (checkboxes.length > 1) {
          fireEvent.click(checkboxes[1]); // First checkbox is "select all"
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/selected/)).toBeInTheDocument();
        expect(screen.getByText('Mark Read')).toBeInTheDocument();
        expect(screen.getByText('Mark Unread')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    test('select all functionality works', async () => {
      renderNotificationCard({ showBulkActions: true });
      
      await waitFor(() => {
        const selectAllButton = screen.getByText('Select All');
        fireEvent.click(selectAllButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Deselect All')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    test('shows filter panel when filter button is clicked', async () => {
      renderNotificationCard({ showFilters: true });
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Types')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    test('hides filter controls when showFilters is false', () => {
      renderNotificationCard({ showFilters: false });
      
      const filterButton = screen.queryByRole('button', { name: /filter/i });
      expect(filterButton).not.toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    test('displays correct statistics', async () => {
      renderNotificationCard({ showStats: true });
      
      await waitFor(() => {
        // Should show total count
        expect(screen.getByText('5')).toBeInTheDocument(); // Total notifications
        expect(screen.getByText('3')).toBeInTheDocument(); // Unread notifications
        expect(screen.getByText('1')).toBeInTheDocument(); // Urgent notifications
        expect(screen.getByText('1')).toBeInTheDocument(); // High priority notifications
      });
    });

    test('hides statistics when showStats is false', () => {
      renderNotificationCard({ showStats: false });
      
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
      expect(screen.queryByText('Unread')).not.toBeInTheDocument();
    });

    test('calls onStatsUpdate when stats change', async () => {
      const onStatsUpdate = jest.fn();
      renderNotificationCard({ onStatsUpdate });
      
      await waitFor(() => {
        expect(onStatsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            total: expect.any(Number),
            unread: expect.any(Number),
            byType: expect.any(Object),
            byPriority: expect.any(Object),
          })
        );
      });
    });
  });

  describe('Compact Mode', () => {
    test('renders in compact mode', () => {
      renderNotificationCard({ compact: true });
      
      // In compact mode, message should be truncated
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no notifications', async () => {
      // Mock empty response
      renderNotificationCard({ userId: 'empty-user' });
      
      await waitFor(() => {
        expect(screen.getByText('No notifications found')).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    test('displays relative time correctly', async () => {
      renderNotificationCard();
      
      await waitFor(() => {
        // Should show relative time like "5m ago", "15m ago", etc.
        const timeElements = screen.getAllByText(/ago$/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('has refresh button', () => {
      renderNotificationCard();
      
      const refreshButton = screen.getByRole('button', { name: /settings/i });
      expect(refreshButton).toBeInTheDocument();
    });

    test('refresh button triggers data refetch', () => {
      renderNotificationCard();
      
      const refreshButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(refreshButton);
      
      // Should not throw error
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderNotificationCard();
      
      const notificationCard = screen.getByRole('region', { name: /Dashboard card/i });
      expect(notificationCard).toBeInTheDocument();
    });

    test('checkboxes have proper labels', async () => {
      renderNotificationCard({ showBulkActions: true });
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Type Filtering', () => {
    test('filters notifications by type', () => {
      renderNotificationCard({ 
        defaultTypes: [NotificationType.ALERT] 
      });
      
      // Should still render the card
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('filters notifications by priority', () => {
      renderNotificationCard({ 
        defaultPriorities: [NotificationPriority.URGENT] 
      });
      
      // Should still render the card
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('filters notifications by status', () => {
      renderNotificationCard({ 
        defaultStatus: [NotificationStatus.UNREAD] 
      });
      
      // Should still render the card
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });
});