'use client';

import React, { useState, useCallback, memo } from 'react';
import { EyeIcon, EyeSlashIcon } from './icons';
import PasswordValidator from './PasswordValidator';
import { unifiedAuth } from '../utils/unified-auth';

interface ChangePasswordFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordForm = memo(function ChangePasswordForm({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: ChangePasswordFormProps) {
  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};

    // Current password validation
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // New password validation
    const passwordErrors = PasswordValidator.validate(formData.newPassword);
    if (passwordErrors.length > 0) {
      errors.newPassword = passwordErrors[0];
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      errors.newPassword = 'New password must be different from current password';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      onError('');

      try {
        // 首先驗證當前密碼（通過重新登入）
        const user = await unifiedAuth.getCurrentUser();
        if (!user?.email) {
          throw new Error('User not found');
        }

        // 嘗試用當前密碼登入來驗證
        await unifiedAuth.signIn(user.email, formData.currentPassword);

        // 如果驗證成功，更新密碼
        await unifiedAuth.updatePassword(formData.newPassword);

        // 密碼修改成功
        onSuccess();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Invalid login credentials')) {
            onError('Current password is incorrect');
          } else {
            onError(error.message);
          }
        } else {
          onError('Failed to change password. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, setIsLoading, onError, onSuccess, formData.currentPassword, formData.newPassword]
  );

  const handleInputChange = useCallback(
    (field: keyof ChangePasswordData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [fieldErrors]
  );

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Current Password Field */}
      <div>
        <label htmlFor='currentPassword' className='mb-2 block text-sm font-medium text-gray-300'>
          Current Password
        </label>
        <div className='relative'>
          <input
            id='currentPassword'
            type={showCurrentPassword ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={e => handleInputChange('currentPassword', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.currentPassword ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Enter your current password'
            disabled={isLoading}
          />
          <button
            type='button'
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300'
            disabled={isLoading}
          >
            {showCurrentPassword ? (
              <EyeSlashIcon className='h-5 w-5' />
            ) : (
              <EyeIcon className='h-5 w-5' />
            )}
          </button>
        </div>
        {fieldErrors.currentPassword && (
          <p className='mt-1 text-sm text-red-400'>{fieldErrors.currentPassword}</p>
        )}
      </div>

      {/* New Password Field */}
      <div>
        <label htmlFor='newPassword' className='mb-2 block text-sm font-medium text-gray-300'>
          New Password
        </label>
        <div className='relative'>
          <input
            id='newPassword'
            type={showNewPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={e => handleInputChange('newPassword', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.newPassword ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Enter your new password'
            disabled={isLoading}
          />
          <button
            type='button'
            onClick={() => setShowNewPassword(!showNewPassword)}
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300'
            disabled={isLoading}
          >
            {showNewPassword ? (
              <EyeSlashIcon className='h-5 w-5' />
            ) : (
              <EyeIcon className='h-5 w-5' />
            )}
          </button>
        </div>
        {fieldErrors.newPassword && (
          <p className='mt-1 text-sm text-red-400'>{fieldErrors.newPassword}</p>
        )}
        <p className='mt-1 text-xs text-gray-400'>Password must be at least 6 characters</p>
      </div>

      {/* Confirm New Password Field */}
      <div>
        <label htmlFor='confirmPassword' className='mb-2 block text-sm font-medium text-gray-300'>
          Confirm New Password
        </label>
        <div className='relative'>
          <input
            id='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
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
            Changing Password...
          </div>
        ) : (
          'Change Password'
        )}
      </button>
    </form>
  );
});

export default ChangePasswordForm;
