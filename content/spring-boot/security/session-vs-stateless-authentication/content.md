# Session-Based vs Stateless Authentication

**Module:** Spring Security · **Interview priority:** Core

## Definition

- **Session-based (stateful) authentication:** after login, the server stores the authenticated user in a **server-side session** and gives the browser a **session id cookie** (`JSESSIONID`). Each request sends the cookie; the server looks up the session.
- **Stateless authentication:** the server keeps **no session**. Each request carries a **self-contained credential** — typically a signed token such as a **JWT** in the `Authorization: Bearer` header — that the server validates on every request.

## Why It Matters

- "Session vs JWT" and "Why is JWT stateless?" are among the most asked backend security questions.
- The choice affects scaling, logout/revocation, CSRF exposure, mobile support and where tokens are stored.

## Session-Based Authentication

```text
1. POST /login (username, password)
2. Server authenticates, creates HttpSession { SPRING_SECURITY_CONTEXT = Authentication }
3. Response: Set-Cookie: JSESSIONID=8F3A…; HttpOnly; Secure; SameSite=Lax
4. Later requests: Cookie: JSESSIONID=8F3A…  → server loads the SecurityContext from the session
5. Logout: server invalidates the session → immediately effective
```

- Spring Security's default for form login; the `SecurityContextHolderFilter` loads the context from the `HttpSessionSecurityContextRepository`.
- Protections Spring adds: **session fixation** protection (new session id after login), concurrent session control, CSRF tokens.
- Scaling: sessions live in one server's memory → use **sticky sessions** or a **shared session store** (Spring Session with Redis/JDBC).

## Stateless Authentication

```text
1. POST /api/auth/login → server authenticates → returns a signed JWT (access token, e.g. 15 min)
2. Client stores the token and sends: Authorization: Bearer eyJhbGciOi…
3. Every request: JWT filter verifies signature + expiry → builds Authentication → SecurityContext
   (nothing stored on the server between requests)
4. Logout: client deletes the token; server cannot "delete" it before expiry without extra state
```

Configure Spring Security accordingly:

```java
http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

`STATELESS` means Spring Security never creates or uses an `HttpSession` to store the security context.

## Why JWT Is Considered Stateless

The token **contains** the identity and claims (subject, roles, expiry) and a **signature** proving the server issued it unchanged. To authenticate a request, the server needs only the token and the verification key — no lookup in a session store or database. Any instance with the key can validate it, which makes horizontal scaling trivial.

Caveats that reintroduce state:

- **Revocation** (logout everywhere, compromised token) needs a denylist or token versioning → a server-side lookup.
- **Refresh tokens** are usually stored server-side (hashed) to allow rotation and revocation.
- Loading the user from the database on each request (to check if disabled) adds a lookup — a trade-off between freshness and statelessness.

## Stateless vs Stateful Security

| Aspect | Session (stateful) | JWT (stateless) |
|--------|--------------------|-----------------|
| Server stores | Session per user | Nothing (optionally refresh tokens / denylist) |
| Client sends | Cookie `JSESSIONID` | `Authorization: Bearer <token>` (or a cookie) |
| Horizontal scaling | Sticky sessions or shared store | Any instance can validate |
| Logout / revocation | Immediate (invalidate session) | Hard before expiry — short TTL + refresh, denylist |
| Payload | Server-side, any size | In the token — keep small, visible to client (not encrypted) |
| CSRF risk | Yes (cookies sent automatically) — needs CSRF protection | Low with `Authorization` header (not sent automatically); yes if token stored in a cookie |
| XSS risk | HttpOnly cookie not readable by JS | Token in `localStorage` is readable by injected JS |
| Mobile / third-party clients | Cookies awkward | Natural |
| Typical use | Server-rendered web apps, BFFs | APIs for SPAs, mobile apps, service-to-service |
| Spring config | Default form login | `STATELESS`, CSRF usually disabled, JWT filter or OAuth2 resource server |

Neither is universally "more secure"; each moves risk. Many SPA architectures now use a **Backend-for-Frontend (BFF)**: the browser holds only an HttpOnly session cookie to the BFF, and the BFF holds tokens for backend APIs.

## Sessions

Spring Boot session settings:

```properties
server.servlet.session.timeout=30m
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.same-site=lax
```

`SessionCreationPolicy` values: `ALWAYS`, `IF_REQUIRED` (default), `NEVER` (use existing only), `STATELESS`. Cookie flags are covered in [Cookies and Cookie Security](../../web-security/cookie-security/content.md).

## Common Mistakes

- Choosing JWT for a classic server-rendered app that would be simpler and safer with sessions.
- Long-lived JWT access tokens (days) with no revocation strategy.
- Storing sensitive data in JWT payloads (they are only Base64url-encoded).
- Disabling CSRF while authenticating with cookies.
- `STATELESS` configured but a custom login endpoint still creating sessions (e.g. through `request.getSession()`).

## Common Interview Traps

- **"JWT is more secure than sessions."** It is a different trade-off: easier scaling, harder revocation.
- **"Stateless means no database."** The server still stores application data; it just keeps no per-user session.
- **"JWT prevents CSRF."** Only when sent in a header; tokens in cookies are sent automatically and need CSRF protection.

## Key Takeaways

- Sessions: server remembers the user (cookie → session); easy logout, needs shared store to scale, needs CSRF protection.
- Stateless JWT: client presents a signed token each request; easy scaling, hard revocation, careful storage.
- In Spring: default form login is session-based; APIs use `SessionCreationPolicy.STATELESS` + bearer tokens.
