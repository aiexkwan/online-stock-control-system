// Custom Jest matchers

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeWithinRange(min: number, max: number): R;
      toContainObject(expected: Record<string, any>): R;
      toHaveBeenCalledWithPartial(expected: Record<string, any>): R;
      toBeValidDate(): R;
      toBeValidPalletCode(): R;
      toBeValidProductCode(): R;
    }
  }
}

// UUID validation matcher
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      message: () => 
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
      pass,
    };
  },
});

// Range validation matcher
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    
    return {
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min} - ${max}`
          : `expected ${received} to be within range ${min} - ${max}`,
      pass,
    };
  },
});

// Object containment matcher
expect.extend({
  toContainObject(received: any[], expected: Record<string, any>) {
    const pass = received.some(item =>
      Object.entries(expected).every(([key, value]) => item[key] === value)
    );
    
    return {
      message: () =>
        pass
          ? `expected array not to contain object matching ${JSON.stringify(expected)}`
          : `expected array to contain object matching ${JSON.stringify(expected)}`,
      pass,
    };
  },
});

// Partial call matcher
expect.extend({
  toHaveBeenCalledWithPartial(received: jest.Mock, expected: Record<string, any>) {
    const calls = received.mock.calls;
    const pass = calls.some(call =>
      call.some(arg =>
        typeof arg === 'object' &&
        Object.entries(expected).every(([key, value]) => arg[key] === value)
      )
    );
    
    return {
      message: () =>
        pass
          ? `expected function not to have been called with partial object ${JSON.stringify(expected)}`
          : `expected function to have been called with partial object ${JSON.stringify(expected)}`,
      pass,
    };
  },
});

// Date validation matcher
expect.extend({
  toBeValidDate(received: any) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid date`,
      pass,
    };
  },
});

// Pallet code validation matcher
expect.extend({
  toBeValidPalletCode(received: string) {
    const palletCodeRegex = /^PLT\d{8}$/;
    const pass = palletCodeRegex.test(received);
    
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid pallet code`
          : `expected ${received} to be a valid pallet code (format: PLT########)`,
      pass,
    };
  },
});

// Product code validation matcher
expect.extend({
  toBeValidProductCode(received: string) {
    const productCodeRegex = /^[A-Z0-9]{6,12}$/;
    const pass = productCodeRegex.test(received);
    
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid product code`
          : `expected ${received} to be a valid product code (6-12 alphanumeric uppercase characters)`,
      pass,
    };
  },
});

export {};