# Session-Based vs Stateless Authentication — Interview Questions

## Beginner

### Q1. What is the difference between session-based and token-based authentication?

<details>
<summary>Answer</summary>

With sessions, the server stores the authenticated user in a server-side session and the client sends a session id cookie; the server looks the session up on each request. With tokens (e.g. JWT), the server issues a signed, self-contained token that the client sends on each request; the server validates the token without storing per-user state.

</details>

### Q2. Why is JWT called stateless?

<details>
<summary>Answer</summary>

Because everything needed to authenticate the request — the user's identity, claims and expiry — is inside the token, and the signature proves its integrity. The server only needs the verification key, not a session store, so any instance can authenticate any request.

</details>

### Q3. How do you make Spring Security stateless?

<details>
<summary>Answer</summary>

Configure `sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`, authenticate each request from a bearer token (a custom JWT filter or `oauth2ResourceServer().jwt()`), and typically disable CSRF if tokens are sent in the `Authorization` header rather than cookies.

</details>

## Intermediate

### Q4. How do you log out a user with JWT?

<details>
<summary>Answer</summary>

The client discards its tokens, and the server revokes the refresh token (delete or mark it in the database). The access token stays valid until it expires, so keep its lifetime short (5–15 minutes). For immediate revocation, maintain a denylist of token ids (`jti`) until their expiry, or a per-user token version checked on each request — which reintroduces server-side state.

</details>

### Q5. How do you scale session-based authentication across several instances?

<details>
<summary>Answer</summary>

Use sticky sessions at the load balancer (simple but fragile when instances restart) or externalise sessions with Spring Session backed by Redis or a database, so any instance can load any session.

</details>

### Q6. Which is more vulnerable to CSRF and which to XSS?

<details>
<summary>Answer</summary>

Cookie-based sessions are exposed to CSRF because browsers send cookies automatically; they are protected with CSRF tokens and SameSite cookies, while HttpOnly cookies cannot be read by injected scripts (limiting XSS theft). Bearer tokens in an `Authorization` header are not sent automatically (no CSRF), but if stored in `localStorage` any XSS can steal them.

</details>

## Advanced

### Q7. When would you choose sessions over JWT for a new project?

<details>
<summary>Answer</summary>

For server-rendered web applications or a BFF serving a single front end on the same site: sessions give immediate logout and revocation, keep tokens out of JavaScript, and Spring Security supports them fully (CSRF, fixation protection, Spring Session for scaling). JWT shines for APIs consumed by mobile apps, third parties or many services where stateless verification matters.

</details>

### Q8. What is session fixation and how does Spring Security prevent it?

<details>
<summary>Answer</summary>

An attacker makes the victim use a session id known to the attacker (e.g. via a crafted link) before login; if the id stays the same after authentication, the attacker can use the now-authenticated session. Spring Security changes the session id on successful authentication (`changeSessionId` strategy by default), invalidating the attacker's known id.

</details>
