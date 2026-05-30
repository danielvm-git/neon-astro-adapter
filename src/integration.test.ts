import { describe, it, expect, vi } from 'vitest';
import { neonAuth } from './integration';

describe('neonAuth', () => {
  it('returns an AstroIntegration with correct name', () => {
    const integration = neonAuth();

    expect(integration.name).toBe('@danielvm/neon-astro-auth');
    expect(integration.hooks).toHaveProperty('astro:config:setup');
  });

  it('injects catch-all API route via injectRoute', () => {
    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();
    const logger = { warn: vi.fn() };

    const integration = neonAuth();
    const hook = integration.hooks['astro:config:setup'];

    hook!({ injectRoute, addMiddleware, logger } as never);

    expect(injectRoute).toHaveBeenCalledWith({
      pattern: '/api/auth/[...slug]',
      entrypoint: '@danielvm/neon-astro-auth/route-handler',
      prerender: false,
    });
  });

  it('adds pre-middleware via addMiddleware', () => {
    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();
    const logger = { warn: vi.fn() };

    const integration = neonAuth();
    const hook = integration.hooks['astro:config:setup'];

    hook!({ injectRoute, addMiddleware, logger } as never);

    expect(addMiddleware).toHaveBeenCalledWith({
      order: 'pre',
      entrypoint: '@danielvm/neon-astro-auth/middleware-handler',
    });
  });

  it('accepts optional config and sets env vars', () => {
    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;

    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();
    const logger = { warn: vi.fn() };

    const integration = neonAuth({
      baseUrl: 'https://auth.example.com',
      cookies: { secret: 'a'.repeat(32) },
    });
    const hook = integration.hooks['astro:config:setup'];

    hook!({ injectRoute, addMiddleware, logger } as never);

    expect(process.env.NEON_AUTH_BASE_URL).toBe('https://auth.example.com');
    expect(process.env.NEON_AUTH_COOKIE_SECRET).toBe('a'.repeat(32));
  });

  it('warns when env vars are missing', () => {
    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;

    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();
    const logger = { warn: vi.fn() };

    const integration = neonAuth();
    const hook = integration.hooks['astro:config:setup'];

    hook!({ injectRoute, addMiddleware, logger } as never);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('NEON_AUTH_BASE_URL')
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('NEON_AUTH_COOKIE_SECRET')
    );
  });
});
