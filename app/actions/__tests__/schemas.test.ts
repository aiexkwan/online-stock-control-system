import { clockNumberSchema, passwordSchema } from '../schemas';
import { z } from 'zod';

describe('schemas', () => {
  describe('clockNumberSchema', () => {
    it('should accept valid clock numbers', () => {
      const validNumbers = ['123', '001', '999999', '0'];

      validNumbers.forEach(num => {
        const result = clockNumberSchema.safeParse(num);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(parseInt(num, 10));
        }
      });
    });

    it('should transform string to number', () => {
      const result = clockNumberSchema.parse('123');
      expect(typeof result).toBe('number');
      expect(result).toBe(123);
    });

    it('should handle leading zeros', () => {
      const result = clockNumberSchema.parse('00123');
      expect(result).toBe(123);
    });

    it('should reject non-numeric strings', () => {
      const invalidNumbers = ['abc', '12a', 'a12', '12.3', '-123', ''];

      invalidNumbers.forEach(num => {
        const result = clockNumberSchema.safeParse(num);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Clock Number must be a positive number string.');
        }
      });
    });

    it('should reject special characters', () => {
      const result = clockNumberSchema.safeParse('123!@#');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = clockNumberSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(clockNumberSchema.safeParse(null).success).toBe(false);
      expect(clockNumberSchema.safeParse(undefined).success).toBe(false);
    });

    it('should handle very large numbers', () => {
      const largeNumber = '9'.repeat(20);
      const result = clockNumberSchema.safeParse(largeNumber);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(parseInt(largeNumber, 10));
      }
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'abc123',
        'ABC123',
        'Password1',
        '123456',
        'abcdef',
        'ABCDEF',
        'aB1cD2eF3'
      ];

      validPasswords.forEach(pwd => {
        const result = passwordSchema.safeParse(pwd);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(pwd);
        }
      });
    });

    it('should reject passwords shorter than 6 characters', () => {
      const shortPasswords = ['', 'a', 'ab', 'abc', 'abcd', 'abcde'];

      shortPasswords.forEach(pwd => {
        const result = passwordSchema.safeParse(pwd);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password must be at least 6 characters long.');
        }
      });
    });

    it('should accept exactly 6 characters', () => {
      const result = passwordSchema.parse('abc123');
      expect(result).toBe('abc123');
    });

    it('should reject passwords with special characters', () => {
      const invalidPasswords = [
        'abc@123',
        'abc!def',
        'pass word',
        'pass-word',
        'pass_word',
        'pass.word',
        'パスワード123',  // Made sure it's at least 6 characters
        '密碼123456'     // Made sure it's at least 6 characters
      ];

      invalidPasswords.forEach(pwd => {
        const result = passwordSchema.safeParse(pwd);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password can only contain letters and numbers.');
        }
      });
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(100) + 'A'.repeat(100) + '1'.repeat(100);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(longPassword);
      }
    });

    it('should reject null and undefined', () => {
      expect(passwordSchema.safeParse(null).success).toBe(false);
      expect(passwordSchema.safeParse(undefined).success).toBe(false);
    });

    it('should handle mixed case alphanumeric', () => {
      const mixedCase = 'aBc123XyZ789';
      const result = passwordSchema.parse(mixedCase);
      expect(result).toBe(mixedCase);
    });

    it('should validate error messages', () => {
      // Test length error
      const shortResult = passwordSchema.safeParse('abc');
      expect(shortResult.success).toBe(false);
      if (!shortResult.success) {
        expect(shortResult.error.errors[0].code).toBe('too_small');
      }

      // Test regex error
      const specialResult = passwordSchema.safeParse('abc@123');
      expect(specialResult.success).toBe(false);
      if (!specialResult.success) {
        expect(specialResult.error.errors[0].code).toBe('invalid_string');
      }
    });
  });

  describe('schema composition', () => {
    it('should work with zod methods', () => {
      // Test that schemas can be extended
      const extendedClockNumber = clockNumberSchema.refine(
        val => val > 0,
        { message: 'Must be positive' }
      );

      expect(extendedClockNumber.safeParse('0').success).toBe(false);
      expect(extendedClockNumber.safeParse('1').success).toBe(true);
    });

    it('should work in object schemas', () => {
      const userSchema = z.object({
        clockNumber: clockNumberSchema,
        password: passwordSchema
      });

      const validUser = {
        clockNumber: '123',
        password: 'abc123'
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clockNumber).toBe(123);
        expect(result.data.password).toBe('abc123');
      }
    });

    it('should collect multiple errors', () => {
      const userSchema = z.object({
        clockNumber: clockNumberSchema,
        password: passwordSchema
      });

      const invalidUser = {
        clockNumber: 'abc',
        password: '123'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(2);
      }
    });
  });
});
