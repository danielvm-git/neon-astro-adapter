import { describe, it, expect, vi } from 'vitest';
import { createAstroAuth } from './index';

const VALID_CONFIG = {
  baseUrl: 'https://auth.example.com',
  cookies: { secret: 'a'.repeat(32) },
};

function mockContext(pathname: string) {
  return {
    url: new URL(`http://localhost:4321${pathname}`),
    request: { headers: { get: vi.fn(() => null) } },
    cookies: { set: vi.fn() },
    redirect: vi.fn((path: string) => new Response(null, { status: 302, headers: { Location: path } })),
  };
}

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

    it('middleware accepts overrides for loginUrl', async () => {
      const auth = createAstroAuth({
        ...VALID_CONFIG,
        loginUrl: '/custom-login',
      });
      const middleware = auth.middleware();
      const next = vi.fn<() => Promise<Response>>().mockResolvedValue(new Response());

      const response = await middleware(mockContext('/custom-login') as never, next);

      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
    });

    it('middleware accepts skipRoutes override', async () => {
      const auth = createAstroAuth(VALID_CONFIG);
      const middleware = auth.middleware({ skipRoutes: ['/health'] });
      const next = vi.fn<() => Promise<Response>>().mockResolvedValue(new Response());

      const response = await middleware(mockContext('/health') as never, next);

      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
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
