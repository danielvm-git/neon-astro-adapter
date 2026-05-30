export interface HandlerConfig {
  baseUrl: string;
  cookies: SessionCookieConfig;
}

export interface MiddlewareConfig extends HandlerConfig {
  loginUrl?: string;
  skipRoutes?: string[];
}

export interface SessionCookieConfig {
  secret: string;
  sessionDataTtl?: number;
  domain?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

const ERROR_MESSAGES = {
  MISSING_BASE_URL:
    'Missing required config: baseUrl. You must provide the auth URL of your Neon Auth instance.',
  MISSING_COOKIE_SECRET: 'Missing required config: cookies.secret.',
  COOKIE_SECRET_TOO_SHORT:
    'cookies.secret must be at least 32 characters long for security.',
  INVALID_SESSION_DATA_TTL:
    'cookies.sessionDataTtl must be a positive number (in seconds).',
};

export function validateConfig(config: HandlerConfig): void {
  if (!config.baseUrl) throw new Error(ERROR_MESSAGES.MISSING_BASE_URL);
  if (!config.cookies.secret) throw new Error(ERROR_MESSAGES.MISSING_COOKIE_SECRET);
  if (config.cookies.secret.length < 32)
    throw new Error(ERROR_MESSAGES.COOKIE_SECRET_TOO_SHORT);
  if (
    config.cookies.sessionDataTtl !== undefined &&
    config.cookies.sessionDataTtl <= 0
  ) {
    throw new Error(ERROR_MESSAGES.INVALID_SESSION_DATA_TTL);
  }
}
