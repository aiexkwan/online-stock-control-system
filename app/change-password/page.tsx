'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from 'sonner';
import { updateUserPasswordInDbAction } from './actions';

const initialState = {
  error: undefined as string | undefined,
  success: false,
  message: undefined as string | undefined,
};

function ChangePasswordFormComponent() {
  const router = useRouter();

  const [formState, formAction] = useFormState(updateUserPasswordInDbAction, initialState);

  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || 'Password updated successfully! Redirecting to dashboard...');
      router.push('/dashboard');
    } else if (formState.error) {
      toast.error(formState.error);
    }
  }, [formState, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4">
      <Card className="w-full max-w-md bg-[#252d3d] border-0 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Set Your New Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Please set your new password. You must be logged in to change your password.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your new password"
                required
              />
               <p className="text-xs text-gray-500">Must be at least 6 characters.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Confirm your new password"
                required
              />
            </div>
            {formState.error && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-500">
                <p className="text-sm text-red-400">{formState.error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {pending ? 'Updating Password...' : 'Set New Password'}
    </Button>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4 text-white">Loading...</div>}>
      <ChangePasswordFormComponent />
    </Suspense>
  );
} 