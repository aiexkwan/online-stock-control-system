'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// Removed: import { supabase } from '../../lib/supabase'; // No longer needed directly for password reset logic here
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { resetPasswordAction } from './actions'; // Import the actual Server Action

// Placeholder removed, using imported Server Action now
// async function resetPasswordAction(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> { ... }

function NewPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('NewPasswordPage: mounted');
    if (userIdFromUrl) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('NewPasswordPage: userId found in URL:', userIdFromUrl);
      setUserId(userIdFromUrl);
    } else {
      console.error('NewPasswordPage: userId not found in URL parameters.');
      setError('User ID not provided. Please return to the login page and use the "Forgot Password" link again.');
      // Consider disabling the form or redirecting if no userId
      // toast.error('User ID not found in URL. Cannot reset password.');
              // setTimeout(() => router.push('/main-login'), 4000); // Example redirect
    }
    // localStorage cleanup is fine here
    localStorage.removeItem('user');
    localStorage.removeItem('firstLogin');

  }, [userIdFromUrl, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors before new attempt

    if (!userId) {
      setError('User ID is missing. Cannot proceed with password reset.');
      toast.error('User ID is missing. Cannot proceed.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Attempting to reset password for user: ${userId} via Server Action.`);
      // Call the imported Server Action directly
      const result = await resetPasswordAction(userId, newPassword);

      if (result.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Password reset successful for user: ${userId}`);
        setSuccess(true);
        toast.success('Password reset successfully! Redirecting to login...'); // Success toast
        setTimeout(() => {
           router.push('/main-login');
        }, 3000);
      } else {
        console.error(`Password reset failed for user: ${userId}. Reason: ${result.error}`);
        const errorMessage = result.error || 'Failed to reset password. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error during password reset form submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error('An unexpected client-side error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-700 mb-3">Password Reset Successfully!</h1>
          <p className="text-gray-600 mb-6">Your password has been updated. You will be redirected to the login page shortly.</p>
          <div className="w-full bg-green-200 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 h-2 animate-pulse rounded-full" style={{ animationDuration: '3s' }}></div>
          </div>
        </div>
      </div>
    );
  }

   // Initial loading state while userId is being determined from URL
  if (userId === null && !error) { // Changed from !userId to userId === null for clarity
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Loading user information...</p>
           {/* You could add a spinner component here */}
        </div>
     );
   }

   // Error state if userId is confirmed to be missing from URL or other initial error
   if (!userId && error) { // This condition means userId is effectively not set AND there's an error message
       return (
           <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
               <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-red-200">
                   <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                   </div>
                   <h1 className="text-xl font-bold text-red-700 mb-4">Access Error</h1>
                   <p className="text-red-600 mb-6">{error}</p>
                   <Button onClick={() => router.push('/main-login')} variant="destructive" className="bg-red-600 hover:bg-red-700">
                       Return to Login
                   </Button>
               </div>
           </div>
       );
   }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-blue-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Reset Your Password</h1>
        <p className="text-gray-600 mb-6 text-center">Enter and confirm a new password for your account.</p>

        {userId && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              Resetting password for Clock Number: <span className="font-bold">{userId}</span>
            </p>
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="mb-4 space-y-1">
            <label htmlFor="newPasswordInput" className="block text-sm font-medium text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <Input
              id="newPasswordInput"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full"
              placeholder="Enter new password (min. 6 characters)"
              required
              minLength={6}
            />
             <p className="text-xs text-gray-500">Minimum 6 characters required.</p>
          </div>

          <div className="mb-6 space-y-1">
            <label htmlFor="confirmPasswordInput" className="block text-sm font-medium text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <Input
              id="confirmPasswordInput"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
              placeholder="Confirm your new password"
              required
            />
          </div>

          {error && !success && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/main-login')}
              size="sm"
              disabled={loading} // Disable if loading
            >
               Cancel & Return to Login
            </Button>

            <Button
              type="submit"
              disabled={loading || !userId || success}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white" // Added text-white for better contrast
            >
              {loading ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                   Processing...
                 </>
               ) : (
                 'Reset Password'
               )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
    return (
        <Suspense fallback={<div>Loading page content...</div>}> {/* Changed fallback text */}
             <NewPasswordContent />
        </Suspense>
    );
} 