/**
 * Unified Password Policy Configuration
 * Single source of truth for password requirements
 */

// Type definitions for password policy
export interface PasswordPolicyConfig {
  readonly minLength: number;
  readonly maxLength: number;
  readonly requireUppercase: boolean;
  readonly requireLowercase: boolean;
  readonly requireNumbers: boolean;
  readonly requireSpecialChars: boolean;
  readonly specialChars: string;
  readonly preventCommonPatterns: boolean;
  readonly preventCompanyName: boolean;
  readonly preventSequential: boolean;
  readonly preventRepeating: boolean;
  readonly historyCount: number;
  readonly expiryDays: number;
  readonly expiryWarningDays: number;
  readonly maxLoginAttempts: number;
  readonly lockoutDurationMinutes: number;
  readonly sessionTimeoutMinutes: number;
  readonly sessionRefreshMinutes: number;
  readonly messages: {
    readonly tooShort: string;
    readonly tooLong: string;
    readonly missingUppercase: string;
    readonly missingLowercase: string;
    readonly missingNumbers: string;
    readonly missingSpecialChars: string;
    readonly commonPattern: string;
    readonly containsCompanyName: string;
    readonly recentlyUsed: string;
  };
}

export interface PasswordValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface PasswordStrengthResult {
  readonly score: number; // 0-5
  readonly strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  readonly suggestions: readonly string[];
}

export const PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*(),.?":{}|<>',

  // Additional security settings
  maxLength: 128,
  preventCommonPatterns: true,
  preventCompanyName: true,
  preventSequential: true,
  preventRepeating: true,

  // Password history
  historyCount: 5, // Remember last 5 passwords

  // Password expiry
  expiryDays: 90, // Force password change every 90 days
  expiryWarningDays: 14, // Warn 14 days before expiry

  // Account lockout
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,

  // Session settings
  sessionTimeoutMinutes: 120, // 2 hours
  sessionRefreshMinutes: 30,

  // Error messages
  messages: {
    tooShort: `Password must be at least 12 characters long`,
    tooLong: `Password must not exceed 128 characters`,
    missingUppercase: 'Password must contain at least one uppercase letter',
    missingLowercase: 'Password must contain at least one lowercase letter',
    missingNumbers: 'Password must contain at least one number',
    missingSpecialChars: `Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)`,
    commonPattern: 'Password contains common patterns. Please choose a more unique password',
    containsCompanyName: 'Password must not contain company name',
    recentlyUsed: 'Password was recently used. Please choose a different password',
  },
} as const;

/**
 * Validate password against unified policy
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors: errors as readonly string[] };
  }

  // Length checks
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(PASSWORD_POLICY.messages.tooShort);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(PASSWORD_POLICY.messages.tooLong);
  }

  // Character requirements
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(PASSWORD_POLICY.messages.missingUppercase);
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(PASSWORD_POLICY.messages.missingLowercase);
  }
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push(PASSWORD_POLICY.messages.missingNumbers);
  }
  if (PASSWORD_POLICY.requireSpecialChars) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
    );
    if (!specialCharsRegex.test(password)) {
      errors.push(PASSWORD_POLICY.messages.missingSpecialChars);
    }
  }

  // Pattern checks
  if (PASSWORD_POLICY.preventCommonPatterns) {
    const patterns: RegExp[] = [
      /(.)\1{2,}/, // Repeated characters (3 or more)
      /123456?7?8?9?0?/, // Sequential numbers
      /abcdef/i, // Sequential letters
      /qwerty/i, // Keyboard patterns
      /password/i, // Common words
      /admin/i,
      /login/i,
      /user/i,
      /test/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(password)) {
        errors.push(PASSWORD_POLICY.messages.commonPattern);
        break;
      }
    }
  }

  // Company name check
  if (PASSWORD_POLICY.preventCompanyName && /pennine/i.test(password)) {
    errors.push(PASSWORD_POLICY.messages.containsCompanyName);
  }

  return {
    isValid: errors.length === 0,
    errors: errors as readonly string[],
  };
}

/**
 * Generate cryptographically secure password
 */
