'use client';

import React, { useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useLoginContext } from '../../context/LoginContext';
import { EmailField, PasswordField } from '../molecules';
import { Button } from '../atoms';

interface RefactoredLoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Refactored Login Form using Atomic Design Pattern
 * Organism component that combines molecules and atoms
 */
const RefactoredLoginForm = memo(function RefactoredLoginForm({
  onSuccess,
  onError,
}: RefactoredLoginFormProps) {
  // Use the centralized login context
  const {
    loading,
    error,
    fieldErrors,
    passwordRules,
    loginFormData,
    uiState: _uiState,
    login,
    updateLoginForm,
    setShowPassword: _setShowPassword,
    clearAllErrors,
  } = useLoginContext();

  // Notify parent component of errors through callbacks
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearAllErrors();

      const result = await login(loginFormData.email, loginFormData.password);

      if (result.success) {
        onSuccess?.();
      }
    },
    [clearAllErrors, login, loginFormData, onSuccess]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      updateLoginForm(field as keyof typeof loginFormData, value);
    },
    [updateLoginForm]
  );

  return (
    <div className='mx-auto w-full max-w-md'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Form Header */}
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900'>Sign In</h2>
          <p className='mt-2 text-sm text-gray-600'>Access your account</p>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className='rounded-md border border-red-200 bg-red-50 p-3'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className='space-y-4'>
          {/* Email Field */}
          <EmailField
            label='Email Address'
            value={loginFormData.email}
            onChange={e => handleFieldChange('email', e.target.value)}
            error={fieldErrors.email}
            placeholder='user@company.com'
            autoComplete='email'
            required
            data-testid='email-input'
          />

          {/* Password Field */}
          <PasswordField
            label='Password'
            value={loginFormData.password}
            onChange={e => handleFieldChange('password', e.target.value)}
            error={fieldErrors.password}
            placeholder={passwordRules.description}
            autoComplete='current-password'
            required
            data-testid='password-input'
          />
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          variant='primary'
          size='lg'
          fullWidth
          loading={loading}
          disabled={loading}
          data-testid='login-submit'
        >
          Sign In
        </Button>

        {/* Footer Links */}
        <div className='flex justify-between text-sm'>
          <Link href='/main-login/reset' className='text-blue-600 hover:text-blue-700'>
            Forgot password?
          </Link>
          <Link href='/main-login/register' className='text-blue-600 hover:text-blue-700'>
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
});

export default RefactoredLoginForm;
