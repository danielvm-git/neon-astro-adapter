import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@neondatabase/auth', () => ({
  createAuthClient: vi.fn((url: string) => ({
    signIn: { email: vi.fn(), social: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
    getSession: vi.fn(),
    _url: url,
  })),
}));

import { createAuthClient as _upstreamCreate } from '@neondatabase/auth';
import { createAuthClient } from './index';

describe('createAuthClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to @neondatabase/auth createAuthClient with the given URL', () => {
    createAuthClient('https://auth.example.com');

    expect(_upstreamCreate).toHaveBeenCalledWith('https://auth.example.com');
  });

  it('returns the client from @neondatabase/auth', () => {
    const client = createAuthClient('https://auth.example.com');

    expect(client).toHaveProperty('signIn');
    expect(client).toHaveProperty('signUp');
    expect(client).toHaveProperty('signOut');
    expect(client).toHaveProperty('getSession');
  });

  it('returns the exact same object from the upstream', () => {
    const client = createAuthClient('https://auth.example.com');

    expect((client as unknown as { _url: string })._url).toBe('https://auth.example.com');
  });
});
