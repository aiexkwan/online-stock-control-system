import { clockNumberToEmail, emailToClockNumber } from '../authUtils';

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clockNumberToEmail', () => {
    it('should convert clock number to email format', () => {
      expect(clockNumberToEmail('12345')).toBe('12345@pennine.com');
      expect(clockNumberToEmail('001')).toBe('001@pennine.com');
      expect(clockNumberToEmail('ABC123')).toBe('ABC123@pennine.com');
    });

    it('should handle empty string', () => {
      expect(clockNumberToEmail('')).toBe('@pennine.com');
    });

    it('should handle special characters', () => {
      expect(clockNumberToEmail('user-123')).toBe('user-123@pennine.com');
      expect(clockNumberToEmail('user_456')).toBe('user_456@pennine.com');
      expect(clockNumberToEmail('user.789')).toBe('user.789@pennine.com');
    });

    it('should handle numeric clock numbers', () => {
      expect(clockNumberToEmail('0')).toBe('0@pennine.com');
      expect(clockNumberToEmail('999999')).toBe('999999@pennine.com');
    });

    it('should preserve case', () => {
      expect(clockNumberToEmail('User123')).toBe('User123@pennine.com');
      expect(clockNumberToEmail('USER123')).toBe('USER123@pennine.com');
      expect(clockNumberToEmail('user123')).toBe('user123@pennine.com');
    });
  });

  describe('emailToClockNumber', () => {
    it('should extract clock number from valid email', () => {
      expect(emailToClockNumber('12345@pennine.com')).toBe('12345');
      expect(emailToClockNumber('001@pennine.com')).toBe('001');
      expect(emailToClockNumber('ABC123@pennine.com')).toBe('ABC123');
    });

    it('should handle special characters in clock number', () => {
      expect(emailToClockNumber('user-123@pennine.com')).toBe('user-123');
      expect(emailToClockNumber('user_456@pennine.com')).toBe('user_456');
      expect(emailToClockNumber('user.789@pennine.com')).toBe('user.789');
    });

    it('should return null for non-pennine.com emails', () => {
      expect(emailToClockNumber('user@example.com')).toBeNull();
      expect(emailToClockNumber('12345@gmail.com')).toBeNull();
      expect(emailToClockNumber('test@pennine.co.uk')).toBeNull();
    });

    it('should handle null and undefined input', () => {
      expect(emailToClockNumber(null)).toBeNull();
      expect(emailToClockNumber(undefined)).toBeNull();
      
      // Should log warning in non-production
      if (process.env.NODE_ENV !== 'production') {
        expect(mockConsoleWarn).toHaveBeenCalledWith('[authUtils] emailToClockNumber called with null or undefined email');
      }
    });

    it('should handle empty string', () => {
      expect(emailToClockNumber('')).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should handle invalid email formats', () => {
      expect(emailToClockNumber('notanemail')).toBeNull();
      expect(emailToClockNumber('@pennine.com')).toBeNull();
      expect(emailToClockNumber('pennine.com')).toBeNull();
      expect(emailToClockNumber('user@')).toBeNull();
    });

    it('should preserve case in extracted clock number', () => {
      expect(emailToClockNumber('User123@pennine.com')).toBe('User123');
      expect(emailToClockNumber('USER123@pennine.com')).toBe('USER123');
      expect(emailToClockNumber('user123@pennine.com')).toBe('user123');
    });

    it('should handle email with multiple @ symbols', () => {
      expect(emailToClockNumber('user@123@pennine.com')).toBe('user@123');
    });

    it('should handle very long clock numbers', () => {
      const longClockNumber = 'a'.repeat(100);
      expect(emailToClockNumber(`${longClockNumber}@pennine.com`)).toBe(longClockNumber);
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
      process.env.NODE_ENV = originalEnv;
    });

    it('should not warn in production', () => {
      process.env.NODE_ENV = 'production';
      emailToClockNumber(null);
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should warn in development', () => {
      process.env.NODE_ENV = 'development';
      emailToClockNumber(null);
      expect(mockConsoleWarn).toHaveBeenCalledWith('[authUtils] emailToClockNumber called with null or undefined email');
    });

    it('should warn in test environment', () => {
      process.env.NODE_ENV = 'test';
      emailToClockNumber(undefined);
      expect(mockConsoleWarn).toHaveBeenCalledWith('[authUtils] emailToClockNumber called with null or undefined email');
    });
  });
});