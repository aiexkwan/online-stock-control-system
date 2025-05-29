'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  DocumentIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import PrintLabelPopover from './print-label-menu/PrintLabelPopover';
import AdminPanelPopover from './admin-panel-menu/AdminPanelPopover';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { clearLocalAuthData } from '../utils/auth-sync';
import { signOut as signOutService } from '../services/supabaseAuth';

const menuItems = [
  { name: 'Print Label', icon: DocumentIcon, href: '/print-label' },
  { name: 'Stock Transfer', icon: ArrowsRightLeftIcon, href: '/stock-transfer' },
  { name: 'Admin Panel', icon: ShieldCheckIcon, href: '/admin' },
];

const slideInVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Mobile sidebar variants
const mobileSidebarVariants = {
  closed: {
    x: '-100%',
    opacity: 0,
    pointerEvents: 'none' as const,
    zIndex: -1,
    transitionEnd: { display: 'none' as const }
  },
  open: {
    x: '0%',
    opacity: 1,
    pointerEvents: 'auto' as const,
    display: 'flex' as const,
    zIndex: 50
  }
};

const MOBILE_BREAKPOINT = 768; // md breakpoint

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [printLabelOpen, setPrintLabelOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const hoverRefPrintLabel = useRef(false);
  const hoverRefAdminPanel = useRef(false);
  const closeTimeoutPrintLabel = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutAdminPanel = useRef<NodeJS.Timeout | null>(null);

  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for main sidebar hover logic on desktop
  const sidebarHoverRef = useRef(false);
  const sidebarCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobileView = window.innerWidth < MOBILE_BREAKPOINT;
      if (isMobileView !== newIsMobileView) { 
        setIsMobileView(newIsMobileView);
      }
    };
    if (typeof window !== 'undefined') {
      checkScreenSize();
    }
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobileView]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Desktop sidebar hover open logic
  const openDesktopSidebar = () => {
    if (!isMobileView) {
      sidebarHoverRef.current = true;
      if (sidebarCloseTimeoutRef.current) {
        clearTimeout(sidebarCloseTimeoutRef.current);
      }
      setIsMobileMenuOpen(true);
    }
  };

  // Desktop sidebar hover close logic
  const closeDesktopSidebar = () => {
    if (!isMobileView) {
      sidebarHoverRef.current = false;
      sidebarCloseTimeoutRef.current = setTimeout(() => {
        if (!sidebarHoverRef.current) {
          setIsMobileMenuOpen(false);
        }
      }, 300); // 300ms delay
    }
  };

  // Print Label Popover handlers
  const handlePrintLabelEnter = () => {
    hoverRefPrintLabel.current = true;
    if (closeTimeoutPrintLabel.current) clearTimeout(closeTimeoutPrintLabel.current);
    setPrintLabelOpen(true);
  };

  const handlePrintLabelLeave = () => {
    hoverRefPrintLabel.current = false;
    closeTimeoutPrintLabel.current = setTimeout(() => {
      if (!hoverRefPrintLabel.current) setPrintLabelOpen(false);
    }, 200);
  };

  // Admin Panel Popover handlers
  const handleAdminPanelEnter = () => {
    hoverRefAdminPanel.current = true;
    if (closeTimeoutAdminPanel.current) clearTimeout(closeTimeoutAdminPanel.current);
    setAdminPanelOpen(true);
  };

  const handleAdminPanelLeave = () => {
    hoverRefAdminPanel.current = false;
    closeTimeoutAdminPanel.current = setTimeout(() => {
      if (!hoverRefAdminPanel.current) setAdminPanelOpen(false);
    }, 200);
  };

  // Navigation links, refactored for reusability
  const navLinks = (
    <nav className="flex-1 mt-2 px-2">
      {/* Home */}
      <Link
        key="Home"
        href="/dashboard/access"
        onClick={() => setIsMobileMenuOpen(false)} // Always close menu
        className="flex items-center px-4 py-2 text-base font-medium rounded-md mb-4 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <HomeIcon className="mr-3 h-6 w-6" />
        Home
      </Link>

      {/* Print Label Popover Trigger */}
      <div
        onMouseEnter={handlePrintLabelEnter}
        onMouseLeave={handlePrintLabelLeave}
        className="relative"
      >
        <div
          className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 cursor-pointer ${
            pathname === '/print-label' || pathname.startsWith('/print-label/') || pathname.startsWith('/print-grnlabel/') // Highlight if on child pages
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <DocumentIcon className="mr-3 h-6 w-6" />
          Print Label
        </div>
        {printLabelOpen && (
          <AnimatePresence>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideInVariants}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseEnter={handlePrintLabelEnter}
              onMouseLeave={handlePrintLabelLeave}
              className="absolute left-full top-0 z-50 shadow-md ml-2"
            >
              <PrintLabelPopover onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Stock Transfer link */}
      <Link
        key="Stock Transfer"
        href="/stock-transfer"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 ${
          pathname === '/stock-transfer'
            ? 'bg-gray-800 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <ArrowsRightLeftIcon className="mr-3 h-6 w-6" />
        Stock Transfer
      </Link>

      {/* Admin Panel Popover Trigger */}
      <div
        onMouseEnter={handleAdminPanelEnter}
        onMouseLeave={handleAdminPanelLeave}
        className="relative"
      >
        <div
          className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 cursor-pointer ${
            pathname === '/void-pallet' || pathname === '/view-history' || pathname === '/export-report' || pathname === '/ask-database'
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <ShieldCheckIcon className="mr-3 h-6 w-6" />
          Admin Panel
        </div>
        {adminPanelOpen && (
          <AnimatePresence>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideInVariants}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseEnter={handleAdminPanelEnter}
              onMouseLeave={handleAdminPanelLeave}
              className="absolute left-full top-0 z-50 shadow-md ml-2"
            >
              <AdminPanelPopover onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </nav>
  );
  
  const bottomLinks = (
    <div className="px-2 pb-6 flex flex-col gap-2">
      {/* LogOut button moved to dashboard header */}
      {/* 
      <button
        onClick={async () => {
          console.log("[Navigation] LogOut button clicked");
          setIsMobileMenuOpen(false); // Always close menu first
          
          let userIdToLog = 'unknown_user'; 
          // Use loggedInUserClockNumber for logging, as this is our primary identifier now
          const clockNumberStr = localStorage.getItem('loggedInUserClockNumber');
          if (clockNumberStr) {
            userIdToLog = clockNumberStr; // Assuming clock number itself is the ID to log
          } else {
            // Fallback or additional check if 'user' might still exist from old logic
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const userData = JSON.parse(userStr);
                if (userData && userData.id) {
                  userIdToLog = userData.id;
                }
              } catch (e) {
                console.error('[Navigation] Error parsing fallback user data for logout log:', e);
              }
            }
          }

          try {
            // Based on previous context, record_history.id is int4. So, we should try to parse if it's a number.
            let idForDb: number = 0; // Default to 0 if parsing fails or unknown

            if (userIdToLog !== 'unknown_user' && !isNaN(parseInt(userIdToLog, 10))) {
                idForDb = parseInt(userIdToLog, 10);
            }
            // If userIdToLog is 'unknown_user' or cannot be parsed to a number, idForDb remains 0.

            await supabase.from('record_history').insert({
              time: new Date().toISOString(), 
              id: idForDb, 
              plt_num: null, 
              loc: null, 
              action: 'Log Out', 
              remark: null
            });
          } catch (historyError) {
            console.error('[Navigation] Failed to log logout event:', historyError);
          }

          try {
            // 使用 Supabase Auth 登出
            await signOutService(supabase);
            console.log('[Navigation] Supabase Auth signOut successful');
          } catch (authError) {
            console.error('[Navigation] Supabase Auth signOut error:', authError);
          }

          // 使用我們的統一函數清除本地儲存
          clearLocalAuthData();
          
          router.push('/main-login');
        }}
        className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
      >
        <span className="mr-3">🚪</span> LogOut
      </button>
      */}
    </div>
  );

  return (
    <>
      {/* Hamburger button - always visible */}
      <button 
        onClick={toggleMobileMenu}
        onMouseEnter={!isMobileView ? openDesktopSidebar : undefined}
        onMouseLeave={!isMobileView ? closeDesktopSidebar : undefined}
        className="fixed top-4 left-4 z-[60] p-2 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
        aria-label="Open menu"
      >
        {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* Overlay for menu - shown when menu is open, removed md:hidden */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40" // Removed md:hidden
        />
      )}

      {/* Sidebar Content */}
      <AnimatePresence>
        {isMobileMenuOpen && ( // Show only if isMobileMenuOpen is true
          <motion.div
            key="sidebar"
            className={'fixed top-0 left-0 h-full w-64 shadow-xl bg-[#23263a] text-white flex flex-col justify-between z-50'} // Always use overlay style
            variants={mobileSidebarVariants} // Always use these variants
            initial="closed" // Always start closed
            animate={isMobileMenuOpen ? "open" : "closed"} // Controlled by isMobileMenuOpen
            exit="closed" // Exit to closed state
            transition={{ type: 'tween', duration: 0.3 }}
            onMouseEnter={!isMobileView ? openDesktopSidebar : undefined} // Keep sidebar open if mouse enters it
            onMouseLeave={!isMobileView ? closeDesktopSidebar : undefined} // Close sidebar if mouse leaves it
          >
            <div>
              <div className="px-4 py-4">
                <span className="font-extrabold text-2xl text-orange-400 tracking-wide">Pennine</span>
              </div>
              {navLinks}
            </div>
            {bottomLinks}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 