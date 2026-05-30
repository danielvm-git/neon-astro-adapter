import { validateConfig } from './config';
import type { MiddlewareConfig } from './config';
import { astroApiHandler } from './handler';
import { astroMiddleware } from './middleware';

export { createAstroRequestContext } from './adapter';
export type { RequestContext, CookieOptions } from './adapter';
export type { HandlerConfig } from './handler';
export type { MiddlewareConfig } from './middleware';
export { validateConfig } from './config';
export type { SessionCookieConfig } from './config';

export type AstroAuth = {
  handler: () => ReturnType<typeof astroApiHandler>;
  middleware: (overrides?: Partial<MiddlewareConfig>) => ReturnType<typeof astroMiddleware>;
};

export function createAstroAuth(config: MiddlewareConfig): AstroAuth {
  validateConfig(config);

  return {
    handler: () => astroApiHandler(config),
    middleware: (overrides) => astroMiddleware({ ...config, ...overrides }),
  };
}
