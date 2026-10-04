# JWT Authentication Flow in Spring Security — Interview Questions

## Beginner

### Q1. Explain the JWT authentication flow in a Spring Boot application.

<details>
<summary>Answer</summary>

The client posts credentials to a login endpoint, which calls `AuthenticationManager.authenticate` (UserDetailsService + PasswordEncoder). On success the server signs a JWT with the username, roles and expiry and returns it. The client sends it as `Authorization: Bearer <token>` on later requests. A JWT filter in the security chain validates the signature and expiry, builds an authenticated `Authentication` with authorities and stores it in the `SecurityContext`. `AuthorizationFilter` then applies URL rules, the controller runs, and method security applies. Nothing is stored in a session.

</details>

### Q2. Where do you add the JWT filter and why?

<details>
<summary>Answer</summary>

With `http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)` — early in the authentication stage, so that the `SecurityContext` is populated before `AnonymousAuthenticationFilter`, `ExceptionTranslationFilter` and `AuthorizationFilter` run.

</details>

### Q3. Why is CSRF usually disabled for a JWT API?

<details>
<summary>Answer</summary>

CSRF exploits credentials the browser sends automatically (cookies). A bearer token in the `Authorization` header is attached explicitly by client code, so a malicious site cannot make the browser send it. If the JWT is stored in a cookie, CSRF protection is needed again.

</details>

## Intermediate

### Q4. What does the JWT filter put into the `SecurityContext`?

<details>
<summary>Answer</summary>

An authenticated `Authentication` — typically `UsernamePasswordAuthenticationToken.authenticated(principal, null, authorities)` where the principal is a `UserDetails` (or the username/claims) and the authorities come from the token's roles or a user lookup — set in a fresh `SecurityContext` via `SecurityContextHolder.setContext`.

</details>

### Q5. What should happen when the token is expired?

<details>
<summary>Answer</summary>

The request is unauthenticated, so the response is 401 (with `WWW-Authenticate: Bearer error="invalid_token"` if following OAuth2 conventions). The client then uses its refresh token to get a new access token, or asks the user to log in again. It should not be 403 or 500.

</details>

### Q6. Should the filter load the user from the database on every request?

<details>
<summary>Answer</summary>

It is a trade-off. Trusting the token's claims keeps requests fully stateless and fast, but a disabled user or changed roles remain effective until the token expires. Loading the user (or checking a cache/token version) adds freshness and revocation at the cost of a lookup per request. Short access-token lifetimes reduce the risk when trusting claims.

</details>

## Advanced

### Q7. How does Spring Security process a JWT request, filter by filter?

<details>
<summary>Answer</summary>

`DelegatingFilterProxy` → `FilterChainProxy` selects the API chain. `SecurityContextHolderFilter` starts with an empty context (stateless). `HeaderWriterFilter` and `CorsFilter` run; CSRF is disabled. The JWT filter (or `BearerTokenAuthenticationFilter`) extracts and validates the token and sets the `Authentication`. `AnonymousAuthenticationFilter` does nothing because a user is present. `ExceptionTranslationFilter` wraps the rest. `AuthorizationFilter` evaluates `authorizeHttpRequests` rules; if denied, it throws `AccessDeniedException`, translated to 403. Otherwise the `DispatcherServlet` invokes the controller; `@PreAuthorize` proxies may still deny. The context is cleared at the end.

</details>

### Q8. Why should a custom JWT filter not be a `@Component`?

<details>
<summary>Answer</summary>

Spring Boot registers every `Filter` bean as a servlet filter for all requests. The same filter would then run once in the servlet chain (outside Spring Security, possibly in a different order) and again inside the security chain. Create it inside the security configuration, or keep it a bean and disable its automatic registration with a `FilterRegistrationBean` (`setEnabled(false)`).

</details>

### Q9. When would you use the OAuth2 resource server instead of a custom JWT filter?

<details>
<summary>Answer</summary>

When tokens are issued by an authorization server (Keycloak, Auth0, Okta, Azure AD, Spring Authorization Server): `oauth2ResourceServer().jwt()` validates signatures via the issuer's JWKS, checks issuer/expiry, maps scopes to authorities and handles errors per RFC 6750 — less custom security code. A custom filter is common when the application itself issues simple tokens.

</details>
