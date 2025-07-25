/**
 * NavigationCard Component
 * 統一的導航卡片組件，支援多種導航模式和權限控制
 *
 * 支援的導航類型：
 * - SIDEBAR: 側邊欄導航
 * - BREADCRUMB: 面包屑導航
 * - MENU: 主菜單導航
 * - QUICK_ACCESS: 快速訪問導航
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bars3Icon,
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  UserIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// 導航類型定義
export enum NavigationType {
  SIDEBAR = 'SIDEBAR',
  BREADCRUMB = 'BREADCRUMB',
  MENU = 'MENU',
  QUICK_ACCESS = 'QUICK_ACCESS',
}

// 導航項目介面
export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavigationItem[];
  permissions?: string[];
  badge?: number;
  external?: boolean;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// 導航菜單數據結構
export interface NavigationMenuData {
  id: string;
  items: NavigationItem[];
  permissions: string[];
  metadata?: Record<string, string | number | boolean | null>;
}

// GraphQL 查詢
const NAVIGATION_MENU_QUERY = gql`
  query NavigationMenuQuery($input: NavigationMenuInput!) {
    navigationMenu(input: $input) {
      id
      items {
        id
        label
        icon
        path
        children {
          id
          label
          icon
          path
          permissions
          badge
          external
          description
        }
        permissions
        badge
        external
        description
        metadata
      }
      permissions
      metadata
    }
  }
`;

const NAVIGATION_BOOKMARK_MUTATION = gql`
  mutation UpdateNavigationBookmark($input: BookmarkInput!) {
    updateNavigationBookmark(input: $input) {
      success
      message
      bookmarks
    }
  }
`;

// NavigationCard 組件 Props
export interface NavigationCardProps {
  // 導航類型
  navigationType: NavigationType;

  // 當前路徑
  currentPath?: string;

  // 用戶權限
  permissions?: string[];

  // 顯示選項
  showSearch?: boolean;
  showBookmarks?: boolean;
  collapsible?: boolean;
  showBadges?: boolean;

  // 樣式選項
  className?: string;
  height?: number | string;
  theme?: 'light' | 'dark';

  // 編輯模式
  isEditMode?: boolean;

  // 回調函數
  onNavigate?: (path: string, item: NavigationItem) => void;
  onBookmark?: (item: NavigationItem) => void;
  onSearch?: (query: string, results: NavigationItem[]) => void;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  navigationType,
  currentPath,
  permissions = [],
  showSearch = true,
  showBookmarks = true,
  collapsible = true,
  showBadges = true,
  className,
  height = 'auto',
  theme = 'dark',
  isEditMode = false,
  onNavigate,
  onBookmark,
  onSearch,
}) => {
  // Hooks
  const router = useRouter();
  const pathname = usePathname();

  // 狀態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  // 準備查詢輸入
  const queryInput = useMemo(
    () => ({
      navigationType,
      permissions,
      currentPath: currentPath || pathname,
    }),
    [navigationType, permissions, currentPath, pathname]
  );

  // 執行 GraphQL 查詢 - 使用模擬數據
  const { data, loading, error, refetch } = useQuery<{ navigationMenu: NavigationMenuData }>(
    NAVIGATION_MENU_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
      // 暫時使用模擬數據
      errorPolicy: 'ignore',
    }
  );

  // 書籤管理 mutation
  const [updateBookmark] = useMutation(NAVIGATION_BOOKMARK_MUTATION);

  // 模擬導航數據
  const mockNavigationData: NavigationMenuData = useMemo(() => {
    const commonItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: HomeIcon,
        path: '/admin',
        description: 'Main dashboard overview',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: ChartBarIcon,
        path: '/admin/analytics',
        badge: 5,
        children: [
          {
            id: 'reports',
            label: 'Reports',
            icon: DocumentTextIcon,
            path: '/admin/analytics/reports',
            description: 'View and generate reports',
          },
          {
            id: 'charts',
            label: 'Charts',
            icon: ChartBarIcon,
            path: '/admin/analytics/charts',
            description: 'Interactive data visualizations',
          },
        ],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: FolderIcon,
        path: '/admin/inventory',
        children: [
          {
            id: 'products',
            label: 'Products',
            path: '/admin/inventory/products',
          },
          {
            id: 'stock',
            label: 'Stock Management',
            path: '/admin/inventory/stock',
            badge: 12,
          },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: CogIcon,
        path: '/admin/settings',
        permissions: ['admin'],
      },
      {
        id: 'users',
        label: 'User Management',
        icon: UserIcon,
        path: '/admin/users',
        permissions: ['admin', 'user_manager'],
        badge: 3,
      },
    ];

    switch (navigationType) {
      case NavigationType.BREADCRUMB:
        return {
          id: 'breadcrumb-nav',
          items: commonItems.slice(0, 3),
          permissions,
        };
      case NavigationType.QUICK_ACCESS:
        return {
          id: 'quick-access-nav',
          items: commonItems.slice(0, 4),
          permissions,
        };
      default:
        return {
          id: 'main-nav',
          items: commonItems,
          permissions,
        };
    }
  }, [navigationType, permissions]);

  // 獲取導航配置 - 使用模擬數據或真實數據
  const navigationData = data?.navigationMenu || mockNavigationData;

  // 過濾有權限的導航項目
  const filteredItems = useMemo(() => {
    const filterByPermissions = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter(item => {
          if (!item.permissions || item.permissions.length === 0) return true;
          return item.permissions.some(permission => permissions.includes(permission));
        })
        .map(item => ({
          ...item,
          children: item.children ? filterByPermissions(item.children) : undefined,
        }));
    };

    return filterByPermissions(navigationData.items);
  }, [navigationData.items, permissions]);

  // 搜索功能
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const searchInItems = (items: NavigationItem[]): NavigationItem[] => {
      const results: NavigationItem[] = [];

      items.forEach(item => {
        if (
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push(item);
        }

        if (item.children) {
          results.push(...searchInItems(item.children));
        }
      });

      return results;
    };

    return searchInItems(filteredItems);
  }, [searchQuery, filteredItems]);

  // 處理導航點擊
  const handleNavigate = useCallback(
    (item: NavigationItem) => {
      if (item.external && item.path) {
        window.open(item.path, '_blank');
        return;
      }

      if (item.path) {
        router.push(item.path);
        onNavigate?.(item.path, item);
      }
    },
    [router, onNavigate]
  );

  // 處理展開/收起
  const handleToggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // 處理書籤
  const handleBookmark = useCallback(
    async (item: NavigationItem) => {
      const isBookmarked = bookmarkedItems.has(item.id);

      try {
        await updateBookmark({
          variables: {
            input: {
              itemId: item.id,
              action: isBookmarked ? 'REMOVE' : 'ADD',
            },
          },
        });

        setBookmarkedItems(prev => {
          const newSet = new Set(prev);
          if (isBookmarked) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });

        onBookmark?.(item);
      } catch (error) {
        console.error('Bookmark error:', error);
      }
    },
    [bookmarkedItems, updateBookmark, onBookmark]
  );

  // 渲染導航項目
  const renderNavigationItem = useCallback(
    (item: NavigationItem, level: number = 0) => {
      const isActive = currentPath === item.path || pathname === item.path;
      const isExpanded = expandedItems.has(item.id);
      const isBookmarked = bookmarkedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id} className='w-full'>
          <div
            className={cn(
              'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 transition-all duration-200',
              'hover:bg-blue-500/10',
              isActive && 'border-l-2 border-blue-400 bg-blue-500/20',
              level > 0 && 'ml-4'
            )}
            onClick={() => !hasChildren && handleNavigate(item)}
          >
            {/* 圖標 */}
            {item.icon && (
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-400' : 'text-gray-400'
                )}
              />
            )}

            {/* 標籤 */}
            <span
              className={cn(
                'flex-1 truncate text-sm font-medium',
                isActive ? 'text-blue-400' : 'text-gray-300'
              )}
            >
              {item.label}
            </span>

            {/* 徽章 */}
            {showBadges && item.badge && item.badge > 0 && (
              <Badge variant='secondary' className='ml-2 bg-red-500/20 text-xs text-red-400'>
                {item.badge}
              </Badge>
            )}

            {/* 書籤按鈕 */}
            {showBookmarks && (
              <Button
                size='sm'
                variant='ghost'
                className='ml-2 h-6 w-6 p-0'
                onClick={e => {
                  e.stopPropagation();
                  handleBookmark(item);
                }}
              >
                <BookmarkIcon
                  className={cn(
                    'h-4 w-4',
                    isBookmarked ? 'fill-current text-yellow-400' : 'text-gray-500'
                  )}
                />
              </Button>
            )}

            {/* 展開/收起按鈕 */}
            {hasChildren && (
              <Button
                size='sm'
                variant='ghost'
                className='ml-2 h-6 w-6 p-0'
                onClick={e => {
                  e.stopPropagation();
                  handleToggleExpand(item.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                ) : (
                  <ChevronRightIcon className='h-4 w-4 text-gray-400' />
                )}
              </Button>
            )}
          </div>

          {/* 子項目 */}
          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='overflow-hidden'
              >
                <div className='ml-4 mt-2 border-l border-gray-600/30 pl-4'>
                  {item.children!.map(child => renderNavigationItem(child, level + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [
      currentPath,
      pathname,
      expandedItems,
      bookmarkedItems,
      showBadges,
      showBookmarks,
      handleNavigate,
      handleToggleExpand,
      handleBookmark,
    ]
  );

  // 渲染面包屑導航
  const renderBreadcrumb = useCallback(() => {
    const pathSegments = (currentPath || pathname).split('/').filter(Boolean);

    return (
      <div className='flex items-center space-x-2 text-sm'>
        <HomeIcon className='h-4 w-4 text-gray-400' />
        {pathSegments.map((segment, index) => (
          <React.Fragment key={index}>
            <ChevronRightIcon className='h-4 w-4 text-gray-500' />
            <span
              className={cn(
                'capitalize',
                index === pathSegments.length - 1 ? 'font-medium text-blue-400' : 'text-gray-300'
              )}
            >
              {segment.replace(/-/g, ' ')}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }, [currentPath, pathname]);

  // 根據導航類型獲取配置
  const getNavigationConfig = useCallback((type: NavigationType) => {
    switch (type) {
      case NavigationType.SIDEBAR:
        return {
          title: 'Navigation',
          icon: Bars3Icon,
          color: 'from-blue-500 to-cyan-500',
        };
      case NavigationType.BREADCRUMB:
        return {
          title: 'Breadcrumb',
          icon: ChevronRightIcon,
          color: 'from-green-500 to-emerald-500',
        };
      case NavigationType.MENU:
        return {
          title: 'Menu',
          icon: Bars3Icon,
          color: 'from-purple-500 to-violet-500',
        };
      case NavigationType.QUICK_ACCESS:
        return {
          title: 'Quick Access',
          icon: BookmarkIcon,
          color: 'from-orange-500 to-amber-500',
        };
      default:
        return {
          title: 'Navigation',
          icon: Bars3Icon,
          color: 'from-gray-500 to-slate-500',
        };
    }
  }, []);

  const config = getNavigationConfig(navigationType);

  // Edit mode 渲染
  if (isEditMode) {
    return (
      <div className={cn('w-full', className)}>
        <Card className='border-blue-400 bg-gray-800 text-white'>
          <CardHeader>
            <CardTitle className='flex items-center text-blue-400'>
              <config.icon className='mr-2 h-5 w-5' />
              {config.title} - Edit Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='py-8 text-center text-gray-400'>
              Navigation configuration in edit mode
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
              <div className={cn('mr-3 rounded-lg bg-gradient-to-r p-2', config.color)}>
                <config.icon className='h-5 w-5 text-white' />
              </div>
              <div>
                <div>{config.title}</div>
                <div className='mt-1 text-sm font-normal text-gray-400'>
                  {navigationType === NavigationType.BREADCRUMB
                    ? 'Current path navigation'
                    : navigationType === NavigationType.QUICK_ACCESS
                      ? 'Frequently used links'
                      : 'Main navigation menu'}
                </div>
              </div>
            </CardTitle>

            {collapsible && navigationType === NavigationType.SIDEBAR && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='text-gray-400 hover:text-white'
              >
                <Bars3Icon className='h-5 w-5' />
              </Button>
            )}
          </div>

          {/* 搜索框 */}
          {showSearch && navigationType !== NavigationType.BREADCRUMB && (
            <div className='relative mt-4'>
              <MagnifyingGlassIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                placeholder='Search navigation...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='border-gray-600 bg-gray-700 pl-10 text-white placeholder-gray-400'
              />
              {searchQuery && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setSearchQuery('')}
                  className='absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0 text-gray-400'
                >
                  <XMarkIcon className='h-4 w-4' />
                </Button>
              )}
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
                <span className='text-gray-300'>Loading navigation...</span>
              </motion.div>
            ) : (
              <motion.div
                key='navigation'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='space-y-2'
              >
                {/* 面包屑模式 */}
                {navigationType === NavigationType.BREADCRUMB && (
                  <div className='rounded-lg bg-gray-700/50 p-4'>{renderBreadcrumb()}</div>
                )}

                {/* 搜索結果 */}
                {searchQuery && searchResults.length > 0 && (
                  <div className='mb-4'>
                    <div className='mb-2 text-xs text-gray-400'>
                      Search Results ({searchResults.length})
                    </div>
                    <div className='space-y-1'>
                      {searchResults.map(item => renderNavigationItem(item))}
                    </div>
                  </div>
                )}

                {/* 主導航項目 */}
                {(!searchQuery || searchResults.length === 0) && (
                  <div className='space-y-1'>
                    {filteredItems.map(item => renderNavigationItem(item))}
                  </div>
                )}

                {/* 無搜索結果 */}
                {searchQuery && searchResults.length === 0 && (
                  <div className='py-8 text-center text-gray-400'>
                    No navigation items found for &quot;{searchQuery}&quot;
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
