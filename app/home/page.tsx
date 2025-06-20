'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { 
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id: string;
  name: string;
  email: string;
  clockNumber: string;
  displayName?: string; // Name from data_id table
}

interface HistoryRecord {
  id: number;
  plt_num: string;
  product_code?: string;
  product_description?: string;
  action: string;
  time: string;
  uuid: string;
}

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
  latest_update: string;
}

export default function ModernDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [incompleteOrders, setIncompleteOrders] = useState<AcoOrder[]>([]);
  const [acoLoading, setAcoLoading] = useState(true);

  // Extract clock number from email
  const extractClockNumber = (email: string): string => {
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : email.split('@')[0];
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

  // Load history records
  const loadHistoryRecords = async () => {
    try {
      setHistoryLoading(true);
      
      // Fetch recent 150 history records
      const { data: historyData, error: historyError } = await supabase
        .from('record_history')
        .select('id, plt_num, action, time, uuid')
        .order('time', { ascending: false })
        .limit(150);

      if (historyError) {
        throw historyError;
      }

      if (!historyData || historyData.length === 0) {
        setHistoryRecords([]);
        return;
      }

      // Get unique plt_nums to fetch product info
      const pltNums = [...new Set(historyData.map(record => record.plt_num))];
      
      // Fetch product_code for these plt_nums from record_palletinfo
      const { data: palletData, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code')
        .in('plt_num', pltNums);

      if (palletError) {
        console.warn('[Dashboard] Error fetching pallet info:', palletError);
      }

      // Create a map for plt_num -> product_code lookup
      const palletInfoMap = new Map();
      const productCodes = new Set();
      
      if (palletData) {
        palletData.forEach(pallet => {
          if (pallet.product_code) {
            palletInfoMap.set(pallet.plt_num, pallet.product_code);
            productCodes.add(pallet.product_code);
          }
        });
      }

      // Fetch product descriptions from data_code table
      const { data: codeData, error: codeError } = await supabase
        .from('data_code')
        .select('code, description')
        .in('code', Array.from(productCodes));

      if (codeError) {
        console.warn('[Dashboard] Error fetching code descriptions:', codeError);
      }

      // Create a map for product_code -> description lookup
      const codeDescriptionMap = new Map();
      if (codeData) {
        codeData.forEach(codeItem => {
          codeDescriptionMap.set(codeItem.code, codeItem.description);
        });
      }

      // Combine history data with product info
      const enrichedHistory: HistoryRecord[] = historyData.map(record => {
        const productCode = palletInfoMap.get(record.plt_num) || 'N/A';
        const productDescription = productCode !== 'N/A' 
          ? codeDescriptionMap.get(productCode) || 'N/A'
          : 'N/A';
        
        return {
          ...record,
          product_code: productCode,
          product_description: productDescription
        };
      });

      setHistoryRecords(enrichedHistory);
    } catch (err: any) {
      console.error('[Dashboard] Error loading history records:', err);
      toast.error(`Failed to load history records: ${err.message}`);
    } finally {
      setHistoryLoading(false);
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
        
        // Load data in parallel
        await Promise.all([
          loadHistoryRecords(),
          loadIncompleteAcoOrders()
        ]);
        
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* ACO Order Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-6"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-orange-400" />
                ACO Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {acoLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-slate-700" />
                  ))}
                </div>
              ) : incompleteOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-400">All ACO orders completed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group orders by order_ref */}
                  {Object.entries(
                    incompleteOrders.reduce((groups, order) => {
                      if (!groups[order.order_ref]) {
                        groups[order.order_ref] = [];
                      }
                      groups[order.order_ref].push(order);
                      return groups;
                    }, {} as Record<number, AcoOrder[]>)
                  ).map(([orderRef, orders]) => {
                    const totalRequired = orders.reduce((sum, order) => sum + order.required_qty, 0);
                    const totalRemaining = orders.reduce((sum, order) => sum + order.remain_qty, 0);
                    const totalCompleted = totalRequired - totalRemaining;
                    const completionPercentage = Math.round((totalCompleted / totalRequired) * 100);
                    
                    return (
                      <motion.div
                        key={orderRef}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-orange-300">
                            Order {orderRef}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">
                              {totalCompleted} / {totalRequired} completed
                            </span>
                            <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-3 py-1 rounded-lg text-sm font-medium">
                              {completionPercentage}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-slate-600/50 rounded-full h-2 mb-4">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        
                        {/* Product details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {orders.map((order, index) => {
                            const productCompletionPercentage = Math.round(((order.required_qty - order.remain_qty) / order.required_qty) * 100);
                            
                            return (
                              <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/20">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-slate-200 font-medium">{order.code}</span>
                                  <span className="text-xs text-slate-400">
                                    {productCompletionPercentage}%
                                  </span>
                                </div>
                                <div className="text-sm text-slate-400 mb-2">
                                  Required: {order.required_qty} | Remaining: {order.remain_qty}
                                </div>
                                <div className="w-full bg-slate-600/50 rounded-full h-1">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${productCompletionPercentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* History Log Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                History Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-slate-700" />
                  ))}
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No history records found</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-4 p-3 bg-slate-700/50 rounded-t-lg text-sm font-medium text-slate-300">
                    <div>Pallet Number</div>
                    <div>Product Code</div>
                    <div>Product Description</div>
                    <div>ID</div>
                  </div>
                  
                  {/* Scrollable Table Body - Show first 30 by default, max 150 */}
                  <div className="overflow-y-auto bg-slate-800/30 rounded-b-lg" style={{ maxHeight: '30rem' }}>
                    {historyRecords.slice(0, 150).map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`grid grid-cols-4 gap-4 p-3 text-sm border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                          index >= 30 ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="text-blue-400 font-mono">{record.plt_num}</div>
                        <div className="text-slate-300">{record.product_code}</div>
                        <div className="text-slate-300 truncate" title={record.product_description}>
                          {record.product_description}
                        </div>
                        <div className="text-slate-400 font-mono">{record.id}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Show record count info */}
                  <div className="mt-3 text-xs text-slate-400 text-center">
                    Showing {Math.min(historyRecords.length, 30)} of {historyRecords.length} records
                    {historyRecords.length > 30 && ' (scroll to see more)'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
} 