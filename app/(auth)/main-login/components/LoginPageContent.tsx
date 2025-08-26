'use client';

import React, { useEffect } from 'react';
import { useLoginContext } from '../context/LoginContext';
import LoginForm from './LoginForm';

interface LoginPageContentProps {
  urlSearchParams?: URLSearchParams | null;
  onError: (error: boolean) => void;
}

/**
 * LoginPageContent component that uses the LoginContext
 * Handles URL parameters and confirmation messages
 */
export default function LoginPageContent({ urlSearchParams, onError }: LoginPageContentProps) {
  const { uiState, setConfirmation } = useLoginContext();

  // Handle URL parameters within the context
  useEffect(() => {
    if (!urlSearchParams) return;

    try {
      if (urlSearchParams.get('confirmed') === 'true') {
        setConfirmation(true, '✓ Email confirmed! You can now sign in.');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('[LoginPageContent] URL parameter handling error:', error);
      onError(true);
    }
  }, [urlSearchParams, setConfirmation, onError]);

  return (
    <>
      <div className='mb-6 text-center'>
        <h2 className='text-xl font-semibold text-white'>Sign In</h2>
        <p className='mt-1 text-slate-400'>Access your account</p>
      </div>

      {/* Confirmation message from context */}
      {uiState.showConfirmation && uiState.confirmationMessage && (
        <div className='mb-4 rounded-lg border border-green-500/50 bg-green-900/50 p-3'>
          <p className='text-sm text-green-300'>{uiState.confirmationMessage}</p>
        </div>
      )}

      {/* Login form */}
      <LoginForm />
    </>
  );
}