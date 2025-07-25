/**
 * NotificationCard Component
 * 統一的通知卡片組件，支援實時通知和多種通知類型
 *
 * 支援的通知類型：
 * - SYSTEM: 系統通知
 * - ORDER: 訂單相關通知
 * - INVENTORY: 庫存相關通知
 * - USER: 用戶活動通知
 * - ALERT: 緊急警報通知
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  Cog6ToothIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 通知類型定義
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ORDER = 'ORDER',
  INVENTORY = 'INVENTORY',
  USER = 'USER',
  ALERT = 'ALERT',
}

// 通知優先級
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// 通知狀態
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

// 通知項目介面
export interface NotificationItem {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, string | number | boolean | Date | null>;
  expiresAt?: Date;
  readAt?: Date;
  userId?: string;
}

// 通知統計
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// GraphQL 查詢和訂閱
const NOTIFICATIONS_QUERY = gql`
  query NotificationsQuery($input: NotificationsInput!) {
    notifications(input: $input) {
      items {
        id
        type
        priority
        status
        title
        message
        timestamp
        actionUrl
        actionLabel
        data
        expiresAt
        readAt
        userId
      }
      stats {
        total
        unread
        byType
        byPriority
      }
      hasMore
    }
  }
`;

const NOTIFICATION_SUBSCRIPTION = gql`
  subscription NotificationUpdates($userId: String!) {
    notificationUpdates(userId: $userId) {
      type
      notification {
        id
        type
        priority
        status
        title
        message
        timestamp
        actionUrl
        actionLabel
        data
        expiresAt
        readAt
        userId
      }
    }
  }
`;

const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($input: MarkNotificationInput!) {
    markNotificationRead(input: $input) {
      success
      message
    }
  }
`;

const BULK_NOTIFICATION_ACTION_MUTATION = gql`
  mutation BulkNotificationAction($input: BulkNotificationActionInput!) {
    bulkNotificationAction(input: $input) {
      success
      affectedCount
      message
    }
  }
`;

// NotificationCard 組件 Props
export interface NotificationCardProps {
  // 顯示選項
  maxItems?: number;
  showFilters?: boolean;
  showBulkActions?: boolean;
  showStats?: boolean;
  autoRefresh?: boolean;

  // 過濾選項
  defaultTypes?: NotificationType[];
  defaultPriorities?: NotificationPriority[];
  defaultStatus?: NotificationStatus[];

  // 樣式選項
  className?: string;
  height?: number | string;
  compact?: boolean;

  // 編輯模式
  isEditMode?: boolean;

  // 回調函數
  onNotificationClick?: (notification: NotificationItem) => void;
  onNotificationAction?: (notification: NotificationItem, action: string) => void;
  onStatsUpdate?: (stats: NotificationStats) => void;

  // 用戶ID（用於實時訂閱）
  userId?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  maxItems = 20,
  showFilters = true,
  showBulkActions = true,
  showStats = true,
  autoRefresh = true,
  defaultTypes = Object.values(NotificationType),
  defaultPriorities = Object.values(NotificationPriority),
  defaultStatus = [NotificationStatus.UNREAD, NotificationStatus.READ],
  className,
  height = 'auto',
  compact = false,
  isEditMode = false,
  onNotificationClick,
  onNotificationAction,
  onStatsUpdate,
  userId = 'current-user',
}) => {
  // 狀態管理
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<NotificationType[]>(defaultTypes);
  const [filterPriorities, setFilterPriorities] =
    useState<NotificationPriority[]>(defaultPriorities);
  const [filterStatus, setFilterStatus] = useState<NotificationStatus[]>(defaultStatus);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // 準備查詢輸入
  const queryInput = useMemo(
    () => ({
      userId,
      limit: maxItems,
      types: filterTypes,
      priorities: filterPriorities,
      statuses: filterStatus,
    }),
    [userId, maxItems, filterTypes, filterPriorities, filterStatus]
  );

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { input: queryInput },
    fetchPolicy: 'cache-and-network',
    skip: isEditMode,
    pollInterval: autoRefresh ? 30000 : 0, // 30秒自動刷新
    errorPolicy: 'ignore',
  });

  // 實時通知訂閱
  const { data: subscriptionData } = useSubscription(NOTIFICATION_SUBSCRIPTION, {
    variables: { userId },
    skip: isEditMode || !userId,
  });

  // 通知操作 mutations
  const [markRead] = useMutation(MARK_NOTIFICATION_READ_MUTATION);
  const [bulkAction] = useMutation(BULK_NOTIFICATION_ACTION_MUTATION);

  // 模擬通知數據
  const mockNotificationData = useMemo(() => {
    const mockItems: NotificationItem[] = [
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
      },
    ];

    const stats: NotificationStats = {
      total: mockItems.length,
      unread: mockItems.filter(item => item.status === NotificationStatus.UNREAD).length,
      byType: {
        [NotificationType.SYSTEM]: 1,
        [NotificationType.ORDER]: 1,
        [NotificationType.INVENTORY]: 1,
        [NotificationType.USER]: 1,
        [NotificationType.ALERT]: 1,
      },
      byPriority: {
        [NotificationPriority.LOW]: 1,
        [NotificationPriority.MEDIUM]: 2,
        [NotificationPriority.HIGH]: 1,
        [NotificationPriority.URGENT]: 1,
      },
    };

    return {
      items: mockItems,
      stats,
      hasMore: false,
    };
  }, []);

  // 獲取通知數據
  const notificationData = data?.notifications || mockNotificationData;

  // 處理實時通知更新
  useEffect(() => {
    if (subscriptionData?.notificationUpdates) {
      // 觸發重新查詢以獲取最新數據
      refetch();
    }
  }, [subscriptionData, refetch]);

  // 統計更新回調
  useEffect(() => {
    if (notificationData.stats) {
      onStatsUpdate?.(notificationData.stats);
    }
  }, [notificationData.stats, onStatsUpdate]);

  // 獸取通知類型配置
  const getNotificationConfig = useCallback((type: NotificationType) => {
    switch (type) {
      case NotificationType.ALERT:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          label: 'Alert',
        };
      case NotificationType.ORDER:
        return {
          icon: CheckCircleIcon,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          label: 'Order',
        };
      case NotificationType.INVENTORY:
        return {
          icon: InformationCircleIcon,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          label: 'Inventory',
        };
      case NotificationType.USER:
        return {
          icon: InformationCircleIcon,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          label: 'User',
        };
      case NotificationType.SYSTEM:
      default:
        return {
          icon: InformationCircleIcon,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          label: 'System',
        };
    }
  }, []);

  // 獲取優先級配置
  const getPriorityConfig = useCallback((priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return { color: 'text-red-400', label: 'Urgent' };
      case NotificationPriority.HIGH:
        return { color: 'text-orange-400', label: 'High' };
      case NotificationPriority.MEDIUM:
        return { color: 'text-yellow-400', label: 'Medium' };
      case NotificationPriority.LOW:
      default:
        return { color: 'text-green-400', label: 'Low' };
    }
  }, []);

  // 格式化時間
  const formatTime = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

  // 處理通知點擊
  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      // 標記為已讀
      if (notification.status === NotificationStatus.UNREAD) {
        try {
          await markRead({
            variables: {
              input: {
                notificationId: notification.id,
              },
            },
          });
          refetch();
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      }

      onNotificationClick?.(notification);

      // 如果有 actionUrl，導航到該頁面
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    },
    [markRead, refetch, onNotificationClick]
  );

  // 處理批量操作
  const handleBulkAction = useCallback(
    async (action: 'READ' | 'UNREAD' | 'DELETE') => {
      if (selectedItems.size === 0) return;

      try {
        await bulkAction({
          variables: {
            input: {
              notificationIds: Array.from(selectedItems),
              action,
            },
          },
        });

        setSelectedItems(new Set());
        refetch();
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    },
    [bulkAction, selectedItems, refetch]
  );

  // 處理全選/取消全選
  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === notificationData.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(notificationData.items.map((item: NotificationItem) => item.id)));
    }
  }, [selectedItems.size, notificationData.items]);

  // 渲染通知項目
  const renderNotificationItem = useCallback(
    (notification: NotificationItem) => {
      const config = getNotificationConfig(notification.type);
      const priorityConfig = getPriorityConfig(notification.priority);
      const isSelected = selectedItems.has(notification.id);
      const isUnread = notification.status === NotificationStatus.UNREAD;

      return (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'flex items-start space-x-3 rounded-lg border border-transparent p-3 transition-all duration-200',
            'hover:border-gray-600/30 hover:bg-gray-700/50',
            isUnread && 'border-blue-500/20 bg-blue-500/5',
            isSelected && 'border-blue-500/30 bg-blue-500/10'
          )}
        >
          {/* 選擇框 */}
          {showBulkActions && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={checked => {
                const newSelected = new Set(selectedItems);
                if (checked) {
                  newSelected.add(notification.id);
                } else {
                  newSelected.delete(notification.id);
                }
                setSelectedItems(newSelected);
              }}
              className='mt-1'
            />
          )}

          {/* 通知圖標 */}
          <div className={cn('flex-shrink-0 rounded-lg p-2', config.bgColor)}>
            <config.icon className={cn('h-4 w-4', config.color)} />
          </div>

          {/* 通知內容 */}
          <div
            className='min-w-0 flex-1 cursor-pointer'
            onClick={() => handleNotificationClick(notification)}
          >
            <div className='mb-1 flex items-center justify-between'>
              <h4
                className={cn(
                  'truncate text-sm font-medium',
                  isUnread ? 'text-white' : 'text-gray-300'
                )}
              >
                {notification.title}
              </h4>
              <div className='ml-2 flex flex-shrink-0 items-center space-x-2'>
                {/* 優先級徽章 */}
                <Badge variant='outline' className={cn('text-xs', priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
                {/* 類型徽章 */}
                <Badge variant='secondary' className='text-xs'>
                  {config.label}
                </Badge>
              </div>
            </div>

            <p
              className={cn(
                'mb-2 text-sm text-gray-400',
                compact ? 'line-clamp-1' : 'line-clamp-2'
              )}
            >
              {notification.message}
            </p>

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3 text-xs text-gray-500'>
                <span className='flex items-center'>
                  <ClockIcon className='mr-1 h-3 w-3' />
                  {formatTime(notification.timestamp)}
                </span>

                {notification.readAt && (
                  <span className='flex items-center'>
                    <EyeIcon className='mr-1 h-3 w-3' />
                    Read
                  </span>
                )}
              </div>

              {notification.actionLabel && (
                <Button size='sm' variant='outline' className='text-xs'>
                  {notification.actionLabel}
                </Button>
              )}
            </div>
          </div>

          {/* 未讀指示器 */}
          {isUnread && <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400'></div>}
        </motion.div>
      );
    },
    [
      getNotificationConfig,
      getPriorityConfig,
      selectedItems,
      showBulkActions,
      formatTime,
      handleNotificationClick,
      compact,
    ]
  );

  // Edit mode 渲染
  if (isEditMode) {
    return (
      <div className={cn('w-full', className)}>
        <Card className='border-blue-400 bg-gray-800 text-white'>
          <CardHeader>
            <CardTitle className='flex items-center text-blue-400'>
              <BellIcon className='mr-2 h-5 w-5' />
              Notifications - Edit Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='py-8 text-center text-gray-400'>
              Notification configuration in edit mode
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Card className='flex h-full flex-col border-blue-400 bg-gray-800 text-white'>
        <CardHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center text-blue-400'>
              <div className='mr-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2'>
                <BellIcon className='h-5 w-5 text-white' />
              </div>
              <div>
                <div className='flex items-center space-x-2'>
                  <span>Notifications</span>
                  {notificationData.stats.unread > 0 && (
                    <Badge className='bg-red-500 text-xs text-white'>
                      {notificationData.stats.unread}
                    </Badge>
                  )}
                </div>
                <div className='mt-1 text-sm font-normal text-gray-400'>
                  {notificationData.stats.total} total, {notificationData.stats.unread} unread
                </div>
              </div>
            </CardTitle>

            <div className='flex items-center space-x-2'>
              {showFilters && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className='text-gray-400 hover:text-white'
                >
                  <FunnelIcon className='h-4 w-4' />
                </Button>
              )}

              <Button
                size='sm'
                variant='ghost'
                onClick={() => refetch()}
                className='text-gray-400 hover:text-white'
              >
                <Cog6ToothIcon className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* 統計面板 */}
          {showStats && (
            <div className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
              <div className='rounded-lg bg-gray-700/30 p-2 text-center'>
                <div className='text-lg font-bold text-white'>{notificationData.stats.total}</div>
                <div className='text-xs text-gray-400'>Total</div>
              </div>
              <div className='rounded-lg bg-blue-500/10 p-2 text-center'>
                <div className='text-lg font-bold text-blue-400'>
                  {notificationData.stats.unread}
                </div>
                <div className='text-xs text-gray-400'>Unread</div>
              </div>
              <div className='rounded-lg bg-red-500/10 p-2 text-center'>
                <div className='text-lg font-bold text-red-400'>
                  {notificationData.stats.byPriority[NotificationPriority.URGENT] || 0}
                </div>
                <div className='text-xs text-gray-400'>Urgent</div>
              </div>
              <div className='rounded-lg bg-orange-500/10 p-2 text-center'>
                <div className='text-lg font-bold text-orange-400'>
                  {notificationData.stats.byPriority[NotificationPriority.HIGH] || 0}
                </div>
                <div className='text-xs text-gray-400'>High</div>
              </div>
            </div>
          )}

          {/* 過濾器面板 */}
          <AnimatePresence>
            {showFiltersPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-4 space-y-4 rounded-lg bg-gray-700/30 p-4'
              >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div>
                    <label className='mb-2 block text-xs text-gray-400'>Types</label>
                    <Select>
                      <SelectTrigger className='border-gray-600 bg-gray-700'>
                        <SelectValue placeholder='All types' />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(NotificationType).map(type => (
                          <SelectItem key={type} value={type}>
                            {getNotificationConfig(type).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='mb-2 block text-xs text-gray-400'>Priority</label>
                    <Select>
                      <SelectTrigger className='border-gray-600 bg-gray-700'>
                        <SelectValue placeholder='All priorities' />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(NotificationPriority).map(priority => (
                          <SelectItem key={priority} value={priority}>
                            {getPriorityConfig(priority).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='mb-2 block text-xs text-gray-400'>Status</label>
                    <Select>
                      <SelectTrigger className='border-gray-600 bg-gray-700'>
                        <SelectValue placeholder='All status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='UNREAD'>Unread</SelectItem>
                        <SelectItem value='READ'>Read</SelectItem>
                        <SelectItem value='ARCHIVED'>Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 批量操作 */}
          {showBulkActions && selectedItems.size > 0 && (
            <div className='mt-4 flex items-center justify-between rounded-lg bg-blue-500/10 p-3'>
              <span className='text-sm text-blue-400'>{selectedItems.size} selected</span>
              <div className='flex space-x-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleBulkAction('READ')}
                  className='text-xs'
                >
                  <EyeIcon className='mr-1 h-3 w-3' />
                  Mark Read
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleBulkAction('UNREAD')}
                  className='text-xs'
                >
                  <EyeSlashIcon className='mr-1 h-3 w-3' />
                  Mark Unread
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => handleBulkAction('DELETE')}
                  className='text-xs'
                >
                  <TrashIcon className='mr-1 h-3 w-3' />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* 全選/取消全選 */}
          {showBulkActions && notificationData.items.length > 0 && (
            <div className='mt-2 flex items-center'>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleSelectAll}
                className='text-xs text-gray-400 hover:text-white'
              >
                {selectedItems.size === notificationData.items.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className='flex-1 overflow-auto'>
          <AnimatePresence mode='wait'>
            {loading ? (
              <motion.div
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex items-center justify-center py-8'
              >
                <span className='text-gray-300'>Loading notifications...</span>
              </motion.div>
            ) : notificationData.items.length === 0 ? (
              <motion.div
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='py-8 text-center text-gray-400'
              >
                <BellIcon className='mx-auto mb-4 h-12 w-12 text-gray-600' />
                <p>No notifications found</p>
              </motion.div>
            ) : (
              <motion.div
                key='notifications'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='space-y-3'
              >
                {notificationData.items.map((notification: NotificationItem) =>
                  renderNotificationItem(notification)
                )}

                {notificationData.hasMore && (
                  <div className='pt-4 text-center'>
                    <Button variant='outline' size='sm'>
                      Load More
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};
