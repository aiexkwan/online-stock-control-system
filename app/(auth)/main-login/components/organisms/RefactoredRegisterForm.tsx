'use client';

import React, { useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { EmailField, PasswordField, FormField } from '../molecules';
import { Button } from '../atoms';
import { unifiedAuth } from '../../utils/unified-auth';
import Link from 'next/link';

interface RefactoredRegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Refactored Register Form using Atomic Design Pattern
 * Organism component for user registration
 */
const RefactoredRegisterForm = memo(function RefactoredRegisterForm({
  onSuccess,
  onError
}: RefactoredRegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [fieldErrors]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await unifiedAuth.signUp(
        formData.email,
        formData.password
      );
      
      onSuccess?.();
      // Redirect to confirmation page or login
      router.push('/main-login?registered=true');
    } catch (err: any) {
      const errorMsg = err?.message || 'Registration failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [formData, router, onSuccess, onError]);

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us to get started
          </p>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name Field */}
          <FormField
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            error={fieldErrors.fullName}
            placeholder="John Doe"
            autoComplete="name"
            required
            data-testid="fullname-input"
          />

          {/* Email Field */}
          <EmailField
            label="Email Address"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={fieldErrors.email}
            placeholder="user@company.com"
            autoComplete="email"
            required
            data-testid="email-input"
          />

          {/* Password Field */}
          <PasswordField
            label="Password"
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            error={fieldErrors.password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            showStrength
            required
            data-testid="password-input"
          />

          {/* Confirm Password Field */}
          <PasswordField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
            error={fieldErrors.confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
          data-testid="register-submit"
        >
          Create Account
        </Button>

        {/* Footer Links */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link 
            href="/main-login" 
            className="text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
});

export default RefactoredRegisterForm;