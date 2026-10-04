# Spring Security, JWT and Web Security

Revision points for Spring Security 7, JWT authentication, OAuth2 awareness, CORS, CSRF and cookies.

## Spring Security

- Authentication = who you are (401 if missing/invalid); authorization = what you may do (403 if denied).
- Adding `spring-boot-starter-security` secures **every** endpoint (form login + HTTP Basic, generated password logged).
- Configure with a `SecurityFilterChain` `@Bean` using the lambda DSL — `WebSecurityConfigurerAdapter` is gone.
- Works as servlet filters, before `DispatcherServlet`.
- Default protections: CSRF, security headers, session fixation protection, password encoding.

## Security Filter Chain

- `DelegatingFilterProxy` → `FilterChainProxy` → first matching `SecurityFilterChain` (ordered, by `securityMatcher`).
- Key filters in order: `CorsFilter`, `CsrfFilter`, `LogoutFilter`, `UsernamePasswordAuthenticationFilter` / `BearerTokenAuthenticationFilter`, …, `ExceptionTranslationFilter`, `AuthorizationFilter`.
- Custom JWT filter: `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`.
- `ExceptionTranslationFilter` turns `AuthenticationException` → entry point (401) and `AccessDeniedException` → 403.
- `authorizeHttpRequests` rules are evaluated in order; specific before general; end with `anyRequest()`.

## Authentication Architecture

- `AuthenticationManager` (`ProviderManager`) → `AuthenticationProvider`s (`DaoAuthenticationProvider`) → `UserDetailsService` + `PasswordEncoder`.
- Result: authenticated `Authentication` (principal, authorities) stored in `SecurityContextHolder` (thread-local).
- `UserDetails`: username, password hash, authorities, account flags.
- `DaoAuthenticationProvider` (Security 7 constructor takes the `UserDetailsService`) checks the password hash.
- Get current user: `@AuthenticationPrincipal`, `Authentication` parameter, or `SecurityContextHolder.getContext()`.

## Password Encoding and BCrypt

- Store hashes, never plain or reversibly encrypted passwords.
- BCrypt: salted, adaptive (cost factor; default strength 10), output `$2a$10$…` 60 chars, includes the salt.
- Same password → different hash each time; verify with `matches(raw, hash)`, never compare hashes.
- `DelegatingPasswordEncoder` (`{bcrypt}` prefix) enables algorithm migration; Argon2/scrypt are alternatives.
- BCrypt only uses the first 72 bytes.

## Authorization and Method Security

- URL rules: `requestMatchers("/admin/**").hasRole("ADMIN")`, `authenticated()`, `permitAll()`.
- `hasRole("ADMIN")` checks authority `ROLE_ADMIN`; `hasAuthority` checks the exact string.
- `@EnableMethodSecurity` → `@PreAuthorize("hasRole('ADMIN') or #id == authentication.name")`, `@PostAuthorize`, `@Secured`.
- Method security is proxy-based (self-invocation bypasses it).
- Ownership checks: query by owner (`findByIdAndOwnerId`) or `@PreAuthorize` with a bean.
- Deny by default; least privilege.

## Session vs Stateless Authentication

- Session: server stores the `SecurityContext` in `HttpSession`; browser sends `JSESSIONID` cookie; easy logout; needs sticky sessions or shared store (Spring Session + Redis); needs CSRF protection.
- Stateless: token (JWT) on each request; `SessionCreationPolicy.STATELESS`; scales horizontally; revocation harder.
- Session fixation protection changes the session id at login.
- Choose sessions for server-rendered/BFF web apps, tokens for APIs and mobile clients.

## JWT Fundamentals

- `header.payload.signature`, each Base64URL; payload is **encoded, not encrypted**.
- Claims: `sub`, `iss`, `aud`, `exp`, `iat`, `nbf`, `jti`, custom (`roles`).
- HS256 = shared secret (≥ 256 bits); RS256/ES256 = private key signs, public key verifies (good for many verifiers).
- Validate signature, algorithm (reject `none`), `exp`, `iss`, `aud`.
- Never put secrets or personal data in claims; keep tokens short-lived.

## JWT Authentication Flow

- Login: `POST /auth/login` → `AuthenticationManager` → issue signed JWT → return it.
- Requests: `Authorization: Bearer <jwt>` → `OncePerRequestFilter` validates → `UsernamePasswordAuthenticationToken` in `SecurityContext` → authorization rules apply.
- Invalid/expired → 401 via entry point; valid but insufficient role → 403.
- Config: stateless sessions, CSRF disabled for pure token APIs, login endpoint `permitAll`.
- Alternative: `oauth2ResourceServer().jwt()` validates tokens issued by an authorization server.

## Access and Refresh Tokens

- Access token: short-lived (5–15 min), sent on every request.
- Refresh token: long-lived, opaque, stored **hashed** server-side, sent only to `/auth/refresh` (HttpOnly Secure cookie).
- Rotation: each refresh issues a new refresh token and revokes the old one; reuse of a revoked token → revoke the whole family.
- Logout = revoke refresh tokens; access tokens expire naturally (or deny-list by `jti`).
- Storage in SPAs: memory for access token, HttpOnly cookie for refresh token; avoid `localStorage` (XSS).

## OAuth2 and OpenID Connect (Awareness)

- OAuth2 = delegated **authorization** (access tokens for APIs); OIDC adds **authentication** (ID token, user info).
- Roles: resource owner, client, authorization server, resource server.
- Authorization Code + PKCE for browser/mobile apps; Client Credentials for service-to-service.
- Spring: `-security-oauth2-client` (login with Google), `-security-oauth2-resource-server` (validate JWTs via `issuer-uri`), Spring Authorization Server (issue tokens).
- Don't build your own authorization server unless needed; use Keycloak/Auth0/Cognito.

## CORS

- Browser same-origin policy blocks reading cross-origin responses; CORS headers relax it. Servers and curl are unaffected.
- Origin = scheme + host + port.
- Non-simple requests (JSON, `Authorization` header, PUT/DELETE) trigger an `OPTIONS` preflight.
- Spring: `CorsConfigurationSource` bean + `http.cors(withDefaults())` so preflights pass before authentication; `@CrossOrigin` or `WebMvcConfigurer.addCorsMappings` for MVC-only setups.
- With credentials, `allowedOrigins("*")` is invalid — list origins or use `allowedOriginPatterns`.
- CORS is not a security control for the server — it protects users' browsers.

## CSRF

- Attacker site makes the victim's browser send a state-changing request with the victim's **cookies**.
- Spring enables CSRF by default for POST/PUT/PATCH/DELETE: synchronizer token checked by `CsrfFilter` → 403 if missing.
- SPA with cookie sessions: `csrf.spa()` (Security 6.4+) — `XSRF-TOKEN` cookie read by JS and echoed in `X-XSRF-TOKEN`.
- Stateless APIs with `Authorization` header tokens can disable CSRF (browsers don't add the header automatically).
- `SameSite=Lax/Strict` cookies are defence in depth, not a replacement.

## Cookie Security

- `HttpOnly` (no JS access → limits XSS token theft), `Secure` (HTTPS only), `SameSite` (`Strict`/`Lax`/`None`; `None` requires `Secure`), `Path`, `Domain`, `Max-Age`.
- Boot: `server.servlet.session.cookie.http-only/secure/same-site`.
- Build cookies with `ResponseCookie.from(...)` and set via `Set-Cookie` header.
- `__Host-` prefix: Secure, Path=/, no Domain.
- Cookies carry ambient authority → CSRF; headers do not.
