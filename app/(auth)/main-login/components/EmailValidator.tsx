/**
 * Email format validator - simplified to trust Supabase Auth for domain validation
 * Basic email format validation only
 */

// Memoized regex for better performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmailFormat = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

const EmailValidator = {
  /**
   * Validates basic email format only - domain validation handled by Supabase Auth
   * @param email - Email address to validate
   * @returns boolean - true if valid format, false otherwise
   */
  validate: (email: string): boolean => {
    return validateEmailFormat(email);
  },

  /**
   * Gets validation error message
   * @param email - Email address that failed validation
   * @returns string - Error message
   */
  getErrorMessage: (email: string): string => {
    if (!email) {
      return 'Email address is required';
    }

    if (!validateEmailFormat(email)) {
      return 'Please enter a valid email address';
    }

    return 'Invalid email address';
  },
};

export default EmailValidator;
