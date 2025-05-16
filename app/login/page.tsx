'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [clockNumber, setClockNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PSEUDO_EMAIL_DOMAIN = 'internal.company.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('isTemporaryLogin');
    }
  }, [router, supabase.auth]);

  const logToHistory = async (userIdToLog: string, actionType: 'LogIn' | 'Password Change', remarkText: string) => {
    try {
      console.log(`Attempting to log: User [${userIdToLog}], Action [${actionType}], Remark [${remarkText}]`);
    } catch (historyError) {
      console.error('Failed to log to record_history:', historyError);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clockNumber.trim()) {
        setError('Clock Number cannot be empty.');
        setLoading(false);
        return;
    }

    const pseudoEmail = `${clockNumber.trim()}@${PSEUDO_EMAIL_DOMAIN}`;
    console.log(`Attempting Supabase login with pseudoEmail: ${pseudoEmail}`);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: password,
      });

      if (signInError) {
        console.error('Supabase signInWithPassword error:', signInError);
        let errorMessage = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid Clock Number or Password.';
        }
        setError(errorMessage);
        await logToHistory(clockNumber, 'LogIn', `LogIn Fail - ${errorMessage}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('Supabase login successful, user ID:', data.user.id);
        
        const isPotentiallyFirstSignIn = data.user.last_sign_in_at === null || 
                                     (data.user.created_at && data.user.last_sign_in_at && 
                                      new Date(data.user.created_at).getTime() === new Date(data.user.last_sign_in_at).getTime());

        const actualIsFirstLoginCheck = false;

        if (actualIsFirstLoginCheck) {
          await logToHistory(data.user.id, 'LogIn', 'First LogIn - Redirect to Change Password');
          router.push('/change-password'); 
        } else {
          await logToHistory(data.user.id, 'LogIn', 'LogIn Success');
          router.push('/dashboard');
        }
        router.refresh();

      } else {
        console.warn('Supabase login: No error but also no user data.');
        setError('An unexpected issue occurred during login. Please try again.');
        await logToHistory(clockNumber, 'LogIn', 'LogIn Fail - No user data returned');
      }

    } catch (err:any) {
      console.error('Login process exception:', err);
      setError(err.message || 'A system error occurred during login.');
      await logToHistory(clockNumber, 'LogIn', `LogIn Fail - Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!clockNumber.trim()) {
      toast.error('Please enter your Clock Number to proceed with password assistance.');
      return;
    }
    router.push(`/new-password?userId=${encodeURIComponent(clockNumber.trim())}`); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4">
      <Card className="w-full max-w-md bg-[#252d3d] border-0 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Pennine Stock Control
          </CardTitle>
          <CardDescription className="text-gray-400">
            Please Enter Your Clock Number And Password To Login
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clockNumber" className="text-sm font-medium text-gray-300">
                Clock Number
              </label>
              <Input
                id="clockNumber"
                type="text"
                value={clockNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClockNumber(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your clock number"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="text-right text-sm">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Forgot Password?
                </button>
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 