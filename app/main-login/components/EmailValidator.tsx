/**
 * Email domain validator for Pennine Industries
 * Only allows @pennineindustries.com email addresses
 */

const ALLOWED_DOMAIN = '@pennineindustries.com';

export const validateEmailDomain = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN.toLowerCase());
};

export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const EmailValidator = {
  /**
   * Validates if email is from allowed domain
   * @param email - Email address to validate
   * @returns boolean - true if valid, false otherwise
   */
  validate: (email: string): boolean => {
    if (!validateEmailFormat(email)) {
      return false;
    }
    
    return validateEmailDomain(email);
  },

  /**
   * Gets the allowed domain
   * @returns string - The allowed email domain
   */
  getAllowedDomain: (): string => {
    return ALLOWED_DOMAIN;
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
    
    if (!validateEmailDomain(email)) {
      return `Only ${ALLOWED_DOMAIN} email addresses are allowed`;
    }
    
    return 'Invalid email address';
  }
};

export default EmailValidator; 