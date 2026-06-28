import { validateConfig } from './config';
import type { HandlerConfig } from './config';
export type { HandlerConfig } from './config';

type HandlerFn = (context: {
  params: { slug: string[] };
  request: Request;
}) => Promise<Response>;

const NEON_AUTH_COOKIE_PREFIX = '__Secure-neon-auth';
const PROXY_HEADERS = ['user-agent', 'authorization', 'referer', 'content-type'];
const RESPONSE_HEADERS_ALLOWLIST = [
  'content-type',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'connection',
  'date',
];

function extractNeonAuthCookies(cookieHeader: string): string {
  const pairs = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  return pairs.filter((p) => p.startsWith(NEON_AUTH_COOKIE_PREFIX)).join('; ');
}

function buildUpstreamRequestHeaders(request: Request): Headers {
  const headers = new Headers();

  for (const h of PROXY_HEADERS) {
    const value = request.headers.get(h);
    if (value) headers.set(h, value);
  }

  headers.set(
    'origin',
    request.headers.get('origin') || new URL(request.url).origin
  );

  const cookieHeader = request.headers.get('cookie') || '';
  const neonCookies = extractNeonAuthCookies(cookieHeader);
  if (neonCookies) headers.set('cookie', neonCookies);

  return headers;
}

function buildUpstreamUrl(baseUrl: string, path: string, originalUrl: string): URL {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const baseOrigin = new URL(normalizedBase).origin;
  const upstreamUrl = new URL(path, normalizedBase + '/');
  upstreamUrl.search = new URL(originalUrl).search;

  if (upstreamUrl.origin !== baseOrigin) {
    throw new Error(`Blocked upstream request to disallowed host: ${upstreamUrl.origin}`);
  }

  return upstreamUrl;
}

function buildProxyResponse(upstreamResponse: Response): Response {
  const responseHeaders = new Headers();

  for (const h of RESPONSE_HEADERS_ALLOWLIST) {
    const value = upstreamResponse.headers.get(h);
    if (value) responseHeaders.set(h, value);
  }

  for (const cookie of upstreamResponse.headers.getSetCookie()) {
    responseHeaders.append('Set-Cookie', cookie);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export function astroApiHandler(config: HandlerConfig): Record<string, HandlerFn> {
  validateConfig(config);
  const { baseUrl } = config;

  const handler: HandlerFn = async (context) => {
    const path = context.params.slug.join('/');

    let upstreamUrl: URL;
    try {
      upstreamUrl = buildUpstreamUrl(baseUrl, path, context.request.url);
    } catch {
      return Response.json({ error: 'Invalid path', code: 'INVALID_PATH' }, { status: 400 });
    }

    const headers = buildUpstreamRequestHeaders(context.request);

    const body =
      context.request.body &&
      context.request.method !== 'GET' &&
      context.request.method !== 'HEAD'
        ? await context.request.clone().text()
        : undefined;

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: context.request.method,
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return Response.json(
        { error: 'Unable to connect to authentication server', code: 'NETWORK_ERROR' },
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return buildProxyResponse(upstreamResponse);
  };

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
  };
}
