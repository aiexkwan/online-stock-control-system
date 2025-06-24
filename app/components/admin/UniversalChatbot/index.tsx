'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';
import './styles.css';

interface UniversalChatbotProps {
  className?: string;
}

export default function UniversalChatbot({ className }: UniversalChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 清除未讀計數
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleNewMessage = () => {
    if (!isOpen && !isMinimized) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <>
      {/* 浮動按鈕 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-14 h-14 rounded-full",
              "bg-purple-500 hover:bg-purple-600",
              "shadow-lg shadow-purple-500/25",
              "flex items-center justify-center",
              "transition-colors duration-200",
              "group",
              className
            )}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            
            {/* 未讀計數 */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-xs text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
            
            {/* 懸停效果 */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 聊天界面 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-full max-w-md h-[600px]",
              "bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-700/50",
              "rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden",
              "md:w-[420px]",
              isMinimized && "h-14",
              className
            )}
          >
            {/* 頂部欄 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-0.5 -right-0.5" />
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Pennine Assistant</h3>
                  <p className="text-xs text-slate-400">Always here to help</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <Minimize2 className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* 聊天內容 */}
            {!isMinimized && (
              <ChatInterface onNewMessage={handleNewMessage} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}