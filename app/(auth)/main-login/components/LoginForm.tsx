'use client';

import React, { useEffect, useCallback, memo } from 'react';
import { useLoginContext } from '../context/LoginContext';
import { useAuthEvents, useAuthEventListener } from '../events/useAuthEvents';
import { CompoundForm } from './compound/CompoundForm';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginForm = memo(function LoginForm({ onSuccess, onError }: LoginFormProps) {
  // Use the centralized login context
  const {
    loading,
    error,
    fieldErrors,
    passwordRules,
    loginFormData,
    uiState,
    login,
    updateLoginForm,
    setShowPassword,
    clearAllErrors,
  } = useLoginContext();

  // Event-driven communication
  const { emitLoginAttempt, emitLoginSuccess, emitLoginError, emitFormFieldChange } = useAuthEvents(
    { namespace: 'LoginForm' }
  );

  // Listen to external events
  useAuthEventListener('ERROR_CLEAR', () => {
    clearAllErrors();
  });

  useAuthEventListener('FORM_CLEAR', event => {
    if (event.payload.formType === 'login' || event.payload.formType === 'all') {
      updateLoginForm('email', '');
      updateLoginForm('password', '');
    }
  });

  // Notify parent component of errors through events and callbacks
  useEffect(() => {
    if (error) {
      emitLoginError(error);
      onError?.(error);
    }
  }, [error, onError, emitLoginError]);

  const handleSubmit = useCallback(
    async (formData: { email: string; password: string }) => {
      clearAllErrors();

      // Emit login attempt event
      emitLoginAttempt(formData.email, formData.password);

      const result = await login(formData.email, formData.password);

      if (result.success) {
        emitLoginSuccess(formData.email, result.user, result.redirectPath);
        onSuccess?.();
      } else {
        emitLoginError(result.error || 'Login failed');
      }
    },
    [clearAllErrors, login, onSuccess, emitLoginAttempt, emitLoginSuccess, emitLoginError]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      updateLoginForm(field as keyof typeof loginFormData, value);
      emitFormFieldChange(field, value, 'login');
    },
    [updateLoginForm, emitFormFieldChange]
  );

  const handlePasswordToggle = useCallback(() => {
    setShowPassword(!uiState.showPassword);
  }, [setShowPassword, uiState.showPassword]);

  // Using compound component pattern for better composition and decoupling
  return (
    <CompoundForm
      formType='login'
      onSubmit={handleSubmit}
      onFieldChange={handleFieldChange}
      isSubmitting={loading}
      hasErrors={!!error}
    >
      <CompoundForm.Body>
        {/* Email Field Group */}
        <CompoundForm.FieldGroup>
          <CompoundForm.Label htmlFor='email' required>
            Email Address
          </CompoundForm.Label>
          <CompoundForm.Input
            name='email'
            type='email'
            value={loginFormData.email}
            onChange={value => handleFieldChange('email', value)}
            placeholder='user@company.com'
            error={fieldErrors.email}
            autoComplete='email'
            required
            data-testid='email-input'
          />
          <CompoundForm.Error error={fieldErrors.email} />
        </CompoundForm.FieldGroup>

        {/* Password Field Group */}
        <CompoundForm.FieldGroup>
          <CompoundForm.Label htmlFor='password' required>
            Password
          </CompoundForm.Label>
          <CompoundForm.Input
            name='password'
            type='password'
            value={loginFormData.password}
            onChange={value => handleFieldChange('password', value)}
            placeholder={passwordRules.description}
            error={fieldErrors.password}
            autoComplete='current-password'
            showPasswordToggle
            passwordVisible={uiState.showPassword}
            onPasswordToggle={handlePasswordToggle}
            required
            data-testid='password-input'
          />
          <CompoundForm.Error error={fieldErrors.password} />
        </CompoundForm.FieldGroup>

        {/* Submit Button */}
        <CompoundForm.Button
          type='submit'
          variant='primary'
          loading={loading}
          data-testid='login-submit'
        >
          Sign In
        </CompoundForm.Button>
      </CompoundForm.Body>

      {/* Footer Links */}
      <CompoundForm.Footer>
        <CompoundForm.Link href='/main-login/reset'>Forgot password?</CompoundForm.Link>
        <CompoundForm.Link href='/main-login/register'>Create account</CompoundForm.Link>
      </CompoundForm.Footer>
    </CompoundForm>
  );
});

export default LoginForm;
