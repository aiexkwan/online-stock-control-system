import { getUserIdFromEmail } from '../getUserIdClient';
import { createClient } from '@/app/utils/supabase/client';

// Mock the Supabase client
jest.mock('@/app/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('getUserIdClient', () => {
  let mockSupabase: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockIlike: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockIlike = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ 
      eq: mockEq,
      ilike: mockIlike 
    });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    mockSupabase = {
      from: mockFrom
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return user ID when email is found', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com'
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail('test@example.com');
      
      expect(result).toBe(123);
      expect(mockFrom).toHaveBeenCalledWith('data_id');
      expect(mockSelect).toHaveBeenCalledWith('id, name, email');
      expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
      expect(mockConsoleLog).toHaveBeenCalledWith('[getUserIdFromEmail Client] Looking up email:', 'test@example.com');
      expect(mockConsoleLog).toHaveBeenCalledWith('[getUserIdFromEmail Client] Found user:', mockUser);
    });

    it('should handle case-insensitive email lookup with ilike', async () => {
      const mockUser = {
        id: 456,
        name: 'Case Test',
        email: 'CaseTest@Example.com'
      };
      
      // First query fails
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      // ilike query succeeds
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail('casetest@example.com');
      
      expect(result).toBe(456);
      expect(mockIlike).toHaveBeenCalledWith('email', 'casetest@example.com');
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail Client] Error querying data_id:', { message: 'Not found' });
      expect(mockConsoleLog).toHaveBeenCalledWith('[getUserIdFromEmail Client] Found user with ilike:', mockUser);
    });

    it('should return ID from data object', async () => {
      const mockUser = {
        id: 789,
        name: 'User Name',
        email: 'user@example.com'
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail('user@example.com');
      
      expect(result).toBe(789);
    });
  });

  describe('error handling', () => {
    it('should return null when user is not found', async () => {
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'User not found' } 
      });
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'User not found with ilike' } 
      });
      
      const result = await getUserIdFromEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail Client] Error querying data_id:', { message: 'User not found' });
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail Client] Email was:', 'nonexistent@example.com');
    });

    it('should return null when data exists but has no ID', async () => {
      const mockUserWithoutId = {
        name: 'No ID User',
        email: 'noid@example.com'
        // id is missing
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUserWithoutId, error: null });
      
      const result = await getUserIdFromEmail('noid@example.com');
      
      expect(result).toBeNull();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      (createClient as jest.Mock).mockImplementation(() => {
        throw dbError;
      });
      
      const result = await getUserIdFromEmail('test@example.com');
      
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail] Unexpected error:', dbError);
    });

    it('should handle query execution errors', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Query failed'));
      
      const result = await getUserIdFromEmail('test@example.com');
      
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle ilike query errors gracefully', async () => {
      // First query fails
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Not found' } 
      });
      // ilike query also fails
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'ilike query failed' } 
      });
      
      const result = await getUserIdFromEmail('test@example.com');
      
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email string', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } });
      
      const result = await getUserIdFromEmail('');
      
      expect(result).toBeNull();
      expect(mockEq).toHaveBeenCalledWith('email', '');
    });

    it('should handle email with special characters', async () => {
      const specialEmail = 'user+tag@sub.example.com';
      const mockUser = {
        id: 789,
        name: 'Special User',
        email: specialEmail
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail(specialEmail);
      
      expect(result).toBe(789);
      expect(mockEq).toHaveBeenCalledWith('email', specialEmail);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Email too long' } });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Email too long' } });
      
      const result = await getUserIdFromEmail(longEmail);
      
      expect(result).toBeNull();
    });

    it('should handle multiple simultaneous requests', async () => {
      const mockUser1 = { id: 1, name: 'User 1', email: 'user1@example.com' };
      const mockUser2 = { id: 2, name: 'User 2', email: 'user2@example.com' };
      
      mockSingle
        .mockResolvedValueOnce({ data: mockUser1, error: null })
        .mockResolvedValueOnce({ data: mockUser2, error: null });
      
      const [result1, result2] = await Promise.all([
        getUserIdFromEmail('user1@example.com'),
        getUserIdFromEmail('user2@example.com')
      ]);
      
      expect(result1).toBe(1);
      expect(result2).toBe(2);
    });
  });

  describe('logging behavior', () => {
    it('should log all steps in successful lookup', async () => {
      const mockUser = { id: 100, name: 'Logger Test', email: 'logger@example.com' };
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      await getUserIdFromEmail('logger@example.com');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, '[getUserIdFromEmail Client] Looking up email:', 'logger@example.com');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, '[getUserIdFromEmail Client] Found user:', mockUser);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should log errors when lookup fails', async () => {
      const error = { code: 'PGRST116', message: 'User not found' };
      mockSingle.mockResolvedValueOnce({ data: null, error });
      mockSingle.mockResolvedValueOnce({ data: null, error });
      
      await getUserIdFromEmail('error@example.com');
      
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail Client] Error querying data_id:', error);
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserIdFromEmail Client] Email was:', 'error@example.com');
    });

    it('should use consistent log prefix', async () => {
      const mockUser = { id: 123, name: 'Test', email: 'test@example.com' };
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      await getUserIdFromEmail('test@example.com');
      
      // All logs should start with [getUserIdFromEmail Client]
      mockConsoleLog.mock.calls.forEach(call => {
        expect(call[0]).toMatch(/^\[getUserIdFromEmail Client\]/);
      });
    });
  });

  describe('data type handling', () => {
    it('should handle numeric ID as string', async () => {
      const mockUser = {
        id: '999' as any, // ID as string
        name: 'String ID User',
        email: 'stringid@example.com'
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail('stringid@example.com');
      
      expect(result).toBe('999');
    });

    it('should handle null values in user data', async () => {
      const mockUser = {
        id: 123,
        name: null,
        email: 'nullname@example.com'
      };
      
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      
      const result = await getUserIdFromEmail('nullname@example.com');
      
      expect(result).toBe(123);
    });
  });
});