'use client';

import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const hideSidebar = pathname === '/login' || pathname === '/change-password';
  const [isTemporaryLogin, setIsTemporaryLogin] = useState(false);

  useEffect(() => {
    // Check for temporary login flag on component mount
    if (typeof window !== 'undefined') {
      const tempLoginFlag = localStorage.getItem('isTemporaryLogin');
      setIsTemporaryLogin(tempLoginFlag === 'true');
    }
  }, []);

  if (hideSidebar) {
    return (
      <div className="min-h-screen bg-[#181c2f] flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Temporary Login Banner */}
        {isTemporaryLogin && (
          <div className="bg-yellow-500 text-black p-3 text-center text-sm font-semibold z-50 shadow">
            You are logged in with temporary access while your password reset is pending.
            Please log in with your Clock Number as the password after administrator confirmation to set a new permanent password.
          </div>
        )}
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#232532]">
          {/* Removed the grid layout to allow Navigation to control sidebar visibility fully */}
          <div className="mx-auto px-0 py-0">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientLayout; 
