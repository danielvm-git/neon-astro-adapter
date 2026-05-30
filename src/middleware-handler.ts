import { createAstroAuth } from './server/index.js';

const auth = createAstroAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

export const onRequest = auth.middleware();
