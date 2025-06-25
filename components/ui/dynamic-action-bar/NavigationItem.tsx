'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubMenu } from './SubMenu';
import type { NavigationItem as NavItem, SubNavigationItem } from '@/config/navigation';

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  onActiveChange: (id: string | null) => void;
}

export function NavigationItem({ item, isActive, onActiveChange }: NavigationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    } else if (item.children) {
      // If has children but no href, just show the submenu
      onActiveChange(isActive ? null : item.id);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (item.children) {
      onActiveChange(item.id);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Don't clear active state here - let the parent container handle it
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      className="relative"
      variants={itemVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: item.gradient,
          filter: "blur(20px)",
        }}
        animate={{
          opacity: isHovered ? 0.6 : 0.3
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Main Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-4 py-3 rounded-lg",
          "bg-white/5 backdrop-blur-md",
          "border border-white/10",
          "transition-all duration-200",
          "group",
          isHovered && "bg-white/10 border-white/20"
        )}
      >
        <div className="flex items-center gap-2">
          <item.icon className={cn("w-5 h-5 transition-colors", item.iconColor)} />
          <span className="text-sm font-medium text-white">
            {item.label}
          </span>
        </div>
      </motion.button>
      
      {/* Submenu */}
      <AnimatePresence>
        {isActive && item.children && (
          <SubMenu items={item.children} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}