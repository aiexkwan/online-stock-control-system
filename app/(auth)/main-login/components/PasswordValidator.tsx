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
  minLength: 12, // Increased from 6 to 12
  requireUppercase: true, // Changed from false to true
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true, // Changed from false to true
};

// Define allowed special characters
const SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>';
const SPECIAL_CHARS_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

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

    // Check minimum length
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    // Check for uppercase letters
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters (if required)
    if (requirements.requireSpecialChars && !SPECIAL_CHARS_REGEX.test(password)) {
      errors.push(`Password must contain at least one special character (${SPECIAL_CHARS})`);
    }

    // Check for common patterns (security enhancement)
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters (3 or more)
      /12345/, // Sequential numbers
      /qwerty/i, // Keyboard patterns
      /password/i, // Common words
      /admin/i, // Common words
      /pennine/i, // Company name
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push(
          'Password contains common patterns or words. Please choose a more unique password'
        );
        break;
      }
    }

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

    let score = 0;

    // Length bonus (more points for longer passwords)
    score += Math.min(password.length * 2, 30);

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (SPECIAL_CHARS_REGEX.test(password)) score += 15;

    // Extra length bonus for very long passwords
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 15;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    if (/password|admin|pennine/i.test(password)) score -= 20; // Common words

    // Entropy bonus (unique characters)
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    return Math.max(0, Math.min(100, score));
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
   * Generates a secure random password
   * @param length - Password length (default: 16)
   * @returns string - Generated password
   */
  generateSecurePassword: (length: number = 16): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = SPECIAL_CHARS;
    const allChars = uppercase + lowercase + numbers + specials;

    let password = '';

    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  },
};

export default PasswordValidator;