export function generateSecurePassword(length: number = 16): string {
  // Validate input
  if (!Number.isInteger(length) || length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  if (length > PASSWORD_POLICY.maxLength) {
    throw new Error(`Password length cannot exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = PASSWORD_POLICY.specialChars;
  const allChars = uppercase + lowercase + numbers + specialChars;

  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    let crypto: typeof import('crypto');
    try {
      crypto = require('crypto');
    } catch (error) {
      throw new Error('Node.js crypto module is not available');
    }

    let password = '';

    // Ensure at least one of each required type
    if (PASSWORD_POLICY.requireUppercase) {
      password += uppercase[crypto.randomInt(uppercase.length)]!;
    }
    if (PASSWORD_POLICY.requireLowercase) {
      password += lowercase[crypto.randomInt(lowercase.length)]!;
    }
    if (PASSWORD_POLICY.requireNumbers) {
      password += numbers[crypto.randomInt(numbers.length)]!;
    }
    if (PASSWORD_POLICY.requireSpecialChars) {
      password += specialChars[crypto.randomInt(specialChars.length)]!;
    }

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)]!;
    }

    // Shuffle using Fisher-Yates algorithm
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }

    return arr.join('');
  } else {
    // Client-side: use Web Crypto API
    if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
      throw new Error('Web Crypto API is not available');
    }

    let password = '';

    // Ensure at least one of each required type
    const requiredChars: string[] = [];

    if (PASSWORD_POLICY.requireUppercase) {
      requiredChars.push(uppercase);
    }
    if (PASSWORD_POLICY.requireLowercase) {
      requiredChars.push(lowercase);
    }
    if (PASSWORD_POLICY.requireNumbers) {
      requiredChars.push(numbers);
    }
    if (PASSWORD_POLICY.requireSpecialChars) {
      requiredChars.push(specialChars);
    }

    // Add one character from each required set
    for (const charSet of requiredChars) {
      const randomIndex = new Uint32Array(1);
      globalThis.crypto.getRandomValues(randomIndex);
      const index = randomIndex[0]! % charSet.length;
      password += charSet[index]!;
    }

    // Fill the rest with random characters
    const remainingLength = length - password.length;
    if (remainingLength > 0) {
      const randomIndices = new Uint32Array(remainingLength);
      globalThis.crypto.getRandomValues(randomIndices);

      for (let i = 0; i < remainingLength; i++) {
        const index = randomIndices[i]! % allChars.length;
        password += allChars[index]!;
      }
    }

    // Shuffle the password
    const arr = password.split('');
    const shuffleIndices = new Uint32Array(arr.length);
    globalThis.crypto.getRandomValues(shuffleIndices);

    for (let i = arr.length - 1; i > 0; i--) {
      const j = shuffleIndices[i]! % (i + 1);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }

    return arr.join('');
  }
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      strength: 'very-weak',
      suggestions: ['Password is required'] as readonly string[],
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length scoring
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    suggestions.push('Consider using a longer password (12+ characters)');
  } else {
    suggestions.push('Use at least 8 characters, preferably 12+');
  }

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 0.5;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 0.5;
  else suggestions.push('Add uppercase letters');

  if (/\d/.test(password)) score += 0.5;
  else suggestions.push('Add numbers');

  if (
    new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(
      password
    )
  ) {
    score += 0.5;
  } else {
    suggestions.push('Add special characters');
  }

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    suggestions.push('Avoid repeating characters');
  }

  if (/123|abc|qwe/i.test(password)) {
    score -= 0.5;
    suggestions.push('Avoid common sequences');
  }

  // Bonus for variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 0.5;
  }

  // Normalize score to 0-5 range
  score = Math.max(0, Math.min(5, score));

  const strengthMap: Record<number, PasswordStrengthResult['strength']> = {
    0: 'very-weak',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
    5: 'very-strong',
  };

  return {
    score,
    strength: strengthMap[Math.floor(score)] || 'very-weak',
    suggestions: suggestions as readonly string[],
  };
}
