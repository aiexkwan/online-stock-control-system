/**
 * Tab Selector Card - Phase 3.0 重構
 * 專家會議決策 (2025-07-22)：Card 選擇器系統
 * - 左側：11個 UnifiedWidget 選擇界面
 * - 右側：AnalysisDisplayContainer 顯示選中的 widgets
 * - 移除原有的 Tab 分類，改為直接的 Card 控制
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  WrenchScrewdriverIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
// Remove legacy card names - use Card components directly
import { createClient } from '@/app/utils/supabase/client';
import { cardTextStyles } from '@/lib/card-system/theme';
import { SpecialCard } from '@/lib/card-system/EnhancedGlassmorphicCard';

// Import Operation Cards

// Import types
import type { TabType } from '../types/ui-navigation';

// Type definition for allowed cards (matching AnalysisCardSelector)
type AllowedCardType =
  | 'StockLevelListAndChartCard'
  | 'StockHistoryCard'
  | 'WorkLevelCard'
  | 'VerticalTimelineCard'
  | 'UploadCenterCard'
  | 'DownloadCenterCard'
  | 'PerformanceDashboard'
  | 'DataUpdateCard'
  | 'DepartInjCard'
  | 'DepartPipeCard'
  | 'DepartWareCard'
  | 'VoidPalletCard'
  | 'ChatbotCard';
import type { UserInfo } from '../types/common';
import {
  AVAILABLE_CARDS,
  CARD_CATEGORIES,
  OPERATION_MENU,
  DEFAULT_SELECTED_CARD,
} from '../constants/cardConfig';
import { AnalysisCardSelector } from './AnalysisCardSelector';
import {
  QCLabelCard,
  GRNLabelCard,
  StockTransferCard,
  OrderLoadCard,
  StockCountCard,
} from './index';

export const TabSelectorCard: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('admin');

  // Simple state management for selected card
  const [selectedCard, setSelectedCard] = useState<AllowedCardType>(
    DEFAULT_SELECTED_CARD as AllowedCardType
  );

  // User info state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Operation selected item
  const [selectedOperationCard, setSelectedOperationCard] = useState<string>('');

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          setIsLoadingUser(false);
          return;
        }

        // Fetch user details from data_id table
        const { data, error } = await supabase
          .from('data_id')
          .select('name, email, icon_url')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error fetching user info:', error);
        } else if (data) {
          setUserInfo({
            name: data.name,
            email: data.email,
            iconUrl: data.icon_url,
          });
        }
      } catch (fetchError) {
        console.error('Error fetching user info:', fetchError);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/main-login';
  };

  // Card selection handler - no caching needed for UI state
  const handleCardSelect = useCallback(
    (component: AllowedCardType) => {
      // Skip if same card is already selected
      if (selectedCard === component) {
        return;
      }
      setSelectedCard(component);
    },
    [selectedCard]
  );

  // Operation selection handler
  const handleOperationSelect = useCallback((operationId: string) => {
    // Set corresponding card for right side display
    switch (operationId) {
      case 'qc-label':
        setSelectedOperationCard('QCLabelCard');
        break;
      case 'grn-label':
        setSelectedOperationCard('GRNLabelCard');
        break;
      case 'stock-transfer':
        setSelectedOperationCard('StockTransferCard');
        break;
      case 'order-loading':
        setSelectedOperationCard('OrderLoadCard');
        break;
      case 'stock-count':
        setSelectedOperationCard('StockCountCard');
        break;
      default:
        setSelectedOperationCard('');
    }
  }, []);

  // Card 錯誤處理
  const handleCardError = useCallback((component: string, error: Error) => {
    console.error(`Card ${component} failed to load:`, error);
    // 可以在這裡添加錯誤通知或移除失敗的 card
  }, []);

  // Render Operation Card
  const renderOperationCard = useCallback((operationCardType: string) => {
    switch (operationCardType) {
      case 'QCLabelCard':
        return <QCLabelCard className='h-full' />;
      case 'GRNLabelCard':
        return <GRNLabelCard className='h-full' />;
      case 'StockTransferCard':
        return <StockTransferCard className='h-full' />;
      case 'OrderLoadCard':
        return <OrderLoadCard className='h-full' />;
      case 'StockCountCard':
        return <StockCountCard className='h-full' />;
      default:
        return null;
    }
  }, []);

  // 動畫配置
  const checkboxVariants = {
    unchecked: { scale: 1, opacity: 0.7 },
    checked: { scale: 1.05, opacity: 1 },
    hover: { scale: 1.1 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <div className='flex h-full w-full gap-4'>
      {/* 左側 Card 選擇區域 */}
      <div className='w-80 flex-shrink-0'>
        <SpecialCard
          variant='glass'
          isHoverable={false}
          borderGlow={false}
          padding='none'
          className='flex h-full flex-col'
        >
          {/* Tab Selector */}
          <div className='border-b border-slate-700 p-4'>
            <div className='flex gap-2'>
              <button
                onClick={() => setActiveTab('operation')}
                className={cn(
                  cardTextStyles.body,
                  `flex-1 rounded-md px-3 py-2 font-medium transition-all ${
                    activeTab === 'operation'
                      ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`
                )}
              >
                Operation
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={cn(
                  cardTextStyles.body,
                  `flex-1 rounded-md px-3 py-2 font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`
                )}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Card 分類和選擇列表 */}
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <div className='space-y-1 p-4'>
              {activeTab === 'admin' ? (
                // Admin Tab Content
                <>
                  {CARD_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const categoryCards = AVAILABLE_CARDS.filter(
                      card => card.category === category.id
                    );
                    const categoryHasSelected = categoryCards.some(
                      card => card.component === selectedCard
                    );

                    return (
                      <div key={category.id} className='space-y-1'>
                        {/* 類別標題 */}
                        <div
                          onClick={() => {
                            // Special handling for chat-database: directly select ChatbotCard
                            if (category.id === 'chat-database') {
                              handleCardSelect('ChatbotCard' as AllowedCardType);
                            }
                          }}
                          className='flex w-full cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-slate-700/50'
                          role='button'
                        >
                          <Icon className={`h-4 w-4 ${category.color}`} />
                          <span
                            className={cn(
                              cardTextStyles.body,
                              'flex-1 text-left font-semibold text-slate-300'
                            )}
                          >
                            {category.label}
                          </span>
                          <span className={cn(cardTextStyles.labelSmall, 'text-slate-500')}>
                            {categoryHasSelected ? '✓' : ''}
                          </span>
                        </div>

                        {/* Card 選項 - Hide for chat-database */}
                        {category.id !== 'chat-database' && (
                          <div className='overflow-hidden'>
                            <div className='ml-6 space-y-1 border-l border-slate-600/30 pl-2'>
                              {categoryCards.map(card => {
                                const isSelected = selectedCard === card.component;

                                return (
                                  <motion.button
                                    key={card.component}
                                    onClick={() =>
                                      handleCardSelect(card.component as AllowedCardType)
                                    }
                                    className={`flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left transition-all duration-200 ${
                                      isSelected
                                        ? 'border border-blue-500/50 bg-blue-500/20 ring-1 ring-blue-500/30'
                                        : 'hover:bg-slate-700/30'
                                    } `}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <motion.div
                                      className='mt-0.5 flex items-center justify-center'
                                      variants={checkboxVariants}
                                      animate={isSelected ? 'checked' : 'unchecked'}
                                      whileHover='hover'
                                    >
                                      <div
                                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-500 ring-2 ring-blue-500/20'
                                            : 'border-slate-500 hover:border-slate-400'
                                        } `}
                                      >
                                        {isSelected && (
                                          <div className='h-2 w-2 rounded-full bg-white' />
                                        )}
                                      </div>
                                    </motion.div>

                                    <div className='min-w-0 flex-1'>
                                      <div
                                        className={cn(
                                          cardTextStyles.body,
                                          `font-semibold transition-colors ${isSelected ? 'text-white' : 'text-slate-300'} `
                                        )}
                                      >
                                        {card.displayName}
                                      </div>
                                      {/* Hide card _name, category label, and card type as per requirements */}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                // Operation Tab Content
                <div className='space-y-2'>
                  {OPERATION_MENU.map(item => (
                    <div key={item.id} className='space-y-1'>
                      {item.subItems ? (
                        // Menu with sub-items
                        <>
                          <div
                            className={cn(
                              cardTextStyles.body,
                              'flex w-full items-center gap-2 rounded-md p-2 font-semibold text-slate-300'
                            )}
                          >
                            <WrenchScrewdriverIcon className='h-4 w-4 text-blue-400' />
                            <span>{item.label}</span>
                          </div>
                          <div className='ml-6 space-y-1 border-l border-slate-600/30 pl-2'>
                            {item.subItems.map(subItem => (
                              <motion.button
                                key={subItem.id}
                                onClick={() => handleOperationSelect(subItem.id)}
                                className={cn(
                                  cardTextStyles.body,
                                  'flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-all duration-200 hover:bg-slate-700/30'
                                )}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className='h-2 w-2 rounded-full bg-slate-500' />
                                <span className={cn(cardTextStyles.body, 'text-slate-300')}>
                                  {subItem.label}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </>
                      ) : (
                        // Direct menu item
                        <motion.button
                          onClick={() => handleOperationSelect(item.id)}
                          className='flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-all duration-200 hover:bg-slate-700/30'
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <WrenchScrewdriverIcon className='h-4 w-4 text-blue-400' />
                          <span className={cn(cardTextStyles.body, 'font-semibold text-slate-300')}>
                            {item.label}
                          </span>
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Info Section */}
          <div className='border-t border-slate-700 p-4'>
            <div className='flex items-center gap-3'>
              {userInfo ? (
                <>
                  {userInfo.iconUrl ? (
                    <Image
                      src={userInfo.iconUrl}
                      alt={userInfo.name}
                      width={40}
                      height={40}
                      className='rounded-full border border-slate-600'
                    />
                  ) : (
                    <UserCircleIcon className='h-10 w-10 text-slate-400' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <div
                      className={cn(cardTextStyles.body, 'truncate font-semibold text-slate-200')}
                    >
                      {userInfo.name}
                    </div>
                    <div className={cn(cardTextStyles.labelSmall, 'truncate text-slate-400')}>
                      {userInfo.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className='rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300'
                    title='Logout'
                  >
                    <ArrowRightOnRectangleIcon className='h-5 w-5' />
                  </button>
                </>
              ) : isLoadingUser ? (
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 animate-pulse rounded-full bg-slate-700' />
                  <div className='flex-1 space-y-1'>
                    <div className='h-4 w-24 animate-pulse rounded bg-slate-700' />
                    <div className='h-3 w-32 animate-pulse rounded bg-slate-700' />
                  </div>
                </div>
              ) : (
                <div className={cn(cardTextStyles.body, 'text-slate-400')}>No user info</div>
              )}
            </div>
          </div>
        </SpecialCard>
      </div>

      {/* 右側 Card 顯示區域 */}
      <div className='min-w-0 flex-1'>
        {activeTab === 'admin' ? (
          <motion.div
            className='h-full w-full'
            variants={contentVariants}
            initial='hidden'
            animate='visible'
          >
            {/* 單一完整的 Dashboard 顯示 */}
            <AnalysisCardSelector
              selectedCard={selectedCard}
              onCardError={handleCardError}
              className='h-full'
            />
          </motion.div>
        ) : (
          <motion.div
            className='h-full w-full'
            variants={contentVariants}
            initial='hidden'
            animate='visible'
          >
            {selectedOperationCard ? (
              renderOperationCard(selectedOperationCard)
            ) : (
              <div className='flex h-full items-center justify-center'>
                <div className='text-center'>
                  <WrenchScrewdriverIcon className='mx-auto h-16 w-16 text-slate-600' />
                  <p className={cn(cardTextStyles.subtitle, 'mt-4 text-slate-400')}>
                    Select an operation from the left menu
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
