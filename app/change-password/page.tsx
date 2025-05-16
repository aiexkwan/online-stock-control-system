'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from 'sonner';
import { updateUserPasswordInDbAction } from './actions'; // Updated path

function ChangePasswordFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');

  const [clockNumber, setClockNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userIdFromQuery) {
      setClockNumber(userIdFromQuery);
      // Optional: verify if this clock number is actually pending a first password change
      // This could be a call to a server action that checks data_id.first_login
      // For now, we assume if they are on this page with a userId, they need to change it.
      console.log('User ID from query for password change:', userIdFromQuery);
    } else {
      toast.error('User ID not found. Please log in again.');
      router.push('/login');
    }
  }, [userIdFromQuery, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!clockNumber) {
      setError('Clock Number is missing. Please try logging in again.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!newPassword) {
        setError('New password cannot be empty.');
        return;
    }

    setLoading(true);
    try {
      const result = await updateUserPasswordInDbAction(clockNumber, newPassword);
      if (result.success) {
        toast.success('Password updated successfully! Redirecting to dashboard...');
        // Clear any sensitive items from localStorage if needed, though clockNumber might still be useful
        // localStorage.removeItem('isTemporaryLogin'); // Example if such item was used
        // localStorage.setItem('firstLoginComplete', 'true'); // Optional: set a flag
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to update password.');
        toast.error(result.error || 'An unknown error occurred.');
      }
    } catch (err: any) {
      console.error('Password change process exception:', err);
      setError(err.message || 'A system error occurred during password change.');
      toast.error(err.message || 'A system error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!userIdFromQuery) {
    // Render nothing or a loading/error state until redirect happens
    return <div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4 text-white">Loading user data or redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4">
      <Card className="w-full max-w-md bg-[#252d3d] border-0 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Set Your New Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Welcome, Clock Number: {clockNumber}. Please set your new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your new password"
                required
              />
               <p className="text-xs text-gray-500">Must be at least 6 characters, including a letter and a number.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Confirm your new password"
                required
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-500">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={loading || !clockNumber}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Updating Password...' : 'Set New Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// It's good practice to wrap components that use useSearchParams in Suspense
export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4 text-white">Loading...</div>}>
      <ChangePasswordFormComponent />
    </Suspense>
  );
} 