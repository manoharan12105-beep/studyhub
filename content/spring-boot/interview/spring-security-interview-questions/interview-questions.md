# Spring Security and JWT Interview Questions — Interview Questions

## Beginner

### Q1. How did you secure the APIs in your Spring Boot project?

**Style:** Scenario

<details>
<summary>Answer</summary>

A model answer: "A `SecurityFilterChain` with stateless sessions and CSRF disabled for the API, a login endpoint that authenticates with `AuthenticationManager` (database `UserDetailsService`, BCrypt) and returns a 15-minute JWT plus a rotating refresh token, a JWT filter before `UsernamePasswordAuthenticationFilter` that validates the token and sets the `SecurityContext`, URL rules by role, `@PreAuthorize` for ownership checks, CORS restricted to our front-end origin, and 401/403 returned as ProblemDetail."

</details>

### Q2. What is stored in a JWT, and what should never be?

**Style:** Direct

<details>
<summary>Answer</summary>

Identity and authorization claims needed per request: `sub`, roles/scopes, `iat`, `exp`, optionally `iss`, `aud`, `jti`. Never passwords, secrets, or sensitive personal data — the payload is only Base64url-encoded and readable by anyone with the token.

</details>

### Q3. Why are passwords hashed with BCrypt and not encrypted?

**Style:** Why

<details>
<summary>Answer</summary>

The server only needs to verify passwords, so a one-way hash suffices and avoids a decryption key that could expose all passwords. BCrypt adds a random salt per password and an adjustable cost, making leaked hashes slow to brute-force.

</details>

### Q4. What do `permitAll()`, `authenticated()` and `hasRole()` do?

**Style:** Direct

<details>
<summary>Answer</summary>

URL authorization rules in `authorizeHttpRequests`: `permitAll()` allows everyone (including anonymous), `authenticated()` requires any authenticated user, `hasRole("ADMIN")` requires the authority `ROLE_ADMIN`. Rules are evaluated top to bottom.

</details>

## Intermediate

### Q5. How does Spring Security process a JWT request?

**Style:** How

<details>
<summary>Answer</summary>

The request enters `FilterChainProxy`'s matching chain; the JWT filter (or `BearerTokenAuthenticationFilter`) reads `Authorization: Bearer …`, validates signature and expiry, builds an authenticated `Authentication` with authorities and stores it in the thread-local `SecurityContext`; `ExceptionTranslationFilter` stands ready to convert failures to 401/403; `AuthorizationFilter` checks URL rules; the controller runs (method security may check again); the context is cleared after the response.

</details>

### Q6. Why do we disable CSRF for a JWT API but not for a session-based app?

**Style:** Why

<details>
<summary>Answer</summary>

CSRF relies on the browser automatically sending credentials (cookies). A bearer token in the `Authorization` header is never sent automatically, so a forged cross-site request carries no credentials. Session cookies are sent automatically, so session-based apps need CSRF tokens. If the JWT is stored in a cookie, CSRF protection is needed again.

</details>

### Q7. How do refresh tokens work, and why not just use long-lived access tokens?

**Style:** Why

<details>
<summary>Answer</summary>

The client gets a short-lived access token and a long-lived refresh token stored server-side (hashed) and usually in an HttpOnly cookie. When the access token expires, the client exchanges the refresh token for new tokens (rotating it). Long-lived access tokens can't be revoked before expiry and are dangerous if stolen; short ones limit exposure while refresh tokens keep users logged in and remain revocable.

</details>

### Q8. What is the difference between `hasRole` and `hasAuthority`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`hasRole("ADMIN")` checks for the authority `ROLE_ADMIN` (prefix added automatically); `hasAuthority("ADMIN")` checks the exact string. Mixing them up is a common source of unexpected 403s.

</details>

### Q9. Where would you implement "a user can only see their own orders"?

**Style:** Scenario

<details>
<summary>Answer</summary>

In the service/data layer using the authenticated user's id from the `SecurityContext` — e.g. `findByIdAndCustomerId(id, currentUserId)` returning 404 when not owned — or with `@PreAuthorize("@orderSecurity.isOwner(#id, authentication)")`. URL role rules cannot express ownership.

</details>

### Q10. What is the difference between `AuthenticationEntryPoint` and `AccessDeniedHandler`?

**Style:** Comparison

<details>
<summary>Answer</summary>

The entry point handles unauthenticated access (start authentication: 401 or redirect to login); the access denied handler handles authenticated users lacking permission (403). Both are invoked by `ExceptionTranslationFilter`, and both can be customised to return ProblemDetail bodies.

</details>

## Advanced

### Q11. JWT is stateless — how would you still support logout and account suspension?

**Style:** Scenario

<details>
<summary>Answer</summary>

Keep access tokens short (5–15 min), revoke refresh tokens server-side on logout/suspension, and for immediate effect check a denylist of `jti`s (Redis with TTL) or a per-user token version/`tokensValidAfter` timestamp on each request (cached). This reintroduces some state by design.

</details>

### Q12. What attacks should a JWT implementation defend against?

**Style:** Direct

<details>
<summary>Answer</summary>

Forged tokens with `alg: none` or algorithm confusion (pin the algorithm and key), brute-forced weak HMAC secrets (long random secrets), token theft via XSS (avoid `localStorage` for long-lived tokens, CSP), replay of stolen refresh tokens (rotation + reuse detection), tokens for other services (validate `iss`/`aud`), and long exposure (short expiry).

</details>

### Q13. Your login endpoint returns 401 for valid credentials after adding a custom `UserDetailsService`. How do you debug?

**Style:** Debugging

<details>
<summary>Answer</summary>

Enable `org.springframework.security` DEBUG/TRACE logs; check whether `loadUserByUsername` finds the user (case-sensitive email?), whether the stored password is a hash matching the configured `PasswordEncoder` (e.g. `{bcrypt}` prefix expected by a `DelegatingPasswordEncoder` but missing, or a plain-text password in the database), and account flags (`enabled`, `locked`). Ensure the `AuthenticationManager` uses that service and encoder.

</details>

### Q14. How do you propagate the authenticated user to `@Async` tasks?

**Style:** How

<details>
<summary>Answer</summary>

Wrap the executor with `DelegatingSecurityContextAsyncTaskExecutor` (or a `TaskDecorator` that copies the `SecurityContext`) so each task runs with a copy of the caller's context, cleared afterwards; or pass the user id explicitly as a parameter, which is often clearer.

</details>

### Q15. When would you use Spring Security's OAuth2 resource server instead of your own JWT filter?

**Style:** Comparison

<details>
<summary>Answer</summary>

When tokens come from an identity provider (Keycloak, Okta, Cognito, Azure AD) or you want standards-compliant validation: JWKS key rotation, issuer/audience checks, RFC 6750 error responses and scope mapping come for free. A custom filter suits simple self-issued tokens but means more security code to maintain.

</details>
