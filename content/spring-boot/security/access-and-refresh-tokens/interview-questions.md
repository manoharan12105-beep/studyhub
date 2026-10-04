# Access Tokens, Refresh Tokens and Expiration — Interview Questions

## Beginner

### Q1. What is the difference between an access token and a refresh token?

<details>
<summary>Answer</summary>

The access token is short-lived and sent with every API request to authenticate it, usually a self-contained JWT validated statelessly. The refresh token is long-lived, sent only to the refresh endpoint to obtain new access tokens, usually an opaque random value stored (hashed) on the server so it can be revoked.

</details>

### Q2. Why do we need refresh tokens?

<details>
<summary>Answer</summary>

To keep access tokens short-lived (limiting damage if stolen and making revocation less critical) without forcing users to log in every few minutes. The refresh token, used rarely and over a single endpoint, renews access tokens and can be revoked server-side.

</details>

### Q3. How long should tokens live?

<details>
<summary>Answer</summary>

Typical choices: access tokens 5–15 minutes; refresh tokens days to a few weeks, rotated on each use, often with an absolute maximum session lifetime. Sensitive systems (banking) use shorter values and re-authentication for critical actions.

</details>

## Intermediate

### Q4. What is refresh token rotation and reuse detection?

<details>
<summary>Answer</summary>

Each time a refresh token is used, the server issues a new one and marks the old one used. If a used token is presented again, it means two parties hold copies (theft), so the server revokes the entire token family and forces re-authentication — limiting the attacker's window to one use.

</details>

### Q5. How do you implement logout with JWT?

<details>
<summary>Answer</summary>

Revoke the refresh token (and its family) on the server and have the client delete its tokens. The access token remains valid until expiry; if immediate invalidation is required, add its `jti` to a denylist (e.g. Redis with TTL = remaining lifetime) or increment a per-user token version checked on each request.

</details>

### Q6. Where should a browser application store tokens?

<details>
<summary>Answer</summary>

Avoid `localStorage` for long-lived tokens because any XSS can read it. A common pattern keeps the access token in memory and the refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to the refresh path, with CSRF protection on that endpoint. Alternatively a backend-for-frontend holds tokens server-side and the browser only has a session cookie.

</details>

## Advanced

### Q7. Why store a hash of the refresh token rather than the token itself?

<details>
<summary>Answer</summary>

If the database leaks, plain refresh tokens could be used immediately to impersonate users. Storing a hash (SHA-256 is sufficient because tokens are long random values) lets the server look tokens up by hash while making leaked rows useless.

</details>

### Q8. How do you force "log out from all devices" after a password change?

<details>
<summary>Answer</summary>

Revoke all refresh token families for the user, and invalidate outstanding access tokens by bumping a `tokenVersion` (or `passwordChangedAt`) stored with the user and embedded in tokens; the JWT filter rejects tokens with an older version (checked against a cache). Alternatively accept that access tokens expire within minutes.

</details>
