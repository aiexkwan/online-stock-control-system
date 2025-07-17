/**
 * Test Cleanup Utilities
 * Provides hooks and utilities for cleaning up test data and state
 */

import { createMockSupabaseClient } from './test-utils';
import { cleanupSupabaseMocks } from './supabase-test-helpers';

// Types
interface CleanupTask {
  name: string;
  fn: () => void | Promise<void>;
  priority: number; // Lower number = higher priority
}

interface TestCleanupOptions {
  clearMocks?: boolean;
  clearTimers?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearIndexedDB?: boolean;
  clearConsole?: boolean;
  customCleanups?: CleanupTask[];
}

// Global cleanup registry
const cleanupRegistry: Set<CleanupTask> = new Set();

/**
 * Hook for managing test cleanup operations
 * Automatically handles common cleanup tasks and allows custom cleanup functions
 */
export const useTestCleanup = (options: TestCleanupOptions = {}) => {
  const {
    clearMocks = true,
    clearTimers = true,
    clearLocalStorage = true,
    clearSessionStorage = true,
    clearIndexedDB = false,
    clearConsole = false,
    customCleanups = [],
  } = options;

  // Register cleanup tasks
  const registerCleanup = (task: CleanupTask) => {
    cleanupRegistry.add(task);
  };

  // Unregister cleanup tasks
  const unregisterCleanup = (taskName: string) => {
    const task = Array.from(cleanupRegistry).find(t => t.name === taskName);
    if (task) {
      cleanupRegistry.delete(task);
    }
  };

  // Core cleanup function
  const cleanup = async () => {
    // Sort tasks by priority
    const tasks = Array.from(cleanupRegistry).sort((a, b) => a.priority - b.priority);

    // Execute all cleanup tasks
    for (const task of tasks) {
      try {
        await task.fn();
      } catch (error) {
        console.error(`Cleanup task "${task.name}" failed:`, error);
      }
    }

    // Clear the registry after cleanup
    cleanupRegistry.clear();
  };

  // Initialize default cleanup tasks
  if (clearMocks) {
    registerCleanup({
      name: 'clearMocks',
      fn: () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        cleanupSupabaseMocks();
      },
      priority: 1,
    });
  }

  if (clearTimers) {
    registerCleanup({
      name: 'clearTimers',
      fn: () => {
        jest.clearAllTimers();
        if (jest.isMockFunction(setTimeout)) {
          jest.useRealTimers();
        }
      },
      priority: 2,
    });
  }

  if (clearLocalStorage && typeof localStorage !== 'undefined') {
    registerCleanup({
      name: 'clearLocalStorage',
      fn: () => localStorage.clear(),
      priority: 3,
    });
  }

  if (clearSessionStorage && typeof sessionStorage !== 'undefined') {
    registerCleanup({
      name: 'clearSessionStorage',
      fn: () => sessionStorage.clear(),
      priority: 3,
    });
  }

  if (clearIndexedDB && typeof indexedDB !== 'undefined') {
    registerCleanup({
      name: 'clearIndexedDB',
      fn: async () => {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return indexedDB.deleteDatabase(db.name);
            }
          })
        );
      },
      priority: 4,
    });
  }

  if (clearConsole) {
    registerCleanup({
      name: 'clearConsole',
      fn: () => {
        if (console.clear) {
          console.clear();
        }
      },
      priority: 5,
    });
  }

  // Register custom cleanup tasks
  customCleanups.forEach((task, index) => {
    registerCleanup({
      ...task,
      priority: task.priority ?? 10 + index,
    });
  });

  return {
    cleanup,
    registerCleanup,
    unregisterCleanup,
    // Utility functions
    resetDOM: () => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';
    },
    resetFetch: () => {
      if (global.fetch && jest.isMockFunction(global.fetch)) {
        (global.fetch as jest.Mock).mockReset();
      }
    },
    resetEnvironment: () => {
      // Reset environment variables to test defaults
      // Use Object.defineProperty to set read-only NODE_ENV in tests
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
        enumerable: true
      });
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    },
  };
};

