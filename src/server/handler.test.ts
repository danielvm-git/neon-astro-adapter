import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { astroApiHandler } from './handler';

type HandlerContext = {
  params: { slug: string[] };
  request: Request;
};

function mockContext(overrides: {
  slug?: string[];
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  url?: string;
}): HandlerContext {
  const method = overrides.method ?? 'POST';
  const hasBody = overrides.body !== null && method !== 'GET' && method !== 'HEAD';
  const body = hasBody
    ? (overrides.body ?? JSON.stringify({ email: 'a@b.com', password: 'pw' }))
    : undefined;

  const headers = new Headers(overrides.headers ?? {});
  return {
    params: { slug: overrides.slug ?? ['sign-in', 'email'] },
    request: new Request(overrides.url ?? 'http://localhost:4321/api/auth/sign-in/email', {
      method,
      headers,
      body,
    }),
  };
}

describe('astroApiHandler', () => {
  describe('config validation', () => {
    it('accepts valid config', () => {
      expect(() =>
        astroApiHandler({
          baseUrl: 'https://auth.example.com',
          cookies: { secret: 'a'.repeat(32) },
        })
      ).not.toThrow();
    });

    it('throws when baseUrl is missing', () => {
      expect(() =>
        astroApiHandler({ cookies: { secret: 'a'.repeat(32) } } as never)
      ).toThrow('baseUrl');
    });

    it('throws when cookies.secret is missing', () => {
      expect(() =>
        astroApiHandler({ baseUrl: 'https://auth.example.com', cookies: {} } as never)
      ).toThrow('secret');
    });

    it('throws when cookies.secret is too short', () => {
      expect(() =>
        astroApiHandler({
          baseUrl: 'https://auth.example.com',
          cookies: { secret: 'short' },
        })
      ).toThrow('32');
    });

    it('accepts sessionDataTtl and domain as optional config', () => {
      expect(() =>
        astroApiHandler({
          baseUrl: 'https://auth.example.com',
          cookies: {
            secret: 'a'.repeat(32),
            sessionDataTtl: 300,
            domain: '.example.com',
            sameSite: 'lax',
          },
        })
      ).not.toThrow();
    });
  });

  describe('request proxying', () => {
    let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
      mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
      globalThis.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('proxies to upstream with path from params.slug', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await GET(mockContext({ slug: ['get-session'], method: 'GET' }));

      const url = new URL(mockFetch.mock.calls[0]![0] as string);
      expect(url.origin).toBe('https://auth.example.com');
      expect(url.pathname).toBe('/get-session');
    });

    it('joins nested slug segments into upstream path', async () => {
      const { POST } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await POST(mockContext({ slug: ['sign-in', 'email'] }));

      const url = new URL(mockFetch.mock.calls[0]![0] as string);
      expect(url.pathname).toBe('/sign-in/email');
    });

    it('uses correct HTTP method from the request', async () => {
      const { PATCH } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await PATCH(mockContext({ slug: ['update-user'], method: 'PATCH' }));

      expect(mockFetch.mock.calls[0]![1]!.method).toBe('PATCH');
    });

    it('forwards request body', async () => {
      const { POST } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await POST(mockContext({
        slug: ['sign-in', 'email'],
        body: '{"email":"test@test.com"}',
      }));

      expect(mockFetch.mock.calls[0]![1]!.body).toBe('{"email":"test@test.com"}');
    });

    it('filters non-Neon-Auth cookies from upstream request', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await GET(mockContext({
        slug: ['get-session'],
        method: 'GET',
        headers: {
          cookie: '__Secure-neon-auth.session_token=abc; other-cookie=xyz; __Secure-neon-auth.session_data=def',
        },
      }));

      const sentHeaders = mockFetch.mock.calls[0]![1]!.headers as Headers;
      const cookieHeader = sentHeaders.get('cookie') || '';
      expect(cookieHeader).toContain('__Secure-neon-auth.session_token=abc');
      expect(cookieHeader).toContain('__Secure-neon-auth.session_data=def');
      expect(cookieHeader).not.toContain('other-cookie');
    });

    it('passes query params from original request to upstream', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await GET(mockContext({
        slug: ['get-session'],
        method: 'GET',
        url: 'http://localhost:4321/api/auth/get-session?disableCookieCache=true',
      }));

      const url = new URL(mockFetch.mock.calls[0]![0] as string);
      expect(url.searchParams.get('disableCookieCache')).toBe('true');
    });
  });

  describe('response handling', () => {
    let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
      mockFetch = vi.fn<typeof fetch>();
      globalThis.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns upstream status code', async () => {
      mockFetch.mockResolvedValue(new Response('{"error":"bad"}', { status: 400 }));

      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      const response = await GET(mockContext({ slug: ['sign-in'], method: 'GET' }));
      expect(response.status).toBe(400);
    });

    it('passes through Set-Cookie headers from upstream', async () => {
      mockFetch.mockResolvedValue(
        new Response('{}', {
          status: 200,
          headers: { 'Set-Cookie': '__Secure-neon-auth.session_token=new' },
        })
      );

      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      const response = await GET(mockContext({ slug: ['get-session'], method: 'GET' }));
      expect(response.headers.getSetCookie()).toContain('__Secure-neon-auth.session_token=new');
    });

    it('returns 502 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      const response = await GET(mockContext({ slug: ['get-session'], method: 'GET' }));
      expect(response.status).toBe(502);
    });
  });

  describe('SSRF protection', () => {
    let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
      mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
      globalThis.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns 400 when slug resolves to an absolute URL with a different host', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      const response = await GET(
        mockContext({ slug: ['https:', '', 'evil.com', 'steal'], method: 'GET' })
      );

      expect(response.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 400 when slug resolves to a protocol-relative URL targeting a different host', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      const response = await GET(
        mockContext({ slug: ['//evil.com', 'steal'], method: 'GET' })
      );

      expect(response.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('still proxies a normal relative path correctly', async () => {
      const { GET } = astroApiHandler({
        baseUrl: 'https://auth.example.com',
        cookies: { secret: 'a'.repeat(32) },
      });

      await GET(mockContext({ slug: ['get-session'], method: 'GET' }));

      const url = new URL(mockFetch.mock.calls[0]![0] as string);
      expect(url.origin).toBe('https://auth.example.com');
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  it('returns GET, POST, PUT, DELETE, PATCH method handlers', () => {
    const handlers = astroApiHandler({
      baseUrl: 'https://auth.example.com',
      cookies: { secret: 'a'.repeat(32) },
    });

    expect(handlers).toHaveProperty('GET');
    expect(handlers).toHaveProperty('POST');
    expect(handlers).toHaveProperty('PUT');
    expect(handlers).toHaveProperty('DELETE');
    expect(handlers).toHaveProperty('PATCH');
    expect(typeof handlers.GET).toBe('function');
  });
});
