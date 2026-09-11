import { describe, it, expect, beforeEach } from 'vitest';
import { authAPI, getAuthToken, setAuthToken, removeAuthToken } from '../lib/api';

describe('Frontend Auth & API Security (Phase 10)', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      }
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  });

  it('getAuthToken returns null and does not read from localStorage', () => {
    localStorage.setItem('authToken', 'stale_token_test');
    expect(getAuthToken()).toBeNull();
  });

  it('setAuthToken and removeAuthToken are safe no-ops and do not write to localStorage', () => {
    setAuthToken('test_jwt_123');
    expect(localStorage.getItem('authToken')).toBeNull();
    removeAuthToken();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('authAPI exposes standard authentication methods relying on cookies', () => {
    expect(typeof authAPI.login).toBe('function');
    expect(typeof authAPI.register).toBe('function');
    expect(typeof authAPI.logout).toBe('function');
    expect(typeof authAPI.getProfile).toBe('function');
    expect(typeof authAPI.verifyEmail).toBe('function');
    expect(typeof authAPI.resendVerification).toBe('function');
  });
});
