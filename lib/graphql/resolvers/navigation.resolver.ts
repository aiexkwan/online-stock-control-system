/**
 * Navigation Card GraphQL Resolver
 * Handles navigation menu queries and bookmark management
 */

import { Context } from '../context';
import { NavigationType } from '@/app/(app)/admin/components/dashboard/cards/NavigationCard';

interface NavigationMenuInput {
  navigationType: NavigationType;
  permissions?: string[];
  currentPath?: string;
}

interface BookmarkInput {
  itemId: string;
  action: 'ADD' | 'REMOVE';
}

// Navigation item 類型定義
interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  badge?: number;
  permissions?: string[];
  description?: string;
  children?: NavigationItem[];
  isActive?: boolean;
  isBookmarked?: boolean;
}

// Mock navigation data - 將來會從資料庫獲取
const mockNavigationData = {
  [NavigationType.SIDEBAR]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'HomeIcon',
      path: '/admin',
      permissions: [],
      description: 'Main dashboard overview',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ChartBarIcon',
      path: '/admin/analytics',
      badge: 5,
      permissions: [],
      children: [
        {
          id: 'reports',
          label: 'Reports',
          icon: 'DocumentTextIcon',
          path: '/admin/analytics/reports',
          permissions: [],
          description: 'View and generate reports',
        },
        {
          id: 'charts',
          label: 'Charts',
          icon: 'ChartBarIcon',
          path: '/admin/analytics/charts',
          permissions: [],
          description: 'Interactive data visualizations',
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'FolderIcon',
      path: '/admin/inventory',
      permissions: [],
      children: [
        {
          id: 'products',
          label: 'Products',
          path: '/admin/inventory/products',
          permissions: [],
        },
        {
          id: 'stock',
          label: 'Stock Management',
          path: '/admin/inventory/stock',
          badge: 12,
          permissions: [],
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'CogIcon',
      path: '/admin/settings',
      permissions: ['admin'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: 'UserIcon',
      path: '/admin/users',
      permissions: ['admin', 'user_manager'],
      badge: 3,
    },
  ],
  [NavigationType.BREADCRUMB]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'HomeIcon',
      path: '/admin',
      permissions: [],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ChartBarIcon',
      path: '/admin/analytics',
      permissions: [],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'FolderIcon',
      path: '/admin/inventory',
      permissions: [],
    },
  ],
  [NavigationType.MENU]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'HomeIcon',
      path: '/admin',
      permissions: [],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ChartBarIcon',
      path: '/admin/analytics',
      permissions: [],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'FolderIcon',
      path: '/admin/inventory',
      permissions: [],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'CogIcon',
      path: '/admin/settings',
      permissions: ['admin'],
    },
  ],
  [NavigationType.QUICK_ACCESS]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'HomeIcon',
      path: '/admin',
      permissions: [],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'DocumentTextIcon',
      path: '/admin/analytics/reports',
      permissions: [],
    },
    {
      id: 'products',
      label: 'Products',
      path: '/admin/inventory/products',
      permissions: [],
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/admin/orders',
      permissions: [],
    },
  ],
};

// Mock bookmarks storage - 將來會存儲在資料庫
const userBookmarks: Record<string, Set<string>> = {};

// 過濾有權限的導航項目
const filterByPermissions = (
  items: NavigationItem[],
  userPermissions: string[]
): NavigationItem[] => {
  return items
    .filter(item => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return item.permissions.some((permission: string) => userPermissions.includes(permission));
    })
    .map(item => ({
      ...item,
      children: item.children ? filterByPermissions(item.children, userPermissions) : undefined,
    }));
};

export const navigationResolver = {
  Query: {
    navigationMenu: async (
      _: unknown,
      { input }: { input: NavigationMenuInput },
      context: Context
    ) => {
      try {
        const { navigationType, permissions = [], currentPath } = input;

        // 獲取用戶權限 - 這裡使用傳入的權限或從 context 獲取
        const userPermissions =
          permissions.length > 0 ? permissions : context.user?.permissions || ['user'];

        // 獲取對應類型的導航數據
        const rawItems = mockNavigationData[navigationType] || [];

        // 過濾權限
        const filteredItems = filterByPermissions(rawItems, userPermissions);

        return {
          id: `nav-${navigationType.toLowerCase()}`,
          items: filteredItems,
          permissions: userPermissions,
          metadata: {
            currentPath,
            lastUpdated: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('NavigationMenu query error:', error);
        throw new Error('Failed to fetch navigation menu');
      }
    },
  },

  Mutation: {
    updateNavigationBookmark: async (
      _: unknown,
      { input }: { input: BookmarkInput },
      context: Context
    ) => {
      try {
        const { itemId, action } = input;
        const userId = context.user?.id || 'anonymous';

        // 初始化用戶書籤
        if (!userBookmarks[userId]) {
          userBookmarks[userId] = new Set();
        }

        // 執行書籤操作
        if (action === 'ADD') {
          userBookmarks[userId].add(itemId);
        } else if (action === 'REMOVE') {
          userBookmarks[userId].delete(itemId);
        }

        return {
          success: true,
          message: `Bookmark ${action.toLowerCase()}ed successfully`,
          bookmarks: Array.from(userBookmarks[userId]),
        };
      } catch (error) {
        console.error('UpdateNavigationBookmark mutation error:', error);
        return {
          success: false,
          message: 'Failed to update bookmark',
          bookmarks: [],
        };
      }
    },
  },
};
