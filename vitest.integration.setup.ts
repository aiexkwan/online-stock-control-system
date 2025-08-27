/**
 * Vitest Integration Test Setup
 * Configures the testing environment for integration tests with Supabase and PDF services
 */

import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './__tests__/mocks/server';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Global mocks for browser APIs
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: mockResizeObserver,
});

// Mock URL.createObjectURL for PDF testing
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockReturnValue('mock-blob-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock canvas for PDF generation
const mockCanvas = {
  getContext: vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    fillText: vi.fn(),
  }),
  toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
  toBlob: vi.fn((callback) => callback(new Blob(['mock'], { type: 'image/png' }))),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: mockCanvas.getContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  writable: true,
  value: mockCanvas.toDataURL,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  writable: true,
  value: mockCanvas.toBlob,
});

// Mock window.print for printing tests
Object.defineProperty(window, 'print', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: mockStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: mockStorage,
});

// Mock console to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Start MSW server
  server.listen({ 
    onUnhandledRequest: 'error',
  });
  
  // Mock console methods to reduce test noise
  console.error = vi.fn((message, ...args) => {
    // Allow certain errors to pass through for debugging
    if (typeof message === 'string' && (
      message.includes('Error:') ||
      message.includes('Network Error') ||
      message.includes('Test Error')
    )) {
      originalConsoleError(message, ...args);
    }
  });
  
  console.warn = vi.fn((message, ...args) => {
    // Allow certain warnings to pass through for debugging
    if (typeof message === 'string' && message.includes('Test Warning')) {
      originalConsoleWarn(message, ...args);
    }
  });
});

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clean up localStorage and sessionStorage
  mockStorage.clear();
});

afterAll(() => {
  // Clean up MSW
  server.close();
  
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
declare global {
  var testUtils: {
    mockStorage: typeof mockStorage;
    mockMatchMedia: typeof mockMatchMedia;
    mockIntersectionObserver: typeof mockIntersectionObserver;
    mockResizeObserver: typeof mockResizeObserver;
    mockCanvas: typeof mockCanvas;
  };
}

globalThis.testUtils = {
  mockStorage,
  mockMatchMedia,
  mockIntersectionObserver,
  mockResizeObserver,
  mockCanvas,
};

// Suppress specific warnings that are expected in test environment
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Warning: render is deprecated') ||
      args[0].includes('act(...) is not supported') ||
      args[0].includes('Jest worker encountered') ||
      args[0].includes('PDF.js') ||
      args[0].includes('Canvas is not defined')
    )
  ) {
    return;
  }
  originalError.call(console, ...args);
};