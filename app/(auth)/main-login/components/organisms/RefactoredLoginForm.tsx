'use client';

import React, { useEffect, useCallback, memo } from 'react';
import { useLoginContext } from '../../context/LoginContext';
import { useAuthEvents, useAuthEventListener } from '../../events/useAuthEvents';
import { EmailField, PasswordField } from '../molecules';
import { Button } from '../atoms';
import Link from 'next/link';

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
    uiState,
    login,
    updateLoginForm,
    setShowPassword,
    clearAllErrors,
  } = useLoginContext();

  // Event-driven communication
  const { emitLoginAttempt, emitLoginSuccess, emitLoginError, emitFormFieldChange } = useAuthEvents(
    { namespace: 'RefactoredLoginForm' }
  );

  // Listen to external events
  useAuthEventListener('ERROR_CLEAR', () => {
    clearAllErrors();
  });

  useAuthEventListener('FORM_CLEAR', event => {
    if (event.payload.formType === 'login' || event.payload.formType === 'all') {
      updateLoginForm('email', '');
      updateLoginForm('password', '');
    }
  });

  // Notify parent component of errors through events and callbacks
  useEffect(() => {
    if (error) {
      emitLoginError(error);
      onError?.(error);
    }
  }, [error, onError, emitLoginError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearAllErrors();

      // Emit login attempt event
      emitLoginAttempt(loginFormData.email, loginFormData.password);

      const result = await login(loginFormData.email, loginFormData.password);

      if (result.success) {
        // Convert Supabase User to AuthUser if available, provide default if not
        const authUser = result.user
          ? {
              id: result.user.id,
              email: result.user.email || loginFormData.email,
              role: result.user.user_metadata?.role || 'user',
            }
          : {
              id: 'unknown',
              email: loginFormData.email,
              role: 'user',
            };

        emitLoginSuccess(loginFormData.email, authUser, result.redirectPath);
        onSuccess?.();
      } else {
        emitLoginError(result.error || 'Login failed');
      }
    },
    [
      clearAllErrors,
      login,
      loginFormData,
      onSuccess,
      emitLoginAttempt,
      emitLoginSuccess,
      emitLoginError,
    ]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      updateLoginForm(field as keyof typeof loginFormData, value);
      emitFormFieldChange(field, value, 'login');
    },
    [updateLoginForm, emitFormFieldChange]
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
