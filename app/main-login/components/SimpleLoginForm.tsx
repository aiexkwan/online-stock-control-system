'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { unifiedAuth } from '../utils/unified-auth';

export default function SimpleLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.endsWith('@pennineindustries.com')) {
      setError('Only @pennineindustries.com email addresses are allowed');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await unifiedAuth.signIn(email, password);
      
      // 等待一小段時間確保 session 建立
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/access');
    } catch (err: any) {
      console.error('[SimpleLoginForm] Sign in failed:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 bg-red-900/50 border border-red-500/50 rounded-xl backdrop-blur-sm"
        >
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            placeholder="your.name@pennineindustries.com"
            disabled={isLoading}
          />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            placeholder="Enter your password"
            disabled={isLoading}
          />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type="submit"
          disabled={isLoading}
          className="relative w-full group overflow-hidden"
        >
          {/* Button background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Button content */}
          <div className="relative bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm border border-blue-500/30 rounded-xl py-3 px-4 text-white font-medium transition-all duration-300 group-hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? (
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Signing in...
            </div>
          ) : (
              <span className="flex items-center justify-center">
                Sign In
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
          )}
          </div>
        </motion.button>
      </form>
    </div>
  );
} 