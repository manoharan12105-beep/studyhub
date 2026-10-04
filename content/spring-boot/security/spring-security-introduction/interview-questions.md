# Spring Security: Authentication and Authorization — Interview Questions

## Beginner

### Q1. What is the difference between authentication and authorization?

<details>
<summary>Answer</summary>

Authentication establishes who the user is by verifying credentials; authorization decides what that user may do. Authentication comes first and failure gives 401 Unauthorized; authorization uses the authenticated user's authorities (and the resource) and failure gives 403 Forbidden.

</details>

### Q2. What happens when you add `spring-boot-starter-security` without any configuration?

<details>
<summary>Answer</summary>

All endpoints require authentication; Boot creates an in-memory user named `user` with a random password logged at startup; form login and HTTP Basic are enabled with a generated login page; CSRF protection is on for unsafe methods; and security headers are added to responses.

</details>

### Q3. How do you configure Spring Security in Spring Boot 3/4?

<details>
<summary>Answer</summary>

Declare one or more `SecurityFilterChain` beans built from `HttpSecurity` with the lambda DSL (`authorizeHttpRequests`, `formLogin`, `httpBasic`, `csrf`, `sessionManagement`, `addFilterBefore`…), plus beans such as `PasswordEncoder`, `UserDetailsService` and `AuthenticationManager`. `WebSecurityConfigurerAdapter` was removed in Spring Security 6.

</details>

## Intermediate

### Q4. Why does Spring Security work as servlet filters rather than inside controllers?

<details>
<summary>Answer</summary>

Security must run before any application code and for every request, including static resources and requests that never reach a controller. Filters see the raw request first, can reject it early, populate the `SecurityContext` for downstream code, and handle concerns like CSRF, CORS, sessions and headers uniformly, independent of the web framework.

</details>

### Q5. When does Spring Security return 401 and when 403?

<details>
<summary>Answer</summary>

`ExceptionTranslationFilter` turns an `AuthenticationException` — or an `AccessDeniedException` for an anonymous user — into the `AuthenticationEntryPoint` response, typically 401 (or a redirect to the login page). An `AccessDeniedException` for an authenticated user goes to the `AccessDeniedHandler`, typically 403.

</details>

### Q6. Why is the order of `requestMatchers` rules important?

<details>
<summary>Answer</summary>

`authorizeHttpRequests` rules are evaluated top to bottom and the first match wins. A broad rule like `anyRequest().authenticated()` must be last; placing `/api/**` `authenticated()` before `/api/public/**` `permitAll()` makes the public rule unreachable. Spring Security rejects configurations where `anyRequest()` is not the last rule.

</details>

## Advanced

### Q7. How would you explain Spring Security's architecture in a minute?

<details>
<summary>Answer</summary>

A `DelegatingFilterProxy` registered with the servlet container delegates to the `FilterChainProxy` bean, which picks the first matching `SecurityFilterChain`. Its ordered filters load or create the `SecurityContext`, enforce CSRF, authenticate requests (form, Basic, bearer token) by delegating to an `AuthenticationManager` (`ProviderManager` → `AuthenticationProvider`s using `UserDetailsService` and `PasswordEncoder`), translate security exceptions into 401/403, and finally the `AuthorizationFilter` applies URL rules. Method-level rules (`@PreAuthorize`) are enforced later by AOP proxies. The authenticated principal lives in a thread-local `SecurityContextHolder` for the request.

</details>

### Q8. Can you have different security rules for `/api/**` and the web UI in one application?

<details>
<summary>Answer</summary>

Yes, with multiple `SecurityFilterChain` beans, each with a `securityMatcher` (e.g. `/api/**` stateless with JWT and CSRF disabled, everything else with form login, sessions and CSRF). `FilterChainProxy` uses the first chain whose matcher matches, so order them with `@Order` (most specific first).

</details>
