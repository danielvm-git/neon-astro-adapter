import type { AstroIntegration } from 'astro';

export function neonAuth(): AstroIntegration {
  return {
    name: 'neon-astro-auth',
    hooks: {
      'astro:config:setup': ({ injectRoute, addMiddleware }) => {
        injectRoute({
          pattern: '/api/auth/[...slug]',
          entrypoint: '@danielvm/neon-astro-auth/route-handler',
          prerender: false,
        });

        addMiddleware({
          order: 'pre',
          entrypoint: '@danielvm/neon-astro-auth/middleware-handler',
        });
      },
    },
  };
}
