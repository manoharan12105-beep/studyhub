# OAuth2 and OpenID Connect Awareness — Interview Questions

## Beginner

### Q1. What is OAuth2?

<details>
<summary>Answer</summary>

An authorization framework that lets a client application obtain limited, delegated access to resources on behalf of a user (or itself) via access tokens issued by an authorization server — without the client handling the user's password.

</details>

### Q2. What are the four roles in OAuth2?

<details>
<summary>Answer</summary>

Resource owner (the user), client (the application requesting access), authorization server (authenticates the user and issues tokens) and resource server (the API that accepts access tokens).

</details>

### Q3. What is the difference between OAuth2 and OpenID Connect?

<details>
<summary>Answer</summary>

OAuth2 handles authorization — obtaining access tokens for APIs. OpenID Connect builds on it to handle authentication: it adds an ID token (a JWT describing the authenticated user and login event), standard scopes (`openid`, `profile`, `email`) and a user-info endpoint.

</details>

## Intermediate

### Q4. Explain the authorization code flow with PKCE.

<details>
<summary>Answer</summary>

The client generates a random code verifier and sends its hash (code challenge) while redirecting the user to the authorization server. After login and consent, the server redirects back with a one-time authorization code. The client exchanges the code plus the original verifier at the token endpoint; the server checks that the verifier matches the challenge and returns tokens. PKCE ensures that an intercepted code is useless without the verifier, which is why public clients (SPAs, mobile apps) use it.

</details>

### Q5. Which flow is used for service-to-service calls?

<details>
<summary>Answer</summary>

Client credentials: the calling service authenticates with its own credentials (secret, private-key JWT or mTLS) at the token endpoint and receives an access token with its scopes; no user is involved.

</details>

### Q6. How do you protect a Spring Boot API with tokens from Keycloak?

<details>
<summary>Answer</summary>

Add the OAuth2 resource server starter, set `spring.security.oauth2.resourceserver.jwt.issuer-uri` to the realm URL, and configure `http.oauth2ResourceServer(o -> o.jwt(...))` with authorization rules. Spring fetches the JWKS, validates signatures, issuer and expiry, and maps scopes to `SCOPE_` authorities; a custom `JwtAuthenticationConverter` maps Keycloak realm/client roles to `ROLE_` authorities.

</details>

## Advanced

### Q7. Why shouldn't an API accept ID tokens?

<details>
<summary>Answer</summary>

An ID token is issued for the client application (its `aud` is the client id) to prove the user's login; it is not meant to authorize API calls and may lack scopes. APIs should accept access tokens whose audience is the API, validated for issuer, audience, expiry and scopes.

</details>

### Q8. Opaque tokens vs JWT access tokens in a resource server?

<details>
<summary>Answer</summary>

JWT access tokens are validated locally with cached public keys — fast and scalable, but revocation applies only at expiry. Opaque tokens require calling the authorization server's introspection endpoint (RFC 7662) on each request (usually cached) — immediate revocation, more latency and coupling. Spring supports both (`oauth2ResourceServer().jwt()` vs `.opaqueToken()`).

</details>
