export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  partitioned?: boolean;
}

export interface RequestContext {
  getCookies(): Promise<string> | string;
  setCookie(name: string, value: string, options: CookieOptions): Promise<void> | void;
  getHeader(name: string): Promise<string | null> | string | null;
  getOrigin(): Promise<string> | string;
  getFramework(): string;
}

export function createAstroRequestContext(context: {
  cookies: {
    set(key: string, value: string, options?: CookieOptions): void;
  };
  request: {
    headers: {
      get(name: string): string | null;
    };
  };
  url: { origin: string };
}): RequestContext {
  return {
    getCookies() {
      return context.request.headers.get('cookie') ?? '';
    },
    setCookie(name, value, options) {
      context.cookies.set(name, value, options);
    },
    getHeader(name) {
      return context.request.headers.get(name) ?? null;
    },
    getOrigin() {
      return context.url.origin;
    },
    getFramework() {
      return 'astro';
    },
  };
}
