# HTTP Headers, Cookies and Sessions

**Module:** HTTP · **Interview priority:** Core

## What Is It?

**Headers** are the `Name: value` lines that carry metadata about a request or response — the content type, credentials, caching rules, cookies. **Cookies** are small pieces of data a server asks the browser to store and send back on later requests. A **session** is server-side state about a user, found again on each request through a cookie (or token).

## Why It Exists

The method, URL and status code say *what*; headers say *how*: what format the body is in, who the client is, how long a response may be cached. Because HTTP is stateless, cookies were added (1994) so that a server could recognise the same browser across requests — the foundation of logins and shopping carts.

## Important Headers

### Content headers

| Header | Direction | Meaning |
|--------|-----------|---------|
| **Content-Type** | Both | Media type of the body: `application/json`, `text/html; charset=utf-8`, `multipart/form-data` |
| **Content-Length** | Both | Body size in bytes |
| **Accept** | Request | Formats the client can handle: `application/json` (content negotiation) |
| Content-Encoding / Accept-Encoding | Both | Compression: `gzip`, `br` |

### Authentication

| Header | Example |
|--------|---------|
| **Authorization** | `Bearer eyJhbGciOi…` (JWT/OAuth2 token) or `Basic dXNlcjpwYXNz` (Base64 of `user:pass` — encoding, **not** encryption; needs HTTPS) |
| WWW-Authenticate | Sent with 401 to say which scheme is expected |

### Caching

| Header | Meaning |
|--------|---------|
| **Cache-Control** | `max-age=3600` (fresh for an hour), `no-cache` (may store, but must revalidate before use), `no-store` (never store — sensitive data), `private` (browser only, not shared caches/CDNs), `public` |
| **ETag** / If-None-Match | Version tag of a resource; a conditional GET returns **304** if unchanged |
| Last-Modified / If-Modified-Since | Time-based revalidation |
| Expires | Older absolute-date version of max-age |

### Other common headers

| Header | Meaning |
|--------|---------|
| Host | Which site (virtual hosting) |
| User-Agent | Client software |
| Location | Redirect target, or URL of a created resource (201) |
| Origin, Access-Control-Allow-Origin … | CORS |
| X-Forwarded-For / Forwarded | Original client IP behind proxies |
| Retry-After | When to retry (429, 503) |
| Strict-Transport-Security | Force HTTPS for this site (HSTS) |

## Cookies

### How a cookie works

```text
1. Login:     POST /login                       →  server verifies the password
              ← HTTP/1.1 200 OK
                Set-Cookie: SESSION=8f3a9c…; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
2. Later:     GET /api/cart
              Cookie: SESSION=8f3a9c…            →  server finds session 8f3a9c → user 42
```

The browser stores the cookie and automatically attaches it to every matching request (by domain, path and attributes).

### Cookie attributes

| Attribute | Effect | Why it matters |
|-----------|--------|----------------|
| `Domain`, `Path` | Which requests carry it | Scope |
| `Expires` / `Max-Age` | Lifetime; without them it is a **session cookie** deleted when the browser closes | Persistence |
| **`HttpOnly`** | JavaScript cannot read it (`document.cookie`) | Stops theft by XSS |
| **`Secure`** | Sent only over HTTPS | Stops leaks on plain HTTP |
| **`SameSite`** | `Strict` / `Lax` / `None` — whether it is sent on cross-site requests | Defends against CSRF (`None` requires `Secure`) |

## Sessions

```text
Browser ── Cookie: SESSION=8f3a… ──► App server ──► session store
                                                   8f3a… → { userId: 42, roles: [USER], cart: [...] }
```

- The cookie holds only a random **session ID**; the data stays on the server.
- With several app instances, sessions must be in a **shared store** (Redis via Spring Session, a database) or the load balancer must use **sticky sessions**.
- Logout = delete the server-side session; the ID becomes useless.

### Sessions vs tokens

| | Server-side session + cookie | Stateless token (JWT) |
|---|------------------------------|------------------------|
| Where state lives | Server (memory/Redis) | Inside the signed token |
| Sent as | `Cookie` (automatic in browsers) | Usually `Authorization: Bearer` |
| Revocation | Easy — delete the session | Hard — valid until expiry (short lifetimes + refresh tokens) |
| Scaling | Needs a shared store | Any instance can verify the signature |
| CSRF risk | Yes (cookies are sent automatically) → SameSite/CSRF tokens | Not for headers; yes if the JWT is stored in a cookie |

Spring details: [Session vs Stateless Authentication](../../../spring-boot/security/session-vs-stateless-authentication/content.md).

## Real World

- `Cache-Control: no-store` on API responses with personal data; long `max-age` with versioned file names (`app.3f9a.js`) for static assets.
- A Spring Boot app behind a CDN must send `Cache-Control: private` for user-specific responses, or the CDN may serve one user's data to another.
- Third-party cookies (set by other domains) are being blocked by browsers for privacy; first-party session cookies are unaffected.

## Common Traps

- **"Basic auth is encrypted."** Base64 is encoding; anyone can decode it. Use HTTPS.
- **"`no-cache` means do not cache."** It means *revalidate before using*; `no-store` means do not store.
- **"Cookies store the user's data."** A session cookie should hold only an unguessable ID; never put secrets or roles unprotected in cookies.
- **"HttpOnly makes cookies secure."** It stops JavaScript access (XSS theft), not interception — add `Secure` and HTTPS.

## Interview Follow-up

- *"How does a website remember you are logged in?"* A session cookie (ID → server-side session) or a token sent with each request.
- *"What are HttpOnly, Secure and SameSite?"* No JS access; HTTPS only; cross-site sending policy.

## Key Takeaways

- Headers carry metadata: Content-Type, Authorization, Cache-Control, Cookie/Set-Cookie, Location …
- Cookies: server sets with `Set-Cookie`, browser returns with `Cookie`; protect with HttpOnly, Secure, SameSite.
- Sessions keep state on the server keyed by a cookie ID; tokens carry state in the request. Both make a stateless protocol remember users.
- `Cache-Control` decides who may cache what and for how long.
