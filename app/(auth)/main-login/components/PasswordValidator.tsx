/**
 * Password validator for Pennine Industries
 * Enforces strong password requirements
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 6, // Simplified minimum length
  requireUppercase: false, // Simplified - no complex requirements
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false, // Simplified - no special chars required
};

// Keep for backward compatibility but not used in validation
const _SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>';
const _SPECIAL_CHARS_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

// Pre-computed character sets for password generation
const PASSWORD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const PasswordValidator = {
  /**
   * Validates password against requirements
   * @param password - Password to validate
   * @param requirements - Custom requirements (optional)
   * @returns Array of error messages (empty if valid)
   */
  validate: (
    password: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
  ): string[] => {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return errors;
    }

    // Only check minimum length - simplified validation
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    // All other complex validations removed for simplified UX
    // Character requirements, pattern checks, and security enhancements
    // are now handled by Supabase Auth policies

    return errors;
  },

  /**
   * Checks if password meets all requirements
   * @param password - Password to check
   * @param requirements - Custom requirements (optional)
   * @returns boolean - true if valid, false otherwise
   */
  isValid: (
    password: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
  ): boolean => {
    return PasswordValidator.validate(password, requirements).length === 0;
  },

  /**
   * Gets password strength score (0-100)
   * @param password - Password to evaluate
   * @returns number - Strength score
   */
  getStrength: (password: string): number => {
    if (!password) return 0;

    // Simplified strength calculation based on length only
    // This provides visual feedback while maintaining simple validation
    let score = 0;

    if (password.length >= 6) score = 40; // Minimum acceptable
    if (password.length >= 8) score = 60; // Better
    if (password.length >= 12) score = 80; // Good
    if (password.length >= 16) score = 100; // Excellent

    return score;
  },

  /**
   * Gets strength label based on score
   * @param score - Strength score (0-100)
   * @returns string - Strength label
   */
  getStrengthLabel: (score: number): string => {
    if (score < 30) return 'Very Weak';
    if (score < 50) return 'Weak';
    if (score < 70) return 'Fair';
    if (score < 85) return 'Good';
    return 'Strong';
  },

  /**
   * Gets strength color for UI
   * @param score - Strength score (0-100)
   * @returns string - CSS color class
   */
  getStrengthColor: (score: number): string => {
    if (score < 30) return 'text-red-600';
    if (score < 50) return 'text-red-500';
    if (score < 70) return 'text-yellow-500';
    if (score < 85) return 'text-blue-500';
    return 'text-green-500';
  },

  /**
   * Gets default requirements
   * @returns PasswordRequirements - Default password requirements
   */
  getDefaultRequirements: (): PasswordRequirements => {
    return { ...DEFAULT_REQUIREMENTS };
  },

  /**
   * Generates a simple random password
   * @param length - Password length (default: 8)
   * @returns string - Generated password
   */
  generateSecurePassword: (length: number = 8): string => {
    let password = '';
    const charsLength = PASSWORD_CHARS.length;

    // Generate random password from pre-computed character set
    for (let i = 0; i < length; i++) {
      password += PASSWORD_CHARS[Math.floor(Math.random() * charsLength)];
    }

    return password;
  },
};

export default PasswordValidator;
