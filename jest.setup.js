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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

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

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
};
