'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { clearLocalAuthData } from '@/app/utils/auth-sync';
import { signOut as signOutService } from '@/app/services/supabaseAuth';

// Import dashboard components
import FinishedProduct from '@/app/components/PrintHistory';
import MaterialReceived from '@/app/components/GrnHistory';
import PalletDonutChart from '@/app/components/PalletDonutChart';

// Icons
import { 
  ChartBarIcon, 
  ClockIcon, 
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  clockNumber: string;
  displayName?: string; // Name from data_id table
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function ModernDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
    past3DaysGenerated: 0,
    past3DaysTransferredPallets: 0,
  });
  const [error, setError] = useState<string | null>(null);
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

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Extract clock number from email
  const extractClockNumber = (email: string): string => {
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : email.split('@')[0];
  };

  // Handle donut chart time range change
  const handleDonutTimeRangeChange = (timeRange: string) => {
    setDonutTimeRange(timeRange);
    setIsDropdownOpen(false);
    // You can add logic here to reload stats based on the new time range
    // For now, we'll keep using the existing past 3 days data
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await signOutService(supabase);
      
      // Clear local auth data
      clearLocalAuthData();
      
      // Show success message
      toast.success('Successfully logged out');
      
      // Redirect to login
      router.push('/main-login');
    } catch (error: any) {
      console.error('[Dashboard] Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // Fetch user display name from data_id table
  const fetchUserDisplayName = async (email: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('data_id')
        .select('name')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        console.log('[Dashboard] No name found in data_id for email:', email);
        return email.split('@')[0]; // Fallback to email prefix
      }
      
      return data.name || email.split('@')[0];
    } catch (err) {
      console.error('[Dashboard] Error fetching user name:', err);
      return email.split('@')[0];
    }
  };

  // Initialize authentication and load user data
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (!session) {
          router.push('/main-login?error=no_session');
          return;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error(`User error: ${userError?.message || 'No user found'}`);
        }

        if (!mounted) return;

        // Extract user information
        const userMetadata = user.user_metadata || {};
        const clockNumber = userMetadata.clock_number || extractClockNumber(user.email || '');
        
        // Fetch display name from data_id table
        const displayName = await fetchUserDisplayName(user.email || '');
        
        setUser({
          id: user.id,
          name: userMetadata.name || clockNumber,
          email: user.email || '',
          clockNumber: clockNumber,
          displayName: displayName
        });

        // Load dashboard statistics
        await loadDashboardStats();
        
      } catch (err: any) {
        console.error('[Dashboard] Authentication error:', err);
        if (mounted) {
          setError(err.message);
          toast.error(`Authentication failed: ${err.message}`);
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/main-login?error=auth_failed');
          }, 2000);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Dashboard] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        router.push('/main-login');
      } else if (event === 'SIGNED_IN' && session) {
        initializeAuth();
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

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

      // 2. Today's Transferred - Use filtered pallet numbers
      let dailyTransferredCount = 0;
      if (dailyTransferredResult.data && dailyTransferredResult.data.length > 0) {
        const todayPalletNums = dailyTransferredResult.data.map(p => p.plt_num);
        
        // Check these pallets in record_transfer - if plt_num appears, it's transferred
        const transferredResult = await supabase
          .from('record_transfer')
          .select('plt_num')
          .in('plt_num', todayPalletNums);

        if (transferredResult.error) throw transferredResult.error;
        
        // Count unique transferred pallets (those that appear in record_transfer)
        const uniqueTransferredPallets = new Set(transferredResult.data?.map(r => r.plt_num) || []);
        dailyTransferredCount = uniqueTransferredPallets.size;
      }

      // 3. Past 3 days generated count
      const past3DaysGenerated = past3DaysGeneratedResult.count || 0;

      // 4. Past 3 days transferred - Use filtered pallet numbers
      let past3DaysTransferredCount = 0;
      if (past3DaysTransferredResult.data && past3DaysTransferredResult.data.length > 0) {
        const past3DaysPalletNums = past3DaysTransferredResult.data.map(p => p.plt_num);
        
        // Check these pallets in record_transfer - if plt_num appears, it's transferred
        const past3DaysTransferredQueryResult = await supabase
          .from('record_transfer')
          .select('plt_num')
          .in('plt_num', past3DaysPalletNums);

        if (past3DaysTransferredQueryResult.error) throw past3DaysTransferredQueryResult.error;
        
        // Count unique transferred pallets (those that appear in record_transfer)
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
      console.error('[Dashboard] Error loading stats:', err);
      toast.error(`Failed to load statistics: ${err.message}`);
    } finally {
      setStatsLoading(false);
    }
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

  // Load ACO orders on component mount
  useEffect(() => {
    loadIncompleteAcoOrders();
  }, []);

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
      console.error('[Dashboard] Error loading ACO orders:', err);
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
      console.error('[Dashboard] Error loading order progress:', err);
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
        // No records found
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
        // Aggregate all records for this product code
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
      console.error('[Dashboard] Error searching inventory:', err);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/main-login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header with User Info and Logout */}
          <motion.header 
            variants={itemVariants}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {getGreeting()}
                </h1>
                <p className="text-slate-400 mt-1">
                  Welcome back, {user?.displayName || user?.name || 'User'}
                </p>
              </div>
              
              {/* Logout Button */}
              {user && (
                <div className="flex items-center mt-4 sm:mt-0">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-colors text-white"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.header>

          {/* Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Daily Done Pallets */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Today's Generated</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-slate-700" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stats.dailyDonePallets}</div>
                )}
                <p className="text-xs text-slate-400">Pallets generated today</p>
              </CardContent>
            </Card>

            {/* Daily Transferred Pallets */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Today's Transferred</CardTitle>
                <TruckIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-slate-700" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stats.dailyTransferredPallets}</div>
                )}
                <p className="text-xs text-slate-400">Pallets transferred today</p>
              </CardContent>
            </Card>

            {/* Past 3 Days Generated */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Past 3 days Generated</CardTitle>
                <ClockIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-slate-700" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stats.past3DaysGenerated}</div>
                )}
                <p className="text-xs text-slate-400">Past 3 days generated pallets</p>
              </CardContent>
            </Card>

            {/* Past 3 Days Transfer Rate */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Past 3 days Transfer Rate</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-slate-700" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    {stats.past3DaysGenerated > 0 ? Math.round((stats.past3DaysTransferredPallets / stats.past3DaysGenerated) * 100) : 0}%
                  </div>
                )}
                <p className="text-xs text-slate-400">Past 3 days transfer efficiency</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Donut Chart */}
            <motion.div variants={itemVariants}>
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
            <motion.div variants={itemVariants}>
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <FinishedProduct />
                </CardContent>
              </Card>
            </motion.div>

            {/* Material Received */}
            <motion.div variants={itemVariants}>
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
            <motion.div variants={itemVariants}>
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
            <motion.div variants={itemVariants}>
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
                        placeholder="Enter Product Code"
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
        </motion.div>
      </div>
    </div>
  );
} 