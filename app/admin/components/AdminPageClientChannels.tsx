/**
 * Admin Page Client Component - Channel 版本
 * 使用 Channel 訂閱系統替代 grid layout
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { RefreshButton } from '../components/RefreshButton';
import { useAuth } from '@/app/hooks/useAuth';
import MotionBackground from '@/app/components/MotionBackground';
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { adminMenuItems } from '@/app/components/admin-panel/AdminMenu';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { ChannelGrid } from './dashboard/ChannelGrid';
import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import '../styles/channel-grid.css';

// Group menu items by category
const groupedItems = adminMenuItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof adminMenuItems>);

function AdminPageClientChannelsContent() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Dialog hooks
  const { openDialog } = useDialog();
  const { open: openReprintDialog } = useReprintDialog();

  // Void Pallet Hook for reprint functionality
  const {
    state: voidState,
    handleReprintInfoConfirm,
    handleReprintInfoCancel,
    getReprintType,
  } = useVoidPallet();

  // Handle reprint needed callback from VoidPalletDialog
  const handleReprintNeeded = useCallback((reprintInfo: any) => {
    console.log('Reprint needed:', reprintInfo);
    openReprintDialog(reprintInfo);
  }, [openReprintDialog]);

  // Handle reprint confirm
  const handleReprintConfirm = useCallback(async (reprintInfo: any) => {
    try {
      const reprintInfoInput = {
        type: reprintInfo.type,
        originalPalletInfo: reprintInfo.palletInfo,
        correctedProductCode: reprintInfo.correctedProductCode,
        correctedQuantity: reprintInfo.correctedQuantity,
        remainingQuantity: reprintInfo.reprintInfo?.remainingQuantity
      };
      
      console.log('Calling handleReprintInfoConfirm with:', reprintInfoInput);
      await handleReprintInfoConfirm(reprintInfoInput);
    } catch (error) {
      console.error('Reprint failed:', error);
    }
  }, [handleReprintInfoConfirm]);

  // Handle reprint cancel
  const handleReprintCancel = useCallback(() => {
    // Dialog will be closed by DialogManager
  }, []);

  // Handle item click with support for different actions
  const handleItemClick = (item: any) => {
    switch (item.action) {
      case 'void-pallet':
        openDialog('voidPallet');
        break;
      case 'view-history':
        openDialog('viewHistory');
        break;
      case 'database-update':
        openDialog('databaseUpdate');
        break;
      case 'upload-files-only':
        openDialog('uploadFilesOnly');
        break;
      case 'upload-order-pdf':
        openDialog('uploadOrderPdf');
        break;
      case 'product-spec':
        openDialog('productSpec');
        break;
      // Reports
      case 'void-pallet-report':
        window.dispatchEvent(new CustomEvent('openVoidPalletReport'));
        break;
      case 'order-loading-report':
        window.dispatchEvent(new CustomEvent('openOrderLoadingReport'));
        break;
      case 'stock-take-report':
        window.dispatchEvent(new CustomEvent('openStockTakeReport'));
        break;
      case 'aco-order-report':
        window.dispatchEvent(new CustomEvent('openAcoOrderReport'));
        break;
      case 'transaction-report':
        window.dispatchEvent(new CustomEvent('openTransactionReport'));
        break;
      case 'grn-report':
        window.dispatchEvent(new CustomEvent('openGrnReport'));
        break;
      case 'export-all-data':
        window.dispatchEvent(new CustomEvent('openExportAllData'));
        break;
      // Analytics
      case 'finished-transfer':
        window.dispatchEvent(new CustomEvent('openFinishedTransfer'));
        break;
      case 'order-trend':
        window.dispatchEvent(new CustomEvent('openOrderTrend'));
        break;
      case 'staff-workload':
        window.dispatchEvent(new CustomEvent('openStaffWorkload'));
        break;
      default:
        // No default action
    }
  };

  // Loading state
  if (loading) {
    return (
      <MotionBackground className="min-h-screen">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="text-lg mt-4">Loading...</p>
        </div>
      </MotionBackground>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <MotionBackground className="min-h-screen">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
          <p className="text-lg mb-6">Please log in to access the Admin Panel.</p>
          <button 
            onClick={() => router.push('/main-login')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </MotionBackground>
    );
  }

  // Main content
  return (
    <AdminRefreshProvider>
      <MotionBackground className="min-h-screen">
        <div className="text-white min-h-screen flex flex-col overflow-x-hidden relative z-10">
          {/* Admin Panel Navigation Bar */}
          <div className="bg-slate-800/40 backdrop-blur-xl border-y border-slate-700/50 fixed top-[96px] left-0 right-0 z-30">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Left side - Refresh button */}
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <RefreshButton
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
              </div>

              {/* Center - Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="relative group">
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 cursor-pointer">
                      {category}
                      <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </div>
                    
                    {/* Hover Dropdown */}
                    <div className="absolute top-full left-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl z-40 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      {items.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              handleItemClick(item);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-4 text-left hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl group/item ${item.color}`}
                          >
                            <div className="flex items-center gap-4">
                              <IconComponent className="w-5 h-5 group-hover/item:scale-110 transition-transform duration-300" />
                              <div>
                                <div className="text-sm font-medium">
                                  {item.title}
                                </div>
                                <div className="text-xs text-slate-400">{item.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right side - Mobile menu button */}
              <div className="flex items-center gap-2">
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300"
                  >
                    {isDropdownOpen ? (
                      <XMarkIcon className="w-6 h-6" />
                    ) : (
                      <Bars3Icon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden border-t border-slate-700/50 py-6"
                >
                  <div className="space-y-6 px-4 sm:px-6 lg:px-8">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {items.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  handleItemClick(item);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 rounded-xl transition-all duration-300 ${item.color}`}
                              >
                                <div className="flex items-center gap-4">
                                  <IconComponent className="w-5 h-5" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {item.title}
                                    </div>
                                    <div className="text-xs text-slate-400">{item.description}</div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-40 pb-24">
            <div className="max-w-screen-2xl mx-auto">
              <ChannelGrid />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-8 relative z-10">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>Pennine Manufacturing Stock Control System</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Dialog Manager */}
        <DialogManager
          onReprintNeeded={handleReprintNeeded}
          onReprintConfirm={handleReprintConfirm}
          onReprintCancel={handleReprintCancel}
          voidState={voidState}
        />
      </MotionBackground>
    </AdminRefreshProvider>
  );
}

// Export component with DialogProvider
export function AdminPageClientChannels() {
  return (
    <AdminPageClientChannelsContent />
  );
}