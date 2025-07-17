/**
 * Simple test to verify Jest configuration works
 */

describe('Simple Test', () => {
  test('should pass basic test', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  test('should handle async test', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});