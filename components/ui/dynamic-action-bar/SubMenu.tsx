'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SubNavigationItem } from '@/config/navigation';

interface SubMenuProps {
  items: SubNavigationItem[];
}

export function SubMenu({ items }: SubMenuProps) {
  const menuVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { 
      x: 0, 
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
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
        "min-w-[200px]",
        "bg-black/90 backdrop-blur-xl",
        "rounded-xl border border-white/10",
        "shadow-2xl",
        "p-2",
        "z-10"
      )}
    >
      <div className="space-y-1">
        {items.map((child) => (
          <motion.div key={child.id} variants={itemVariants}>
            <Link
              href={child.href}
              className={cn(
                "block px-4 py-2.5",
                "rounded-lg",
                "hover:bg-white/10",
                "transition-colors duration-200",
                "group"
              )}
            >
              <div className="text-sm font-medium text-white group-hover:text-white">
                {child.label}
              </div>
              {child.description && (
                <div className="text-xs text-gray-400 group-hover:text-gray-300 mt-0.5">
                  {child.description}
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}