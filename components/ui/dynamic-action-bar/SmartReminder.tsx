'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Bell, X, Clock, TrendingUp } from 'lucide-react';
import { enhancedBehaviorTracker } from '@/lib/navigation/behavior-tracker';
import { getNavigationInfo } from '@/config/navigation-map';
import { cn } from '@/lib/utils';

interface SmartReminderProps {
  userId: string;
  className?: string;
}

interface Reminder {
  id: string;
  type: 'time-based' | 'pattern-based';
  message: string;
  action?: {
    label: string;
    path: string;
  };
  icon?: React.ElementType;
}

export function SmartReminder({ userId, className }: SmartReminderProps) {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  const checkTimeBasedReminders = useCallback(async () => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    
    // Get user patterns
    const patterns = await enhancedBehaviorTracker.getTimeBasedPatterns(userId);
    
    // Check if current hour is one of the most active hours
    if (patterns.mostActiveHours.includes(currentHour)) {
      const suggestedPaths = patterns.hourlyPatterns[currentHour] || [];
      
      if (suggestedPaths.length > 0) {
        const topPath = suggestedPaths[0];
        
        // Get navigation info
        const navInfo = getNavigationInfo(topPath);
        const label = navInfo.label;
        
        const reminderId = `time-${currentHour}-${topPath}`;
        
        // Don't show if already dismissed today
        if (!dismissed.has(reminderId)) {
          setReminder({
            id: reminderId,
            type: 'time-based',
            message: `Time to check ${label}?`,
            action: {
              label: `Go to ${label}`,
              path: topPath
            },
            icon: Clock
          });
        }
      }
    }
    
    // Special morning reminder (9:00 AM)
    if (currentHour === 9 && currentMinute < 5) {
      const morningPaths = patterns.hourlyPatterns[9] || [];
      if (morningPaths.includes('/admin/warehouse')) {
        const reminderId = 'morning-warehouse';
        if (!dismissed.has(reminderId)) {
          setReminder({
            id: reminderId,
            type: 'time-based',
            message: 'Good morning! Ready to check warehouse status?',
            action: {
              label: 'Open Warehouse',
              path: '/admin/warehouse'
            },
            icon: TrendingUp
          });
        }
      }
    }
    
    // End of day summary (5:00 PM)
    if (currentHour === 17 && currentMinute < 5) {
      const reminderId = 'evening-summary';
      if (!dismissed.has(reminderId)) {
        setReminder({
          id: reminderId,
          type: 'time-based',
          message: 'End of day - Check today\'s analysis?',
          action: {
            label: 'View Analysis',
            path: '/admin/analysis'
          },
          icon: TrendingUp
        });
      }
    }
  }, [userId, dismissed]);

  useEffect(() => {
    if (!userId) return;
    
    // Check immediately
    checkTimeBasedReminders();
    
    // Check every minute
    const interval = setInterval(checkTimeBasedReminders, 60000);
    
    return () => clearInterval(interval);
  }, [userId, checkTimeBasedReminders]);

  const handleAction = () => {
    if (reminder?.action) {
      router.push(reminder.action.path);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    if (reminder) {
      setDismissed(prev => new Set(prev).add(reminder.id));
      setReminder(null);
    }
  };

  if (!reminder) return null;

  const Icon = reminder.icon || Bell;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className={cn(
          "fixed bottom-24 right-4 z-50",
          "bg-black/90 backdrop-blur-xl",
          "rounded-2xl border border-white/20",
          "shadow-2xl",
          "p-4",
          "max-w-sm",
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-white text-sm font-medium mb-2">
              {reminder.message}
            </p>
            
            {reminder.action && (
              <button
                onClick={handleAction}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {reminder.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
                          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-2xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 10, ease: 'linear' }}
          onAnimationComplete={handleDismiss}
        />
      </motion.div>
    </AnimatePresence>
  );
}