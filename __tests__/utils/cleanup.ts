/**
 * Test cleanup utilities
 */

/**
 * Interface for cleanup functions
 */
interface CleanupFunction {
  (): void | Promise<void>;
}

/**
 * Test cleanup utility to manage cleanup functions
 */
export function useTestCleanup() {
  const cleanupFunctions: CleanupFunction[] = [];

  /**
   * Register a cleanup function to be called during test teardown
   */
  const registerCleanup = (fn: CleanupFunction) => {
    cleanupFunctions.push(fn);
  };

  /**
   * Execute all registered cleanup functions
   */
  const cleanup = async () => {
    // Execute cleanup functions in reverse order (LIFO)
    for (let i = cleanupFunctions.length - 1; i >= 0; i--) {
      try {
        await cleanupFunctions[i]();
      } catch (error) {
        console.error('Cleanup function failed:', error);
      }
    }
    // Clear the array
    cleanupFunctions.length = 0;
  };

  return {
    cleanup,
    registerCleanup,
  };
}

/**
 * Global test cleanup for database connections
 */
export async function cleanupTestDatabase() {
  // Placeholder for database cleanup logic
  // This would typically close connections, rollback transactions, etc.
}

/**
 * Cleanup function for mocked timers
 */
export function cleanupTimers() {
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
}

/**
 * Cleanup function for DOM elements created during tests
 */
export function cleanupDOM() {
  // Clean up any elements added to document.body during tests
  document.body.innerHTML = '';
  
  // Reset any document properties that might have been modified
  document.title = '';
  
  // Clear any data attributes
  Object.keys(document.documentElement.dataset).forEach(key => {
    delete document.documentElement.dataset[key];
  });
}

/**
 * Cleanup function for localStorage and sessionStorage
 */
export function cleanupStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Master cleanup function that runs all cleanup utilities
 */
export async function cleanupAll() {
  cleanupTimers();
  cleanupDOM();
  cleanupStorage();
  await cleanupTestDatabase();
}

/**
 * Jest lifecycle hooks helper
 */
export function setupCleanupHooks() {
  afterEach(async () => {
    await cleanupAll();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestDatabase();
  });
}
