'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  NoSymbolIcon, 
  ClockIcon, 
  DocumentArrowDownIcon, 
  ChatBubbleLeftRightIcon,
  CubeIcon,
  KeyIcon,
  ChevronDownIcon,
  ChartBarIcon,
  TruckIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  RectangleStackIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  CloudArrowUpIcon,
  FolderOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ReportsButton } from '@/app/components/reports/ReportsButton';
import { AnalyticsButton } from '@/app/components/analytics/AnalyticsButton';
import { AnalyticsDashboardDialog } from '@/app/components/analytics/AnalyticsDashboardDialog';
import { useAuth } from '@/app/hooks/useAuth';
import MotionBackground from '../components/MotionBackground';
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { adminMenuItems } from '@/app/components/admin-panel/AdminMenu';

// Import dashboard components
import FinishedProduct from '@/app/components/PrintHistory';
import MaterialReceived from '@/app/components/GrnHistory';
import PalletDonutChart from '@/app/components/PalletDonutChart';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { useAskDatabasePermission } from '@/app/hooks/useAuth';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';
import { VoidStatisticsCard } from '@/app/components/VoidStatisticsCard';

// 使用從 AdminMenu 導入的 adminMenuItems
const groupedItems = adminMenuItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof adminMenuItems>);

interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  yesterdayDonePallets: number;
  yesterdayTransferredPallets: number;
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
  past7DaysGenerated: number;
  past7DaysTransferredPallets: number;
}

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
  latest_update: string;
}

interface AcoOrderProgress {
  code: string;
  required_qty: number;
  remain_qty: number;
  completed_qty: number;
  completion_percentage: number;
}

