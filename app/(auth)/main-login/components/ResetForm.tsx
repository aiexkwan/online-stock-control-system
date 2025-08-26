'use client';

import React, { useState, useCallback, memo } from 'react';
import { EyeIcon, EyeSlashIcon } from './icons';
import EmailValidator from './EmailValidator';
import PasswordValidator from './PasswordValidator';
import { unifiedAuth } from '../utils/unified-auth';

interface ResetFormProps {
  step: 'request' | 'reset';
  token: string | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface RequestResetData {
  email: string;
}

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

const ResetForm = memo(function ResetForm({
  step,
  token,
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: ResetFormProps) {
  const [requestData, setRequestData] = useState<RequestResetData>({
    email: '',
  });

  const [resetData, setResetData] = useState<ResetPasswordData>({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateRequestForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};

    if (!requestData.email) {
      errors.email = 'Email is required';
    } else if (!EmailValidator.validate(requestData.email)) {
      errors.email = EmailValidator.getErrorMessage(requestData.email);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [requestData.email]);

  const validateResetForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};

    // Password validation
    const passwordErrors = PasswordValidator.validate(resetData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0];
    }

    // Confirm password validation
    if (!resetData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (resetData.password !== resetData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [resetData.password, resetData.confirmPassword]);

  const handleRequestSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateRequestForm()) {
        return;
      }

      setIsLoading(true);
      onError('');

      try {
        // 使用 Supabase Auth 發送密碼重設 email
        await unifiedAuth.resetPassword(requestData.email);

        // 發送成功
        onSuccess();
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Failed to send reset email. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [validateRequestForm, setIsLoading, onError, onSuccess, requestData.email]
  );

  const handleResetSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateResetForm()) {
        return;
      }

      if (!token) {
        onError('Invalid reset token. Please request a new password reset.');
        return;
      }

      setIsLoading(true);
      onError('');

      try {
        // 使用 Supabase Auth 更新密碼
        await unifiedAuth.updatePassword(resetData.password);

        // 密碼重設成功
        onSuccess();
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [validateResetForm, token, onError, setIsLoading, onSuccess, resetData.password]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      if (step === 'request') {
        setRequestData(prev => ({ ...prev, [field]: value }));
      } else {
        setResetData(prev => ({ ...prev, [field]: value }));
      }

      // Clear field error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [step, fieldErrors]
  );

  if (step === 'request') {
    return (
      <form onSubmit={handleRequestSubmit} className='space-y-4'>
        {/* Email Field */}
        <div>
          <label htmlFor='email' className='mb-2 block text-sm font-medium text-gray-300'>
            Email Address
          </label>
          <input
            id='email'
            type='email'
            value={requestData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='your.name@company.com'
            disabled={isLoading}
          />
          {fieldErrors.email && <p className='mt-1 text-sm text-red-400'>{fieldErrors.email}</p>}
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:bg-blue-800'
        >
          {isLoading ? (
            <div className='flex items-center justify-center'>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
              Sending Reset Link...
            </div>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetSubmit} className='space-y-4'>
      {/* Password Field */}
      <div>
        <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-300'>
          New Password
        </label>
        <div className='relative'>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={resetData.password}
            onChange={e => handleInputChange('password', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.password ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Enter your new password'
            disabled={isLoading}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300'
            disabled={isLoading}
          >
            {showPassword ? <EyeSlashIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className='mt-1 text-sm text-red-400'>{fieldErrors.password}</p>
        )}
        <p className='mt-1 text-xs text-gray-400'>Password must be at least 6 characters</p>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor='confirmPassword' className='mb-2 block text-sm font-medium text-gray-300'>
          Confirm New Password
        </label>
        <div className='relative'>
          <input
            id='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            value={resetData.confirmPassword}
            onChange={e => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Confirm your new password'
            disabled={isLoading}
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300'
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className='h-5 w-5' />
            ) : (
              <EyeIcon className='h-5 w-5' />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className='mt-1 text-sm text-red-400'>{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={isLoading}
        className='w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:bg-blue-800'
      >
        {isLoading ? (
          <div className='flex items-center justify-center'>
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
            Resetting Password...
          </div>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
});

export default ResetForm;
