'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Zap, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from './ChatInterface';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

export default function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'complex': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "flex",
        message.type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        "flex gap-3 max-w-[85%]",
        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* 頭像 */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          message.type === 'user' 
            ? 'bg-blue-500/20 text-blue-300' 
            : 'bg-purple-500/20 text-purple-300'
        )}>
          {message.type === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* 訊息內容 */}
        <div className={cn(
          "flex flex-col",
          message.type === 'user' ? 'items-end' : 'items-start'
        )}>
          <div className={cn(
            "rounded-2xl px-4 py-3 max-w-full",
            message.type === 'user'
              ? 'bg-blue-600/80 text-white rounded-br-md'
              : 'bg-slate-800/80 text-slate-100 rounded-bl-md'
          )}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{message.content}</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
          
          {/* 訊息元數據 */}
          <div className={cn(
            "flex items-center gap-2 mt-1 text-xs text-slate-400",
            message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}>
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            
            {message.metadata && (
              <>
                {message.metadata.cached && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs py-0 px-1.5">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Cached
                  </Badge>
                )}
                {message.metadata.complexity && (
                  <Badge className={cn(getComplexityColor(message.metadata.complexity), "text-xs py-0 px-1.5")}>
                    {message.metadata.complexity}
                  </Badge>
                )}
                {message.metadata.executionTime && (
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs py-0 px-1.5">
                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                    {formatExecutionTime(message.metadata.executionTime)}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}