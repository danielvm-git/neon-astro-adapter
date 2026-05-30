import type { AstroIntegration } from 'astro';

export type NeonAuthIntegrationConfig = {
  baseUrl?: string;
  cookies?: {
    secret?: string;
  };
};

export function neonAuth(config?: NeonAuthIntegrationConfig): AstroIntegration {
  return {
    name: '@danielvm/neon-astro-auth',
    hooks: {
      'astro:config:setup': ({ injectRoute, addMiddleware, logger }) => {
        if (config?.baseUrl) {
          process.env.NEON_AUTH_BASE_URL = config.baseUrl;
        }
        if (config?.cookies?.secret) {
          process.env.NEON_AUTH_COOKIE_SECRET = config.cookies.secret;
        }

        if (!process.env.NEON_AUTH_BASE_URL) {
          logger.warn(
            'NEON_AUTH_BASE_URL is not set. Pass config to neonAuth() or set the env variable.'
          );
        }
        if (!process.env.NEON_AUTH_COOKIE_SECRET) {
          logger.warn(
            'NEON_AUTH_COOKIE_SECRET is not set. Pass config to neonAuth() or set the env variable.'
          );
        }

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
