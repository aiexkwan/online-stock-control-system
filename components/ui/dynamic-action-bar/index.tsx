'use client';

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DynamicActionBarProps {
  className?: string;
}

export function DynamicActionBar({ className }: DynamicActionBarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ name: string; email: string; icon_url?: string | null } | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useAuth();
  const router = useRouter();
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

  const containerVariants = {
    hidden: { 
      y: 100, 
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05
      }
    }
  };

  if (isMobile) {
    return <MobileView items={MAIN_NAVIGATION} />;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "fixed inset-x-0 mx-auto w-fit",
        "bottom-[1%]", // Very close to bottom
        "bg-black/80 backdrop-blur-xl",
        "rounded-2xl border border-white/10",
        "shadow-2xl",
        "p-2",
        "z-50",
        className
      )}
      onMouseLeave={() => setActiveItem(null)} // Clear active item when mouse leaves the entire nav bar
    >
      <div className="flex items-center justify-between gap-8 w-full">
        {/* Navigation Items */}
        <div className="flex items-center gap-2">
          {MAIN_NAVIGATION.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              onActiveChange={setActiveItem}
            />
          ))}
        </div>
        
        {/* User Info Section */}
        <div className="flex items-center gap-4">
          {/* Divider */}
          <div className="h-8 w-px bg-white/20" />
          
          {/* Greeting and User Name */}
          <div className="text-right">
            <p className="text-xs text-white/70">{getGreeting()}</p>
            <p className="text-sm font-medium text-white">
              {userData?.name || user?.email || 'User'}
            </p>
          </div>
          
          {/* User Avatar */}
          {userData?.icon_url ? (
            <Image 
              src={userData.icon_url} 
              alt={userData.name || 'User'} 
              width={40}
              height={40}
              className="w-10 h-10 rounded-full shadow-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          
          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-white group-hover:text-red-400 transition-colors" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}