'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser } from '../services/auth';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('isTemporaryLogin');
    }
  }, []);

  const logToHistory = async (userIdToLog: string, actionType: 'LogIn' | 'Password Change', remarkText: string) => {
    try {
      await supabase.from('record_history').insert({
        time: new Date().toISOString(),
        id: userIdToLog,
        plt_num: null,
        loc: null,
        action: actionType,
        remark: remarkText,
      });
    } catch (historyError) {
      console.error('Failed to log to record_history:', historyError);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authenticateUser(userId, password);

      if (!result.success || !result.user) {
        const reason = result.error || 'Unknown login failure';
        setError(reason);
        await logToHistory(userId, 'LogIn', `LogIn Fail - ${reason}`);
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(result.user));

      if (result.isFirstLogin) {
        await logToHistory(result.user.id, 'LogIn', 'First LogIn');
        router.push('/change-password');
      } else {
        await logToHistory(result.user.id, 'LogIn', 'LogIn');
        router.push('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      const reason = err instanceof Error ? err.message : 'System error during login';
      setError(reason);
      await logToHistory(userId, 'LogIn', `LogIn Fail - ${reason}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!userId.trim()) {
      toast.error('Remark : Please Enter Your Clock Number As Password For First Time Login.');
      return;
    }
    router.push(`/new-password?userId=${encodeURIComponent(userId.trim())}`);
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
              <label htmlFor="userId" className="text-sm font-medium text-gray-300">
                Clock Number
              </label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
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