import { describe, it, expect } from 'vitest';
import { createAstroAuth } from './index';

const VALID_CONFIG = {
  baseUrl: 'https://auth.example.com',
  cookies: { secret: 'a'.repeat(32) },
};

describe('createAstroAuth', () => {
  describe('config validation', () => {
    it('accepts valid config', () => {
      expect(() => createAstroAuth(VALID_CONFIG)).not.toThrow();
    });

    it('throws when baseUrl is missing', () => {
      expect(() =>
        createAstroAuth({ cookies: { secret: 'a'.repeat(32) } } as never)
      ).toThrow('baseUrl');
    });

    it('throws when cookies.secret is too short', () => {
      expect(() =>
        createAstroAuth({
          baseUrl: 'https://auth.example.com',
          cookies: { secret: 'short' },
        })
      ).toThrow('32');
    });
  });

  describe('return shape', () => {
    it('returns handler() that returns HTTP method handlers', () => {
      const auth = createAstroAuth(VALID_CONFIG);
      const handlers = auth.handler();

      expect(handlers).toHaveProperty('GET');
      expect(handlers).toHaveProperty('POST');
      expect(handlers).toHaveProperty('PUT');
      expect(handlers).toHaveProperty('DELETE');
      expect(handlers).toHaveProperty('PATCH');
      expect(typeof handlers.GET).toBe('function');
    });

    it('returns middleware() that returns a function', () => {
      const auth = createAstroAuth(VALID_CONFIG);
      const middleware = auth.middleware();

      expect(typeof middleware).toBe('function');
    });

    it('middleware accepts overrides for loginUrl', () => {
      const auth = createAstroAuth(VALID_CONFIG);
      const middleware = auth.middleware({ loginUrl: '/custom-login' });

      expect(typeof middleware).toBe('function');
    });

    it('middleware accepts skipRoutes override', () => {
      const auth = createAstroAuth(VALID_CONFIG);
      const middleware = auth.middleware({ skipRoutes: ['/health'] });

      expect(typeof middleware).toBe('function');
    });
  });

  it('accepts full config with sessionDataTtl, domain, sameSite, loginUrl, skipRoutes', () => {
    expect(() =>
      createAstroAuth({
        baseUrl: 'https://auth.example.com',
        cookies: {
          secret: 'a'.repeat(32),
          sessionDataTtl: 300,
          domain: '.example.com',
          sameSite: 'lax',
        },
        loginUrl: '/auth/sign-in',
        skipRoutes: ['/custom-auth'],
      })
    ).not.toThrow();
  });
});
