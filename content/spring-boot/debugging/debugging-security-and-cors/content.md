# Debugging Security, JWT and CORS

**Module:** Debugging and Internal Behavior · **Interview priority:** Core

## How to Use This Topic

Each scenario: **Problem → Possible Causes → How to Diagnose → Fix → Prevention → Interview Explanation**. Background: [SecurityFilterChain](../../security/security-filter-chain/content.md), [JWT Authentication Flow](../../security/jwt-authentication-flow/content.md), [CORS](../../web-security/spring-cors/content.md), [CSRF](../../web-security/spring-csrf/content.md).

First step for any security problem:

```properties
logging.level.org.springframework.security=TRACE   # selected chain, each filter, authorization decisions
```

## Why Does CORS Fail?

### Problem

The browser console shows "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header…" or "Response to preflight request doesn't pass access control check". Postman works.

### Possible Causes

1. No CORS configuration for the front end's exact origin (scheme + host + port, e.g. `http://localhost:5173`).
2. CORS configured in Spring MVC only, but **Spring Security rejects the `OPTIONS` preflight** (no credentials) with 401/403 — `http.cors()` not enabled.
3. `allowedOrigins("*")` with `allowCredentials(true)` (invalid).
4. Missing allowed methods/headers (`PUT`, `DELETE`, `Authorization`, `Content-Type`).
5. The real request fails (500/401) and an error path (filter, proxy, gateway) responds **without** CORS headers, so the browser reports CORS instead of the real error.
6. A gateway/reverse proxy strips or duplicates CORS headers (two `Access-Control-Allow-Origin` values).
7. Front end needs a response header not listed in `exposedHeaders`.

### How to Diagnose

- Browser DevTools → Network → the **OPTIONS** request: status and response headers.
- Reproduce with curl: `curl -i -X OPTIONS https://api/... -H "Origin: https://app" -H "Access-Control-Request-Method: PUT"`.
- Security TRACE logs to see whether the preflight was rejected by authorization.

### Fix

Define a `CorsConfigurationSource` with exact origins, methods, headers (and credentials if cookies are used) and enable `http.cors(Customizer.withDefaults())`; fix the underlying error for case 5; configure CORS in one place only (app **or** gateway).

### Prevention

Per-environment allowed origins in configuration; an integration test sending a preflight with the real front-end origin.

### Interview Explanation

"CORS is enforced by the browser, which is why Postman works. Typical causes are a missing origin in the CORS config or Spring Security blocking the unauthenticated `OPTIONS` preflight before MVC's CORS handling. I enable CORS in the security chain with a `CorsConfigurationSource` and check the preflight in the network tab."

## Why Does JWT Authentication Fail?

### Problem

Requests with a token get 401 (or 403), or the app behaves as if the user were anonymous.

### Possible Causes

| Cause | Typical status |
|-------|----------------|
| Header not sent or malformed (`Bearer` missing, extra quotes, `bearer` case, token sent in body) | 401 |
| Token expired; clock skew between servers | 401 |
| Signature invalid: different secret/key between issuing and validating instances or environments, key rotated | 401 |
| Wrong algorithm/issuer/audience expected by the validator | 401 |
| JWT filter not added to the chain, added **after** `AuthorizationFilter`, or its `shouldNotFilter` skips the path | 401 |
| Filter creates an **unauthenticated** token (two-arg constructor) or never sets the context | 401 |
| Filter registered twice (`@Component` + `addFilterBefore`) causing odd behaviour | varies |
| Roles without `ROLE_` prefix vs `hasRole` rules | **403** |
| CSRF still enabled on the stateless API → POST/PUT fail | **403** |
| Exception inside the filter (e.g. user deleted) not handled | 401/500 |

### How to Diagnose

- Decode the token (header + payload are Base64url) and check `exp`, `iss`, `aud`, roles.
- Security TRACE logs: does the JWT filter run? Is an `Authentication` set? Which rule denied access?
- Compare secrets/keys across instances (environment variables).
- Check 401 vs 403 to split authentication problems from authorization problems.

### Fix

Send `Authorization: Bearer <token>`; synchronise keys (one secret/JWKS for all instances); allow small clock skew; register the filter once, before `UsernamePasswordAuthenticationFilter`; use `UsernamePasswordAuthenticationToken.authenticated(...)`; map roles with the `ROLE_` prefix; disable CSRF for header-token APIs; handle filter exceptions via the entry point.

### Prevention

Integration tests for login → protected call → expired token → wrong role; keys from a secret store; consider the OAuth2 resource server for standard validation.

### Interview Explanation

"First I check whether it's 401 or 403. 401 means the request wasn't authenticated — the header, signature, expiry, or the filter not setting the `SecurityContext`. 403 means authenticated but denied — usually the role prefix or CSRF on a stateless API. TRACE logging for Spring Security shows exactly which filter decided."

## Why Does SecurityContext Not Contain Authentication?

### Problem

`SecurityContextHolder.getContext().getAuthentication()` is `null` (or anonymous) in a service, listener or async task, although the user is logged in.

### Possible Causes

1. Code runs on **another thread** — `@Async`, executors, `CompletableFuture`, parallel streams, scheduled jobs (no request user at all).
2. The JWT filter did not set the context (see previous scenario), or set it on the context that was then replaced.
3. **Session-based custom login** (Spring Security 6+) authenticated but did not **save** the context with a `SecurityContextRepository`, so the next request is anonymous.
4. Code runs **outside the security filter chain**: a servlet filter ordered before Spring Security, an error dispatch, a WebSocket thread.
5. `SessionCreationPolicy.STATELESS` used with form login (nothing stored between requests).
6. Context cleared manually (`clearContext()`) by some code.

### How to Diagnose

- Log the thread name where the context is read.
- Security TRACE logs: "Set SecurityContextHolder to …" lines.
- For session apps: check whether `SPRING_SECURITY_CONTEXT` exists in the session after login.

### Fix

Propagate context to async work (`DelegatingSecurityContextAsyncTaskExecutor`, or pass the user id explicitly); set the context correctly in the filter; save it with `HttpSessionSecurityContextRepository` in custom session logins; order custom filters after the security chain if they need the user.

### Prevention

Avoid static access to `SecurityContextHolder` deep in services — pass the user into service methods (`@AuthenticationPrincipal` in controllers).

### Interview Explanation

"The `SecurityContext` lives in a `ThreadLocal` for the duration of the request and is cleared afterwards. It's empty when code runs on another thread, outside the security filter chain, or when a custom login didn't save it to the session — Spring Security 6 no longer saves it automatically."

## Key Takeaways

- CORS: check the preflight; enable CORS in the security chain; exact origins; real errors can masquerade as CORS errors.
- JWT: 401 = header/signature/expiry/filter/context; 403 = roles/CSRF; enable security TRACE logs.
- Empty SecurityContext = different thread, outside the chain, or context not set/saved.