interface InventoryLocation {
  product_code: string;
  injection: number;
  pipeline: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  total: number;
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const hasAskDatabasePermission = useAskDatabasePermission();
  const supabase = createClient();
  
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
    yesterdayDonePallets: 0,
    yesterdayTransferredPallets: 0,
    past3DaysGenerated: 0,
    past3DaysTransferredPallets: 0,
    past7DaysGenerated: 0,
    past7DaysTransferredPallets: 0,
  });
  const [donutTimeRange, setDonutTimeRange] = useState<string>('Past 3 days');
  const [outputTimeRange, setOutputTimeRange] = useState<string>('Today');
  const [bookedOutTimeRange, setBookedOutTimeRange] = useState<string>('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
  const [isBookedOutDropdownOpen, setIsBookedOutDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeRangeDropdownRef = useRef<HTMLDivElement>(null);
  const outputDropdownRef = useRef<HTMLDivElement>(null);
  const bookedOutDropdownRef = useRef<HTMLDivElement>(null);

  // ACO Orders state
  const [incompleteOrders, setIncompleteOrders] = useState<AcoOrder[]>([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState<number | null>(null);
  const [orderProgress, setOrderProgress] = useState<AcoOrderProgress[]>([]);
  const [isAcoDropdownOpen, setIsAcoDropdownOpen] = useState(false);
  const [acoLoading, setAcoLoading] = useState(false);
  const acoDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<InventoryLocation | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);


  // Use Dialog Context
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
      // 構造正確的 ReprintInfoInput 格式
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

  // Helper function to get data based on selected time range
  const getDonutChartData = () => {
    switch (donutTimeRange) {
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
      case 'Past 7 days':
        return {
          palletsDone: stats.past7DaysGenerated,
          palletsTransferred: stats.past7DaysTransferredPallets
        };
      case 'Past 3 days':
      default:
        return {
          palletsDone: stats.past3DaysGenerated,
          palletsTransferred: stats.past3DaysTransferredPallets
        };
    }
  };

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      const today = new Date();
      
      // Define time ranges
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
      const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).toISOString();
      
      const past3DaysStart = new Date(today);
      past3DaysStart.setDate(today.getDate() - 3);
      past3DaysStart.setHours(0, 0, 0, 0);
      
      const past7DaysStart = new Date(today);
      past7DaysStart.setDate(today.getDate() - 7);
      past7DaysStart.setHours(0, 0, 0, 0);

      // Load all data in parallel
      const [
        todayDoneResult,
        todayPalletsResult,
        yesterdayDoneResult,
        yesterdayPalletsResult,
        past3DaysDoneResult,
        past3DaysPalletsResult,
        past7DaysDoneResult,
        past7DaysPalletsResult
      ] = await Promise.all([
        // Today's generated pallets
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', todayStart)
          .lte('generate_time', todayEnd)
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Today's pallets for transfer calculation
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', todayStart)
          .lte('generate_time', todayEnd)
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Yesterday's generated pallets
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', yesterdayStart)
          .lte('generate_time', yesterdayEnd)
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Yesterday's pallets for transfer calculation
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', yesterdayStart)
          .lte('generate_time', yesterdayEnd)
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Past 3 days generated pallets
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', past3DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Past 3 days pallets for transfer calculation
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', past3DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Past 7 days generated pallets
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', past7DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%'),
        
        // Past 7 days pallets for transfer calculation
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', past7DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%')
      ]);

      // Check for errors
      const results = [
        todayDoneResult, todayPalletsResult, yesterdayDoneResult, yesterdayPalletsResult,
        past3DaysDoneResult, past3DaysPalletsResult, past7DaysDoneResult, past7DaysPalletsResult
      ];
      
      if (results.some(result => result.error)) {
        throw new Error('Error loading statistics');
      }

      // Helper function to calculate transferred pallets
      const calculateTransferredPallets = async (palletNums: string[]) => {
        if (!palletNums || palletNums.length === 0) return 0;
        
        const transferredResult = await supabase
          .from('record_transfer')
          .select('plt_num')
          .in('plt_num', palletNums);

        if (transferredResult.error) throw transferredResult.error;
        
        const uniqueTransferredPallets = new Set(transferredResult.data?.map(r => r.plt_num) || []);
        return uniqueTransferredPallets.size;
      };

      // Calculate transferred counts for all time ranges
      const [
        todayTransferredCount,
        yesterdayTransferredCount,
        past3DaysTransferredCount,
        past7DaysTransferredCount
      ] = await Promise.all([
        calculateTransferredPallets(todayPalletsResult.data?.map(p => p.plt_num) || []),
        calculateTransferredPallets(yesterdayPalletsResult.data?.map(p => p.plt_num) || []),
        calculateTransferredPallets(past3DaysPalletsResult.data?.map(p => p.plt_num) || []),
        calculateTransferredPallets(past7DaysPalletsResult.data?.map(p => p.plt_num) || [])
      ]);

      setStats({
        dailyDonePallets: todayDoneResult.count || 0,
        dailyTransferredPallets: todayTransferredCount,
        yesterdayDonePallets: yesterdayDoneResult.count || 0,
        yesterdayTransferredPallets: yesterdayTransferredCount,
        past3DaysGenerated: past3DaysDoneResult.count || 0,
        past3DaysTransferredPallets: past3DaysTransferredCount,
        past7DaysGenerated: past7DaysDoneResult.count || 0,
        past7DaysTransferredPallets: past7DaysTransferredCount,
      });

    } catch (err: any) {
      console.error('[Admin Panel] Error loading stats:', err);
      toast.error(`Failed to load statistics: ${err.message}`);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load incomplete ACO orders
  const loadIncompleteAcoOrders = async () => {
    try {
      setAcoLoading(true);
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .gt('remain_qty', 0)
        .order('order_ref', { ascending: false });

      if (error) throw error;

      setIncompleteOrders(data || []);
    } catch (err: any) {
      console.error('[Admin Panel] Error loading ACO orders:', err);
      toast.error(`Failed to load ACO orders: ${err.message}`);
    } finally {
      setAcoLoading(false);
    }
  };

  // Load progress for selected ACO order
  const loadAcoOrderProgress = async (orderRef: number) => {
    try {
      setAcoLoading(true);
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .eq('order_ref', orderRef);

      if (error) throw error;

      const progress: AcoOrderProgress[] = (data || []).map(item => ({
        code: item.code,
        required_qty: item.required_qty,
        remain_qty: item.remain_qty,
        completed_qty: item.required_qty - item.remain_qty,
        completion_percentage: Math.round(((item.required_qty - item.remain_qty) / item.required_qty) * 100)
      }));

      setOrderProgress(progress);
    } catch (err: any) {
      console.error('[Admin Panel] Error loading order progress:', err);
      toast.error(`Failed to load order progress: ${err.message}`);
    } finally {
      setAcoLoading(false);
    }
  };

  // Handle ACO order selection
  const handleAcoOrderSelect = (orderRef: number) => {
    setSelectedOrderRef(orderRef);
    setIsAcoDropdownOpen(false);
    loadAcoOrderProgress(orderRef);
  };

  // Search inventory by product code
  const searchInventory = async (productCode: string) => {
    if (!productCode.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('record_inventory')
        .select('*')
        .eq('product_code', productCode.toUpperCase());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: 0,
          pipeline: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          damage: 0,
          total: 0
        });
      } else {
        const aggregated = data.reduce((sum, record) => ({
          injection: sum.injection + (record.injection || 0),
          pipeline: sum.pipeline + (record.pipeline || 0),
          await: sum.await + (record.await || 0),
          fold: sum.fold + (record.fold || 0),
          bulk: sum.bulk + (record.bulk || 0),
          backcarpark: sum.backcarpark + (record.backcarpark || 0),
          damage: sum.damage + (record.damage || 0)
        }), {
          injection: 0,
          pipeline: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          damage: 0
        });

        const total = aggregated.injection + aggregated.pipeline + aggregated.await + 
                     aggregated.fold + aggregated.bulk + aggregated.backcarpark + aggregated.damage;
        
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: aggregated.injection,
          pipeline: aggregated.pipeline,
          await: aggregated.await,
          fold: aggregated.fold,
          bulk: aggregated.bulk,
          backcarpark: aggregated.backcarpark,
          damage: aggregated.damage,
          total: total
        });
      }
    } catch (err: any) {
      console.error('[Admin Panel] Error searching inventory:', err);
      toast.error(`Search failed: ${err.message}`);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchInventory(searchQuery);
  };

  // Handle donut chart time range change
  const handleDonutTimeRangeChange = (timeRange: string) => {
    setDonutTimeRange(timeRange);
    setIsTimeRangeDropdownOpen(false);
  };

  const handleOutputTimeRangeChange = (timeRange: string) => {
    setOutputTimeRange(timeRange);
    setIsOutputDropdownOpen(false);
  };

  const handleBookedOutTimeRangeChange = (timeRange: string) => {
    setBookedOutTimeRange(timeRange);
    setIsBookedOutDropdownOpen(false);
  };

  // Helper function to get output data based on selected time range
  const getOutputData = () => {
    switch (outputTimeRange) {
      case 'Today':
        return stats.dailyDonePallets;
      case 'Yesterday':
        return stats.yesterdayDonePallets;
      case 'Past 3 days':
        return stats.past3DaysGenerated;
      case 'This week':
        return stats.past7DaysGenerated;
      default:
        return stats.dailyDonePallets;
    }
  };

  // Helper function to get booked out data based on selected time range
  const getBookedOutData = (timeRange?: string) => {
    const selectedRange = timeRange || bookedOutTimeRange;
    switch (selectedRange) {
      case 'Today':
        return stats.dailyTransferredPallets;
      case 'Yesterday':
        return stats.yesterdayTransferredPallets;
      case 'Past 3 days':
        return stats.past3DaysTransferredPallets;
      case 'This week':
        return stats.past7DaysTransferredPallets;
      default:
        return stats.dailyTransferredPallets;
    }
  };

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
      default:
        // No default action
    }
  };



  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (timeRangeDropdownRef.current && !timeRangeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeRangeDropdownOpen(false);
      }
      if (outputDropdownRef.current && !outputDropdownRef.current.contains(event.target as Node)) {
        setIsOutputDropdownOpen(false);
      }
      if (bookedOutDropdownRef.current && !bookedOutDropdownRef.current.contains(event.target as Node)) {
        setIsBookedOutDropdownOpen(false);
      }
      if (acoDropdownRef.current && !acoDropdownRef.current.contains(event.target as Node)) {
        setIsAcoDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
      loadIncompleteAcoOrders();
    }
  }, [isAuthenticated]);

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        <p className="text-lg mt-4">Loading...</p>
      </div>
    );
  }

  // 未認證狀態
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
        <p className="text-lg mb-6">Please log in to access the Admin Panel.</p>
        <button 
          onClick={() => router.push('/main-login')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <MotionBackground>
      {/* 主要內容區域 */}
      <div className="text-white">
        {/* Admin Panel Navigation Bar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border-y border-slate-700/50 sticky top-0 z-30 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Empty space or could be used for breadcrumbs */}
              <div className="flex items-center">
                {/* Removed Admin Panel title and icon */}
              </div>

              {/* Center - Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1">
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

              {/* Right side - Reports button and Mobile menu button */}
              <div className="flex items-center gap-2">
                {/* Analytics Button */}
                <AnalyticsButton 
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
                {/* Reports Button - visible on all screen sizes */}
                <ReportsButton 
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
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
                  <div className="space-y-6">
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
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Ask Database Main Card - Left Side */}
            {hasAskDatabasePermission && (
              <div className="lg:col-span-3">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="relative group h-full">
                    {/* 卡片背景 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl blur-xl"></div>
                    
                    <div className="relative bg-slate-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/20 hover:border-purple-400/50 transition-all duration-300 h-full">
                      {/* 卡片內部光效 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                      
                      {/* 頂部邊框光效 */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-100 rounded-t-2xl"></div>
                      
                      <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Ask Me Anything</h2>
                            {/* <p className="text-purple-200 text-xs">What can I help you today?</p> */}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                        <AskDatabaseInlineCard />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Statistics Cards - Right Side */}
            <div className={`${hasAskDatabasePermission ? 'lg:col-span-1' : 'lg:col-span-4'} relative z-20`}>
              <div className="flex flex-col gap-3 h-full">
                {/* Today's Output - 1 unit */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                  <div className="relative group h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl blur-xl"></div>
                    <div className="relative bg-slate-800/40 backdrop-blur-xl border border-blue-500/30 rounded-xl p-3 shadow-xl shadow-blue-900/20 hover:border-blue-400/50 transition-all duration-300 h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                      <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                              <CubeIcon className="h-4 w-4 text-white" />
                    </div>
                            <h3 className="text-sm font-medium text-slate-200">Output</h3>
            </div>

                          {/* Output Date Range Dropdown */}
                          <div className="relative z-50" ref={outputDropdownRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOutputDropdownOpen(!isOutputDropdownOpen);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
                            >
                              <ClockIcon className="w-3 h-3" />
                              {outputTimeRange}
                              <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOutputDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {isOutputDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-[99999] min-w-[100px]"
                                >
                                  {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                                    <button
                                      key={option}
                                      onClick={() => handleOutputTimeRangeChange(option)}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                                        outputTimeRange === option ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                    </div>
                  </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-5xl font-bold text-white">{getOutputData()}</div>
                </div>
              </div>
            </div>
                  </div>
                </motion.div>

                {/* Today's Booked Out - 1 unit */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                  <div className="relative group h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-2xl blur-xl"></div>
                    <div className="relative bg-slate-800/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-3 shadow-xl shadow-green-900/20 hover:border-green-400/50 transition-all duration-300 h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                      <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                              <TruckIcon className="h-4 w-4 text-white" />
                    </div>
                            <h3 className="text-sm font-medium text-slate-200">Booked Out</h3>
            </div>

                          {/* Booked Out Date Range Dropdown */}
                          <div className="relative z-50" ref={bookedOutDropdownRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsBookedOutDropdownOpen(!isBookedOutDropdownOpen);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
                            >
                              <ClockIcon className="w-3 h-3" />
                              {bookedOutTimeRange}
                              <ChevronDownIcon className={`w-3 h-3 transition-transform ${isBookedOutDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {isBookedOutDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-[99999] min-w-[100px]"
                                >
                                  {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                                    <button
                                      key={option}
                                      onClick={() => handleBookedOutTimeRangeChange(option)}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                                        bookedOutTimeRange === option ? 'bg-slate-700/50 text-green-400' : 'text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        <span className="text-xs text-slate-400">{getBookedOutData(option)}</span>
                    </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                  </div>
                  </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-5xl font-bold text-white">{getBookedOutData()}</div>
                </div>
              </div>
            </div>
          </div>
                </motion.div>

                {/* Overview Chart - 2 units */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-[2]">
                  <div className="relative group z-30 h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-xl blur-xl"></div>
                    <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300 z-30 h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                      <div className="relative z-30 h-full flex items-center justify-center">
                        {/* Absolute positioned header */}
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-40">
                          <h3 className="text-sm font-medium text-slate-200">{donutTimeRange} Overview</h3>
                      
                      {/* Time Range Dropdown */}
                          <div className="relative z-50" ref={timeRangeDropdownRef}>
                        <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 text-xs border border-slate-600/30"
                        >
                              <ClockIcon className="w-3 h-3" />
                          {donutTimeRange}
                              <ChevronDownIcon className={`w-3 h-3 transition-transform ${isTimeRangeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                              {isTimeRangeDropdownOpen && (
                            <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-[99999] min-w-[120px]"
                            >
                              {['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => handleDonutTimeRangeChange(option)}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                                    donutTimeRange === option ? 'bg-slate-700/50 text-purple-400' : 'text-slate-300'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                        {/* Centered donut chart */}
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
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* 頂部邊框光效 */}
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
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* 頂部邊框光效 */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                  
                  <div className="relative z-10">
                    <MaterialReceived />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* ACO Order Progress Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative group">
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* 頂部邊框光效 */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent flex items-center gap-3">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-orange-400" />
                        ACO Order Progress
                      </h2>
                      
                      {/* ACO Order Dropdown */}
                      <div className="relative" ref={acoDropdownRef}>
                        <button
                          onClick={() => setIsAcoDropdownOpen(!isAcoDropdownOpen)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-300 text-sm border border-slate-600/30"
                          disabled={acoLoading}
                        >
                          <ClipboardDocumentListIcon className="w-4 h-4" />
                          {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isAcoDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isAcoDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute right-0 top-full mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-60 overflow-y-auto"
                            >
                              {incompleteOrders.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400">
                                  No incomplete orders
                                </div>
                              ) : (
                                incompleteOrders.map((order) => (
                                  <button
                                    key={order.order_ref}
                                    onClick={() => handleAcoOrderSelect(order.order_ref)}
                                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                                      selectedOrderRef === order.order_ref ? 'bg-slate-700/50 text-orange-400' : 'text-slate-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>Order {order.order_ref}</span>
                                      <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-1 rounded-lg text-xs">
                                        {order.remain_qty} remain
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className="min-h-[200px]">
                      {acoLoading ? (
                        <div className="space-y-4">
                          <div className="h-4 bg-slate-700/50 rounded-xl animate-pulse"></div>
                          <div className="h-4 bg-slate-700/50 rounded-xl animate-pulse w-3/4"></div>
                          <div className="h-4 bg-slate-700/50 rounded-xl animate-pulse w-1/2"></div>
                        </div>
                      ) : orderProgress.length === 0 ? (
                        <div className="text-center py-12">
                          <ClipboardDocumentListIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-lg">Select an ACO order to view progress</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {orderProgress.map((item, index) => (
                            <div key={index} className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-slate-200">{item.code}</span>
                                <span className="text-sm text-slate-400 bg-slate-700/30 px-3 py-1 rounded-full">
                                  {item.completed_qty} / {item.required_qty}
                                </span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                  style={{ width: `${item.completion_percentage}%` }}
                                >
                                  {item.completion_percentage > 25 && (
                                    <span className="text-xs text-white font-bold">
                                      {item.completion_percentage}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              {item.completion_percentage <= 25 && (
                                <div className="text-right">
                                  <span className="text-sm text-orange-400 font-bold">
                                    {item.completion_percentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Search Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative group">
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* 頂部邊框光效 */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                  
                  <div className="relative z-10">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent flex items-center gap-3 mb-6">
                      <MagnifyingGlassIcon className="w-6 h-6 text-blue-400" />
                      Quick Search
                    </h2>
                    
                    <form onSubmit={handleSearchSubmit} className="space-y-6">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Enter Product Code To Search"
                          className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300 backdrop-blur-sm"
                        />
                        <button
                          type="submit"
                          disabled={searchLoading || !searchQuery.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
                        >
                          {searchLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MagnifyingGlassIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </form>

                    {searchResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                      > 
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            { label: 'Production', value: searchResults.injection, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                            { label: 'Pipeline', value: searchResults.pipeline, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
                            { label: 'Awaiting', value: searchResults.await, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
                            { label: 'Fold Mill', value: searchResults.fold, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                            { label: 'Bulk Room', value: searchResults.bulk, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
                            { label: 'Back Car Park', value: searchResults.backcarpark, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
                            { label: 'Damage', value: searchResults.damage, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                          ].map((location) => (
                            <div key={location.label} className={`flex justify-between items-center py-3 px-4 ${location.bg} border ${location.border} rounded-xl`}>
                              <span className="text-slate-300 font-medium">{location.label}:</span>
                              <span className={`font-bold text-lg ${location.color}`}>
                                {location.value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                          <span className="text-lg font-bold text-slate-200">Total:</span>
                          <span className="text-2xl font-bold text-blue-400">
                            {searchResults.total.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {searchQuery && !searchResults && !searchLoading && (
                      <div className="mt-6 text-center py-8">
                        <MagnifyingGlassIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-lg">Enter a product code and click search</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Void Statistics Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <VoidStatisticsCard />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 底部裝飾 */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
          <span>Pennine Manufacturing Stock Control System</span>
          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
        </div>
      </div>


      {/* Dialog Manager - Centralized dialog rendering */}
      <DialogManager
        onReprintNeeded={handleReprintNeeded}
        onReprintConfirm={handleReprintConfirm}
        onReprintCancel={handleReprintCancel}
        voidState={voidState}
      />
      
      {/* Analytics Dashboard Dialog */}
      <AnalyticsDashboardDialog />
    </MotionBackground>
  );
}