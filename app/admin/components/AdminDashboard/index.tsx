'use client';

import React from 'react';
import { ChartBarIcon, TruckIcon } from '@heroicons/react/24/outline';
import { StatsCard } from '../StatsCard';
import { AcoOrderProgress } from '../AcoOrderProgress';
import { QuickSearch } from '../QuickSearch';
import { VoidStatisticsCard } from '@/app/components/VoidStatisticsCard';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';
import FinishedProduct from '@/app/components/PrintHistory';
import MaterialReceived from '@/app/components/GrnHistory';
import PalletDonutChart from '@/app/components/PalletDonutChart';
import { useDashboardStats, useRealtimeStats, useTimeRange } from '../../hooks/useAdminDashboard';
import { motion } from 'framer-motion';
import { useAskDatabasePermission } from '@/app/hooks/useAuth';

export function AdminDashboard() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const hasPermission = useAskDatabasePermission();
  const donutTimeRange = useTimeRange('Today');
  
  // Enable real-time updates
  useRealtimeStats();

  const getDonutChartData = () => {
    switch (donutTimeRange.timeRange) {
      case 'Today':
        return {
          palletsDone: stats.dailyDonePallets,
          palletsTransferred: stats.dailyTransferredPallets
        };
      case 'Yesterday':
        return {
          palletsDone: stats.yesterdayDonePallets,
          palletsTransferred: stats.yesterdayTransferredPallets
        };
      case 'Past 3 days':
        return {
          palletsDone: stats.past3DaysGenerated,
          palletsTransferred: stats.past3DaysTransferredPallets
        };
      case 'Past 7 days':
        return {
          palletsDone: stats.past7DaysGenerated,
          palletsTransferred: stats.past7DaysTransferredPallets
        };
      default:
        return {
          palletsDone: stats.dailyDonePallets,
          palletsTransferred: stats.dailyTransferredPallets
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ask Database Card - 3 columns if permitted */}
        {hasPermission && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="lg:col-span-3 z-10"
          >
            <AskDatabaseInlineCard />
          </motion.div>
        )}

        {/* Statistics Column */}
        <div className={hasPermission ? 'lg:col-span-1' : 'lg:col-span-4'}>
          <div className="flex flex-col gap-4">
            {/* Output Card */}
            <StatsCard
              title="Output"
              icon={<ChartBarIcon className="w-4 h-4 mr-2" />}
              stats={stats}
              type="generated"
              colorScheme={{
                gradient: "bg-gradient-to-r from-slate-800/50 to-purple-900/30",
                text: "text-purple-300",
                hover: "hover:border-purple-500/30 shadow-purple-900/20"
              }}
              loading={statsLoading}
            />

            {/* Booked Out Card */}
            <StatsCard
              title="Booked Out"
              icon={<TruckIcon className="w-4 h-4 mr-2" />}
              stats={stats}
              type="transferred"
              colorScheme={{
                gradient: "bg-gradient-to-r from-slate-800/50 to-green-900/30",
                text: "text-green-300",
                hover: "hover:border-green-500/30 shadow-green-900/20"
              }}
              loading={statsLoading}
            />

            {/* Overview Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-[2]">
              <div className="relative group z-30 h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-xl blur-xl"></div>
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300 z-30 h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  <div className="relative z-30 h-full flex items-center justify-center">
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-40">
                      <h3 className="text-sm font-medium text-slate-200">{donutTimeRange.timeRange} Overview</h3>
                    </div>
                    
                    <div className="w-24 h-24">
                      <PalletDonutChart 
                        palletsDone={getDonutChartData().palletsDone}
                        palletsTransferred={getDonutChartData().palletsTransferred}
                        loading={statsLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Finished Product */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
              
              <div className="relative z-10">
                <FinishedProduct />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Material Received */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
              
              <div className="relative z-10">
                <MaterialReceived />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACO Order Progress */}
        <AcoOrderProgress />

        {/* Quick Search */}
        <QuickSearch />

        {/* Void Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <VoidStatisticsCard />
        </motion.div>
      </div>
    </div>
  );
}