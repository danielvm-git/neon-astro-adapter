import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { astroMiddleware } from './middleware';

function mockContext(overrides: {
  pathname?: string;
  cookieHeader?: string | null;
  url?: string;
}) {
  const url = new URL(overrides.url ?? `http://localhost:4321${overrides.pathname ?? '/dashboard'}`);

  const requestHeaders = new Map<string, string>();
  if (overrides.cookieHeader !== undefined && overrides.cookieHeader !== null) {
    requestHeaders.set('cookie', overrides.cookieHeader);
  }

  const cookies = new Map<string, { value: string; options: Record<string, unknown> }>();

  return {
    url,
    request: {
      headers: {
        get: vi.fn((name: string) => requestHeaders.get(name.toLowerCase()) ?? null),
      },
    },
    cookies: {
      set: vi.fn((key: string, value: string, options?: Record<string, unknown>) => {
        cookies.set(key, { value, options: options ?? {} });
      }),
    },
    redirect: vi.fn((path: string, status?: number) => {
      return new Response(null, {
        status: status ?? 302,
        headers: { Location: path },
      });
    }),
  };
}

const VALID_CONFIG = {
  baseUrl: 'https://auth.example.com',
  cookies: { secret: 'a'.repeat(32) },
};

describe('astroMiddleware', () => {
  describe('config validation', () => {
    it('accepts valid config', () => {
      expect(() => astroMiddleware(VALID_CONFIG)).not.toThrow();
    });

    it('throws when baseUrl is missing', () => {
      expect(() =>
        astroMiddleware({ cookies: { secret: 'a'.repeat(32) } } as never)
      ).toThrow('baseUrl');
    });

    it('throws when cookies.secret is too short', () => {
      expect(() =>
        astroMiddleware({
          baseUrl: 'https://auth.example.com',
          cookies: { secret: 'short' },
        })
      ).toThrow('32');
    });

    it('accepts optional loginUrl', () => {
      expect(() =>
        astroMiddleware({ ...VALID_CONFIG, loginUrl: '/custom-login' })
      ).not.toThrow();
    });
  });

  describe('routing decisions', () => {
    let next: ReturnType<typeof vi.fn<() => Promise<Response>>>;

    beforeEach(() => {
      next = vi.fn<() => Promise<Response>>().mockResolvedValue(new Response('page content'));
    });

    it('allows requests to login URL without session check', async () => {
      const middleware = astroMiddleware({ ...VALID_CONFIG, loginUrl: '/auth/sign-in' });
      const ctx = mockContext({ pathname: '/auth/sign-in' });

      const response = await middleware(ctx as never, next);
      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
      expect(ctx.redirect).not.toHaveBeenCalled();
    });

    it('allows requests to skip routes without session check', async () => {
      const middleware = astroMiddleware(VALID_CONFIG);

      for (const path of ['/api/auth/sign-in/email', '/auth/callback']) {
        const ctx = mockContext({ pathname: path });
        await middleware(ctx as never, next);
        expect(next).toHaveBeenCalled();
        next.mockClear();
      }
    });

    it('allows requests to skip route /auth/sign-in (default loginUrl)', async () => {
      const middleware = astroMiddleware(VALID_CONFIG);
      const ctx = mockContext({ pathname: '/auth/sign-in' });

      await middleware(ctx as never, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows custom skip routes from config', async () => {
      const middleware = astroMiddleware({
        ...VALID_CONFIG,
        skipRoutes: ['/custom-auth', '/health'],
      });
      const ctx = mockContext({ pathname: '/health' });

      await middleware(ctx as never, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('session checking', () => {
    let next: ReturnType<typeof vi.fn<() => Promise<Response>>>;
    let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
      next = vi.fn<() => Promise<Response>>().mockResolvedValue(new Response('page content'));
      mockFetch = vi.fn<typeof fetch>();
      globalThis.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("allows access when session token exists and get-session succeeds", async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ session: { id: 's1', expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: 'u1' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const middleware = astroMiddleware(VALID_CONFIG);
      const ctx = mockContext({
        pathname: '/dashboard',
        cookieHeader: '__Secure-neon-auth.session_token=abc123',
      });

      const response = await middleware(ctx as never, next);
      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
    });

    it("redirects to login when no session token cookie exists", async () => {
      const middleware = astroMiddleware({
        ...VALID_CONFIG,
        loginUrl: '/auth/sign-in',
      });
      const ctx = mockContext({ pathname: '/dashboard', cookieHeader: '' });

      const response = await middleware(ctx as never, next);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/auth/sign-in');
      expect(ctx.redirect).toHaveBeenCalledWith('/auth/sign-in');
      expect(next).not.toHaveBeenCalled();
    });

    it("redirects to login when upstream get-session returns non-ok", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
      );

      const middleware = astroMiddleware({
        ...VALID_CONFIG,
        loginUrl: '/auth/sign-in',
      });
      const ctx = mockContext({
        pathname: '/dashboard',
        cookieHeader: '__Secure-neon-auth.session_token=expired',
      });

      const response = await middleware(ctx as never, next);

      expect(response.status).toBe(302);
      expect(ctx.redirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    it("allows access when upstream fetch fails (graceful degradation)", async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const middleware = astroMiddleware({
        ...VALID_CONFIG,
        loginUrl: '/auth/sign-in',
      });
      const ctx = mockContext({
        pathname: '/dashboard',
        cookieHeader: '__Secure-neon-auth.session_token=abc',
      });

      const response = await middleware(ctx as never, next);
      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
    });

    it("sets session cookies on successful session check", async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            session: { id: 's1', expiresAt: new Date(Date.now() + 3600000).toISOString() },
            user: { id: 'u1' },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': '__Secure-neon-auth.session_token=refreshed; Path=/; HttpOnly; Secure; SameSite=Strict',
            },
          }
        )
      );

      const middleware = astroMiddleware(VALID_CONFIG);
      const ctx = mockContext({
        pathname: '/dashboard',
        cookieHeader: '__Secure-neon-auth.session_token=abc',
      });

      await middleware(ctx as never, next);

      expect(ctx.cookies.set).toHaveBeenCalledWith(
        '__Secure-neon-auth.session_token',
        'refreshed',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
      );
    });

    it('uses default loginUrl /auth/sign-in when not configured', async () => {
      const middleware = astroMiddleware(VALID_CONFIG);
      const ctx = mockContext({ pathname: '/dashboard', cookieHeader: '' });

      const response = await middleware(ctx as never, next);

      expect(response.status).toBe(302);
      expect(ctx.redirect).toHaveBeenCalledWith('/auth/sign-in');
    });
  });
});
