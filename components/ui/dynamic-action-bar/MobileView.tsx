'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronUpIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import type { NavigationItem } from '@/config/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';

interface MobileViewProps {
  items: NavigationItem[];
}

export function MobileView({ items }: MobileViewProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    icon_url?: string | null;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Fetch user data from data_id table
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        const { data } = await supabase
          .from('data_id')
          .select('name, email, icon_url')
          .eq('email', user.email)
          .single();

        if (data) {
          setUserData(data);
        }
      }
    };

    fetchUserData();
  }, [user, supabase]);

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.removeItem('loggedInUserClockNumber');
      toast.success('You have logged out');
      router.push('/main-login');
    } else {
      toast.error('Failed to logout');
    }
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href && !item.children) {
      router.push(item.href);
      // Hide navigation after click
      setIsVisible(false);
      setExpandedItem(null);
    } else if (item.children) {
      setExpandedItem(expandedItem === item.id ? null : item.id);
    }
  };

  // Handle show/hide with timeout
  const handleShow = () => {
    setIsVisible(true);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const handleStartHideTimer = () => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
      setExpandedItem(null);
    }, 3000);
    setHideTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  return (
    <>
      {/* Show Navigation Button */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShow}
            className='fixed bottom-[5%] left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-black/80 p-4 shadow-2xl backdrop-blur-xl'
          >
            <div className='flex flex-col items-center gap-1'>
              <ChevronUpIcon className='h-6 w-6 text-white' />
              <span className='text-xs text-white/80'>Tap to open</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation Menu */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
              'fixed left-4 right-4',
              'bottom-[15%]', // Slightly lower on mobile
              'bg-transparent',
              'rounded-2xl',
              'shadow-2xl',
              'p-4',
              'z-50'
            )}
            onTouchEnd={handleStartHideTimer}
          >
            {/* User Info Header */}
            <div className='mb-4 flex items-center justify-between border-b border-white/10 pb-4'>
              <div className='flex items-center gap-3'>
                {/* User Avatar */}
                {userData?.icon_url ? (
                  <Image
                    src={userData.icon_url}
                    alt={userData.name || 'User'}
                    width={40}
                    height={40}
                    className='h-10 w-10 rounded-full object-cover shadow-lg'
                  />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white shadow-lg'>
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Greeting and User Name */}
                <div>
                  <p className='text-xs text-white/70'>{getGreeting()}</p>
                  <p className='text-sm font-medium text-white'>
                    {userData?.name || user?.email || 'User'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className='rounded-lg bg-white/20 p-2 transition-colors active:bg-white/20'
                title='Logout'
              >
                <ArrowRightOnRectangleIcon className='h-5 w-5 text-white' />
              </motion.button>
            </div>

            {/* Navigation Grid */}
            <div className='grid grid-cols-3 gap-3'>
              {items.map(item => (
                <div key={item.id} className='relative'>
                  {/* Item Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full rounded-xl p-3',
                      'bg-white/5 backdrop-blur-md',
                      'border border-white/10',
                      'transition-all duration-200',
                      'flex flex-col items-center gap-1',
                      expandedItem === item.id && 'border-white/20 bg-white/20'
                    )}
                  >
                    <item.icon className={cn('h-6 w-6', item.iconColor)} />
                    <span className='text-xs font-medium text-white'>{item.label}</span>
                    {item.children && (
                      <ChevronUpIcon
                        className={cn(
                          'h-3 w-3 text-white/60 transition-transform',
                          expandedItem === item.id && 'rotate-180'
                        )}
                      />
                    )}
                  </motion.button>

                  {/* Expanded Submenu */}
                  <AnimatePresence>
                    {expandedItem === item.id && item.children && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                          'absolute bottom-full left-0 right-0 mb-2',
                          'bg-black/95 backdrop-blur-xl',
                          'rounded-xl border border-white/10',
                          'shadow-2xl',
                          'p-2',
                          'z-10'
                        )}
                      >
                        <div className='space-y-1'>
                          {item.children.map(child => (
                            <Link
                              key={child.id}
                              href={child.href}
                              className={cn(
                                'block px-3 py-2',
                                'rounded-lg',
                                'bg-white/5',
                                'text-xs font-medium text-white',
                                'active:bg-white/20'
                              )}
                              onClick={() => setExpandedItem(null)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
