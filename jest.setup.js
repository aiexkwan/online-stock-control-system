// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import './__tests__/utils/custom-matchers';

// Mock Next.js Request/Response for API routes
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || '';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  async json() {
    return JSON.parse(this.body);
  }
};

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
    get: jest.fn((name) => ({ value: 'mock-cookie-value' })),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
  })),
}));
