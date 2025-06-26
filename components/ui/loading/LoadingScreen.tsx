/**
 * Unified Loading Screen Component
 * 統一嘅載入畫面組件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  showMessages?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  children,
  loadingText = "Loading",
  showMessages = true
}) => {
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (!isLoading) {
      // Remove delay for instant content reveal
      setShowContent(true);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Semi-transparent overlay for better readability */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Loading Content */}
            <div className="relative z-10 text-center">
              {/* Logo or Brand */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="mb-8"
              >
                <div className="w-24 h-24 mx-auto mb-4">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>

              {/* Loading Text */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                className="text-2xl font-semibold text-white mb-4"
              >
                {loadingText}
              </motion.h2>

              {/* Progress Dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                className="flex justify-center gap-2"
              >
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: index * 0.1,
                    }}
                  />
                ))}
              </motion.div>

              {/* Loading Messages */}
              {showMessages && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.1 }}
                  className="mt-8"
                >
                  <LoadingMessages />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Fade In */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

// Loading Messages Component
const LoadingMessages: React.FC = () => {
  const messages = [
    "Initializing components...",
    "Loading your data...",
    "Preparing interface...",
    "Almost there...",
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 500);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-sm text-gray-400"
      >
        {messages[currentMessage]}
      </motion.p>
    </AnimatePresence>
  );
};

// Skeleton Loading Component for gradual content reveal
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${className} animate-pulse`}
    >
      <div className="bg-slate-800/50 rounded-lg p-6 h-full">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
      </div>
    </motion.div>
  );
};

// Fade In Container for individual elements
export const FadeInContainer: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.1, 0.25, 1] // Custom easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};