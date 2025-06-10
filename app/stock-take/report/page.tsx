'use client';

import React from 'react';
import { motion } from 'framer-motion';
import MotionBackground from '@/app/components/MotionBackground';
import StockTakeNav from '../components/StockTakeNav';
import { DocumentChartBarIcon } from '@heroicons/react/24/outline';

export default function StockReportPage() {
  return (
    <MotionBackground>
      <div className="text-white">
        <StockTakeNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex flex-col items-center">
              <DocumentChartBarIcon className="h-16 w-16 text-blue-400 mb-4" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-6">
                Stock Count Report
              </h1>
              <p className="text-slate-300 max-w-2xl text-center mb-8">
                View and analyze inventory count reports and discrepancies.
              </p>
              
              <div className="w-full max-w-3xl bg-slate-800/50 border border-slate-600/50 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-center h-40">
                  <p className="text-slate-400 text-center">
                    Stock count reporting functionality will be implemented here.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionBackground>
  );
} 