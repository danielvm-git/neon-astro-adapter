import { describe, it, expect, vi } from 'vitest';
import { createAstroRequestContext } from './adapter';

function mockAPIContext(overrides: {
  cookieHeader?: string;
  origin?: string;
  urlOrigin?: string;
  headers?: Record<string, string>;
}) {
  const cookies = new Map<string, { value: string; options: Record<string, unknown> }>();
  const setCookie = vi.fn((key: string, value: string, options?: Record<string, unknown>) => {
    cookies.set(key, { value, options: options ?? {} });
  });

  const reqHeaders = new Map<string, string>();
  for (const [key, value] of Object.entries(overrides.headers ?? {})) {
    reqHeaders.set(key.toLowerCase(), value);
  }
  if (overrides.cookieHeader !== undefined) {
    reqHeaders.set('cookie', overrides.cookieHeader);
  }
  if (overrides.origin !== undefined) {
    reqHeaders.set('origin', overrides.origin);
  }

  return {
    cookies: {
      set: setCookie,
    },
    request: {
      headers: {
        get: vi.fn((name: string) => reqHeaders.get(name.toLowerCase()) ?? null),
      },
    },
    url: new URL(overrides.urlOrigin ?? 'https://example.com'),
  };
}

describe('createAstroRequestContext', () => {
  it('getCookies returns the raw cookie header', () => {
    const ctx = createAstroRequestContext(mockAPIContext({
      cookieHeader: '__Secure-neon-auth.session_token=abc; foo=bar',
    }));
    expect(ctx.getCookies()).toBe('__Secure-neon-auth.session_token=abc; foo=bar');
  });

  it('getCookies returns empty string when no cookie header', () => {
    const ctx = createAstroRequestContext(mockAPIContext({}));
    expect(ctx.getCookies()).toBe('');
  });

  it('setCookie calls context.cookies.set with correct args', () => {
    const mock = mockAPIContext({});
    const ctx = createAstroRequestContext(mock);
    ctx.setCookie('test-cookie', 'test-value', { path: '/', httpOnly: true, secure: true });
    expect(mock.cookies.set).toHaveBeenCalledWith('test-cookie', 'test-value', { path: '/', httpOnly: true, secure: true });
  });

  it('setCookie forwards partitioned option', () => {
    const mock = mockAPIContext({});
    const ctx = createAstroRequestContext(mock);
    ctx.setCookie('test', 'val', { partitioned: true });
    expect(mock.cookies.set).toHaveBeenCalledWith('test', 'val', { partitioned: true });
  });

  it('getHeader returns header value from request', () => {
    const ctx = createAstroRequestContext(mockAPIContext({
      headers: { 'x-custom': 'hello' },
    }));
    expect(ctx.getHeader('x-custom')).toBe('hello');
  });

  it('getHeader returns null for missing header', () => {
    const ctx = createAstroRequestContext(mockAPIContext({}));
    expect(ctx.getHeader('x-missing')).toBeNull();
  });

  it('getOrigin returns from url.origin', () => {
    const ctx = createAstroRequestContext(mockAPIContext({
      urlOrigin: 'https://my-astro-app.com:3000',
    }));
    expect(ctx.getOrigin()).toBe('https://my-astro-app.com:3000');
  });

  it('getFramework returns astro', () => {
    const ctx = createAstroRequestContext(mockAPIContext({}));
    expect(ctx.getFramework()).toBe('astro');
  });
});
