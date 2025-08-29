'use client';

import React, { useCallback, memo } from 'react';
import { useLoginContext } from '../context/LoginContext';
import EmailValidator from './EmailValidator';
import PasswordValidator from './PasswordValidator';
import { CompoundForm } from './compound/CompoundForm';

interface RegisterFormProps {
  onRegistrationSuccess: (email: string) => void;
}

// Memoized RegisterForm to prevent unnecessary re-renders
const RegisterForm = memo(function RegisterForm({ onRegistrationSuccess }: RegisterFormProps) {
  // Use the centralized login context
  const {
    loading,
    error,
    registerFormData,
    uiState,
    register,
    updateRegisterForm,
    setShowPassword,
    setShowConfirmPassword,
    clearAllErrors,
  } = useLoginContext();


  // Memoized handlers to prevent re-renders
  const handleSubmit = useCallback(
    async (formData: { email: string; password: string; confirmPassword: string }) => {
      clearAllErrors();

      const result = await register(formData);

      if (result.success) {
        // Registration successful, notify parent
        onRegistrationSuccess(formData.email);
      }
    },
    [clearAllErrors, register, onRegistrationSuccess]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      updateRegisterForm(field as keyof typeof registerFormData, value);
    },
    [updateRegisterForm]
  );

  const handlePasswordToggle = useCallback(() => {
    setShowPassword(!uiState.showPassword);
  }, [setShowPassword, uiState.showPassword]);

  const handleConfirmPasswordToggle = useCallback(() => {
    setShowConfirmPassword(!uiState.showConfirmPassword);
  }, [setShowConfirmPassword, uiState.showConfirmPassword]);

  // Calculate email validation error
  const emailError =
    registerFormData.email && !EmailValidator.validate(registerFormData.email)
      ? EmailValidator.getErrorMessage(registerFormData.email)
      : undefined;

  // Calculate password validation errors
  const passwordErrors = registerFormData.password
    ? PasswordValidator.validate(registerFormData.password)
    : [];

  const passwordMismatchError =
    registerFormData.confirmPassword &&
    registerFormData.password !== registerFormData.confirmPassword
      ? 'Passwords do not match'
      : undefined;

  return (
    <CompoundForm<{ email: string; password: string; confirmPassword: string }>
      formType='register'
      onSubmit={handleSubmit}
      onFieldChange={handleFieldChange}
      isSubmitting={loading}
      hasErrors={!!error}
    >
      <CompoundForm.Body className='space-y-6'>
        {/* Global Error Display */}
        {error && (
          <div className='mb-4 rounded-lg border border-red-500/50 bg-red-900/50 p-3'>
            <p className='text-sm text-red-300'>{error}</p>
          </div>
        )}

        {/* Email Field with Validation */}
        <CompoundForm.FieldGroup>
          <CompoundForm.Label htmlFor='register-email' required>
            Email Address
          </CompoundForm.Label>
          <CompoundForm.Input
            name='email'
            type='email'
            value={registerFormData.email}
            onChange={value => handleFieldChange('email', value)}
            placeholder='your.name@pennineindustries.com'
            error={emailError}
            autoComplete='email'
            className='border border-slate-600 bg-slate-700/50 backdrop-blur-sm focus:border-blue-500 focus:ring-blue-500/50'
            required
          />
          <CompoundForm.Error error={emailError} />
        </CompoundForm.FieldGroup>

        {/* Password Field with Validation */}
        <CompoundForm.FieldGroup>
          <CompoundForm.Label htmlFor='register-password' required>
            Password
          </CompoundForm.Label>
          <CompoundForm.Input
            name='password'
            type='password'
            value={registerFormData.password}
            onChange={value => handleFieldChange('password', value)}
            placeholder='Enter your password'
            error={passwordErrors.length > 0 ? passwordErrors[0] : undefined}
            autoComplete='new-password'
            showPasswordToggle
            passwordVisible={uiState.showPassword}
            onPasswordToggle={handlePasswordToggle}
            className='border border-slate-600 bg-slate-700/50 backdrop-blur-sm focus:border-blue-500 focus:ring-blue-500/50'
            required
          />

          {/* Password validation errors */}
          {passwordErrors.length > 0 && (
            <div className='mt-1 space-y-1'>
              {passwordErrors.map((error, index) => (
                <CompoundForm.Error key={index} error={error} />
              ))}
            </div>
          )}

          {/* Password strength indicator */}
          {registerFormData.password && (
            <div className='mt-2 flex items-center space-x-2'>
              <div className='flex-1'>
                <div className='h-1 rounded bg-slate-600'>
                  <div
                    className={`h-1 rounded transition-all duration-300 ${PasswordValidator.getStrengthColor(
                      PasswordValidator.getStrength(registerFormData.password)
                    ).replace('text-', 'bg-')}`}
                    style={{
                      width: `${PasswordValidator.getStrength(registerFormData.password)}%`,
                    }}
                  />
                </div>
              </div>
              <span
                className={`text-xs ${PasswordValidator.getStrengthColor(
                  PasswordValidator.getStrength(registerFormData.password)
                )}`}
              >
                {PasswordValidator.getStrengthLabel(
                  PasswordValidator.getStrength(registerFormData.password)
                )}
              </span>
            </div>
          )}
        </CompoundForm.FieldGroup>

        {/* Confirm Password Field */}
        <CompoundForm.FieldGroup>
          <CompoundForm.Label htmlFor='register-confirm-password' required>
            Confirm Password
          </CompoundForm.Label>
          <CompoundForm.Input
            name='confirmPassword'
            type='password'
            value={registerFormData.confirmPassword}
            onChange={value => handleFieldChange('confirmPassword', value)}
            placeholder='Confirm your password'
            error={passwordMismatchError}
            autoComplete='new-password'
            showPasswordToggle
            passwordVisible={uiState.showConfirmPassword}
            onPasswordToggle={handleConfirmPasswordToggle}
            className='border border-slate-600 bg-slate-700/50 backdrop-blur-sm focus:border-blue-500 focus:ring-blue-500/50'
            required
          />
          <CompoundForm.Error error={passwordMismatchError} />
        </CompoundForm.FieldGroup>

        {/* Submit Button */}
        <CompoundForm.Button
          type='submit'
          variant='primary'
          loading={loading}
          className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500/50'
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </CompoundForm.Button>
      </CompoundForm.Body>
    </CompoundForm>
  );
});

export default RegisterForm;
