'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import EmailValidator from './EmailValidator';
import PasswordValidator from './PasswordValidator';
import { mainLoginAuth } from '../utils/supabase';

interface RegisterFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  department: string;
  agreeToTerms: boolean;
}

interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  agreeToTerms?: string;
}

export default function RegisterForm({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    department: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});

  const validateForm = (): boolean => {
    const errors: RegisterFormErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!EmailValidator.validate(formData.email)) {
      errors.email = EmailValidator.getErrorMessage(formData.email);
    }

    // Password validation
    const passwordErrors = PasswordValidator.validate(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0]; // Show first error
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
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
      // 使用 Supabase Auth 進行註冊
      await mainLoginAuth.signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
      });

      // 註冊成功
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
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
          Email Address *
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

      {/* Name Fields */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label htmlFor='firstName' className='mb-2 block text-sm font-medium text-gray-300'>
            First Name *
          </label>
          <input
            id='firstName'
            type='text'
            value={formData.firstName}
            onChange={e => handleInputChange('firstName', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.firstName ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='John'
            disabled={isLoading}
          />
          {fieldErrors.firstName && (
            <p className='mt-1 text-sm text-red-400'>{fieldErrors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor='lastName' className='mb-2 block text-sm font-medium text-gray-300'>
            Last Name *
          </label>
          <input
            id='lastName'
            type='text'
            value={formData.lastName}
            onChange={e => handleInputChange('lastName', e.target.value)}
            className={`w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.lastName ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder='Doe'
            disabled={isLoading}
          />
          {fieldErrors.lastName && (
            <p className='mt-1 text-sm text-red-400'>{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Department Field */}
      <div>
        <label htmlFor='department' className='mb-2 block text-sm font-medium text-gray-300'>
          Department
        </label>
        <select
          id='department'
          value={formData.department}
          onChange={e => handleInputChange('department', e.target.value)}
          className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
          disabled={isLoading}
        >
          <option value=''>Select Department</option>
          <option value='production'>Production</option>
          <option value='warehouse'>Warehouse</option>
          <option value='quality'>Quality Control</option>
          <option value='logistics'>Logistics</option>
          <option value='management'>Management</option>
          <option value='it'>IT</option>
          <option value='other'>Other</option>
        </select>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-300'>
          Password *
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
        <p className='mt-1 text-xs text-gray-400'>
          Password must be at least 6 characters with letters and numbers only
        </p>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor='confirmPassword' className='mb-2 block text-sm font-medium text-gray-300'>
          Confirm Password *
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
            placeholder='Confirm your password'
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

      {/* Terms Agreement */}
      <div>
        <label className='flex items-start space-x-3'>
          <input
            type='checkbox'
            checked={formData.agreeToTerms}
            onChange={e => handleInputChange('agreeToTerms', e.target.checked)}
            className='mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500'
            disabled={isLoading}
          />
          <span className='text-sm text-gray-300'>
            I agree to the{' '}
            <a href='#' className='text-blue-400 hover:text-blue-300'>
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href='#' className='text-blue-400 hover:text-blue-300'>
              Privacy Policy
            </a>
          </span>
        </label>
        {fieldErrors.agreeToTerms && (
          <p className='mt-1 text-sm text-red-400'>{fieldErrors.agreeToTerms}</p>
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
            Creating Account...
          </div>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
