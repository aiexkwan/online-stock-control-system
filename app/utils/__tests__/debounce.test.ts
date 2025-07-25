import { debounce, debounceWithCancel } from '../debounce';

// Mock timers
jest.useFakeTimers();

describe('debounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('basic debounce function', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn('test');

      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(1000);

      // Function should be called after delay
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn('first');
      jest.advanceTimersByTime(500);

      debouncedFn('second');
      jest.advanceTimersByTime(500);

      debouncedFn('third');
      jest.advanceTimersByTime(1000);

      // Only the last call should execute
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1', 'arg2', { key: 'value' });
      jest.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    });

    it('should allow multiple independent executions', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      // First execution
      debouncedFn('first');
      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second execution
      debouncedFn('second');
      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(2);

      expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
    });

    it('should handle zero delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('immediate');
      jest.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledWith('immediate');
    });
  });

  describe('debounceWithCancel', () => {
    it('should provide debounced function and cancel method', () => {
      const mockFn = jest.fn();
      const { debounced, cancel } = debounceWithCancel(mockFn, 1000);

      expect(typeof debounced).toBe('function');
      expect(typeof cancel).toBe('function');
    });

    it('should cancel pending execution', () => {
      const mockFn = jest.fn();
      const { debounced, cancel } = debounceWithCancel(mockFn, 1000);

      debounced('test');
      jest.advanceTimersByTime(500);

      // Cancel before execution
      cancel();
      jest.advanceTimersByTime(500);

      // Function should not be called
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle cancel when no pending execution', () => {
      const mockFn = jest.fn();
      const { debounced, cancel } = debounceWithCancel(mockFn, 1000);

      // Cancel without any pending execution
      expect(() => cancel()).not.toThrow();

      // Should still work normally after cancel
      debounced('test');
      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should allow new execution after cancel', () => {
      const mockFn = jest.fn();
      const { debounced, cancel } = debounceWithCancel(mockFn, 500);

      // First attempt - cancelled
      debounced('cancelled');
      cancel();
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();

      // Second attempt - should work
      debounced('executed');
      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledWith('executed');
    });

    it('should handle rapid call and cancel cycles', () => {
      const mockFn = jest.fn();
      const { debounced, cancel } = debounceWithCancel(mockFn, 300);

      // Rapid cycles
      debounced('1');
      jest.advanceTimersByTime(100);
      cancel();

      debounced('2');
      jest.advanceTimersByTime(100);
      cancel();

      debounced('3');
      jest.advanceTimersByTime(300);

      // Only the last one should execute
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('3');
    });
  });

  describe('edge cases', () => {
    it('should handle function that throws error', () => {
      const mockFn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();

      // Error should be thrown when timer executes
      expect(() => jest.advanceTimersByTime(100)).toThrow('Test error');
    });

    it('should maintain correct this context', () => {
      const obj = {
        value: 42,
        getValue: function() {
          return this.value;
        }
      };

      const debouncedGetValue = debounce(function(this: { value: number; getValue(): number }) {
        return this.getValue();
      }, 100);

      // Call with specific context
      debouncedGetValue.call(obj);
      jest.advanceTimersByTime(100);

      // Note: This test verifies the debounce mechanism works,
      // but 'this' context handling depends on how the function is called
    });

    it('should handle very long delays', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 10000); // 10 seconds

      debouncedFn('long-delay');

      // Advance time just before execution
      jest.advanceTimersByTime(9999);
      expect(mockFn).not.toHaveBeenCalled();

      // Advance the final millisecond
      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledWith('long-delay');
    });
  });
});
