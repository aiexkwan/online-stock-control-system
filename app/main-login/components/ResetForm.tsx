'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import EmailValidator from './EmailValidator';
import PasswordValidator from './PasswordValidator';

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

export default function ResetForm({ step, token, onSuccess, onError, isLoading, setIsLoading }: ResetFormProps) {
  const [requestData, setRequestData] = useState<RequestResetData>({
    email: ''
  });
  
  const [resetData, setResetData] = useState<ResetPasswordData>({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateRequestForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!requestData.email) {
      errors.email = 'Email is required';
    } else if (!EmailValidator.validate(requestData.email)) {
      errors.email = EmailValidator.getErrorMessage(requestData.email);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const errors: {[key: string]: string} = {};

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
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequestForm()) {
      return;
    }

    setIsLoading(true);
    onError('');

    try {
      // TODO: Implement actual password reset request with Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful request
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
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
      // TODO: Implement actual password reset with Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful reset
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
  };

  if (step === 'request') {
    return (
      <form onSubmit={handleRequestSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={requestData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="your.name@pennineindustries.com"
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    <form onSubmit={handleResetSubmit} className="space-y-4">
      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={resetData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              fieldErrors.password ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Password must be at least 8 characters with uppercase, lowercase, and numbers
        </p>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={resetData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Confirm your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Resetting Password...
          </div>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
} 