# Cookies, Sessions and Cookie Security

**Module:** CORS, CSRF and Web Security · **Interview priority:** Frequently asked

## Definition

- A **cookie** is a small name/value pair the server sets with `Set-Cookie` and the browser sends back automatically on matching requests (`Cookie` header).
- A **session** is server-side state identified by a session id stored in a cookie (`JSESSIONID` in servlet containers).
- **Cookie security attributes** control when and how cookies are sent and who can read them: **`Secure`**, **`HttpOnly`**, **`SameSite`**, plus `Domain`, `Path`, `Max-Age`/`Expires`.

## Why It Matters

- Session ids and token cookies are bearer credentials: whoever has them is the user.
- Correct attributes block entire attack classes (XSS token theft, CSRF, network sniffing). Interviewers ask what each attribute does and how they combine.

## Cookies

```http
Set-Cookie: refresh_token=Zx81…; Path=/api/auth/refresh; Max-Age=1209600; Secure; HttpOnly; SameSite=Strict
```

| Attribute | Effect |
|-----------|--------|
| `Domain` | Which hosts receive it (omit to restrict to the exact host) |
| `Path` | URL path prefix it is sent to |
| `Max-Age` / `Expires` | Persistent cookie lifetime; absent = session cookie (deleted when the browser closes) |
| `Secure` | Sent only over HTTPS |
| `HttpOnly` | Not readable by JavaScript (`document.cookie`) |
| `SameSite` | Whether it is sent on cross-site requests |

## Sessions

Servlet containers create an `HttpSession` on demand and store its id in `JSESSIONID`. Spring Security stores the `SecurityContext` in it for form login. Security measures:

- **Session fixation protection** — Spring changes the session id after login.
- **Timeout** — `server.servlet.session.timeout=30m`.
- **Invalidation on logout** — `LogoutFilter` invalidates the session and clears the security context.
- **Concurrent session control** — limit sessions per user (`sessionManagement().maximumSessions(1)`).
- **Shared storage** for multiple instances — Spring Session (Redis/JDBC).

## Secure Cookies

`Secure` cookies are never sent over plain HTTP, so a network attacker (public Wi-Fi) cannot capture them from an unencrypted request. Always set it in production (and use HSTS so browsers never use HTTP).

## HttpOnly

`HttpOnly` cookies cannot be read by JavaScript. If an attacker injects script (XSS), they still cannot steal the session id or refresh token. They can, however, make requests from the victim's page while it is open — HttpOnly limits theft, not all XSS damage.

## SameSite

| Value | Sent on cross-site requests? | Use |
|-------|------------------------------|-----|
| `Strict` | Never | Highest CSRF protection; links from other sites arrive logged-out |
| `Lax` | Only top-level GET navigations | Browser default when unspecified; good balance |
| `None` | Always (must also be `Secure`) | Third-party/embedded contexts, cross-site SSO |

"Site" ≈ registrable domain (`app.example.com` and `api.example.com` are the same site, different origins).

### Spring Boot configuration

```properties
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.same-site=strict
server.servlet.session.cookie.name=SESSION_ID
server.servlet.session.timeout=30m
```

Setting a cookie from a controller with all attributes:

```java
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;

class RefreshCookieExample {

    ResponseEntity<Void> withRefreshCookie(String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/auth/refresh")
                .maxAge(Duration.ofDays(14))
                .build();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }
}
```

`ResponseCookie` supports `SameSite` (the older `jakarta.servlet.http.Cookie` API historically did not).

## Stateless vs Stateful Security

| | Stateful (server sessions) | Stateless (self-contained tokens) |
|--|----------------------------|-----------------------------------|
| Credential | Session id cookie | JWT in header (or cookie) |
| Server state | Session store | None per request |
| Revocation | Immediate | At expiry (or denylist) |
| CSRF | Must defend (tokens + SameSite) | Not applicable for header tokens |
| XSS theft | Prevented by HttpOnly cookie | Tokens in `localStorage` exposed |
| Scaling | Sticky sessions / shared store | Trivial |

Details: [Session-Based vs Stateless Authentication](../../security/session-vs-stateless-authentication/content.md).

## Common Mistakes

- Missing `Secure`/`HttpOnly` on session or token cookies.
- `SameSite=None` without `Secure` (browsers reject the cookie).
- `Domain=.example.com` making the cookie available to every subdomain, including less trusted ones.
- Storing sensitive data (roles, prices) in plain cookies the client can edit.
- Long-lived session cookies without idle timeout.

## Common Interview Traps

- **"HttpOnly prevents XSS."** It prevents cookie theft via JavaScript; injected scripts can still act within the page.
- **"SameSite makes CSRF tokens unnecessary."** It is strong defence in depth, but same-site attacks and edge cases remain.
- **"Secure means encrypted cookie."** It means HTTPS-only transmission; the value itself is not encrypted.

## Key Takeaways

- Session/auth cookies: `Secure; HttpOnly; SameSite=Lax/Strict`, narrow `Path`/`Domain`, sensible lifetime.
- `Secure` = HTTPS only; `HttpOnly` = no JS access; `SameSite` = cross-site sending rules.
- Configure session cookies with `server.servlet.session.cookie.*`; build others with `ResponseCookie`.
