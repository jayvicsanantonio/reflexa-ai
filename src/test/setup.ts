/**
 * Test setup file for Vitest
 * Configures global mocks and test environment
 */

import { vi } from 'vitest';

// Mock Chrome API
const mockChromeStorage = {
  local: {
    get: vi.fn((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: undefined });
      }
      const result: Record<string, unknown> = {};
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          result[key] = undefined;
        });
      }
      return Promise.resolve(result);
    }),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getBytesInUse: vi.fn(() => Promise.resolve(0)),
    QUOTA_BYTES: 5242880, // 5MB
  },
  sync: {
    get: vi.fn(() => Promise.resolve({})),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  },
};

const mockChromeRuntime = {
  sendMessage: vi.fn(() => Promise.resolve()),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Setup global chrome object
global.chrome = {
  storage: mockChromeStorage,
  runtime: mockChromeRuntime,
} as any;

// Mock window.matchMedia for prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.hidden for visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
