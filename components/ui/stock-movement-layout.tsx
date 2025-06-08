import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

interface StockMovementLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  helpContent?: React.ReactNode;
  showHelp?: boolean;
  onToggleHelp?: () => void;
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
  loadingText = "Processing...",
  helpContent,
  showHelp = false,
  onToggleHelp
}: StockMovementLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Unified Header Area - Only show if title exists */}
        {title && (
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-400 mb-2">{title}</h1>
            {description && (
              <p className="text-lg text-gray-300">{description}</p>
            )}
            {onToggleHelp && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleHelp}
                className="mt-4 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900"
              >
                <Info className="w-4 h-4 mr-2" />
                {showHelp ? 'Hide Instructions' : 'Show Instructions'}
              </Button>
            )}
          </header>
        )}

        {/* Help button for pages without title */}
        {!title && onToggleHelp && (
          <div className="text-center mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleHelp}
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900"
            >
              <Info className="w-4 h-4 mr-2" />
              {showHelp ? 'Hide Instructions' : 'Show Instructions'}
            </Button>
          </div>
        )}

        {/* Instructions Area */}
        {showHelp && helpContent && (
          <Card className="mb-6 border-blue-400 bg-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              {helpContent}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6 border-yellow-400 bg-gray-800 text-white">
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <span className="text-yellow-400 font-medium">{loadingText}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <main className="space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusMessage({ type, message, onDismiss }: StatusMessageProps) {
  const styles = {
    success: {
      container: "border-green-400 bg-gray-800",
      icon: CheckCircle,
      iconColor: "text-green-400",
      textColor: "text-green-400"
    },
    error: {
      container: "border-red-500 bg-black animate-pulse",
      icon: XCircle,
      iconColor: "text-red-500 animate-pulse",
      textColor: "text-red-500 font-bold animate-pulse"
    },
    warning: {
      container: "border-yellow-400 bg-gray-800",
      icon: AlertCircle,
      iconColor: "text-yellow-400",
      textColor: "text-yellow-400"
    },
    info: {
      container: "border-blue-400 bg-gray-800",
      icon: Info,
      iconColor: "text-blue-400",
      textColor: "text-blue-400"
    }
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <Card className={`${style.container} mb-4 text-white shadow-lg ${type === 'error' ? 'shadow-red-500/50' : ''}`}>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-3">
          <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
          <span className={`${style.textColor} font-medium`}>{message}</span>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className={`${style.textColor} hover:bg-gray-700 ${type === 'error' ? 'hover:bg-red-900/30' : ''}`}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityLog({ 
  activities, 
  title = "Activity Log",
  maxHeight = "h-64" 
}: { 
  activities: Array<{ message: string; type: 'success' | 'error' | 'info'; timestamp?: string }>;
  title?: string;
  maxHeight?: string;
}) {
  return (
    <Card className="border-gray-600 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
          {activities.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No records found</p>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 p-2 rounded ${
                  activity.type === 'success'
                    ? 'bg-gray-700 text-green-400'
                    : activity.type === 'error'
                    ? 'bg-gray-700 text-red-400'
                    : 'bg-gray-700 text-blue-400'
                }`}
              >
                <span className="text-xs font-mono text-gray-400 mt-0.5">
                  {activity.timestamp || new Date().toLocaleTimeString()}
                </span>
                <span className="flex-1 text-sm">{activity.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 