/**
 * Notification Card GraphQL Resolver
 * Handles notification queries, mutations and subscriptions
 */

import { Context } from '../context';
import { withFilter } from 'graphql-subscriptions';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationItem,
} from '@/app/(app)/admin/components/dashboard/cards/NotificationCard';

interface NotificationsInput {
  userId: string;
  limit?: number;
  offset?: number;
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  statuses?: NotificationStatus[];
  startDate?: Date;
  endDate?: Date;
}

interface MarkNotificationInput {
  notificationId: string;
}

interface BulkNotificationActionInput {
  notificationIds: string[];
  action: 'READ' | 'UNREAD' | 'DELETE' | 'ARCHIVE';
}

// Mock notification data - 將來會從資料庫獲取
const createMockNotifications = (): NotificationItem[] => [
  {
    id: '1',
    type: NotificationType.ALERT,
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.UNREAD,
    title: 'Low Inventory Alert',
    message: 'Product ABC-123 is running low (only 5 units remaining)',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    actionUrl: '/admin/inventory/products/ABC-123',
    actionLabel: 'View Product',
    userId: 'user1',
  },
  {
    id: '2',
    type: NotificationType.ORDER,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    title: 'New Order Received',
    message: 'Order #12345 has been placed and requires processing',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    actionUrl: '/admin/orders/12345',
    actionLabel: 'Process Order',
    userId: 'user1',
  },
  {
    id: '3',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.READ,
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    readAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Read 1 hour ago
    userId: 'user1',
  },
  {
    id: '4',
    type: NotificationType.USER,
    priority: NotificationPriority.LOW,
    status: NotificationStatus.READ,
    title: 'Profile Updated',
    message: 'Your profile information has been successfully updated',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    userId: 'user1',
  },
  {
    id: '5',
    type: NotificationType.INVENTORY,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    title: 'Stock Transfer Complete',
    message: 'Transfer of 100 units from Warehouse A to B completed',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    actionUrl: '/admin/transfers/T-001',
    actionLabel: 'View Transfer',
    userId: 'user1',
  },
];

// In-memory notification storage - 將來會替換為資料庫
let mockNotifications = createMockNotifications();

// 過濾通知
const filterNotifications = (
  notifications: NotificationItem[],
  filters: NotificationsInput
): NotificationItem[] => {
  let filtered = notifications.filter(n => n.userId === filters.userId);

  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter(n => filters.types!.includes(n.type));
  }

  if (filters.priorities && filters.priorities.length > 0) {
    filtered = filtered.filter(n => filters.priorities!.includes(n.priority));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filtered.filter(n => filters.statuses!.includes(n.status));
  }

  if (filters.startDate) {
    filtered = filtered.filter(n => n.timestamp >= filters.startDate!);
  }

  if (filters.endDate) {
    filtered = filtered.filter(n => n.timestamp <= filters.endDate!);
  }

  // 按時間排序（最新的在前）
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return filtered;
};

// 計算統計
const calculateStats = (notifications: NotificationItem[]) => {
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === NotificationStatus.UNREAD).length,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>,
  };

  // 初始化計數
  Object.values(NotificationType).forEach(type => {
    stats.byType[type] = 0;
  });
  Object.values(NotificationPriority).forEach(priority => {
    stats.byPriority[priority] = 0;
  });

  // 計算分類統計
  notifications.forEach(notification => {
    stats.byType[notification.type]++;
    stats.byPriority[notification.priority]++;
  });

  return stats;
};

export const notificationResolver = {
  Query: {
    notifications: async (
      _: any,
      { input }: { input: NotificationsInput },
      context: Context
    ) => {
      try {
        const {
          userId,
          limit = 20,
          offset = 0,
          types,
          priorities,
          statuses,
          startDate,
          endDate,
        } = input;

        // 過濾通知
        const filtered = filterNotifications(mockNotifications, {
          userId,
          types,
          priorities,
          statuses,
          startDate,
          endDate,
        });

        // 分頁
        const items = filtered.slice(offset, offset + limit);
        const hasMore = filtered.length > offset + limit;

        // 計算統計
        const stats = calculateStats(filtered);

        return {
          items,
          stats,
          hasMore,
        };
      } catch (error) {
        console.error('Notifications query error:', error);
        throw new Error('Failed to fetch notifications');
      }
    },
  },

  Mutation: {
    markNotificationRead: async (
      _: any,
      { input }: { input: MarkNotificationInput },
      context: Context
    ) => {
      try {
        const { notificationId } = input;
        
        // 找到並更新通知
        const notificationIndex = mockNotifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex === -1) {
          return {
            success: false,
            message: 'Notification not found',
          };
        }

        // 標記為已讀
        mockNotifications[notificationIndex] = {
          ...mockNotifications[notificationIndex],
          status: NotificationStatus.READ,
          readAt: new Date(),
        };

        // 發布更新事件（用於實時訂閱）
        if (context.pubsub) {
          context.pubsub.publish('NOTIFICATION_UPDATED', {
            notificationUpdates: {
              type: 'READ',
              notification: mockNotifications[notificationIndex],
            },
          });
        }

        return {
          success: true,
          message: 'Notification marked as read',
        };
      } catch (error) {
        console.error('MarkNotificationRead mutation error:', error);
        return {
          success: false,
          message: 'Failed to mark notification as read',
        };
      }
    },

    bulkNotificationAction: async (
      _: any,
      { input }: { input: BulkNotificationActionInput },
      context: Context
    ) => {
      try {
        const { notificationIds, action } = input;
        let affectedCount = 0;

        notificationIds.forEach(id => {
          const notificationIndex = mockNotifications.findIndex(n => n.id === id);
          
          if (notificationIndex !== -1) {
            switch (action) {
              case 'READ':
                mockNotifications[notificationIndex] = {
                  ...mockNotifications[notificationIndex],
                  status: NotificationStatus.READ,
                  readAt: new Date(),
                };
                break;
              case 'UNREAD':
                mockNotifications[notificationIndex] = {
                  ...mockNotifications[notificationIndex],
                  status: NotificationStatus.UNREAD,
                  readAt: undefined,
                };
                break;
              case 'DELETE':
                mockNotifications.splice(notificationIndex, 1);
                break;
              case 'ARCHIVE':
                mockNotifications[notificationIndex] = {
                  ...mockNotifications[notificationIndex],
                  status: NotificationStatus.ARCHIVED,
                };
                break;
            }
            affectedCount++;
          }
        });

        // 發布批量更新事件
        if (context.pubsub && affectedCount > 0) {
          context.pubsub.publish('NOTIFICATION_BULK_UPDATED', {
            notificationBulkUpdated: {
              action,
              affectedIds: notificationIds,
              affectedCount,
            },
          });
        }

        return {
          success: true,
          affectedCount,
          message: `${affectedCount} notifications ${action.toLowerCase()}ed successfully`,
        };
      } catch (error) {
        console.error('BulkNotificationAction mutation error:', error);
        return {
          success: false,
          affectedCount: 0,
          message: 'Failed to perform bulk action',
        };
      }
    },
  },

  Subscription: {
    notificationUpdates: {
      subscribe: withFilter(
        (_, __, context: Context) => {
          if (!context.pubsub) {
            throw new Error('PubSub not available');
          }
          return context.pubsub.asyncIterator(['NOTIFICATION_UPDATED']);
        },
        (payload, variables) => {
          // 只向對應用戶發送更新
          return payload.notificationUpdates.notification.userId === variables.userId;
        }
      ),
    },
  },
};