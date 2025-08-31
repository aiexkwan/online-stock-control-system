/**
 * Navigation Card GraphQL Resolver
 * Handles navigation menu queries and bookmark management
 */

// import { GraphQLContext as Context  } from // Unused import './index';
// NavigationCard has been deleted - define NavigationType locally
enum NavigationType {
  DASHBOARD = 'dashboard',
  MENU = 'menu',
  BREADCRUMB = 'breadcrumb',
  SIDEBAR = 'sidebar',
  QUICK_ACCESS = 'quick_access',
}

interface _NavigationMenuInput {
  navigationType: NavigationType;
  permissions?: string[];
  currentPath?: string;
}

interface _BookmarkInput {
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
const _mockNavigationData = {
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
const _userBookmarks: Record<string, Set<string>> = {};

// 過濾有權限的導航項目
const _filterByPermissions = (
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
      children: item.children ? _filterByPermissions(item.children, userPermissions) : undefined,
    }));
};

export const navigationResolver = {
  Query: {},
  Mutation: {},
};
