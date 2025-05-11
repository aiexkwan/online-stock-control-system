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
  XMarkIcon
} from '@heroicons/react/24/outline';
import PrintLabelPopover from './print-label-menu/PrintLabelPopover';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { name: 'Print Label', icon: DocumentIcon, href: '/print-label' },
  { name: 'Stock Transfer', icon: ArrowsRightLeftIcon, href: '/stock-transfer' },
  { name: 'Void Pallet', icon: NoSymbolIcon, href: '/void-pallet' },
  { name: 'View History', icon: ClockIcon, href: '/view-history' },
  { name: 'Ask Database', icon: ChatBubbleLeftRightIcon, href: '/ask-database' },
];

const slideInVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Mobile sidebar variants
const mobileSidebarVariants = {
  closed: { x: '-100%', opacity: 0.8 },
  open: { x: '0%', opacity: 1 }
};

const MOBILE_BREAKPOINT = 768; // md breakpoint

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [printLabelOpen, setPrintLabelOpen] = useState(false);
  const hoverRef = useRef(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobileView = window.innerWidth < MOBILE_BREAKPOINT;
      if (isMobileView !== newIsMobileView) { 
        setIsMobileView(newIsMobileView);
        if (!newIsMobileView) { 
          setIsMobileMenuOpen(false); 
        }
      }
    };
    if (typeof window !== 'undefined') {
      checkScreenSize();
    }
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobileView]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handlePopoverEnter = () => {
    hoverRef.current = true;
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setPrintLabelOpen(true);
  };

  const handlePopoverLeave = () => {
    hoverRef.current = false;
    closeTimeout.current = setTimeout(() => {
      if (!hoverRef.current) setPrintLabelOpen(false);
    }, 200);
  };

  // Navigation links, refactored for reusability
  const navLinks = (
    <nav className="flex-1 mt-2 px-2">
      {/* Home */}
      <Link
        key="Home"
        href="/"
        onClick={() => isMobileView && setIsMobileMenuOpen(false)} // Close mobile menu on click
        className="flex items-center px-4 py-2 text-base font-medium rounded-md mb-4 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <HomeIcon className="mr-3 h-6 w-6" />
        Home
      </Link>

      {/* Print Label Popover Trigger */}
      <div
        onMouseEnter={handlePopoverEnter}
        onMouseLeave={handlePopoverLeave}
        className="relative"
      >
        <div
          // onClick might be needed if popover should open on click on mobile too
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
              onMouseEnter={handlePopoverEnter}
              onMouseLeave={handlePopoverLeave}
              className="absolute left-full top-0 z-50 shadow-md w-32" // For desktop popover
            >
              <PrintLabelPopover onClose={() => isMobileView && setIsMobileMenuOpen(false)} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Other menu items */}
      {menuItems.filter(item => item.name !== 'Print Label').map((item) => (
        <Link
          key={item.name}
          href={item.href}
          onClick={() => isMobileView && setIsMobileMenuOpen(false)} // Close mobile menu on click
          className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 ${
            pathname === item.href
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <item.icon className="mr-3 h-6 w-6" />
          {item.name}
        </Link>
      ))}
    </nav>
  );
  
  const bottomLinks = (
    <div className="px-2 pb-6 flex flex-col gap-2">
      <Link 
        href="/products/update" 
        onClick={() => isMobileView && setIsMobileMenuOpen(false)}
        className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <span className="mr-3">🛠️</span> Product Update
      </Link>
      <Link 
        href="/access/update" 
        onClick={() => isMobileView && setIsMobileMenuOpen(false)}
        className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <span className="mr-3">🔑</span> Access Update
      </Link>
      <button
        onClick={async () => {
          if (isMobileView) setIsMobileMenuOpen(false); // Close mobile menu first
          let userIdToLog = 'unknown_user'; 
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              if (userData && userData.id) {
                userIdToLog = userData.id;
              }
            } catch (e) {
              console.error('Error parsing user data for logout log:', e);
            }
          }
          try {
            await supabase.from('record_history').insert({
              time: new Date().toISOString(), id: userIdToLog, plt_num: null, loc: null, action: 'Log Out', remark: null
            });
          } catch (historyError) {
            console.error('Failed to log logout event:', historyError);
          }
          localStorage.removeItem('user');
          router.push('/login');
        }}
        className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
      >
        <span className="mr-3">🚪</span> LogOut
      </button>
    </div>
  );

  return (
    <>
      {/* Hamburger button for mobile - positioned absolutely or fixed relative to viewport/main layout */}
      {isMobileView && (
        <button 
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-[60] p-2 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      )}

      {/* Overlay for mobile menu - shown when menu is open */}
      {isMobileView && isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar Content */}
      <AnimatePresence>
        {(!isMobileView || isMobileMenuOpen) && (
          <motion.div
            key="sidebar"
            className={`bg-[#23263a] text-white flex flex-col justify-between 
                        ${isMobileView 
                          ? 'fixed top-0 left-0 h-full w-64 z-50 shadow-xl' 
                          : 'w-full h-full' // Desktop classes - assuming it's placed in a grid cell that defines its width
                        }`}
            variants={isMobileView ? mobileSidebarVariants : {}}
            initial={isMobileView ? "closed" : undefined} // No initial animation for desktop
            animate={isMobileView ? (isMobileMenuOpen ? "open" : "closed") : "open"} // Animate for mobile, always "open" for desktop (or rely on static classes)
            exit={isMobileView ? "closed" : undefined} // No exit animation for desktop
            transition={{ type: 'tween', duration: 0.3 }}
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