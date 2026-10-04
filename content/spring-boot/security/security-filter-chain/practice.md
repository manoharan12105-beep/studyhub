# SecurityFilterChain, Filters and SecurityContext — Practice

### P1. Which filter returns 401?

**Difficulty:** Easy · **Type:** MCQ

Which component converts an `AccessDeniedException` for an anonymous request into a 401 response?

- A) `CsrfFilter`
- B) `ExceptionTranslationFilter` (via the `AuthenticationEntryPoint`)
- C) `DispatcherServlet`
- D) `@RestControllerAdvice`

<details>
<summary>Answer</summary>

**Answer:** B) `ExceptionTranslationFilter` (via the `AuthenticationEntryPoint`)

</details>

### P2. Wrong position

**Difficulty:** Medium · **Type:** Debugging

A JWT filter is added with `http.addFilterAfter(jwtFilter, AuthorizationFilter.class)`. Every request with a valid token gets 401. Why?

<details>
<summary>Answer</summary>

`AuthorizationFilter` runs before the JWT filter, sees no authentication (anonymous) and denies the request before the token is ever read. Add the filter before authorization — conventionally `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`.

</details>

### P3. Two chains

**Difficulty:** Medium · **Type:** Design

Describe the security configuration for an app with a stateless JSON API under `/api/**` (JWT) and a server-rendered admin UI (form login).

<details>
<summary>Answer</summary>

Two `SecurityFilterChain` beans. `@Order(1)`: `securityMatcher("/api/**")`, CSRF disabled, `STATELESS` sessions, JWT filter before `UsernamePasswordAuthenticationFilter`, 401 entry point, URL rules. `@Order(2)`: everything else, form login, sessions, CSRF enabled, `/admin/**` requiring `ROLE_ADMIN`.

</details>
