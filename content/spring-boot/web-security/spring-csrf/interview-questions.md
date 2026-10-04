# CSRF and CSRF vs CORS — Interview Questions

## Beginner

### Q1. What is CSRF?

<details>
<summary>Answer</summary>

Cross-Site Request Forgery: a malicious site causes the victim's browser to send a state-changing request to another site where the victim is logged in. The browser automatically includes that site's cookies, so the request is processed as the victim.

</details>

### Q2. How does Spring Security prevent CSRF?

<details>
<summary>Answer</summary>

`CsrfFilter` requires a secret, per-session (or per-cookie) CSRF token on unsafe methods (POST, PUT, PATCH, DELETE). Legitimate pages include it in forms or headers; a foreign site cannot read it because of the same-origin policy, so forged requests are rejected with 403.

</details>

### Q3. What is the difference between CSRF and CORS?

<details>
<summary>Answer</summary>

CSRF is an attack that abuses automatically sent credentials to perform actions; it is prevented with tokens and SameSite cookies. CORS is a browser mechanism that controls which origins may read cross-origin responses. CORS configuration does not prevent CSRF, and CSRF tokens do not configure cross-origin access.

</details>

## Intermediate

### Q4. Why is it safe to disable CSRF for a stateless JWT API?

<details>
<summary>Answer</summary>

CSRF works because browsers attach cookies automatically. If the API authenticates only via a token in the `Authorization` header that client code adds explicitly, a cross-site page cannot make the browser include it, so forged requests are unauthenticated. If the token is kept in a cookie, CSRF protection is needed again.

</details>

### Q5. Why do all my POST requests return 403 after adding Spring Security?

<details>
<summary>Answer</summary>

CSRF protection is enabled by default and the requests carry no CSRF token. Either send the token (Thymeleaf forms add it; SPAs read the `XSRF-TOKEN` cookie and send `X-XSRF-TOKEN`), or — for a stateless header-token API only — disable CSRF for that chain.

</details>

### Q6. How do SameSite cookies help against CSRF?

<details>
<summary>Answer</summary>

With `SameSite=Strict`, the browser never sends the cookie on cross-site requests; with `Lax` (the modern default), it is sent only on top-level GET navigations, not on cross-site POSTs or background requests. This blocks most CSRF attacks, but it is defence in depth: same-site subdomains and older browsers can still be problems, so tokens remain recommended for cookie-authenticated apps.

</details>

## Advanced

### Q7. Why must GET requests never change state, from a CSRF perspective?

<details>
<summary>Answer</summary>

CSRF protection is applied only to unsafe methods; GET requests can be triggered trivially by image tags or links, and SameSite=Lax still sends cookies on top-level GET navigations. A state-changing GET endpoint therefore bypasses both defences.

</details>

### Q8. How do you handle CSRF in a React/Angular app that uses session cookies with Spring Security?

<details>
<summary>Answer</summary>

Configure a cookie-based token repository readable by JavaScript (`csrf.spa()` in Spring Security 6.4+, or `CookieCsrfTokenRepository.withHttpOnlyFalse()` with an appropriate request handler). The SPA reads `XSRF-TOKEN` and sends it in the `X-XSRF-TOKEN` header on unsafe requests (Angular/Axios do it automatically). Ensure the token is loaded (e.g. by a GET) before the first POST.

</details>
