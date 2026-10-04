# Security Essentials

One line per topic for Spring Security, JWT, OAuth2, CORS, CSRF and cookies.

## Spring Security

- **Basics** — authentication (who, 401) vs authorization (what, 403); starter secures everything; configure a `SecurityFilterChain` bean.
- **Filter chain** — `DelegatingFilterProxy` → `FilterChainProxy` → `SecurityFilterChain`; CORS → CSRF → authentication filters → `ExceptionTranslationFilter` → `AuthorizationFilter`.
- **Authentication architecture** — `AuthenticationManager` → `DaoAuthenticationProvider` → `UserDetailsService` + `PasswordEncoder` → `SecurityContextHolder`.
- **BCrypt** — salted, slow, one-way; `encode` differs each time, verify with `matches`; `DelegatingPasswordEncoder` for migration.
- **Authorization** — `requestMatchers(...).hasRole(...)`; `@EnableMethodSecurity` + `@PreAuthorize`; `ROLE_` prefix; ownership checks.
- **Session vs stateless** — session: server state, cookie, CSRF needed; stateless: token per request, scales, harder revocation.

## Tokens

- **JWT** — `header.payload.signature`, Base64URL, signed not encrypted; validate signature, alg, `exp`, `iss`, `aud`.
- **JWT flow** — login → `AuthenticationManager` → issue token; `OncePerRequestFilter` validates `Bearer` → sets context; stateless; 401 invalid, 403 forbidden.
- **Access vs refresh** — access short-lived on every call; refresh long-lived, hashed server-side, HttpOnly cookie, rotated with reuse detection.
- **OAuth2 / OIDC** — delegated authorization vs login; Authorization Code + PKCE, Client Credentials; resource server validates JWTs via `issuer-uri`.

## Browser Security

- **CORS** — browser read permission for other origins; preflight `OPTIONS`; `http.cors()` + `CorsConfigurationSource`; no `*` with credentials.
- **CSRF** — forged requests riding on cookies; Spring token check by default; `csrf.spa()` for SPAs; disable only for header-token APIs.
- **Cookies** — `HttpOnly`, `Secure`, `SameSite` (`None` needs `Secure`), `ResponseCookie`, `__Host-` prefix.
