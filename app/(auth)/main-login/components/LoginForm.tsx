'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLogin } from '@/app/hooks/useLogin';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginForm = memo(function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { loading, error, fieldErrors, login, clearFieldError, clearErrors, passwordRules } =
    useLogin();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Notify parent component of errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const result = await login(formData.email, formData.password);

    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      clearFieldError(field);
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
          className={`w-full rounded-lg border bg-slate-900/80 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder='user@pennineindustries.com'
          disabled={loading}
          required
          autoComplete='email'
        />
        {fieldErrors.email && <p className='mt-1 text-sm text-red-500'>{fieldErrors.email}</p>}
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
            className={`w-full rounded-lg border bg-slate-900/80 px-4 py-3 pr-12 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              fieldErrors.password ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder={passwordRules.description}
            disabled={loading}
            required
            autoComplete='current-password'
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none'
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeSlashIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className='mt-1 text-sm text-red-500'>{fieldErrors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={loading}
        className='w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {loading ? (
          <span className='flex items-center justify-center'>
            <svg
              className='-ml-1 mr-3 h-5 w-5 animate-spin text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Links */}
      <div className='flex items-center justify-between text-sm'>
        <a
          href='/main-login/reset'
          className='text-purple-400 hover:text-purple-300 focus:underline focus:outline-none'
        >
          Forgot password?
        </a>
        <a
          href='/main-login/register'
          className='text-purple-400 hover:text-purple-300 focus:underline focus:outline-none'
        >
          Create account
        </a>
      </div>
    </form>
  );
});

export default LoginForm;
