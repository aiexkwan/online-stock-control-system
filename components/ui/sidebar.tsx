"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-slate-900 backdrop-blur-xl border-r border-slate-600 w-[300px] flex-shrink-0 relative z-50",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "80px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {/* 頂部光效 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
      
      {/* 背景漸變效果 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-slate-900/90 backdrop-blur-xl border-b border-slate-600 w-full"
        )}
        {...props}
      >
        <div className="flex justify-start z-20 w-full">
          <Menu
            className="text-slate-300 hover:text-white cursor-pointer transition-colors duration-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-slate-900 backdrop-blur-xl p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-slate-300 hover:text-white cursor-pointer transition-colors duration-200"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-xl transition-all duration-200",
        isActive 
          ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400 -ml-[2px]" 
          : "text-white hover:bg-white/20",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-shrink-0 w-6 h-6 flex items-center justify-center",
        isActive ? "text-blue-400" : "text-white group-hover/sidebar:text-white"
      )}>
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SidebarHeader = ({
  title = "Pennine Stock",
  subtitle = "Control System"
}: {
  title?: string;
  subtitle?: string;
}) => {
  const { open, animate } = useSidebar();
  
  return (
    <motion.div 
      className="mb-8 px-3 overflow-hidden"
      animate={{
        opacity: animate ? (open ? 1 : 0) : 1,
        height: animate ? (open ? "auto" : 0) : "auto"
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h2 className="text-xl font-bold text-white whitespace-nowrap">
        {title}
      </h2>
      <p className="text-xs text-white/60 mt-1 whitespace-nowrap">{subtitle}</p>
    </motion.div>
  );
};

export const SidebarLogout = () => {
  const { open, animate } = useSidebar();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Sidebar] Logout error:', error);
        toast.error('Logout failed. Please try again.');
        return;
      }
      
      // 清除本地存儲的認證數據
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loggedInUserClockNumber');
        // Clear any other auth-related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      toast.success('You have logged out');
      router.push('/main-login');
    } catch (error: any) {
      console.error('[Sidebar] Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-xl transition-all duration-200 text-white hover:bg-red-500/20 hover:text-red-300 w-full"
    >
      <LogOut className="w-6 h-6 flex-shrink-0" />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium whitespace-pre inline-block !p-0 !m-0"
      >
        Logout
      </motion.span>
    </button>
  );
};