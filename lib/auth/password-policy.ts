/**
 * Unified Password Policy Configuration
 * Single source of truth for password requirements
 */

export const PASSWORD_POLICY = {
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
    tooShort: `Password must be at least ${12} characters long`,
    tooLong: `Password must not exceed ${128} characters`,
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
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
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
    const patterns = [
      /(.)\1{2,}/, // Repeated characters
      /12345/, // Sequential numbers
      /qwerty/i, // Keyboard patterns
      /password/i, // Common words
      /admin/i,
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
    errors,
  };
}

/**
 * Generate cryptographically secure password
 */
export function generateSecurePassword(length: number = 16): string {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const crypto = require('crypto');
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
      PASSWORD_POLICY.specialChars;

    let password = '';

    // Ensure at least one of each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
    password += '0123456789'[crypto.randomInt(10)];
    password += PASSWORD_POLICY.specialChars[crypto.randomInt(PASSWORD_POLICY.specialChars.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[crypto.randomInt(charset.length)];
    }

    // Shuffle using Fisher-Yates
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.join('');
  } else {
    // Client-side: use Web Crypto API
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
      PASSWORD_POLICY.specialChars;

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    let password = '';

    // Ensure at least one of each required type
    const indices = new Uint32Array(4);
    crypto.getRandomValues(indices);

    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[indices[0] % 26];
    password += 'abcdefghijklmnopqrstuvwxyz'[indices[1] % 26];
    password += '0123456789'[indices[2] % 10];
    password += PASSWORD_POLICY.specialChars[indices[3] % PASSWORD_POLICY.specialChars.length];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    // Shuffle
    const arr = password.split('');
    const shuffleIndices = new Uint32Array(arr.length);
    crypto.getRandomValues(shuffleIndices);

    for (let i = arr.length - 1; i > 0; i--) {
      const j = shuffleIndices[i] % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.join('');
  }
}
