'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentListIcon, 
  ArrowPathIcon, 
  ChartBarIcon, 
  CubeIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TagIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PrinterIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import PalletDonutChart from '../components/PalletDonutChart';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';
import AcoOrderStatus from '../components/AcoOrderStatus';
import type { User } from '@supabase/supabase-js';

const features = [
  {
    label: 'Print Label',
    icon: PrinterIcon,
    href: '/print-label',
    color: 'bg-blue-500',
  },
  {
    label: 'Stock Transfer',
    icon: ArrowsRightLeftIcon,
    href: '/stock-transfer',
    color: 'bg-green-500',
  },
  {
    label: 'Void Pallet',
    icon: NoSymbolIcon,
    href: '/void-pallet',
    color: 'bg-red-500',
  },
  {
    label: 'View History',
    icon: ClockIcon,
    href: '/history',
    color: 'bg-yellow-500',
  },
  {
    label: 'Ask Database',
    icon: ChatBubbleLeftRightIcon,
    href: '/ask-database',
    color: 'bg-purple-500',
  },
];

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">Loading session...</p>
    </div>
  </div>
);

interface CustomUser {
  id: string;
  name?: string;
}

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<CustomUser | User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    pendingOrders: 0,
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
  });

  const fetchUserName = async (clockNumber: string) => {
    try {
      console.log(`Dashboard: Fetching name for clock number: ${clockNumber}`);
      const { data, error } = await supabase
        .from('data_id')
        .select('name')
        .eq('id', parseInt(clockNumber, 10))
        .single();

      if (error) {
        console.error('Dashboard: Error fetching user name:', error);
        setUserName('User');
        return;
      }
      if (data && data.name) {
        console.log('Dashboard: User name fetched:', data.name);
        setUserName(data.name);
      } else {
        console.warn('Dashboard: User name not found for clock number:', clockNumber);
        setUserName('User');
      }
    } catch (e) {
      console.error('Dashboard: Exception fetching user name:', e);
      setUserName('User');
    }
  };

  useEffect(() => {
    console.log('Dashboard useEffect: Running auth check...');
    setLoading(true);

    const loggedInClockNumber = typeof window !== 'undefined' ? localStorage.getItem('loggedInUserClockNumber') : null;

    if (loggedInClockNumber) {
      console.log('Dashboard: Custom login detected via localStorage. Clock Number:', loggedInClockNumber);
      setUser({ id: loggedInClockNumber });
      fetchUserName(loggedInClockNumber);
      fetchDashboardData(loggedInClockNumber);
      setLoading(false);
      return;
    }

    console.log('Dashboard: No custom login marker in localStorage. Checking Supabase Auth session...');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Dashboard onAuthStateChange: event:', event, 'Supabase session user ID:', session?.user?.id);
      const supabaseCurrentUser = session?.user || null;
      
      if (supabaseCurrentUser) {
        console.log('Dashboard onAuthStateChange: Supabase Auth user detected:', supabaseCurrentUser.id);
        setUser(supabaseCurrentUser);
        setUserName(supabaseCurrentUser.email || supabaseCurrentUser.id);
        await fetchDashboardData(supabaseCurrentUser.id);
      } else if (!localStorage.getItem('loggedInUserClockNumber')) {
        console.log('Dashboard onAuthStateChange: User NOT logged in (no Supabase session, no custom marker). Redirecting to /login.');
        router.push('/login');
      }
      setLoading(false);
    });

    const checkInitialSupabaseSession = async () => {
        if (!localStorage.getItem('loggedInUserClockNumber')) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('Dashboard: Initial Supabase session check: Session FOUND.');
                setUser(session.user);
                setUserName(session.user.email || session.user.id);
                await fetchDashboardData(session.user.id);
            } else {
                console.log('Dashboard: Initial Supabase session check: No Supabase session AND no custom marker. Will rely on onAuthStateChange to redirect.');
            }
        }
        if (!user && !localStorage.getItem('loggedInUserClockNumber')) {
            setLoading(false);
        }
    };

    if (!loggedInClockNumber) {
        checkInitialSupabaseSession();
    } else {
        setLoading(false);
    }

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        console.log('Dashboard useEffect: Unsubscribed from onAuthStateChange.');
      }
    };
  }, [router]);

  const fetchDashboardData = async (userIdentity: string) => {
    try {
      console.log(`Dashboard: Fetching dashboard data for user/identity: ${userIdentity}...`);
      
      const { data: productsData, error: productsError } = await supabase
        .from('data_code')
        .select('*', { count: 'exact', head: true });

      if (productsError) console.error('Fetching product data error:', productsError);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .gte('time', sevenDaysAgo.toISOString());

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const { count: dailyDoneCount, error: dailyDoneError } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('generate_time', startOfDay.toISOString())
        .lte('generate_time', endOfDay.toISOString());

      const { count: dailyTransferredCount, error: dailyTransferredError } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .eq('f_loc', 'Production')
        .eq('t_loc', 'Fold Mill')
        .gte('tran_date', startOfDay.toISOString())
        .lte('tran_date', endOfDay.toISOString());

      setStats({
        totalProducts: productsData?.length || 0,
        lowStockItems: 0,
        recentTransactions: transactionsData?.length || 0,
        pendingOrders: 0,
        dailyDonePallets: dailyDoneCount || 0,
        dailyTransferredPallets: dailyTransferredCount || 0,
      });

      console.log('Dashboard: Dashboard data fetching complete.');
    } catch (error) {
      console.error('Dashboard: Error fetching dashboard data:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('Dashboard: Rendering - User is not authenticated. Showing login prompt.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-4">Please Log In</div>
          <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard.</p>
          <button 
            onClick={() => router.push('/login')} 
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering dashboard for user:', user.id, 'Name:', userName);
  const greeting = getTimeBasedGreeting();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 flex justify-end items-center">
        {userName && <span className="text-lg">{greeting}, {userName}!</span>}
      </header>
      
      <div className="flex flex-row items-center justify-center gap-8 py-4">
        <div>
          <PalletDonutChart 
            palletsDone={stats.dailyDonePallets} 
            palletsTransferred={stats.dailyTransferredPallets} 
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Print History</h2>
            <PrintHistory />
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">GRN History</h2>
            <GrnHistory />
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">ACO Order Status</h2>
          <AcoOrderStatus />
        </div>
      </div>
    </div>
  );
} 