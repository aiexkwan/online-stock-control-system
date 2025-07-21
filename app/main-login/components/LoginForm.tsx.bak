'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import EmailValidator from './EmailValidator';
import { mainLoginAuth } from '../utils/supabase';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm({ onSuccess, onError, isLoading, setIsLoading }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!EmailValidator.validate(formData.email)) {
      errors.email = 'Only @pennineindustries.com email addresses are allowed';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.password)) {
      errors.password = 'Password must contain only letters and numbers';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    onError(''); // Clear previous errors

    try {
      // 使用 Supabase Auth 進行登入
      await mainLoginAuth.signIn(formData.email, formData.password);

      // 登入成功，跳轉到 access 頁面
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Email Field */}
      <div>
        <label htmlFor='email' className='mb-2 block text-sm font-medium text-gray-300'>
          Email Address
        </label>
        <input
          id='email'
          type='email'
          value={formData.email}
          onChange={e => handleInputChange('email', e.target.value)}
          className={`w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder='your.name@pennineindustries.com'
          disabled={isLoading}
        />
        {fieldErrors.email && <p className='mt-1 text-sm text-red-400'>{fieldErrors.email}</p>}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-300'>
          Password
        </label>
        <div className='relative'>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={e => handleInputChange('password', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.password ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Enter your password'
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
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
