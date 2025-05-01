'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Cookie setter function
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    // Prevent SSR rendering issues
    if (typeof window === 'undefined') return;
    
    console.log('==== Change Password Page Loaded ====');
    console.log('Page URL:', window.location.href);
    console.log('localStorage contents:', {
      user: localStorage.getItem('user'),
      firstLogin: localStorage.getItem('firstLogin')
    });
    
    // Set initialized flag to ensure the page can render
    setInitialized(true);
    
    const checkAuth = () => {
      console.log('Change Password Page: starting user status check');
      
      // Only check if user info exists without further validation
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        // If no user info, display an error message
        console.log('Change Password Page: user not logged in, no redirect');
        setError('Please log in to the system first');
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
        console.log('Change Password Page: loaded user data:', user);
      } catch (e) {
        console.error('Change Password Page: error parsing user data:', e);
        setError('User data format error');
      }
    };
    
    // Delay auth check to ensure the page has rendered first
    setTimeout(checkAuth, 100);
    
    // Log event before window unload
    const handleBeforeUnload = () => {
      console.log('==== Change Password Page Will Unload ====');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!userData || !userData.id) {
        throw new Error('User data not found');
      }

      // Special handling for admin account
      if (userData.id === 'admin') {
        localStorage.removeItem('firstLogin');
        router.replace('/dashboard');
        return;
      }

      // Update Supabase Auth password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        console.warn('Supabase Auth password update failed, continue updating database:', authError);
        // Continue updating database password even if Auth update fails since login logic now supports custom passwords
      }

      // Update password in database
      const { error: updateError } = await supabase
        .from('data_id')
        .update({ password: newPassword })
        .eq('id', userData.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Remove first login flag
      localStorage.removeItem('firstLogin');
      
      // Notify success and redirect
      alert('Password updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Update password failed:', error);
      setError(error instanceof Error ? error.message : 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  // 如果還未初始化或正在導航，顯示載入中
  if (!initialized || isNavigating.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-3 text-gray-600">{isNavigating.current ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="container mx-auto flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full p-3">
                <svg 
                  className="w-full h-full text-blue-500" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 15v3m-3-3h6M5 10V6a7 7 0 1114 0v4" strokeLinejoin="round" />
                  <rect x="3" y="10" width="18" height="12" rx="2" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
            <p className="mt-2 text-gray-600">
              Welcome to Pennine Stock Control! Please set a new password for your account.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter password again"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 