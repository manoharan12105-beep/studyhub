# HTTP Headers, Cookies and Sessions — Interview Questions

## Beginner

### Q1. What is a cookie and how does it work?

<details>
<summary>Answer</summary>

A small name/value pair that a server asks the browser to store with a `Set-Cookie` response header. The browser automatically sends it back in a `Cookie` header on later requests to the same site (subject to domain, path and attributes). It lets a stateless protocol recognise a returning client — e.g. a session ID.

</details>

### Q2. What is the difference between a cookie and a session?

**Style:** Comparison

<details>
<summary>Answer</summary>

A cookie is stored in the browser and sent with requests. A session is data stored on the server (memory, Redis, database) about a user. Typically the cookie carries only the session ID, and the server uses it to look up the session data.

</details>

## Intermediate

### Q3. Explain the HttpOnly, Secure and SameSite cookie attributes.

<details>
<summary>Answer</summary>

HttpOnly: JavaScript cannot read the cookie, which protects session IDs from XSS theft. Secure: the cookie is sent only over HTTPS, so it cannot leak on plain HTTP. SameSite: controls whether the cookie is sent on cross-site requests — `Strict` never, `Lax` only on top-level navigations with safe methods, `None` always (requires Secure); it mitigates CSRF.

</details>

### Q4. What is the difference between `Cache-Control: no-cache` and `no-store`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`no-cache` allows storing the response but requires revalidation with the server (ETag/Last-Modified → 304) before each reuse. `no-store` forbids storing it anywhere — for sensitive responses such as banking data.

</details>

### Q5. Is HTTP Basic authentication secure?

**Style:** Follow-up

<details>
<summary>Answer</summary>

On its own, no: the `Authorization: Basic` header contains `username:password` Base64-encoded, which anyone can decode, and it is sent on every request. Over HTTPS it is protected in transit, but credentials are still sent repeatedly and cannot be revoked like tokens; prefer session or token-based authentication.

</details>

## Advanced

### Q6. Your Spring Boot app runs on three instances behind a load balancer and users are randomly logged out. Why, and what are the fixes?

**Style:** Debugging

<details>
<summary>Answer</summary>

Sessions are stored in each instance's memory (default `HttpSession`), so when the load balancer sends a request to a different instance, that instance does not know the session ID and treats the user as anonymous. Fixes: store sessions centrally (Spring Session with Redis or JDBC), use stateless tokens (JWT), or — least preferred — sticky sessions on the load balancer, which break when an instance dies.

</details>
