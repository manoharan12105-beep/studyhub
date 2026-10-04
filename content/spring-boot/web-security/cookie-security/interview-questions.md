# Cookies, Sessions and Cookie Security — Interview Questions

## Beginner

### Q1. What do the `Secure`, `HttpOnly` and `SameSite` cookie attributes do?

<details>
<summary>Answer</summary>

`Secure` sends the cookie only over HTTPS. `HttpOnly` hides it from JavaScript (`document.cookie`), so XSS cannot steal it. `SameSite` controls whether it is sent on cross-site requests: `Strict` never, `Lax` only on top-level GET navigations, `None` always (requires `Secure`).

</details>

### Q2. What is `JSESSIONID`?

<details>
<summary>Answer</summary>

The default cookie name holding the servlet container's HTTP session id. The server uses it to find the user's session (and, with Spring Security form login, the stored `SecurityContext`). Whoever holds it is logged in as that user until the session expires.

</details>

## Intermediate

### Q3. How do you configure session cookie security in Spring Boot?

<details>
<summary>Answer</summary>

With `server.servlet.session.cookie.http-only=true`, `server.servlet.session.cookie.secure=true`, `server.servlet.session.cookie.same-site=lax|strict`, and `server.servlet.session.timeout`. Custom cookies can be created with Spring's `ResponseCookie` builder, which supports all attributes including SameSite.

</details>

### Q4. Where would you store a refresh token in a browser application, and with which attributes?

<details>
<summary>Answer</summary>

In an `HttpOnly; Secure; SameSite=Strict` cookie with `Path=/api/auth/refresh`, so JavaScript cannot read it, it travels only over HTTPS, it is not sent cross-site, and it reaches only the refresh endpoint. Protect that endpoint against CSRF (SameSite plus a CSRF token or origin check).

</details>

### Q5. What is the difference between "same-site" and "same-origin"?

<details>
<summary>Answer</summary>

Same-origin requires identical scheme, host and port. Same-site compares the registrable domain (eTLD+1, and scheme in modern browsers): `app.example.com` and `api.example.com` are same-site but cross-origin. SameSite cookies use the site concept; CORS and the same-origin policy use origins.

</details>

## Advanced

### Q6. A cookie with `SameSite=None` is ignored by the browser. Why?

<details>
<summary>Answer</summary>

Modern browsers require `SameSite=None` cookies to also be `Secure`; without it, the cookie is rejected. Also check that third-party cookie restrictions are not blocking it in cross-site contexts.

</details>

### Q7. How would you invalidate all sessions of a user after a password change?

<details>
<summary>Answer</summary>

With Spring Session (Redis/JDBC), find sessions by principal name (`FindByIndexNameSessionRepository`) and delete them; with Spring Security's `SessionRegistry` (concurrent session control), expire the user's `SessionInformation`. Then rotate any refresh tokens. In-memory container sessions on multiple instances cannot be reliably invalidated centrally — another reason for a shared session store.

</details>
