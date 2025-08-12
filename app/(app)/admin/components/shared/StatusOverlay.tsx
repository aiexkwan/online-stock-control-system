/**
 * StatusOverlay Component
 * 
 * Unified status display component for all card components
 * Supports success/error/warning/info/progress states
 * Supports full-screen overlay and modal dialog modes
 * Supports auto-dismiss and manual close
 * 
 * @example
 * // Full-screen success overlay
 * <StatusOverlay
 *   open={true}
 *   status="success"
 *   title="Success"
 *   message="Operation completed successfully"
 *   onClose={() => setOpen(false)}
 *   autoClose={3000}
 * />
 * 
 * @example
 * // Progress modal
 * <StatusOverlay
 *   open={true}
 *   status="progress"
 *   title="Processing"
 *   message="Please wait..."
 *   progress={50}
 *   mode="modal"
 * />
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'progress';
export type DisplayMode = 'fullscreen' | 'modal';

export interface StatusOverlayProps {
  /**
   * Whether the overlay is open
   */
  open: boolean;
  
  /**
   * Status type
   */
  status: StatusType;
  
  /**
   * Display mode
   * @default 'fullscreen'
   */
  mode?: DisplayMode;
  
  /**
   * Title text
   */
  title?: string;
  
  /**
   * Message text
   */
  message?: string;
  
  /**
   * Sub-message or details
   */
  details?: string | React.ReactNode;
  
  /**
   * Progress percentage (0-100)
   * Only used when status is 'progress'
   */
  progress?: number;
  
  /**
   * Progress label
   */
  progressLabel?: string;
  
  /**
   * Icon to display (overrides default status icon)
   */
  icon?: React.ReactNode;
  
  /**
   * Auto close delay in milliseconds
   * If not provided, overlay will not auto close
   */
  autoClose?: number;
  
  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Custom action buttons
   */
  actions?: React.ReactNode;
  
  /**
   * Close handler
   */
  onClose?: () => void;
  
  /**
   * Click outside handler (for fullscreen mode)
   */
  onClickOutside?: () => void;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Z-index
   * @default 50
   */
  zIndex?: number;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  progress: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
};

export const StatusOverlay: React.FC<StatusOverlayProps> = ({
  open,
  status,
  mode = 'fullscreen',
  title,
  message,
  details,
  progress,
  progressLabel,
  icon,
  autoClose,
  showCloseButton = true,
  actions,
  onClose,
  onClickOutside,
  className,
  zIndex = 50,
}) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const config = statusConfig[status];
  const IconComponent = config.icon;
  
  // Auto close effect
  useEffect(() => {
    if (open && autoClose && onClose) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoClose);
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [open, autoClose, onClose]);
  
  // Handle click outside for fullscreen mode
  const handleBackdropClick = () => {
    if (mode === 'fullscreen' && onClickOutside) {
      onClickOutside();
    } else if (mode === 'fullscreen' && status === 'success' && onClose) {
      // Auto close on click for success in fullscreen mode
      onClose();
    }
  };
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 flex items-center justify-center',
            mode === 'fullscreen' ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/50',
            className
          )}
          style={{ zIndex }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative',
              mode === 'modal' && 'bg-gray-900 rounded-xl p-8 w-96 shadow-2xl border border-gray-700'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button for modal mode */}
            {mode === 'modal' && showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            <div className={cn(
              'text-center',
              mode === 'modal' && 'space-y-6'
            )}>
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full',
                  config.bgColor
                )}>
                  {icon || (
                    <IconComponent 
                      className={cn(
                        'h-12 w-12',
                        config.color,
                        status === 'progress' && 'animate-spin'
                      )}
                    />
                  )}
                </div>
              </div>
              
              {/* Title and message */}
              <div className="mb-8">
                {title && (
                  <h2 className={cn(
                    'text-3xl font-bold mb-2',
                    mode === 'modal' ? 'text-white' : config.color
                  )}>
                    {title}
                  </h2>
                )}
                {message && (
                  <p className={cn(
                    'text-lg',
                    mode === 'modal' ? 'text-gray-300' : 'text-white/80'
                  )}>
                    {message}
                  </p>
                )}
                {details && (
                  <div className="mt-4 text-sm text-gray-400">
                    {details}
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              {status === 'progress' && progress !== undefined && (
                <div className="space-y-2 mb-6">
                  <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{progress}% complete</span>
                    {progressLabel && (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-blue-400"
                      >
                        {progressLabel}
                      </motion.span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {actions || (onClose && status !== 'progress') ? (
                <div className="flex justify-center gap-3">
                  {actions || (
                    <Button
                      variant="outline"
                      size="lg"
                      className={cn(
                        'min-w-[200px]',
                        mode === 'fullscreen' 
                          ? 'text-white border-white/20 hover:bg-white/10'
                          : 'border-gray-600 hover:bg-gray-800'
                      )}
                      onClick={onClose}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusOverlay;