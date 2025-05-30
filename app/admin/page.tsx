'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';

// Import dashboard components
import FinishedProduct from '@/app/components/PrintHistory';
import MaterialReceived from '@/app/components/GrnHistory';
import PalletDonutChart from '@/app/components/PalletDonutChart';

const adminMenuItems = [
  {
    id: 'void',
    title: 'Void Pallet',
    description: 'Void or cancel pallet records',
    icon: NoSymbolIcon,
    path: '/void-pallet',
    color: 'hover:bg-red-900/20 hover:text-red-400',
    category: 'Data Management'
  },
  {
    id: 'history',
    title: 'View History',
    description: 'View transaction history records',
    icon: ClockIcon,
    path: '/view-history',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'Data Management'
  },
  {
    id: 'aco-report',
    title: 'ACO Order Report',
    description: 'Generate and export ACO order reports',
    icon: DocumentChartBarIcon,
    path: '/export-report?type=aco',
    color: 'hover:bg-green-900/20 hover:text-green-400',
    category: 'Reports'
  },
  {
    id: 'grn-report',
    title: 'GRN Report',
    description: 'Generate and export GRN reports',
    icon: DocumentTextIcon,
    path: '/export-report?type=grn',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'Reports'
  },
  {
    id: 'transaction-report',
    title: 'Transaction Report',
    description: 'Generate and export transaction reports',
    icon: TableCellsIcon,
    path: '/export-report?type=transaction',
    color: 'hover:bg-purple-900/20 hover:text-purple-400',
    category: 'Reports'
  },
  {
    id: 'slate-report',
    title: 'Slate Report',
    description: 'Generate and export slate reports',
    icon: RectangleStackIcon,
    path: '/export-report?type=slate',
    color: 'hover:bg-orange-900/20 hover:text-orange-400',
    category: 'Reports'
  },
  {
    id: 'ask',
    title: 'Ask Database',
    description: 'Query database information',
    icon: ChatBubbleLeftRightIcon,
    path: '/ask-database',
    color: 'hover:bg-purple-900/20 hover:text-purple-400',
    category: 'System Tools'
  },
  {
    id: 'product',
    title: 'Product Update',
    description: 'Manage and update product information',
    icon: CubeIcon,
    path: '/productUpdate',
    color: 'hover:bg-orange-900/20 hover:text-orange-400',
    category: 'System Tools'
  },
  {
    id: 'access',
    title: 'Access Update',
    description: 'Manage user access and permissions',
    icon: KeyIcon,
    path: '/users',
    color: 'hover:bg-indigo-900/20 hover:text-indigo-400',
    category: 'User Management'
  }
];

