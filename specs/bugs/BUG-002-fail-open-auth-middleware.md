# BUG-002 — Auth bypass via fail-open in middleware

**Severity:** MEDIUM  
**Category:** Auth Bypass  
**Confidence:** 8/10  
**Source:** Security review 2026-06-28  
**Status:** FIXED — 2026-06-28

## Location

`src/server/middleware.ts:131–133` (catch block after `/get-session` fetch)  
`src/server/middleware.ts:121` (cookie presence check)

## Root Cause

When the outbound `/get-session` request throws (network error, timeout, DNS failure), the middleware calls `next()` and allows the request through unauthenticated. The pre-check at line 121 only tests whether the raw cookie header *string* contains the session cookie name — it does not validate the cookie value. An attacker who includes `Cookie: __Secure-neon-auth.session_token=BOGUS` and can make the auth server unreachable bypasses authentication for all protected routes.

```ts
// middleware.ts:121 — string presence, not value validity
if (!cookieHeader.includes(NEON_AUTH_SESSION_COOKIE_NAME)) {
  return context.redirect(loginUrl);
}

// middleware.ts:131–133 — fail-open
} catch {
  return next();   // ← grants access on network failure
}
```

This is currently tested as intentional "graceful degradation" (`middleware.test.ts:188`), but fail-open is a security anti-pattern for auth middleware.

## Exploit Scenario

1. Attacker crafts a request with `Cookie: __Secure-neon-auth.session_token=INVALID`.
2. Attacker causes the Neon Auth server to be unreachable (DDoS, DNS poisoning, network partition between app server and auth server, or simply during a planned auth server outage).
3. The `fetch()` to `/get-session` throws. The `catch` block calls `next()`.
4. Attacker accesses all protected pages without a valid session for as long as the auth server is unreachable.

## Fix Plan

Change the catch block to redirect to the login page (fail-closed):

```ts
} catch {
  return context.redirect(loginUrl);
}
```

Update the corresponding test at `middleware.test.ts:188` to assert a 302 redirect instead of a 200 pass-through.

If degraded-mode access is a hard product requirement, scope the fail-open only to read-only, low-risk routes via an explicit `allowDegradedAccess` config flag so the trade-off is opt-in and visible.

## Tests to Update

- `middleware.test.ts:188` — currently asserts `status: 200` and `next` called on fetch failure; change to assert `status: 302` redirect to loginUrl.
