# Spring Security: Authentication and Authorization

**Module:** Spring Security · **Interview priority:** Core

## Definition

**Spring Security** is the Spring framework for securing applications: it **authenticates** users (who are you?), **authorizes** requests and method calls (are you allowed?), and protects against common attacks (CSRF, session fixation, clickjacking, missing security headers). For web applications it is implemented as a **chain of servlet filters** that runs before the `DispatcherServlet`; for methods it uses **AOP proxies** (`@PreAuthorize`).

## Why It Matters

- Every real backend needs authentication and authorization; Spring Security is the standard for Spring Boot.
- "Explain authentication vs authorization" and "How does Spring Security process a request?" are among the most frequent backend interview questions.
- Its defaults (everything secured, generated password, CSRF on) surprise newcomers; understanding them avoids "why is everything 401/403?".

## What Is Spring Security?

Adding `spring-boot-starter-security` changes behaviour immediately (Spring Boot defaults):

- **Every endpoint requires authentication.**
- A default user `user` is created with a **random password printed at startup** ("Using generated security password: …") — for development only.
- **Form login** and **HTTP Basic** are enabled; a default login page is generated.
- **CSRF protection** is on for state-changing requests (POST/PUT/PATCH/DELETE).
- Security headers are added (`X-Content-Type-Options`, `X-Frame-Options`, cache control, HSTS on HTTPS).

You customise it by declaring beans — primarily a **`SecurityFilterChain`** (Spring Security 6+/7 style; the old `WebSecurityConfigurerAdapter` was removed in 6.0):

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**", "/actuator/health").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## Authentication

**Authentication** verifies identity: the user proves who they are with credentials (username + password, a token, a certificate, an OTP). The outcome is an **`Authentication`** object stored in the **`SecurityContext`** for the rest of the request.

Mechanisms Spring Security supports: form login (sessions), HTTP Basic, bearer tokens (JWT, opaque), OAuth2/OpenID Connect login, SAML, X.509, remember-me, one-time tokens, passkeys (WebAuthn).

Failure → **401 Unauthorized**.

## Authorization

**Authorization** decides whether an **authenticated** (or anonymous) principal may perform an action: access a URL, call a method, read a specific object. Inputs are the `Authentication`'s **authorities** (roles/permissions) and, for object-level checks, the resource itself.

Failure → **403 Forbidden** (for an authenticated user) or **401** (for an anonymous one, who should log in first).

## Authentication vs Authorization

| Aspect | Authentication | Authorization |
|--------|----------------|---------------|
| Question | Who are you? | What are you allowed to do? |
| Happens | First | After authentication |
| Input | Credentials (password, token) | Authorities, roles, resource ownership |
| Spring components | `AuthenticationManager`, `AuthenticationProvider`, `UserDetailsService`, `PasswordEncoder` | `AuthorizationFilter`, `AuthorizationManager`, `@PreAuthorize` |
| Failure status | 401 Unauthorized | 403 Forbidden |
| Example | Login with email + password | Only ADMIN can delete users; a user may read only their own orders |

## How It Works

```text
HTTP request
  └─► DelegatingFilterProxy ("springSecurityFilterChain", a servlet filter)
        └─► FilterChainProxy → first SecurityFilterChain whose matcher fits the request
              ├─ SecurityContextHolderFilter    load context (from session, if stateful)
              ├─ CsrfFilter                     check CSRF token on unsafe methods
              ├─ authentication filters         form login / Basic / your JWT filter → Authentication
              ├─ AnonymousAuthenticationFilter  no Authentication? → anonymous token
              ├─ ExceptionTranslationFilter     AuthenticationException → 401 / AccessDeniedException → 403
              └─ AuthorizationFilter            URL rules: permitAll, hasRole, authenticated …
                    └─► DispatcherServlet → controller (→ @PreAuthorize method checks via AOP)
```

Details: [SecurityFilterChain, Filters and SecurityContext](../security-filter-chain/content.md), [Authentication Architecture](../authentication-architecture/content.md), [Roles, Authorities and Method Security](../authorization-and-method-security/content.md).

## Common Mistakes

- Leaving the generated default user in a deployed application.
- Disabling CSRF in a cookie/session-based app "because POST returned 403".
- `permitAll()` rules placed after `anyRequest()` (rules are evaluated in order; `anyRequest()` must be last).
- Using `hasRole("ROLE_ADMIN")` (the prefix is added automatically).
- Securing only the UI and leaving APIs open, or relying on hiding buttons instead of server-side authorization.

## Common Interview Traps

- **"Authentication and authorization are the same."** Identity vs permission; 401 vs 403.
- **"Spring Security runs in the controller."** Web security runs in servlet filters before Spring MVC; method security uses proxies.
- **"401 means forbidden."** 401 = not authenticated; 403 = authenticated but not allowed.

## Key Takeaways

- Spring Security = filter chain for web security + AOP for method security + attack protection.
- Authentication (who) produces an `Authentication` in the `SecurityContext`; authorization (what) checks it.
- Configure with `SecurityFilterChain` beans; Boot's defaults secure everything with a generated user.