/**
 * Helper to create a scoped test cleanup
 * Useful for test suites that need isolated cleanup
 */
export const createScopedCleanup = () => {
  const scopedTasks: CleanupTask[] = [];

  const addTask = (task: CleanupTask) => {
    scopedTasks.push(task);
  };

  const runCleanup = async () => {
    const sortedTasks = scopedTasks.sort((a, b) => a.priority - b.priority);
    
    for (const task of sortedTasks) {
      try {
        await task.fn();
      } catch (error) {
        console.error(`Scoped cleanup task "${task.name}" failed:`, error);
      }
    }
    
    // Clear scoped tasks
    scopedTasks.length = 0;
  };

  return {
    addTask,
    runCleanup,
    getTasks: () => [...scopedTasks],
  };
};

/**
 * Cleanup helper for database transactions
 * Ensures all test transactions are rolled back
 */
export const cleanupTestTransactions = async (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  transactionIds: string[]
) => {
  const rollbackPromises = transactionIds.map(id =>
    supabase.rpc('rollback_transaction', {
      p_transaction_id: id,
      p_reason: 'Test cleanup',
    })
  );

  await Promise.allSettled(rollbackPromises);
};

/**
 * Cleanup helper for temporary test files
 */
export const cleanupTestFiles = async (filePaths: string[]) => {
  if (typeof window === 'undefined') {
    // Node.js environment
    const fs = await import('fs/promises');
    
    const deletePromises = filePaths.map(async path => {
      try {
        await fs.unlink(path);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Failed to delete test file: ${path}`, error);
        }
      }
    });

    await Promise.all(deletePromises);
  }
};

/**
 * Memory leak detection helper
 * Tracks object references to detect potential memory leaks
 */
export class MemoryLeakDetector {
  private references: WeakMap<object, string> = new WeakMap();
  private startHeapUsed: number = 0;

  start() {
    if (global.gc) {
      global.gc();
    }
    this.startHeapUsed = process.memoryUsage().heapUsed;
  }

  track(obj: object, label: string) {
    this.references.set(obj, label);
  }

  async check(threshold: number = 10 * 1024 * 1024) { // 10MB default
    if (global.gc) {
      global.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentHeapUsed = process.memoryUsage().heapUsed;
    const heapGrowth = currentHeapUsed - this.startHeapUsed;
    
    if (heapGrowth > threshold) {
      console.warn(`Potential memory leak detected: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB growth`);
      return false;
    }
    
    return true;
  }

  reset() {
    this.references = new WeakMap();
    this.startHeapUsed = 0;
  }
}

// Pre-configured cleanup for common test scenarios
export const cleanupPresets = {
  // Unit test cleanup
  unit: () => useTestCleanup({
    clearMocks: true,
    clearTimers: true,
    clearLocalStorage: false,
    clearSessionStorage: false,
    clearIndexedDB: false,
  }),

  // Integration test cleanup
  integration: () => useTestCleanup({
    clearMocks: true,
    clearTimers: true,
    clearLocalStorage: true,
    clearSessionStorage: true,
    clearIndexedDB: false,
  }),

  // E2E test cleanup
  e2e: () => useTestCleanup({
    clearMocks: true,
    clearTimers: true,
    clearLocalStorage: true,
    clearSessionStorage: true,
    clearIndexedDB: true,
    clearConsole: true,
  }),
};

// Global cleanup that runs after all tests
export const setupGlobalCleanup = () => {
  if (typeof afterAll !== 'undefined') {
    afterAll(async () => {
      // Clean up any remaining tasks
      const tasks = Array.from(cleanupRegistry);
      for (const task of tasks) {
        try {
          await task.fn();
        } catch (error) {
          console.error(`Global cleanup task "${task.name}" failed:`, error);
        }
      }
      cleanupRegistry.clear();
    });
  }
};

export default {
  useTestCleanup,
  createScopedCleanup,
  cleanupTestTransactions,
  cleanupTestFiles,
  MemoryLeakDetector,
  cleanupPresets,
  setupGlobalCleanup,
};