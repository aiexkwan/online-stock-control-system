/**
 * Password validator for Pennine Industries
 * Enforces strong password requirements
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars?: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 6,
  requireUppercase: false,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
};

const PasswordValidator = {
  /**
   * Validates password against requirements
   * @param password - Password to validate
   * @param requirements - Custom requirements (optional)
   * @returns Array of error messages (empty if valid)
   */
  validate: (password: string, requirements: PasswordRequirements = DEFAULT_REQUIREMENTS): string[] => {
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
    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for forbidden special characters (always check)
    if (/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\\/~`';]/.test(password)) {
      errors.push('Password must not contain special characters');
    }

    return errors;
  },

  /**
   * Checks if password meets all requirements
   * @param password - Password to check
   * @param requirements - Custom requirements (optional)
   * @returns boolean - true if valid, false otherwise
   */
  isValid: (password: string, requirements: PasswordRequirements = DEFAULT_REQUIREMENTS): boolean => {
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
    
    // Length bonus
    score += Math.min(password.length * 4, 25);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Length bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    
    return Math.max(0, Math.min(100, score));
  },

  /**
   * Gets strength label based on score
   * @param score - Strength score (0-100)
   * @returns string - Strength label
   */
  getStrengthLabel: (score: number): string => {
    if (score < 30) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  },

  /**
   * Gets strength color for UI
   * @param score - Strength score (0-100)
   * @returns string - CSS color class
   */
  getStrengthColor: (score: number): string => {
    if (score < 30) return 'text-red-500';
    if (score < 60) return 'text-yellow-500';
    if (score < 80) return 'text-blue-500';
    return 'text-green-500';
  },

  /**
   * Gets default requirements
   * @returns PasswordRequirements - Default password requirements
   */
  getDefaultRequirements: (): PasswordRequirements => {
    return { ...DEFAULT_REQUIREMENTS };
  }
};

export default PasswordValidator; 