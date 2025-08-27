'use client';

import React from 'react';
import { AuthErrorBoundary } from '../organisms/AuthErrorBoundary';
import RefactoredLoginForm from '../organisms/RefactoredLoginForm';
import { LoginProvider } from '../../context/LoginContext';

interface LoginPageTemplateProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
}

/**
 * Login Page Template
 * Template component that combines organisms with error boundaries
 */
export const LoginPageTemplate: React.FC<LoginPageTemplateProps> = ({
  onLoginSuccess,
  onLoginError
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section with Error Boundary */}
        <AuthErrorBoundary
          isolate
          fallback={
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            </div>
          }
        >
          <div className="text-center">
            <img
              className="mx-auto h-12 w-auto"
              src="/logo.svg"
              alt="Company Logo"
            />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
        </AuthErrorBoundary>

        {/* Login Form with Error Boundary */}
        <AuthErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Login form error:', error);
            onLoginError?.(`Login form error: ${error.message}`);
          }}
          resetKeys={['login-form']}
          resetOnPropsChange
        >
          <LoginProvider>
            <RefactoredLoginForm
              onSuccess={onLoginSuccess}
              onError={onLoginError}
            />
          </LoginProvider>
        </AuthErrorBoundary>
      </div>
    </div>
  );
};

/**
 * Export with error boundary HOC for additional protection
 */
export default LoginPageTemplate;