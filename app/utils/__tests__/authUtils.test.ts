import { clockNumberToEmail, emailToClockNumber } from '../authUtils';
import { isNotProduction } from '@/lib/utils/env';

// Mock authLogger
jest.mock('@/lib/logger', () => ({
  authLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { authLogger } = require('@/lib/logger');

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clockNumberToEmail', () => {
    it('should convert clock number to email format', () => {
      expect(clockNumberToEmail('12345')).toBe('12345@pennineindustries.com');
      expect(clockNumberToEmail('001')).toBe('001@pennineindustries.com');
      expect(clockNumberToEmail('ABC123')).toBe('ABC123@pennineindustries.com');
    });

    it('should handle empty string', () => {
      expect(clockNumberToEmail('')).toBe('@pennineindustries.com');
    });

    it('should handle special characters', () => {
      expect(clockNumberToEmail('user-123')).toBe('user-123@pennineindustries.com');
      expect(clockNumberToEmail('user_456')).toBe('user_456@pennineindustries.com');
      expect(clockNumberToEmail('user.789')).toBe('user.789@pennineindustries.com');
    });

    it('should handle numeric clock numbers', () => {
      expect(clockNumberToEmail('0')).toBe('0@pennineindustries.com');
      expect(clockNumberToEmail('999999')).toBe('999999@pennineindustries.com');
    });

    it('should preserve case', () => {
      expect(clockNumberToEmail('User123')).toBe('User123@pennineindustries.com');
      expect(clockNumberToEmail('USER123')).toBe('USER123@pennineindustries.com');
      expect(clockNumberToEmail('user123')).toBe('user123@pennineindustries.com');
    });
  });

  describe('emailToClockNumber', () => {
    it('should extract clock number from valid email', () => {
      expect(emailToClockNumber('12345@pennineindustries.com')).toBe('12345');
      expect(emailToClockNumber('001@pennineindustries.com')).toBe('001');
      expect(emailToClockNumber('ABC123@pennineindustries.com')).toBe('ABC123');
    });

    it('should handle special characters in clock number', () => {
      expect(emailToClockNumber('user-123@pennineindustries.com')).toBe('user-123');
      expect(emailToClockNumber('user_456@pennineindustries.com')).toBe('user_456');
      expect(emailToClockNumber('user.789@pennineindustries.com')).toBe('user.789');
    });

    it('should return null for non-pennineindustries.com emails', () => {
      expect(emailToClockNumber('user@example.com')).toBeNull();
      expect(emailToClockNumber('12345@gmail.com')).toBeNull();
      expect(emailToClockNumber('test@pennine.co.uk')).toBeNull();
    });

    it('should handle null and undefined input', () => {
      expect(emailToClockNumber(null)).toBeNull();
      expect(emailToClockNumber(undefined)).toBeNull();
      
      // Should log warning in non-production
      if (isNotProduction()) {
        expect(authLogger.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            function: 'emailToClockNumber',
            input: null,
          }),
          'Called with null or undefined email'
        );
      }
    });

    it('should handle empty string', () => {
      expect(emailToClockNumber('')).toBeNull();
      expect(authLogger.warn).toHaveBeenCalled();
    });

    it('should handle invalid email formats', () => {
      expect(emailToClockNumber('notanemail')).toBeNull();
      expect(emailToClockNumber('@pennineindustries.com')).toBe(''); // Special case for empty clock number
      expect(emailToClockNumber('pennineindustries.com')).toBeNull();
      expect(emailToClockNumber('user@')).toBeNull();
    });

    it('should preserve case in extracted clock number', () => {
      expect(emailToClockNumber('User123@pennineindustries.com')).toBe('User123');
      expect(emailToClockNumber('USER123@pennineindustries.com')).toBe('USER123');
      expect(emailToClockNumber('user123@pennineindustries.com')).toBe('user123');
    });

    it('should handle email with multiple @ symbols', () => {
      expect(emailToClockNumber('user@123@pennineindustries.com')).toBe('user@123');
    });

    it('should handle very long clock numbers', () => {
      const longClockNumber = 'a'.repeat(100);
      expect(emailToClockNumber(`${longClockNumber}@pennineindustries.com`)).toBe(longClockNumber);
    });
  });

  describe('integration tests', () => {
    it('should be reversible operations', () => {
      const clockNumbers = ['12345', 'ABC123', 'user-001', 'Test.User_99'];
      
      clockNumbers.forEach(clockNumber => {
        const email = clockNumberToEmail(clockNumber);
        const extracted = emailToClockNumber(email);
        expect(extracted).toBe(clockNumber);
      });
    });

    it('should handle edge case clock numbers in round trip', () => {
      const edgeCases = ['', '0', '-', '_', '.', '...', '---', '___'];
      
      edgeCases.forEach(clockNumber => {
        const email = clockNumberToEmail(clockNumber);
        const extracted = emailToClockNumber(email);
        expect(extracted).toBe(clockNumber);
      });
    });
  });

  describe('NODE_ENV behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('should not warn in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      emailToClockNumber(null);
      expect(authLogger.warn).not.toHaveBeenCalled();
    });

    it('should warn in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      emailToClockNumber(null);
      expect(authLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          function: 'emailToClockNumber',
          input: null,
        }),
        'Called with null or undefined email'
      );
    });

    it('should warn in test environment', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true
      });
      emailToClockNumber(undefined);
      expect(authLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          function: 'emailToClockNumber',
          input: undefined,
        }),
        'Called with null or undefined email'
      );
    });
  });
});