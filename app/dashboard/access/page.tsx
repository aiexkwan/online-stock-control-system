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
  ArrowRightOnRectangleIcon
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
      // Log logout event
      const clockNumber = user?.clockNumber || 'unknown';
      const idForDb = parseInt(clockNumber, 10) || 0;
      
      await supabase.from('record_history').insert({
        time: new Date().toISOString(),
        id: idForDb,
        plt_num: null,
        loc: null,
        action: 'Log Out',
        remark: null
      });

      // Sign out from Supabase
      await signOutService(supabase);
      
      // Clear local auth data
      clearLocalAuthData();
      
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
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        </motion.div>
      </div>
    </div>
  );
} 