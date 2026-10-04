# OAuth2 and OpenID Connect Awareness

**Module:** Spring Security · **Interview priority:** Awareness

> [!NOTE]
> **Awareness topic.** Junior roles rarely implement an authorization server, but interviewers expect you to explain OAuth2's roles and flows and how Spring Boot plugs into them. Learn [JWT Authentication Flow](../jwt-authentication-flow/content.md) first.

## Definition

- **OAuth 2.0** is an **authorization framework** (RFC 6749): it lets an application obtain **limited access** (scopes) to a resource on behalf of a user — or itself — **without handling the user's password**, by getting an **access token** from an **authorization server**.
- **OpenID Connect (OIDC)** is an **authentication layer on top of OAuth2**: it adds an **ID token** (a JWT about the user's login) and a standard user-info endpoint. "Login with Google" is OIDC.

## Why It Matters

- Enterprise and cloud systems delegate login to identity providers (Keycloak, Okta, Auth0, Azure AD/Entra ID, Google) instead of storing passwords themselves.
- Questions: "OAuth2 vs JWT?", "What is the authorization code flow?", "Resource server vs client in Spring?".

## Roles

| Role | Meaning | Example |
|------|---------|---------|
| Resource owner | The user who owns the data | Asha |
| Client | The application wanting access | Your SPA, mobile app or backend |
| Authorization server | Authenticates the user and issues tokens | Keycloak, Okta, Spring Authorization Server |
| Resource server | The API that accepts access tokens | Your Spring Boot API |

## Grant Types (Flows)

| Flow | Use | Notes |
|------|-----|-------|
| **Authorization Code + PKCE** | Users logging in via browser/mobile apps | The standard; the code is exchanged for tokens server-to-server; PKCE protects public clients |
| **Client Credentials** | Service-to-service, no user | Client authenticates with its own secret/certificate |
| Refresh Token | Renew access tokens | |
| Device Code | TVs/CLIs without a browser | |
| ~~Implicit~~, ~~Password~~ | Deprecated | Removed in OAuth 2.1 drafts |

Authorization code flow (simplified):

```text
1. Browser → client: "Log in"
2. Client redirects to authorization server /authorize?response_type=code&client_id=…&scope=openid profile&code_challenge=…
3. User logs in at the authorization server (password, MFA) and consents
4. Redirect back to client with ?code=XYZ
5. Client → authorization server /token (code + code_verifier [+ client secret]) → access token, ID token, refresh token
6. Client → resource server (your API) with Authorization: Bearer <access token>
7. Resource server validates the JWT signature with the issuer's public keys (JWKS), issuer, audience, expiry, scopes
```

## OAuth2 in Spring Boot

| Need | Starter (Boot 4 name / Boot 3 name) | Configuration |
|------|-------------------------------------|---------------|
| Your API accepts tokens from an identity provider | `spring-boot-starter-security-oauth2-resource-server` / `spring-boot-starter-oauth2-resource-server` | `spring.security.oauth2.resourceserver.jwt.issuer-uri` |
| Your web app logs users in via an identity provider | `spring-boot-starter-security-oauth2-client` / `spring-boot-starter-oauth2-client` | `spring.security.oauth2.client.registration.*` + `http.oauth2Login()` |
| You run your own authorization server | `spring-boot-starter-security-oauth2-authorization-server` / `spring-boot-starter-oauth2-authorization-server` (Spring Authorization Server) | Advanced |

Resource server configuration:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://login.example.com/realms/shop     # discovers JWKS, validates iss
```

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class ResourceServerConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/orders/**").hasAuthority("SCOPE_orders.read")  // scopes → SCOPE_ authorities
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))     // BearerTokenAuthenticationFilter
                .build();
    }
}
```

Spring validates the token signature with keys fetched from the issuer's JWKS endpoint, checks issuer and expiry, and maps the `scope`/`scp` claim to `SCOPE_*` authorities (customise with a `JwtAuthenticationConverter` to map roles).

## Comparison: OAuth2 vs JWT vs OIDC

| | OAuth2 | JWT | OIDC |
|--|--------|-----|------|
| What it is | Authorization framework (flows, roles) | Token **format** | Authentication protocol on OAuth2 |
| Answers | How does a client get delegated access? | How are claims packaged and signed? | Who logged in? |
| Tokens | Access token (any format), refresh token | — | ID token (always JWT) + OAuth2 tokens |
| Relation | Access tokens are often JWTs | Used by OAuth2/OIDC and custom auth | Built on OAuth2 |

## Common Mistakes

- Using the **ID token** to call APIs (it is meant for the client; APIs take access tokens).
- Not validating `aud` — accepting tokens issued for other APIs.
- Using the deprecated implicit or password grants.
- Storing client secrets in SPAs or mobile apps (public clients must use PKCE without secrets).

## Common Interview Traps

- **"OAuth2 is an authentication protocol."** It is for authorization (delegated access); OIDC adds authentication.
- **"OAuth2 and JWT are alternatives."** JWT is a token format often used inside OAuth2.
- **"The resource server must call the authorization server on every request."** With JWT access tokens it validates locally using cached public keys (opaque tokens need introspection).

## Key Takeaways

- OAuth2 roles: resource owner, client, authorization server, resource server; main flows: authorization code + PKCE, client credentials.
- OIDC = OAuth2 + ID token for login.
- Spring Boot: resource server (`oauth2ResourceServer().jwt()` + `issuer-uri`) for APIs, `oauth2Login()` for web login.
