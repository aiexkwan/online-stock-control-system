/**
 * SidebarNavigation Component
 * Left sidebar navigation for admin dashboard
 */

'use client';

import React from 'react';
import { TabButton } from './TabButton';
import { 
  CubeIcon, 
  BuildingStorefrontIcon, 
  ArchiveBoxIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ANIMATIONS } from '../../config/animations';

export type TabType = 'production' | 'warehouse' | 'inventory' | 'update' | 'search';

interface Tab {
  id: TabType;
  name: string;
  icon: React.ComponentType<any>;
  variant: TabType;
}

const tabs: Tab[] = [
  {
    id: 'production',
    name: 'Production',
    icon: CubeIcon,
    variant: 'production'
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    icon: BuildingStorefrontIcon,
    variant: 'warehouse'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: ArchiveBoxIcon,
    variant: 'inventory'
  },
  {
    id: 'update',
    name: 'Update/Upload',
    icon: ArrowUpTrayIcon,
    variant: 'update'
  },
  {
    id: 'search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
    variant: 'search'
  }
];

interface SidebarNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

export function SidebarNavigation({
  activeTab,
  onTabChange,
  className
}: SidebarNavigationProps) {
  return (
    <motion.div
      className={cn(
        'sidebar-navigation',
        'w-64 h-full',
        'bg-[#18181C]',
        'border-r border-[#23232A]/40',
        'flex flex-col',
        className
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={ANIMATIONS.fadeInScale.transition}
    >
      {/* Logo/Header */}
      <div className="p-6 border-b border-[#23232A]/30">
        <h1 className="text-xl font-bold text-[#EAEAEA]">
          Stock Control System
        </h1>
        <p className="text-xs text-[#8E8EA0] mt-1">
          Admin Dashboard
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                ...ANIMATIONS.fadeUpCell.transition,
                delay: index * 0.1
              }}
            >
              <TabButton
                id={tab.id}
                name={tab.name}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                variant={tab.variant}
              />
            </motion.div>
          ))}
        </div>
      </nav>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-[#23232A]/30">
        <div className="text-xs text-[#8E8EA0] space-y-1">
          <p>Version 2.0.0</p>
          <p>{new Date().toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
          })}</p>
        </div>
      </div>
      
      {/* Gradient accent line */}
      <style jsx>{`
        .sidebar-navigation::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(255, 255, 255, 0.1) 20%,
            rgba(255, 255, 255, 0.1) 80%,
            transparent
          );
        }
      `}</style>
    </motion.div>
  );
}