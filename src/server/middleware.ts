import { validateConfig } from './config';
import type { MiddlewareConfig } from './config';
import type { CookieOptions } from './adapter';
export type { MiddlewareConfig } from './config';

const NEON_AUTH_SESSION_COOKIE_NAME = '__Secure-neon-auth.session_token';

const SKIP_ROUTES = [
  '/api/auth',
  '/auth/callback',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/magic-link',
  '/auth/email-otp',
  '/auth/forgot-password',
];

type MiddlewareFn = (
  context: {
    url: URL;
    request: { headers: { get(name: string): string | null } };
    cookies: { set(name: string, value: string, options?: CookieOptions): void };
    redirect(path: string, status?: number): Response;
  },
  next: () => Promise<Response>
) => Promise<Response>;

function isSkipRoute(pathname: string, loginUrl: string): boolean {
  if (pathname.startsWith(loginUrl)) return true;
  return SKIP_ROUTES.some((route) => pathname.startsWith(route));
}

function applySetCookieFromUpstream(
  ctx: { set(name: string, value: string, options?: CookieOptions): void },
  setCookieHeaders: string[]
): void {
  for (const header of setCookieHeaders) {
    const parsed = parseSetCookie(header);
    if (!parsed) continue;

    const options: CookieOptions = {
      path: parsed.path ?? '/',
      httpOnly: parsed.httpOnly ?? true,
      secure: parsed.secure ?? true,
    };
    if (parsed.maxAge !== undefined) options.maxAge = parsed.maxAge;
    if (parsed.domain) options.domain = parsed.domain;
    if (parsed.sameSite) options.sameSite = parsed.sameSite as CookieOptions['sameSite'];

    ctx.set(parsed.name, parsed.value, options);
  }
}

type ParsedCookie = {
  name: string;
  value: string;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
};

function parseSetCookie(setCookieHeader: string): ParsedCookie | null {
  const parts = setCookieHeader.split(';').map((p) => p.trim());
  if (parts.length === 0) return null;

  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf('=');
  if (eqIdx === -1) return null;

  const cookie: ParsedCookie = {
    name: nameValue.slice(0, eqIdx),
    value: decodeURIComponent(nameValue.slice(eqIdx + 1)),
  };

  for (const attr of attrs) {
    const lower = attr.toLowerCase();
    const aeqIdx = attr.indexOf('=');
    const key = aeqIdx === -1 ? lower : lower.slice(0, aeqIdx);
    const val = aeqIdx === -1 ? '' : attr.slice(aeqIdx + 1);

    switch (key) {
      case 'max-age':
        cookie.maxAge = parseInt(val, 10);
        break;
      case 'domain':
        cookie.domain = val;
        break;
      case 'path':
        cookie.path = val;
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'samesite':
        cookie.sameSite = val.toLowerCase();
        break;
    }
  }

  return cookie;
}

export function astroMiddleware(config: MiddlewareConfig): MiddlewareFn {
  validateConfig(config);

  const { baseUrl } = config;
  const loginUrl = config.loginUrl ?? '/auth/sign-in';
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const allSkipRoutes = [...SKIP_ROUTES, loginUrl, ...(config.skipRoutes ?? [])];

  return async (context, next) => {
    const { pathname } = context.url;

    if (allSkipRoutes.some((route) => pathname.startsWith(route))) {
      return next();
    }

    const cookieHeader = context.request.headers.get('cookie') || '';
    if (!cookieHeader.includes(NEON_AUTH_SESSION_COOKIE_NAME)) {
      return context.redirect(loginUrl);
    }

    let sessionResponse: Response;
    try {
      sessionResponse = await fetch(`${normalizedBase}/get-session`, {
        method: 'GET',
        headers: { cookie: cookieHeader, origin: context.url.origin },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return next();
    }

    if (!sessionResponse.ok) return context.redirect(loginUrl);

    const setCookieHeaders = sessionResponse.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      applySetCookieFromUpstream(context.cookies, setCookieHeaders);
    }

    return next();
  };
}
