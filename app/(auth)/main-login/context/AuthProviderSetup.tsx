'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';
import { LoginProvider } from './LoginContext';

interface AuthProviderSetupProps {
  children: React.ReactNode;
}

/**
 * AuthProviderSetup component that sets up the complete authentication context hierarchy
 *
 * This component establishes the dependency injection pattern by providing:
 * 1. Global AuthProvider for application-wide authentication state
 * 2. Nested LoginProvider for login-specific functionality within auth routes
 *
 * Usage:
 * - Wrap your app root with AuthProviderSetup for global auth state
 * - The LoginProvider will automatically be available within auth routes
 * - Other parts of the app can use useAuthState(), useAuthService(), etc.
 */
export function AuthProviderSetup({ children }: AuthProviderSetupProps) {
  return (
    <AuthProvider enableLogging={process.env.NODE_ENV === 'development'}>{children}</AuthProvider>
  );
}

/**
 * LoginProviderSetup component for login-specific routes
 *
 * This should be used within login pages to provide additional
 * login-specific state and functionality on top of the global auth context.
 */
export function LoginProviderSetup({ children }: AuthProviderSetupProps) {
  return <LoginProvider enablePersistence={true}>{children}</LoginProvider>;
}

/**
 * Combined provider that includes both Auth and Login contexts
 *
 * Use this in login routes where you need both global auth state
 * and login-specific functionality.
 */
export function CombinedAuthProviderSetup({ children }: AuthProviderSetupProps) {
  return (
    <AuthProvider enableLogging={process.env.NODE_ENV === 'development'}>
      <LoginProvider enablePersistence={true}>{children}</LoginProvider>
    </AuthProvider>
  );
}

export default AuthProviderSetup;
