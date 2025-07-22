// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import './__tests__/utils/custom-matchers';

// Add TextDecoder and TextEncoder polyfills for Node.js environment
import { TextDecoder, TextEncoder } from 'util';
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Set environment variables for Supabase client
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Next.js Request/Response for API routes
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers || {});
      this.body = init?.body;
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Headers(init?.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  };
}

// Mock Headers if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase());
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }
  };
}

// Mock window.matchMedia - Enhanced for framer-motion
const mockMediaQueryList = {
  matches: false,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    ...mockMediaQueryList,
    media: query,
  })),
});

// Mock MediaQueryList constructor
global.MediaQueryList = function MediaQueryList() {
  return mockMediaQueryList;
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock scrollTop getter/setter
Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', {
  writable: true,
  configurable: true,
  value: 0,
});

// Mock Blob and URL for Excel generation tests
global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    if (Array.isArray(content)) {
      this.size = content.reduce((sum, chunk) => {
        if (chunk instanceof ArrayBuffer) return sum + chunk.byteLength;
        if (typeof chunk === 'string') return sum + chunk.length;
        if (chunk && typeof chunk.length === 'number') return sum + chunk.length;
        return sum + 1000; // fallback for buffer-like objects
      }, 0);
    } else if (content instanceof ArrayBuffer) {
      this.size = content.byteLength;
    } else if (content && typeof content.length === 'number') {
      this.size = content.length;
    } else {
      this.size = 1000; // default size for mock
    }
    this.type = options?.type || '';
  }
};

// Mock URL constructor and methods
global.URL = class URL {
  constructor(url, base) {
    this.href = url;
    this.origin = 'https://example.com';
    this.protocol = 'https:';
    this.host = 'example.com';
    this.hostname = 'example.com';
    this.port = '';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }

  toString() {
    return this.href;
  }

  static createObjectURL = jest.fn(() => 'blob:mock-url');
  static revokeObjectURL = jest.fn();
};

// Mock WebSocket for Supabase Realtime
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.send = jest.fn();
    this.close = jest.fn();
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    this.dispatchEvent = jest.fn();
  }
};

// Mock isows module
jest.mock('isows', () => ({
  WebSocket: global.WebSocket,
  default: global.WebSocket,
}));

// Mock @supabase/realtime-js
jest.mock('@supabase/realtime-js', () => ({
  RealtimeClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(name => ({ value: 'mock-cookie-value' })),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
  })),
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const actualNext = jest.requireActual('next/dist/server/web/spec-extension/response');
  return {
    NextRequest: class NextRequest extends Request {
      constructor(input, init) {
        super(input, init);
        this.nextUrl = new URL(this.url);
      }
    },
    NextResponse: {
      json: (data, init) => {
        return new Response(JSON.stringify(data), {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...init?.headers,
          },
        });
      },
    },
  };
});

// MSW (Mock Service Worker) Setup
// Configure MSW for API mocking in tests
let server;

try {
  // Try to import MSW
  const { setupServer } = require('msw/node');
  const { allHandlers } = require('./__tests__/mocks/handlers');

  // Setup MSW Server
  server = setupServer(...allHandlers);

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Clean up after all tests
  afterAll(() => server.close());
} catch (error) {
  // Fallback if MSW is not available
  console.warn('MSW not available, using placeholder server');
  server = {
    listen: () => {},
    resetHandlers: () => {},
    close: () => {},
    use: () => {},
  };
}

module.exports.server = server;

// Enable API route handler testing
process.env.NODE_ENV = 'test';

// 數據庫連接池優化設置
try {
  const { setupTestDbCleanup } = require('./__tests__/utils/test-db-pool');
  setupTestDbCleanup();
} catch (error) {
  console.warn('Test DB pool setup failed:', error.message);
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep important logs
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silence less important logs
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Enhanced fetch mock for Next.js API routes
global.fetch = jest.fn();

// 性能監控設置
const slowTestThreshold = 5000; // 5秒
let testStartTime;

beforeEach(() => {
  testStartTime = performance.now();
});

afterEach(() => {
  const testDuration = performance.now() - testStartTime;
  if (testDuration > slowTestThreshold) {
    console.warn(`Slow test detected: took ${testDuration}ms`);
  }
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock Performance API for Widget Performance Monitor
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}

  static supportedEntryTypes = ['paint', 'navigation', 'resource'];
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}
};
