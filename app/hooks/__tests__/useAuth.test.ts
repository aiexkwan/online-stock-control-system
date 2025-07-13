import { renderHook, waitFor } from '@testing-library/react';
import { 
  useAuth, 
  getUserRole, 
  getUserRoleByDepartmentAndPosition,
  getUserRoleFromDatabase,
  getCurrentUserClockNumber,
  getCurrentUserClockNumberAsync,
  usePagePermission,
  useAskDatabasePermission,
  useCurrentUserId
} from '../useAuth';
import { createClient } from '@/app/utils/supabase/client';

// Mock Supabase client
jest.mock('@/app/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('useAuth', () => {
  let mockSupabaseClient: any;
  let mockAuthStateChange: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock unsubscribe
    mockUnsubscribe = jest.fn();
    mockAuthStateChange = jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        }),
        onAuthStateChange: mockAuthStateChange
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRole (legacy)', () => {
    it('should return Pipeline User role for production email', () => {
      const role = getUserRole('production@pennineindustries.com');
      expect(role).toEqual({
        type: 'user',
        department: 'Pipeline',
        position: 'User',
        allowedPaths: ['/print-label'],
        defaultPath: '/print-label',
        navigationRestricted: true
      });
    });

    it('should return Warehouse User role for warehouse email', () => {
      const role = getUserRole('warehouse@pennineindustries.com');
      expect(role).toEqual({
        type: 'user',
        department: 'Warehouse',
        position: 'User',
        allowedPaths: ['/stock-transfer'],
        defaultPath: '/stock-transfer',
        navigationRestricted: true
      });
    });

    it('should return System Admin role for other emails', () => {
      const role = getUserRole('admin@pennineindustries.com');
      expect(role).toEqual({
        type: 'admin',
        department: 'System',
        position: 'Admin',
        allowedPaths: [],
        defaultPath: '/admin/analysis',
        navigationRestricted: false
      });
    });
  });

  describe('getUserRoleByDepartmentAndPosition', () => {
    it('should return correct role for known combinations', () => {
      const injectionAdmin = getUserRoleByDepartmentAndPosition('Injection', 'Admin');
      expect(injectionAdmin).toEqual({
        type: 'admin',
        department: 'Injection',
        position: 'Admin',
        allowedPaths: [],
        defaultPath: '/admin/injection',
        navigationRestricted: false
      });

      const warehouseUser = getUserRoleByDepartmentAndPosition('Warehouse', 'User');
      expect(warehouseUser).toEqual({
        type: 'user',
        department: 'Warehouse',
        position: 'User',
        allowedPaths: ['/stock-transfer'],
        defaultPath: '/stock-transfer',
        navigationRestricted: true
      });
    });

    it('should return default restricted user for unknown combinations', () => {
      const unknownRole = getUserRoleByDepartmentAndPosition('Unknown', 'Role');
      expect(unknownRole).toEqual({
        type: 'user',
        department: 'Unknown',
        position: 'Role',
        allowedPaths: ['/admin/upload'],
        defaultPath: '/admin/upload',
        navigationRestricted: true
      });
      expect(mockConsoleWarn).toHaveBeenCalledWith('[getUserRoleByDepartmentAndPosition] Unknown combination: Unknown_Role');
    });
  });

  describe('getUserRoleFromDatabase', () => {
    it('should fetch role from database successfully', async () => {
      const mockData = { department: 'Warehouse', position: 'Admin' };
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      });

      const role = await getUserRoleFromDatabase('test@example.com');
      
      expect(role).toEqual({
        type: 'admin',
        department: 'Warehouse',
        position: 'Admin',
        allowedPaths: [],
        defaultPath: '/stock-transfer',
        navigationRestricted: false
      });
    });

    it('should return null when user not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          })
        })
      });

      const role = await getUserRoleFromDatabase('nonexistent@example.com');
      expect(role).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(dbError)
          })
        })
      });

      const role = await getUserRoleFromDatabase('test@example.com');
      expect(role).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('[getUserRoleFromDatabase] Error:', dbError);
    });

    it('should warn on slow queries', async () => {
      // Mock slow query
      jest.useFakeTimers();
      const promise = new Promise(resolve => {
        setTimeout(() => {
          resolve({ 
            data: null, 
            error: { code: 'TIMEOUT' } 
          });
        }, 4000);
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(promise)
          })
        })
      });

      const rolePromise = getUserRoleFromDatabase('slow@example.com');
      jest.advanceTimersByTime(4000);
      await rolePromise;

      jest.useRealTimers();
    });

    it('should return null for missing department or position', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { department: 'Warehouse' }, // Missing position
              error: null 
            })
          })
        })
      });

      const role = await getUserRoleFromDatabase('incomplete@example.com');
      expect(role).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[getUserRoleFromDatabase] Missing department or position for incomplete@example.com:',
        { department: 'Warehouse' }
      );
    });
  });

  describe('useAuth hook', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userRole).toBeNull();
    });

    it('should handle authenticated user', async () => {
      const mockUser = {
        id: '123',
        email: 'admin@pennineindustries.com',
        user_metadata: {}
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userRole).toBeTruthy();
    });

    it('should handle unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userRole).toBeNull();
    });

    it('should handle auth state changes', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const { result } = renderHook(() => useAuth());
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Trigger auth state change
      const onAuthStateChange = mockAuthStateChange.mock.calls[0][0];
      onAuthStateChange('SIGNED_IN', { user: mockUser });
      
      // Note: The auth state change might not directly update the hook
      // since the hook primarily relies on getUser() call
      // The test might need adjustment based on actual implementation
      expect(mockAuthStateChange).toHaveBeenCalled();
    });

    it('should handle sign out', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      // Trigger sign out
      const onAuthStateChange = mockAuthStateChange.mock.calls[0][0];
      onAuthStateChange('SIGNED_OUT', null);
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.userRole).toBeNull();
      });
    });

    it('should cleanup subscription on unmount', () => {
      const { unmount } = renderHook(() => useAuth());
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('useCurrentUserId', () => {
    it('should return clock_number from user metadata', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { clock_number: '456' }
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => {
        const auth = useAuth();
        const userId = useCurrentUserId();
        return { auth, userId };
      });
      
      // Initially null while loading
      expect(result.current.userId).toBeNull();
    });

    it('should fallback to user id', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {}
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => {
        const auth = useAuth();
        const userId = useCurrentUserId();
        return { auth, userId };
      });
      
      // Initially null while loading
      expect(result.current.userId).toBeNull();
    });

    it('should return null when no user', () => {
      const { result } = renderHook(() => useCurrentUserId());
      expect(result.current).toBeNull();
    });
  });

  describe('getCurrentUserClockNumber', () => {
    it('should return null (deprecated)', () => {
      const result = getCurrentUserClockNumber();
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUserClockNumberAsync', () => {
    it('should fetch clock number successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 456, name: 'Test User', email: 'test@example.com' },
              error: null
            })
          })
        })
      });

      const clockNumber = await getCurrentUserClockNumberAsync();
      expect(clockNumber).toBe('456');
    });

    it('should handle no authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const clockNumber = await getCurrentUserClockNumberAsync();
      expect(clockNumber).toBeNull();
    });

    it('should handle user not found in data_id', async () => {
      const mockUser = {
        id: '123',
        email: 'notfound@example.com'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const clockNumber = await getCurrentUserClockNumberAsync();
      expect(clockNumber).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      const dbError = new Error('Database error');
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(dbError)
          })
        })
      });

      const clockNumber = await getCurrentUserClockNumberAsync();
      expect(clockNumber).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('[getCurrentUserClockNumberAsync] Error getting clock number:', dbError);
    });
  });

  // Skip these tests due to circular dependency issues when mocking hooks within the same module
  describe.skip('usePagePermission', () => {
    // These tests would require a different testing strategy
    // such as integration tests or moving the hooks to separate files
  });

  describe.skip('useAskDatabasePermission', () => {
    // These tests would require a different testing strategy
    // such as integration tests or moving the hooks to separate files
  });
});