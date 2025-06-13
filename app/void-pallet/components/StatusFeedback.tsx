'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StatusMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  autoClose?: boolean;
  duration?: number;
}

interface StatusFeedbackProps {
  messages: StatusMessage[];
  onClose: (id: string) => void;
}

export function StatusFeedback({ messages, onClose }: StatusFeedbackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {messages.map((message) => (
          <StatusMessageItem
            key={message.id}
            message={message}
            onClose={() => onClose(message.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusMessageItem({ 
  message, 
  onClose 
}: { 
  message: StatusMessage; 
  onClose: () => void;
}) {
  const { type, title, description, actions, autoClose = true, duration = 5000 } = message;

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-800 shadow-green-900/30';
      case 'error':
        return 'bg-red-900/20 border-red-800 shadow-red-900/30';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-800 shadow-yellow-900/30';
      case 'info':
        return 'bg-blue-900/20 border-blue-800 shadow-blue-900/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        relative backdrop-blur-xl border rounded-xl p-4 shadow-lg
        ${getStyles()}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-grow">
          <h4 className="text-sm font-medium text-white">
            {title}
          </h4>
          
          {description && (
            <p className="mt-1 text-xs text-gray-300">
              {description}
            </p>
          )}
          
          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Progress bar for auto-close */}
      {autoClose && duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 origin-left rounded-b-xl"
        />
      )}
    </motion.div>
  );
}

// Hook for managing status messages
export function useStatusMessages() {
  const [messages, setMessages] = React.useState<StatusMessage[]>([]);

  const addMessage = React.useCallback((message: Omit<StatusMessage, 'id'>) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  }, []);

  const removeMessage = React.useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const clearAllMessages = React.useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    removeMessage,
    clearAllMessages,
  };
}