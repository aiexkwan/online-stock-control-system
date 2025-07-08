'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { NavigationItem } from './NavigationItem';
import { MobileView } from './MobileView';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MAIN_NAVIGATION } from '@/config/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { createClient } from '@/app/utils/supabase/client';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { navigationPreloader } from '@/lib/navigation/preloader';
import { navigationCacheManager } from '@/lib/navigation/cache-manager';
import { VirtualizedNavigation } from './VirtualizedNavigation';
import { QuickAccess } from './QuickAccess';
import { SmartReminder } from './SmartReminder';

interface DynamicActionBarProps {
  className?: string;
}

export function DynamicActionBar({ className }: DynamicActionBarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    icon_url?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // 使用預加載系統
  useEffect(() => {
    if (user?.id && pathname) {
      navigationPreloader.predictAndPreload(user.id, pathname);
    }
  }, [pathname, user?.id]);

  // 優化用戶數據獲取
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 先檢查緩存
        const cachedData = await navigationCacheManager.getUserData(user.id);
        if (cachedData) {
          setUserData({
            name: cachedData.name,
            email: cachedData.email,
            icon_url: cachedData.icon_url,
          });

          // 獲取優化的頭像 URL
          if (cachedData.icon_url) {
            const optimizedUrl = await navigationCacheManager.getOptimizedAvatar(user.id);
            setAvatarUrl(optimizedUrl);
          }
          setIsLoading(false);
          return;
        }

        // 緩存未命中，從數據庫獲取
        const { data, error } = await supabase
          .from('data_id')
          .select('name, email, icon_url')
          .eq('email', user.email)
          .single();

        if (data && !error) {
          setUserData(data);

          // 更新緩存
          navigationCacheManager.setUserData(user.id, {
            id: user.id,
            name: data.name,
            email: data.email,
            icon_url: data.icon_url,
            role: userRole?.navigationRestricted ? 'restricted' : 'admin',
          });

          // 獲取優化的頭像
          if (data.icon_url) {
            await navigationCacheManager.setAvatarUrl(user.id, data.icon_url);
            const optimizedUrl = await navigationCacheManager.getOptimizedAvatar(user.id);
            setAvatarUrl(optimizedUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, userRole, supabase]);

  // 優化的登出處理
  const handleLogout = useCallback(async () => {
    try {
      // 清理緩存
      if (user?.id) {
        navigationCacheManager.clearUserCache(user.id);
      }
      navigationPreloader.clearCache();

      const { error } = await supabase.auth.signOut();
      if (!error) {
        localStorage.removeItem('loggedInUserClockNumber');
        toast.success('You have logged out');
        router.push('/main-login');
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  }, [user?.id, supabase, router]);

  // 優化動畫性能
  const containerVariants = useMemo(
    () => ({
      hidden: {
        y: 100,
        opacity: 0,
        scale: 0.8,
      },
      visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          staggerChildren: 0.05,
        },
      },
    }),
    []
  );

  // 根據導航項目數量決定是否使用虛擬化
  const allowedNavigation = useMemo(
    () => (userRole?.navigationRestricted ? [] : MAIN_NAVIGATION),
    [userRole?.navigationRestricted]
  );

  const shouldUseVirtualization = allowedNavigation.length > 10;

  // Handle hover logic
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setShowPrompt(false);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  }, [hideTimeout]);

  const handleMouseLeave = useCallback(() => {
    setActiveItem(null);
    const timeout = setTimeout(() => {
      setIsHovered(false);
      setShowPrompt(true);
    }, 3000);
    setHideTimeout(timeout);
  }, []);

  const handleClick = useCallback(() => {
    setIsHovered(false);
    setShowPrompt(true);
    setActiveItem(null);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  }, [hideTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  if (isMobile) {
    // Mobile view should also respect user role restrictions
    const allowedNavigation = userRole?.navigationRestricted ? [] : MAIN_NAVIGATION;
    return <MobileView items={allowedNavigation} />;
  }

  return (
    <>
      {/* Invisible Hover Trigger Area */}
      {!isMobile && !isHovered && (
        <div className='fixed bottom-0 left-0 right-0 z-40 h-20' onMouseEnter={handleMouseEnter} />
      )}

      {/* Hover Prompt */}
      <AnimatePresence>
        {showPrompt && !isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='pointer-events-none fixed bottom-[1%] left-1/2 z-40 -translate-x-1/2 transform'
          >
            <div className='rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm'>
              <p className='text-sm text-white/80'>
                {isMobile ? 'Tap ↑ to open navigation' : 'Hover to show navigation'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate={isHovered ? 'visible' : 'hidden'}
        className={cn(
          'fixed inset-x-0 mx-auto w-fit',
          'bottom-[1%]', // Very close to bottom
          'bg-transparent',
          'rounded-2xl',
          'shadow-2xl',
          'p-2',
          'z-50',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className='flex w-full items-center justify-between gap-8'>
          {/* Left side: Navigation and Quick Access */}
          <div className='flex items-center gap-4'>
            {/* Navigation Items - Only show for Admin users */}
            {!userRole?.navigationRestricted &&
              (shouldUseVirtualization ? (
                <VirtualizedNavigation
                  items={allowedNavigation}
                  activeItem={activeItem}
                  onActiveChange={setActiveItem}
                  className='flex-1'
                />
              ) : (
                <div className='flex items-center gap-2'>
                  {allowedNavigation.map(item => (
                    <NavigationItem
                      key={item.id}
                      item={item}
                      isActive={activeItem === item.id}
                      onActiveChange={setActiveItem}
                    />
                  ))}
                </div>
              ))}

            {/* Quick Access - Only show for authenticated users with ID */}
            {user?.id && !isLoading && <QuickAccess userId={user.id} />}
          </div>

          {/* User Info Section */}
          <div className='flex items-center gap-4'>
            {/* Divider - Only show if navigation items are present */}
            {!userRole?.navigationRestricted && <div className='h-8 w-px bg-white/20' />}

            {/* Greeting and User Name */}
            <div className='text-right'>
              <p className='text-xs text-white/70'>{getGreeting()}</p>
              <p className='text-sm font-medium text-white'>
                {userData?.name || user?.email || 'User'}
              </p>
            </div>

            {/* User Avatar with loading state */}
            {isLoading ? (
              <div className='h-10 w-10 animate-pulse rounded-full bg-white/20' />
            ) : avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userData?.name || 'User'}
                width={40}
                height={40}
                className='h-10 w-10 rounded-full object-cover shadow-lg'
                loading='eager'
                priority
              />
            ) : (
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white shadow-lg'>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className='group rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/20'
              title='Logout'
            >
              <ArrowRightOnRectangleIcon className='h-5 w-5 text-white transition-colors group-hover:text-red-400' />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Tap Indicator */}
      {isMobile && showPrompt && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsHovered(true)}
          className='fixed bottom-[1%] left-1/2 z-40 -translate-x-1/2 transform rounded-full bg-black/80 p-3 shadow-2xl backdrop-blur-xl'
        >
          <svg className='h-6 w-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 10l7-7m0 0l7 7m-7-7v18'
            />
          </svg>
        </motion.button>
      )}
    </>
  );
}
