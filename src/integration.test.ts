import { describe, it, expect, vi } from 'vitest';
import { neonAuth } from './integration';

describe('neonAuth', () => {
  it('returns an AstroIntegration with correct name', () => {
    const integration = neonAuth();

    expect(integration.name).toBe('neon-astro-auth');
    expect(integration.hooks).toHaveProperty('astro:config:setup');
  });

  it('injects catch-all API route via injectRoute', () => {
    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();

    const integration = neonAuth();
    const hook = integration.hooks['astro:config:setup'];

    hook!({
      injectRoute,
      addMiddleware,
    } as never);

    expect(injectRoute).toHaveBeenCalledWith({
      pattern: '/api/auth/[...slug]',
      entrypoint: '@danielvm/neon-astro-auth/route-handler',
      prerender: false,
    });
  });

  it('adds pre-middleware via addMiddleware', () => {
    const injectRoute = vi.fn();
    const addMiddleware = vi.fn();

    const integration = neonAuth();
    const hook = integration.hooks['astro:config:setup'];

    hook!({
      injectRoute,
      addMiddleware,
    } as never);

    expect(addMiddleware).toHaveBeenCalledWith({
      order: 'pre',
      entrypoint: '@danielvm/neon-astro-auth/middleware-handler',
    });
  });
});
