/**
 * Universal Stock Movement Layout
 * 使用新的 Universal Layout 系統，但 100% 保持現有外觀和行為
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { UniversalContainer } from '@/components/layout/universal';

interface StockMovementLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  helpContent?: React.ReactNode;
  showHelp?: boolean;
  onToggleHelp?: () => void;
  spotlight?: boolean;
  spotlightColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

export function StockMovementLayout({
  title,
  description,
  children,
  isLoading = false,
  loadingText = 'Processing...',
  helpContent,
  showHelp = false,
  onToggleHelp,
  spotlight = false,
  spotlightColor = 'blue',
}: StockMovementLayoutProps) {
  return (
    <UniversalContainer
      variant='page'
      background='transparent'
      padding='none'
      className='min-h-screen'
    >
      <div className='container mx-auto max-w-6xl px-4 py-8'>
        {/* Unified Header Area - Only show if title exists */}
        {title && (
          <header className='mb-8 text-center'>
            <h1 className='mb-2 text-4xl font-bold text-blue-400'>{title}</h1>
            {description && <p className='text-lg text-gray-300'>{description}</p>}
            {onToggleHelp && (
              <Button
                variant='outline'
                size='sm'
                onClick={onToggleHelp}
                className='mt-4 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900'
              >
                <Info className='mr-2 h-4 w-4' />
                {showHelp ? 'Hide Instructions' : 'Show Instructions'}
              </Button>
            )}
          </header>
        )}

        {/* Help button for pages without title */}
        {!title && onToggleHelp && (
          <div className='mb-8 text-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={onToggleHelp}
              className='border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900'
            >
              <Info className='mr-2 h-4 w-4' />
              {showHelp ? 'Hide Instructions' : 'Show Instructions'}
            </Button>
          </div>
        )}

        {/* Instructions Area */}
        {showHelp && helpContent && (
          <Card
            className='mb-6 border-blue-400 bg-gray-800 text-white'
            spotlight={spotlight}
            spotlightColor={spotlightColor}
          >
            <CardHeader>
              <CardTitle className='flex items-center text-blue-400'>
                <Info className='mr-2 h-5 w-5' />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className='text-gray-300'>{helpContent}</CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card
            className='mb-6 border-yellow-400 bg-gray-800 text-white'
            spotlight={spotlight}
            spotlightColor={spotlightColor}
          >
            <CardContent className='flex items-center justify-center py-8'>
              <div className='flex items-center space-x-3'>
                <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-yellow-400'></div>
                <span className='font-medium text-yellow-400'>{loadingText}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <main className='space-y-6'>{children}</main>
      </div>
    </UniversalContainer>
  );
}

export function StatusMessage({ type, message, onDismiss }: StatusMessageProps) {
  const styles = {
    success: {
      container: 'border-green-400 bg-gray-800',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      textColor: 'text-green-400',
    },
    error: {
      container: 'border-red-500 bg-black animate-pulse',
      icon: XCircle,
      iconColor: 'text-red-500 animate-pulse',
      textColor: 'text-red-500 font-bold animate-pulse',
    },
    warning: {
      container: 'border-yellow-400 bg-gray-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-400',
    },
    info: {
      container: 'border-blue-400 bg-gray-800',
      icon: Info,
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
    },
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <Card
      className={`${style.container} mb-4 text-white shadow-lg ${type === 'error' ? 'shadow-red-500/50' : ''}`}
    >
      <CardContent className='flex items-center justify-between py-3'>
        <div className='flex items-center space-x-3'>
          <IconComponent className={`h-5 w-5 ${style.iconColor}`} />
          <span className={`${style.textColor} font-medium`}>{message}</span>
        </div>
        {onDismiss && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onDismiss}
            className={`${style.textColor} hover:bg-gray-700 ${type === 'error' ? 'hover:bg-red-900/30' : ''}`}
          >
            <XCircle className='h-4 w-4' />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityLog({
  activities,
  title = 'Activity Log',
  maxHeight = 'h-64',
}: {
  activities: Array<{ message: string; type: 'success' | 'error' | 'info'; timestamp?: string }>;
  title?: string;
  maxHeight?: string;
}) {
  return (
    <Card className='border-gray-600 bg-gray-800 text-white'>
      <CardHeader>
        <CardTitle className='text-blue-400'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
          {activities.length === 0 ? (
            <p className='py-4 text-center text-gray-400'>No records found</p>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 rounded p-2 ${
                  activity.type === 'success'
                    ? 'bg-gray-700 text-green-400'
                    : activity.type === 'error'
                      ? 'bg-gray-700 text-red-400'
                      : 'bg-gray-700 text-blue-400'
                }`}
              >
                <span className='mt-0.5 font-mono text-xs text-gray-400'>
                  {activity.timestamp || new Date().toLocaleTimeString()}
                </span>
                <span className='flex-1 text-sm'>{activity.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
