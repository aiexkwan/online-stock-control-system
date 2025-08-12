/**
 * Test Cleanup Utilities
 */

export function useTestCleanup() {
  const cleanupFns: Array<() => void | Promise<void>> = [];

  const addCleanup = (fn: () => void | Promise<void>) => {
    cleanupFns.push(fn);
  };

  const cleanup = async () => {
    for (const fn of cleanupFns) {
      await fn();
    }
    cleanupFns.length = 0;
  };

  // Automatically cleanup after each test
  afterEach(async () => {
    await cleanup();
  });

  return {
    addCleanup,
    cleanup
  };
}

export function clearAllMocks() {
  jest.clearAllMocks();
  jest.clearAllTimers();
}