// 按類別分組
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
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
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
  const supabase = createClient();
  
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
    past3DaysGenerated: 0,
    past3DaysTransferredPallets: 0,
  });
  const [donutTimeRange, setDonutTimeRange] = useState<string>('Past 3 days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      
      // Get past 3 days start time
      const past3DaysStart = new Date(today);
      past3DaysStart.setDate(today.getDate() - 3);
      past3DaysStart.setHours(0, 0, 0, 0);
      
      // Daily stats
      const [dailyDoneResult, dailyTransferredResult, past3DaysGeneratedResult, past3DaysTransferredResult] = await Promise.all([
        // Daily pallets done (Generated) - exclude Material GRN records
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', startOfDay)
          .lte('generate_time', endOfDay)
          .not('plt_remark', 'ilike', '%Material GRN-%'),

        // Daily pallets transferred - exclude Material GRN records
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', startOfDay)
          .lte('generate_time', endOfDay)
          .not('plt_remark', 'ilike', '%Material GRN-%'),

        // Past 3 days generated - exclude Material GRN records
        supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', past3DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%'),

        // Past 3 days pallets for transfer calculation - exclude Material GRN records
        supabase
          .from('record_palletinfo')
          .select('plt_num')
          .gte('generate_time', past3DaysStart.toISOString())
          .not('plt_remark', 'ilike', '%Material GRN-%')
      ]);

      if (dailyDoneResult.error || dailyTransferredResult.error || past3DaysGeneratedResult.error || past3DaysTransferredResult.error) throw new Error('Error loading statistics');

      // Calculate transferred counts
      let dailyTransferredCount = 0;
      if (dailyTransferredResult.data && dailyTransferredResult.data.length > 0) {
        const todayPalletNums = dailyTransferredResult.data.map(p => p.plt_num);
        
        const transferredResult = await supabase
          .from('record_transfer')
          .select('plt_num')
          .in('plt_num', todayPalletNums);

        if (transferredResult.error) throw transferredResult.error;
        
        const uniqueTransferredPallets = new Set(transferredResult.data?.map(r => r.plt_num) || []);
        dailyTransferredCount = uniqueTransferredPallets.size;
      }

      const past3DaysGenerated = past3DaysGeneratedResult.count || 0;

      let past3DaysTransferredCount = 0;
      if (past3DaysTransferredResult.data && past3DaysTransferredResult.data.length > 0) {
        const past3DaysPalletNums = past3DaysTransferredResult.data.map(p => p.plt_num);
        
        const past3DaysTransferredQueryResult = await supabase
          .from('record_transfer')
          .select('plt_num')
          .in('plt_num', past3DaysPalletNums);

        if (past3DaysTransferredQueryResult.error) throw past3DaysTransferredQueryResult.error;
        
        const uniquePast3DaysTransferredPallets = new Set(past3DaysTransferredQueryResult.data?.map(r => r.plt_num) || []);
        past3DaysTransferredCount = uniquePast3DaysTransferredPallets.size;
      }

      setStats({
        dailyDonePallets: dailyDoneResult.count || 0,
        dailyTransferredPallets: dailyTransferredCount,
        past3DaysGenerated: past3DaysGenerated,
        past3DaysTransferredPallets: past3DaysTransferredCount,
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
    setIsDropdownOpen(false);
  };

  const handleItemClick = (path: string) => {
    router.push(path);
  };

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
    <div className="min-h-screen bg-gray-900 text-white pt-24">
      {/* Admin Panel Navigation Bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-24 z-35 -mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Left side - Empty space or could be used for breadcrumbs */}
            <div className="flex items-center">
              {/* Removed Admin Panel title and icon */}
            </div>

            {/* Center - Navigation Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="relative group">
                  <div className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer">
                    {category}
                    <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </div>
                  
                  {/* Hover Dropdown */}
                  <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[250px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.path)}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${item.color}`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5" />
                            <div>
                              <div className="text-sm font-medium">{item.title}</div>
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
            <div className="md:hidden">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                {isDropdownOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
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
                className="md:hidden border-t border-gray-700/50 py-4"
              >
                <div className="space-y-4">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                handleItemClick(item.path);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-slate-700/50 rounded-lg transition-colors ${item.color}`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="w-5 h-5" />
                                <div>
                                  <div className="text-sm font-medium">{item.title}</div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Generated Pallets */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Today's Output</CardTitle>
              <CubeIcon className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.dailyDonePallets}</div>
              <p className="text-xs text-slate-400">Pallets outputed today</p>
            </CardContent>
          </Card>

          {/* Today's Transferred Pallets */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Today's Booked Out</CardTitle>
              <TruckIcon className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.dailyTransferredPallets}</div>
              <p className="text-xs text-slate-400">Pallets booked out today</p>
            </CardContent>
          </Card>

          {/* Past 3 Days Generated */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Past 3 Days Output</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.past3DaysGenerated}</div>
              <p className="text-xs text-slate-400">Total pallets outputed</p>
            </CardContent>
          </Card>

          {/* Past 3 Days Transfer Rate */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Booked Out Rate</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.past3DaysGenerated > 0 
                  ? Math.round((stats.past3DaysTransferredPallets / stats.past3DaysGenerated) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-slate-400">Past 3 days Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donut Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-200">{donutTimeRange} Overview</CardTitle>
                  
                  {/* Time Range Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs"
                    >
                      <ClockIcon className="w-3 h-3" />
                      {donutTimeRange}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]"
                        >
                          {['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'].map((option) => (
                            <button
                              key={option}
                              onClick={() => handleDonutTimeRangeChange(option)}
                              className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                donutTimeRange === option ? 'bg-slate-700 text-purple-400' : 'text-slate-300'
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
              </CardHeader>
              <CardContent className="flex justify-center">
                <PalletDonutChart 
                  palletsDone={stats.past3DaysGenerated}
                  palletsTransferred={stats.past3DaysTransferredPallets}
                  loading={statsLoading}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Finished Product */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="pt-6">
                <FinishedProduct />
              </CardContent>
            </Card>
          </motion.div>

          {/* Material Received */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="pt-6">
                <MaterialReceived />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* ACO Order Progress Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-orange-400" />
                    ACO Order Progress
                  </CardTitle>
                  
                  {/* ACO Order Dropdown */}
                  <div className="relative" ref={acoDropdownRef}>
                    <button
                      onClick={() => setIsAcoDropdownOpen(!isAcoDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs"
                      disabled={acoLoading}
                    >
                      <ClipboardDocumentListIcon className="w-3 h-3" />
                      {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${isAcoDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isAcoDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[180px] max-h-60 overflow-y-auto"
                        >
                          {incompleteOrders.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-slate-400">
                              No incomplete orders
                            </div>
                          ) : (
                            incompleteOrders.map((order) => (
                              <button
                                key={order.order_ref}
                                onClick={() => handleAcoOrderSelect(order.order_ref)}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                  selectedOrderRef === order.order_ref ? 'bg-slate-700 text-orange-400' : 'text-slate-300'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>Order {order.order_ref}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {order.remain_qty} remain
                                  </Badge>
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {acoLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full bg-slate-700" />
                    <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    <Skeleton className="h-4 w-1/2 bg-slate-700" />
                  </div>
                ) : orderProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Select an ACO order to view progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderProgress.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-200">{item.code}</span>
                          <span className="text-xs text-slate-400">
                            {item.completed_qty} / {item.required_qty}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                            style={{ width: `${item.completion_percentage}%` }}
                          >
                            {item.completion_percentage > 20 && (
                              <span className="text-xs text-white font-medium">
                                {item.completion_percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                        {item.completion_percentage <= 20 && (
                          <div className="text-right">
                            <span className="text-xs text-orange-400 font-medium">
                              {item.completion_percentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Search Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-5 h-5 text-blue-400" />
                  Quick Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Enter Product Code To Search"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={searchLoading || !searchQuery.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {searchLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>

                {searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-3"
                  > 
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'Production', value: searchResults.injection, color: 'text-blue-400' },
                        { label: 'Pipeline', value: searchResults.pipeline, color: 'text-green-400' },
                        { label: 'Awaiting', value: searchResults.await, color: 'text-yellow-400' },
                        { label: 'Fold Mill', value: searchResults.fold, color: 'text-purple-400' },
                        { label: 'Bulk Room', value: searchResults.bulk, color: 'text-orange-400' },
                        { label: 'Back Car Park', value: searchResults.backcarpark, color: 'text-cyan-400' },
                        { label: 'Damage', value: searchResults.damage, color: 'text-red-400' },
                      ].map((location) => (
                        <div key={location.label} className="flex justify-between items-center py-1 px-2 bg-slate-700/50 rounded">
                          <span className="text-slate-300">{location.label}:</span>
                          <span className={`font-medium ${location.color}`}>
                            {location.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center py-2 px-3 bg-slate-700 rounded-lg border-l-4 border-blue-500">
                      <span className="text-sm font-medium text-slate-200">Total:</span>
                      <span className="text-lg font-bold text-blue-400">
                        {searchResults.total.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )}

                {searchQuery && !searchResults && !searchLoading && (
                  <div className="mt-4 text-center py-4">
                    <MagnifyingGlassIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Enter a product code and click search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 